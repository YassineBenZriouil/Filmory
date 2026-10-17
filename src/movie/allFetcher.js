import { getJson } from "./http";
const POPULAR_MOVIES =
    "https://api.themoviedb.org/3/movie/popular?api_key=8dc69cc265c5c8924c21ede4b9ddc208"; // working properly

const LATEST_MOVIES =
    "https://api.themoviedb.org/3/movie/upcoming?api_key=8dc69cc265c5c8924c21ede4b9ddc208";

const POPULAR_SERIES =
    "https://api.themoviedb.org/3/tv/top_rated?api_key=8dc69cc265c5c8924c21ede4b9ddc208"; // working properly

const LATEST_SERIES =
    "https://api.themoviedb.org/3/tv/on_the_air?api_key=8dc69cc265c5c8924c21ede4b9ddc208";

const MOVIE_GENERES =
    "https://api.themoviedb.org/3/genre/movie/list?language=en&api_key=8dc69cc265c5c8924c21ede4b9ddc208";

const SERIES_GENERES =
    "https://api.themoviedb.org/3/genre/tv/list?language=en&api_key=8dc69cc265c5c8924c21ede4b9ddc208";

const COUNTRIES =
    "https://api.themoviedb.org/3/configuration/countries?language=en-US&api_key=8dc69cc265c5c8924c21ede4b9ddc208";

const BASE_URL = "https://api.themoviedb.org/3";

// ---- Shared request helper (Phase 3+) ----
const API_KEY = new URL(POPULAR_MOVIES).searchParams.get("api_key");

const tmdb = async (path, params = {}, signal) => {
    const url = new URL(BASE_URL + path);
    url.searchParams.set("api_key", API_KEY);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "")
            url.searchParams.set(key, value);
    }
    return getJson(url.toString(), { signal });
};

// TMDB never serves past page 500.
const MAX_PAGES = 500;

export const fetchBrowsePage = async (type, page) => {
    try {
        const data = await tmdb(`/${type}/popular`, { page });
        return {
            results: data.results || [],
            totalPages: Math.min(data.total_pages || 1, MAX_PAGES),
        };
    } catch (error) {
        console.error("Error fetching browse page:", error);
        return null;
    }
};

const SORTS = {
    popular: () => ({ sort_by: "popularity.desc" }),
    rating: () => ({ sort_by: "vote_average.desc", "vote_count.gte": 200 }),
    newest: (type) => ({
        sort_by: type === "tv" ? "first_air_date.desc" : "primary_release_date.desc",
        "vote_count.gte": 10,
    }),
};

export const discoverTitles = async ({
    type,
    year,
    genres = [],
    sort = "popular",
    page = 1,
    runtimeMax,
    minRating,
    language,
    providers = [],
    region,
    cast,
    keywords,
}) => {
    try {
        const sorting = (SORTS[sort] || SORTS.popular)(type);
        const data = await tmdb(`/discover/${type}`, {
            page,
            with_genres: genres.join(","),
            [type === "tv" ? "first_air_date_year" : "primary_release_year"]: year,
            ...sorting,
            "with_runtime.lte": runtimeMax,
            ...(minRating && {
                "vote_average.gte": minRating,
                "vote_count.gte": Math.max(sorting["vote_count.gte"] || 0, 50),
            }),
            with_original_language: language,
            // "|" = any of these services
            ...(providers.length && {
                with_watch_providers: providers.join("|"),
                watch_region: region,
                with_watch_monetization_types: "flatrate|free|ads",
            }),
            with_cast: type === "movie" ? cast : undefined,
            with_people: type === "tv" ? cast : undefined,
            with_keywords: keywords,
        });
        return {
            results: data.results || [],
            totalResults: data.total_results || 0,
            totalPages: Math.min(data.total_pages || 1, MAX_PAGES),
        };
    } catch (error) {
        console.error("Error discovering titles:", error);
        return null;
    }
};

// Movies and series together (and people, if asked). Aborts propagate so callers can ignore stale requests.
export const searchTitles = async (query, { signal, page = 1, people = false } = {}) => {
    const data = await tmdb("/search/multi", { query, page, include_adult: false }, signal);
    return {
        results: (data.results || []).filter(
            (r) => r.media_type === "movie" || r.media_type === "tv" || (people && r.media_type === "person")
        ),
        totalResults: data.total_results || 0,
        totalPages: Math.min(data.total_pages || 1, MAX_PAGES),
    };
};

export const fetchRecommendations = async (type, id) => {
    try {
        let data = await tmdb(`/${type}/${id}/recommendations`);
        if (!data.results?.length) data = await tmdb(`/${type}/${id}/similar`);
        return (data.results || []).filter((r) => String(r.id) !== String(id));
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return [];
    }
};

export const fetchPerson = async (id) => {
    try {
        return await tmdb(`/person/${id}`, { append_to_response: "combined_credits" });
    } catch (error) {
        console.error("Error fetching person:", error);
        return null;
    }
};

export const fetchSeason = async (tvId, season) => {
    try {
        return await tmdb(`/tv/${tvId}/season/${season}`);
    } catch (error) {
        console.error("Error fetching season:", error);
        return null;
    }
};

// Streaming services available in a region, most prominent first.
export const fetchProviders = async (type, region) => {
    try {
        const data = await tmdb(`/watch/providers/${type}`, { watch_region: region });
        return (data.results || []).sort(
            (a, b) =>
                (a.display_priorities?.[region] ?? a.display_priority ?? 999) -
                (b.display_priorities?.[region] ?? b.display_priority ?? 999)
        );
    } catch (error) {
        console.error("Error fetching providers:", error);
        return [];
    }
};

export const fetchWatchRegions = async () => {
    try {
        const data = await tmdb("/watch/providers/regions");
        return data.results || [];
    } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
    }
};

// Basic details only (no credits/videos): enough for a card or a poster.
const basicCache = new Map();
export const fetchTitleBasic = (type, id) => {
    const key = `${type}:${id}`;
    if (!basicCache.has(key)) {
        basicCache.set(
            key,
            tmdb(`/${type}/${id}`)
                .then((data) => ({ ...data, type }))
                .catch((error) => {
                    basicCache.delete(key);
                    console.error("Error fetching title:", error);
                    return null;
                })
        );
    }
    return basicCache.get(key);
};

export const fetchAllPopularMovies = async () => {
    try {
        const data = await getJson(POPULAR_MOVIES);
        return data.results; // Return the list of movies
    } catch (error) {
        console.error("Error fetching all movies data:", error);
        return null;
    }
};

export const fetchAllLatestMovies = async () => {
    try {
        const data = await getJson(LATEST_MOVIES);
        return data.results; // Return the list of series
    } catch (error) {
        console.error("Error fetching all series data:", error);
        return null;
    }
};
export const fetchPopularSeries = async () => {
    try {
        const data = await getJson(POPULAR_SERIES);
        return data.results; // Return the list of series
    } catch (error) {
        console.error("Error fetching all series data:", error);
        return null;
    }
};

export const fetchLatestSeries = async () => {
    try {
        const data = await getJson(LATEST_SERIES);
        return data.results; // Return the list of series
    } catch (error) {
        console.error("Error fetching all series data:", error);
        return null;
    }
};

export const fetchMoviesByGenres = async (genreIds) => {
    try {
        const data = await getJson(
            `https://api.themoviedb.org/3/discover/movie?api_key=8dc69cc265c5c8924c21ede4b9ddc208&with_genres=${genreIds.join(
                ","
            )}`
        );
        return data.results; // Return list of movies
    } catch (error) {
        console.error("Error fetching movies by genres:", error);
        return null;
    }
};

export const fetchSeriesByGenres = async (genreIds) => {
    try {
        const data = await getJson(
            `https://api.themoviedb.org/3/discover/tv?api_key=8dc69cc265c5c8924c21ede4b9ddc208&with_genres=${genreIds.join(
                ","
            )}`
        );
        return data.results; // Return list of TV series
    } catch (error) {
        console.error("Error fetching TV series by genres:", error);
        return null;
    }
};

export const fetchAllPopularMoviesByPage = async (page) => {
    try {
        const data = await getJson(
            `https://api.themoviedb.org/3/movie/popular?api_key=8dc69cc265c5c8924c21ede4b9ddc208&page=${page}`
        );
        return data.results; // Return the list of movies
    } catch (error) {
        console.error("Error fetching all movies data:", error);
        return null;
    }
};

export const fetchAllPopularSeriesByPage = async (page) => {
    try {
        const data = await getJson(
            `https://api.themoviedb.org/3/tv/on_the_air?api_key=8dc69cc265c5c8924c21ede4b9ddc208&page=${page}`
        );
        return data.results; // Return the list of movies
    } catch (error) {
        console.error("Error fetching all movies data:", error);
        return null;
    }
};

export const fetchMovieGeneres = async () => {
    try {
        const data = await getJson(MOVIE_GENERES);
        return data.genres?.map((genre) => genre) || []; // Return the list of genres
    } catch (error) {
        console.error("Error fetching movie genres:", error);
        return [];
    }
};

export const fetchSeriesGeneres = async () => {
    try {
        const data = await getJson(SERIES_GENERES);
        return data.genres?.map((genre) => genre) || []; // Return the list of genres
    } catch (error) {
        console.error("Error fetching movie genres:", error);
        return [];
    }
};

export const fetchAllCountries = async () => {
    try {
        const data = await getJson(COUNTRIES);
        return data.map((country) => country) || []; // Directly map over the array
    } catch (error) {
        console.error("Error fetching countries data:", error);
        return [];
    }
};

export const filteredFetcher = async (type, releaseYear, genres, country) => {
    try {
        const genreParam = genres.length
            ? `&with_genres=${genres.join(",")}`
            : "";
        const countryParam = country ? `&region=${country}` : "";
        const yearParam = releaseYear
            ? `&primary_release_year=${releaseYear}`
            : "";

        const url =
            type === "movie"
                ? `${BASE_URL}/discover/movie?api_key=8dc69cc265c5c8924c21ede4b9ddc208${genreParam}${countryParam}${yearParam}`
                : `${BASE_URL}/discover/tv?api_key=8dc69cc265c5c8924c21ede4b9ddc208${genreParam}${countryParam}${yearParam}`;

        const data = await getJson(url);
        return data.results || [];
    } catch (error) {
        console.error("Error fetching filtered results:", error);
        return [];
    }
};

export const fetchAllMoviesBySearchQuery = async (searchTerm) => {
    try {
        const data = await getJson(
            `https://api.themoviedb.org/3/search/movie?api_key=8dc69cc265c5c8924c21ede4b9ddc208&query=${searchTerm}`
        );
        return data.results; // Return list of movies and TV series
    } catch (error) {
        console.error("Error fetching movies by search:", error);
        return null;
    }
};

export const fetchAllSeriesBySearchQuery = async (searchTerm) => {
    try {
        const data = await getJson(
            `https://api.themoviedb.org/3/search/tv?api_key=8dc69cc265c5c8924c21ede4b9ddc208&query=${searchTerm}`
        );
        return data.results; // Return list of movies and TV series
    } catch (error) {
        console.error("Error fetching movies by search:", error);
        return null;
    }
};
