const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const FirmwareManager = require("../models/FirmwareManager");
const config = require("../config/config");

const firmwareManager = new FirmwareManager();

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = firmwareManager.findUser(username);
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            config.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token, username: user.username });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    login
};
