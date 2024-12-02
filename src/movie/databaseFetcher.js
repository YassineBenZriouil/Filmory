import {
    getFirestore,
    collection,
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
import { db } from "../auth/firebase";

export const fetchCurrentUserLists = async () => {
    const db = getFirestore();
    const userUID = await fetchingUserUIDByEmail();
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
    const db = getFirestore();
    const listsRef = collection(db, "Mylists");
    await addDoc(listsRef, list);
};

export const editListHandler = async (listId, updatedList) => {
    const db = getFirestore();
    const listRef = doc(db, "Mylists", listId);
    await updateDoc(listRef, updatedList);
};

export const fetchingUserUIDByEmail = async () => {
    const email = localStorage.getItem("loggedInUser");
    if (!email) {
        console.log("No email found in local storage");
        return null;
    }
    const db = getFirestore();
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("email", "==", email));
    const userSnapshot = await getDocs(userQuery);
    if (userSnapshot.empty) {
        console.log("No user found for this email");
        return null;
    }
    return userSnapshot.docs[0].id;
};

export const deleteListHandler = async (listId) => {
    const db = getFirestore();
    const listRef = doc(db, "Mylists", listId);
    await deleteDoc(listRef);
};

export const searchListByQuery = async (searchQuery) => {
    const db = getFirestore();
    const listsRef = collection(db, "Mylists");
    const listsSnapshot = await getDocs(listsRef);
    return listsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
            (list) =>
                list.listName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                list.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
        );
};

export const addMovieToList = async (listId, itemId, type) => {
    try {
        const db = getFirestore();
        const listRef = doc(db, "Mylists", listId);
        console.log("List Reference:", listRef);
        console.log("Adding item to list:", { type, itemId });
        const updateData = {};
        const itemIdAsNumber = parseInt(itemId, 10);
        if (type === "movie") {
            updateData[`works.movie`] = arrayUnion(itemIdAsNumber);
        } else if (type === "tv") {
            updateData[`works.tv`] = arrayUnion(itemIdAsNumber);
        } else {
            throw new Error("Invalid type. Must be 'movie' or 'tv'.");
        }
        updateData[`works.${type}`] = arrayUnion(itemIdAsNumber);
        await updateDoc(listRef, updateData);
        console.log("Item successfully added to the list!");
    } catch (error) {
        console.error("Error adding item to list:", error);
        throw new Error("Failed to add item to the list.");
    }
};

export const fetchListById = async (listId) => {
    const db = getFirestore();
    const listRef = doc(db, "Mylists", listId);
    const listSnapshot = await getDoc(listRef);
    return listSnapshot.exists() ? listSnapshot.data() : null;
};

export const removeItemFromList = async (listId, itemId, type) => {
    const db = getFirestore();
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
    const db = getFirestore();
    const listRef = doc(db, "Mylists", listId);
    const listSnapshot = await getDoc(listRef);
    const isPublic = listSnapshot.data().isPublic;

    await updateDoc(listRef, { isPublic: !isPublic });
};

export const fetchAllPublicLists = async () => {
    const db = getFirestore();
    const listsRef = collection(db, "Mylists");
    const listsQuery = query(listsRef, where("isPublic", "==", true));
    const listsSnapshot = await getDocs(listsQuery);
    return listsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const fetchUserData = async (userRef) => {
    let userDocumentRef = userRef;

    // If userRef is just an ID (string), create a proper reference
    if (typeof userRef === "string") {
        userDocumentRef = doc(db, "Users", userRef); // Correct the path to "Users/{userId}"
    }

    try {
        const userDocument = await getDoc(userDocumentRef);
        if (userDocument.exists()) {
            return userDocument.data(); // Return the user data if the document exists
        } else {
            console.log("User not found");
            return null;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};
