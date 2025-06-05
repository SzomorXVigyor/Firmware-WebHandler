const FileSystemStorage = require("./storage/FileSystemStorage");
const MongoGridFSStorage = require("./storage/MongoGridFSStorage");
const PostgreSQLStorage = require("./storage/PostgreSQLStorage");

/**
 * Factory for creating appropriate storage instances based on configuration
 */
class StorageManagerFactory {
    static create(config) {
        const storageType = (config.STORAGE_TYPE || "filesystem").toLowerCase();

        console.log(`Initializing ${storageType} storage...`);

        switch (storageType) {
            case "mongodb":
            case "mongo":
            case "gridfs":
                return new MongoGridFSStorage(config);

            case "postgresql":
            case "postgres":
            case "pg":
                return new PostgreSQLStorage(config);

            case "filesystem":
            case "file":
            case "json":
            default:
                return new FileSystemStorage(config);
        }
    }

    static getAvailableStorageTypes() {
        return ["filesystem", "mongodb", "postgresql"];
    }

    static validateConfig(config) {
        const storageType = (config.STORAGE_TYPE || "filesystem").toLowerCase();

        switch (storageType) {
            case "mongodb":
            case "mongo":
            case "gridfs":
                if (!config.MONGODB_URI) {
                    throw new Error("MONGODB_URI is required for MongoDB storage");
                }
                break;

            case "postgresql":
            case "postgres":
            case "pg":
                if (!config.POSTGRESQL_URI) {
                    throw new Error("POSTGRESQL_URI is required for PostgreSQL storage");
                }
                break;

            case "filesystem":
            case "file":
            case "json":
                // Filesystem storage uses default paths if not specified
                break;

            default:
                throw new Error(`Unsupported storage type: ${storageType}`);
        }

        return true;
    }

    static getStorageInfo(storageType) {
        const type = (storageType || "filesystem").toLowerCase();

        const storageInfo = {
            filesystem: {
                name: "File System",
                description: "JSON-based metadata with local file storage",
                pros: ["Simple setup", "No external dependencies", "Fast for small deployments"],
                cons: ["Not suitable for clustering", "Limited scalability", "No advanced querying"],
                requirements: ["Local file system access", "Write permissions"]
            },
            mongodb: {
                name: "MongoDB with GridFS",
                description: "MongoDB for metadata with GridFS for large file storage",
                pros: ["Scalable", "Advanced querying", "Built-in replication", "Efficient file handling"],
                cons: ["Requires MongoDB", "Higher resource usage", "More complex setup"],
                requirements: ["MongoDB server", "Network connectivity"]
            },
            postgresql: {
                name: "PostgreSQL",
                description: "Relational database with BYTEA file storage or filesystem hybrid",
                pros: ["ACID compliance", "Advanced SQL features", "Full-text search", "Excellent performance"],
                cons: ["Requires PostgreSQL", "File size limitations with BYTEA", "More complex setup"],
                requirements: ["PostgreSQL server", "Network connectivity"]
            }
        };

        return storageInfo[type] || storageInfo.filesystem;
    }
}

module.exports = StorageManagerFactory;
