const apiRoutes = require("./api");
const config = require("../config/config");
const viewRoutes = require("./views");

module.exports = (app) => {
    // API routes
    app.use("/api", apiRoutes);

    // Client config
    app.use("/config", (req, res) => {
        const clientConfig = config.getClientConfig();
        res.json(clientConfig);
    });

    // View routes
    app.use("/", viewRoutes);
};
