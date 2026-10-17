import { fetchCurrentUserLists } from "./databaseFetcher";

// The current user's lists, kept briefly so the list picker opens instantly.
let cache = null; // { email, lists }

export const cachedUserLists = () =>
    cache?.email === localStorage.getItem("loggedInUser") ? cache.lists : null;

export const loadUserLists = async () => {
    const email = localStorage.getItem("loggedInUser");
    const lists = email ? await fetchCurrentUserLists() : [];
    cache = { email, lists };
    return lists;
};

export const updateCachedLists = (update) => {
    if (cache) cache.lists = update(cache.lists);
};

export const invalidateUserLists = () => {
    cache = null;
};
