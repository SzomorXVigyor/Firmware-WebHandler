const authRoutes = require("./auth");
const firmwareRoutes = require("./firmware");
const viewRoutes = require("./views");

module.exports = (app) => {
    // API routes
    app.use("/api", authRoutes);
    app.use("/api", firmwareRoutes);

    // View routes
    app.use("/", viewRoutes);
};
