const multer = require("multer");
const config = require("../config/config");

// Use memory storage since we handle file storage in the storage layer
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        // Accept all file types for firmware uploads
        cb(null, true);
    }
});

module.exports = upload;
