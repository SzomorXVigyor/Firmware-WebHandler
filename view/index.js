/**
 * Views Index
 * Central export for all page views
 */

const { renderHomePage } = require("./home");
const { renderFirmwaresPage } = require("./firmwares");
const { renderUploadPage } = require("./upload");
const { renderStatisticsPage } = require("./statistics");

module.exports = {
	renderHomePage,
	renderFirmwaresPage,
	renderUploadPage,
	renderStatisticsPage,
};
