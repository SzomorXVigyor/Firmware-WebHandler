const express = require("express");
const config = require("./config/config");
const middleware = require("./middleware");
const routes = require("./routes");
const cors = require('cors');

const corsOptions = {
    origin: config.ALLOWED_ORIGINS || false,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const app = express();

app.use(cors(corsOptions));

// Apply middleware
middleware(app);

// Apply routes
routes(app);

// Start server
app.listen(config.PORT, () => {
    console.log(`Firmware Management Server running on port ${config.PORT}`);
    console.log(`Web interface: http://localhost:${config.PORT}`);
    console.log(`API base URL: http://localhost:${config.PORT}/api`);
    console.log(`Core API endpoints:`);
    console.log(`  GET /api/devices - List all device types`);
    console.log(`  GET /api/firmwares - List all firmwares`);
    console.log(`  GET /api/firmwares?device=<device_type> - List firmwares for specific device`);
    console.log(`  GET /api/firmwares/{id} - Get firmware metadata by ID`);
    console.log(`  GET /api/firmwares/{id}/download - Download the firmware file`);
    console.log(`  POST /api/firmware/upload - Upload new firmware (authenticated)`);
    console.log(`  POST /api/login - Authenticate user`);
    console.log(`\nDefault admin credentials: admin / admin123`);
    console.log(`\nCORS enabled for origins: ${config.ALLOWED_ORIGINS || 'none'}`);
});

module.exports = app;
