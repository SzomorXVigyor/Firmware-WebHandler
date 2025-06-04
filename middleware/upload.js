const multer = require("multer");
const config = require("../config/config");

// Use memory storage since we handle file storage in the storage layer
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        // Accept only enabled file extensions
        const allowedExtensions = config.ALLOWED_FILE_TYPES || [];
        const fileExtension = file.originalname.split(".").pop().toLowerCase();
        if (allowedExtensions.includes(`.${fileExtension}`)) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    },
});

module.exports = upload;
