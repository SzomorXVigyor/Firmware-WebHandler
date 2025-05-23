# Firmware Management Server - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Only firmware upload operations require authentication. All download and query operations are public.

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Authentication

#### POST `/api/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin"
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid credentials"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

### 2. Device Management

#### GET `/api/devices`
Get list of all device types that have firmware available.

**Response (200):**
```json
[
  "ESP32-DevKit",
  "Arduino-Uno",
  "STM32-F4",
  "Raspberry-Pi-Pico"
]
```

**Example:**
```bash
curl http://localhost:3000/api/devices
```

---

### 3. Firmware Query

#### GET `/api/firmwares`
Get all available firmwares, sorted by upload date (newest first).

**Query Parameters:**
- `device` (optional): Filter by device type

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deviceType": "ESP32-DevKit",
    "version": "2.1.0",
    "description": "Added WiFi security improvements and bug fixes",
    "filename": "1703123456789-uuid.bin",
    "originalName": "esp32_firmware_v2.1.0.bin",
    "size": 1048576,
    "uploadedBy": "admin",
    "uploadDate": "2024-12-21T10:30:45.123Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "deviceType": "ESP32-DevKit",
    "version": "2.0.0",
    "description": "Major update with new features",
    "filename": "1703023456789-uuid.bin",
    "originalName": "esp32_firmware_v2.0.0.bin",
    "size": 1024000,
    "uploadedBy": "admin",
    "uploadDate": "2024-12-20T15:20:30.456Z"
  }
]
```

**Examples:**
```bash
# Get all firmwares
curl http://localhost:3000/api/firmwares

# Get firmwares for specific device
curl "http://localhost:3000/api/firmwares?device=ESP32-DevKit"
```

---

#### GET `/api/firmware/{id}`
Get specific firmware details by ID.

**Parameters:**
- `id`: Firmware UUID

**Response (Success - 200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "deviceType": "ESP32-DevKit",
  "version": "2.1.0",
  "description": "Added WiFi security improvements and bug fixes",
  "filename": "1703123456789-uuid.bin",
  "originalName": "esp32_firmware_v2.1.0.bin",
  "size": 1048576,
  "uploadedBy": "admin",
  "uploadDate": "2024-12-21T10:30:45.123Z"
}
```

**Response (Error - 404):**
```json
{
  "error": "Firmware not found"
}
```

**Example:**
```bash
curl http://localhost:3000/api/firmware/550e8400-e29b-41d4-a716-446655440000
```

---

### 4. Firmware Upload

#### POST `/api/firmware/upload`
Upload new firmware file. **Requires authentication.**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `firmware` (file): The firmware file to upload
- `deviceType` (string): Device type identifier
- `version` (string): Semantic version (e.g., "1.0.0", "2.1.3")
- `description` (string): Description of the firmware

**Response (Success - 200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "deviceType": "ESP32-DevKit",
  "version": "2.2.0",
  "description": "Performance improvements and new sensor support",
  "filename": "1703223456789-newuuid.bin",
  "originalName": "my_firmware.bin",
  "size": 1200000,
  "uploadedBy": "admin",
  "uploadDate": "2024-12-22T08:15:20.789Z"
}
```

**Response (Error - 400):**
```json
{
  "error": "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)"
}
```

**Response (Error - 401):**
```json
{
  "error": "Access token required"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/firmware/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "firmware=@/path/to/firmware.bin" \
  -F "deviceType=ESP32-DevKit" \
  -F "version=2.2.0" \
  -F "description=Performance improvements and new sensor support"
```

---

### 5. File Download

#### GET `/downloads/{filename}`
Download firmware file directly. **No authentication required.**

**Parameters:**
- `filename`: The filename returned from firmware metadata

**Response:**
- Binary file download with appropriate headers

**Example:**
```bash
# Download firmware file
curl -O http://localhost:3000/downloads/1703123456789-uuid.bin

# Download with original filename
curl -o esp32_firmware.bin http://localhost:3000/downloads/1703123456789-uuid.bin
```

---

## Data Models

### Firmware Object
```json
{
  "id": "string (UUID)",
  "deviceType": "string",
  "version": "string (SemVer format)",
  "description": "string",
  "filename": "string (internal filename)",
  "originalName": "string (original upload filename)",
  "size": "number (bytes)",
  "uploadedBy": "string (username)",
  "uploadDate": "string (ISO 8601 datetime)"
}
```

### User Object
```json
{
  "id": "string",
  "username": "string"
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input, validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (token expired)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Hardware Integration Examples

### Arduino/ESP32 Example
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
    String downloadUrl = "http://your-server.com/downloads/" + doc[0]["filename"].as<String>();
    
    // Compare with current version and download if needed
    if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
      downloadFirmware(downloadUrl);
    }
  }
  http.end();
}
```

### Python Example
```python
import requests

def get_latest_firmware(device_type):
    response = requests.get(f"http://localhost:3000/api/firmwares?device={device_type}")
    if response.status_code == 200:
        firmwares = response.json()
        if firmwares:
            latest = firmwares[0]  # Already sorted by version
            return latest
    return None

def download_firmware(firmware_info, save_path):
    download_url = f"http://localhost:3000/downloads/{firmware_info['filename']}"
    response = requests.get(download_url)
    
    if response.status_code == 200:
        with open(save_path, 'wb') as f:
            f.write(response.content)
        return True
    return False

# Usage
latest = get_latest_firmware("ESP32-DevKit")
if latest:
    print(f"Latest version: {latest['version']}")
    download_firmware(latest, "firmware.bin")
```

---

## Rate Limiting & File Limits

### Upload Limits
- Maximum file size: **100MB**
- Supported file types: Any binary file
- No rate limiting currently implemented

### Query Limits
- No rate limiting on GET endpoints
- No pagination (all results returned)

---

## Security Notes

1. **JWT Tokens**: Expire after 24 hours
2. **File Storage**: Files stored with UUID names to prevent conflicts
3. **Input Validation**: SemVer validation prevents invalid version formats
4. **No CORS**: Configure CORS headers if accessing from browser applications
5. **HTTPS**: Use HTTPS in production environments

---

## Version Management

The server automatically:
- Sorts versions using semantic versioning (newest first)
- Prevents duplicate versions for the same device type
- Validates version format before upload
- Maintains version history for rollbacks