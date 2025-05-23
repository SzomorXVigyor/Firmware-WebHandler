# 🔧 Firmware Management Server

A comprehensive web-based firmware management system with REST API for IoT devices, microcontrollers, and embedded systems. Easily manage, version, and distribute firmware updates across multiple hardware platforms.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![Express](https://img.shields.io/badge/Express-4.18+-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🔐 **Secure Management**
- JWT-based authentication for firmware uploads
- Protected admin interface with role-based access
- Public API for device firmware queries and downloads

### 📱 **Multi-Device Support**
- Manage firmware for unlimited device types
- Semantic versioning (SemVer) compliance
- Version conflict prevention and validation

### 🌐 **Modern Web Interface**
- Responsive Bootstrap-based UI
- Drag-and-drop file uploads
- Real-time firmware browsing and filtering
- Mobile-friendly design

### 🚀 **RESTful API**
- Complete REST API for device integration
- JSON responses with comprehensive metadata
- Direct binary file downloads
- Hardware-friendly endpoints

### 💾 **Robust Storage**
- Persistent JSON-based data storage
- Automatic file organization
- UUID-based file naming for conflict prevention
- Metadata tracking (version, description, upload date)

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Interface │────▶│  Express Server  │────▶│  File Storage   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Hardware APIs  │────▶│   REST API       │────▶│ JSON Database   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and yarn
- At least 1GB free disk space for firmware storage

### Installation

1. **Clone or download the project files**
   ```bash
   # Create project directory
   mkdir firmware-server
   cd firmware-server
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start the server**
   ```bash
   # Production
   yarn start
   
   # Development (with auto-reload)
   yarn dev
   ```

4. **Access the application**
   - **Web Interface**: http://localhost:3000
   - **API Base URL**: http://localhost:3000/api
   - **Default Credentials**: `admin` / `admin123`

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

#### Download Firmware
```bash
curl -O "http://your-server.com/downloads/firmware-filename.bin"
```

#### Arduino/ESP32 Integration Example
```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

void checkForUpdates() {
    HTTPClient http;
    http.begin("http://your-server.com/api/firmwares?device=ESP32-DevKit");
    
    int httpCode = http.GET();
    if (httpCode == 200) {
        String payload = http.getString();
        DynamicJsonDocument doc(4096);
        deserializeJson(doc, payload);
        
        String latestVersion = doc[0]["version"];
        if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
            // Download and install update
            downloadFirmware(doc[0]["filename"]);
        }
    }
    http.end();
}
```

## 🔌 API Reference

### **Public Endpoints** (No Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/devices` | List all device types |
| `GET` | `/api/firmwares` | List all firmwares |
| `GET` | `/api/firmwares?device=<type>` | Filter by device type |
| `GET` | `/api/firmware/<id>` | Get specific firmware |
| `GET` | `/downloads/<filename>` | Download firmware file |

### **Protected Endpoints** (Authentication Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Authenticate user |
| `POST` | `/api/firmware/upload` | Upload new firmware |

### **Response Example**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "deviceType": "ESP32-DevKit",
  "version": "2.1.0",
  "description": "WiFi security improvements and bug fixes",
  "filename": "1703123456789-uuid.bin",
  "originalName": "esp32_firmware_v2.1.0.bin",
  "size": 1048576,
  "uploadedBy": "admin",
  "uploadDate": "2024-12-21T10:30:45.123Z"
}
```

📚 **[Complete API Documentation](API_Documentation.md)**

## ⚙️ Configuration

### Environment Variables
```bash
PORT=3000                    # Server port (default: 3000)
JWT_SECRET=your-secret-key   # JWT signing secret
MAX_FILE_SIZE=100*1024*1204
```

### Security Settings
- **JWT Token Expiry**: 24 hours
- **File Upload Limit**: 100MB
- **Supported File Types**: All binary files

### Storage Locations
- **Firmware Files**: `./uploads/` directory
- **Metadata Database**: `./firmware_data.json`
- **Default Admin**: Username: `admin`, Password: `admin123`

## 🔧 Customization

### Adding New Users
Edit `firmware_data.json` after first run:
```json
{
  "users": [
    {
      "id": "1",
      "username": "admin",
      "password": "$2b$10$hashedpassword"
    }
  ]
}
```

### Custom Device Types
Device types are automatically created when uploading firmware. No pre-configuration needed.

## 🚀 Deployment

### Development
```bash
yarn run dev  # Uses nodemon for auto-reload
```

### Production
```bash
yarn start    # Standard production start
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY . .
EXPOSE 3000
CMD ["yarn", "start"]
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name firmware.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

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

## 🧪 Testing

### Manual Testing
1. **Upload Test**: Upload a small firmware file
2. **API Test**: Query firmwares via API
3. **Download Test**: Download uploaded firmware
4. **Version Test**: Try uploading duplicate versions (should fail)

### Automated Testing
```bash
# Test firmware upload
curl -X POST http://localhost:3000/api/firmware/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "firmware=@test.bin" \
  -F "deviceType=TEST-DEVICE" \
  -F "version=1.0.0" \
  -F "description=Test firmware"

# Test firmware query
curl http://localhost:3000/api/firmwares?device=TEST-DEVICE
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

## 🆘 Support

### Common Issues

**Q: "Cannot upload files larger than 100MB"**  
A: Modify the multer configuration in `server.js` to increase the file size limit.

**Q: "JWT token expired"**  
A: Tokens expire after 24 hours. Re-login to get a new token.

**Q: "Port 3000 already in use"**  
A: Set `PORT` environment variable or change the default port in `server.js`.

**Q: "Cannot find firmware_data.json"**  
A: The file is auto-generated on first run. Ensure write permissions in the project directory.

### Getting Help
- Check the [API Documentation](API_Documentation.md)
- Review server logs for error messages
- Ensure all dependencies are installed correctly
- Verify file permissions for upload directory

## 🎯 Roadmap

- [ ] User management interface
- [ ] Firmware rollback functionality
- [ ] Automatic firmware signing/verification
- [ ] Email notifications for new releases
- [ ] Docker container support
- [ ] Database backend options (PostgreSQL, MongoDB)
- [ ] Rate limiting and API throttling
- [ ] Firmware delta updates
- [ ] Multi-language support

---

**Made with ❤️ for the IoT and embedded systems community**