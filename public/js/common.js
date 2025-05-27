// Common utilities and functions

function createToastContainer() {
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

async function checkServerHealth() {
    try {
        const response = await fetch("/api/health");
        const health = await response.json();

        if (response.ok && health.status === "healthy") {
            displayServerStatus(true, health);
        } else {
            displayServerStatus(false, health);
        }
    } catch (error) {
        console.error("Health check error:", error);
        displayServerStatus(false, { error: "Connection failed" });
    }
}

function displayServerStatus(isHealthy, healthData) {
    const statusIndicator = document.getElementById("serverStatus");
    const footerStatus = document.getElementById("footerServerStatus");

    const statusColor = isHealthy ? "success" : "danger";
    const statusIcon = isHealthy ? "check-circle" : "exclamation-triangle";
    const statusText = isHealthy ? "Online" : "Offline";

    const statusHTML = `
        <small class="text-${statusColor}">
            <i class="fas fa-${statusIcon} me-1"></i>${statusText}
        </small>
    `;

    if (statusIndicator) statusIndicator.innerHTML = statusHTML;
    if (footerStatus) footerStatus.innerHTML = statusHTML;
}

function showAlert(message, type) {
    const toastContainer = document.getElementById("toastContainer");
    const toastId = `toast_${Date.now()}`;
    const toastDiv = document.createElement("div");
    toastDiv.id = toastId;
    toastDiv.className = `toast mb-2`;
    toastDiv.setAttribute("role", "alert");
    toastDiv.setAttribute("aria-live", "assertive");
    toastDiv.setAttribute("aria-atomic", "true");

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

    toastContainer.appendChild(toastDiv);

    setTimeout(() => {
        toastDiv.classList.add("show");
    }, 100);

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
        }, 300);
    }
}

function copyToClipboard(text, event) {
    event.stopPropagation();

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showAlert("Hash copied to clipboard!", "success");
            })
            .catch(() => {
                fallbackCopyToClipboard(text);
            });
    } else {
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
        showAlert("Hash copied to clipboard!", "success");
    } catch (err) {
        showAlert("Failed to copy hash", "danger");
    }

    document.body.removeChild(textArea);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getVersionBadgeClass(version) {
    const lowerVersion = version.toLowerCase();

    if (lowerVersion.includes("alpha")) {
        return "bg-danger";
    } else if (lowerVersion.includes("beta")) {
        return "bg-warning";
    } else if (lowerVersion.includes("rc") || lowerVersion.includes("release-candidate")) {
        return "bg-info";
    } else if (lowerVersion.includes("dev") || lowerVersion.includes("snapshot")) {
        return "bg-dark";
    }
    return "bg-success";
}

function compareSemver(a, b) {
    const parseVersion = (version) => {
        const cleaned = version.replace(/^v/, "");
        return cleaned.split(".").map((part) => {
            const [main, prerelease] = part.split("-");
            const num = parseInt(main) || 0;
            if (prerelease) {
                return [num, prerelease];
            }
            return [num, null];
        });
    };

    const versionA = parseVersion(a);
    const versionB = parseVersion(b);
    const maxLength = Math.max(versionA.length, versionB.length);

    for (let i = 0; i < maxLength; i++) {
        const partA = versionA[i] || [0, null];
        const partB = versionB[i] || [0, null];

        if (partA[0] !== partB[0]) {
            return partA[0] - partB[0];
        }

        if (partA[1] !== partB[1]) {
            if (partA[1] === null) return 1;
            if (partB[1] === null) return -1;
            return partA[1].localeCompare(partB[1]);
        }
    }

    return 0;
}

// Initialize common functionality
document.addEventListener("DOMContentLoaded", () => {
    createToastContainer();
    checkServerHealth();

    // Auto-refresh server health every 5 minutes
    setInterval(() => {
        if (document.visibilityState === "visible") {
            checkServerHealth();
        }
    }, 5 * 60 * 1000);
});
