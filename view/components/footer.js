/**
 * Footer Component
 * Generates the page footer with server status and version info
 */

const generateFooter = (options = {}) => {
	const { version = process.env.npm_package_version || "Unknown Version" } = options;

	return `
    <!-- Footer -->
    <footer class="bg-dark text-light py-4 mt-auto">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-microchip me-2"></i>Firmware Management Server</h6>
                    <p class="mb-0">Secure firmware distribution and version management system.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <div class="d-flex justify-content-md-end align-items-center">
                        <span class="me-3">Server Status:</span>
                        <div id="footerServerStatus">
                            <small class="text-warning">
                                <i class="fas fa-spinner fa-spin me-1"></i>Checking...
                            </small>
                        </div>
                    </div>
                    <p class="mb-0">Version: ${version}</p>
                </div>
            </div>
        </div>
    </footer>`;
};

module.exports = {
	generateFooter,
};
