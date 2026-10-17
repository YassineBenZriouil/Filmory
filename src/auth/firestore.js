import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";
import { app } from "./firebase";

// Offline persistence: reads come from the local cache and writes queue up
// until the connection is back, across every open tab.
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
