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
