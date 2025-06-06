const crypto = require("crypto");
const semver = require("semver");
const config = require("../config/config");
const storageManager = require("../models/StorageManager");

const getDevices = async (req, res) => {
    try {
        const devices = await storageManager.getDeviceTypes();
        res.json(devices);
    } catch (error) {
        console.error("Error getting devices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getFirmwares = async (req, res) => {
    try {
        const { device, search, number, stable, minimal } = req.query;

        // Create options object for filtering
        const options = {
            limit: number ? parseInt(number, 10) : null,
            onlyStable: stable === "true" || stable === "1" || stable === "on",
            minimal: minimal === "true" || minimal === "1" || minimal === "on",
        };

        let firmwares;

        if (search) {
            firmwares = await storageManager.searchFirmwares(search, options);
        } else if (device) {
            firmwares = await storageManager.getFirmwaresByDevice(device, options);
        } else {
            firmwares = await storageManager.getAllFirmwares(options);
        }

        res.json(firmwares);
    } catch (error) {
        console.error("Error getting firmwares:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getFirmwareById = async (req, res) => {
    try {
        const firmware = await storageManager.getFirmwareById(req.params.id);
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
        const { id } = req.params;

        const firmware = await storageManager.getFirmwareById(id);
        if (!firmware) {
            return res.status(404).json({ error: "Firmware not found" });
        }

        const fileBuffer = await storageManager.getFirmwareFile(firmware.fileId);

        // Set appropriate headers
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${firmware.originalName}"`);
        res.setHeader("Content-Length", fileBuffer.length);

        res.send(fileBuffer);

        // Increment download count in analytics
        const totalDownloads = (await storageManager.getAnalytics("totalDownloads")) || 0;
        storageManager.setAnalytics("totalDownloads", totalDownloads + 1);
    } catch (error) {
        console.error("Error downloading firmware:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const uploadFirmware = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: `No file uploaded. Supported formats: ${config.ALLOWED_FILE_TYPES}` });
        }

        const { deviceType, version, description } = req.body;

        if (!deviceType || !version || !description) {
            return res.status(400).json({ error: "Device type, version, and description are required" });
        }

        if (!semver.valid(version)) {
            return res.status(400).json({ error: "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)" });
        }

        // Check if version already exists for this device
        const existingFirmwares = await storageManager.getFirmwaresByDevice(deviceType);
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

        const savedFirmware = await storageManager.addFirmware(firmware, fileBuffer);
        res.json(savedFirmware);
    } catch (error) {
        console.error("Error uploading firmware:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteFirmware = async (req, res) => {
    try {
        const success = await storageManager.deleteFirmware(req.params.id);

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
        const { version, description } = req.body;

        if (!version || !description) {
            return res.status(400).json({ error: "Version, and description are required" });
        }

        if (!semver.valid(version)) {
            return res.status(400).json({ error: "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)" });
        }

        const updatedFirmware = await storageManager.updateFirmware(req.params.id, {
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
        const stats = await storageManager.getFirmwareStats();
        res.json(stats);
    } catch (error) {
        console.error("Error getting firmware stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const calculateSHA1 = (buffer) => {
    return crypto.createHash("sha1").update(buffer).digest("hex");
};

// Graceful shutdown handler
process.on("SIGTERM", async () => {
    if (storageManager) {
        console.log("Closing Storage Manager...");
        await storageManager.close();
    }
    process.exit(0);
});

process.on("SIGINT", async () => {
    if (storageManager) {
        console.log("Closing Storage Manager...");
        await storageManager.close();
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
};
