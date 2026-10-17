import { useEffect, useState } from "react";
import { auth } from "../auth/firebase";
import { useAuth } from "../auth/authContext";
import { keyOf } from "./listModel";

// What the signed-in person has watched: { "movie_123": timestamp }.
// One shared copy so every card, list and details page agree instantly.
let state = { uid: null, films: {}, loaded: false };
let loading = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(state));

const load = async () => {
    const uid = auth.currentUser?.uid || null;
    if (!uid) {
        state = { uid: null, films: {}, loaded: true };
        emit();
        return;
    }
    if (state.uid === uid && state.loaded) return;
    if (!loading) {
        loading = import("./databaseFetcher")
            .then(({ fetchWatched }) => fetchWatched())
            .then((films) => {
                state = { uid, films, loaded: true };
                emit();
            })
            .catch((error) => console.error("Error loading watched films:", error))
            .finally(() => {
                loading = null;
            });
    }
    await loading;
};

export const isWatched = (type, id) => !!state.films[keyOf(type, id)];

// Toggle one or more films. Updates everywhere at once, saves in the background,
// and rolls back if saving fails.
export const setWatchedFilms = async (keys, watched) => {
    const before = state.films;
    const films = { ...before };
    keys.forEach((k) => (watched ? (films[k] = Date.now()) : delete films[k]));
    state = { ...state, films };
    emit();
    try {
        const { setWatched } = await import("./databaseFetcher");
        await setWatched(keys, watched);
    } catch (error) {
        state = { ...state, films: before };
        emit();
        throw error;
    }
};

// Subscribe a component. Returns the watched map (empty when signed out).
export function useWatched() {
    const { user } = useAuth();
    const [snapshot, setSnapshot] = useState(state);
    useEffect(() => {
        listeners.add(setSnapshot);
        if (user) load();
        else if (state.uid) {
            state = { uid: null, films: {}, loaded: true };
            emit();
        }
        return () => listeners.delete(setSnapshot);
    }, [user]);
    return user ? snapshot.films : {};
}
