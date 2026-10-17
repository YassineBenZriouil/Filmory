import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchProviders, fetchWatchRegions } from "../movie/allFetcher";
import { getRegion, getServices, regionName, setRegion, setServices } from "../static/prefs";
import { customToast } from "../static/toast";

// Region and the streaming services this person has. Saved on this device.
export default function WatchSettings() {
    const { hash } = useLocation();
    const sectionRef = useRef(null);
    const [regions, setRegions] = useState([]);
    const [region, setRegionState] = useState(getRegion);
    const [providers, setProviders] = useState(null);
    const [services, setServicesState] = useState(() => getServices(getRegion()));

    useEffect(() => {
        fetchWatchRegions().then((list) =>
            setRegions([...list].sort((a, b) => regionName(a.iso_3166_1).localeCompare(regionName(b.iso_3166_1))))
        );
    }, []);

    useEffect(() => {
        let alive = true;
        setProviders(null);
        fetchProviders("movie", region).then((list) => alive && setProviders(list.slice(0, 24)));
        return () => {
            alive = false;
        };
    }, [region]);

    // Linked from "Change region" on a film page.
    useEffect(() => {
        if (hash === "#region") sectionRef.current?.scrollIntoView({ block: "start" });
    }, [hash]);

    const changeRegion = (code) => {
        setRegion(code);
        setRegionState(code);
        setServicesState(getServices(code));
        customToast(`Region set to ${regionName(code)}`, "success");
    };

    const toggle = (id) => {
        const next = services.includes(id) ? services.filter((x) => x !== id) : [...services, id];
        setServices(next, region);
        setServicesState(next);
    };

    return (
        <section ref={sectionRef} id="region" aria-labelledby="watch-settings" className="mt-16 scroll-mt-24">
            <h2 id="watch-settings" className="text-[25px] font-semibold md:text-[31px]">
                Where you watch
            </h2>
            <p className="mt-2 max-w-[60ch] text-grain">
                Used for “Where to watch” on film pages and the streaming filter in Discover.
            </p>

            <label className="mt-5 flex w-fit flex-col gap-1 text-[13px] text-grain">
                Region
                <select
                    value={region}
                    onChange={(e) => changeRegion(e.target.value)}
                    className="field min-h-[44px] w-auto min-w-[240px] cursor-pointer text-base"
                >
                    {!regions.some((r) => r.iso_3166_1 === region) && <option value={region}>{regionName(region)}</option>}
                    {regions.map((r) => (
                        <option key={r.iso_3166_1} value={r.iso_3166_1}>
                            {regionName(r.iso_3166_1)}
                        </option>
                    ))}
                </select>
            </label>

            <fieldset className="mt-6">
                <legend className="text-[13px] text-grain">Services you have</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                    {providers === null
                        ? Array.from({ length: 8 }, (_, i) => <span key={i} className="skeleton h-10 w-32 rounded-full" aria-hidden="true" />)
                        : providers.map((p) => {
                              const on = services.includes(p.provider_id);
                              return (
                                  <button
                                      key={p.provider_id}
                                      type="button"
                                      aria-pressed={on}
                                      onClick={() => toggle(p.provider_id)}
                                      className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors duration-quick ${
                                          on ? "border-beam bg-beam/15 text-screen" : "border-reel text-grain hover:border-grain hover:text-screen"
                                      }`}
                                  >
                                      <img
                                          src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                          alt=""
                                          width="28"
                                          height="28"
                                          loading="lazy"
                                          className="h-7 w-7 rounded-full object-cover"
                                      />
                                      {p.provider_name}
                                      {on && <i className="fa-solid fa-check text-xs text-beam" aria-hidden="true"></i>}
                                  </button>
                              );
                          })}
                </div>
                {providers?.length === 0 && <p className="mt-2 text-grain">TMDB has no streaming services listed for {regionName(region)}.</p>}
            </fieldset>
        </section>
    );
}
