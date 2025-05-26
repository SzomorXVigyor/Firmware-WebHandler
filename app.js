const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');
const middleware = require('./middleware');
const routes = require('./routes');

const app = express();

// Ensure upload directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// Apply middleware
middleware(app);

// Apply routes
routes(app);

// Start server
app.listen(config.PORT, () => {
    console.log(`Firmware Management Server running on port ${config.PORT}`);
    console.log(`Web interface: http://localhost:${config.PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET /api/devices - List all device types`);
    console.log(`  GET /api/firmwares - List all firmwares`);
    console.log(`  GET /api/firmwares?device=<device_type> - List firmwares for specific device`);
    console.log(`  POST /api/firmware/upload - Upload new firmware (authenticated)`);
    console.log(`  POST /api/login - Authenticate user`);
    console.log(`\nDefault admin credentials: admin / admin123`);
});

module.exports = app;