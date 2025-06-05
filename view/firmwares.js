/**
 * Firmwares Page View
 * Renders the firmware listing and management page with advanced filters
 */

const { generatePageWrapper } = require("./components");
const { generateConfirmModal } = require("./components/modals");

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

                    <!-- Advanced Filter Panel -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-filter me-2"></i>
                                    Advanced Filters & Search
                                </h5>
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
                        <div class="card-body">
                            <!-- Search Bar Row -->
                            <div class="row mb-3">
                                <div class="col-md-8">
                                    <label for="globalSearch" class="form-label">Search Firmwares</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-search"></i>
                                        </span>
                                        <input type="text" class="form-control" id="globalSearch" placeholder="Search by device type, version, or description..." aria-label="Search firmwares">
                                        <button class="btn btn-outline-secondary" type="button" onclick="clearSearch()" title="Clear search">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Quick Actions</label>
                                    <div class="d-grid">
                                        <button type="button" class="btn btn-outline-warning" onclick="clearAllFilters()">
                                            <i class="fas fa-eraser me-1"></i>
                                            Clear All Filters
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Filter Options Row -->
                            <div class="row">
                                <div class="col-md-3">
                                    <label for="deviceFilter" class="form-label">Device Type</label>
                                    <select class="form-select" id="deviceFilter">
                                        <option value="">All Devices</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label for="versionFilter" class="form-label">Version Filter</label>
                                    <input type="text" class="form-control" id="versionFilter" placeholder="e.g., 2.1.*, >=1.0.0" title="Version pattern or range">
                                </div>
                                <div class="col-md-3">
                                    <label for="sortFilter" class="form-label">Sort By</label>
                                    <select class="form-select" id="sortFilter">
                                        <option value="version-desc">Version (Highest)</option>
                                        <option value="version-asc">Version (Lowest)</option>
                                        <option value="date-desc">Upload Date (Newest)</option>
                                        <option value="date-asc">Upload Date (Oldest)</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Version Type</label>
                                    <div class="d-flex flex-column">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="stableOnlyFilter" checked>
                                            <label class="form-check-label" for="stableOnlyFilter">
                                                <i class="fas fa-shield-alt text-success me-1"></i>
                                                Stable versions only
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Active Filters Display -->
                            <div id="activeFilters" class="mt-3" style="display: none;">
                                <div class="d-flex align-items-center flex-wrap">
                                    <span class="badge bg-secondary me-1 mb-1 p-2">Active Filters:</span>
                                    <div id="activeFilterTags" class="d-flex flex-wrap gap-1"></div>
                                </div>
                            </div>

                            <!-- Results Summary -->
                            <div id="resultsSummary" class="mt-3 text-muted" style="display: none;">
                                <small id="resultsCount"></small>
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
        pageModals: [generateConfirmModal],
        pageScripts: ["/js/firmwares.js"],
    });

    res.send(html);
};

module.exports = {
    renderFirmwaresPage,
};
