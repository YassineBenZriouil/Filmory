// Scroll memory per history entry, so Back returns to exactly where you were.
// Kept in sessionStorage so it also survives a refresh.

const KEY = "scrollPositions";
let positions = {};
try {
    positions = JSON.parse(sessionStorage.getItem(KEY) || "{}");
} catch {}

const persist = () => {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(positions));
    } catch {}
};

export const rememberScroll = (key, y) => {
    positions[key] = y;
    persist();
};

export const savedScroll = (key) => positions[key];

// Content often arrives a moment after the page mounts, so keep trying until the page
// is tall enough, the target is reached, the person scrolls themselves, or 1.5s passes.
export const restoreScroll = (y) => {
    if (!y) {
        window.scrollTo(0, 0);
        return () => {};
    }
    let frame;
    let stopped = false;
    const started = performance.now();
    const stop = () => {
        stopped = true;
        cancelAnimationFrame(frame);
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    const attempt = () => {
        if (stopped) return;
        window.scrollTo(0, y);
        if (Math.abs(window.scrollY - y) < 2 || performance.now() - started > 1500) return stop();
        frame = requestAnimationFrame(attempt);
    };
    attempt();
    return stop;
};

// Session values tied to a history entry (row positions, loaded results).
export const entryState = {
    get(key) {
        try {
            const raw = sessionStorage.getItem(`entry:${key}`);
            return raw ? JSON.parse(raw) : undefined;
        } catch {
            return undefined;
        }
    },
    set(key, value) {
        try {
            sessionStorage.setItem(`entry:${key}`, JSON.stringify(value));
        } catch {}
    },
};
