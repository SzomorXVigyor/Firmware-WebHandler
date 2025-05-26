module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    UPLOAD_DIR: "./data/uploads",
    DATA_FILE: "./data/firmware_data.json"
};
