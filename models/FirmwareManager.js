const semver = require("semver");
const { v4: uuidv4 } = require("uuid");
const FirmwareManagerFactory = require("./FirmwareManagerFactory");

/**
 * Modern FirmwareManager with pluggable storage backends
 * No legacy support - clean async interface only
 */
class FirmwareManager {
    constructor(config = null) {
        this.config = config || require("../config/config");

        // Validate configuration
        FirmwareManagerFactory.validateConfig(this.config);

        // Create storage instance
        this.storage = FirmwareManagerFactory.create(this.config);
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.storage.initialize();
            this.initialized = true;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    /**
     * Add firmware with file storage
     * @param {Object} firmware - Firmware metadata
     * @param {Buffer} fileBuffer - Firmware file buffer
     * @returns {Promise<Object>} Saved firmware object
     */
    async addFirmware(firmware, fileBuffer) {
        await this.ensureInitialized();
        return await this.storage.addFirmware(firmware, fileBuffer);
    }

    /**
     * Get firmware file buffer
     * @param {string} fileId - File identifier
     * @returns {Promise<Buffer>} File buffer
     */
    async getFirmwareFile(fileId) {
        await this.ensureInitialized();
        return await this.storage.getFirmwareFile(fileId);
    }

    async getFirmwaresByDevice(deviceType) {
        await this.ensureInitialized();
        return await this.storage.getFirmwaresByDevice(deviceType);
    }

    async getAllFirmwares() {
        await this.ensureInitialized();
        return await this.storage.getAllFirmwares();
    }

    async getDeviceTypes() {
        await this.ensureInitialized();
        return await this.storage.getDeviceTypes();
    }

    async findUser(username) {
        await this.ensureInitialized();
        return await this.storage.findUser(username);
    }

    async getFirmwareById(id) {
        await this.ensureInitialized();
        return await this.storage.getFirmwareById(id);
    }

    async updateFirmware(id, updates) {
        await this.ensureInitialized();
        return await this.storage.updateFirmware(id, updates);
    }

    async deleteFirmware(id) {
        await this.ensureInitialized();
        return await this.storage.deleteFirmware(id);
    }

    async saveUser(user) {
        await this.ensureInitialized();
        return await this.storage.saveUser(user);
    }

    async getFirmwareStats() {
        await this.ensureInitialized();
        return await this.storage.getFirmwareStats();
    }

    async searchFirmwares(query) {
        await this.ensureInitialized();
        return await this.storage.searchFirmwares(query);
    }

    async getConfig(key) {
        await this.ensureInitialized();
        return await this.storage.getConfig(key);
    }

    async setConfig(key, value) {
        await this.ensureInitialized();
        return await this.storage.setConfig(key, value);
    }

    async close() {
        if (this.storage) {
            await this.storage.close();
        }
        this.initialized = false;
    }

    // Static method to create pre-initialized instance
    static async create(config = null) {
        const manager = new FirmwareManager(config);
        await manager.initialize();
        return manager;
    }

    // Utility method to check storage type
    getStorageType() {
        return this.storage.constructor.name;
    }

    // Health check method
    async healthCheck() {
        try {
            await this.ensureInitialized();

            const deviceTypes = await this.getDeviceTypes();
            const totalFirmwares = (await this.getAllFirmwares()).length;

            return {
                status: "healthy",
                storageType: this.getStorageType(),
                deviceTypes: deviceTypes.length,
                totalFirmwares,
                initialized: this.initialized
            };
        } catch (error) {
            return {
                status: "unhealthy",
                error: error.message,
                storageType: this.getStorageType(),
                initialized: this.initialized
            };
        }
    }
}

module.exports = FirmwareManager;
