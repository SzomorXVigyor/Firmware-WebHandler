const express = require("express");
const fs = require("fs");
const config = require("./config/config");
const middleware = require("./middleware");
const routes = require("./routes");

const app = express();

// Apply middleware
middleware(app);

// Apply routes
routes(app);

// Start server
app.listen(config.PORT, () => {
    console.log(`Firmware Management Server running on port ${config.PORT}`);
    console.log(`Web interface: http://localhost:${config.PORT}`);
    console.log(`Core API endpoints:`);
    console.log(`  GET /api/devices - List all device types`);
    console.log(`  GET /api/firmwares - List all firmwares`);
    console.log(`  GET /api/firmwares?device=<device_type> - List firmwares for specific device`);
    console.log(`  GET /api/firmwares/{id} - Get firmware metadata by ID`);
    console.log(`  GET /api/firmwares/{id}/download - Download the firmware file`);
    console.log(`  POST /api/firmware/upload - Upload new firmware (authenticated)`);
    console.log(`  POST /api/login - Authenticate user`);
    console.log(`\nDefault admin credentials: admin / admin123`);
});

module.exports = app;
