const storageManager = require("../models/StorageManager");

const healthCheck = async (req, res) => {
    try {
        const health = await storageManager.healthCheck();

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

module.exports = {
    healthCheck,
};
