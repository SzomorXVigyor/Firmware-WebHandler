let authToken = null;
let currentUserProfile = null;

// Check for stored auth on page load
if (typeof Storage !== "undefined") {
    authToken = localStorage.getItem("authToken");
    currentUserProfile = JSON.parse(localStorage.getItem("currentUserProfile")) || null;
}

function handleAuthError() {
    logout();
    showAlert("Session expired. Please login again.", "warning");
}

function updateAuthUI() {
    const loginNavItem = document.getElementById("loginNavItem");
    const logoutNavItem = document.getElementById("logoutNavItem");
    const logoutBtn = document.getElementById("logoutBtn");

    if (authToken && currentUserProfile) {
        // Hide login button, show logout button
        if (loginNavItem) loginNavItem.classList.add("d-none");
        if (logoutNavItem) logoutNavItem.classList.remove("d-none");

        // Update logout button text with username
        if (logoutBtn) {
            logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt me-1"></i>Logout (${currentUserProfile.username})`;
        }
        // Show user-only elements
        const userElements = document.querySelectorAll(".user-only");
        userElements.forEach((el) => (el.style.display = "block"));

        // Show admin-only elements if user is admin
        const adminElements = document.querySelectorAll(".admin-only");
        if (isAdmin()) {
            adminElements.forEach((el) => (el.style.display = "block"));
        } else {
            adminElements.forEach((el) => (el.style.display = "none"));
        }
    } else {
        // Show login button, hide logout button
        if (loginNavItem) loginNavItem.classList.remove("d-none");
        if (logoutNavItem) logoutNavItem.classList.add("d-none");

        // Hide user-only elements
        const userElements = document.querySelectorAll(".user-only");
        userElements.forEach((el) => (el.style.display = "none"));

        // Hide admin-only elements
        const adminElements = document.querySelectorAll(".admin-only");
        adminElements.forEach((el) => (el.style.display = "none"));
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
            currentUserProfile = data.user;

            if (typeof Storage !== "undefined") {
                localStorage.setItem("authToken", authToken);
                localStorage.setItem("currentUserProfile", JSON.stringify(currentUserProfile));
            }

            updateAuthUI();

            bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
            document.getElementById("loginForm").reset();
            showAlert("Login successful!", "success");
        } else {
            showAlert(data.error || "Login failed", "danger");
        }
    } catch (error) {
        console.error("Login error:", error);
        showAlert("Login failed - server error", "danger");
    }
}

function logout() {
    authToken = null;
    currentUserProfile = null;

    if (typeof Storage !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUserProfile");
    }

    // Redirect to home
    window.location.href = "/";
}

function checkAuthAndRedirect(url) {
    if (authToken) {
        window.location.href = url;
    } else {
        showAlert("Please login to access the upload page", "warning");
        new bootstrap.Modal(document.getElementById("loginModal")).show();
    }
}

// Helper functions
function isAdmin() {
    return currentUserProfile && (currentUserProfile.role === "admin");
}

// Check auth status when page loads
document.addEventListener("DOMContentLoaded", () => {
    // Delegate 'Enter' key to login button if modal is visible
    document.addEventListener("keydown", (e) => {
        const loginModal = document.getElementById("loginModal");

        const isVisible = loginModal && loginModal.classList.contains("show");
        const isEnter = e.key === "Enter";

        if (isVisible && isEnter) {
            e.preventDefault(); // Prevent form submission or default behavior
            document.querySelector("#loginModal .btn.btn-primary")?.click();
        }
    });
    // Initial UI update
    updateAuthUI();
});

// Create a network operation registry
const AuthUIUpdateManager = {
    operations: new Set(),

    // Register a network operation
    register(promise, operationName = "unknown") {
        this.operations.add(promise);

        promise.finally(() => {
            this.operations.delete(promise);
            // Trigger UI update after any operation completes
            updateAuthUI();
        });

        return promise;
    },

    // Check if any operations are pending
    hasPendingOperations() {
        return this.operations.size > 0;
    },

    // Wait for all operations to complete
    async waitForAll() {
        if (this.operations.size === 0) return;
        await Promise.allSettled([...this.operations]);
    },
};
