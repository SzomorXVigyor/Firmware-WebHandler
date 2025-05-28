let authToken = null;
let currentUser = null;

// Check for stored auth on page load
if (typeof Storage !== "undefined") {
    authToken = localStorage.getItem("authToken");
    currentUser = localStorage.getItem("currentUser");
}

function updateAuthUI() {
    const loginNavItem = document.getElementById("loginNavItem");
    const logoutNavItem = document.getElementById("logoutNavItem");
    const logoutBtn = document.getElementById("logoutBtn");
    const uploadNavItem = document.getElementById("uploadNavItem");

    if (authToken) {
        // Hide login button, show logout button
        if (loginNavItem) loginNavItem.classList.add("d-none");
        if (logoutNavItem) logoutNavItem.classList.remove("d-none");

        // Update logout button text with username
        if (logoutBtn) {
            logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt me-1"></i>Logout (${currentUser})`;
        }

        // Show upload nav item
        if (uploadNavItem) uploadNavItem.style.display = "block";

        // Show admin-only elements
        const adminElements = document.querySelectorAll(".admin-only");
        adminElements.forEach((el) => (el.style.display = "block"));
    } else {
        // Show login button, hide logout button
        if (loginNavItem) loginNavItem.classList.remove("d-none");
        if (logoutNavItem) logoutNavItem.classList.add("d-none");

        // Hide upload nav item
        if (uploadNavItem) uploadNavItem.style.display = "none";

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
            currentUser = data.user?.username || "Admin";

            if (typeof Storage !== "undefined") {
                localStorage.setItem("authToken", authToken);
                localStorage.setItem("currentUser", currentUser);
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
    currentUser = null;

    if (typeof Storage !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
    }

    updateAuthUI();
    showAlert("Logged out successfully", "info");

    // Redirect to home if on upload page
    if (window.location.pathname === "/upload") {
        window.location.href = "/";
    }
}

function checkAuthAndRedirect(url) {
    if (authToken) {
        window.location.href = url;
    } else {
        showAlert("Please login to access the upload page", "warning");
        new bootstrap.Modal(document.getElementById("loginModal")).show();
    }
}

// Check auth status when page loads
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    // Redirect from upload page if not authenticated
    if (window.location.pathname === "/upload" && !authToken) {
        showAlert("Authentication required to access upload page", "warning");
        window.location.href = "/";
    }
});

// Create a network operation registry
const AuthUpdateNetworkManager = {
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
