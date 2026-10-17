// Poster morph from a "More like this" card into the details page poster.
// The card records where its poster was on screen; the details page plays a FLIP from there.
let stash = null;

export const stashPoster = (id, el) => {
    stash = { id: String(id), rect: el.getBoundingClientRect(), at: Date.now() };
};

export const takePoster = (id) => {
    const s = stash;
    stash = null;
    return s && s.id === String(id) && Date.now() - s.at < 4000 ? s : null;
};

export const flipFrom = (el, from) => {
    const to = el.getBoundingClientRect();
    if (!to.width) return;
    const scale = from.width / to.width;
    el.animate(
        [
            {
                transformOrigin: "top left",
                transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${scale})`,
            },
            { transformOrigin: "top left", transform: "none" },
        ],
        { duration: 420, easing: "cubic-bezier(.65,0,.35,1)" }
    );
};
