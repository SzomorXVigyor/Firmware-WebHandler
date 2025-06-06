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
  "user": {
    "id": "1",
    "username": "admin",
    "role": "admin"
  }
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
- `device`  (optional): Filter by device type
- `search`  (optional): Search in device type, description and version
- `number`  (optional): Show the first *n* number of result
- `stable`  (optional): Show only stable versions
- `minimal` (optional): Return only *id*, *version* and *sha1* attributes

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deviceType": "ESP32-DevKit",
    "version": "2.1.0",
    "description": "Added WiFi security improvements and bug fixes",
    "originalName": "esp32_firmware_v2.1.0.bin",
    "size": 1048576,
    "sha1": "6de17b4f9869b64b1cebc9cf66b92326d71bcce0",
    "uploadedBy": "admin",
    "mimetype": "application/octet-stream",
    "fileId": "1748343648895-42eb253c-7545-4433-914e-ea7fb1316de9.bin",
    "createdAt": "2024-12-21T10:30:45.123Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "deviceType": "ESP32-DevKit",
    "version": "2.0.0",
    "description": "Major update with new features",
    "originalName": "esp32_firmware_v2.0.0.bin",
    "size": 1024000,
    "sha1": "6de17b4f9869b64b1cebc9cf66b92326d71bcce0",
    "uploadedBy": "admin",
    "mimetype": "application/octet-stream",
    "fileId": "1748355133051-dd55540d-6571-4662-983c-634d04090434.bin",
    "createdAt": "2024-12-20T15:20:30.456Z",
    "updatedBy":"admin",
    "updatedAt":"2025-05-27T14:13:38.034Z"
  }
]
```

**Examples:**
```bash
# Get all firmwares
curl http://localhost:3000/api/firmwares

# Get firmwares for specific device
curl "http://localhost:3000/api/firmwares?device=ESP32-DevKit"

# Search for specific firmware
curl "http://localhost:3000/api/firmwares?search=WiFi"

# Get first 5 firmwares
curl "http://localhost:3000/api/firmwares?number=5"

# Get only stable versions
curl "http://localhost:3000/api/firmwares?stable=true"

# Get minimal response (id, version, sha1 only)
curl "http://localhost:3000/api/firmwares?minimal=true"

# Combine multiple parameters
curl "http://localhost:3000/api/firmwares?device=ESP32-DevKit&number=3&stable=true"
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
    "originalName": "esp32_firmware_v2.1.0.bin",
    "size": 1048576,
    "sha1": "6de17b4f9869b64b1cebc9cf66b92326d71bcce0",
    "uploadedBy": "admin",
    "mimetype": "application/octet-stream",
    "fileId": "1748343648895-42eb253c-7545-4433-914e-ea7fb1316de9.bin",
    "createdAt": "2024-12-21T10:30:45.123Z"
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

#### PUT `/api/firmware/{id}`

**Requires authentication.**\
Update firmware metadata.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id`: Firmware UUID

**Request Body:**
- `version` (string): Semantic version (e.g., "1.0.0", "2.1.3")
- `description` (string): Description of the firmware

**Response (Success - 200):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deviceType": "ESP32-DevKit",
    "version": "2.3.0",
    "description": "Added WiFi security improvements and bug fixes",
    "originalName": "esp32_firmware_v2.3.0.bin",
    "size": 1048596,
    "sha1": "da6ae879e64c7a02b7770175186cc3e08a0fc470",
    "uploadedBy": "admin",
    "mimetype": "application/octet-stream",
    "fileId": "1748343648895-42eb253c-7545-4433-914e-ea7fb1316de9.bin",
    "createdAt": "2024-12-21T10:30:45.123Z",
    "updatedBy":"admin",
    "updatedAt":"2025-05-27T14:13:38.034Z"
}
```
**Response (Error - 400):**
```json
{
  "error": "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)"
}
```
```json
{
  "error": "Version, and description are required"
}
```

**Response (Error - 401):**
```json
{
  "error": "Access token required"
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
curl -X PUT http://localhost:3000/api/firmware/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"2.3.0","description":"Updated firmware with security patches"}'
```

#### DELETE `/api/firmware/{id}`
Delete specific firmware by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id`: Firmware UUID

**Response (Success - 200):**
```json
{
  "message": "Firmware deleted successfully"
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
curl -X DELETE http://localhost:3000/api/firmware/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Firmware Upload

#### POST `/api/firmware/upload`

**Requires authentication.**\
Upload new firmware file.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body:**
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
  "originalName": "my_firmware.bin",
  "size": 1200000,
  "sha1": "6de17b4f9869b64b1cebc9cf66b92326d71bcce0",
  "uploadedBy": "admin",
  "mimetype": "application/octet-stream",
  "fileId": "1748277113189-68021285-8457-471e-aea7-c6720dad13cd.bin",
  "createdAt":"2025-05-27T14:13:38.034Z"
}
```

**Response (Error - 400):**
```json
{
  "error": "Invalid version format. Must follow semantic versioning (e.g., 1.0.0)"
}
```
```json
{
  "error": "Device type, version, and description are required"
}
```
```json
{
  "error": "This version already exists for this device type"
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

#### GET `/api/firmware/{id}/download`

**No authentication required.**\
Download firmware file.

**Parameters:**
- `id`: The id returned from firmware metadata

**Response:**
- Binary file download with appropriate headers

**Example:**
```bash
# Download firmware file
curl -O http://localhost:3000/api/firmware/550e8400-e29b-41d4-a716-446655440002/download

# Download with custom filename
curl -o my_firmware.bin http://localhost:3000/api/firmware/550e8400-e29b-41d4-a716-446655440002/download
```

---

### 6. System health, stats and analytics

#### GET `/api/firmwares/stats`
Get stats and analytics data about the system.

**Response (Success - 200):**
```json
{
  "totalFirmwares": 5,
  "deviceTypes": [
    "ESP32-DevKit",
    "ESP32-C3"
  ],
  "totalSize": 124587,
  "totalDownloads": 2
}
```

**Example:**
```bash
curl http://localhost:3000/api/firmwares/stats
```

#### GET `/api/health`
Get stats and analytics data about the system.

**Response (Success - 200):**
```json
{
  "status": "healthy",
  "storageType": "MongoDBStorage",
  "totalFirmwares": 5,
  "initialized": true
}
```

**Response (Error - 503):**
```json
{
  "status": "unhealthy",
  "error": "Error message",
  "storageType": "MongoDBStorage",
  "initialized": false
}
```
```json
{
  "status": "unhealthy",
  "error": "Error message",
}
```

**Example:**
```bash
curl http://localhost:3000/api/health
```

---

### 7. User managment

#### GET `/api/user/profile`

**Requires authentication.**\
Get authenticated user profile data.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
    "id":"1",
    "username":"admin",
    "createdAt":"2025-05-26T18:36:23.994Z",
    "role":"admin",
    "lastLogin": "2025-05-26T18:37:23.994Z"
}
```

**Response (Error - 404):**
```json
{
  "error": "User not found"
}
```

**Example:**
```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### PUT `/api/user/change-password`

**Requires authentication.**\
Change logged in user password.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
- `currentPassword` (string): Old password
- `newPassword` (string): New password

**Response (Success - 200):**
```json
{
    "message": "Password changed successfully"
}
```

**Response (Error - 400):**
```json
{
  "error": "Old password and new password are required"
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid old password"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/user/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"oldpass123","newPassword":"newpass456"}'
```

#### GET `/api/users`

**Requires admin level authentication.**
*Use admin roled user*\
Get all user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
[
    {
        "id":"1",
        "username":"admin",
        "createdAt":"2025-05-26T18:36:23.994Z",
        "role":"admin",
        "lastLogin": "2025-05-26T18:37:23.994Z"
    },
    {
        "id":"2",
        "username":"notadmin",
        "createdAt":"2025-05-26T18:36:23.994Z",
        "role":"filemanager",
        "lastLogin": "2025-05-26T18:37:23.994Z"
    }
]
```

**Example:**
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### POST `/api/user`

**Requires admin level authentication.**
*Use admin roled user*\
Create a new user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
- `username` (string): Username
- `password` (string): Password
- `role` (string): Role

**Response (Success - 200):**
```json
{
    "username":"Newuser",
    "createdAt":"2025-06-06T10:05:49.071Z",
    "id":"6e0f729b-30fb-4f52-9758-6e315f50258f",
    "role":"filemanager"
}
```

**Response (Error - 400):**
```json
{
  "error": "Username, password and role are required"
}
```

**Response (Error - 409):**
```json
{
  "error": "Username already taken."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"password123","role":"filemanager"}'
```

#### PUT `/api/user/:username`

**Requires admin level authentication.**
*Use admin roled user*\
Edit any user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
- `role` (string): Role

**Response (Success - 200):**
```json
{
    "username":"Newuser",
    "createdAt":"2025-06-06T10:05:49.071Z",
    "id":"6e0f729b-30fb-4f52-9758-6e315f50258f",
    "role":"filemanager"
}
```

**Response (Error - 400):**
```json
{
  "error": "Username are required as a request paramter"
}
```

**Response (Error - 404):**
```json
{
  "error": "User not found"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/user/newuser \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

#### DELETE `/api/user/:username`

**Requires admin level authentication.**
*Use admin roled user*\
Delete any user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
{
    "message": "User deleted successfully"
}
```

**Response (Error - 400):**
```json
{
  "error": "Username are required as a request paramter"
}
```

**Response (Error - 404):**
```json
{
  "error": "User not found"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/user/newuser \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## Data Models

> [!NOTE]
> The object may also have other inherited or container type-dependent attributes, but these are constants

### Firmware Object
```json
{
  "id": "string (UUID)",
  "deviceType": "string",
  "version": "string (SemVer format)",
  "description": "string",
  "originalName": "string (original upload filename)",
  "size": "number (bytes)",
  "sha1": "string (SHA1 hash of the file)",
  "uploadedBy": "string (username)",
  "mimetype": "string (MIME type)",
  "fileId": "string (deprecated legacy, may disappear later)",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedBy": "string (username, optional)",
  "updatedAt": "string (ISO 8601 datetime, optional)"
}
```

### User Object
```json
{
  "id": "string (UUID)",
  "username": "string",
  "role": "string (admin, filemanager)",
  "createdAt": "string (ISO 8601 datetime)",
  "lastLogin": "string (ISO 8601 datetime, optional)"
}
```

### Login Response Object
```json
{
  "token": "string (JWT token)",
  "user": {
    "id": "string (UUID)",
    "username": "string",
    "role": "string (admin, filemanager)"
  }
}
```

### Stats Object
```json
{
  "totalFirmwares": "number",
  "deviceTypes": "array of strings",
  "totalSize": "number (bytes)",
  "totalDownloads": "number"
}
```

### Health Status Object
```json
{
  "status": "string (healthy, unhealthy)",
  "storageType": "string (optional)",
  "totalFirmwares": "number (optional)",
  "initialized": "boolean (optional)",
  "error": "string (optional, present when unhealthy)"
}
```

### Password Change Request Object
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### User Creation Request Object
```json
{
  "username": "string",
  "password": "string",
  "role": "string (admin, filemanager, bot)"
}
```

### Firmware Upload Request Object
```json
{
  "firmware": "file (binary)",
  "deviceType": "string",
  "version": "string (SemVer format)",
  "description": "string"
}
```

### Firmware Update Request Object
```json
{
  "version": "string (SemVer format)",
  "description": "string"
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

### Protected endpoint`s auth token error

**Response (Error - 401):**
```json
{
  "error": "Access token required"
}
```

**Response (Error - 403):**
```json
{
  "error": "Invalid token"
}
```

**Response (Error - 403):**
```json
{
  "error": "Admin access required"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input, validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (token expired)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error
- `503` - Service Unavailable (unhealthy system)

---

## Rate Limiting & File Limits

### Upload Limits
- Maximum file size: **100MB** (default)
- Supported file types: .bin, .hex, .elf, .ino, .cpp, .c, .h (default)
- No rate limiting currently implemented

### Query Limits
- No rate limiting on GET endpoints
- No pagination (all results returned), but has a maximum number limiter paramter on `/api/firmwares`

---

## Security Notes

1. **JWT Tokens**: Expire after 24 hours
2. **Input Validation**: SemVer validation prevents invalid version formats
3. **No CORS**: Configure CORS headers if accessing from browser applications
4. **HTTPS**: Use HTTPS in production environments
5. **Role-based Access**: Admin users can manage other users, filemanager users can only manage firmware

---

## Version Management

The server automatically:
- Sorts versions using semantic versioning (newest first)
- Prevents duplicate versions for the same device type
- Validates version format before upload
- Maintains version history for rollbacks
