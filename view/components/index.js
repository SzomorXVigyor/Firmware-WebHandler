/**
 * Components Index
 * Central export for all reusable components
 */

const { generateHtmlHead } = require("./head");
const { generateNavigation, generateUploadNavigation } = require("./navigation");
const { generateLoginModal, generateConfirmModal } = require("./modals");
const { generateFooter } = require("./footer");
const { generateScripts } = require("./scripts");

/**
 * Main page wrapper that combines all components
 * @param {string} content - The main page content HTML
 * @param {object} options - Configuration options
 * @returns {string} Complete HTML page
 */
const generatePageWrapper = (content, options = {}) => {
    const {
        title = "Firmware Management Server",
        activePage = "",
        isUploadPage = false,
        pageScripts = [],
        includeChartJs = false,
        includeConfirmModal = false,
    } = options;

    const navigation = isUploadPage ? generateUploadNavigation(activePage) : generateNavigation(activePage);

    const modals = [generateLoginModal(), ...(includeConfirmModal ? [generateConfirmModal()] : [])].join("\n    ");

    return `${generateHtmlHead(title, includeChartJs)}
    ${navigation}

    ${content}

    ${modals}
    ${generateFooter()}
    ${generateScripts(pageScripts)}`;
};

module.exports = {
    // Individual components
    generateHtmlHead,
    generateNavigation,
    generateUploadNavigation,
    generateLoginModal,
    generateConfirmModal,
    generateFooter,
    generateScripts,

    // Main wrapper
    generatePageWrapper,
};
