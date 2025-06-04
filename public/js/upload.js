document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    ConfigManager.onReady(() => setSupportedFormats());
    loadRecentUploads();
    setupDeviceTypeAutocomplete();

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

function setSupportedFormats() {
    const formats = GLOBAL_CONFIG.ALLOWED_FILE_TYPES.join(", ");
    if (GLOBAL_CONFIG.ALLOWED_FILE_TYPES.length === 0) {
        document.getElementById("supported-formats").textContent = "All file types are supported";
    } else if (GLOBAL_CONFIG.ALLOWED_FILE_TYPES.length > 0) {
        document.getElementById("supported-formats").textContent = `Supported formats: ${formats}`;
        document.getElementById("firmwareFile").setAttribute("accept", GLOBAL_CONFIG.ALLOWED_FILE_TYPES.join(","));
    }
}

// Device type autocomplete functionality
let deviceTypes = [];
let isDropdownVisible = false;

async function setupDeviceTypeAutocomplete() {
    try {
        // Fetch existing device types
        const response = await fetch("/api/devices");
        if (response.ok) {
            deviceTypes = await response.json();
        }
    } catch (error) {
        console.error("Error loading device types:", error);
    }

    const deviceTypeInput = document.getElementById("deviceType");
    const deviceTypeContainer = deviceTypeInput.parentElement;

    // Disable browser autocomplete
    deviceTypeInput.setAttribute("autocomplete", "off");
    deviceTypeInput.setAttribute("spellcheck", "false");

    // Create dropdown container using Bootstrap classes
    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "dropdown-menu position-absolute w-100";
    dropdownContainer.id = "deviceTypeDropdown";
    dropdownContainer.style.display = "none";
    dropdownContainer.style.top = "100%";
    dropdownContainer.style.zIndex = "1000";
    dropdownContainer.style.maxHeight = "200px";
    dropdownContainer.style.overflowY = "auto";

    // Insert dropdown after the input
    deviceTypeContainer.appendChild(dropdownContainer);

    // Add event listeners
    deviceTypeInput.addEventListener("focus", showDeviceTypeDropdown);
    deviceTypeInput.addEventListener("input", filterDeviceTypes);
    deviceTypeInput.addEventListener("blur", (e) => {
        // Delay hiding to allow clicking on dropdown items
        setTimeout(() => hideDeviceTypeDropdown(), 150);
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!deviceTypeContainer.contains(e.target)) {
            hideDeviceTypeDropdown();
        }
    });
}

function showDeviceTypeDropdown() {
    const dropdown = document.getElementById("deviceTypeDropdown");
    const input = document.getElementById("deviceType");

    if (deviceTypes.length === 0) return;

    // Filter based on current input value
    const filteredTypes = deviceTypes.filter(type =>
        type.toLowerCase().includes(input.value.toLowerCase())
    );

    renderDeviceTypeDropdown(filteredTypes);
    dropdown.style.display = "block";
    isDropdownVisible = true;
}

function hideDeviceTypeDropdown() {
    const dropdown = document.getElementById("deviceTypeDropdown");
    dropdown.style.display = "none";
    isDropdownVisible = false;
}

function filterDeviceTypes() {
    const input = document.getElementById("deviceType");
    const dropdown = document.getElementById("deviceTypeDropdown");

    if (!isDropdownVisible) return;

    const filteredTypes = deviceTypes.filter(type =>
        type.toLowerCase().includes(input.value.toLowerCase())
    );

    renderDeviceTypeDropdown(filteredTypes);

    // Show/hide dropdown based on filtered results
    if (filteredTypes.length > 0 && input.value.length > 0) {
        dropdown.style.display = "block";
    } else if (input.value.length === 0) {
        renderDeviceTypeDropdown(deviceTypes);
        dropdown.style.display = "block";
    } else {
        dropdown.style.display = "none";
    }
}

function renderDeviceTypeDropdown(types) {
    const dropdown = document.getElementById("deviceTypeDropdown");
    const input = document.getElementById("deviceType");

    if (types.length === 0) {
        dropdown.innerHTML = `
            <div class="dropdown-item-text text-muted">
                <i class="fas fa-info-circle me-2"></i>
                No matching device types found
            </div>
        `;
        return;
    }

    dropdown.innerHTML = types.map(type => `
        <button type="button" class="dropdown-item d-flex align-items-center" data-value="${type}">
            <i class="fas fa-microchip me-2 text-primary"></i>
            ${highlightMatch(type, input.value)}
        </button>
    `).join("");

    // Add click event listeners to dropdown items
    dropdown.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", (e) => {
            const value = e.currentTarget.getAttribute("data-value");
            input.value = value;
            hideDeviceTypeDropdown();
            input.focus();
        });
    });
}

function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="text-primary fw-bold">$1</span>');
}

function validateFileInput(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > GLOBAL_CONFIG.MAX_FILE_SIZE) {
        showAlert(`File size exceeds ${formatFileSize(GLOBAL_CONFIG.MAX_FILE_SIZE)} limit`, "warning");
        event.target.value = "";
        return;
    }

    const allowedTypes = GLOBAL_CONFIG.ALLOWED_FILE_TYPES || [];

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

            // Refresh device types list to include any new device type
            setupDeviceTypeAutocomplete();
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
    hideDeviceTypeDropdown();
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

    const recentFirmwares = [...firmwares].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    container.innerHTML = `
        <div class="list-group">
            ${recentFirmwares.map((firmware) => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${firmware.deviceType}</div>
                        <small class="text-muted">${firmware.version} - ${formatDate(firmware.createdAt)}</small>
                    </div>
                    <div>
                        <span class="badge ${getVersionBadgeClass(firmware.version)} me-2">${firmware.version}</span>
                        <small class="text-muted">${formatFileSize(firmware.size)}</small>
                    </div>
                </div>
            `)
        .join("")}
        </div>
    `;
}
