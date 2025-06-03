let deviceTypeChart = null;
let uploadTimelineChart = null;

document.addEventListener("DOMContentLoaded", () => {
    loadStatistics();
    setupRefreshInterval();
});

function setupRefreshInterval() {
    // Refresh statistics every 2 minutes
    setInterval(() => {
        if (document.visibilityState === "visible") {
            loadStatistics();
        }
    }, 2 * 60 * 1000);
}

function displayOverviewStats(stats) {
    document.getElementById("totalFirmwares").textContent = stats.totalFirmwares || 0;
    document.getElementById("deviceTypes").textContent = stats.deviceTypes.length || 0;
    document.getElementById("totalSize").textContent = formatFileSize(stats.totalSize || 0);
    document.getElementById("totalDownloads").textContent = stats.totalDownloads || 0;
}

async function loadStatistics() {
    try {
        const [firmwaresResponse, statsResponse] = await Promise.all([fetch("/api/firmwares"), fetch("/api/firmwares/stats")]);

        const firmwares = firmwaresResponse.ok ? await firmwaresResponse.json() : null;
        const stats = statsResponse.ok ? await statsResponse.json() : null;

        if (firmwares) {
            createDeviceTypeChart(firmwares);
            createUploadTimelineChart(firmwares);
            displayDeviceSummaryTable(firmwares);
            displayRecentActivity(firmwares);
        }

        if (stats) {
            displayOverviewStats(stats);
        }
    } catch (error) {
        console.error("Error loading detailed statistics:", error);
    }
}

function createDeviceTypeChart(firmwares) {
    const ctx = document.getElementById("deviceTypeChart").getContext("2d");

    // Destroy existing chart if it exists
    if (deviceTypeChart) {
        deviceTypeChart.destroy();
    }

    const deviceCounts = {};
    firmwares.forEach((firmware) => {
        deviceCounts[firmware.deviceType] = (deviceCounts[firmware.deviceType] || 0) + 1;
    });

    const labels = Object.keys(deviceCounts);
    const data = Object.values(deviceCounts);
    const colors = generateColors(labels.length);

    deviceTypeChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: "#fff",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                },
            },
        },
    });
}

function createUploadTimelineChart(firmwares) {
    const ctx = document.getElementById("uploadTimelineChart").getContext("2d");

    // Destroy existing chart if it exists
    if (uploadTimelineChart) {
        uploadTimelineChart.destroy();
    }

    // Group uploads by month
    const uploadsByMonth = {};
    firmwares.forEach((firmware) => {
        const date = new Date(firmware.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        uploadsByMonth[monthKey] = (uploadsByMonth[monthKey] || 0) + 1;
    });

    // Sort by date and get last 12 months
    const sortedMonths = Object.keys(uploadsByMonth).sort();
    const last12Months = sortedMonths.slice(-12);

    const labels = last12Months.map((month) => {
        const [year, monthNum] = month.split("-");
        return new Date(year, monthNum - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    });
    const data = last12Months.map((month) => uploadsByMonth[month]);

    uploadTimelineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Uploads",
                    data: data,
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0, 123, 255, 0.1)",
                    tension: 0.4,
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });
}

function displayDeviceSummaryTable(data) {
    const tbody = document.querySelector("#deviceSummaryTable tbody");

    let deviceStats = {};

    if (Array.isArray(data)) {
        // Calculate from firmwares array
        data.forEach((firmware) => {
            if (!deviceStats[firmware.deviceType]) {
                deviceStats[firmware.deviceType] = {
                    versions: 0,
                    totalSize: 0,
                };
            }
            deviceStats[firmware.deviceType].versions++;
            deviceStats[firmware.deviceType].totalSize += firmware.size || 0;
        });
    } else {
        deviceStats = data;
    }

    if (Object.keys(deviceStats).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">No data available</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = Object.entries(deviceStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
            ([deviceType, stats]) => `
            <tr>
                <td>${deviceType}</td>
                <td>${stats.versions}</td>
                <td>${formatFileSize(stats.totalSize)}</td>
            </tr>
        `,
        )
        .join("");
}

function displayRecentActivity(firmwares) {
    const container = document.getElementById("recentActivity");

    if (firmwares.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">No recent uploads</p>
            </div>
        `;
        return;
    }

    const recentFirmwares = [...firmwares].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    container.innerHTML = `
        <div class="list-group list-group-flush">
            ${recentFirmwares.map((firmware) => `
                <div class="list-group-item px-0">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-bold">${firmware.deviceType}</div>
                            <small class="text-muted">${firmware.description}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge ${getVersionBadgeClass(firmware.version)} mb-1">${firmware.version}</span>
                            <br>
                            <small class="text-muted">${formatDate(firmware.createdAt)}</small>
                        </div>
                    </div>
                </div>
            `)
        .join("")}
        </div>
    `;
}

function generateColors(count) {
    const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14", "#20c997", "#6610f2", "#e83e8c", "#17a2b8"];

    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}
