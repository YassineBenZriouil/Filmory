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
    deleteField,
    writeBatch,
} from "firebase/firestore";
import { keyOf, randomToken, worksOf } from "./listModel";
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

export { worksOf, filmCount } from "./listModel";

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

// Add films ({ type, id }) to a list in one write. Records who added each and when.
export const addManyToList = async (listId, films) => {
    const listRef = doc(db, "Mylists", listId);
    const snap = await getDoc(listRef);
    if (!snap.exists()) throw new Error("List not found");
    const data = snap.data();
    // A field path like works.movie fails when works is still an array; convert it first.
    if (Array.isArray(data.works) || !data.works) {
        await updateDoc(listRef, { works: { movie: [], tv: [] } });
    }
    const uid = auth.currentUser?.uid || null;
    const existing = new Set(Object.keys(data.meta || {}));
    const update = {};
    const byType = { movie: [], tv: [] };
    const keys = [];
    for (const { type, id } of films) {
        if (type !== "movie" && type !== "tv") continue;
        const n = Number(id);
        byType[type].push(n);
        const key = keyOf(type, n);
        keys.push(key);
        if (!existing.has(key)) {
            update[`meta.${key}.addedAt`] = Date.now();
            update[`meta.${key}.addedBy`] = uid;
        }
    }
    if (byType.movie.length) update["works.movie"] = arrayUnion(...byType.movie);
    if (byType.tv.length) update["works.tv"] = arrayUnion(...byType.tv);
    if (keys.length) update.order = arrayUnion(...keys);
    if (Object.keys(update).length) await updateDoc(listRef, update);
};

export const removeManyFromList = async (listId, films) => {
    const update = {};
    const byType = { movie: [], tv: [] };
    const keys = [];
    for (const { type, id } of films) {
        const n = Number(id);
        byType[type]?.push(n);
        const key = keyOf(type, n);
        keys.push(key);
        update[`meta.${key}`] = deleteField();
    }
    if (byType.movie.length) update["works.movie"] = arrayRemove(...byType.movie);
    if (byType.tv.length) update["works.tv"] = arrayRemove(...byType.tv);
    if (keys.length) update.order = arrayRemove(...keys);
    await updateDoc(doc(db, "Mylists", listId), update);
};

export const addMovieToList = (listId, itemId, type) => addManyToList(listId, [{ type, id: itemId }]);
export const removeItemFromList = (listId, itemId, type) => removeManyFromList(listId, [{ type, id: itemId }]);

// Rating, note or interest for one film in one list.
export const setItemMeta = (listId, key, patch) =>
    updateDoc(
        doc(db, "Mylists", listId),
        Object.fromEntries(Object.entries(patch).map(([field, value]) => [`meta.${key}.${field}`, value]))
    );

export const setInterest = (listId, key, interested) =>
    updateDoc(doc(db, "Mylists", listId), {
        [`meta.${key}.interested`]: interested ? arrayUnion(auth.currentUser.uid) : arrayRemove(auth.currentUser.uid),
    });

export const setListOrder = (listId, order) => updateDoc(doc(db, "Mylists", listId), { order });
export const setListCover = (listId, cover) => updateDoc(doc(db, "Mylists", listId), { cover });

export const setPublic = (listId, isPublic) => updateDoc(doc(db, "Mylists", listId), { isPublic });

// Soft delete: hidden from everyone and kept for 30 days under "Recently deleted".
export const softDeleteList = (list) =>
    updateDoc(doc(db, "Mylists", list.id), { deletedAt: Date.now(), wasPublic: !!list.isPublic, isPublic: false });

export const restoreList = (list) =>
    updateDoc(doc(db, "Mylists", list.id), { deletedAt: deleteField(), isPublic: !!list.wasPublic, wasPublic: deleteField() });

export const copyList = async (list, uid) => {
    const copy = {
        listName: `${list.listName} (copy)`.slice(0, 60),
        description: list.description || "",
        isPublic: false,
        user: `/Users/${uid}`,
        works: worksOf(list),
        order: list.order || [],
        createdAt: Date.now(),
        copiedFrom: list.id,
    };
    return { id: await addListhandler(copy), ...copy };
};

// ---- Likes ----
export const setLiked = (listId, liked) =>
    updateDoc(doc(db, "Mylists", listId), {
        likedBy: liked ? arrayUnion(auth.currentUser.uid) : arrayRemove(auth.currentUser.uid),
    });

// ---- Shared lists ----
export const createInvite = async (listId) => {
    const inviteToken = randomToken();
    await updateDoc(doc(db, "Mylists", listId), { inviteToken });
    return inviteToken;
};
export const stopInvites = (listId) => updateDoc(doc(db, "Mylists", listId), { inviteToken: deleteField() });

// The security rules only accept this if the token matches the list's current invite.
export const joinList = (listId, token) =>
    updateDoc(doc(db, "Mylists", listId), { members: arrayUnion(auth.currentUser.uid), joinedWith: token });

export const leaveList = (listId) => updateDoc(doc(db, "Mylists", listId), { members: arrayRemove(auth.currentUser.uid) });
export const removeMember = (listId, uid) => updateDoc(doc(db, "Mylists", listId), { members: arrayRemove(uid) });

export const fetchSharedWithMe = async () => {
    const uid = await currentUid();
    if (!uid) return [];
    const snap = await getDocs(query(collection(db, "Mylists"), where("members", "array-contains", uid)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ---- Authors and following ----
export const fetchPublicListsBy = async (uids) => {
    if (!uids.length) return [];
    const chunks = [];
    for (let i = 0; i < uids.length; i += 30) chunks.push(uids.slice(i, i + 30)); // Firestore "in" limit
    const snaps = await Promise.all(
        chunks.map((chunk) =>
            getDocs(
                query(
                    collection(db, "Mylists"),
                    where("isPublic", "==", true),
                    where("user", "in", chunk.map((uid) => `/Users/${uid}`))
                )
            )
        )
    );
    return snaps.flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
};

export const fetchFollowing = async () => {
    const uid = await currentUid();
    if (!uid) return [];
    const snap = await getDoc(doc(db, "Follows", uid));
    return snap.data()?.following || [];
};
export const setFollowing = async (authorUid, follow) => {
    const uid = await currentUid();
    await setDoc(
        doc(db, "Follows", uid),
        { following: follow ? arrayUnion(authorUid) : arrayRemove(authorUid) },
        { merge: true }
    );
};

// ---- Watched (per person, across all lists) ----
export const fetchWatched = async () => {
    const uid = await currentUid();
    if (!uid) return {};
    const snap = await getDoc(doc(db, "Watched", uid));
    return snap.data()?.films || {};
};
export const setWatched = async (keys, watched) => {
    const uid = await currentUid();
    const update = Object.fromEntries(keys.map((key) => [key, watched ? Date.now() : deleteField()]));
    await setDoc(doc(db, "Watched", uid), { films: update }, { merge: true });
};

// ---- Safety ----
export const reportList = (listId, reason, details) =>
    addDoc(collection(db, "Reports"), {
        listId,
        reason,
        details: details.slice(0, 500),
        by: auth.currentUser.uid,
        at: Date.now(),
    });

// Lists deleted more than 30 days ago are removed for good.
export const purgeDeleted = async (lists, days) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const old = lists.filter((l) => l.deletedAt && l.deletedAt < cutoff);
    if (!old.length) return [];
    const batch = writeBatch(db);
    old.forEach((l) => batch.delete(doc(db, "Mylists", l.id)));
    await batch.commit();
    return old.map((l) => l.id);
};

export const fetchListById = async (listId) => {
    const listRef = doc(db, "Mylists", listId);
    const listSnapshot = await getDoc(listRef);
    return listSnapshot.exists() ? listSnapshot.data() : null;
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

