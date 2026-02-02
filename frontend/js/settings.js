// settings.js
// Manages user settings using localStorage

const DEFAULT_SETTINGS = {
    location: {
        name: "東京",
        lat: 35.6895,
        lon: 139.6917
    },
    categories: ["top", "tech", "gadget", "game", "indie", "anime", "entertainment"],
    theme: "light"
};

const STORAGE_KEY = "newsHubSettings";

export const settings = {
    get() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } catch (e) {
                console.error("Failed to parse settings", e);
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    },

    save(newSettings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    },

    updateLocation(name, lat, lon) {
        const current = this.get();
        current.location = { name, lat, lon };
        this.save(current);
    },

    updateCategories(categories) {
        const current = this.get();
        current.categories = categories;
        this.save(current);
    }
};
