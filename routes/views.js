const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");

// GET /
router.get("/", viewController.renderHomePage);

module.exports = router;
