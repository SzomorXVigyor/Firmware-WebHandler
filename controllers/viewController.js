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
            transition: transform 0.2s;
        }
        .firmware-card:hover {
            transform: translateY(-2px);
        }
        .version-badge {
            font-family: 'Courier New', monospace;
        }
        .upload-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-microchip me-2"></i>
                Firmware Manager
            </a>
            <div class="navbar-nav ms-auto">
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
                                <input type="text" class="form-control" id="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required>
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
                        <input type="file" class="form-control" id="firmwareFile" required>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload me-2"></i>Upload Firmware
                    </button>
                </form>
            </div>
        </div>

        <!-- Device Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="mb-0">Available Firmwares</h5>
                    </div>
                    <div class="col-md-6">
                        <select class="form-select" id="deviceFilter">
                            <option value="">All Devices</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Firmwares List -->
        <div id="firmwaresList">
            <!-- Firmwares will be loaded here -->
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>
    `);
};

module.exports = {
    renderHomePage
};
