const jwt = require("jsonwebtoken");
const config = require("../config/config");
const UserRoles = require("../models/UserRoles");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user;
        next();
    });
};

const authenticateAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        if (UserRoles.hasPermission(user.role, UserRoles.ROLES.ADMIN) === false) {
            return res.status(403).json({ error: "Admin access required" });
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken, authenticateAdminToken };
