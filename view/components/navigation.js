/**
 * Navigation Component
 * Generates navigation bars with client-side authentication toggling
 */

const generateNavigation = (activePage = "") => {
    const navItems = [
        { href: "/", icon: "fas fa-home", text: "Home", key: "home" },
        { href: "/firmwares", icon: "fas fa-microchip", text: "Firmwares", key: "firmwares" },
        { href: "/statistics", icon: "fas fa-chart-bar", text: "Statistics", key: "statistics" },
        { href: "/upload", icon: "fas fa-upload", text: "Upload", key: "upload", id: "uploadNavItem", class: "user-only" },
        { href: "/user", icon: "fas fa-user", text: "Users", key: "user", id: "userNavItem", class: "user-only" },
    ];

    const navItemsHtml = navItems
        .map((item) => {
            const activeClass = item.key === activePage ? "active" : "";
            const itemId = item.id ? `id="${item.id}"` : "";

            return `
                    <li class="nav-item ${item.class}" ${itemId}>
                        <a class="nav-link ${activeClass}" href="${item.href}">
                            <i class="${item.icon} me-1"></i>${item.text}
                        </a>
                    </li>`;
        })
        .join("");

    return generateNavBase(navItemsHtml);
};

const generateNavBase = (navItemsHtml) => {
    // Always generate both login and logout buttons, let client-side handle visibility
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">
                <i class="fas fa-microchip me-2"></i>
                Firmware Manager
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">${navItemsHtml}
                </ul>
                <ul class="navbar-nav ms-auto  mt-1">
                    <li class="nav-item" id="loginNavItem">
                        <button class="btn btn-outline-light w-100" id="loginBtn" onclick="toggleAuth()">
                            <i class="fas fa-sign-in-alt me-1"></i>Login
                        </button>
                    </li>
                    <li class="nav-item d-none" id="logoutNavItem">
                        <button class="btn btn-outline-light w-100" id="logoutBtn" onclick="logout()">
                            <i class="fas fa-sign-out-alt me-1"></i>Logout
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>`;
};

module.exports = {
    generateNavigation,
};
