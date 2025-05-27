/**
 * Home Page View
 * Renders the main landing page for the firmware management system
 */

const { generatePageWrapper } = require("./components");

const renderHomePage = (req, res) => {
	const content = `
    <main class="container-fluid flex-grow-1 mt-4">
        <div class="container">
            <div class="row">
                <div class="col-12 text-center">
                    <div class="hero-section py-5">
                        <i class="fas fa-microchip fa-5x text-primary mb-4"></i>
                        <h1 class="display-4 mb-3">Firmware Management Server</h1>
                        <p class="lead mb-4">Secure firmware distribution and version management system</p>
                        <div class="row justify-content-center">
                            <div class="col-md-8">
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <div class="card h-100 text-center d-flex">
                                            <div class="card-body d-flex flex-column">
                                                <i class="fas fa-microchip fa-2x text-primary mb-3"></i>
                                                <h5>Browse Firmwares</h5>
                                                <p class="card-text flex-grow-1">View and download available firmware versions for your devices.</p>
                                                <a href="/firmwares" class="btn btn-primary mt-auto">View Firmwares</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <div class="card h-100 text-center d-flex">
                                            <div class="card-body d-flex flex-column">
                                                <i class="fas fa-chart-bar fa-2x text-success mb-3"></i>
                                                <h5>View Statistics</h5>
                                                <p class="card-text flex-grow-1">Monitor firmware distribution and usage statistics.</p>
                                                <a href="/statistics" class="btn btn-success mt-auto">View Stats</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <div class="card h-100 text-center d-flex" id="uploadCard">
                                            <div class="card-body d-flex flex-column">
                                                <i class="fas fa-upload fa-2x text-warning mb-3"></i>
                                                <h5>Upload Firmware</h5>
                                                <p class="card-text flex-grow-1">Upload new firmware versions (Admin only).</p>
                                                <button class="btn btn-warning mt-auto" id="homeUploadBtn" onclick="checkAuthAndRedirect('/upload')">Upload Firmware</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>`;

	const html = generatePageWrapper(content, {
		title: "Firmware Management Server - Home",
		activePage: "home",
		pageScripts: ["/js/home.js"],
	});

	res.send(html);
};

module.exports = {
	renderHomePage,
};
