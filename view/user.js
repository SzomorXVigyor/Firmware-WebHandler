/**
 * User Profile Page View
 * Renders the user profile and management page
 */

const { generatePageWrapper } = require("./components");
const { generateConfirmModal } = require("./components/modals");

const renderUserPage = (req, res) => {
    const content = `
    <main class="container-fluid flex-grow-1 mt-4">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h2 class="mb-4">
                        <i class="fas fa-user-cog me-2"></i>
                        User Profile & Settings
                    </h2>

                    <!-- Profile Information Card -->
                    <div class="row">
                        <div class="col-lg-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="fas fa-user me-2"></i>
                                        Profile Information
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div id="profileInfo">
                                        <div class="text-center py-3">
                                            <div class="spinner-border spinner-border-sm" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                            <p class="mt-2 text-muted">Loading profile...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="fas fa-key me-2"></i>
                                        Change Password
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <form id="changePasswordForm">
                                        <div class="mb-3">
                                            <label for="currentPassword" class="form-label">Current Password</label>
                                            <input type="password" class="form-control" id="currentPassword" required autocomplete="current-password">
                                        </div>
                                        <div class="mb-3">
                                            <label for="newPassword" class="form-label">New Password</label>
                                            <input type="password" class="form-control" id="newPassword" required autocomplete="new-password" minlength="6">
                                            <div class="form-text">Password must be at least 6 characters long</div>
                                        </div>
                                        <div class="mb-3">
                                            <label for="confirmPassword" class="form-label">Confirm New Password</label>
                                            <input type="password" class="form-control" id="confirmPassword" required autocomplete="new-password">
                                        </div>
                                        <div class="d-grid">
                                            <button type="submit" class="btn btn-primary">
                                                <i class="fas fa-save me-2"></i>Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User Management Card (Admin Only) -->
                    <div class="card admin-only mb-4" style="display: none;">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-users-cog me-2"></i>
                                    User Management
                                </h5>
                                <button type="button" class="btn btn-success btn-sm" onclick="showCreateUserModal()">
                                    <i class="fas fa-user-plus me-1"></i>Create New User
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <!-- User Search and Filters -->
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-search"></i>
                                        </span>
                                        <input type="text" class="form-control" id="userSearch" placeholder="Search users...">
                                    </div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <select class="form-select" id="roleFilter">
                                        <option value="">All Roles</option>
                                        <option value="bot">Bot</option>
                                        <option value="filemanager">Filemanager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button type="button" class="btn btn-outline-secondary w-100" onclick="loadUsers()">
                                        <i class="fas fa-sync-alt me-1"></i>Refresh
                                    </button>
                                </div>
                            </div>

                            <!-- Users Table -->
                            <div class="table-responsive">
                                <table class="table table-hover" id="usersTable">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Username</th>
                                            <th>Role</th>
                                            <th>Created</th>
                                            <th>Last Login</th>
                                            <th class="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="usersTableBody">
                                        <tr>
                                            <td colspan="6" class="text-center py-4">
                                                <div class="spinner-border spinner-border-sm" role="status">
                                                    <span class="visually-hidden">Loading...</span>
                                                </div>
                                                <p class="mt-2 text-muted mb-0">Loading users...</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Create User Modal -->
    <div class="modal fade" id="createUserModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-user-plus me-2"></i>Create New User
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="createUserForm">
                        <div class="mb-3">
                            <label for="newUsername" class="form-label">Username</label>
                            <input type="text" class="form-control" id="newUsername" required minlength="3">
                            <div class="form-text">Username must be at least 3 characters long</div>
                        </div>
                        <div class="mb-3">
                            <label for="newUserPassword" class="form-label">Password</label>
                            <input type="password" class="form-control" id="newUserPassword" required minlength="6">
                            <div class="form-text">Password must be at least 6 characters long</div>
                        </div>
                        <div class="mb-3">
                            <label for="newUserRole" class="form-label">Role</label>
                            <select class="form-select" id="newUserRole" required>
                                <option value="">Select Role</option>
                                <option value="bot">Bot</option>
                                <option value="filemanager">Filemanager</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div class="form-text">
                                <small class="text-muted">
                                    <strong>Bot:</strong> Can upload files, but labeled as a bot account.<br>
                                    <strong>Filemanager:</strong> Can upload and manage files.<br>
                                    <strong>Admin:</strong> Full system access. Create, edit, and delete users.
                                </small>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-success" onclick="createUser()">
                        <i class="fas fa-user-plus me-1"></i>Create User
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit User Modal -->
    <div class="modal fade" id="editUserModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-user-edit me-2"></i>Edit User
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <input type="hidden" id="editUserId">
                        <div class="mb-3">
                            <label for="editUsername" class="form-label">Username</label>
                            <input type="text" disabled class="form-control" id="editUsername" readonly>
                        </div>
                        <div class="mb-3">
                            <label for="editUserRole" class="form-label">Role</label>
                            <select class="form-select" id="editUserRole" required>
                                <option value="bot">Bot</option>
                                <option value="filemanager">Filemanager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="updateUser()">
                        <i class="fas fa-save me-1"></i>Update User
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    const html = generatePageWrapper(content, {
        title: "Firmware Management Server - User Profile",
        activePage: "user",
        pageModals: [generateConfirmModal],
        pageScripts: ["/js/user.js"],
    });

    res.send(html);
};

module.exports = {
    renderUserPage,
};
