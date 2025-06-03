const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const semver = require("semver");
const { v4: uuidv4 } = require("uuid");
const IFirmwareStorage = require("../interfaces/IFirmwareStorage");

/**
 * File system based storage implementation
 */
class FileSystemStorage extends IFirmwareStorage {
    constructor(config) {
        super();
        this.analyticsFile = config.ANALYTICS || "./data/analytics.json";
        this.dataFile = config.DATA_FILE || "./data/firmware_data.json";
        this.uploadDir = config.UPLOAD_DIR || "./data/uploads";
        this.data = null;
    }
    /**
	 * Initialize the storage provider
	 * This method ensures the data directory and upload directory exist,
	 * loads existing data from the data file,
	 * @returns {Promise<void>}
	 * @throws {Error} If there is an error reading or parsing the data file
	 */
    async initialize() {
        try {
            // Ensure directories exist
            const dataDir = path.dirname(this.dataFile);
            if (!fsSync.existsSync(dataDir)) {
                await fs.mkdir(dataDir, { recursive: true });
            }
            if (!fsSync.existsSync(this.uploadDir)) {
                await fs.mkdir(this.uploadDir, { recursive: true });
            }

            this.data = await this.loadData();
            console.log("FileSystem storage initialized successfully");
        } catch (error) {
            console.error("Error initializing FileSystem storage:", error);
            throw error;
        }
    }

    /**
	 * Load data from the data file
	 * This method reads the JSON data file and parses it.
	 * If the file does not exist, it initializes with default data.
	 * @return {Promise<Object>} Parsed data object
	 * @private
	 * @throws {Error} If there is an error reading or parsing the file
	 */
    async loadData() {
        try {
            if (fsSync.existsSync(this.dataFile)) {
                const fileContent = await fs.readFile(this.dataFile, "utf8");
                return JSON.parse(fileContent);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }

        return {
            users: [
                {
                    id: uuidv4(),
                    username: "admin",
                    password: "$2a$12$uxVJ1DzzFDanM4ARDrbIR.E2WDwK.LtsyanVIWp/xhzkoaiTSuWZ2", // admin123
                    role: "admin",
                    createdAt: new Date().toISOString(),
                },
            ],
            firmwares: [],
        };
    }

    /**
	 * Save data to the data file
	 * This method writes the current data object to the JSON file.
	 * It ensures the directory exists before writing.
	 * @returns {Promise<void>}
	 * @throws {Error} If there is an error writing the file
	 */
    async saveData() {
        try {
            const dataDir = path.dirname(this.dataFile);
            if (!fsSync.existsSync(dataDir)) {
                await fs.mkdir(dataDir, { recursive: true });
            }
            await fs.writeFile(this.dataFile, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error("Error saving data:", error);
            throw error;
        }
    }

    /**
	 * Store firmware file and metadata
	 * This method saves the firmware file to the upload directory,
	 * creates a metadata record with a unique ID,
	 * and appends it to the existing firmware records.
	 * @param {Object} firmware - Firmware metadata object containing deviceType, version, description, etc.
	 * @param {Buffer} fileBuffer - Buffer containing the firmware file data
	 * @return {Promise<Object>} Saved firmware object with generated ID and fileId
	 * @throws {Error} If there is an error saving the file or metadata
	 */
    async addFirmware(firmware, fileBuffer) {
        try {
            // Store file
            const fileName = `${Date.now()}-${uuidv4()}${path.extname(firmware.originalName)}`;
            const filePath = path.join(this.uploadDir, fileName);
            await fs.writeFile(filePath, fileBuffer);

            // Store metadata
            const firmwareRecord = {
                id: uuidv4(),
                ...firmware,
                fileId: fileName,
                createdAt: new Date().toISOString(),
            };

            this.data.firmwares.push(firmwareRecord);
            await this.saveData();
            return firmwareRecord;
        } catch (error) {
            console.error("Error adding firmware:", error);
            throw error;
        }
    }

    /**
	 * Retrieve firmware file by its ID
	 * This method reads the firmware file from the upload directory
	 * and returns its content as a Buffer.
	 * @param {string} fileId - Unique identifier for the firmware file
	 * @return {Promise<Buffer>} File content as a Buffer
	 * @throws {Error} If there is an error reading the file
	 */
    async getFirmwareFile(fileId) {
        try {
            const filePath = path.join(this.uploadDir, fileId);
            return await fs.readFile(filePath);
        } catch (error) {
            console.error("Error retrieving firmware file:", error);
            throw error;
        }
    }

    /**
	 * Get firmwares filtered by device type
	 * This method retrieves all firmware records that match the specified device type,
	 * sorted by version in descending order.
	 * @param {string} deviceType - Device type to filter by
	 * @param {Object} options - Filter options
	 * @param {number|null} options.limit - Maximum number of results to return
	 * @param {boolean} options.onlyStable - Whether to filter only stable versions
	 * @param {boolean} options.minimal - Whether to return minimal response (id, version, sha1 only)
	 * @return {Promise<Array>} Array of firmware objects matching the device type
	 * @throws {Error} If there is an error retrieving the data
	 */
    async getFirmwaresByDevice(deviceType, options = {}) {
        const firmwares = this.data.firmwares.filter((f) => f.deviceType === deviceType).sort((a, b) => semver.rcompare(a.version, b.version));

        return this.applyFilters(firmwares, options);
    }

    /**
	 * Get all firmwares
	 * This method retrieves all firmware records,
	 * sorted by upload date in descending order.
	 * @param {Object} options - Filter options
	 * @param {number|null} options.limit - Maximum number of results to return
	 * @param {boolean} options.onlyStable - Whether to filter only stable versions
	 * @param {boolean} options.minimal - Whether to return minimal response (id, version, sha1 only)
	 * @return {Promise<Array>} Array of all firmware objects
	 * @throws {Error} If there is an error retrieving the data
	 */
    async getAllFirmwares(options = {}) {
        const firmwares = this.data.firmwares.sort((a, b) => new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt));

        return this.applyFilters(firmwares, options);
    }

    /**
	 * Get all unique device types
	 * This method retrieves all unique device types from the firmware records,
	 * sorted alphabetically.
	 * @return {Promise<Array>} Array of unique device type strings
	 * @throws {Error} If there is an error retrieving the data
	 */
    async getDeviceTypes() {
        const types = [...new Set(this.data.firmwares.map((f) => f.deviceType))];
        return types.sort();
    }

    /**
	 * Find user by username
	 * This method searches for a user in the data by their username.
	 * @param {string} username - Username to search for
	 * @return {Promise<Object|null>} User object if found, otherwise null
	 * @throws {Error} If there is an error retrieving the data
	 */
    async findUser(username) {
        return this.data.users.find((u) => u.username === username);
    }

    /**
	 * Get firmware by ID
	 * This method retrieves a firmware record by its unique ID.
	 * @param {string} id - Firmware ID to search for
	 * @return {Promise<Object|null>} Firmware object if found, otherwise null
	 * @throws {Error} If there is an error retrieving the data
	 */
    async getFirmwareById(id) {
        return this.data.firmwares.find((f) => f.id === id);
    }

    /**
	 * Update firmware metadata
	 * This method updates the metadata of an existing firmware record.
	 * It merges the existing record with the provided updates,
	 * and updates the updatedAt timestamp.
	 * @param {string} id - Firmware ID to update
	 * @param {Object} updates - Object containing fields to update
	 * @return {Promise<Object|null>} Updated firmware object if found, otherwise null
	 * @throws {Error} If there is an error updating the data
	 */
    async updateFirmware(id, updates) {
        const index = this.data.firmwares.findIndex((f) => f.id === id);
        if (index === -1) return null;

        this.data.firmwares[index] = {
            ...this.data.firmwares[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await this.saveData();
        return this.data.firmwares[index];
    }

    /**
	 * Delete firmware and its file
	 * This method removes a firmware record by its ID,
	 * and deletes the associated file from the upload directory.
	 * @param {string} id - Firmware ID to delete
	 * @return {Promise<boolean>} True if deletion was successful, otherwise false
	 */
    async deleteFirmware(id) {
        try {
            const firmware = await this.getFirmwareById(id);
            if (!firmware) return false;

            // Remove file
            const filePath = path.join(this.uploadDir, firmware.fileId);
            if (fsSync.existsSync(filePath)) {
                await fs.unlink(filePath);
            }

            // Remove from data
            this.data.firmwares = this.data.firmwares.filter((f) => f.id !== id);
            await this.saveData();
            return true;
        } catch (error) {
            console.error("Error deleting firmware:", error);
            return false;
        }
    }

    /**
	 * Add or update user
	 * This method saves a user object to the data.
	 * If the user already exists, it updates their information;
	 * otherwise, it creates a new user with a unique ID.
	 * @param {Object} user - User object containing username, password, role, etc.
	 * @return {Promise<Object>} Saved user object with ID and timestamps
	 * @throws {Error} If there is an error saving the user
	 */
    async saveUser(user) {
        try {
            const existingIndex = this.data.users.findIndex((u) => u.username === user.username);
            const userData = {
                ...user,
                updatedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                this.data.users[existingIndex] = userData;
            } else {
                userData.id = uuidv4();
                userData.createdAt = new Date().toISOString();
                this.data.users.push(userData);
            }
            await this.saveData();
            return userData;
        } catch (error) {
            console.error("Error saving user:", error);
            throw error;
        }
    }

    /**
	 * Search firmwares by query
	 * This method searches for firmware records that match the provided query
	 * in deviceType, description, or version fields.
	 * @param {string} query - Search term to filter firmwares
	 * @param {Object} options - Filter options
	 * @param {number|null} options.limit - Maximum number of results to return
	 * @param {boolean} options.onlyStable - Whether to filter only stable versions
	 * @return {Promise<Array>} Array of firmware objects matching the search criteria
	 * @throws {Error} If there is an error searching the data
	 */
    async searchFirmwares(query, options = {}) {
        const searchTerm = query.toLowerCase();
        const firmwares = this.data.firmwares.filter(
            (fw) =>
                fw.deviceType.toLowerCase().includes(searchTerm) ||
				fw.description.toLowerCase().includes(searchTerm) ||
				fw.version.toLowerCase().includes(searchTerm),
        );

        return this.applyFilters(firmwares, options);
    }

    /**
	 * Get firmware statistics
	 * This method aggregates firmware data to provide statistics
	 * such as summerized count, type, total size and all analytics key-value.
	 * @return {Promise<Array>} Array of objects containing deviceType, count, latestVersion, and totalSize
	 * @throws {Error} If there is an error aggregating the data
	 */
    async getFirmwareStats() {
        const stats = {
            totalFirmwares: 0,
            deviceTypes: [],
            totalSize: 0,
        };

        this.data.firmwares.forEach((fw) => {
            stats.totalFirmwares++;
            stats.totalSize += fw.size || 0;
            if (!stats.deviceTypes.includes(fw.deviceType)) {
                stats.deviceTypes.push(fw.deviceType);
            }
        });

        // Merge analytics data
        try {
            const analytics = await this.getAllAnalytics();
            Object.assign(stats, analytics);
        } catch (err) {
            console.warn("Failed to load analytics data:", err.message);
        }
        return stats;
    }

    /**
	 * Get all analytics keys value
	 * This method retrieves all analytics keys and their values
	 * @returns {Promise<Object>} Object with all analytics keys and their values
	 * @throws {Error} If there is an error reading the analytics file
	 */
    async getAllAnalytics() {
        try {
            if (fsSync.existsSync(this.analyticsFile)) {
                const analytics = JSON.parse(await fs.readFile(this.analyticsFile, "utf8"));
                return analytics;
            }
        } catch (error) {
            console.error("Error getting all analytics:", error);
            throw error;
        }
    }

    /**
	 * Get analytics value
	 * This method retrieves a specific analytics value from the data file.
	 * If the analytics file does not exist, it returns null.
	 * @param {string} key - Analytics key to retrieve
	 * @return {Promise<any>} Analytics value if found, otherwise null
	 * @throws {Error} If there is an error reading the analytics file
	 */
    async getAnalytics(key) {
        try {
            if (fsSync.existsSync(this.analyticsFile)) {
                const analytics = JSON.parse(await fs.readFile(this.analyticsFile, "utf8"));
                return analytics[key] || null;
            }
        } catch (error) {
            console.error("Error getting analytics:", error);
        }
        return null;
    }

    /**
	 * Set analytics value
	 * This method updates or adds a specific analytics key-value pair
	 * in the analytics file.
	 * If the analytics file does not exist, it creates a new one.
	 * @param {string} key - Analytics key to set
	 * @param {any} value - Analytics value to set
	 * @return {Promise<void>}
	 * @throws {Error} If there is an error writing to the analytics file
	 */
    async setAnalytics(key, value) {
        try {
            let analytics = {};

            if (fsSync.existsSync(this.analyticsFile)) {
                analytics = JSON.parse(await fs.readFile(this.analyticsFile, "utf8"));
            }

            analytics[key] = value;
            await fs.writeFile(this.analyticsFile, JSON.stringify(analytics, null, 2));
        } catch (error) {
            console.error("Error setting analytics:", error);
            throw error;
        }
    }

    /**
	 * Close the storage provider
	 * This method is a placeholder for any cleanup operations needed
	 * when closing the storage.
	 * @returns {Promise<void>}
	 * @throws {Error} If there is an error during cleanup
	 */
    async close() {
        console.log("FileSystem storage closed");
    }

    /** --- Extra local helper methods --- */

    /**
	 * Helper method to apply filters (stable versions and limit)
	 * @param {Array} firmwares - Array of firmware objects
	 * @param {Object} options - Filter options
	 * @param {number|null} options.limit - Maximum number of results to return
	 * @param {boolean} options.onlyStable - Whether to filter only stable versions
	 * @param {boolean} options.minimal - Whether to return minimal response (id, version, sha1 only)
	 * @return {Array} Filtered array of firmware objects
	 */
    applyFilters(firmwares, options = {}) {
        let filtered = firmwares;

        // Filter stable versions if requested
        if (options.onlyStable) {
            filtered = filtered.filter((fw) => {
                try {
                    return semver.prerelease(fw.version) === null;
                } catch (error) {
                    // If version is not valid semver, exclude it when filtering for stable
                    console.warn(`Invalid semver version: ${fw.version}`);
                    return false;
                }
            });
        }

        // Apply limit if specified
        if (options.limit && options.limit > 0) {
            filtered = filtered.slice(0, options.limit);
        }

        // Apply minimal formatting if requested
        if (options.minimal) {
            filtered = filtered.map((fw) => ({
                id: fw.id,
                version: fw.version,
                sha1: fw.sha1,
            }));
        }

        return filtered;
    }
}

module.exports = FileSystemStorage;
