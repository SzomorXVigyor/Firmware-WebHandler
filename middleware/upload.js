const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: config.MAX_FILE_SIZE }
});

module.exports = upload;