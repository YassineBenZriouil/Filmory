import React, { Children, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";

// A titled, sideways-scrolling row of cards that bleeds off the right edge.
export default function CardRow({ title, seeAll, children }) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);
    const count = Children.count(children);

    const update = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        setAtStart(el.scrollLeft < 4);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [update, count]);

    const scroll = (dir) =>
        ref.current.scrollBy({
            left: dir * ref.current.clientWidth * 0.9,
            behavior: reduce ? "auto" : "smooth",
        });

    const chevron = (dir, hidden) => (
        <button
            type="button"
            onClick={() => scroll(dir)}
            aria-label={dir < 0 ? `Scroll ${title} back` : `Scroll ${title} forward`}
            tabIndex={-1}
            className={`absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-reel bg-booth/90 text-screen transition-opacity duration-quick hover:border-grain md:grid ${
                dir < 0 ? "left-3" : "right-3"
            } ${
                hidden
                    ? "pointer-events-none opacity-0"
                    : "opacity-0 group-hover/row:opacity-100"
            }`}
        >
            <i
                className={`fa-solid ${dir < 0 ? "fa-chevron-left" : "fa-chevron-right"}`}
                aria-hidden="true"
            ></i>
        </button>
    );

    return (
        <section className="group/row py-6" aria-label={title}>
            <div className="page-x mx-auto mb-4 flex max-w-[1464px] items-baseline justify-between gap-4">
                <h2 className="text-[25px] font-semibold md:text-[31px]">{title}</h2>
                {seeAll && (
                    <Link to={seeAll} className="btn btn-text min-h-0 py-1">
                        See all
                    </Link>
                )}
            </div>
            <div className="relative">
                <div
                    ref={ref}
                    onScroll={update}
                    className={`row-scroller page-x flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 pb-3 pt-1 md:scroll-px-8 xl:scroll-px-[72px] ${
                        atStart ? "" : "fade-start"
                    } ${atEnd ? "" : "fade-end"}`}
                >
                    {count
                        ? Children.map(children, (child) => (
                              <div className="w-[140px] shrink-0 snap-start sm:w-[160px] md:w-[200px]">
                                  {child}
                              </div>
                          ))
                        : Array.from({ length: 8 }, (_, i) => (
                              <div
                                  key={i}
                                  aria-hidden="true"
                                  className="w-[140px] shrink-0 sm:w-[160px] md:w-[200px]"
                              >
                                  <div className="skeleton aspect-[2/3] rounded-[3px]" />
                                  <div className="skeleton mt-3 h-4 w-4/5 rounded" />
                                  <div className="skeleton mt-2 h-3 w-1/3 rounded" />
                              </div>
                          ))}
                </div>
                {chevron(-1, atStart)}
                {chevron(1, atEnd)}
            </div>
        </section>
    );
}
