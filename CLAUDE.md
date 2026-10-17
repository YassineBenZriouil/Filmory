# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Never touch Git: no commits, staging, branches, resets, stashes, pushes, or any other git command. The user handles version control.
- All Markdown files use uppercase names (e.g. `REDESIGN.md`, `REDESIGN-PHASES.md`).
- The redesign spec is `REDESIGN.md`; work through it in the order given in `REDESIGN-PHASES.md`.

## Commands

Create React App project (`react-scripts` 5), plain JavaScript, no TypeScript.

- `npm start` — dev server on http://localhost:3000
- `npm run build` — production build to `build/`
- `npm test` — Jest in watch mode; run one file with `npm test -- src/path/file.test.js`, non-interactive with `CI=true npm test`
- Lint: ESLint runs through CRA (`react-app` config) during `start`/`build`; there is no separate lint script.

There are currently no test files in `src/`.

## Architecture

Filmory is a movie/TV browsing app with user-curated lists. Two backends:

- **TMDB REST API** — all calls live in `src/movie/allFetcher.js` (list/genre/country/search endpoints) and `src/movie/oneFetcher.js` (single movie/series with `append_to_response=credits,videos`). The TMDB API key is hardcoded in these URLs, not in `.env`. Fetchers swallow errors and return `null`.
- **Firebase (Auth + Firestore)** — initialized in `src/auth/firebase.js` from `REACT_APP_*` vars in `.env` (also `REACT_APP_COMPANY_NAME`, used for branding text). All Firestore access goes through `src/movie/databaseFetcher.js`.

### Firestore data model
- `Users` collection — user docs with an `email` field.
- `Mylists` collection — lists with `listName`, `description`, `isPublic`, and `user` stored as the **string** `"/Users/<uid>"` (not a DocumentReference); queries match on that string.

### Auth/session
The "current user" is identified by the email saved in `localStorage.loggedInUser` (set in `auth/login.js`, cleared in `auth/sett&logout.js`), not by Firebase `auth.currentUser`. `fetchingUserUIDByEmail()` turns that email into a `Users` doc id. `admin@admin.com` gets special handling in `sett&logout.js`.

### UI
- Routing: all routes are declared in `src/App.js` (react-router-dom v7, `BrowserRouter`). Detail page is `/movieDetails/:id/:type` where `type` selects movie vs. tv fetcher.
- Styling: Tailwind with `darkMode: "class"`. Colours are CSS variables in `style/global.css` (`:root` = light, `:root.dark` = dark) mapped to token classes in `tailwind.config.js` (`booth`, `leader`, `reel`, `grain`, `screen`, `beam`, `velvet`, `house`, `ink`), so one class covers both themes; don't use raw Tailwind palette colours or `dark:` pairs. Shared classes (`btn btn-primary|secondary|text|destructive`, `field`, `label`, `panel`, `page`, `page-title`) live in the same file. Fonts: Big Shoulders Display (`font-display`, headings) and Atkinson Hyperlegible (`font-body`).
- Theme: `style/useTheme.js` stores `light | system | dark` in `localStorage.theme` and toggles `dark` on `<html>`; an inline script in `public/index.html` applies it before first paint. The control (`style/themeBtn.js`) is in the footer.
- Motion: framer-motion. Only the route wrapper in `App.js` animates on load (frame advance + shutter blink); don't add per-component entrance animations. `MotionConfig reducedMotion="user"` handles reduced motion for framer; CSS motion has its own `prefers-reduced-motion` block in `global.css`.
- Cards: `components/smallCard.js` renders its own `<Link>` to the details page, so never wrap it in another link. Lay cards out with `cardGrid.js` or `cardRow.js`; loading states use `SkeletonGrid` / `Loading` from `static/loading.js`.
- Toasts: `react-toastify` `ToastContainer` mounted once in `App.js`, styled in `global.css`; helper `customToast` in `src/static/toast.js`.
- File names are lowercase/camelCase (e.g. `components/movieDetails.js`, `lists/Public/publiclists.js`); match the actual casing on imports.
