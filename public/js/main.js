let authToken = localStorage.getItem("authToken");
let currentUser = localStorage.getItem("currentUser");

// Initialize
document.addEventListener("DOMContentLoaded", function () {
	updateAuthUI();
	loadDevices();
	loadFirmwares();
	createToastContainer();

	document.getElementById("deviceFilter").addEventListener("change", loadFirmwares);
	document.getElementById("uploadForm").addEventListener("submit", uploadFirmware);
});

function createToastContainer() {
	// Create toast container if it doesn't exist
	if (!document.getElementById("toastContainer")) {
		const toastContainer = document.createElement("div");
		toastContainer.id = "toastContainer";
		toastContainer.style.cssText = `
			position: fixed;
			bottom: 20px;
			right: 20px;
			z-index: 9999;
			max-width: 350px;
		`;
		document.body.appendChild(toastContainer);
	}
}

function updateAuthUI() {
	const loginBtn = document.getElementById("loginBtn");
	const logoutBtn = document.getElementById("logoutBtn");
	const uploadSection = document.getElementById("uploadSection");

	if (authToken) {
		loginBtn.classList.add("d-none");
		logoutBtn.classList.remove("d-none");
		logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>Logout (' + currentUser + ")";
		uploadSection.classList.remove("d-none");
	} else {
		loginBtn.classList.remove("d-none");
		logoutBtn.classList.add("d-none");
		uploadSection.classList.add("d-none");
	}
}

function toggleAuth() {
	if (authToken) {
		logout();
	} else {
		new bootstrap.Modal(document.getElementById("loginModal")).show();
	}
}

async function login() {
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;

	try {
		const response = await fetch("/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		const data = await response.json();

		if (response.ok) {
			authToken = data.token;
			currentUser = data.username;
			localStorage.setItem("authToken", authToken);
			localStorage.setItem("currentUser", currentUser);
			updateAuthUI();
			bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
			document.getElementById("loginForm").reset();
			showAlert("Login successful!", "success");
		} else {
			showAlert(data.error, "danger");
		}
	} catch (error) {
		showAlert("Login failed", "danger");
	}
}

function logout() {
	authToken = null;
	currentUser = null;
	localStorage.removeItem("authToken");
	localStorage.removeItem("currentUser");
	updateAuthUI();
	showAlert("Logged out successfully", "info");
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
	}
}

async function loadFirmwares() {
	try {
		const deviceType = document.getElementById("deviceFilter").value;
		const url = deviceType ? "/api/firmwares?device=" + encodeURIComponent(deviceType) : "/api/firmwares";

		const response = await fetch(url);
		const firmwares = await response.json();

		displayFirmwares(firmwares);
	} catch (error) {
		console.error("Error loading firmwares:", error);
	}
}

function displayFirmwares(firmwares) {
	const container = document.getElementById("firmwaresList");

	if (firmwares.length === 0) {
		container.innerHTML = '<div class="text-center py-5"><h5>No firmwares available</h5></div>';
		return;
	}

	const grouped = firmwares.reduce((acc, firmware) => {
		if (!acc[firmware.deviceType]) {
			acc[firmware.deviceType] = [];
		}
		acc[firmware.deviceType].push(firmware);
		return acc;
	}, {});

	// Sort each device type's firmwares by semver version (descending - newest first)
	Object.keys(grouped).forEach((deviceType) => {
		grouped[deviceType].sort((a, b) => compareSemver(b.version, a.version));
	});

	container.innerHTML = Object.keys(grouped)
		.map((deviceType) => {
			const deviceFirmwares = grouped[deviceType];
			return `
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-microchip me-2"></i>
                                ${deviceType}
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${deviceFirmwares
									.map(
										(firmware) => `
                                    <div class="col-md-6 col-lg-4 mb-3">
                                        <div class="card firmware-card h-100">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <span class="badge ${getVersionBadgeClass(firmware.version)} version-badge">${firmware.version}</span>
                                                    <small class="text-muted">${formatDate(firmware.uploadDate)}</small>
                                                </div>
                                                <p class="card-text">${firmware.description}</p>
                                                <div class="mb-2">
                                                    <small class="text-muted d-block">
                                                        <i class="fas fa-fingerprint me-1"></i>
                                                        SHA1: <code class="sha1-hash" title="Click to copy" onclick="copyToClipboard('${firmware.sha1}')">${
											firmware.sha1
										}</code>
                                                    </small>
                                                </div>
                                                <div class="mt-auto">
                                                    <div class="d-flex justify-content-between align-items-center">
                                                        <small class="text-muted">${formatFileSize(firmware.size)}</small>
                                                        <a href="/downloads/${firmware.filename}" class="btn btn-outline-primary btn-sm" download="${
											firmware.originalName
										}">
                                                            <i class="fas fa-download me-1"></i>Download
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `,
									)
									.join("")}
                            </div>
                        </div>
                    </div>
                `;
		})
		.join("");
}

async function uploadFirmware(e) {
	e.preventDefault();

	const formData = new FormData();
	formData.append("deviceType", document.getElementById("deviceType").value);
	formData.append("version", document.getElementById("version").value);
	formData.append("description", document.getElementById("description").value);
	formData.append("firmware", document.getElementById("firmwareFile").files[0]);

	try {
		const response = await fetch("/api/firmware/upload", {
			method: "POST",
			headers: { Authorization: "Bearer " + authToken },
			body: formData,
		});

		const data = await response.json();

		if (response.ok) {
			showAlert("Firmware uploaded successfully!", "success");
			document.getElementById("uploadForm").reset();
			loadDevices();
			loadFirmwares();
		} else {
			showAlert(data.error, "danger");
		}
	} catch (error) {
		showAlert("Upload failed", "danger");
	}
}

function copyToClipboard(text) {
	if (navigator.clipboard && window.isSecureContext) {
		// Use the modern clipboard API
		navigator.clipboard
			.writeText(text)
			.then(() => {
				showAlert("SHA1 hash copied to clipboard!", "success");
			})
			.catch(() => {
				fallbackCopyToClipboard(text);
			});
	} else {
		// Fallback for older browsers or non-HTTPS contexts
		fallbackCopyToClipboard(text);
	}
}

function fallbackCopyToClipboard(text) {
	const textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.style.position = "fixed";
	textArea.style.left = "-999999px";
	textArea.style.top = "-999999px";
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		document.execCommand("copy");
		showAlert("SHA1 hash copied to clipboard!", "success");
	} catch (err) {
		showAlert("Failed to copy SHA1 hash", "danger");
	}

	document.body.removeChild(textArea);
}

function showAlert(message, type) {
	const toastContainer = document.getElementById("toastContainer");

	// Create unique ID for this toast
	const toastId = "toast_" + Date.now();

	// Create toast element
	const toastDiv = document.createElement("div");
	toastDiv.id = toastId;
	toastDiv.className = `toast mb-2`;
	toastDiv.setAttribute("role", "alert");
	toastDiv.setAttribute("aria-live", "assertive");
	toastDiv.setAttribute("aria-atomic", "true");

	// Set toast colors based on type
	const colors = {
		success: { bg: "#d1e7dd", border: "#badbcc", text: "#0f5132" },
		danger: { bg: "#f8d7da", border: "#f5c2c7", text: "#842029" },
		info: { bg: "#d1ecf1", border: "#bee5eb", text: "#055160" },
		warning: { bg: "#fff3cd", border: "#ffecb5", text: "#664d03" },
	};

	const color = colors[type] || colors.info;

	toastDiv.innerHTML = `
		<div class="toast-body d-flex align-items-center" style="background-color: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border}; border-radius: 0.375rem;">
			<button type="button" class="btn-close me-3" onclick="removeToast('${toastId}')" style="margin: 0; padding: 0; width: 16px; height: 16px;"></button>
			<div class="flex-grow-1">${message}</div>
		</div>
	`;

	// Add toast to container
	toastContainer.appendChild(toastDiv);

	// Show toast with animation
	setTimeout(() => {
		toastDiv.classList.add("show");
	}, 100);

	// Auto-remove toast after 5 seconds
	setTimeout(() => {
		removeToast(toastId);
	}, 5000);
}

function removeToast(toastId) {
	const toast = document.getElementById(toastId);
	if (toast) {
		toast.classList.remove("show");
		setTimeout(() => {
			toast.remove();
		}, 300); // Wait for fade-out animation
	}
}

function getVersionBadgeClass(version) {
	const lowerVersion = version.toLowerCase();

	if (lowerVersion.includes("alpha")) {
		return "bg-danger"; // Red for alpha versions
	} else if (lowerVersion.includes("beta")) {
		return "bg-warning"; // Yellow for beta versions
	} else if (lowerVersion.includes("rc") || lowerVersion.includes("release-candidate")) {
		return "bg-info"; // Blue for release candidate versions
	} else if (lowerVersion.includes("dev") || lowerVersion.includes("snapshot")) {
		return "bg-dark"; // Dark for development versions
	} else {
		return "bg-success"; // Green for stable/release versions
	}
}

function compareSemver(a, b) {
	// Parse version strings into comparable arrays
	const parseVersion = (version) => {
		// Remove 'v' prefix if present and split by dots
		const cleaned = version.replace(/^v/, "");
		return cleaned.split(".").map((part) => {
			// Handle pre-release versions (e.g., 1.0.0-alpha.1)
			const [main, prerelease] = part.split("-");
			const num = parseInt(main) || 0;

			// If there's a prerelease, it should sort before the main version
			if (prerelease) {
				return [num, prerelease];
			}
			return [num, null];
		});
	};

	const versionA = parseVersion(a);
	const versionB = parseVersion(b);

	// Compare each part of the version
	const maxLength = Math.max(versionA.length, versionB.length);

	for (let i = 0; i < maxLength; i++) {
		const partA = versionA[i] || [0, null];
		const partB = versionB[i] || [0, null];

		// Compare main number
		if (partA[0] !== partB[0]) {
			return partA[0] - partB[0];
		}

		// If main numbers are equal, compare prerelease
		if (partA[1] !== partB[1]) {
			// null (no prerelease) comes after prerelease
			if (partA[1] === null) return 1;
			if (partB[1] === null) return -1;

			// Compare prerelease strings
			return partA[1].localeCompare(partB[1]);
		}
	}

	return 0;
}

function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString();
}

function formatFileSize(bytes) {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
