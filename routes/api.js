const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { authenticateToken } = require("../middleware/auth");
const authController = require("../controllers/authController");
const firmwareController = require("../controllers/firmwareController");

// Public routes
router.get("/devices", firmwareController.getDevices);
router.get("/firmwares", firmwareController.getFirmwares);
router.get("/firmware/:id", firmwareController.getFirmwareById);
router.get("/firmware/:id/download", firmwareController.downloadFirmware);
router.get("/firmwares/stats", firmwareController.getFirmwareStats);
router.get("/health", firmwareController.healthCheck);

// Authentication
router.post("/login", authController.login);

// Protected routes
router.post("/firmware/upload", authenticateToken, upload.single("firmware"), firmwareController.uploadFirmware);
router.put("/firmware/:id", authenticateToken, firmwareController.updateFirmware);
router.delete("/firmware/:id", authenticateToken, firmwareController.deleteFirmware);

module.exports = router;
