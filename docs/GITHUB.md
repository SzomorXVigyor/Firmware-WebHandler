# GitHub Actions Firmware Upload Guide

Automatically upload firmware to your server using GitHub Actions.

## Quick Setup

### 1. Add Workflow File

Create `.github/workflows/upload-firmware.yml` in your repository with the provided workflow code.

### 2. Set GitHub Secrets

Go to **Repository Settings** → **Secrets** → **Actions** and add:

| Secret | Value |
|--------|-------|
| `FIRMWARE_SERVER_URL` | `https://your-server.com:3000` |
| `FIRMWARE_USERNAME` | `admin` |
| `FIRMWARE_PASSWORD` | `your-password` |

### 3. Update Build Process

Replace the build section in the workflow:

**For Arduino:**
```yaml
- name: Build firmware
  run: |
    arduino-cli compile --fqbn esp32:esp32:esp32 sketch.ino
    cp sketch.ino.esp32.esp32.esp32.bin build/firmware.bin
```

**For PlatformIO:**
```yaml
- name: Build firmware
  run: |
    pio run
    cp .pio/build/esp32dev/firmware.bin build/firmware.bin
```

## How to Use

### Automatic Upload
Push a git tag to trigger upload:
```bash
git tag v1.0.0
git push origin main --tags
```

### Manual Upload
1. Go to **Actions** tab in GitHub
2. Select "Upload Firmware" workflow
3. Click "Run workflow"
4. Fill in:
   - Device Type: `ESP32-DevKit`
   - Version: `1.0.0`
   - Description: `Bug fixes`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Authentication failed" | Check GitHub secrets are set correctly |
| "Invalid version format" | Use format like `1.0.0` (no 'v' prefix) |
| "Firmware file not found" | Update build process to create `build/firmware.bin` |
| "Version already exists" | Use a new version number |
| "Connection failed" | Check server URL and make sure server is running |

## Customization

### Change Device Type
```yaml
DEVICE_TYPE="Arduino-Uno"  # Change this line
```

### Change File Paths
```yaml
on:
  push:
    paths:
      - 'src/**'        # Your source directory
      - 'output/**'     # Your build directory
```

### Add Notifications
```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST https://hooks.slack.com/... \
      -d '{"text":"Firmware upload failed!"}'
```

## Best Practices

- ✅ Use semantic versioning (1.0.0, 1.0.1, 1.1.0)
- ✅ Test locally before pushing
- ✅ Keep credentials in GitHub secrets only
- ✅ Use HTTPS for production servers
- ✅ Tag releases consistently

## Example Project Structure
```
your-project/
├── .github/workflows/upload-firmware.yml
├── src/main.cpp
├── build/                    # Build output
└── platformio.ini
```

That's it! Push your code with a version tag and watch your firmware upload automatically.

# Example worflow file
```yml
name: Upload Firmware to Management Server

# Trigger the workflow on push to main branch or manual trigger
on:
  push:
    branches: [ main, release/* ]
    paths:
      - 'firmware/**'
      - 'build/**'
  workflow_dispatch:
    inputs:
      device_type:
        description: 'Device type (e.g., ESP32-DevKit)'
        required: true
        default: 'ESP32-DevKit'
      version:
        description: 'Firmware version (semantic versioning)'
        required: true
        default: '1.0.0'
      description:
        description: 'Release description'
        required: true
        default: 'Automated build'

# Environment variables
env:
  FIRMWARE_SERVER_URL: ${{ secrets.FIRMWARE_SERVER_URL || 'http://localhost:3000' }}
  FIRMWARE_USERNAME: ${{ secrets.FIRMWARE_USERNAME || 'admin' }}
  FIRMWARE_PASSWORD: ${{ secrets.FIRMWARE_PASSWORD || 'admin123' }}

jobs:
  upload-firmware:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up build environment
      run: |
        # Add any build dependencies here
        echo "Setting up build environment..."

    # Example: Build firmware (customize based on your build process)
    - name: Build firmware
      run: |
        # Replace this with your actual build commands
        echo "Building firmware..."
        mkdir -p build
        # Example build commands:
        # make clean && make all
        # platformio run --environment esp32dev

        # For demo purposes, create a dummy firmware file
        echo "dummy firmware content for testing" > build/firmware.bin

    - name: Get firmware info
      id: firmware_info
      run: |
        # Extract version from git tag if available, otherwise use manual input or default
        if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
          VERSION="${{ github.event.inputs.version }}"
          DEVICE_TYPE="${{ github.event.inputs.device_type }}"
          DESCRIPTION="${{ github.event.inputs.description }}"
        else
          # Try to extract version from git tag
          VERSION=$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || echo "1.0.0")
          DEVICE_TYPE="ESP32-DevKit"  # Default device type
          DESCRIPTION="Automated build from commit $(git rev-parse --short HEAD)"
        fi

        # Validate semantic versioning format
        if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
          echo "Invalid version format: $VERSION"
          exit 1
        fi

        echo "version=$VERSION" >> $GITHUB_OUTPUT
        echo "device_type=$DEVICE_TYPE" >> $GITHUB_OUTPUT
        echo "description=$DESCRIPTION" >> $GITHUB_OUTPUT
        echo "firmware_file=build/firmware.bin" >> $GITHUB_OUTPUT

    - name: Authenticate with firmware server
      id: auth
      run: |
        # Login and get JWT token
        TOKEN=$(curl -s -X POST "$FIRMWARE_SERVER_URL/api/login" \
          -H "Content-Type: application/json" \
          -d "{\"username\":\"$FIRMWARE_USERNAME\",\"password\":\"$FIRMWARE_PASSWORD\"}" \
          | jq -r '.token')

        if [[ "$TOKEN" == "null" || -z "$TOKEN" ]]; then
          echo "Authentication failed"
          exit 1
        fi

        echo "token=$TOKEN" >> $GITHUB_OUTPUT
        echo "✅ Authentication successful"

    - name: Check if firmware file exists
      run: |
        if [[ ! -f "${{ steps.firmware_info.outputs.firmware_file }}" ]]; then
          echo "Firmware file not found: ${{ steps.firmware_info.outputs.firmware_file }}"
          exit 1
        fi

        # Display file info
        ls -lh "${{ steps.firmware_info.outputs.firmware_file }}"
        echo "File size: $(stat -c%s "${{ steps.firmware_info.outputs.firmware_file }}") bytes"

    - name: Upload firmware
      id: upload
      run: |
        echo "Uploading firmware..."
        echo "Device Type: ${{ steps.firmware_info.outputs.device_type }}"
        echo "Version: ${{ steps.firmware_info.outputs.version }}"
        echo "Description: ${{ steps.firmware_info.outputs.description }}"

        # Upload firmware to server
        RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$FIRMWARE_SERVER_URL/api/firmware/upload" \
          -H "Authorization: Bearer ${{ steps.auth.outputs.token }}" \
          -F "firmware=@${{ steps.firmware_info.outputs.firmware_file }}" \
          -F "deviceType=${{ steps.firmware_info.outputs.device_type }}" \
          -F "version=${{ steps.firmware_info.outputs.version }}" \
          -F "description=${{ steps.firmware_info.outputs.description }}")

        # Extract HTTP status code
        HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        BODY=$(echo $RESPONSE | sed 's/HTTPSTATUS:[0-9]*$//')

        echo "HTTP Status: $HTTP_STATUS"
        echo "Response: $BODY"

        if [[ $HTTP_STATUS -eq 200 ]]; then
          FIRMWARE_ID=$(echo $BODY | jq -r '.id')
          echo "✅ Firmware uploaded successfully!"
          echo "Firmware ID: $FIRMWARE_ID"
          echo "firmware_id=$FIRMWARE_ID" >> $GITHUB_OUTPUT

          # Pretty print the response
          echo "$BODY" | jq '.'
        else
          echo "❌ Upload failed with status: $HTTP_STATUS"
          echo "Error: $BODY"
          exit 1
        fi

    - name: Verify upload
      run: |
        echo "Verifying firmware upload..."

        # Get firmware details to verify upload
        FIRMWARE_DETAILS=$(curl -s "$FIRMWARE_SERVER_URL/api/firmware/${{ steps.upload.outputs.firmware_id }}")

        echo "Firmware details:"
        echo "$FIRMWARE_DETAILS" | jq '.'

        # Verify the version matches
        UPLOADED_VERSION=$(echo "$FIRMWARE_DETAILS" | jq -r '.version')
        if [[ "$UPLOADED_VERSION" == "${{ steps.firmware_info.outputs.version }}" ]]; then
          echo "✅ Version verification passed"
        else
          echo "❌ Version mismatch: expected ${{ steps.firmware_info.outputs.version }}, got $UPLOADED_VERSION"
          exit 1
        fi

    - name: Create release summary
      run: |
        cat << EOF >> $GITHUB_STEP_SUMMARY
        ## 🚀 Firmware Upload Successful

        | Field | Value |
        |-------|-------|
        | **Device Type** | ${{ steps.firmware_info.outputs.device_type }} |
        | **Version** | ${{ steps.firmware_info.outputs.version }} |
        | **Firmware ID** | ${{ steps.upload.outputs.firmware_id }} |
        | **Description** | ${{ steps.firmware_info.outputs.description }} |
        | **Server URL** | ${{ env.FIRMWARE_SERVER_URL }} |
        | **Download URL** | ${{ env.FIRMWARE_SERVER_URL }}/api/firmware/${{ steps.upload.outputs.firmware_id }}/download |

        ### Next Steps
        - Test the firmware download
        - Update device flashing scripts with new firmware ID
        - Notify team members about the new release
        EOF

    # Optional: Notify on failure
    - name: Notify on failure
      if: failure()
      run: |
        echo "❌ Firmware upload failed!"
        echo "Check the logs above for details."
        # Add Slack/Discord/Email notification here if needed
```
