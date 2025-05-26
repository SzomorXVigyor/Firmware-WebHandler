const fs = require("fs");
const semver = require("semver");
const { v4: uuidv4 } = require("uuid");
const config = require("../config/config");

class FirmwareManager {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(config.DATA_FILE)) {
                return JSON.parse(fs.readFileSync(config.DATA_FILE, "utf8"));
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
        return {
            users: [{
                id: "1",
                username: "admin",
                password: "$2a$12$uxVJ1DzzFDanM4ARDrbIR.E2WDwK.LtsyanVIWp/xhzkoaiTSuWZ2"
            }],
            firmwares: []
        };
    }

    saveData() {
        try {
            // Ensure the data directory exists
            const dataDir = config.DATA_FILE.substring(0, config.DATA_FILE.lastIndexOf("/"));
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(config.DATA_FILE, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error("Error saving data:", error);
        }
    }

    addFirmware(firmware) {
        firmware.id = uuidv4();
        firmware.uploadDate = new Date().toISOString();
        this.data.firmwares.push(firmware);
        this.saveData();
        return firmware;
    }

    getFirmwaresByDevice(deviceType) {
        return this.data.firmwares
            .filter(f => f.deviceType === deviceType)
            .sort((a, b) => semver.rcompare(a.version, b.version));
    }

    getAllFirmwares() {
        return this.data.firmwares.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    getDeviceTypes() {
        const types = [...new Set(this.data.firmwares.map(f => f.deviceType))];
        return types.sort();
    }

    findUser(username) {
        return this.data.users.find(u => u.username === username);
    }

    getFirmwareById(id) {
        return this.data.firmwares.find(f => f.id === id);
    }
}

module.exports = FirmwareManager;
