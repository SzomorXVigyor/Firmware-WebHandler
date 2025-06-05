/**
 * Upload Page View
 * Renders the firmware upload page for authenticated administrators
 */

const { generatePageWrapper } = require("./components");

const renderUploadPage = (req, res) => {
    const content = `
    <main class="container-fluid flex-grow-1 mt-4">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header upload-section">
                            <h4 class="mb-0">
                                <i class="fas fa-upload me-2"></i>
                                Upload New Firmware
                            </h4>
                        </div>
                        <div class="card-body">
                            <form id="uploadForm" enctype="multipart/form-data">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="deviceType" class="form-label">Device Type</label>
                                            <input type="text" class="form-control" id="deviceType" required
                                                   placeholder="e.g., ESP32-DevKit, Arduino-Uno">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="version" class="form-label">Version (SemVer)</label>
                                            <input type="text" class="form-control version-badge" id="version" required
                                                   placeholder="e.g., 1.0.0, 2.1.3">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="description" class="form-label">Description</label>
                                    <textarea class="form-control" id="description" rows="4" required
                                              placeholder="Describe the changes, fixes, or new features in this firmware version"></textarea>
                                </div>
                                <div class="mb-4">
                                    <label for="firmwareFile" class="form-label">Firmware File</label>
                                    <input type="file" class="form-control" id="firmwareFile" required
                                           accept="*">
                                    <div class="form-text" id="supported-formats">Supported formats: all)</div>
                                </div>
                                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button type="button" class="btn btn-outline-secondary me-md-2" onclick="resetForm()">
                                        <i class="fas fa-times me-2"></i>Reset
                                    </button>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-upload me-2"></i>Upload Firmware
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Recent Uploads -->
                    <div class="card mt-4">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-history me-2"></i>
                                Recent Uploads
                            </h5>
                        </div>
                        <div class="card-body">
                            <div id="recentUploads">
                                <div class="text-center py-3">
                                    <div class="spinner-border spinner-border-sm" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="mt-2 text-muted">Loading recent uploads...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>`;

    const html = generatePageWrapper(content, {
        title: "Firmware Management Server - Upload",
        activePage: "upload",
        pageCSS: ["/css/upload.css"],
        pageScripts: ["/js/upload.js"],
    });

    res.send(html);
};

module.exports = {
    renderUploadPage,
};
