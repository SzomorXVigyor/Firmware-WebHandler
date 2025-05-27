/* eslint-disable no-underscore-dangle */
/**
 * _id is used intentionally as this file interfaces with MongoDB,
 * which uses _id as the primary identifier for documents.
 */
const { MongoClient, GridFSBucket } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const IFirmwareStorage = require("../interfaces/IFirmwareStorage");

/**
 * MongoDB implementation of firmware storage using GridFS for files
 * and regular collections for metadata and users
 */
class MongoDBStorage extends IFirmwareStorage {
    constructor(config) {
        super();
        this.client = null;
        this.db = null;
        this.gridFSBucket = null;
        this.firmwaresCollection = null;
        this.usersCollection = null;
        this.analyticsCollection = null;
        this.supportsTransactions = false;

        // Configuration from environment variables
        this.mongoUri = config.MONGODB_URI || "mongodb://localhost:27017";
        this.dbName = config.MONGODB_DB || "firmware_manager";
        this.bucketName = config.GRIDFS_BUCKET || "firmwares";
        this.chunkSize = parseInt(config.GRIDFS_CHUNK_SIZE || "1048576", 10);
    }

    /**
	 * Initialize MongoDB connection and collections
	 * This method connects to the MongoDB server,
	 * checks for transaction support,
	 * initializes the GridFS bucket for file storage,
	 * and sets up the necessary collections.
	 * @returns {Promise<void>}
	 * @throws {Error} If initialization fails
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
            this.analyticsCollection = this.db.collection("analytics");

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
	 * This method creates indexes on the firmwares, users, and analytics collections
	 * to improve query performance and ensure uniqueness where necessary.
	 * @returns {Promise<void>}
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

            // Analytics collection indexes
            await this.analyticsCollection.createIndex({ key: 1 }, { unique: true });
        } catch (error) {
            console.warn("Warning: Could not create some indexes:", error.message);
        }
    }

    /**
	 * Store firmware file using GridFS and save metadata
	 * This method handles both replica set/mongos (with transactions)
	 * and standalone MongoDB (without transactions).
	 * @param {Object} firmware - Firmware metadata
	 * @param {Buffer} fileBuffer - Firmware file buffer
	 * @return {Promise<Object>} Saved firmware object with generated ID
	 * @throws {Error} If adding firmware fails
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
	 * This method uses a transaction to ensure that both the file upload
	 * and metadata save are atomic.
	 * @param {Object} firmware - Firmware metadata
	 * @param {Buffer} fileBuffer - Firmware file buffer
	 * @return {Promise<Object>} Saved firmware object with generated ID
	 * @throws {Error} If adding firmware fails
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
	 * This method uploads the file to GridFS and saves the metadata
	 * without using transactions.
	 * @param {Object} firmware - Firmware metadata
	 * @param {Buffer} fileBuffer - Firmware file buffer
	 * @return {Promise<Object>} Saved firmware object with generated ID
	 * @throws {Error} If adding firmware fails
	 */
    async addFirmwareWithoutTransaction(firmware, fileBuffer) {
        let fileId = "";
        try {
            // Generate unique IDs
            const firmwareId = uuidv4();
            fileId = `${Date.now()}-${uuidv4()}.${this.getFileExtension(firmware.originalName)}`;

            // Upload file to GridFS first
            const uploadStream = this.gridFSBucket.openUploadStream(fileId, {
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
	 * This method fetches the file from GridFS using its fileId.
	 * @param {string} fileId - File identifier
	 * @return {Promise<Buffer>} File buffer
	 * @throws {Error} If file retrieval fails or file not found
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
	 * This method retrieves all firmwares for a specific device type,
	 * sorted by creation date in descending order.
	 * @param {string} deviceType - Device type to filter by
	 * @return {Promise<Array>} Array of firmware objects for the specified device type
	 * @throws {Error} If retrieval fails
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
	 * This method retrieves all firmwares in the database,
	 * sorted by creation date in descending order.
	 * @return {Promise<Array>} Array of all firmware objects
	 * @throws {Error} If retrieval fails
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
	 * This method retrieves all distinct device types from the firmware metadata.
	 * @return {Promise<Array>} Array of unique device type strings
	 * @throws {Error} If retrieval fails
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
	 * This method retrieves a user document by their username.
	 * @param {string} username - Username to search for
	 * @return {Promise<Object|null>} User object or null if not found
	 * @throws {Error} If retrieval fails
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
	 * This method retrieves a firmware document by its unique ID.
	 * @param {string} id - Firmware ID
	 * @return {Promise<Object|null>} Firmware object or null if not found
	 * @throws {Error} If retrieval fails
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
	 * This method updates the metadata of a firmware document by its ID.
	 * @param {string} id - Firmware ID
	 * @param {Object} updates - Updates to apply
	 * @return {Promise<Object|null>} Updated firmware object or null if not found
	 * @throws {Error} If update fails
	 */
    async updateFirmware(id, updates) {
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
	 * This method deletes a firmware document by its ID,
	 * and also removes the associated file from GridFS.
	 * @param {string} id - Firmware ID
	 * @return {Promise<boolean>} Success status
	 * @throws {Error} If deletion fails
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
	 * This method uses a transaction to ensure that both the firmware metadata
	 * and the associated file in GridFS are deleted atomically.
	 * @param {string} id - Firmware ID
	 * @return {Promise<boolean>} Success status
	 * @throws {Error} If deletion fails
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
	 * This method deletes the firmware metadata and the associated file
	 * from GridFS without using transactions.
	 * @param {string} id - Firmware ID
	 * @return {Promise<boolean>} Success status
	 * @throws {Error} If deletion fails
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
	 * This method saves a user document in the users collection.
	 * If the user already exists, it updates the document;
	 * otherwise, it creates a new one.
	 * @param {Object} user - User object containing username and other details
	 * @return {Promise<Object>} Saved user object with generated ID
	 * @throws {Error} If saving user fails
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
	 * This method performs a text search on the firmware metadata
	 * and falls back to regex search if no results are found.
	 * @param {string} query - Search query string
	 * @return {Promise<Array>} Array of matching firmware objects
	 * @throws {Error} If search fails
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
                        $or: [{ deviceType: regexQuery }, { version: regexQuery }, { description: regexQuery }],
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
	 * This method aggregates firmware data to provide statistics
	 * such as summerized count, type, total size and all analytics key-value.
	 * for each device type.
	 * @return {Promise<Array>} Array of objects containing firmware statistics
	 * @throws {Error} If aggregation fails
	 */
    async getFirmwareStats() {
        try {
            const pipeline = [
                {
                    $group: {
                        _id: null,
                        totalFirmwares: { $sum: 1 },
                        totalSize: { $sum: "$size" },
                        deviceTypes: { $addToSet: "$deviceType" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalFirmwares: 1,
                        totalSize: 1,
                        deviceTypes: 1,
                    },
                },
            ];

            const [stats = {}] = await this.firmwaresCollection.aggregate(pipeline).toArray();

            // Merge with analytics data if available
            try {
                const analytics = await this.getAllAnalytics();
                Object.assign(stats, analytics);
            } catch (err) {
                console.warn("Analytics data not available:", err.message);
            }
            return stats;
        } catch (error) {
            console.error("Error getting firmware stats:", error);
            throw error;
        }
    }

    /**
	 * Get all analytics keys value
	 * This method retrieves all analytics keys and their values
	 * @returns {Promise<Object>} Object with all analytics keys and their values
	 * @throws {Error} If there is an error reading the analytics file
	 */
    async getAllAnalytics() {
        try {
            const analytics = await this.analyticsCollection.find({}).toArray();
            const result = {};
            analytics.forEach((item) => {
                result[item.key] = item.value;
            });
            return result;
        } catch (error) {
            console.error("Error getting all analytics:", error);
            throw error;
        }
    }

    /**
	 * Get analytics value
	 * This method retrieves a specific analytics value
	 * by its key from the analytics collection.
	 * @param {string} key - Analytics key
	 * @return {Promise<any>} Analytics value or null if not found
	 * @throws {Error} If retrieval fails
	 */
    async getAnalytics(key) {
        try {
            const analytics = await this.analyticsCollection.findOne({ key });
            return analytics ? analytics.value : null;
        } catch (error) {
            console.error("Error getting analytics:", error);
            throw error;
        }
    }

    /**
	 * Set analytics value
	 * This method sets or updates an analytics value
	 * by its key in the analytics collection.
	 * @param {string} key - Analytics key
	 * @param {any} value - Analytics value to set
	 * @return {Promise<void>} Resolves when the operation is complete
	 * @throws {Error} If setting analytics fails
	 */
    async setAnalytics(key, value) {
        try {
            await this.analyticsCollection.findOneAndReplace({ key }, { key, value, updatedAt: new Date() }, { upsert: true });
        } catch (error) {
            console.error("Error setting analytics:", error);
            throw error;
        }
    }

    /**
	 * Close MongoDB connection
	 * This method closes the MongoDB client connection
	 * and cleans up resources.
	 * @return {Promise<void>} Resolves when the connection is closed
	 * @throws {Error} If closing connection fails
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
	 * This method extracts the file extension from a filename.
	 * If no extension is found, it returns "bin" as a default.
	 * @param {string} filename - Filename to extract extension from
	 * @return {string} File extension or "bin" if none found
	 */
    getFileExtension(filename) {
        if (!filename) return "bin";
        const parts = filename.split(".");
        return parts.length > 1 ? parts.pop() : "bin";
    }
}

module.exports = MongoDBStorage;
