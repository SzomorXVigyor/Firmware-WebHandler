const apiRoutes = require("./api");
const viewRoutes = require("./views");

module.exports = (app) => {
    // API routes
    app.use("/api", apiRoutes);

    // View routes
    app.use("/", viewRoutes);
};
