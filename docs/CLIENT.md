# ESP32 OTA Firmware Updater Module

This module provides a simple way to automatically update the firmware of ESP32 microcontrollers running on the Arduino framework via Over-The-Air (OTA) updates from a remote server. It is designed for use in connected embedded applications where keeping devices up-to-date is critical.

---

## Features

- **Automatic OTA Update:** Periodically checks a remote server for updated firmware and performs a secure OTA update if a new version is available.
- **Flexible Update Check:** Supports two update check modes:
  - **Semantic Version Compare:** Updates when the server reports a newer version number. (Example update only stable X.X.X formats)
  - **SHA1 Hash Compare:** Updates when the firmware binary hash changes. (Always update if it has different SHA1)
- **Persistent State:** Stores the current version and SHA1 hash in non-volatile storage (`Preferences`).
- **Progress Reporting:** Prints update progress to the serial console.
- **Automatic Reboot:** Reboots the ESP32 automatically after a successful update.
- **Error Handling:** Handles network failures, download errors, and flash write errors gracefully.
- **Customizable:** Easily integrate into your Arduino project; only needs WiFi credentials and server details.

---

## Usage

1. **Configure WiFi and Server:**

   ```cpp
   const char* WIFI_SSID = "your-wifi-ssid";
   const char* WIFI_PASSWORD = "your-wifi-password";
   const String FIRMWARE_SERVER = "http://your-server-ip:3000";
   const String DEVICE_TYPE = "ESP32-DevKit";
   ```

2. **Create the Updater Instance:**

   ```cpp
   FirmwareUpdater updater(FIRMWARE_SERVER, DEVICE_TYPE, VERSION_COMPARE);
   ```

   - `VERSION_COMPARE` (default): checks by version number.
   - `SHA1_COMPARE`: checks by firmware hash.

3. **In `setup()`:**

   ```cpp
   void setup() {
       Serial.begin(115200);
       WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
       // Wait for WiFi connection...
       updater.setup();
       updater.printCurrentInfo();
       updater.checkForUpdate(); // Check and update if needed
   }
   ```

4. **In `loop()`:**
   Optionally, check for updates periodically:

   ```cpp
   void loop() {
       static unsigned long lastCheck = 0;
       if (millis() - lastCheck > 30 * 60 * 1000) { // every 30 minutes
           updater.checkForUpdate();
           lastCheck = millis();
       }
       // ...your application code...
   }
   ```

---

## Requirements

- **ESP32** microcontroller (with Arduino framework)
- **Libraries:**
  - WiFi
  - HTTPClient
  - Update
  - Preferences
  - ArduinoJson

---

## Example Output

```
ESP32 OTA Updater Starting...
WiFi connected: 192.168.1.101
Device: ESP32-DevKit
Version: 1.0.0
SHA1:
Check Mode: VERSION
Free heap: 215432 bytes

Checking for firmware updates...
Current: 1.0.0 (SHA1: )
Latest:  1.1.0 (SHA1: abc123...)
Newer version available
Update available: 1.1.0
Downloading firmware: http://192.168.1.100:3000/api/firmware/42/download
Firmware size: 512000 bytes
Starting OTA update...
Progress: 10%
Progress: 20%
...
OTA Update completed successfully!
Rebooting in 3 seconds...
```

---

## Integration Tips

- Update `CURRENT_VERSION` before each release to match the version on the server.
- Use unique `DEVICE_TYPE` values if supporting multiple hardware variants.
- The updater will automatically reboot the device after a successful update.

---

## Example code
```c++
/*
 * ESP32 OTA Firmware Updater
 * Checks server for newer firmware and performs OTA update
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Update.h>
#include <Preferences.h>
#include <ArduinoJson.h>

enum UpdateCheckMode {
    VERSION_COMPARE,  // Use semantic version comparison
    SHA1_COMPARE     // Use SHA1 hash comparison
};

class FirmwareUpdater {
private:
    String serverUrl;
    String deviceType;
    String currentVersion;
    String currentSha1;
    Preferences prefs;
    UpdateCheckMode checkMode;

    // Compare semantic versions (returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2)
    int compareVersions(String v1, String v2) {
        int v1Parts[3] = {0, 0, 0};
        int v2Parts[3] = {0, 0, 0};

        // Parse v1
        sscanf(v1.c_str(), "%d.%d.%d", &v1Parts[0], &v1Parts[1], &v1Parts[2]);
        // Parse v2
        sscanf(v2.c_str(), "%d.%d.%d", &v2Parts[0], &v2Parts[1], &v2Parts[2]);

        for (int i = 0; i < 3; i++) {
            if (v1Parts[i] < v2Parts[i]) return -1;
            if (v1Parts[i] > v2Parts[i]) return 1;
        }
        return 0;
    }

public:
    FirmwareUpdater(String url, String device, UpdateCheckMode mode = VERSION_COMPARE) {
        serverUrl = url;
        deviceType = device;
        checkMode = mode;
    }

    void setup() {
      // Initialize preferences
        prefs.begin("firmware", true);

        // Load saved version/sha1 or save current ones
        currentVersion = prefs.getString("version", "0.0.0");
        currentSha1 = prefs.getString("sha1", "null");

        prefs.end();
    }

    // Set the update check mode
    void setCheckMode(UpdateCheckMode mode) {
        checkMode = mode;
    }

    // Check if newer firmware is available
    bool checkForUpdate() {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("WiFi not connected");
            return false;
        }

        HTTPClient http;
        String url = serverUrl + "/api/firmwares?device=" + deviceType;

        Serial.println("Checking for updates: " + url);
        http.begin(url);

        int httpCode = http.GET();
        if (httpCode != 200) {
            Serial.println("HTTP Error: " + String(httpCode));
            http.end();
            return false;
        }

        String payload = http.getString();
        http.end();

        // Parse JSON response
        DynamicJsonDocument doc(4096);
        deserializeJson(doc, payload);

        if (doc.size() == 0) {
            Serial.println("No firmwares available");
            return false;
        }

        // Get latest firmware (first in array - sorted by date)
        JsonObject latest = doc[0];
        String latestVersion = latest["version"];
        String latestSha1 = latest["sha1"];
        String latestId = latest["id"];

        Serial.println("Current: " + currentVersion + " (SHA1: " + currentSha1 + ")");
        Serial.println("Latest:  " + latestVersion + " (SHA1: " + latestSha1 + ")");

        // Check if update is needed based on selected mode
        bool needUpdate = false;

        if (checkMode == SHA1_COMPARE) {
            if (currentSha1 != latestSha1) {
                needUpdate = true;
                Serial.println("SHA1 hash changed - update needed");
            } else {
                Serial.println("SHA1 hash matches - no update needed");
            }
        } else { // VERSION_COMPARE
            if (compareVersions(currentVersion, latestVersion) < 0) {
                needUpdate = true;
                Serial.println("Newer version available");
            } else {
                Serial.println("Version is up to date");
            }
        }

        if (needUpdate) {
            Serial.println("Update available: " + latestVersion);
            return performOTAUpdate(latestId, latestVersion, latestSha1);
        } else {
            Serial.println("Firmware is up to date");
            return false;
        }
    }

    // Perform OTA update
    bool performOTAUpdate(String firmwareId, String newVersion, String newSha1) {
        HTTPClient http;
        String downloadUrl = serverUrl + "/api/firmware/" + firmwareId + "/download";

        Serial.println("Downloading firmware: " + downloadUrl);
        http.begin(downloadUrl);

        int httpCode = http.GET();
        if (httpCode != 200) {
            Serial.println("Download failed: " + String(httpCode));
            http.end();
            return false;
        }

        int contentLength = http.getSize();
        if (contentLength <= 0) {
            Serial.println("Invalid content length");
            http.end();
            return false;
        }

        Serial.println("Firmware size: " + String(contentLength) + " bytes");

        // Start OTA update
        if (!Update.begin(contentLength)) {
            Serial.println("Not enough space for OTA");
            http.end();
            return false;
        }

        WiFiClient* client = http.getStreamPtr();
        size_t written = 0;
        uint8_t buffer[1024];

        Serial.println("Starting OTA update...");

        while (http.connected() && written < contentLength) {
            size_t available = client->available();
            if (available > 0) {
                size_t readBytes = client->readBytes(buffer, min(available, sizeof(buffer)));
                size_t writtenBytes = Update.write(buffer, readBytes);
                written += writtenBytes;

                // Show progress every 10%
                int progress = (written * 100) / contentLength;
                static int lastProgress = -1;
                if (progress >= lastProgress + 10 && progress % 10 == 0) {
                    Serial.println("Progress: " + String(progress) + "%");
                    lastProgress = progress;
                }

                if (writtenBytes != readBytes) {
                    Serial.println("Write error");
                    break;
                }
            }
            delay(1);
        }

        http.end();

        if (written == contentLength) {
            Serial.println("Download completed");
        } else {
            Serial.println("Download incomplete: " + String(written) + "/" + String(contentLength));
            Update.abort();
            return false;
        }

        // Finalize update
        if (Update.end()) {
            if (Update.isFinished()) {
                Serial.println("OTA Update completed successfully!");

                prefs.begin("firmware", false);

                // Save new version info
                prefs.putString("version", newVersion);
                prefs.putString("sha1", newSha1);

                Serial.println("New Version: " + newVersion + " (New SHA1: " + newSha1 + ")");

                prefs.end();

                Serial.println("Rebooting in 3 seconds...");
                delay(3000);
                ESP.restart();
                return true;
            } else {
                Serial.println("Update not finished");
            }
        } else {
            Serial.println("Update failed: " + String(Update.getError()));
        }

        return false;
    }

    // Get current firmware info
    void printCurrentInfo() {
        Serial.println("Device: " + deviceType);
        Serial.println("Version: " + currentVersion);
        Serial.println("SHA1: " + currentSha1);
        Serial.println("Check Mode: " + String(checkMode == VERSION_COMPARE ? "VERSION" : "SHA1"));
        Serial.println("Free heap: " + String(ESP.getFreeHeap()) + " bytes");
    }
};

// Example usage in your main sketch:

// Configuration
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";
const String FIRMWARE_SERVER = "http://192.168.1.100:3000";  // Your server IP
const String DEVICE_TYPE = "ESP32-DevKit";

// Create updater instance with VERSION_COMPARE mode (default)
// Change to SHA1_COMPARE if you want to use hash comparison instead
FirmwareUpdater updater(FIRMWARE_SERVER, DEVICE_TYPE, VERSION_COMPARE);

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("ESP32 OTA Updater Starting...");

    updater.setup();

    // Connect to WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to WiFi");

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.println("WiFi connected: " + WiFi.localIP().toString());

    // Optionally change check mode at runtime
    updater.setCheckMode(SHA1_COMPARE);

    // Print current firmware info
    updater.printCurrentInfo();

    // Check for updates immediately
    Serial.println("\nChecking for firmware updates...");
    updater.checkForUpdate();

    Serial.println("\nSetup complete - starting main program");
}

void loop() {
    // Your main program here

    // Check for updates every 30 minutes
    static unsigned long lastCheck = 0;
    const unsigned long CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

    if (millis() - lastCheck > CHECK_INTERVAL) {
        Serial.println("\nPeriodic update check...");
        updater.checkForUpdate();
        lastCheck = millis();
    }

    // Your application code here
    delay(1000);
    Serial.print(".");
}
```
