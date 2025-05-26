const express = require('express');
const router = express.Router();
const firmwareController = require('../controllers/firmwareController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/devices
router.get('/devices', firmwareController.getDevices);

// GET /api/firmwares
router.get('/firmwares', firmwareController.getFirmwares);

// GET /api/firmware/:id
router.get('/firmware/:id', firmwareController.getFirmwareById);

// POST /api/firmware/upload
router.post('/firmware/upload', authenticateToken, upload.single('firmware'), firmwareController.uploadFirmware);

module.exports = router;