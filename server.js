const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const semver = require('semver');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const UPLOAD_DIR = './data/uploads';
const DATA_FILE = './data/firmware_data.json';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/downloads', express.static(UPLOAD_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE }
});

// Data management
class FirmwareManager {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return {
            users: [{
                id: '1',
                username: 'admin',
                password: '$2a$12$uxVJ1DzzFDanM4ARDrbIR.E2WDwK.LtsyanVIWp/xhzkoaiTSuWZ2',
            }],
            firmwares: []
        };
    }

    saveData() {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    addFirmware(firmware) {
        firmware.id = uuidv4();
        firmware.uploadDate = new Date().toISOString();
        this.data.firmwares.push(firmware);
        this.saveData();
        return firmware;
    }

    getFirmwaresByDevice(deviceType) {
        return this.data.firmwares
            .filter(f => f.deviceType === deviceType)
            .sort((a, b) => semver.rcompare(a.version, b.version));
    }

    getAllFirmwares() {
        return this.data.firmwares.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    getDeviceTypes() {
        const types = [...new Set(this.data.firmwares.map(f => f.deviceType))];
        return types.sort();
    }

    findUser(username) {
        return this.data.users.find(u => u.username === username);
    }
}

const firmwareManager = new FirmwareManager();

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Auth routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = firmwareManager.findUser(username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
});

// API routes
app.get('/api/devices', (req, res) => {
    const devices = firmwareManager.getDeviceTypes();
    res.json(devices);
});

app.get('/api/firmwares', (req, res) => {
    const { device } = req.query;
    
    if (device) {
        const firmwares = firmwareManager.getFirmwaresByDevice(device);
        res.json(firmwares);
    } else {
        const firmwares = firmwareManager.getAllFirmwares();
        res.json(firmwares);
    }
});

app.get('/api/firmware/:id', (req, res) => {
    const firmware = firmwareManager.data.firmwares.find(f => f.id === req.params.id);
    if (!firmware) {
        return res.status(404).json({ error: 'Firmware not found' });
    }
    res.json(firmware);
});

app.post('/api/firmware/upload', authenticateToken, upload.single('firmware'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { deviceType, version, description } = req.body;

    if (!deviceType || !version || !description) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Device type, version, and description are required' });
    }

    if (!semver.valid(version)) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid version format. Must follow semantic versioning (e.g., 1.0.0)' });
    }

    // Check if version already exists for this device
    const existingFirmware = firmwareManager.data.firmwares.find(
        f => f.deviceType === deviceType && f.version === version
    );

    if (existingFirmware) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'This version already exists for this device type' });
    }

    const firmware = {
        deviceType,
        version,
        description,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedBy: req.user.username
    };

    const savedFirmware = firmwareManager.addFirmware(firmware);
    res.json(savedFirmware);
});

// Web interface route
app.get('/', (req, res) => {
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
                Firmware Management
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
    <script>
        let authToken = localStorage.getItem('authToken');
        let currentUser = localStorage.getItem('currentUser');

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            updateAuthUI();
            loadDevices();
            loadFirmwares();
            
            document.getElementById('deviceFilter').addEventListener('change', loadFirmwares);
            document.getElementById('uploadForm').addEventListener('submit', uploadFirmware);
        });

        function updateAuthUI() {
            const loginBtn = document.getElementById('loginBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            const uploadSection = document.getElementById('uploadSection');

            if (authToken) {
                loginBtn.classList.add('d-none');
                logoutBtn.classList.remove('d-none');
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>Logout (' + currentUser + ')';
                uploadSection.classList.remove('d-none');
            } else {
                loginBtn.classList.remove('d-none');
                logoutBtn.classList.add('d-none');
                uploadSection.classList.add('d-none');
            }
        }

        function toggleAuth() {
            if (authToken) {
                logout();
            } else {
                new bootstrap.Modal(document.getElementById('loginModal')).show();
            }
        }

        async function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    authToken = data.token;
                    currentUser = data.username;
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('currentUser', currentUser);
                    updateAuthUI();
                    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                    document.getElementById('loginForm').reset();
                    showAlert('Login successful!', 'success');
                } else {
                    showAlert(data.error, 'danger');
                }
            } catch (error) {
                showAlert('Login failed', 'danger');
            }
        }

        function logout() {
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            updateAuthUI();
            showAlert('Logged out successfully', 'info');
        }

        async function loadDevices() {
            try {
                const response = await fetch('/api/devices');
                const devices = await response.json();
                
                const deviceFilter = document.getElementById('deviceFilter');
                deviceFilter.innerHTML = '<option value="">All Devices</option>';
                
                devices.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device;
                    option.textContent = device;
                    deviceFilter.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading devices:', error);
            }
        }

        async function loadFirmwares() {
            try {
                const deviceType = document.getElementById('deviceFilter').value;
                const url = deviceType ? '/api/firmwares?device=' + encodeURIComponent(deviceType) : '/api/firmwares';
                
                const response = await fetch(url);
                const firmwares = await response.json();
                
                displayFirmwares(firmwares);
            } catch (error) {
                console.error('Error loading firmwares:', error);
            }
        }

        function displayFirmwares(firmwares) {
            const container = document.getElementById('firmwaresList');
            
            if (firmwares.length === 0) {
                container.innerHTML = '<div class="text-center py-5"><h5>No firmwares available</h5></div>';
                return;
            }

            const grouped = firmwares.reduce((acc, firmware) => {
                if (!acc[firmware.deviceType]) {
                    acc[firmware.deviceType] = [];
                }
                acc[firmware.deviceType].push(firmware);
                return acc;
            }, {});

            container.innerHTML = Object.keys(grouped).map(deviceType => {
                const deviceFirmwares = grouped[deviceType];
                return \`
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-microchip me-2"></i>
                                \${deviceType}
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                \${deviceFirmwares.map(firmware => \`
                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card firmware-card h-100">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <span class="badge bg-success version-badge">\${firmware.version}</span>
                                                    <small class="text-muted">\${formatDate(firmware.uploadDate)}</small>
                                                </div>
                                                <p class="card-text">\${firmware.description}</p>
                                                <div class="mt-auto">
                                                    <div class="d-flex justify-content-between align-items-center">
                                                        <small class="text-muted">\${formatFileSize(firmware.size)}</small>
                                                        <a href="/downloads/\${firmware.filename}" class="btn btn-outline-primary btn-sm" download="\${firmware.originalName}">
                                                            <i class="fas fa-download me-1"></i>Download
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        async function uploadFirmware(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('deviceType', document.getElementById('deviceType').value);
            formData.append('version', document.getElementById('version').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('firmware', document.getElementById('firmwareFile').files[0]);

            try {
                const response = await fetch('/api/firmware/upload', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + authToken },
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Firmware uploaded successfully!', 'success');
                    document.getElementById('uploadForm').reset();
                    loadDevices();
                    loadFirmwares();
                } else {
                    showAlert(data.error, 'danger');
                }
            } catch (error) {
                showAlert('Upload failed', 'danger');
            }
        }

        function showAlert(message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = \`alert alert-\${type} alert-dismissible fade show\`;
            alertDiv.innerHTML = \`
                \${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            \`;
            
            document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
            
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }

        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString();
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    </script>
</body>
</html>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`Firmware Management Server running on port ${PORT}`);
    console.log(`Web interface: http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET /api/devices - List all device types`);
    console.log(`  GET /api/firmwares - List all firmwares`);
    console.log(`  GET /api/firmwares?device=<device_type> - List firmwares for specific device`);
    console.log(`  POST /api/firmware/upload - Upload new firmware (authenticated)`);
    console.log(`  POST /api/login - Authenticate user`);
    console.log(`\nDefault admin credentials: admin / admin123`);
});