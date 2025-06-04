/**
 * HTML Head Component
 * Generates the HTML head section with title and required CSS/JS includes
 */

const generateHtmlHead = (title = "Firmware Management Server", pageCSS = [], includeChartJs = false) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/css/common.css" rel="stylesheet">
    ${pageCSS.map(css => `<link href="${css}" rel="stylesheet">`).join("\n    ")}
    ${includeChartJs ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ""}
</head>
<body class="d-flex flex-column min-vh-100">`;
};

module.exports = {
    generateHtmlHead,
};
