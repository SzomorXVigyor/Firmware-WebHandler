// User Roles Model with Validation
class UserRoles {
    // Define available roles as constants
    static ROLES = {
        ADMIN: 'admin',
        FILEMANAGER: 'filemanager',
        BOT: 'bot'
    };

    // Get all valid roles as an array
    static getAllRoles() {
        return Object.values(this.ROLES);
    }

    // Validate if a role is valid
    static isValidRole(role) {
        if (typeof role !== 'string') return false;
        return this.getAllRoles().includes(role.toLowerCase());
    }

    // Check if role has specific permissions
    static hasPermission(userRole, requiredRole) {
        const hierarchy = {
            [this.ROLES.BOT]: 1,
            [this.ROLES.FILEMANAGER]: 2,
            [this.ROLES.ADMIN]: 3
        };

        const userLevel = hierarchy[userRole] || 0;
        const requiredLevel = hierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }
};

module.exports = UserRoles;
