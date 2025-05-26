const fs = require("fs");
const crypto = require("crypto");
const semver = require("semver");
const FirmwareManager = require("../models/FirmwareManager");
const firmwareManager = new FirmwareManager();

const getDevices = (req, res) => {
    try {
        const devices = firmwareManager.getDeviceTypes();
        res.json(devices);
    } catch (error) {
        console.error("Error getting devices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getFirmwares = (req, res) => {
    try {
        const { device } = req.query;

        if (device) {
            const firmwares = firmwareManager.getFirmwaresByDevice(device);
            res.json(firmwares);
        } else {
            const firmwares = firmwareManager.getAllFirmwares();
            res.json(firmwares);
        }
    } catch (error) {
        console.error("Error getting firmwares:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getFirmwareById = (req, res) => {
    try {
        const firmware = firmwareManager.getFirmwareById(req.params.id);
        if (!firmware) {
            return res.status(404).json({ error: "Firmware not found" });
        }
        res.json(firmware);
    } catch (error) {
        console.error("Error getting firmware by ID:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const calculateSHA1 = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha1");
        const stream = fs.createReadStream(filePath);

        stream.on("error", (err) => reject(err));
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
    });
};

const uploadFirmware = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { deviceType, version, description } = req.body;

        if (!deviceType || !version || !description) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Device type, version, and description are required" });
        }

        if (!semver.valid(version)) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)" });
        }

        // Check if version already exists for this device
        const existingFirmware = firmwareManager.data.firmwares.find((f) => f.deviceType === deviceType && f.version === version);

        if (existingFirmware) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "This version already exists for this device type" });
        }

        // Calculate SHA1 hash of the uploaded file
        const sha1Hash = await calculateSHA1(req.file.path);

        const firmware = {
            deviceType,
            version,
            description,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            sha1: sha1Hash,
            uploadedBy: req.user.username
        };

        const savedFirmware = firmwareManager.addFirmware(firmware);
        res.json(savedFirmware);
    } catch (error) {
        console.error("Error uploading firmware:", error);

        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getDevices,
    getFirmwares,
    getFirmwareById,
    uploadFirmware
};
