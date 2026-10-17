import {
    collection,
    setDoc,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    deleteDoc,
    addDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from "firebase/firestore";
import { db } from "../auth/firestore";
import { auth } from "../auth/firebase";

export const fetchCurrentUserLists = async () => {
    const userUID = await currentUid();
    if (!userUID) {
        console.log("No user found for the provided email");
        return [];
    }
    const listsRef = collection(db, "Mylists");
    const listsQuery = query(
        listsRef,
        where("user", "==", `/Users/${userUID}`)
    );
    const listsSnapshot = await getDocs(listsQuery);
    return listsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addListhandler = async (list) => {
    const listsRef = collection(db, "Mylists");
    const ref = await addDoc(listsRef, list);
    return ref.id;
};

// Older lists were created with works: [] instead of { movie: [], tv: [] }.
export const worksOf = (list) => {
    const works = list?.works;
    if (!works || Array.isArray(works)) return { movie: [], tv: [] };
    return { movie: works.movie || [], tv: works.tv || [] };
};

export const filmCount = (list) => {
    const { movie, tv } = worksOf(list);
    return movie.length + tv.length;
};

export const editListHandler = async (listId, updatedList) => {
    const listRef = doc(db, "Mylists", listId);
    await updateDoc(listRef, updatedList);
};

// The signed-in user's id. Waits for Firebase to restore the session on page load.
export const currentUid = async () => {
    await auth.authStateReady();
    return auth.currentUser?.uid || null;
};

// Public, name-only profile used for list authors. Users/{uid} (with the email) stays private.
export const fetchProfile = async (uid) => {
    try {
        const snap = await getDoc(doc(db, "Profiles", uid));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};

export const saveProfile = (uid, userName) => setDoc(doc(db, "Profiles", uid), { userName }, { merge: true });

// The signed-in user's own details; creates their public profile if it's missing
// (accounts made before profiles existed).
export const loadOwnProfile = async (user) => {
    try {
        const [own, pub] = await Promise.all([
            getDoc(doc(db, "Users", user.uid)),
            getDoc(doc(db, "Profiles", user.uid)),
        ]);
        const userName = own.data()?.userName || pub.data()?.userName || "";
        if (userName && !pub.exists()) saveProfile(user.uid, userName).catch(() => {});
        return { userName, email: user.email };
    } catch (error) {
        console.error("Error loading profile:", error);
        return { userName: "", email: user.email };
    }
};

export const deleteListHandler = async (listId) => {
    const listRef = doc(db, "Mylists", listId);
    await deleteDoc(listRef);
};

export const addMovieToList = async (listId, itemId, type) => {
    try {
        const listRef = doc(db, "Mylists", listId);
        const updateData = {};
        const itemIdAsNumber = parseInt(itemId, 10);
        // A field path like works.movie fails when works is still an array; convert it first.
        const snap = await getDoc(listRef);
        if (Array.isArray(snap.data()?.works)) {
            await updateDoc(listRef, { works: { movie: [], tv: [] } });
        }
        if (type === "movie") {
            updateData[`works.movie`] = arrayUnion(itemIdAsNumber);
        } else if (type === "tv") {
            updateData[`works.tv`] = arrayUnion(itemIdAsNumber);
        } else {
            throw new Error("Invalid type. Must be 'movie' or 'tv'.");
        }
        updateData[`works.${type}`] = arrayUnion(itemIdAsNumber);
        await updateDoc(listRef, updateData);
    } catch (error) {
        console.error("Error adding item to list:", error);
        throw new Error("Failed to add item to the list.");
    }
};

export const fetchListById = async (listId) => {
    const listRef = doc(db, "Mylists", listId);
    const listSnapshot = await getDoc(listRef);
    return listSnapshot.exists() ? listSnapshot.data() : null;
};

export const removeItemFromList = async (listId, itemId, type) => {
    const listRef = doc(db, "Mylists", listId);
    try {
        const listSnap = await getDoc(listRef);
        if (!listSnap.exists()) {
            throw new Error("List not found");
        }
        const works = listSnap.data().works || {};
        console.log("Works Data:", works);
        if (type === "movie") {
            const movieArray = works.movie || [];
            console.log("Movie Array:", movieArray);
            if (movieArray.includes(itemId)) {
                await updateDoc(listRef, {
                    "works.movie": arrayRemove(itemId),
                });
                console.log("Movie successfully removed!");
            } else {
                throw new Error("Movie not found in the list" + itemId);
            }
        } else if (type === "tv") {
            const tvArray = works.tv || [];
            console.log("TV Array:", tvArray);
            if (tvArray.includes(itemId)) {
                await updateDoc(listRef, { "works.tv": arrayRemove(itemId) });
                console.log("TV show successfully removed!");
            } else {
                throw new Error("TV show not found in the list " + itemId);
            }
        } else {
            throw new Error(
                `${
                    type.charAt(0).toUpperCase() + type.slice(1)
                } not found in the list`
            );
        }
    } catch (error) {
        console.error(`Error removing ${type}:`, error);
        throw error;
    }
};

export const handlepublication = async (listId) => {
    const listRef = doc(db, "Mylists", listId);
    const listSnapshot = await getDoc(listRef);
    const isPublic = listSnapshot.data().isPublic;

    await updateDoc(listRef, { isPublic: !isPublic });
};

export const fetchAllPublicLists = async () => {
    const listsRef = collection(db, "Mylists");
    const listsQuery = query(listsRef, where("isPublic", "==", true));
    const listsSnapshot = await getDocs(listsQuery);
    return listsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

