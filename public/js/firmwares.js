let currentView = "list"; // 'grid' or 'list'
let allFirmwares = []; // Store all firmwares for client-side filtering
let filteredFirmwares = []; // Store currently filtered firmwares
let filterState = {
    globalSearch: "",
    deviceType: "",
    versionFilter: "",
    stableOnly: false,
    sortBy: "version-desc",
};
const defaultFilterState = { ...filterState }; // Backup of default filter state

document.addEventListener("DOMContentLoaded", () => {
    loadDevices();
    loadFirmwares();
    setupEventListeners();
    restoreFilterState();
});

function setupEventListeners() {
    document.getElementById("deviceFilter").addEventListener("change", onFilterChange);
    document.getElementById("globalSearch").addEventListener("input", debounce(onFilterChange, 300));
    document.getElementById("versionFilter").addEventListener("input", debounce(onFilterChange, 300));
    document.getElementById("stableOnlyFilter").addEventListener("change", onFilterChange);
    document.getElementById("sortFilter").addEventListener("change", onFilterChange);

    // Global search enter key support
    document.getElementById("globalSearch").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            onFilterChange();
        }
    });
}

function toggleView() {
    currentView = currentView === "grid" ? "list" : "grid";
    const toggleBtn = document.getElementById("viewToggle");

    if (currentView === "grid") {
        toggleBtn.innerHTML = '<i class="fas fa-th-large"></i>';
        toggleBtn.title = "Switch to List View";
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-list"></i>';
        toggleBtn.title = "Switch to Grid View";
    }

    applyFiltersAndDisplay();
}

async function loadDevices() {
    try {
        const response = await fetch("/api/devices");
        const devices = await response.json();

        const deviceFilter = document.getElementById("deviceFilter");
        deviceFilter.innerHTML = '<option value="">All Devices</option>';

        devices.forEach((device) => {
            const option = document.createElement("option");
            option.value = device;
            option.textContent = device;
            deviceFilter.appendChild(option);
        });
        if (filterState.deviceType) {
            deviceFilter.value = filterState.deviceType;
        }
    } catch (error) {
        console.error("Error loading devices:", error);
        showAlert("Failed to load devices", "warning");
    }
}

async function loadFirmwares() {
    const operation = (async () => {
        try {
            const deviceType = document.getElementById("deviceFilter").value;
            const url = deviceType ? `/api/firmwares?device=${encodeURIComponent(deviceType)}` : "/api/firmwares";

            const response = await fetch(url);
            const firmwares = await response.json();

            if (response.ok) {
                allFirmwares = firmwares;
                applyFiltersAndDisplay();
                updateActiveFiltersDisplay();
                return firmwares;
            } else {
                showAlert("Failed to load firmwares", "danger");
                throw new Error("Failed to load firmwares");
            }
        } catch (error) {
            console.error("Error loading firmwares:", error);
            showAlert("Error loading firmwares", "danger");
            throw error;
        }
    })();

    return AuthUpdateNetworkManager.register(operation, "loadFirmwares");
}

function displayFirmwares(firmwares) {
    return new Promise((resolve) => {
        const container = document.getElementById("firmwaresList");

        if (firmwares.length === 0) {
            if (allFirmwares.length === 0) {
                container.innerHTML = `
					<div class="text-center py-5">
						<i class="fas fa-inbox fa-3x text-muted mb-3"></i>
						<h5>No firmwares available</h5>
						<p class="text-muted">Upload your first firmware to get started.</p>
					</div>
				`;
            } else {
                container.innerHTML = `
					<div class="text-center py-5">
						<i class="fas fa-search fa-3x text-muted mb-3"></i>
						<h5>No firmwares match your filters</h5>
						<p class="text-muted">Try adjusting your search criteria or <button type="button" class="btn btn-link p-0" onclick="clearAllFilters()">clear all filters</button>.</p>
					</div>
				`;
            }
            return resolve();
        }

        const grouped = firmwares.reduce((acc, firmware) => {
            if (!acc[firmware.deviceType]) {
                acc[firmware.deviceType] = [];
            }
            acc[firmware.deviceType].push(firmware);
            return acc;
        }, {});

        if (currentView === "list") {
            displayFirmwaresListView(grouped);
        } else {
            displayFirmwaresGridView(grouped);
        }

        resolve();
    });
}

function displayFirmwaresGridView(grouped) {
    const container = document.getElementById("firmwaresList");

    container.innerHTML = Object.keys(grouped)
        .sort()
        .map((deviceType, index) => {
            const collapseId = `collapseGrid${index}`;
            const deviceFirmwares = grouped[deviceType];
            const isExpanded = checkDefaultFilterState() ? "" : "show";

            return `
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center"
                         role="button"
                         data-bs-toggle="collapse"
                         data-bs-target="#${collapseId}"
                         aria-expanded="${isExpanded ? "true" : "false"}"
                         aria-controls="${collapseId}">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-chevron-right me-2 collapse-toggle-icon transition" data-target="${collapseId}" style="transform: rotate(
                            ${isExpanded ? 90 : 0}deg); transition: transform 0.3s;"></i>
                            <h5 class="mb-0">
                                <i class="fas fa-microchip me-2"></i>
                                ${deviceType}
                            </h5>
                        </div>
                        <small>${deviceFirmwares.length} version${deviceFirmwares.length === 1 ? "" : "s"}</small>
                    </div>
                    <div class="collapse ${isExpanded}" id="${collapseId}">
                        <div class="card-body">
                            <div class="row">
                                ${deviceFirmwares.map((firmware) => createFirmwareCard(firmware)).join("")}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

    // Chevron icon rotation
    document.querySelectorAll(".collapse").forEach((collapse) => {
        const icon = document.querySelector(`.collapse-toggle-icon[data-target="${collapse.id}"]`);
        if (icon) {
            collapse.addEventListener("show.bs.collapse", () => (icon.style.transform = "rotate(90deg)"));
            collapse.addEventListener("hide.bs.collapse", () => (icon.style.transform = "rotate(0deg)"));
        }
    });
}

function displayFirmwaresListView(grouped) {
    const container = document.getElementById("firmwaresList");

    container.innerHTML = Object.keys(grouped)
        .sort()
        .map((deviceType, index) => {
            const collapseId = `collapseList${index}`;
            const deviceFirmwares = grouped[deviceType];
            const isExpanded = checkDefaultFilterState() ? "" : "show";

            return `
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center"
                         role="button"
                         data-bs-toggle="collapse"
                         data-bs-target="#${collapseId}"
                         aria-expanded="${isExpanded ? "true" : "false"}"
                         aria-controls="${collapseId}">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-chevron-right me-2 collapse-toggle-icon transition" data-target="${collapseId}" style="transform: rotate(
                            ${isExpanded ? 90 : 0}deg); transition: transform 0.3s;"></i>
                            <h5 class="mb-0">
                                <i class="fas fa-microchip me-2"></i>
                                ${deviceType}
                            </h5>
                        </div>
                        <small>${deviceFirmwares.length} version${deviceFirmwares.length === 1 ? "" : "s"}</small>
                    </div>
                    <div class="collapse ${isExpanded}" id="${collapseId}">
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Version</th>
                                            <th>Description</th>
                                            <th class="text-center align-middle" style="width: 160px;">Size</th>
                                            <th class="text-center align-middle" style="width: 160px;">Upload Date</th>
                                            <th class="text-center align-middle" style="width: 160px;">SHA1</th>
                                            <th class="text-center align-middle" style="width: 160px;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${deviceFirmwares.map((firmware) => createFirmwareRow(firmware)).join("")}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

    // Optional: rotate chevron on toggle
    document.querySelectorAll(".collapse").forEach((collapse) => {
        const icon = document.querySelector(`.collapse-toggle-icon[data-target="${collapse.id}"]`);
        if (icon) {
            collapse.addEventListener("show.bs.collapse", () => (icon.style.transform = "rotate(90deg)"));
            collapse.addEventListener("hide.bs.collapse", () => (icon.style.transform = "rotate(0deg)"));
        }
    });
}

function createFirmwareRow(firmware) {
    const isStable = isStableVersion(firmware.version);
    const versionIcon = isStable ? "fas fa-shield-alt" : "fas fa-flask";
    return `
        <tr>
            <td>
                <span class="badge ${getVersionBadgeClass(firmware.version)} version-badge"><i class="${versionIcon} me-1"></i>
                    ${firmware.version}</span>
            </td>
            <td>
                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${firmware.description}">
                    ${firmware.description}
                </div>
            </td>
            <td class="text-center align-middle">${formatFileSize(firmware.size)}</td>
            <td class="text-center align-middle">${formatDate(firmware.createdAt)}</td>
            <td class="text-center align-middle">
                <code class="sha1-hash" title="Click to copy" onclick="copyToClipboard('${firmware.sha1}', event)">
                    ${firmware.sha1.substring(0, 14)}...
                </code>
            </td>
            <td class="text-end align-middle" style="width: 160px;">
                <div class="btn-group" role="group">
                    <a href="/api/firmware/${firmware.id}/download" class="btn btn-outline-primary btn-sm px-3" title="Download">
                        <i class="fas fa-download"></i>
                    </a>
                    <button class="btn btn-outline-warning btn-sm px-2 admin-only" style="display: none;" onclick="editFirmware('${firmware.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm px-2 admin-only" style="display: none;" onclick="deleteFirmware('
                    ${firmware.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-outline-info btn-sm px-3" onclick="viewFirmwareDetails('${firmware.id}')" title="View Details">
                        <i class="fas fa-info"></i>
                    </button>
                </div>
            </td>
        </td>
        </tr>
    `;
}

function createFirmwareCard(firmware) {
    const isStable = isStableVersion(firmware.version);
    const versionIcon = isStable ? "fas fa-shield-alt" : "fas fa-flask";
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card firmware-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${getVersionBadgeClass(firmware.version)} version-badge"><i class="${versionIcon} me-1"></i>
                        ${firmware.version}</span>
                        <small class="text-muted">${formatDate(firmware.createdAt)}</small>
                    </div>
                    <p class="card-text text-truncate">${firmware.description}</p>
                    <div class="mb-2">
                        <small class="text-muted text-truncate d-block">
                            <i class="fas fa-fingerprint me-1"></i>
                            SHA1: <code class="sha1-hash" title="Click to copy" onclick="copyToClipboard('${firmware.sha1}', event)">${firmware.sha1}</code>
                        </small>
                    </div>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-muted">${formatFileSize(firmware.size)}</small>
                            <div class="btn-group" role="group">
                                <a href="/api/firmware/${firmware.id}/download" class="btn btn-outline-primary btn-sm px-3" title="Download">
                                    <i class="fas fa-download"></i>
                                </a>
                                <button class="btn btn-outline-warning btn-sm px-2 admin-only" style="display: none;" onclick="editFirmware('
                                ${firmware.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm px-2 admin-only" style="display: none;" onclick="deleteFirmware('
                                ${firmware.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-outline-info btn-sm px-3" onclick="viewFirmwareDetails('${firmware.id}')" title="View Details">
                                    <i class="fas fa-info"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function viewFirmwareDetails(firmwareId) {
    try {
        const response = await fetch(`/api/firmware/${firmwareId}`);
        const firmware = await response.json();

        if (response.ok) {
            showFirmwareModal(firmware);
        } else {
            showAlert("Failed to load firmware details", "danger");
        }
    } catch (error) {
        console.error("Error loading firmware details:", error);
        showAlert("Error loading firmware details", "danger");
    }
}

function showFirmwareModal(firmware) {
    let modal = document.getElementById("firmwareDetailsModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.innerHTML = `
            <div class="modal fade" id="firmwareDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Firmware Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="firmwareDetailsBody">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const modalBody = document.getElementById("firmwareDetailsBody");
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Basic Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Device Type:</strong></td><td>${firmware.deviceType}</td></tr>
                    <tr><td><strong>Version:</strong></td><td><span class="badge ${getVersionBadgeClass(firmware.version)}">${firmware.version}</span></td></tr>
                    <tr><td><strong>File Size:</strong></td><td>${formatFileSize(firmware.size)}</td></tr>
                    <tr><td><strong>Upload Date:</strong></td><td>${formatDate(firmware.createdAt)}</td></tr>
                    <tr><td><strong>Original Name:</strong></td><td>${firmware.originalName}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Technical Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>SHA1 Hash:</strong></td><td><code class="sha1-hash" title="Click to copy" onclick="copyToClipboard('
                    ${firmware.sha1}', event)">${firmware.sha1}</code></td></tr>
                    <tr><td><strong>File ID:</strong></td><td><code>${firmware.fileId}</code></td></tr>
                </table>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Description</h6>
                <div class="border p-3 bg-light rounded">
                    ${firmware.description}
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(document.getElementById("firmwareDetailsModal")).show();
}

async function editFirmware(firmwareId) {
    try {
        const response = await fetch(`/api/firmware/${firmwareId}`);
        const firmware = await response.json();

        if (response.ok) {
            showEditFirmwareModal(firmware);
        } else {
            showAlert("Failed to load firmware details for editing", "danger");
        }
    } catch (error) {
        console.error("Error loading firmware for edit:", error);
        showAlert("Error loading firmware details", "danger");
    }
}

function showEditFirmwareModal(firmware) {
    let modal = document.getElementById("editFirmwareModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.innerHTML = `
            <div class="modal fade" id="editFirmwareModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Firmware</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editFirmwareForm">
                                <input type="hidden" id="editFirmwareId">
                                <div class="mb-3">
                                    <label for="editDeviceType" class="form-label">Device Type</label>
                                    <input disabled type="text" class="form-control" id="editDeviceType" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editVersion" class="form-label">Version</label>
                                    <input type="text" class="form-control version-badge" id="editVersion" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="editDescription" rows="3" required></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveEditedFirmware()">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("editFirmwareId").value = firmware.id;
    document.getElementById("editDeviceType").value = firmware.deviceType;
    document.getElementById("editVersion").value = firmware.version;
    document.getElementById("editDescription").value = firmware.description;

    new bootstrap.Modal(document.getElementById("editFirmwareModal")).show();
}

async function saveEditedFirmware() {
    const firmwareId = document.getElementById("editFirmwareId").value;
    const formData = {
        deviceType: document.getElementById("editDeviceType").value,
        version: document.getElementById("editVersion").value,
        description: document.getElementById("editDescription").value,
    };

    try {
        const response = await fetch(`/api/firmware/${firmwareId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            showAlert("Firmware updated successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("editFirmwareModal")).hide();
            loadFirmwares();
        } else {
            const data = await response.json();
            showAlert(data.error || "Failed to update firmware", "danger");
        }
    } catch (error) {
        console.error("Error updating firmware:", error);
        showAlert("Error updating firmware", "danger");
    }
}

async function deleteFirmware(firmwareId) {
    const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
    confirmModal.show();

    // Set up the confirm button click handler
    const confirmButton = document.getElementById("confirmModalConfirm");

    // Remove any existing event listeners to prevent duplicates
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    // Add the new event listener
    newConfirmButton.addEventListener("click", async () => {
        confirmModal.hide();

        try {
            const response = await fetch(`/api/firmware/${firmwareId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.ok) {
                showAlert("Firmware deleted successfully", "success");
                loadFirmwares();
            } else {
                const data = await response.json();
                showAlert(data.error || "Failed to delete firmware", "danger");
            }
        } catch (error) {
            console.error("Error deleting firmware:", error);
            showAlert("Error deleting firmware", "danger");
        }
    });
}

function isStableVersion(version) {
    // Consider version stable if it doesn't contain alpha, beta, rc, dev, pre keywords
    const unstableKeywords = ["alpha", "beta", "rc", "dev", "pre", "snapshot", "canary"];
    const lowerVersion = version.toLowerCase();
    return !unstableKeywords.some((keyword) => lowerVersion.includes(keyword));
}

function sortFirmwares(firmwares, sortBy) {
    const sorted = [...firmwares];

    switch (sortBy) {
        case "version-desc":
            return sorted.sort((a, b) => compareSemver(b.version, a.version));
        case "version-asc":
            return sorted.sort((a, b) => compareSemver(a.version, b.version));
        case "date-desc":
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case "date-asc":
            return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        default:
            return sorted;
    }
}

function clearAllFilters() {
    document.getElementById("globalSearch").value = "";
    document.getElementById("deviceFilter").value = "";
    document.getElementById("versionFilter").value = "";
    document.getElementById("stableOnlyFilter").checked = false;
    document.getElementById("sortFilter").value = "version-desc";
    onFilterChange();
}

function clearSearch() {
    document.getElementById("globalSearch").value = "";
    onFilterChange();
}

function checkDefaultFilterState() {
    if (JSON.stringify(filterState) === JSON.stringify(defaultFilterState)) {
        return true;
    }
    return false;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function onFilterChange() {
    updateFilterState();
    applyFiltersAndDisplay();
    updateActiveFiltersDisplay();
    saveFilterState();
}

function updateFilterState() {
    filterState = {
        globalSearch: document.getElementById("globalSearch").value.trim(),
        deviceType: document.getElementById("deviceFilter").value,
        versionFilter: document.getElementById("versionFilter").value.trim(),
        stableOnly: document.getElementById("stableOnlyFilter").checked,
        sortBy: document.getElementById("sortFilter").value,
    };
}

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById("activeFilters");
    const activeFilterTags = document.getElementById("activeFilterTags");

    const filters = [];

    if (filterState.globalSearch) {
        filters.push({
            label: `Search: "${filterState.globalSearch}"`,
            value: "globalSearch",
        });
    }

    if (filterState.deviceType) {
        filters.push({
            label: `Device: ${filterState.deviceType}`,
            value: "deviceType",
        });
    }

    if (filterState.versionFilter) {
        filters.push({
            label: `Version: ${filterState.versionFilter}`,
            value: "versionFilter",
        });
    }

    if (filterState.stableOnly) {
        const versionTypeLabels = [];
        if (filterState.stableOnly) versionTypeLabels.push("Stable versions");

        if (versionTypeLabels.length > 0) {
            filters.push({
                label: `Type: ${versionTypeLabels.join(", ")}`,
                value: "versionType",
            });
        }
    }

    if (filterState.sortBy !== "version-desc") {
        const sortLabels = {
            "date-desc": "Date (Newest)",
            "date-asc": "Date (Oldest)",
            "version-asc": "Version (Lowest)",
        };

        filters.push({
            label: `Sort: ${sortLabels[filterState.sortBy]}`,
            value: "sortBy",
        });
    }

    if (filters.length > 0) {
        activeFilterTags.innerHTML = filters
            .map(
                (filter) => `
                    <span class="badge bg-primary me-1 mb-1 p-2" style="display: inline-flex; align-items: center; gap: 0.25em;">
                        ${filter.label}
                        <button type="button"
                                class="btn-close btn-close-white p-0 m-0"
                                style="line-height: 1;"
                                onclick="removeFilter('${filter.value}')"
                                aria-label="Remove filter"></button>
                    </span>
                `,
            )
            .join("");
        activeFiltersDiv.style.display = "block";
    } else {
        activeFiltersDiv.style.display = "none";
    }
}

function applyVersionFilter(firmwares, versionPattern) {
    if (!versionPattern) return firmwares;

    return firmwares.filter((firmware) => {
        const version = firmware.version;

        // Handle wildcard patterns like "2.1.*"
        if (versionPattern.includes("*")) {
            const pattern = versionPattern.replace(/\*/g, ".*");
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(version);
        }

        // Handle range patterns like ">=1.0.0", "<=2.0.0", "~1.2.0", "^2.0.0"
        if (versionPattern.includes(">=")) {
            const targetVersion = versionPattern.replace(">=", "").trim();
            return compareSemver(version, targetVersion) >= 0;
        }

        if (versionPattern.includes("<=")) {
            const targetVersion = versionPattern.replace("<=", "").trim();
            return compareSemver(version, targetVersion) <= 0;
        }

        if (versionPattern.includes(">")) {
            const targetVersion = versionPattern.replace(">", "").trim();
            return compareSemver(version, targetVersion) > 0;
        }

        if (versionPattern.includes("<")) {
            const targetVersion = versionPattern.replace("<", "").trim();
            return compareSemver(version, targetVersion) < 0;
        }

        if (versionPattern.startsWith("~")) {
            // Tilde range: ~1.2.3 := >=1.2.3 <1.(2+1).0 (patch level changes)
            const targetVersion = versionPattern.substring(1);
            const [major, minor] = targetVersion.split(".");
            const minVersion = targetVersion;
            const maxVersion = `${major}.${parseInt(minor) + 1}.0`;
            return compareSemver(version, minVersion) >= 0 && compareSemver(version, maxVersion) < 0;
        }

        if (versionPattern.startsWith("^")) {
            // Caret range: ^1.2.3 := >=1.2.3 <(1+1).0.0 (minor level changes)
            const targetVersion = versionPattern.substring(1);
            const [major] = targetVersion.split(".");
            const minVersion = targetVersion;
            const maxVersion = `${parseInt(major) + 1}.0.0`;
            return compareSemver(version, minVersion) >= 0 && compareSemver(version, maxVersion) < 0;
        }

        // Exact match
        return version === versionPattern;
    });
}

function applyFiltersAndDisplay() {
    filteredFirmwares = applyFilters(allFirmwares);
    AuthUpdateNetworkManager.register(displayFirmwares(filteredFirmwares), "renderFirmwares");
    updateResultsSummary();
}

function applyFilters(firmwares) {
    let filtered = [...firmwares];

    // Global search filter
    if (filterState.globalSearch) {
        const searchTerm = filterState.globalSearch.toLowerCase();
        filtered = filtered.filter(
            (firmware) =>
                firmware.deviceType.toLowerCase().includes(searchTerm) ||
				firmware.version.toLowerCase().includes(searchTerm) ||
				firmware.description.toLowerCase().includes(searchTerm) ||
				firmware.originalName.toLowerCase().includes(searchTerm),
        );
    }

    // Device type filter
    if (filterState.deviceType) {
        filtered = filtered.filter((firmware) => firmware.deviceType === filterState.deviceType);
    }

    // Version filter
    if (filterState.versionFilter) {
        filtered = applyVersionFilter(filtered, filterState.versionFilter);
    }

    // Stable filter
    if (filterState.stableOnly) {
        filtered = filtered.filter((firmware) => isStableVersion(firmware.version));
    }

    // Sort results
    filtered = sortFirmwares(filtered, filterState.sortBy);

    return filtered;
}

function saveFilterState() {
    localStorage.setItem("firmwareFilters", JSON.stringify(filterState));
}

function restoreFilterState() {
    const saved = localStorage.getItem("firmwareFilters");
    if (saved) {
        try {
            filterState = { ...filterState, ...JSON.parse(saved) };

            // Restore UI state
            document.getElementById("globalSearch").value = filterState.globalSearch || "";
            document.getElementById("versionFilter").value = filterState.versionFilter || "";
            document.getElementById("stableOnlyFilter").checked = filterState.stableOnly;
            document.getElementById("sortFilter").value = filterState.sortBy || "version-desc";
            // deviceFilter will be restored after devices are loaded
        } catch (error) {
            console.warn("Failed to restore filter state:", error);
        }
    }
}

function removeFilter(filterType) {
    switch (filterType) {
        case "globalSearch":
            document.getElementById("globalSearch").value = "";
            break;
        case "deviceType":
            document.getElementById("deviceFilter").value = "";
            break;
        case "versionFilter":
            document.getElementById("versionFilter").value = "";
            break;
        case "versionType":
            document.getElementById("stableOnlyFilter").checked = false;
            break;
        case "sortBy":
            document.getElementById("sortFilter").value = "version-desc";
            break;
    }
    onFilterChange();
}

function updateResultsSummary() {
    const resultsDiv = document.getElementById("resultsSummary");
    const countDiv = document.getElementById("resultsCount");

    const totalCount = allFirmwares.length;
    const filteredCount = filteredFirmwares.length;

    if (filteredCount < totalCount) {
        countDiv.textContent = `Showing ${filteredCount} of ${totalCount} firmwares`;
        resultsDiv.style.display = "block";
    } else if (totalCount > 0) {
        countDiv.textContent = `Showing all ${totalCount} firmwares`;
        resultsDiv.style.display = "block";
    } else {
        resultsDiv.style.display = "none";
    }
}
