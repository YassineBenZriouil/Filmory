import React, { useEffect, useRef, useState } from "react";
import Popover, { MenuItem } from "../../static/popover";
import Dialog from "../../static/dialog";
import Avatar from "../../static/avatar";
import { Spinner } from "../../static/controls";
import { customToast } from "../../static/toast";
import {
    createInvite,
    fetchProfile,
    leaveList,
    removeMember,
    reportList,
    stopInvites,
} from "../../movie/databaseFetcher";

const copy = async (text, done) => {
    try {
        await navigator.clipboard.writeText(text);
        customToast(done, "success");
    } catch {
        customToast(`Copy this: ${text}`, "default", { autoClose: 10000 });
    }
};

// The /l/:id link gets a proper preview when pasted into chats (see api/l/[id].js).
export const shareUrl = (id) => `${window.location.origin}/l/${id}`;

export function ShareMenu({ list }) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef(null);
    const url = shareUrl(list.id);
    const close = () => setOpen(false);
    const canShare = typeof navigator.share === "function";
    const embed = `<iframe src="${window.location.origin}/embed/${list.id}" title="${list.listName.replace(/"/g, "&quot;")} on Filmory" width="100%" height="260" style="border:0;border-radius:14px" loading="lazy"></iframe>`;

    return (
        <>
            <button ref={buttonRef} type="button" className="btn btn-secondary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                <i className="fa-solid fa-arrow-up-from-bracket text-sm" aria-hidden="true"></i>
                Share
            </button>
            <Popover anchorRef={buttonRef} open={open} onClose={close} label="Share this list" role="menu" width={260}>
                {canShare && (
                    <MenuItem
                        onClick={async () => {
                            close();
                            try {
                                await navigator.share({ title: list.listName, text: list.description || undefined, url });
                            } catch {
                                // Closing the share sheet isn't an error.
                            }
                        }}
                    >
                        <i className="fa-solid fa-share-nodes w-4 text-sm text-grain" aria-hidden="true"></i>
                        Share…
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => {
                        close();
                        copy(url, "Link copied");
                    }}
                >
                    <i className="fa-solid fa-link w-4 text-sm text-grain" aria-hidden="true"></i>
                    Copy link
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        close();
                        copy(embed, "Embed code copied");
                    }}
                >
                    <i className="fa-solid fa-code w-4 text-sm text-grain" aria-hidden="true"></i>
                    Copy embed code
                </MenuItem>
            </Popover>
        </>
    );
}

// Owner: invite link and members. Member: who's in, and leave.
export function PeopleDialog({ open, onClose, list, owner, onChange, onLeft }) {
    const [profiles, setProfiles] = useState({});
    const [busy, setBusy] = useState(false);
    const memberIds = list.members || [];
    const ownerId = list.user?.split("/").pop();
    const invite = list.inviteToken ? `${window.location.origin}/join/${list.id}/${list.inviteToken}` : null;

    useEffect(() => {
        if (!open) return;
        const ids = [ownerId, ...memberIds].filter(Boolean);
        Promise.all(ids.map((id) => fetchProfile(id))).then((found) =>
            setProfiles(Object.fromEntries(ids.map((id, i) => [id, found[i]])))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, memberIds.join(","), ownerId]);

    const run = async (task, ok) => {
        setBusy(true);
        try {
            await task();
            if (ok) customToast(ok, "success");
        } catch (error) {
            console.error(error);
            customToast("That didn’t save. Try again.", "error");
        } finally {
            setBusy(false);
        }
    };

    const name = (id) => profiles[id]?.userName || "Someone";

    return (
        <Dialog open={open} onClose={onClose} title="People on this list" width={480}>
            <h2 className="text-[31px] font-extrabold">People</h2>
            <p className="mt-1 text-grain">Everyone here can add and remove films. Only the owner can rename or delete the list.</p>

            {owner && (
                <section className="mt-6">
                    <h3 className="text-xl font-semibold">Invite link</h3>
                    {invite ? (
                        <>
                            <div className="mt-2 flex gap-2">
                                <input readOnly value={invite} onFocus={(e) => e.target.select()} aria-label="Invite link" className="field min-w-0 flex-1 text-[13px]" />
                                <button type="button" className="btn btn-primary" onClick={() => copy(invite, "Invite link copied")}>
                                    Copy
                                </button>
                            </div>
                            <button
                                type="button"
                                className="btn btn-text -ml-2 mt-1 text-[13px]"
                                disabled={busy}
                                onClick={() =>
                                    run(async () => {
                                        await stopInvites(list.id);
                                        onChange({ inviteToken: undefined });
                                    }, "Invite link turned off")
                                }
                            >
                                Turn off this link
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="mt-1 text-grain">Anyone with the link can join after logging in.</p>
                            <button
                                type="button"
                                className="btn btn-secondary mt-3"
                                disabled={busy}
                                onClick={() => run(async () => onChange({ inviteToken: await createInvite(list.id) }))}
                            >
                                {busy && <Spinner />}
                                Create invite link
                            </button>
                        </>
                    )}
                </section>
            )}

            <section className="mt-6">
                <h3 className="text-xl font-semibold">On this list</h3>
                <ul className="mt-2 divide-y divide-reel">
                    {[ownerId, ...memberIds].filter(Boolean).map((id) => (
                        <li key={id} className="flex items-center gap-3 py-2.5">
                            <Avatar name={name(id)} size="h-8 w-8 text-sm" />
                            <span className="min-w-0 flex-1 truncate">{name(id)}</span>
                            {id === ownerId ? (
                                <span className="text-[13px] text-grain">Owner</span>
                            ) : (
                                owner && (
                                    <button
                                        type="button"
                                        className="btn btn-text min-h-[36px] text-[13px] hover:text-velvet"
                                        disabled={busy}
                                        onClick={() =>
                                            run(async () => {
                                                await removeMember(list.id, id);
                                                onChange({ members: memberIds.filter((m) => m !== id) });
                                            }, `Removed ${name(id)}`)
                                        }
                                    >
                                        Remove
                                    </button>
                                )
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            <div className="mt-8 flex justify-between gap-3">
                {!owner ? (
                    <button
                        type="button"
                        className="btn btn-destructive"
                        disabled={busy}
                        onClick={() =>
                            run(async () => {
                                await leaveList(list.id);
                                onLeft();
                            }, `You left ${list.listName}`)
                        }
                    >
                        Leave list
                    </button>
                ) : (
                    <span />
                )}
                <button type="button" className="btn btn-text" onClick={onClose}>
                    Done
                </button>
            </div>
        </Dialog>
    );
}

const REASONS = [
    ["offensive", "Offensive name or description"],
    ["spam", "Spam or advertising"],
    ["other", "Something else"],
];

export function ReportDialog({ open, onClose, list }) {
    const [reason, setReason] = useState("offensive");
    const [details, setDetails] = useState("");
    const [sending, setSending] = useState(false);

    const send = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await reportList(list.id, reason, details.trim());
            customToast("Report sent. We’ll review this list.", "success");
            setDetails("");
            onClose();
        } catch {
            customToast("Couldn’t send the report. Try again.", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title="Report this list" width={480}>
            <form onSubmit={send}>
                <h2 className="text-[31px] font-extrabold">Report this list</h2>
                <p className="mt-1 text-grain">Reports are private. The list’s author isn’t told who sent them.</p>
                <fieldset className="mt-5 space-y-2">
                    <legend className="sr-only">Reason</legend>
                    {REASONS.map(([value, label]) => (
                        <label key={value} className="flex cursor-pointer items-center gap-3">
                            <input type="radio" name="report-reason" checked={reason === value} onChange={() => setReason(value)} className="h-4 w-4 accent-[rgb(var(--beam))]" />
                            {label}
                        </label>
                    ))}
                </fieldset>
                <label htmlFor="report-details" className="label mt-5">
                    Details (optional)
                </label>
                <textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} rows={3} className="field resize-none" />
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" className="btn btn-text" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                        {sending && <Spinner />}
                        Send report
                    </button>
                </div>
            </form>
        </Dialog>
    );
}
