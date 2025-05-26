/**
 * Statistics Page View
 * Renders the firmware statistics and analytics page
 */

const { generatePageWrapper } = require("./components");

const renderStatisticsPage = (req, res) => {
	const content = `
    <main class="container-fluid flex-grow-1 mt-4">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h2 class="mb-4">
                        <i class="fas fa-chart-bar me-2"></i>
                        Firmware Statistics
                    </h2>

                    <!-- Overview Statistics -->
                    <div class="row mb-4">
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100">
                                <div class="card-body">
                                    <i class="fas fa-microchip fa-3x text-primary mb-3"></i>
                                    <h3 class="card-title" id="totalFirmwares">0</h3>
                                    <p class="card-text">Total Firmwares</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100">
                                <div class="card-body">
                                    <i class="fas fa-layer-group fa-3x text-success mb-3"></i>
                                    <h3 class="card-title" id="deviceTypes">0</h3>
                                    <p class="card-text">Device Types</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100">
                                <div class="card-body">
                                    <i class="fas fa-hdd fa-3x text-info mb-3"></i>
                                    <h3 class="card-title" id="totalSize">0 MB</h3>
                                    <p class="card-text">Total Size</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100">
                                <div class="card-body">
                                    <i class="fas fa-download fa-3x text-warning mb-3"></i>
                                    <h3 class="card-title" id="totalDownloads">0</h3>
                                    <p class="card-text">Total Downloads</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Charts Row -->
                    <div class="row mb-4">
                        <div class="col-lg-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Firmwares by Device Type</h5>
                                </div>
                                <div class="card-body">
                                    <canvas id="deviceTypeChart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Upload Timeline</h5>
                                </div>
                                <div class="card-body">
                                    <canvas id="uploadTimelineChart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Detailed Tables -->
                    <div class="row">
                        <div class="col-lg-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Device Type Summary</h5>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-sm" id="deviceSummaryTable">
                                            <thead>
                                                <tr>
                                                    <th>Device Type</th>
                                                    <th>Versions</th>
                                                    <th>Total Size</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td colspan="3" class="text-center">
                                                        <div class="spinner-border spinner-border-sm" role="status">
                                                            <span class="visually-hidden">Loading...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Recent Activity</h5>
                                </div>
                                <div class="card-body">
                                    <div id="recentActivity">
                                        <div class="text-center py-3">
                                            <div class="spinner-border spinner-border-sm" role="status">
                                                <span class="visually-hidden">Loading...</span>
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
		title: "Firmware Management Server - Statistics",
		activePage: "statistics",
		includeChartJs: true,
		pageScripts: ["/js/statistics.js"],
	});

	res.send(html);
};

module.exports = {
	renderStatisticsPage,
};
