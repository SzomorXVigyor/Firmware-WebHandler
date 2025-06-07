// User Profile and Management functionality

let currentUserProfile = null;
let allUsers = [];

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    // Check authentication
    if (!authToken) {
        window.location.href = "/";
        return;
    }
    loadUserProfile().then(() => {;
	    loadUsers();
    });
    setupEventListeners();
    updateUIForUserRole();
});

function setupEventListeners() {
    // Change password form
    document.getElementById("changePasswordForm").addEventListener("submit", handlePasswordChange);

    // User search
    document.getElementById("userSearch").addEventListener("input", filterUsers);
    document.getElementById("roleFilter").addEventListener("change", filterUsers);

    // Password confirmation validation
    document.getElementById("confirmPassword").addEventListener("input", validatePasswordMatch);
    document.getElementById("newPassword").addEventListener("input", validatePasswordMatch);
}

async function loadUserProfile() {
    try {
        const response = await fetch("/api/user/profile", {
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            currentUserProfile = await response.json();
            ConfigManager.onReady(() => {displayUserProfile(currentUserProfile)});
        } else if (response.status === 401 || response.status === 403) {
            handleAuthError();
        } else {
            showAlert("Failed to load user profile", "danger");
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
        showAlert("Error loading user profile", "danger");
    }
}

function displayUserProfile(profile) {
    const profileInfo = document.getElementById("profileInfo");

    const roleClass = getRoleClass(profile.role);

    profileInfo.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="d-flex align-items-center mb-3">
                    <div class="avatar-circle me-3">
                        <i class="fas fa-user fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">${profile.username}</h5>
                        <div class="d-flex gap-2">
                            <span class="badge ${roleClass}">${profile.role}</span>
                        </div>
                    </div>
                </div>

                <hr>

                <div class="row text-muted">
                    <div class="col-sm-6">
                        <strong>Created:</strong><br>
                        <small>${formatDate(profile.createdAt)}</small>
                    </div>
                    <div class="col-sm-6">
                        <strong>Last Login:</strong><br>
                        <small>${profile.lastLogin ? formatDate(profile.lastLogin, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
    }) : "Never"}
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .avatar-circle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #007bff, #0056b3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                flex-shrink: 0;
            }
        </style>
    `;

    // Update UI based on user role
    updateUIForUserRole();
}

function updateUIForUserRole() {
    if (!currentUserProfile) return;

    const currentAdmin = isAdmin();

    // Show/hide admin sections
    const adminElements = document.querySelectorAll(".admin-only");
    adminElements.forEach((el) => {
        el.style.display = currentAdmin ? "block" : "none";
    });
}

async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        showAlert("New passwords do not match", "danger");
        return;
    }

    if (newPassword.length < 6) {
        showAlert("Password must be at least 6 characters long", "danger");
        return;
    }

    try {
        const response = await fetch("/api/user/change-password", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Password updated successfully", "success");
            document.getElementById("changePasswordForm").reset();
        } else {
            showAlert(data.error || "Failed to update password", "danger");
        }
    } catch (error) {
        console.error("Password change error:", error);
        showAlert("Failed to update password", "danger");
    }
}

function validatePasswordMatch() {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const confirmInput = document.getElementById("confirmPassword");

    if (confirmPassword && newPassword !== confirmPassword) {
        confirmInput.setCustomValidity("Passwords do not match");
        confirmInput.classList.add("is-invalid");
    } else {
        confirmInput.setCustomValidity("");
        confirmInput.classList.remove("is-invalid");
    }
}

async function loadUsers() {
    if (!authToken || !isAdmin()) return;

    try {
        const response = await fetch("/api/users", {
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            allUsers = await response.json();
            ConfigManager.onReady(() => {displayUsers(allUsers)});
        } else if (response.status === 401) {
            handleAuthError();
        } else {
            showAlert("Failed to load users", "danger");
        }
    } catch (error) {
        console.error("Error loading users:", error);
        showAlert("Error loading users", "danger");
    }
}

function displayUsers(users) {
    const tbody = document.getElementById("usersTableBody");

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <p class="mb-0">No users found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users
        .map((user) => {
            const roleClass = getRoleClass(user.role);
            const canDelete = canDeleteUser(user);
            const canEdit = canEditUser(user);

            return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm me-2">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <strong>${user.username}</strong>
                            ${user.id === currentUserProfile?.id ? '<small class="text-primary">(You)</small>' : ""}
                        </div>
                    </div>
                </td>
                <td><span class="badge ${roleClass}">${user.role}</span></td>
                <td><small>${formatDate(user.createdAt)}</small></td>
                <td><small>${user.lastLogin ? formatDate(user.lastLogin, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }) : "Never"}</small></td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        ${
    canEdit
        ? `
                            <button type="button" class="btn btn-outline-primary" onclick="showEditUserModal('${user.id}')" title="Edit User">
                                <i class="fas fa-edit"></i>
                            </button>
                        `
        : ""
}
                        ${
    canDelete
        ? `
                            <button type="button" class="btn btn-outline-danger" onclick="confirmDeleteUser('${user.id}', '${user.username}')" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        `
        : ""
}
                    </div>
                </td>
            </tr>
        `;
        })
        .join("");
}

function filterUsers() {
    if (!allUsers.length) return;

    const searchTerm = document.getElementById("userSearch").value.toLowerCase();
    const roleFilter = document.getElementById("roleFilter").value;

    const filtered = allUsers.filter((user) => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    displayUsers(filtered);
}

function showCreateUserModal() {
    document.getElementById("createUserForm").reset();
    new bootstrap.Modal(document.getElementById("createUserModal")).show();
}

async function createUser() {
    const username = document.getElementById("newUsername").value;
    const password = document.getElementById("newUserPassword").value;
    const role = document.getElementById("newUserRole").value;

    if (!username || !password || !role) {
        showAlert("Please fill in all fields", "danger");
        return;
    }

    if (username.length < 3) {
        showAlert("Username must be at least 3 characters long", "danger");
        return;
    }

    if (password.length < 6) {
        showAlert("Password must be at least 6 characters long", "danger");
        return;
    }

    try {
        const response = await fetch("/api/user", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
                role,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`User "${username}" created successfully`, "success");
            bootstrap.Modal.getInstance(document.getElementById("createUserModal")).hide();
            loadUsers();
        } else {
            showAlert(data.error || "Failed to create user", "danger");
        }
    } catch (error) {
        console.error("User creation error:", error);
        showAlert("Failed to create user", "danger");
    }
}

function showEditUserModal(userId) {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    document.getElementById("editUserId").value = user.id;
    document.getElementById("editUsername").value = user.username;
    document.getElementById("editUserRole").value = user.role;

    new bootstrap.Modal(document.getElementById("editUserModal")).show();
}

async function updateUser() {
    const username = document.getElementById("editUsername").value;
    const role = document.getElementById("editUserRole").value;

    try {
        const response = await fetch(`/api/user/${username}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({

                role,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("User updated successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();
            loadUsers();
        } else if (response.status === 401 || response.status === 403) {
            handleAuthError();
        } else {
            showAlert(data.error || "Failed to update user", "danger");
        }
    } catch (error) {
        console.error("User update error:", error);
        showAlert("Failed to update user", "danger");
    }
}

function confirmDeleteUser(userId, username) {
    const user = allUsers.find((u) => u.id === userId);
    if (!canDeleteUser(user)) {
        showAlert("You cannot delete this user", "warning");
        return;
    }

    const confirmModal = document.getElementById("confirmModal");
    const confirmText = document.getElementById("confirmModalText");
    const confirmBtn = document.getElementById("confirmModalConfirm");

    confirmText.textContent = `Are you sure you want to delete user "${username}"? This action cannot be undone.`;

    // Remove existing click handlers
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // Add new click handler
    newConfirmBtn.addEventListener("click", () => deleteUser(username));

    new bootstrap.Modal(confirmModal).show();
}

async function deleteUser(username) {
    try {
        const response = await fetch(`/api/user/${username}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("User deleted successfully", "success");
            bootstrap.Modal.getInstance(document.getElementById("confirmModal")).hide();
            loadUsers();
        } else if (response.status === 401 || response.status === 403) {
            handleAuthError();
        } else {
            showAlert(data.error || "Failed to delete user", "danger");
        }
    } catch (error) {
        console.error("User deletion error:", error);
        showAlert("Failed to delete user", "danger");
    }
}

// Helper functions
function isAdmin() {
    return currentUserProfile && (currentUserProfile.role === "admin");
}

function canDeleteUser(user) {
    if (!currentUserProfile || !user) return false;

    if (user.id === currentUserProfile.id) return false;

    // Admins and can delete regular users and admins
    return isAdmin();
}

function canEditUser(user) {
    if (!currentUserProfile || !user) return false;

    if (user.id === currentUserProfile.id) return false;

    // Admins and can edit users
    return isAdmin();
}

function getRoleClass(role) {
    switch (role) {
        case "admin":
            return "bg-danger";
        case "filemanager":
            return "bg-warning text-dark";
        case "bot":
        default:
            return "bg-secondary";
    }
}

// Add avatar styles
const avatarStyles = document.createElement("style");
avatarStyles.textContent = `
    .avatar-sm {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6c757d, #495057);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        flex-shrink: 0;
    }
`;
document.head.appendChild(avatarStyles);
