<h1 align="center">🔧 A Simple Firmware Management Server </h1>
<p align="center">
<img alt="Node Version" src="https://img.shields.io/badge/Node.js-v18+-green">
<img alt="Express" src="https://img.shields.io/badge/Express-4.18+-blue">
<img alt="Bootstrap" src="https://img.shields.io/badge/Bootstrap-5.3-purple">
<img alt="Storage Types" src="https://img.shields.io/badge/Storage-FileSystem%20%7C%20MongoDB%20%7C%20PostgreSQL-purple">
<img alt="Latest release" src="https://img.shields.io/github/v/release/SzomorXVigyor/Firmware-WebManager">
<img alt="License" src="https://img.shields.io/badge/License-MIT-yellow">

A comprehensive web-based firmware management system with REST API for IoT devices, microcontrollers, and embedded systems. Easily manage, version, and distribute firmware updates across multiple hardware platforms. Support multiple simple or high availability, scalable datastore technologies. Designed for IoT and embedded devices OTA upgrades, but it can also function as a simple release manager.
</p>

## ✨ Features


### 🚀 **Modern Architecture**
- **Async-first design** with Promise-based API
- **Pluggable storage backends** with unified interface
- **Clean dependency injection** and factory pattern
- **Memory-efficient file handling** with streams

### 🔐 **Secure by Design**
- JWT-based authentication for firmware uploads
- Protected admin interface with role-based access
- Public API for device firmware queries and downloads
- Environment-based configuration

### 📱 **Multi-Device Support**
- Manage firmware for unlimited device types
- Semantic versioning (SemVer) compliance
- Version conflict prevention and validation

### 🌐 **Modern Web Interface**
- Responsive Bootstrap-based UI
- Drag-and-drop file uploads
- Real-time firmware browsing and filtering
- Mobile-friendly design

### 🌐 **RESTful API**
- Complete REST API for device integration
- JSON responses with comprehensive metadata
- Direct binary file downloads
- Hardware-friendly endpoints

### 💾 **Multiple Storage Options**
- **FileSystem**: Simple JSON + file storage
- **MongoDB GridFS**: Scalable document database
- **PostgreSQL**: Enterprise-grade relational storage (NOT IMPLEMENTED YET)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and yarn
- At least 1GB free disk space for firmware storage

### Installation
```bash
git clone https://github.com/SzomorXVigyor/Firmware-WebManager.git
cd Firmware-WebManager
yarn install
cp .env.example .env
```

### Choose Storage Backend

> [!NOTE]
> Use **.env.example** as a template.

```bash
# FileSystem (Default)
export STORAGE_TYPE=filesystem

# MongoDB
export STORAGE_TYPE=mongodb
export MONGODB_URI=mongodb://localhost:27017

# PostgreSQL
export STORAGE_TYPE=postgresql
export POSTGRESQL_URI=postgresql://postgres:password@localhost:5432/firmware_manager
```

### Start Application
```bash
yarn start
```

### Access
- **Web Interface**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Default Credentials**: `admin` / `admin123`

## 📖 API Reference

### Core Endpoints
```bash
# Get WebUI Pages
GET /
GET /firmwares
GET /statistics
GET /upload

# Login on Backend
POST /api/login

# Get all device types
GET /api/devices

# Get firmwares (with optional filtering)
GET /api/firmwares
GET /api/firmwares?device=ESP32-DevKit
GET /api/firmwares?search=bluetooth

# Get specific firmware
GET /api/firmware/{id}

# Download firmware
GET /api/firmware/{id}/download

# Upload firmware (authenticated)
POST /api/firmware/upload

# Update firmware metadata (authenticated)
PUT /api/firmware/{id}

# Delete firmware (authenticated)
DELETE /api/firmware/{id}

# Statistics
GET /api/firmwares/stats

# Health check
GET /api/health
```

## 📖 Usage Guide

### 👨‍💼 **For Administrators**

1. **Login to Admin Panel**
   - Click "Login" in the top navigation
   - Use default credentials: `admin` / `admin123`

2. **Upload New Firmware**
   - Select device type (e.g., "ESP32-DevKit", "Arduino-Uno")
   - Enter semantic version (e.g., "1.0.0", "2.1.3")
   - Add description of changes/features
   - Upload firmware binary file

3. **Manage Firmwares**
   - Browse all uploaded firmwares
   - Filter by device type
   - View version history and metadata

### 🤖 **For Hardware Devices**

#### Check for Updates
```bash
curl "http://your-server.com/api/firmwares?device=ESP32-DevKit"
```

### **Response Example**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "deviceType": "ESP32-DevKit",
    "version": "2.2.0",
    "description": "Performance improvements and new sensor support",
    "originalName": "my_firmware.bin",
    "size": 1200000,
    "sha1": "6de17b4f9869b64b1cebc9cf66b92326d71bcce0",
    "uploadedBy": "admin",
    "mimetype": "application/octet-stream",
    "fileId": "1748277113189-68021285-8457-471e-aea7-c6720dad13cd.bin",
    "createdAt":"2025-05-27T14:13:38.034Z"
  }
]
```

#### Download Firmware
```bash
curl -O "http://your-server.com/550e8400-e29b-41d4-a716-446655440002/download"
```

📚 **[Complete API Documentation](API.md)**

### Custom Device Types
Device types are automatically created when uploading firmware. No pre-configuration needed.

## 🛡️ Security Considerations

### Production Checklist
- [ ] Change default admin password
- [ ] Use strong JWT secret key
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Monitor disk usage for uploads
- [ ] Configure CORS for browser access

### Recommended Security Headers
```javascript
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add error handling for new features
- Update API documentation for changes
- Test with multiple file types and sizes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Getting Help
- Check the [API Documentation](API_Documentation.md)
- Review server logs for error messages
- Ensure all dependencies are installed correctly
- Verify file permissions for upload directory or database access

---

**Made with ❤️ for the IoT and embedded systems community**
