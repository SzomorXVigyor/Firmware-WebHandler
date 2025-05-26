const renderHomePage = (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firmware Management Server</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .firmware-card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .firmware-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .version-badge {
            font-family: 'Courier New', monospace;
        }
        .upload-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .sha1-hash {
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .sha1-hash:hover {
            background-color: rgba(0,0,0,0.1);
            border-radius: 3px;
            padding: 2px 4px;
        }
        .stats-card .row > div {
            border-right: 1px solid #dee2e6;
        }
        .stats-card .row > div:last-child {
            border-right: none;
        }
        .toast {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .toast.show {
            opacity: 1;
        }
        .server-status-online {
            color: #28a745;
        }
        .server-status-offline {
            color: #dc3545;
        }
        .btn-group .btn {
            border-radius: 0;
        }
        .btn-group .btn:first-child {
            border-top-left-radius: 0.375rem;
            border-bottom-left-radius: 0.375rem;
        }
        .btn-group .btn:last-child {
            border-top-right-radius: 0.375rem;
            border-bottom-right-radius: 0.375rem;
        }
    </style>
</head>
<body class="d-flex flex-column min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-microchip me-2"></i>
                Firmware Manager
            </a>
            <!-- Server status will be inserted here by JavaScript -->
            <div class="navbar-nav ms-auto">
                <button class="btn btn-outline-light me-2" id="refreshBtn" title="Refresh all data">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="btn btn-outline-light" id="loginBtn" onclick="toggleAuth()">
                    <i class="fas fa-sign-in-alt me-1"></i>Login
                </button>
                <button class="btn btn-outline-light d-none" id="logoutBtn" onclick="logout()">
                    <i class="fas fa-sign-out-alt me-1"></i>Logout
                </button>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <!-- Login Modal -->
        <div class="modal fade" id="loginModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Administrator Login</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" class="form-control" id="username" required autocomplete="username">
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required autocomplete="current-password">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="login()">Login</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Section -->
        <div class="card mb-4 d-none" id="uploadSection">
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
                        <textarea class="form-control" id="description" rows="3" required
                                  placeholder="Describe the changes, fixes, or new features in this firmware version"></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="firmwareFile" class="form-label">Firmware File</label>
                        <input type="file" class="form-control" id="firmwareFile" required
                               accept=".bin,.hex,.elf,.ino,.cpp,.c,.h">
                        <div class="form-text">Supported formats: .bin, .hex, .elf, .ino, .cpp, .c, .h</div>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload me-2"></i>Upload Firmware
                    </button>
                </form>
            </div>
        </div>

        <!-- Statistics Card (will be dynamically inserted here) -->

        <main class="container flex-grow-1 mt-4">

        <!-- Device Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <h5 class="mb-0">Available Firmwares</h5>
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

    </main>

    <!-- Footer -->
    <footer class="bg-dark text-light py-4 mt-auto">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-microchip me-2"></i>Firmware Management Server</h6>
                    <p class="mb-0">Secure firmware distribution and version management system.</p>
                    <p class="mb-0">Version: ${process.env.npm_package_version}</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <div class="d-flex justify-content-md-end align-items-center">
                        <span class="me-3 text">Server Status:</span>
                        <div id="footerServerStatus">
                            <small class="text-warning">
                                <i class="fas fa-spinner fa-spin me-1"></i>Checking...
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>
    `);
};

module.exports = {
    renderHomePage
};
