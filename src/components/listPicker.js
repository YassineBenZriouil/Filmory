import React, { useEffect, useMemo, useRef, useState } from "react";
import { getListUsage, markListUsed } from "../static/prefs";
import { keyOf } from "../movie/listModel";
import { Link, useLocation } from "react-router-dom";
import { loginPath, useAuth } from "../auth/authContext";
import { motion } from "framer-motion";
import Popover from "../static/popover";
import { customToast } from "../static/toast";
import {
    addListhandler,
    addMovieToList,
    currentUid,
    removeItemFromList,
    fetchSharedWithMe,
    worksOf,
} from "../movie/databaseFetcher";
import { cachedUserLists, loadUserLists, updateCachedLists } from "../movie/listsStore";

function Tick({ on }) {
    return (
        <span
            aria-hidden="true"
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border transition-colors duration-quick ${
                on ? "border-beam bg-beam text-ink" : "border-grain"
            }`}
        >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                <motion.path
                    d="M3.5 8.5l3 3 6-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                    transition={{ duration: 0.16 }}
                />
            </svg>
        </span>
    );
}

// Which of the user's lists hold this film. Toggling a row saves straight away.
export default function ListPicker({ anchorRef, open, onClose, id, type, title }) {
    const location = useLocation();
    const loggedIn = !!useAuth().user;
    const [lists, setLists] = useState(cachedUserLists);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [shared, setShared] = useState([]);
    const firstRef = useRef(null);
    const focused = useRef(false);
    const filmId = Number(id);

    useEffect(() => {
        if (!open || !loggedIn) return;
        let alive = true;
        focused.current = false;
        setLists(cachedUserLists());
        loadUserLists().then((l) => alive && setLists(l));
        // Lists other people shared with you can be added to as well.
        fetchSharedWithMe()
            .then((l) => alive && setShared(l.filter((x) => !x.deletedAt)))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [open, loggedIn]);

    // Most recently used first, so the list you're filling is always on top.
    const visible = useMemo(() => {
        if (lists === null) return null;
        const usage = getListUsage();
        return [...lists.filter((l) => !l.deletedAt), ...shared].sort(
            (a, b) => (usage[b.id] || b.createdAt || 0) - (usage[a.id] || a.createdAt || 0)
        );
    }, [lists, shared]);

    // Focus the top list on open, so Enter adds to it straight away.
    useEffect(() => {
        if (open && visible?.length && !focused.current) {
            focused.current = true;
            requestAnimationFrame(() => firstRef.current?.focus());
        }
    }, [open, visible]);

    const replace = (listId, update) => {
        const apply = (all) => all.map((l) => (l.id === listId ? update(l) : l));
        setLists((prev) => apply(prev || []));
        setShared(apply);
        updateCachedLists(apply);
    };

    const withWorks = (list, ids) => ({
        ...list,
        works: { ...worksOf(list), [type]: ids },
    });

    const toggle = async (list) => {
        const current = worksOf(list)[type];
        const inList = current.includes(filmId);
        replace(list.id, (l) =>
            withWorks(l, inList ? current.filter((x) => x !== filmId) : [...current, filmId])
        );
        try {
            if (inList) await removeItemFromList(list.id, filmId, type);
            else {
                await addMovieToList(list.id, filmId, type);
                markListUsed(list.id);
            }
            customToast(`${inList ? "Removed from" : "Added to"} ${list.listName}`, "success");
        } catch (error) {
            console.error("Error updating list:", error);
            replace(list.id, (l) => withWorks(l, current));
            customToast(`Couldn’t update ${list.listName}. Try again.`, "error");
        }
    };

    const create = async (e) => {
        e.preventDefault();
        const listName = newName.trim();
        if (!listName || creating) return;
        setCreating(true);
        try {
            const uid = await currentUid();
            if (!uid) throw new Error("Not logged in");
            const list = {
                listName,
                description: "",
                isPublic: false,
                user: `/Users/${uid}`,
                works: { movie: [], tv: [], [type]: [filmId] },
                order: [keyOf(type, filmId)],
                meta: { [keyOf(type, filmId)]: { addedAt: Date.now(), addedBy: uid } },
                createdAt: Date.now(),
            };
            const newId = await addListhandler(list);
            markListUsed(newId);
            const created = { id: newId, ...list };
            setLists((prev) => [...(prev || []), created]);
            updateCachedLists((all) => [...all, created]);
            setNewName("");
            customToast(`Added to ${listName}`, "success");
        } catch (error) {
            console.error("Error creating list:", error);
            customToast("Couldn’t create the list. Try again.", "error");
        } finally {
            setCreating(false);
        }
    };

    return (
        <Popover anchorRef={anchorRef} open={open} onClose={onClose} label={`Add ${title} to a list`}>
            {!loggedIn ? (
                <div className="space-y-3 p-3">
                    <p className="text-grain">Log in to save films to your lists.</p>
                    <Link to={loginPath(location)} className="btn btn-primary w-full">
                        Log in
                    </Link>
                </div>
            ) : (
                <>
                    <p className="px-3 pb-1 pt-2 text-[13px] text-grain">
                        {(() => {
                            const inside = (visible || []).filter((l) => worksOf(l)[type].includes(filmId)).map((l) => l.listName);
                            if (!inside.length) return "Save to";
                            return `Already in ${inside.slice(0, 2).join(" and ")}${inside.length > 2 ? ` and ${inside.length - 2} more` : ""}`;
                        })()}
                    </p>
                    <div className="max-h-[280px] overflow-y-auto">
                        {visible === null
                            ? [0, 1, 2].map((i) => (
                                  <div key={i} className="flex min-h-[44px] items-center gap-3 px-3">
                                      <div className="skeleton h-5 w-5 rounded-[4px]" />
                                      <div className="skeleton h-4 w-32 rounded" />
                                  </div>
                              ))
                            : visible.map((list, i) => {
                                  const on = worksOf(list)[type].includes(filmId);
                                  return (
                                      <motion.label
                                          key={list.id}
                                          initial={{ opacity: 0, y: -4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: i * 0.02, duration: 0.2 }}
                                          className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[8px] px-3 transition-colors duration-quick hover:bg-reel/60 has-[:focus-visible]:bg-reel/60"
                                      >
                                          <input
                                              ref={i === 0 ? firstRef : undefined}
                                              type="checkbox"
                                              className="sr-only"
                                              checked={on}
                                              onChange={() => toggle(list)}
                                              onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                      e.preventDefault();
                                                      toggle(list);
                                                  }
                                              }}
                                          />
                                          <Tick on={on} />
                                          <span className="min-w-0 flex-1 truncate">{list.listName}</span>
                                          {shared.some((x) => x.id === list.id) && (
                                              <span className="shrink-0 text-[13px] text-grain">Shared</span>
                                          )}
                                      </motion.label>
                                  );
                              })}
                        {visible?.length === 0 && (
                            <p className="px-3 py-2 text-grain">You don’t have any lists yet.</p>
                        )}
                    </div>
                    <form onSubmit={create} className="mt-1 flex gap-2 border-t border-reel p-2">
                        <label htmlFor={`new-list-${type}-${id}`} className="sr-only">
                            New list name
                        </label>
                        <input
                            id={`new-list-${type}-${id}`}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            maxLength={60}
                            placeholder="+ New list"
                            className="field min-h-[40px] flex-1 border-transparent bg-booth/60"
                        />
                        {newName.trim() && (
                            <button type="submit" className="btn btn-primary min-h-[40px] px-3" disabled={creating}>
                                Create
                            </button>
                        )}
                    </form>
                </>
            )}
        </Popover>
    );
}
