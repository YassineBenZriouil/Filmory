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
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`TMDB ${response.status}`);
    return response.json();
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

export const discoverTitles = async ({ type, year, genres = [], sort = "popular", page = 1 }) => {
    try {
        const data = await tmdb(`/discover/${type}`, {
            page,
            with_genres: genres.join(","),
            [type === "tv" ? "first_air_date_year" : "primary_release_year"]: year,
            ...(SORTS[sort] || SORTS.popular)(type),
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

// Movies and series together. Aborts propagate so callers can ignore stale requests.
export const searchTitles = async (query, { signal, page = 1 } = {}) => {
    const data = await tmdb("/search/multi", { query, page, include_adult: false }, signal);
    return {
        results: (data.results || []).filter(
            (r) => r.media_type === "movie" || r.media_type === "tv"
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
        const response = await fetch(POPULAR_MOVIES);
        const data = await response.json();
        return data.results; // Return the list of movies
    } catch (error) {
        console.error("Error fetching all movies data:", error);
        return null;
    }
};

export const fetchAllLatestMovies = async () => {
    try {
        const response = await fetch(LATEST_MOVIES);
        const data = await response.json();
        return data.results; // Return the list of series
    } catch (error) {
        console.error("Error fetching all series data:", error);
        return null;
    }
};
export const fetchPopularSeries = async () => {
    try {
        const response = await fetch(POPULAR_SERIES);
        const data = await response.json();
        return data.results; // Return the list of series
    } catch (error) {
        console.error("Error fetching all series data:", error);
        return null;
    }
};

export const fetchLatestSeries = async () => {
    try {
        const response = await fetch(LATEST_SERIES);
        const data = await response.json();
        return data.results; // Return the list of series
    } catch (error) {
        console.error("Error fetching all series data:", error);
        return null;
    }
};

export const fetchMoviesByGenres = async (genreIds) => {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=8dc69cc265c5c8924c21ede4b9ddc208&with_genres=${genreIds.join(
                ","
            )}`
        );
        const data = await response.json();
        return data.results; // Return list of movies
    } catch (error) {
        console.error("Error fetching movies by genres:", error);
        return null;
    }
};

export const fetchSeriesByGenres = async (genreIds) => {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/discover/tv?api_key=8dc69cc265c5c8924c21ede4b9ddc208&with_genres=${genreIds.join(
                ","
            )}`
        );
        const data = await response.json();
        return data.results; // Return list of TV series
    } catch (error) {
        console.error("Error fetching TV series by genres:", error);
        return null;
    }
};

export const fetchAllPopularMoviesByPage = async (page) => {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=8dc69cc265c5c8924c21ede4b9ddc208&page=${page}`
        );
        const data = await response.json();
        return data.results; // Return the list of movies
    } catch (error) {
        console.error("Error fetching all movies data:", error);
        return null;
    }
};

export const fetchAllPopularSeriesByPage = async (page) => {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/tv/on_the_air?api_key=8dc69cc265c5c8924c21ede4b9ddc208&page=${page}`
        );
        const data = await response.json();
        return data.results; // Return the list of movies
    } catch (error) {
        console.error("Error fetching all movies data:", error);
        return null;
    }
};

export const fetchMovieGeneres = async () => {
    try {
        const response = await fetch(MOVIE_GENERES);
        const data = await response.json();
        return data.genres?.map((genre) => genre) || []; // Return the list of genres
    } catch (error) {
        console.error("Error fetching movie genres:", error);
        return [];
    }
};

export const fetchSeriesGeneres = async () => {
    try {
        const response = await fetch(SERIES_GENERES);
        const data = await response.json();
        return data.genres?.map((genre) => genre) || []; // Return the list of genres
    } catch (error) {
        console.error("Error fetching movie genres:", error);
        return [];
    }
};

export const fetchAllCountries = async () => {
    try {
        const response = await fetch(COUNTRIES);
        const data = await response.json();
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

        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error fetching filtered results:", error);
        return [];
    }
};

export const fetchAllMoviesBySearchQuery = async (searchTerm) => {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=8dc69cc265c5c8924c21ede4b9ddc208&query=${searchTerm}`
        );
        const data = await response.json();
        return data.results; // Return list of movies and TV series
    } catch (error) {
        console.error("Error fetching movies by search:", error);
        return null;
    }
};

export const fetchAllSeriesBySearchQuery = async (searchTerm) => {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/tv?api_key=8dc69cc265c5c8924c21ede4b9ddc208&query=${searchTerm}`
        );
        const data = await response.json();
        return data.results; // Return list of movies and TV series
    } catch (error) {
        console.error("Error fetching movies by search:", error);
        return null;
    }
};
