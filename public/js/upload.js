document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    loadRecentUploads();

    // Check authentication
    if (!authToken) {
        showAlert("Authentication required", "warning");
        window.location.href = "/";
        return;
    }
});

function setupEventListeners() {
    document.getElementById("uploadForm").addEventListener("submit", uploadFirmware);

    const fileInput = document.getElementById("firmwareFile");
    if (fileInput) {
        fileInput.addEventListener("change", validateFileInput);
    }
}

function validateFileInput(event) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [".bin", ".hex", ".elf", ".ino", ".cpp", ".c", ".h"];

    if (file.size > maxSize) {
        showAlert("File size must be less than 50MB", "warning");
        event.target.value = "";
        return;
    }

    const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;
    if (!allowedTypes.includes(fileExtension)) {
        showAlert(`File type not supported. Please use: ${allowedTypes.join(", ")}`, "warning");
        event.target.value = "";
        return;
    }
}

async function uploadFirmware(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("deviceType", document.getElementById("deviceType").value);
    formData.append("version", document.getElementById("version").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("firmware", document.getElementById("firmwareFile").files[0]);

    // Disable submit button and show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
    submitBtn.disabled = true;

    try {
        const response = await fetch("/api/firmware/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${authToken}` },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Firmware uploaded successfully!", "success");
            document.getElementById("uploadForm").reset();
            loadRecentUploads();
        } else {
            showAlert(data.error || "Upload failed", "danger");
        }
    } catch (error) {
        console.error("Upload error:", error);
        showAlert("Upload failed - server error", "danger");
    } finally {
        // Re-enable submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function resetForm() {
    document.getElementById("uploadForm").reset();
}

async function loadRecentUploads() {
    try {
        const response = await fetch("/api/firmwares?limit=5");
        const firmwares = await response.json();

        if (response.ok) {
            displayRecentUploads(firmwares);
        }
    } catch (error) {
        console.error("Error loading recent uploads:", error);
        document.getElementById("recentUploads").innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">Failed to load recent uploads</p>
            </div>
        `;
    }
}

function displayRecentUploads(firmwares) {
    const container = document.getElementById("recentUploads");

    if (firmwares.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">No recent uploads</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="list-group">
            ${firmwares
        .map(
            (firmware) => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${firmware.deviceType}</div>
                        <small class="text-muted">${firmware.version} - ${formatDate(firmware.uploadDate)}</small>
                    </div>
                    <div>
                        <span class="badge ${getVersionBadgeClass(firmware.version)} me-2">${firmware.version}</span>
                        <small class="text-muted">${formatFileSize(firmware.size)}</small>
                    </div>
                </div>
            `,
        )
        .join("")}
        </div>
    `;
}
