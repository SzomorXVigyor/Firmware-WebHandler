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
        this.config = config;
        this.dataFile = config.DATA_FILE || "./data/firmware_data.json";
        this.uploadDir = config.UPLOAD_DIR || "./data/uploads";
        this.data = null;
    }

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
            users: [{
                id: uuidv4(),
                username: "admin",
                password: "$2a$12$uxVJ1DzzFDanM4ARDrbIR.E2WDwK.LtsyanVIWp/xhzkoaiTSuWZ2", // admin123
                role: "admin",
                createdAt: new Date().toISOString()
            }],
            firmwares: []
        };
    }

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

    async addFirmware(firmware, fileBuffer) {
        try {
            // Store file
            const fileName = `${Date.now()}-${uuidv4()}${path.extname(firmware.originalName)}`;
            const filePath = path.join(this.uploadDir, fileName);
            await fs.writeFile(filePath, fileBuffer);

            // Store metadata
            const firmwareRecord = {
                ...firmware,
                id: uuidv4(),
                fileId: fileName,
                uploadDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            this.data.firmwares.push(firmwareRecord);
            await this.saveData();
            return firmwareRecord;
        } catch (error) {
            console.error("Error adding firmware:", error);
            throw error;
        }
    }

    async getFirmwareFile(fileId) {
        try {
            const filePath = path.join(this.uploadDir, fileId);
            return await fs.readFile(filePath);
        } catch (error) {
            console.error("Error retrieving firmware file:", error);
            throw error;
        }
    }

    async getFirmwaresByDevice(deviceType) {
        return this.data.firmwares
            .filter(f => f.deviceType === deviceType)
            .sort((a, b) => semver.rcompare(a.version, b.version));
    }

    async getAllFirmwares() {
        return this.data.firmwares.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    async getDeviceTypes() {
        const types = [...new Set(this.data.firmwares.map(f => f.deviceType))];
        return types.sort();
    }

    async findUser(username) {
        return this.data.users.find(u => u.username === username);
    }

    async getFirmwareById(id) {
        return this.data.firmwares.find(f => f.id === id);
    }

    async updateFirmware(id, updates) {
        const index = this.data.firmwares.findIndex(f => f.id === id);
        if (index === -1) return null;

        this.data.firmwares[index] = {
            ...this.data.firmwares[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.saveData();
        return this.data.firmwares[index];
    }

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
            this.data.firmwares = this.data.firmwares.filter(f => f.id !== id);
            await this.saveData();
            return true;
        } catch (error) {
            console.error("Error deleting firmware:", error);
            return false;
        }
    }

    async saveUser(user) {
        try {
            const existingIndex = this.data.users.findIndex(u => u.username === user.username);
            const userData = {
                ...user,
                updatedAt: new Date().toISOString()
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

    async searchFirmwares(query) {
        const searchTerm = query.toLowerCase();
        return this.data.firmwares.filter(fw =>
            fw.deviceType.toLowerCase().includes(searchTerm) ||
            fw.description.toLowerCase().includes(searchTerm) ||
            fw.version.toLowerCase().includes(searchTerm)
        );
    }

    async getFirmwareStats() {
        const stats = {};

        this.data.firmwares.forEach(fw => {
            if (!stats[fw.deviceType]) {
                stats[fw.deviceType] = {
                    _id: fw.deviceType,
                    count: 0,
                    latestVersion: fw.version,
                    totalSize: 0
                };
            }
            stats[fw.deviceType].count++;
            stats[fw.deviceType].totalSize += fw.size || 0;

            if (semver.gt(fw.version, stats[fw.deviceType].latestVersion)) {
                stats[fw.deviceType].latestVersion = fw.version;
            }
        });

        return Object.values(stats);
    }

    async getConfig(key) {
        // Simple file-based config storage
        try {
            const configFile = path.join(path.dirname(this.dataFile), "config.json");
            if (fsSync.existsSync(configFile)) {
                const config = JSON.parse(await fs.readFile(configFile, "utf8"));
                return config[key] || null;
            }
        } catch (error) {
            console.error("Error getting config:", error);
        }
        return null;
    }

    async setConfig(key, value) {
        try {
            const configFile = path.join(path.dirname(this.dataFile), "config.json");
            let config = {};

            if (fsSync.existsSync(configFile)) {
                config = JSON.parse(await fs.readFile(configFile, "utf8"));
            }

            config[key] = value;
            await fs.writeFile(configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error("Error setting config:", error);
            throw error;
        }
    }

    async close() {
        console.log("FileSystem storage closed");
    }
}

module.exports = FileSystemStorage;
