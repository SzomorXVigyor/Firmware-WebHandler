const express = require("express");
const router = express.Router();
const views = require("../view/index");

// Routes
router.get("/", views.renderHomePage);
router.get("/firmwares", views.renderFirmwaresPage);
router.get("/statistics", views.renderStatisticsPage);
router.get("/upload", views.renderUploadPage);
router.get("/user", views.renderUserPage);

module.exports = router;
