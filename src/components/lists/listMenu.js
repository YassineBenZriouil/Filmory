import React, { useRef, useState } from "react";
import Popover, { MenuItem } from "../../static/popover";
import { Switch } from "../../static/controls";

// The ⋯ menu on a list: edit, public/private switch, delete.
export default function ListMenu({ list, onEdit, onTogglePublic, onDelete, className = "" }) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef(null);
    const close = () => setOpen(false);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label={`Options for ${list.listName}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(e) => {
                    e.preventDefault();
                    setOpen((o) => !o);
                }}
                className={`btn btn-icon btn-text min-h-[40px] w-10 rounded-full bg-booth/70 text-screen ${className}`}
            >
                <i className="fa-solid fa-ellipsis" aria-hidden="true"></i>
            </button>
            <Popover anchorRef={buttonRef} open={open} onClose={close} label={`Options for ${list.listName}`} role="menu" width={240}>
                <MenuItem
                    onClick={() => {
                        close();
                        onEdit();
                    }}
                >
                    <i className="fa-solid fa-pen w-4 text-sm text-grain" aria-hidden="true"></i>
                    Edit details
                </MenuItem>
                <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-[8px] px-3">
                    <label htmlFor={`public-${list.id}`} className="flex items-center gap-3">
                        <i className={`fa-solid ${list.isPublic ? "fa-globe" : "fa-lock"} w-4 text-sm text-grain`} aria-hidden="true"></i>
                        Public
                    </label>
                    <Switch
                        id={`public-${list.id}`}
                        checked={!!list.isPublic}
                        onChange={() => onTogglePublic()}
                        label="Public"
                    />
                </div>
                <div className="my-1 border-t border-reel" />
                <MenuItem
                    danger
                    onClick={() => {
                        close();
                        onDelete();
                    }}
                >
                    <i className="fa-solid fa-trash w-4 text-sm" aria-hidden="true"></i>
                    Delete list
                </MenuItem>
            </Popover>
        </>
    );
}
