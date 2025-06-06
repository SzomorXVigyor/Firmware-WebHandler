const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { authenticateToken, authenticateAdminToken } = require("../middleware/auth");
const authController = require("../controllers/authController");
const firmwareController = require("../controllers/firmwareController");
const systemController = require("../controllers/systemController");
const userController = require("../controllers/userController");

// Public routes
router.get("/devices", firmwareController.getDevices);
router.get("/firmwares", firmwareController.getFirmwares);
router.get("/firmware/:id", firmwareController.getFirmwareById);
router.get("/firmware/:id/download", firmwareController.downloadFirmware);
router.get("/firmwares/stats", firmwareController.getFirmwareStats);
router.get("/health", systemController.healthCheck);

// Authentication
router.post("/login", authController.login);

// Protected routes
router.post("/firmware/upload", authenticateToken, upload.single("firmware"), firmwareController.uploadFirmware);
router.put("/firmware/:id", authenticateToken, firmwareController.updateFirmware);
router.delete("/firmware/:id", authenticateToken, firmwareController.deleteFirmware);
router.get("/user/profile", authenticateToken, userController.getUser);
router.get("/users", authenticateAdminToken, userController.getAllUsers);
router.put("/user/change-password", authenticateToken, userController.changePassword);
router.post("/user", authenticateAdminToken, userController.createUser);
router.put("/user/:username", authenticateAdminToken, userController.updateUser);
router.delete("/user/:username", authenticateAdminToken, userController.deleteUser);

module.exports = router;
