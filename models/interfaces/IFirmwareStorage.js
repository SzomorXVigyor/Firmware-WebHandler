/**
 * Interface for firmware storage implementations
 * Defines the contract that all storage providers must implement
 */
class IFirmwareStorage {
    constructor() {
        if (this.constructor === IFirmwareStorage) {
            throw new Error("Cannot instantiate interface directly");
        }
    }

    /**
     * Initialize the storage provider
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new Error("Method 'initialize' must be implemented");
    }

    /**
     * Store firmware file and metadata
     * @param {Object} firmware - Firmware metadata
     * @param {Buffer} fileBuffer - Firmware file buffer
     * @returns {Promise<Object>} Saved firmware object with generated ID
     */
    async addFirmware(firmware, fileBuffer) {
        throw new Error("Method 'addFirmware' must be implemented");
    }

    /**
     * Retrieve firmware file
     * @param {string} fileId - File identifier
     * @returns {Promise<Buffer>} File buffer
     */
    async getFirmwareFile(fileId) {
        throw new Error("Method 'getFirmwareFile' must be implemented");
    }

    /**
     * Get firmwares filtered by device type
     * @param {string} deviceType - Device type to filter by
     * @returns {Promise<Array>} Array of firmware objects
     */
    async getFirmwaresByDevice(deviceType) {
        throw new Error("Method 'getFirmwaresByDevice' must be implemented");
    }

    /**
     * Get all firmwares
     * @returns {Promise<Array>} Array of all firmware objects
     */
    async getAllFirmwares() {
        throw new Error("Method 'getAllFirmwares' must be implemented");
    }

    /**
     * Get all unique device types
     * @returns {Promise<Array>} Array of device type strings
     */
    async getDeviceTypes() {
        throw new Error("Method 'getDeviceTypes' must be implemented");
    }

    /**
     * Find user by username
     * @param {string} username - Username to search for
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async findUser(username) {
        throw new Error("Method 'findUser' must be implemented");
    }

    /**
     * Get firmware by ID
     * @param {string} id - Firmware ID
     * @returns {Promise<Object|null>} Firmware object or null if not found
     */
    async getFirmwareById(id) {
        throw new Error("Method 'getFirmwareById' must be implemented");
    }

    /**
     * Update firmware metadata
     * @param {string} id - Firmware ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>} Updated firmware object or null if not found
     */
    async updateFirmware(id, updates) {
        throw new Error("Method 'updateFirmware' must be implemented");
    }

    /**
     * Delete firmware and its file
     * @param {string} id - Firmware ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteFirmware(id) {
        throw new Error("Method 'deleteFirmware' must be implemented");
    }

    /**
     * Add or update user
     * @param {Object} user - User object
     * @returns {Promise<Object>} Saved user object
     */
    async saveUser(user) {
        throw new Error("Method 'saveUser' must be implemented");
    }

    /**
     * Search firmwares
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching firmware objects
     */
    async searchFirmwares(query) {
        throw new Error("Method 'searchFirmwares' must be implemented");
    }

    /**
     * Get firmware statistics
     * @returns {Promise<Array>} Array of statistics objects
     */
    async getFirmwareStats() {
        throw new Error("Method 'getFirmwareStats' must be implemented");
    }

    /**
     * Get configuration value
     * @param {string} key - Configuration key
     * @returns {Promise<any>} Configuration value
     */
    async getConfig(key) {
        throw new Error("Method 'getConfig' must be implemented");
    }

    /**
     * Set configuration value
     * @param {string} key - Configuration key
     * @param {any} value - Configuration value
     * @returns {Promise<void>}
     */
    async setConfig(key, value) {
        throw new Error("Method 'setConfig' must be implemented");
    }

    /**
     * Close storage connection
     * @returns {Promise<void>}
     */
    async close() {
        throw new Error("Method 'close' must be implemented");
    }
}

module.exports = IFirmwareStorage;
