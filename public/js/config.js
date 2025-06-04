const GLOBAL_CONFIG = {
    MAX_FILE_SIZE: 104857600, // 100MB
    LOG_LEVEL: "info",
    ALLOWED_FILE_TYPES: [],
};

// ConfigManager handles fetching config and queueing dependent functions
const ConfigManager = {
    ready: false,
    queue: [],

    // Add a function to the queue or run immediately if ready
    onReady(fn) {
        if (this.ready) {
            fn();
        } else {
            this.queue.push(fn);
        }
    },

    // Internal: runs all queued functions
    flushQueue() {
        this.queue.forEach(fn => fn());
        this.queue.length = 0;
    },

    // Fetch config with timeout, merge into GLOBAL_CONFIG, then run queued functions
    async fetchConfig(timeout = 3000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch("/config", { signal: controller.signal });
            if (res.ok) {
                const config = await res.json();
                Object.assign(GLOBAL_CONFIG, config);
            } else {
                console.warn("Fetch failed, using default GLOBAL_CONFIG");
            }
        } catch (e) {
            console.warn("Config fetch error or timeout:", e.message);
        } finally {
            clearTimeout(timer);
            this.ready = true;
            this.flushQueue();
        }
    }
};

// Start config fetch
ConfigManager.fetchConfig();
