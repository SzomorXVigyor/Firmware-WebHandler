/**
 * Firmwares Page View
 * Renders the firmware listing and management page
 */

const { generatePageWrapper } = require("./components");

const renderFirmwaresPage = (req, res) => {
	const content = `
    <main class="container-fluid flex-grow-1 mt-4">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h2 class="mb-4">
                        <i class="fas fa-microchip me-2"></i>
                        Available Firmwares
                    </h2>

                    <!-- Device Filter -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-4">
                                    <h5 class="mb-0">Filter & View Options</h5>
                                </div>
                                <div class="col-md-4">
                                    <select class="form-select" id="deviceFilter">
                                        <option value="">All Devices</option>
                                    </select>
                                </div>
                                <div class="col-md-4 text-end">
                                    <div class="btn-group" role="group">
                                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="loadFirmwares()" title="Refresh List">
                                            <i class="fas fa-sync-alt"></i>
                                        </button>
                                        <button type="button" class="btn btn-outline-info btn-sm" onclick="toggleView()" title="Toggle View" id="viewToggle">
                                            <i class="fas fa-th-list"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Firmwares List -->
                    <div id="firmwaresList">
                        <div class="text-center py-5">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 text-muted">Loading firmwares...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>`;

	const html = generatePageWrapper(content, {
		title: "Firmware Management Server - Firmwares",
		activePage: "firmwares",
		includeConfirmModal: true,
		pageScripts: ["/js/firmwares.js"],
	});

	res.send(html);
};

module.exports = {
	renderFirmwaresPage,
};
