/**
 * Scripts Component
 * Generates script includes for pages
 */

const generateScripts = (pageScripts = []) => {
    const commonScripts = ["https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js", "/js/config.js", "/js/auth.js", "/js/common.js"];

    const allScripts = [...commonScripts, ...pageScripts];

    return `${allScripts.map((script) => `    <script src="${script}"></script>`).join("\n")}\n</body>\n</html>`;
};

module.exports = {
    generateScripts,
};
