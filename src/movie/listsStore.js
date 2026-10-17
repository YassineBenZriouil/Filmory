import { auth } from "../auth/firebase";

// The current user's lists, kept briefly so the list picker opens instantly.
let cache = null; // { uid, lists }

export const cachedUserLists = () =>
    cache && cache.uid === auth.currentUser?.uid ? cache.lists : null;

export const loadUserLists = async () => {
    // Firestore loads on demand, not with the first page.
    const { currentUid, fetchCurrentUserLists } = await import("./databaseFetcher");
    const uid = await currentUid();
    const lists = uid ? await fetchCurrentUserLists() : [];
    cache = { uid, lists };
    return lists;
};

export const updateCachedLists = (update) => {
    if (cache) cache.lists = update(cache.lists);
};

export const invalidateUserLists = () => {
    cache = null;
};
