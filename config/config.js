module.exports = {
    // Server configuration
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || (100 * 1024 * 1024), // 100MB

    // Storage configuration
    STORAGE_TYPE: process.env.STORAGE_TYPE || "filesystem", // "filesystem", "mongodb", or "postgresql"

    // FileSystem storage configuration
    UPLOAD_DIR: process.env.UPLOAD_DIR || "./data/uploads",
    DATA_FILE: process.env.DATA_FILE || "./data/firmware_data.json",

    // MongoDB storage configuration
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017",
    MONGODB_DB: process.env.MONGODB_DB || "firmware_manager",

    // GridFS configuration
    GRIDFS_BUCKET: process.env.GRIDFS_BUCKET || "firmwares",
    GRIDFS_CHUNK_SIZE: parseInt(process.env.GRIDFS_CHUNK_SIZE) || (1024 * 1024), // 1MB chunks

    // PostgreSQL storage configuration
    POSTGRESQL_URI: process.env.POSTGRESQL_URI || "postgresql://postgres:password@localhost:5432/firmware_manager",
    PG_MAX_CONNECTIONS: process.env.PG_MAX_CONNECTIONS || "20",
    PG_IDLE_TIMEOUT: process.env.PG_IDLE_TIMEOUT || "30000",
    PG_CONNECTION_TIMEOUT: process.env.PG_CONNECTION_TIMEOUT || "2000",
    PG_SSL: process.env.PG_SSL || "false",
    PG_STORE_FILES_IN_DB: process.env.PG_STORE_FILES_IN_DB || "false", // "true" = BYTEA, "false" = filesystem

    // Security
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

    // CORS configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || "info"
};
