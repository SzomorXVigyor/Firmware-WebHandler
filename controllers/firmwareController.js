const crypto = require("crypto");
const semver = require("semver");
const FirmwareManager = require("../models/FirmwareManager");

// Create global firmware manager instance
const config = require("../config/config");
let firmwareManager = null;

// Initialize firmware manager
async function initializeFirmwareManager() {
    if (!firmwareManager) {
        firmwareManager = new FirmwareManager(config);
        await firmwareManager.initialize();
    }
    return firmwareManager;
}

const getDevices = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const devices = await manager.getDeviceTypes();
        res.json(devices);
    } catch (error) {
        console.error("Error getting devices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getFirmwares = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const { device, search } = req.query;

        let firmwares;
        if (search) {
            firmwares = await manager.searchFirmwares(search);
        } else if (device) {
            firmwares = await manager.getFirmwaresByDevice(device);
        } else {
            firmwares = await manager.getAllFirmwares();
        }

        res.json(firmwares);
    } catch (error) {
        console.error("Error getting firmwares:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getFirmwareById = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const firmware = await manager.getFirmwareById(req.params.id);
        if (!firmware) {
            return res.status(404).json({ error: "Firmware not found" });
        }
        res.json(firmware);
    } catch (error) {
        console.error("Error getting firmware by ID:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const downloadFirmware = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const { id } = req.params;

        const firmware = await manager.getFirmwareById(id);
        if (!firmware) {
            return res.status(404).json({ error: "Firmware not found" });
        }

        const fileBuffer = await manager.getFirmwareFile(firmware.fileId);

        // Set appropriate headers
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${firmware.originalName}"`);
        res.setHeader("Content-Length", fileBuffer.length);

        res.send(fileBuffer);

        // Increment download count in analytics
        const totalDownloads = (await manager.getAnalytics("totalDownloads")) || 0;
        manager.setAnalytics("totalDownloads", totalDownloads + 1);
    } catch (error) {
        console.error("Error downloading firmware:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const calculateSHA1 = (buffer) => {
    return crypto.createHash("sha1").update(buffer).digest("hex");
};

const uploadFirmware = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { deviceType, version, description } = req.body;

        if (!deviceType || !version || !description) {
            return res.status(400).json({ error: "Device type, version, and description are required" });
        }

        if (!semver.valid(version)) {
            return res.status(400).json({ error: "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)" });
        }

        // Check if version already exists for this device
        const existingFirmwares = await manager.getFirmwaresByDevice(deviceType);
        const existingFirmware = existingFirmwares.find((f) => f.version === version);

        if (existingFirmware) {
            return res.status(400).json({ error: "This version already exists for this device type" });
        }

        // Read file buffer and calculate hash
        const fileBuffer = req.file.buffer;
        const sha1Hash = calculateSHA1(fileBuffer);

        const firmware = {
            deviceType,
            version,
            description,
            originalName: req.file.originalname,
            size: req.file.size,
            sha1: sha1Hash,
            uploadedBy: req.user.username,
            mimetype: req.file.mimetype,
        };

        const savedFirmware = await manager.addFirmware(firmware, fileBuffer);
        res.json(savedFirmware);
    } catch (error) {
        console.error("Error uploading firmware:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteFirmware = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const success = await manager.deleteFirmware(req.params.id);

        if (success) {
            res.json({ message: "Firmware deleted successfully" });
        } else {
            res.status(404).json({ error: "Firmware not found" });
        }
    } catch (error) {
        console.error("Error deleting firmware:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateFirmware = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const { version, description } = req.body;

        if (!version || !description) {
            return res.status(400).json({ error: "Version, and description are required" });
        }

        if (!semver.valid(version)) {
            return res.status(400).json({ error: "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)" });
        }

        const updatedFirmware = await manager.updateFirmware(req.params.id, {
            version,
            description,
            updatedBy: req.user.username,
        });

        if (updatedFirmware) {
            res.json(updatedFirmware);
        } else {
            res.status(404).json({ error: "Firmware not found" });
        }
    } catch (error) {
        console.error("Error updating firmware:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getFirmwareStats = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const stats = await manager.getFirmwareStats();
        res.json(stats);
    } catch (error) {
        console.error("Error getting firmware stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const healthCheck = async (req, res) => {
    try {
        const manager = await initializeFirmwareManager();
        const health = await manager.healthCheck();

        const statusCode = health.status === "healthy" ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        console.error("Error performing health check:", error);
        res.status(503).json({
            status: "unhealthy",
            error: error.message,
        });
    }
};

// Graceful shutdown handler
process.on("SIGTERM", async () => {
    if (firmwareManager) {
        console.log("Closing firmware manager...");
        await firmwareManager.close();
    }
    process.exit(0);
});

process.on("SIGINT", async () => {
    if (firmwareManager) {
        console.log("Closing firmware manager...");
        await firmwareManager.close();
    }
    process.exit(0);
});

module.exports = {
    getDevices,
    getFirmwares,
    getFirmwareById,
    downloadFirmware,
    uploadFirmware,
    deleteFirmware,
    updateFirmware,
    getFirmwareStats,
    healthCheck,
};
