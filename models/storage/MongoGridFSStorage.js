const { MongoClient, GridFSBucket } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const IFirmwareStorage = require("../interfaces/IFirmwareStorage");

/**
 * MongoDB implementation of firmware storage using GridFS for files
 * and regular collections for metadata and users
 */
class MongoDBStorage extends IFirmwareStorage {
	constructor() {
		super();
		this.client = null;
		this.db = null;
		this.gridFSBucket = null;
		this.firmwaresCollection = null;
		this.usersCollection = null;
		this.configCollection = null;
		this.supportsTransactions = false;

		// Configuration from environment variables
		this.mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
		this.dbName = process.env.MONGODB_DB || "firmware_manager";
		this.bucketName = process.env.GRIDFS_BUCKET || "firmwares";
		this.chunkSize = parseInt(process.env.GRIDFS_CHUNK_SIZE || "1048576", 10);
	}

	/**
	 * Initialize MongoDB connection and collections
	 */
	async initialize() {
		try {
			this.client = new MongoClient(this.mongoUri, {
				useUnifiedTopology: true,
			});

			await this.client.connect();
			this.db = this.client.db(this.dbName);

			// Check if transactions are supported (replica set or mongos)
			try {
				const result = await this.db.admin().hello();
				this.supportsTransactions = result.ismaster && (result.setName || result.msg === "isdbgrid");
			} catch (error) {
				this.supportsTransactions = false;
			}

			console.log("Transaction support:", this.supportsTransactions ? "enabled" : "disabled (standalone MongoDB)");

			// Initialize GridFS bucket for file storage
			this.gridFSBucket = new GridFSBucket(this.db, {
				bucketName: this.bucketName,
				chunkSizeBytes: this.chunkSize,
			});

			// Initialize collections
			this.firmwaresCollection = this.db.collection("firmwares");
			this.usersCollection = this.db.collection("users");
			this.configCollection = this.db.collection("config");

			// Create indexes for better performance
			await this.createIndexes();

			console.log("MongoDB storage initialized successfully");
		} catch (error) {
			console.error("Failed to initialize MongoDB storage:", error);
			throw error;
		}
	}

	/**
	 * Create database indexes for optimal performance
	 */
	async createIndexes() {
		try {
			// Firmware collection indexes
			await this.firmwaresCollection.createIndex({ deviceType: 1 });
			await this.firmwaresCollection.createIndex({ uploadedBy: 1 });
			await this.firmwaresCollection.createIndex({ createdAt: -1 });
			await this.firmwaresCollection.createIndex({ sha1: 1 });
			await this.firmwaresCollection.createIndex({
				deviceType: "text",
				version: "text",
				description: "text",
			});

			// User collection indexes
			await this.usersCollection.createIndex({ username: 1 }, { unique: true });

			// Config collection indexes
			await this.configCollection.createIndex({ key: 1 }, { unique: true });
		} catch (error) {
			console.warn("Warning: Could not create some indexes:", error.message);
		}
	}

	/**
	 * Store firmware file using GridFS and save metadata
	 */
	async addFirmware(firmware, fileBuffer) {
		if (this.supportsTransactions) {
			return await this.addFirmwareWithTransaction(firmware, fileBuffer);
		} else {
			return await this.addFirmwareWithoutTransaction(firmware, fileBuffer);
		}
	}

	/**
	 * Add firmware with transaction support (replica set/mongos)
	 */
	async addFirmwareWithTransaction(firmware, fileBuffer) {
		const session = this.client.startSession();

		try {
			let result;
			await session.withTransaction(async () => {
				// Generate unique IDs
				const firmwareId = uuidv4();
				const fileId = `${Date.now()}-${uuidv4()}.${this.getFileExtension(firmware.originalName)}`;

				// Upload file to GridFS
				const uploadStream = this.gridFSBucket.openUploadStream(fileId, {
					metadata: {
						firmwareId: firmwareId,
						originalName: firmware.originalName,
						mimetype: firmware.mimetype || "application/octet-stream",
					},
					chunkSizeBytes: this.chunkSize,
				});

				await new Promise((resolve, reject) => {
					uploadStream.on("error", reject);
					uploadStream.on("finish", resolve);
					uploadStream.end(fileBuffer);
				});

				// Create firmware metadata document using provided values
				const firmwareDoc = {
					id: firmwareId,
					deviceType: firmware.deviceType,
					version: firmware.version,
					description: firmware.description || "",
					originalName: firmware.originalName,
					size: firmware.size,
					sha1: firmware.sha1,
					uploadedBy: firmware.uploadedBy,
					mimetype: firmware.mimetype || "application/octet-stream",
					fileId: fileId,
					uploadDate: new Date(),
					createdAt: new Date(),
				};

				// Save firmware metadata
				await this.firmwaresCollection.insertOne(firmwareDoc, { session });
				result = firmwareDoc;
			});

			return result;
		} catch (error) {
			console.error("Error adding firmware with transaction:", error);
			throw error;
		} finally {
			await session.endSession();
		}
	}

	/**
	 * Add firmware without transaction support (standalone MongoDB)
	 */
	async addFirmwareWithoutTransaction(firmware, fileBuffer) {
		try {
			// Generate unique IDs
			const firmwareId = uuidv4();
			const fileId = `${Date.now()}-${uuidv4()}.${this.getFileExtension(firmware.originalName)}`;

			// Upload file to GridFS first
			const uploadStream = this.gridFSBucket.openUploadStream(fileId, {
				metadata: {
					firmwareId: firmwareId,
					originalName: firmware.originalName,
					mimetype: firmware.mimetype || "application/octet-stream",
				},
				chunkSizeBytes: this.chunkSize,
			});

			await new Promise((resolve, reject) => {
				uploadStream.on("error", reject);
				uploadStream.on("finish", resolve);
				uploadStream.end(fileBuffer);
			});

			// Create firmware metadata document
			const firmwareDoc = {
				id: firmwareId,
				deviceType: firmware.deviceType,
				version: firmware.version,
				description: firmware.description || "",
				originalName: firmware.originalName,
				size: firmware.size,
				sha1: firmware.sha1,
				uploadedBy: firmware.uploadedBy,
				mimetype: firmware.mimetype || "application/octet-stream",
				fileId: fileId,
				uploadDate: new Date(),
				createdAt: new Date(),
			};

			// Save firmware metadata
			await this.firmwaresCollection.insertOne(firmwareDoc);

			return firmwareDoc;
		} catch (error) {
			console.error("Error adding firmware without transaction:", error);

			// Try to cleanup the uploaded file if metadata save failed
			try {
				const files = await this.gridFSBucket.find({ filename: fileId }).toArray();
				if (files.length > 0) {
					await this.gridFSBucket.delete(files[0]._id);
				}
			} catch (cleanupError) {
				console.warn("Warning: Could not cleanup uploaded file after error:", cleanupError.message);
			}

			throw error;
		}
	}

	/**
	 * Retrieve firmware file from GridFS
	 */
	async getFirmwareFile(fileId) {
		try {
			const downloadStream = this.gridFSBucket.openDownloadStreamByName(fileId);

			return new Promise((resolve, reject) => {
				const chunks = [];

				downloadStream.on("data", (chunk) => {
					chunks.push(chunk);
				});

				downloadStream.on("end", () => {
					resolve(Buffer.concat(chunks));
				});

				downloadStream.on("error", (error) => {
					if (error.code === "ENOENT") {
						reject(new Error(`File not found: ${fileId}`));
					} else {
						reject(error);
					}
				});
			});
		} catch (error) {
			console.error("Error retrieving firmware file:", error);
			throw error;
		}
	}

	/**
	 * Get firmwares filtered by device type
	 */
	async getFirmwaresByDevice(deviceType) {
		try {
			return await this.firmwaresCollection.find({ deviceType }).sort({ createdAt: -1 }).toArray();
		} catch (error) {
			console.error("Error getting firmwares by device:", error);
			throw error;
		}
	}

	/**
	 * Get all firmwares
	 */
	async getAllFirmwares() {
		try {
			return await this.firmwaresCollection.find({}).sort({ createdAt: -1 }).toArray();
		} catch (error) {
			console.error("Error getting all firmwares:", error);
			throw error;
		}
	}

	/**
	 * Get all unique device types
	 */
	async getDeviceTypes() {
		try {
			return await this.firmwaresCollection.distinct("deviceType");
		} catch (error) {
			console.error("Error getting device types:", error);
			throw error;
		}
	}

	/**
	 * Find user by username
	 */
	async findUser(username) {
		try {
			return await this.usersCollection.findOne({ username });
		} catch (error) {
			console.error("Error finding user:", error);
			throw error;
		}
	}

	/**
	 * Get firmware by ID
	 */
	async getFirmwareById(id) {
		try {
			return await this.firmwaresCollection.findOne({ id: id });
		} catch (error) {
			console.error("Error getting firmware by ID:", error);
			throw error;
		}
	}

	/**
	 * Update firmware metadata
	 */
	async updateFirmware(id, updates) {
        console.log("Updating firmware with ID:", id, "Updates:", updates);
		try {
			const updateDoc = {
				...updates,
				updatedAt: new Date(),
			};

			// Remove fields that shouldn't be updated
			delete updateDoc.id;
			delete updateDoc.fileId;
			delete updateDoc.sha1;
			delete updateDoc.size;
			delete updateDoc.uploadDate;
			delete updateDoc.createdAt;

			const result = await this.firmwaresCollection.findOneAndUpdate({ id: id }, { $set: updateDoc }, { returnDocument: "after" });

			return result;
		} catch (error) {
			console.error("Error updating firmware:", error);
			throw error;
		}
	}

	/**
	 * Delete firmware and its file
	 */
	async deleteFirmware(id) {
		if (this.supportsTransactions) {
			return await this.deleteFirmwareWithTransaction(id);
		} else {
			return await this.deleteFirmwareWithoutTransaction(id);
		}
	}

	/**
	 * Delete firmware with transaction support
	 */
	async deleteFirmwareWithTransaction(id) {
		const session = this.client.startSession();

		try {
			let success = false;
			await session.withTransaction(async () => {
				// Get firmware metadata first
				const firmware = await this.firmwaresCollection.findOne({ id: id }, { session });
				if (!firmware) {
					return;
				}

				// Delete file from GridFS
				try {
					const files = await this.gridFSBucket.find({ filename: firmware.fileId }).toArray();
					if (files.length > 0) {
						await this.gridFSBucket.delete(files[0]._id);
					}
				} catch (error) {
					console.warn("Warning: Could not delete GridFS file:", error.message);
				}

				// Delete firmware metadata
				const deleteResult = await this.firmwaresCollection.deleteOne({ id: id }, { session });
				success = deleteResult.deletedCount > 0;
			});

			return success;
		} catch (error) {
			console.error("Error deleting firmware with transaction:", error);
			throw error;
		} finally {
			await session.endSession();
		}
	}

	/**
	 * Delete firmware without transaction support
	 */
	async deleteFirmwareWithoutTransaction(id) {
		try {
			// Get firmware metadata first
			const firmware = await this.firmwaresCollection.findOne({ id: id });
			if (!firmware) {
				return false;
			}

			// Delete firmware metadata first
			const deleteResult = await this.firmwaresCollection.deleteOne({ id: id });
			const success = deleteResult.deletedCount > 0;

			// Then delete file from GridFS
			if (success) {
				try {
					const files = await this.gridFSBucket.find({ filename: firmware.fileId }).toArray();
					if (files.length > 0) {
						await this.gridFSBucket.delete(files[0]._id);
					}
				} catch (error) {
					console.warn("Warning: Could not delete GridFS file:", error.message);
				}
			}

			return success;
		} catch (error) {
			console.error("Error deleting firmware without transaction:", error);
			throw error;
		}
	}

	/**
	 * Add or update user
	 */
	async saveUser(user) {
		try {
			const userDoc = {
				...user,
				id: user.id || uuidv4(),
				createdAt: user.createdAt || new Date(),
			};

			const result = await this.usersCollection.findOneAndReplace({ username: userDoc.username }, userDoc, { upsert: true, returnDocument: "after" });

			return result.value;
		} catch (error) {
			console.error("Error saving user:", error);
			throw error;
		}
	}

	/**
	 * Search firmwares using text search
	 */
	async searchFirmwares(query) {
		try {
			if (!query || query.trim() === "") {
				return await this.getAllFirmwares();
			}

			// Use MongoDB text search
			const textSearchResults = await this.firmwaresCollection
				.find({ $text: { $search: query } })
				.sort({ createdAt: -1 })
				.toArray();

			// If no text search results, fall back to regex search
			if (textSearchResults.length === 0) {
				const regexQuery = new RegExp(query, "i");
				return await this.firmwaresCollection
					.find({
						$or: [{ deviceType: regexQuery }, { version: regexQuery }, { description: regexQuery }, { originalName: regexQuery }],
					})
					.sort({ createdAt: -1 })
					.toArray();
			}

			return textSearchResults;
		} catch (error) {
			console.error("Error searching firmwares:", error);
			throw error;
		}
	}

	/**
	 * Get firmware statistics
	 */
	async getFirmwareStats() {
		try {
			const pipeline = [
				{
					$group: {
						_id: "$deviceType",
						count: { $sum: 1 },
						totalSize: { $sum: "$size" },
						latestUpload: { $max: "$uploadDate" },
					},
				},
				{
					$project: {
						deviceType: "$_id",
						count: 1,
						totalSize: 1,
						latestUpload: 1,
						_id: 0,
					},
				},
				{
					$sort: { count: -1 },
				},
			];

			return await this.firmwaresCollection.aggregate(pipeline).toArray();
		} catch (error) {
			console.error("Error getting firmware stats:", error);
			throw error;
		}
	}

	/**
	 * Get configuration value
	 */
	async getConfig(key) {
		try {
			const config = await this.configCollection.findOne({ key });
			return config ? config.value : null;
		} catch (error) {
			console.error("Error getting config:", error);
			throw error;
		}
	}

	/**
	 * Set configuration value
	 */
	async setConfig(key, value) {
		try {
			await this.configCollection.findOneAndReplace({ key }, { key, value, updatedAt: new Date() }, { upsert: true });
		} catch (error) {
			console.error("Error setting config:", error);
			throw error;
		}
	}

	/**
	 * Close MongoDB connection
	 */
	async close() {
		try {
			if (this.client) {
				await this.client.close();
				console.log("MongoDB connection closed");
			}
		} catch (error) {
			console.error("Error closing MongoDB connection:", error);
			throw error;
		}
	}

	/**
	 * Helper method to extract file extension
	 */
	getFileExtension(filename) {
		if (!filename) return "bin";
		const parts = filename.split(".");
		return parts.length > 1 ? parts.pop() : "bin";
	}
}

module.exports = MongoDBStorage;
