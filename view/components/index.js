/**
 * Components Index
 * Central export for all reusable components
 */

const { generateHtmlHead } = require("./head");
const { generateNavigation } = require("./navigation");
const { generateLoginModal } = require("./modals");
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
        title = "Firmware Management Server",   // HTML title
        activePage = "",                        // Active navigation page
        includeScripts = [],                    // Additional scripts to include in header
        pageCSS = [],                           // Additional CSS files to include in header
        pageModals = [],                        // Array of functions returning server side rendered modals (use it for server-side data or resuable modals)
        pageScripts = [],                       // Additional scripts to include at the end of the body
    } = options;

    const includedModals = [generateLoginModal(), ...pageModals.map(fn => fn())].join("\n    ");

    return `${generateHtmlHead(title, pageCSS, includeScripts)}
    ${generateNavigation(activePage)}

    ${content}

    ${includedModals}
    ${generateFooter()}
    ${generateScripts(pageScripts)}`;
};

module.exports = {
    // Main wrapper
    generatePageWrapper,
};
