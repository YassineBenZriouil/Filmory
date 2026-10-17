import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { invalidateUserLists } from "../movie/listsStore";

// Who is signed in, straight from Firebase's own session.
// ready: Firebase has finished restoring the session (avoid flashing "logged out").
const AuthContext = createContext({ ready: false, user: null, profile: null, refreshProfile: () => {} });

// Firestore is only downloaded once someone is signed in.
const loadProfile = async (user) => {
    const { loadOwnProfile } = await import("../movie/databaseFetcher");
    return loadOwnProfile(user);
};

export function AuthProvider({ children }) {
    const [state, setState] = useState({ ready: false, user: null, profile: null });

    useEffect(() => {
        // Left over from before sign-in used Firebase sessions.
        try {
            localStorage.removeItem("loggedInUser");
        } catch {}
        return onAuthStateChanged(auth, async (user) => {
            invalidateUserLists();
            if (!user) {
                setState({ ready: true, user: null, profile: null });
                return;
            }
            setState({ ready: true, user, profile: null });
            const profile = await loadProfile(user);
            setState((s) => (s.user?.uid === user.uid ? { ...s, profile } : s));
        });
    }, []);

    const refreshProfile = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) return;
        const profile = await loadProfile(user);
        setState((s) => (s.user?.uid === user.uid ? { ...s, profile } : s));
    }, []);

    return <AuthContext.Provider value={{ ...state, refreshProfile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Link to log in that comes back here afterwards. `intent` lets the page finish
// what the person started (e.g. "add" reopens the list picker).
export const loginPath = (location, intent) => {
    const next = `${location.pathname}${location.search}`;
    const params = new URLSearchParams({ next });
    if (intent) params.set("intent", intent);
    return `/login?${params}`;
};

// Only same-site paths, never "//evil.com".
export const safeNext = (value) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/");
