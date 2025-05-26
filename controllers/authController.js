const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const FirmwareManager = require("../models/FirmwareManager");
const config = require("../config/config");

// Initialize firmware manager for auth routes
let firmwareManager = null;
async function getFirmwareManager() {
	if (!firmwareManager) {
		firmwareManager = new FirmwareManager(config);
		await firmwareManager.initialize();
	}
	return firmwareManager;
}

const login = async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: "Username and password are required" });
		}

		const manager = await getFirmwareManager();
		const user = await manager.findUser(username);

		if (!user || !bcrypt.compareSync(password, user.password)) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign(
			{
				id: user.id,
				username: user.username,
				role: user.role || "user",
			},
			config.JWT_SECRET,
			{ expiresIn: "24h" },
		);

		res.json({
			token,
			user: {
				id: user.id,
				username: user.username,
				role: user.role || "user",
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
