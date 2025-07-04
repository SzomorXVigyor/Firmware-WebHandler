module.exports = {
    // Server configuration
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB

    // Storage configuration
    STORAGE_TYPE: process.env.STORAGE_TYPE || "filesystem", // "filesystem", "mongodb", or "postgresql"

    // FileSystem storage configuration
    DATA_DIR: process.env.DATA_DIR || "./data/",

    // MongoDB storage configuration
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017",
    MONGODB_DB: process.env.MONGODB_DB || "firmware_manager",

    // GridFS configuration
    GRIDFS_BUCKET: process.env.GRIDFS_BUCKET || "firmwares",
    GRIDFS_CHUNK_SIZE: parseInt(process.env.GRIDFS_CHUNK_SIZE) || 1024 * 1024, // 1MB chunks

    // PostgreSQL storage configuration
    POSTGRESQL_URI: process.env.POSTGRESQL_URI || "postgresql://postgres:password@localhost:5432/firmware_manager",
    PG_MAX_CONNECTIONS: process.env.PG_MAX_CONNECTIONS || "20",
    PG_IDLE_TIMEOUT: process.env.PG_IDLE_TIMEOUT || "30000",
    PG_CONNECTION_TIMEOUT: process.env.PG_CONNECTION_TIMEOUT || "2000",
    PG_SSL: process.env.PG_SSL || "false",
    PG_STORE_FILES_IN_DB: process.env.PG_STORE_FILES_IN_DB || "false", // "true" = BYTEA, "false" = filesystem

    // Allowed Upload File Types
    ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || ".bin,.hex,.elf,.ino,.cpp,.c,.h").split(",").map((type) => type.trim()),

    // Security
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,

    // CORS configuration
    ALLOWED_ORIGINS: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim() !== "" ? process.env.CORS_ORIGIN.split(",").map((type) => type.trim()) : false,

    // Localization
    LOCALE: process.env.LOCALE || "en-US",

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || "info",

    // Function for get client relevant config
    getClientConfig: function () {
        return {
            MAX_FILE_SIZE: this.MAX_FILE_SIZE,
            LOG_LEVEL: this.LOG_LEVEL,
            ALLOWED_FILE_TYPES: this.ALLOWED_FILE_TYPES,
            LOCALE: this.LOCALE,
        };
    },
};
