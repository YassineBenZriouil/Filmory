// Things Filmory remembers on this device. Every read and write tolerates
// blocked or full storage (private windows), falling back to defaults.

const read = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const write = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {}
};

// ---- Recent searches ----
export const getRecentSearches = () => read("recentSearches", []);
export const addRecentSearch = (query) => {
    const q = query.trim();
    if (q.length < 2) return;
    const rest = getRecentSearches().filter((r) => r.toLowerCase() !== q.toLowerCase());
    write("recentSearches", [q, ...rest].slice(0, 8));
};
export const clearRecentSearches = () => write("recentSearches", []);

// ---- Recently viewed films ----
export const getRecentlyViewed = () => read("recentlyViewed", []);
export const addRecentlyViewed = ({ id, type, title, poster_path, year }) => {
    const rest = getRecentlyViewed().filter((f) => !(f.id === id && f.type === type));
    write("recentlyViewed", [{ id, type, title, poster_path, year }, ...rest].slice(0, 12));
};

// ---- Region and streaming services ----
const defaultRegion = () => {
    const tag = (navigator.languages?.[0] || navigator.language || "en-US").split("-")[1];
    return tag && tag.length === 2 ? tag.toUpperCase() : "US";
};
export const getRegion = () => read("region", null) || defaultRegion();
export const setRegion = (region) => write("region", region);

// Services are per region, since provider ids differ by country.
export const getServices = (region = getRegion()) => read("services", {})[region] || [];
export const setServices = (ids, region = getRegion()) => write("services", { ...read("services", {}), [region]: ids });

// ---- Saved Discover filters ----
export const getSavedFilters = () => read("savedFilters", []);
export const saveFilter = (name, query) => {
    const rest = getSavedFilters().filter((f) => f.name.toLowerCase() !== name.toLowerCase());
    const next = [...rest, { name, query }];
    write("savedFilters", next);
    return next;
};
export const deleteSavedFilter = (name) => {
    const next = getSavedFilters().filter((f) => f.name !== name);
    write("savedFilters", next);
    return next;
};

export const regionName = (code) => {
    try {
        return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
    } catch {
        return code;
    }
};

// ---- When each list was last added to (for the list picker's order) ----
export const getListUsage = () => read("listUsage", {});
export const markListUsed = (listId) => write("listUsage", { ...getListUsage(), [listId]: Date.now() });
