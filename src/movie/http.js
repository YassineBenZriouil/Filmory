// Every TMDB request goes through here.
// - Cached for the session: a repeat visit returns instantly from memory.
// - Small responses are mirrored to sessionStorage so a refresh is instant too.
// - Stale-while-revalidate: after TTL, the cached copy is still returned at once
//   and a fresh copy is fetched in the background for next time.
// - One retry with a short backoff on network errors, 429 and 5xx.

const TTL = 10 * 60 * 1000;
const SESSION_PREFIX = "tmdb:";
const SESSION_MAX_CHARS = 60000;

const memory = new Map(); // url -> { data, at }
const inflight = new Map(); // url -> Promise

const readSession = (url) => {
    try {
        const raw = sessionStorage.getItem(SESSION_PREFIX + url);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeSession = (url, entry) => {
    try {
        const raw = JSON.stringify(entry);
        if (raw.length <= SESSION_MAX_CHARS) sessionStorage.setItem(SESSION_PREFIX + url, raw);
    } catch {
        // Storage full or blocked: memory cache still works.
    }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class HttpError extends Error {
    constructor(status) {
        super(`HTTP ${status}`);
        this.status = status;
    }
}

async function request(url, signal) {
    for (let attempt = 0; ; attempt += 1) {
        try {
            const response = await fetch(url, { signal });
            if (response.ok) return await response.json();
            const retryable = response.status === 429 || response.status >= 500;
            if (attempt === 0 && retryable) {
                await wait(600);
                continue;
            }
            throw new HttpError(response.status);
        } catch (error) {
            if (error.name === "AbortError" || error instanceof HttpError || attempt > 0) throw error;
            await wait(600); // network error: one retry
        }
    }
}

async function fetchAndStore(url, signal) {
    const data = await request(url, signal);
    const entry = { data, at: Date.now() };
    memory.set(url, entry);
    writeSession(url, entry);
    return data;
}

export async function getJson(url, { signal } = {}) {
    const hit = memory.get(url) || readSession(url);
    if (hit) {
        memory.set(url, hit);
        if (Date.now() - hit.at > TTL && !inflight.has(url)) {
            const refresh = fetchAndStore(url)
                .catch(() => {})
                .finally(() => inflight.delete(url));
            inflight.set(url, refresh);
        }
        return hit.data;
    }
    // Abortable requests (search) don't share a promise another caller could cancel.
    if (signal) return fetchAndStore(url, signal);
    if (!inflight.has(url)) {
        inflight.set(
            url,
            fetchAndStore(url).finally(() => inflight.delete(url))
        );
    }
    return inflight.get(url);
}

// Synchronous peek, so pages can render cached data on the very first frame.
export function peekJson(url) {
    return (memory.get(url) || readSession(url))?.data;
}
