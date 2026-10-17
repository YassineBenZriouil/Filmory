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

- **TMDB REST API** — all calls live in `src/movie/allFetcher.js` (list/genre/country/search endpoints) and `src/movie/oneFetcher.js` (single movie/series with `append_to_response=credits,videos,release_dates|content_ratings`). The TMDB API key is hardcoded in these URLs, not in `.env`. Newer calls go through the `tmdb()` helper in `allFetcher.js` (`fetchBrowsePage`, `discoverTitles`, `searchTitles`, `fetchRecommendations`, cached `fetchTitleBasic`). Fetchers swallow errors and return `null`, except `searchTitles`, which lets aborts through.
- **Firebase (Auth + Firestore)** — initialized in `src/auth/firebase.js` from `REACT_APP_*` vars in `.env` (also `REACT_APP_COMPANY_NAME`, used for branding text). All Firestore access goes through `src/movie/databaseFetcher.js`.

### Firestore data model
- `Users` collection — user docs with an `email` field.
- `Mylists` collection — lists with `listName`, `description`, `isPublic`, `createdAt` (ms timestamp, missing on old lists), `works: { movie: [ids], tv: [ids] }` (numbers), and `user` stored as the **string** `"/Users/<uid>"` (not a DocumentReference); queries match on that string. Some old lists have `works: []`; read works through `worksOf()` / `filmCount()`, and `addMovieToList` converts the array form on first write.
- `movie/listsStore.js` briefly caches the current user's lists for the list picker; call `invalidateUserLists()` after any list write.

### Auth/session
The "current user" is identified by the email saved in `localStorage.loggedInUser` (set in `auth/login.js`, cleared in `auth/sett&logout.js`), not by Firebase `auth.currentUser`. `fetchingUserUIDByEmail()` turns that email into a `Users` doc id. `admin@admin.com` gets special handling in `sett&logout.js`.

### UI
- Routing: all routes are declared in `src/App.js` (react-router-dom v7, `BrowserRouter`). Detail page is `/movieDetails/:id/:type` where `type` selects movie vs. tv fetcher.
- Styling: Tailwind with `darkMode: "class"`. Colours are CSS variables in `style/global.css` (`:root` = light, `:root.dark` = dark) mapped to token classes in `tailwind.config.js` (`booth`, `leader`, `reel`, `grain`, `screen`, `beam`, `velvet`, `house`, `ink`), so one class covers both themes; don't use raw Tailwind palette colours or `dark:` pairs. Shared classes (`btn btn-primary|secondary|text|destructive`, `field`, `label`, `panel`, `page`, `page-title`) live in the same file. Fonts: Big Shoulders Display (`font-display`, headings) and Atkinson Hyperlegible (`font-body`).
- Theme: `style/useTheme.js` stores `light | system | dark` in `localStorage.theme` and toggles `dark` on `<html>`; an inline script in `public/index.html` applies it before first paint. The control (`style/themeBtn.js`) is in the footer.
- Motion: framer-motion. Only the route wrapper in `App.js` animates on load (frame advance + shutter blink); don't add per-component entrance animations. `MotionConfig reducedMotion="user"` handles reduced motion for framer; CSS motion has its own `prefers-reduced-motion` block in `global.css`.
- Cards: `components/smallCard.js` renders its own `<Link>` to the details page plus a quick-add button (`listPicker.js`), so never wrap it in another link. Lay cards out with `cardGrid.js` or `cardRow.js`; loading states use `SkeletonGrid` / `Loading` from `static/loading.js`.
- Shared UI: `static/popover.js` (anchored panels/menus), `static/dialog.js` (modal, bottom sheet on phones, `ConfirmDialog`), `static/controls.js` (`Switch`, `FloatField`, `Spinner`), `static/hooks.js` (`useMediaQuery`, `useFocusTrap`).
- Search lives in the header (`components/search.js`). List pages open it in add-films mode with `openAddFilms({ id, listName })`; it fires `LIST_CHANGED` after adding.
- Lists: `/mylists` (`lists/myLists.js`; `/addList` and `/updList/:listId` open its create/edit sheet), `/listInside/:id` and `/publicListInside/:id` both render `lists/listPage.js` (editable only for the owner). `/filter` and `/results` redirect to `/discover`.
- Toasts: `react-toastify` `ToastContainer` mounted once in `App.js`, styled in `global.css`; helper `customToast` in `src/static/toast.js`.
- File names are lowercase/camelCase (e.g. `components/movieDetails.js`, `lists/Public/publiclists.js`); match the actual casing on imports.
