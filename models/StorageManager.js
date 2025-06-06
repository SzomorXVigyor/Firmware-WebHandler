/* eslint-disable no-underscore-dangle */
const config = require("../config/config");
const StorageManagerFactory = require("./StorageManagerFactory");

/**
 * Modern FirmwareManager with pluggable storage backends
 * Singleton implementation
 * No legacy support - clean async interface only
 */
class StorageManager {
    constructor(config = null) {
        if (StorageManager._instance) {
            return StorageManager._instance;
        }

        // Validate configuration
        StorageManagerFactory.validateConfig(config);

        // Create storage instance
        this.initialized = false;
        this.storage = StorageManagerFactory.create(config);
        this.initialize();

        StorageManager._instance = this;
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

    async addFirmware(firmware, fileBuffer) {
        await this.ensureInitialized();
        return await this.storage.addFirmware(firmware, fileBuffer);
    }

    async getFirmwareFile(fileId) {
        await this.ensureInitialized();
        return await this.storage.getFirmwareFile(fileId);
    }

    async getFirmwaresByDevice(deviceType, options = {}) {
        await this.ensureInitialized();
        return await this.storage.getFirmwaresByDevice(deviceType, options);
    }

    async getAllFirmwares(options = {}) {
        await this.ensureInitialized();
        return await this.storage.getAllFirmwares(options);
    }

    async getDeviceTypes() {
        await this.ensureInitialized();
        return await this.storage.getDeviceTypes();
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

    async searchFirmwares(query, options = {}) {
        await this.ensureInitialized();
        return await this.storage.searchFirmwares(query, options);
    }

    async getFirmwareStats() {
        await this.ensureInitialized();
        return await this.storage.getFirmwareStats();
    }

    async getAllAnalytics() {
        await this.ensureInitialized();
        return await this.storage.getAllAnalytics();
    }

    async getAnalytics(key) {
        await this.ensureInitialized();
        return await this.storage.getAnalytics(key);
    }

    async setAnalytics(key, value) {
        await this.ensureInitialized();
        return await this.storage.setAnalytics(key, value);
    }

    async getUser(username) {
        await this.ensureInitialized();
        return await this.storage.getUser(username);
    }

    async getAllUsers() {
        await this.ensureInitialized();
        return await this.storage.getAllUsers();
    }

    async saveUser(user) {
        await this.ensureInitialized();
        return await this.storage.saveUser(user);
    }

    async deleteUser(username) {
        await this.ensureInitialized();
        return await this.storage.deleteUser(username);
    }

    async close() {
        if (this.storage) {
            await this.storage.close();
        }
        this.initialized = false;
    }

    // Utility method to check storage type
    getStorageType() {
        return this.storage.constructor.name;
    }

    // Health check method
    async healthCheck() {
        try {
            await this.ensureInitialized();

            const totalFirmwares = (await this.getAllFirmwares()).length;

            return {
                status: "healthy",
                storageType: this.getStorageType(),
                totalFirmwares: totalFirmwares,
                initialized: this.initialized,
            };
        } catch (error) {
            return {
                status: "unhealthy",
                error: error.message,
                storageType: this.getStorageType(),
                initialized: this.initialized,
            };
        }
    }
}

const storageManager = new StorageManager(config);

module.exports = storageManager;
