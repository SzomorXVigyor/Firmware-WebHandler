const bcrypt = require("bcrypt");
const config = require("../config/config");
const storageManager = require("../models/StorageManager");

const getUser = async (req, res) => {
    try {
        if (!req.user || !req.user.username) {
            throw new Error("User not authenticated");
        }
        const user = await storageManager.getUser(req.user.username);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.password = undefined; // Remove password from response for security
        res.json(user);
    } catch (error) {
        console.error("Error getting user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await storageManager.getAllUsers();
        //Remove passwords from all users for security
        users.forEach(user => {
            user.password = undefined;
        });
        res.json(users);
    } catch (error) {
        console.error("Error getting users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const createUser = async (req, res) => {
    try {
        const user = req.body;

        if (!user.username || !user.password || !user.role) {
            return res.status(400).json({ error: "Username, password and role are required" });
        }

        const existingUser = await storageManager.getUser(user.username);

        if (existingUser) {
            return res.status(409).json({ error: "Username already taken" });
        }

        // Hash the password before saving
        user.password = bcrypt.hashSync(user.password, config.BCRYPT_SALT_ROUNDS);

        const savedUser = await storageManager.saveUser(user);
        savedUser.password = undefined; // Remove password from response for security
        res.status(201).json(savedUser);
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateUser = async (req, res) => {
    try {
        const { username } = req.params;
        const user = req.body;
        user.username = username;

        if (!username) {
            return res.status(400).json({ error: "Username are required as a request paramter" });
        }

        const result = await storageManager.saveUser(user);
        if (result) {
            result.password = undefined; // Remove password from response for security
            res.json(result);
        } else {
            return res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({ error: "Username are required as a request paramter" });
        }

        const result = await storageManager.deleteUser(username);
        if (result) {
            return res.json({ message: "User deleted successfully" });
        } else {
            return res.status(404).json({ error: "User not found" });
        }

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const changePassword = async (req, res) => {
    try {
        const { currentPassword	, newPassword } = req.body;

        if (!currentPassword	 || !newPassword) {
            return res.status(400).json({ error: "Old password and new password are required" });
        }

        const user = await storageManager.getUser(req.user.username);

        if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
            return res.status(401).json({ error: "Invalid old password" });
        }

        user.password = bcrypt.hashSync(newPassword, config.BCRYPT_SALT_ROUNDS);
        await storageManager.saveUser(user);

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getUser,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
};
