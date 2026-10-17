// Pure helpers for list data. No Firestore here, so the main bundle can use them.

// "movie_123": the key for one film inside a list (order, meta, cover, watched).
export const keyOf = (type, id) => `${type}_${id}`;
export const parseKey = (key) => {
    const [type, id] = key.split("_");
    return { type, id: Number(id) };
};

export const worksOf = (list) => {
    const works = list?.works;
    if (!works || Array.isArray(works)) return { movie: [], tv: [] };
    return { movie: works.movie || [], tv: works.tv || [] };
};

export const filmCount = (list) => {
    const { movie, tv } = worksOf(list);
    return movie.length + tv.length;
};

// Every film key in the list's own order. Films added before ordering existed
// follow, movies first, in the order they were stored.
export const orderedKeys = (list) => {
    const { movie, tv } = worksOf(list);
    const all = [...movie.map((id) => keyOf("movie", id)), ...tv.map((id) => keyOf("tv", id))];
    const present = new Set(all);
    const ordered = (list?.order || []).filter((k) => present.has(k));
    const seen = new Set(ordered);
    return [...ordered, ...all.filter((k) => !seen.has(k))];
};

export const metaOf = (list, key) => list?.meta?.[key] || {};

// Which poster leads the fan: the chosen cover, then the list's first four.
export const fanKeys = (list) => {
    const keys = orderedKeys(list);
    const cover = list?.cover && keys.includes(list.cover) ? [list.cover] : [];
    return [...cover, ...keys.filter((k) => k !== list?.cover)].slice(0, 4);
};

export const isDeleted = (list) => !!list?.deletedAt;
export const DELETE_AFTER_DAYS = 30;

export const members = (list) => list?.members || [];
export const ownerUid = (list) => (typeof list?.user === "string" ? list.user.split("/").pop() : null);
export const isShared = (list) => members(list).length > 0 || !!list?.inviteToken;

export const randomToken = () => {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
};

// A short, deliberately simple word list. It catches the obvious cases before a
// list goes public; reports and moderation handle the rest.
const BLOCKED = [
    "fuck", "shit", "cunt", "bitch", "nigger", "nigga", "faggot", "fag", "retard", "whore",
    "slut", "rape", "kike", "spic", "chink", "dick", "pussy", "cock", "bastard", "twat",
];
export const blockedWord = (...texts) => {
    const words = texts.join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/);
    return BLOCKED.find((bad) => words.some((w) => w === bad || w === `${bad}s`)) || null;
};
