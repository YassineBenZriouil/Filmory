import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dialog from "../../static/dialog";
import { FloatField, Spinner } from "../../static/controls";
import { customToast } from "../../static/toast";
import {
    addListhandler,
    editListHandler,
    fetchingUserUIDByEmail,
} from "../../movie/databaseFetcher";
import { invalidateUserLists } from "../../movie/listsStore";

// Create or edit a list. `list` present = edit mode.
export default function ListSheet({ open, list, onClose, onSaved }) {
    const editing = !!list;
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(list?.listName || "");
        setDescription(list?.description || "");
        setIsPublic(!!list?.isPublic);
        setError("");
        setSaving(false);
        setConfirmDiscard(false);
    }, [open, list]);

    const dirty =
        name !== (list?.listName || "") ||
        description !== (list?.description || "") ||
        isPublic !== !!list?.isPublic;

    const requestClose = () => {
        if (saving) return;
        if (dirty && !confirmDiscard) setConfirmDiscard(true);
        else onClose();
    };

    const submit = async (e) => {
        e.preventDefault();
        const listName = name.trim();
        if (!listName) {
            setError("Give the list a name");
            return;
        }
        setSaving(true);
        try {
            const fields = { listName, description: description.trim(), isPublic };
            if (editing) {
                await editListHandler(list.id, fields);
                customToast("List saved", "success");
                onSaved({ ...list, ...fields });
            } else {
                const uid = await fetchingUserUIDByEmail();
                if (!uid) {
                    customToast("Log in to create lists", "error");
                    setSaving(false);
                    return;
                }
                const created = {
                    ...fields,
                    user: `/Users/${uid}`,
                    works: { movie: [], tv: [] },
                    createdAt: Date.now(),
                };
                const id = await addListhandler(created);
                customToast("List created", "success");
                onSaved({ id, ...created });
            }
            invalidateUserLists();
        } catch (err) {
            console.error("Error saving list:", err);
            customToast(editing ? "Couldn’t save the list. Try again." : "Couldn’t create the list. Try again.", "error");
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={requestClose} title={editing ? "Edit list" : "New list"}>
            <form onSubmit={submit} noValidate>
                <h2 className="text-[31px] font-extrabold">{editing ? "Edit list" : "New list"}</h2>
                <div className="mt-6 space-y-3">
                    <FloatField
                        id="list-name"
                        label="Name"
                        value={name}
                        onChange={(v) => {
                            setName(v);
                            if (error && v.trim()) setError("");
                        }}
                        maxLength={60}
                        counterFrom={45}
                        error={error}
                        data-autofocus
                        autoComplete="off"
                    />
                    <FloatField
                        id="list-description"
                        label="Description (optional)"
                        value={description}
                        onChange={setDescription}
                        maxLength={280}
                        multiline
                    />
                </div>

                <fieldset className="mt-4">
                    <legend className="text-[13px] text-grain">Who can see it</legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {[
                            [false, "Private", "Only you"],
                            [true, "Public", "Anyone, under Public lists"],
                        ].map(([value, label, hint]) => (
                            <label
                                key={label}
                                className={`flex cursor-pointer items-start gap-3 rounded-[6px] border p-3 transition-colors duration-quick has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[rgb(var(--focus))] ${
                                    isPublic === value ? "border-beam" : "border-reel hover:border-grain"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={isPublic === value}
                                    onChange={() => setIsPublic(value)}
                                    className="mt-1 h-4 w-4 accent-[rgb(var(--beam))]"
                                />
                                <span>
                                    <span className="block font-bold">{label}</span>
                                    <span className="block text-[13px] text-grain">{hint}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="mt-8 min-h-[44px]">
                    <AnimatePresence mode="wait" initial={false}>
                        {confirmDiscard ? (
                            <motion.div
                                key="discard"
                                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.16 }}
                            >
                                <p role="alert">Discard changes?</p>
                                <div className="flex gap-2">
                                    <button type="button" className="btn btn-text" onClick={() => setConfirmDiscard(false)}>
                                        Keep editing
                                    </button>
                                    <button type="button" className="btn btn-destructive" onClick={onClose}>
                                        Discard
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="actions"
                                className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.16 }}
                            >
                                <button type="button" className="btn btn-text" onClick={requestClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary min-w-[148px]" disabled={saving}>
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={saving ? "saving" : "idle"}
                                            className="inline-flex items-center gap-2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.12 }}
                                        >
                                            {saving ? (
                                                <>
                                                    <Spinner />
                                                    <span className="sr-only">Saving</span>
                                                </>
                                            ) : editing ? (
                                                "Save changes"
                                            ) : (
                                                "Create list"
                                            )}
                                        </motion.span>
                                    </AnimatePresence>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </form>
        </Dialog>
    );
}
