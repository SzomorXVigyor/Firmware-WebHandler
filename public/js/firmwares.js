let currentView = "list"; // 'grid' or 'list'

document.addEventListener("DOMContentLoaded", () => {
	loadDevices();
	loadFirmwares();
	setupEventListeners();
});

function setupEventListeners() {
	document.getElementById("deviceFilter").addEventListener("change", loadFirmwares);
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

	loadFirmwares();
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
				displayFirmwares(firmwares);
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
	const container = document.getElementById("firmwaresList");

	if (firmwares.length === 0) {
		container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5>No firmwares available</h5>
                <p class="text-muted">Upload your first firmware to get started.</p>
            </div>
        `;
		return;
	}

	const grouped = firmwares.reduce((acc, firmware) => {
		if (!acc[firmware.deviceType]) {
			acc[firmware.deviceType] = [];
		}
		acc[firmware.deviceType].push(firmware);
		return acc;
	}, {});

	// Sort each device type's firmwares by semver version (descending)
	Object.keys(grouped).forEach((deviceType) => {
		grouped[deviceType].sort((a, b) => compareSemver(b.version, a.version));
	});

	if (currentView === "list") {
		displayFirmwaresListView(grouped);
	} else {
		displayFirmwaresGridView(grouped);
	}
}

function displayFirmwaresGridView(grouped) {
	const container = document.getElementById("firmwaresList");

	container.innerHTML = Object.keys(grouped)
		.sort()
		.map((deviceType) => {
			const deviceFirmwares = grouped[deviceType];
			return `
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="fas fa-microchip me-2"></i>
                                ${deviceType}
                            </h5>
                            <small>${deviceFirmwares.length} version${deviceFirmwares.length === 1 ? "" : "s"}</small>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${deviceFirmwares.map((firmware) => createFirmwareCard(firmware)).join("")}
                        </div>
                    </div>
                </div>
            `;
		})
		.join("");
}

function displayFirmwaresListView(grouped) {
	const container = document.getElementById("firmwaresList");

	container.innerHTML = Object.keys(grouped)
		.sort()
		.map((deviceType) => {
			const deviceFirmwares = grouped[deviceType];
			return `
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="fas fa-microchip me-2"></i>
                                ${deviceType}
                            </h5>
                            <small>${deviceFirmwares.length} version${deviceFirmwares.length === 1 ? "" : "s"}</small>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Version</th>
                                        <th>Description</th>
                                        <th>Size</th>
                                        <th>Upload Date</th>
                                        <th>SHA1</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${deviceFirmwares.map((firmware) => createFirmwareRow(firmware)).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
		})
		.join("");
}

function createFirmwareRow(firmware) {
	return `
        <tr>
            <td>
                <span class="badge ${getVersionBadgeClass(firmware.version)} version-badge">${firmware.version}</span>
            </td>
            <td>
                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${firmware.description}">
                    ${firmware.description}
                </div>
            </td>
            <td>${formatFileSize(firmware.size)}</td>
            <td>${formatDate(firmware.uploadDate)}</td>
            <td>
                <code class="sha1-hash" title="Click to copy" onclick="copyToClipboard('${firmware.sha1}', event)">
                    ${firmware.sha1.substring(0, 8)}...
                </code>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <a href="/api/firmware/${firmware.id}/download" class="btn btn-outline-primary btn-sm px-3" title="Download">
                        <i class="fas fa-download"></i>
                    </a>
                    <button class="btn btn-outline-warning btn-sm px-2 admin-only" style="display: none;" onclick="editFirmware('${firmware.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm px-2 admin-only" style="display: none;" onclick="deleteFirmware('${
						firmware.id
					}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-outline-info btn-sm px-3" onclick="viewFirmwareDetails('${firmware.id}')" title="View Details">
                        <i class="fas fa-info"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function createFirmwareCard(firmware) {
	return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card firmware-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${getVersionBadgeClass(firmware.version)} version-badge">${firmware.version}</span>
                        <small class="text-muted">${formatDate(firmware.uploadDate)}</small>
                    </div>
                    <p class="card-text text-truncate">${firmware.description}</p>
                    <div class="mb-2">
                        <small class="text-muted d-block">
                            <i class="fas fa-fingerprint me-1"></i>
                            SHA1: <code class="sha1-hash" title="Click to copy" onclick="copyToClipboard('${firmware.sha1}', event)">${firmware.sha1.substring(
		0,
		8,
	)}...</code>
                        </small>
                    </div>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-muted">${formatFileSize(firmware.size)}</small>
                            <div class="btn-group" role="group">
                                <a href="/api/firmware/${firmware.id}/download" class="btn btn-outline-primary btn-sm px-3" title="Download">
                                    <i class="fas fa-download"></i>
                                </a>
                                <button class="btn btn-outline-warning btn-sm px-2 admin-only" style="display: none;" onclick="editFirmware('${
									firmware.id
								}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm px-2 admin-only" style="display: none;" onclick="deleteFirmware('${
									firmware.id
								}')" title="Delete">
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
                    <tr><td><strong>Upload Date:</strong></td><td>${formatDate(firmware.uploadDate)}</td></tr>
                    <tr><td><strong>Original Name:</strong></td><td>${firmware.originalName}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Technical Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>SHA1 Hash:</strong></td><td><code class="sha1-hash" title="Click to copy" onclick="copyToClipboard('${
						firmware.sha1
					}', event)">${firmware.sha1}</code></td></tr>
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
