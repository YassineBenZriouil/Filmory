import React, { Suspense, lazy } from "react";

// The picker pulls in Firestore, so it loads the first time someone opens it.
const ListPicker = lazy(() => import("./listPicker"));

export default function LazyListPicker(props) {
    return (
        <Suspense fallback={null}>
            <ListPicker {...props} />
        </Suspense>
    );
}
