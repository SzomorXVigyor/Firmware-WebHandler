const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const storageManager = require("../models/StorageManager");

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const user = await storageManager.getUser(username);

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Save last login time
        user.lastLogin = new Date().toISOString();
        storageManager.saveUser(user);

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role || "bot",
            },
            config.JWT_SECRET,
            { expiresIn: "24h" },
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role || "bot",
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    login,
};
