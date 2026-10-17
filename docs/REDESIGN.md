# Filmory redesign

A full visual and motion redesign of every screen, component and state in the app. Nothing keeps its current look. Behavior and data flow stay the same unless a section says otherwise.

---

## 1. The idea: the projection booth

Filmory is a place to browse films and keep lists of them. It doesn't stream anything. People come to look at films, decide what they care about, and file them away. That's closer to a film archive or a cinematheque programme than to a streaming service, so the design shouldn't borrow Netflix's look.

The concept is the **projection booth**: the dark room behind the cinema where the projectionist works under a single tungsten lamp, threads reels, and keeps a handwritten programme. That gives us:

- **One warm light source.** The tungsten beam is the only bright, saturated colour in the app. It marks whatever the person is acting on right now: the focused card, the selected filter, the primary button. Everything else is deep blue-teal and silver.
- **Frames and reels.** A poster is a frame. A list is a reel. Moving between pages is advancing the film by one frame.
- **The leader countdown.** Loading uses the film-leader countdown circle, not a spinner.

The one bold thing: **the beam.** A soft cone of tungsten light that follows focus and hover, and a single shutter-blink on route change. Everything else stays quiet.

---

## 2. Tokens

### 2.1 Colour

Dark ("Booth") is the primary theme. Light ("Matinee") is the house lights coming up: silver screen, not cream paper.

| Token | Booth (dark) | Matinee (light) | Role |
|---|---|---|---|
| `--booth` | `#0F1E26` | `#E6EAED` | Page background |
| `--leader` | `#1C3340` | `#D3DADF` | Raised surfaces: header, panels, inputs |
| `--reel` | `#2E4A57` | `#B4C0C8` | Borders, dividers, inactive controls |
| `--grain` | `#8DA0AB` | `#4F6370` | Secondary text, metadata |
| `--screen` | `#E9EDF0` | `#0F1E26` | Primary text |
| `--beam` | `#F2C35B` | `#B9831A` | The tungsten light: focus, selection, primary action |
| `--velvet` | `#B4434F` | `#9A2E3A` | Destructive actions and errors only (cinema-seat red) |
| `--house` | `#5FA88A` | `#2F7A5C` | Success and "public" state only |

Rules:
- `--beam` never fills large areas. Max: a button, a 2px rule, a glow.
- Pure `#000`/`#fff` never appear. Image scrims use `--booth` at varying alpha.
- All text pairs hit WCAG AA. `--beam` on `--booth` is 10.4:1; Matinee `--beam` is used for fills with `--booth` text on top, not for small text on the light background.
- Retire every `blue-500/700`, `gray-200/900`, `green-500`, `yellow-500`, `red-600` utility in the codebase.

Add to `tailwind.config.js` as CSS-variable colours (`booth: "rgb(var(--booth) / <alpha-value>)"` etc.) so `dark:` pairs disappear from the JSX: one class, two themes.

### 2.2 Type

| Role | Face | Notes |
|---|---|---|
| Display: page titles, film titles, list names, ratings, years | **Big Shoulders Display** (600, 800) | Condensed, built from Chicago signage. Reads like a marquee. Tabular figures for numbers. |
| Text: everything else | **Atkinson Hyperlegible** (400, 700) | Designed for legibility. Pairs with the condensed display without competing. |

Scale (1.25 ratio, 16px base): 13 / 16 / 20 / 25 / 31 / 39 / 49 / 61 / 76.
- Film title on details page: 61–76px, 800, tracking -0.01em, line-height 0.95.
- Page titles: 49px, 800.
- Section titles on Home: 31px, 600.
- Body: 16px, line-height 1.55, max 68ch.
- Metadata: 13px Atkinson, `--grain`, line-height 1.4.

Kill all `uppercase` / `toUpperCase()` on headings, list names and nav. Big Shoulders already has presence in sentence case. Remove every emoji from headings and buttons.

Load from Google Fonts in `public/index.html` with `display=swap`.

### 2.3 Shape, depth, space

- **Radius has hierarchy, not one value.** Posters: 3px (prints have barely-rounded corners). Inputs and buttons: 6px. Panels/sheets: 14px. Pills (genre chips, toggles): full.
- **No grey drop shadows.** Depth comes from surface colour steps (`--booth` → `--leader`) and, for the active thing only, the beam glow: `0 0 0 1px var(--beam), 0 8px 32px -8px rgb(var(--beam) / .35)`.
- Spacing on a 4px grid: 4, 8, 12, 16, 24, 32, 48, 72, 112.
- Page gutter: 16px mobile, 32px tablet, 72px desktop. Content max-width 1320px.

### 2.4 Motion tokens

| Token | Value | Use |
|---|---|---|
| `--t-blink` | 90ms | Shutter blink |
| `--t-quick` | 160ms | Hover, press, colour |
| `--t-move` | 280ms | Panels, menus, dropdowns |
| `--t-frame` | 420ms | Route transition |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Things arriving |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | Things leaving |
| `--ease-reel` | `cubic-bezier(.65,0,.35,1)` | Things moving across (carousel, frame advance) |

`prefers-reduced-motion: reduce` → all transforms become 0ms opacity cross-fades of 120ms, carousel autoplay stops, the beam follows focus without easing, the leader countdown becomes a static "Loading" label.

---

## 3. Global changes

### 3.1 Delete the global transition rule
`src/style/global.css` applies `transition-all duration-200` to `*`. This animates every layout change, every image load, every width change, and makes the theme toggle smear. Delete it. Transitions are declared per component, on specific properties only (`transform`, `opacity`, `color`, `background-color`, `box-shadow`).

### 3.2 Route transitions: the frame advance
Today `static/animations.js` wraps content in a slide-from-right (`x: 100 → 0`) and defines an `exit` that never runs, because there is no `AnimatePresence`. Every card on Home also wraps itself in the same animation, so 32 cards slide in at once.

Replace with:
- `AnimatePresence mode="wait"` around `<Routes location={location} key={location.pathname}>` in `App.js`.
- Exit: page translates `y: 0 → -24px`, opacity `1 → 0`, `--t-frame` × 0.4, `--ease-in`.
- Between: a full-viewport `--booth` overlay blinks to 100% for `--t-blink` (the shutter).
- Enter: page translates `y: 24px → 0`, opacity `0 → 1`, `--t-frame` × 0.6, `--ease-out`.
- Remove `<Animations>` from `SmallCard`, Home sections, and everything else. Only the route wrapper animates on load.
- Scroll to top on route change (currently missing; you land mid-page on details).

This is the one orchestrated, unprompted motion in the app.

### 3.3 The beam (focus + hover light)
A single absolutely-positioned element under the content layer: a radial gradient `rgb(var(--beam) / .12)` → transparent, 420px wide. On pointer devices it eases toward the hovered card/button (`--t-move`, `--ease-out`). On keyboard focus it jumps to the focused element. On touch devices it is not rendered.

Focus ring everywhere: `outline: 2px solid var(--beam); outline-offset: 3px`. Never `focus:outline-none` without a replacement (it's currently on every input).

### 3.4 Tiny global details
- `::selection`: `--beam` background, `--booth` text.
- `caret-color: var(--beam)` on all inputs.
- Scrollbar: 10px, thumb `--reel`, track `--booth`, thumb `--grain` on hover (`scrollbar-color` + `::-webkit-scrollbar`).
- `color-scheme: dark` / `light` set on `:root` per theme so native controls (date, select menus, scrollbars) match.
- Theme switch: no colour smear. Toggle a `theme-switching` class that disables transitions for one frame, swap vars, remove the class.
- `<title>` per route: "Filmory", "Dune: Part Two – Filmory", "My lists – Filmory".
- Favicon: a small projector-lens circle in `--beam` on `--booth` replacing the CRA React logo.
- `<meta name="theme-color">` updated on theme change.
- Images: `loading="lazy"`, `decoding="async"`, explicit `width`/`height` (2:3 for posters, 16:9 for backdrops) to stop layout shift. Fade in from opacity 0 over `--t-move` on `onLoad`, over a `--leader` placeholder with faint film grain (SVG noise, 4% opacity).
- Missing poster: replace the pngtree hotlink with a local SVG frame: `--leader` fill, the title set in Big Shoulders, centred.
- Use TMDB `w342` for cards and `w92` for search thumbnails instead of `w500` everywhere; `w1280` for backdrops instead of `original`.

---

## 4. Shell

### 4.1 Header (`static/header.js`)

Now: grey bar, brain icon in blue, eight ALL-CAPS links, an icon-pair for filter, a user icon.

Redesign:
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◉ Filmory      Home  Movies  TV shows  Public lists  My lists   [⌕ Search…] (YB) │
└──────────────────────────────────────────────────────────────────────────┘
```
- Logo mark: replace `fa-brain` (unrelated to film) with a projector lens: two concentric circles, inner filled `--beam`. Wordmark in Big Shoulders 800, 25px, from `REACT_APP_COMPANY_NAME`.
- Nav in sentence case, Atkinson 16px, `--grain`. Active route: `--screen` text with a 2px `--beam` rule under it.
  - Motion: the rule is one shared element (`layoutId="nav-rule"`) that slides between links on route change, `--t-move`, `--ease-reel`.
  - Hover: text goes `--grain` → `--screen` over `--t-quick`. No underline.
- "Filter" leaves the nav and becomes the search field on the right (see §5.6). "About" moves to the footer.
- Profile: a 32px circle with the user's initials in Big Shoulders on `--reel`. Logged out: a "Log in" text button.
- Sticky. Background `--booth` at 80% with `backdrop-filter: blur(12px)`. On scroll past 8px a 1px `--reel` bottom border fades in (`--t-quick`). Header height 64px, drops to 56px after scroll (`--t-move`).
- Add `aria-current="page"` to the active link. Fix: `<Link>` currently wraps `<li>` (invalid); make it `<li><Link/></li>`.

**Mobile (<768px):**
- Burger is two lines (not three), 24px. On open they rotate into an ×: top line +45°, bottom −45°, `--t-move`, `--ease-out`.
- Menu is a full-height sheet sliding down from under the header (`y: -8 → 0`, opacity 0 → 1, `--t-move`). Links are Big Shoulders 39px, left-aligned, stacked with 8px gap; they stagger in by 30ms each.
- Body scroll locks while open. `Esc` closes. Focus moves to the first link, and returns to the burger on close. `aria-expanded` on the burger.
- Fixes the existing bug where "PUBLIC LISTS" displays as "PUBLIC" in the mobile menu.

### 4.2 Footer (`static/footer.js`)

Now: grey bar with logo, copyright, "Made By…", a bare "Visit" link, theme button, all centred in a row.

Redesign: a quiet two-row strip, left-aligned.
```
 ◉ Filmory                                          About   ☀︎ ◐ ☾
 Film data from TMDB. Made by Yassine Ben Zriouil — ybz.vercel.app      © 2026
```
- `--grain` text 13px on `--booth`, 1px `--reel` top rule. 48px vertical padding.
- "Visit" becomes the actual domain as the link text.
- Add the TMDB attribution line (required by TMDB's terms, currently missing).
- Fix the copyright string (`© 2026All rights reserved.Filmory` renders with no spaces today) and drop "All rights reserved".
- Theme toggle → three-way segmented control: Light / System / Dark. The selected segment has a `--leader` pill that slides (`layoutId`, `--t-move`). Icons only, each with an `aria-label`; a `role="radiogroup"`. "System" follows `prefers-color-scheme` and is the new default. Persist in `localStorage.theme` as today.

### 4.3 Loading (`static/loading.js`)

Now: a Flowbite spinner, full-screen `h-screen w-screen`, which also gets dropped inside card grids (Movies/TV), breaking the layout.

Redesign: **film-leader countdown.**
- A 96px circle in `--reel` with a crosshair. A sweep wedge (`conic-gradient`, `--beam` at 25%) rotates once per second. The number in the centre (Big Shoulders 49px) counts 3 → 2 → 1 → 3… changing at each full sweep.
- Appears only after 200ms (avoid flashes on fast loads). Fades out over `--t-quick`.
- `role="status"`, `aria-live="polite"`, sr text "Loading".
- Reduced motion: static circle with "Loading" in the centre.
- Fix: `class` → `className`; remove the stray `import { div } from "framer-motion/client"`.
- In grids (Movies, TV, Results, list pages), don't use the full-screen loader. Use **skeleton frames** instead: poster-shaped `--leader` blocks with a slow light sweep (a 30° `--screen` 6% band crossing left→right every 1.6s). Same grid as real content, so nothing jumps when data arrives.

### 4.4 Toasts (`static/toast.js` + `ToastContainer`)

Now: default react-toastify (white boxes, coloured progress bars, bounce).

Redesign:
- Position bottom-centre on mobile, bottom-right on desktop. `theme` follows the app theme. `transition={Slide}`, `hideProgressBar`, `closeButton` replaced by a 32px × icon button.
- Look: `--leader` background, 14px radius, 1px `--reel` border, a 3px left bar coloured by type (`--house` success, `--velvet` error, `--beam` warning/info). Atkinson 16px `--screen`.
- Motion: enter `y: 16 → 0`, opacity, `--t-move`. Exit: opacity + `scale .96`, `--t-quick`.
- Auto-close 3.5s; pause on hover and focus.
- Copy rules (same verb as the button that triggered it):
  - "User logged in successfully" → "Logged in"
  - "User registered successfully" → "Account created. Log in to continue."
  - "User logged out successfully" → "Logged out"
  - "List added successfully!" → "List created"
  - "List updated successfully" → "List saved"
  - "Item added to the list!" → "Added to {listName}"
  - "Please select a list before adding." → "Choose a list first"
  - "Please Login First " → "Log in to create lists"
  - "User login failed" → "Email or password is incorrect"
  - "Email already in use, please use another email" → "That email already has an account. Log in instead?" (with a "Log in" action button)

---

## 5. Screens

### 5.1 Home (`components/home.js` + `carousel.js`)

Now: a 256px autoplaying carousel of backdrops with dot indicators and double gradients, then four identical "UPPERCASE TITLE + wrapped grid of 8 cards" sections.

Redesign:
```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   [ full-bleed backdrop, 72vh, slow push-in ]                            │
│                                                                          │
│   Dune: Part Two                                                         │
│   2024   8.2   Science fiction, Adventure                                │
│   Paul Atreides unites with Chani and the Fremen…                        │
│   [ View film ]   [ + Add to list ]                    ▮▮▮▯▯  1 / 5      │
└──────────────────────────────────────────────────────────────────────────┘
  Popular movies                                                    See all
  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐ ›   (horizontal row, scroll-snap)
  └───┘└───┘└───┘└───┘└───┘└───┘└───┘
  New movies                                                        See all
  …
```

**Hero (replaces the carousel):**
- 5 popular movies, one at a time, full-bleed, 72vh (min 480px, max 760px). Scrim: `linear-gradient(to top, var(--booth) 0%, transparent 60%)` and a left-side scrim for text legibility. No double top/bottom black gradients.
- Content bottom-left in the page gutter: title (Big Shoulders 61–76px), meta line (year, rating, genres), overview clamped to 2 lines at 60ch, two buttons.
- Motion:
  - Backdrop does a slow Ken Burns push-in (`scale 1 → 1.06` over the 7s slide).
  - Slide change is a cross-dissolve (`--t-frame` × 2), with the text block exiting `y: 0 → -8` and the new one entering `y: 8 → 0`, staggered 60ms (title, meta, overview, buttons).
  - Autoplay 7s (3s is too fast to read anything). Pauses on hover, on focus-within, and when the tab is hidden.
- Progress indicator: 5 short bars bottom-right; the current bar fills with `--beam` linearly over the 7s. Click a bar to jump. Plus "1 / 5" in Big Shoulders tabular.
- Swipe on touch. Left/right arrow keys when focused. `aria-roledescription="carousel"`, each slide `aria-label="1 of 5"`.
- Drop the `react-responsive-carousel` dependency; it's ~10 lines of state with framer-motion.

**Rows:**
- Section titles in sentence case: "Popular movies", "New movies", "Popular series", "New series". Left-aligned to the page gutter (today they're `ml-20`, misaligned with the centered grid). A "See all" link right-aligned on the same baseline, going to `/movies` or `/tvShows`.
- Horizontal scroll rows with `scroll-snap-type: x mandatory`, 20 items instead of 8. Cards 160px wide mobile, 200px desktop. Row bleeds off the right edge so it's obviously scrollable.
- Desktop: chevron buttons appear at row ends on row hover (opacity `--t-quick`), scroll by one viewport width with `behavior: smooth`. Disabled chevron fades to 0 at the row's start/end.
- Edge fade: a 48px gradient mask on the right edge (and left once scrolled).
- Remove the four `console.log` calls. Fix missing `key` (it's on `SmallCard`, should be on the outer `Link`).

### 5.2 Film card (`components/smallCard.js`)

Now: grey box, `object-contain` poster (letterboxes), title truncated at 15 chars with "...", "Rating: 7.3", year in grey, scale 1.05 on hover, each card individually slide-animated. Returns `console.log(...)` when no data.

Redesign: **a frame, not a card.** No box. Just the poster, with text under it on the page background.
```
┌─────────┐
│         │
│ poster  │   2:3, 3px radius
│         │
│     8.2 │   rating badge, bottom-right on the poster
└─────────┘
Dune: Part Two          ← 2 lines max, CSS line-clamp
2024
```
- Poster `object-cover`, 2:3 aspect via `aspect-ratio`, 3px radius, 1px inner `--reel` border at 40% (so dark posters don't vanish into the background).
- Rating badge: Big Shoulders 16px 800 on `--booth`/85%, 3px radius, bottom-right inset 6px. 7.0+ gets `--beam` text; below gets `--screen`. Unrated shows nothing (not "0.0").
- Title: Atkinson 16px 700, `--screen`, 2-line clamp (no JS truncation). Year: 13px `--grain`. Unknown date shows nothing (today shows "NaN").
- Hover / focus:
  - Poster lifts `y: -4px` and gets the beam glow (§2.3), `--t-quick`, `--ease-out`.
  - No scale on the text.
  - The beam (§3.3) slides under it.
- Press: `scale .98` for `--t-blink`.
- The whole thing is one `<Link>` with `aria-label="{title}, {year}, rated {rating}"`.
- Quick-add: on hover (desktop) a 32px `+` button fades into the poster's top-right. Opens the list picker (§5.4) in a popover without leaving the page. On touch, long-press opens it.
- Return `null` instead of `console.log` when `data` is missing.

### 5.3 Movies & TV shows (`components/movies.js`, `tvShows.js`)

Now: "POPULAR MOVIES" header, wrapped grid, pagination of `[0] [←] [3] [→]` where "0" means page one and the current page is a button that does nothing.

Redesign:
- Page title "Movies" / "TV shows" (Big Shoulders 49px), with a 16px `--grain` line under: "Most popular on TMDB this week".
- Responsive CSS grid: `repeat(auto-fill, minmax(150px, 1fr))` mobile, `minmax(190px, 1fr)` desktop, 24px column gap / 32px row gap. Left-aligned to the gutter (today `flex-wrap justify-center` leaves ragged centered last rows).
- Loading: skeleton frames (§4.3) in the same grid, not a full-screen spinner jammed into the grid.
- Pagination:
  ```
  ‹ Previous    1  2  [3]  4  5  …  20    Next ›
  ```
  - "Previous"/"Next" text buttons with chevrons; disabled state at 40% opacity, `aria-disabled`.
  - Current page: `--beam` 2px underline + `--screen` text, `aria-current="page"`. The underline slides between numbers (`layoutId`).
  - Changing page: grid cross-fades (`--t-quick` out, `--t-move` in) and scrolls smoothly to the page title.
  - Page in the URL (`/movies?page=3`) instead of `localStorage`, so back/forward and sharing work. Delete the `localStorage` page code.
- Merge the two near-identical files into one `Browse` component taking `type` (they differ only in fetcher, title and storage key).

### 5.4 Film details (`components/movieDetails.js`)

Now: full-screen blurred-dark backdrop, a grey panel with poster, title, "Rating: x / 10", a data table with "Safe for Kids: YES" and "Watch Time: 2.43 Hours", then a blue `<select>` "Add To List" and a green "Add" button, then "SIMILAR MOVIES" with "See More". Blocks the whole page on loading the user's lists.

Redesign: **the lobby card.**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [ backdrop, full-bleed, 64vh, scrim to --booth at bottom ]               │
│                                                                          │
│  ┌──────┐                                                                │
│  │      │  Dune: Part Two                                                │
│  │poster│  2024   2h 46m   PG-13   Science fiction, Adventure            │
│  │      │                                                                │
│  │      │   8.2  ▮▮▮▮▮▮▮▮▯▯   from 5,812 ratings                          │
│  └──────┘  [ + Add to list ▾ ]   [ ▶ Trailer ]                           │
└──────────────────────────────────────────────────────────────────────────┘
   Paul Atreides unites with Chani and the Fremen while on a path of
   revenge against the conspirators who destroyed his family…  (≤68ch)

   Cast   ○ ○ ○ ○ ○ ○ ○ ○  →  (horizontal row, circular headshots)

   Details
   Status         Released            Original language   English
   Countries      United States       Runtime             2h 46m

   More like this
   ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐   (same row component as Home)
```
- Backdrop is a header, not the whole page background. Poster overlaps the backdrop bottom edge by 96px (desktop); stacks above the title on mobile.
- Title: Big Shoulders 61–76px. Meta line in 16px `--grain`.
- Rating: large Big Shoulders number + a 10-segment bar (segments fill `--beam` up to the score, partial last segment). `vote_count` as "from N ratings". Drop "/ 10".
- Runtime as "2h 46m", not "2.77 Hours". Episodes: "45 min episodes".
- "Safe for Kids: YES/NO" (derived from TMDB's `adult` flag, which only marks adult films and so is misleading) → removed. Show certification only if TMDB has it.
- "Popularity: 1834.233" → removed (meaningless to people).
- Language code `en` → "English" via `Intl.DisplayNames`. Country codes likewise.
- Details as a 2-column definition list (`<dl>`), labels `--grain` 13px, values 16px. No table.
- **Trailer**: `videos` is already fetched via `append_to_response` but not used. "Trailer" opens a 16:9 modal (YouTube embed, `nocookie` domain). Modal: backdrop `--booth`/90%, player scales `0.96 → 1` + fades, `--t-move`. `Esc` closes, focus trapped.
- **Cast**: `credits` is also fetched but unused. Row of 12 circular 72px headshots with name (16px) and character (13px `--grain`).
- **Add to list** (replaces native select + separate "Add" button):
  - One button. Opens a popover listing the user's lists as rows with a checkbox each; a check means the film is already in that list. Toggling adds/removes immediately, with a toast "Added to Weekend horror" / "Removed from Weekend horror".
  - Popover motion: from the button, `y: -4 → 0`, `scale .98 → 1`, opacity, `--t-move`. Origin at the button. Rows stagger 20ms.
  - Checkbox tick draws in as an SVG stroke (`pathLength 0 → 1`, `--t-quick`).
  - Last row: "+ New list" inline input; Enter creates the list and adds the film.
  - Logged out: button reads "Log in to save" and goes to `/login`.
  - Lists load in the background; the page doesn't wait for them (today the whole page shows the loader until lists arrive).
- "More like this": switch to TMDB's `/movie/{id}/recommendations` (or `/similar`) instead of "first genre's discover results", which today often includes the current film itself. Use the Home row component; drop "See More".
- On navigating to another film from "More like this": the poster from the clicked card morphs into the details poster (shared `layoutId` keyed by film id), `--t-frame`, `--ease-reel`. This replaces the frame advance for this one transition.
- Fix: remove `scrollIntoView` targeting the panel; scroll to top is handled globally.

### 5.5 Filter (`components/filter.js`) and Results (`components/results.js`)

Now: a grey form containing two separate search inputs (movies and series), then radio buttons for type, 5 radio years, a long checkbox column of ~19 genres, and a "Filter" button. Results is a separate page with no header, no way to adjust filters and "No results found".

Redesign: merge into one **Discover** page at `/discover` (keep `/filter` and `/results` redirecting).
```
  Discover

  ( Movies | TV shows )          ← segmented control

  Year    [ Any ] 2026 2025 2024 2023 2022  [ Earlier ▾ ]
  Genres  ( Action ) ( Comedy ) ( Drama ) ( Horror ) ( Sci-fi ) …  (wrapping chips)

  148 results                                     Sort: Popular ▾  Clear all
  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐
```
- Filters sit above the results on the same page. Changing any filter updates results live (debounced 250ms) and updates the URL query (`?type=tv&year=2024&genres=18,35`), so results are shareable and survive refresh (today a refresh on `/results` loses `location.state` and shows nothing).
- Type: segmented control, sliding `--leader` pill (`layoutId`), `role="radiogroup"`.
- Year: chips for the last 5 years plus "Any" and an "Earlier" select (1900–). Today only 5 years exist and there's no way to deselect.
- Genres: pill chips. Off: 1px `--reel` border, `--grain` text. On: `--beam` fill, `--booth` text. Toggle motion: background fills from the centre out (`clip-path: circle()` 0% → 100%, `--t-quick`) and a ✓ slides in from the left, pushing the label 6px.
- Result count in Big Shoulders, animating between values (count up/down over `--t-move`).
- "Clear all" appears (fade) only when a filter is active.
- Changing filters: existing results fade to 40% while loading, then cross-fade. No full-page loader.
- Empty state: "No films match these filters." + a "Remove {last added filter}" button and "Clear all".
- The two search inputs move out of this page into the global header search (§5.6).

### 5.6 Search (`SearchBars/searchDivMovie.js`, `searchDivTv.js`)

Now: two separate plain inputs that fire a request on every keystroke, each showing a 5-item dropdown; "No results found." appears; the dropdown never closes on outside click or Esc.

Redesign: **one search, in the header**, for movies and TV together (TMDB `/search/multi`).
- Collapsed: a 240px field with a ⌕ icon and "Search films and series" placeholder, plus a `/` key hint chip. Mobile: icon only, expands to full-width overlay.
- Shortcut: `/` or `Ctrl/⌘ K` focuses it from anywhere.
- Focus: field widens to 360px (`--t-move`, `--ease-out`), border turns `--beam`.
- Debounce 250ms; cancel stale requests (`AbortController`) so results don't arrive out of order.
- Results panel (popover under the field, 14px radius, `--leader`): up to 8 rows, grouped "Movies" / "TV shows" with small `--grain` group labels in sentence case. Each row: 46×69 poster thumb, title with the matched part in 700 weight, year and type in `--grain`.
  - Panel opens `y: -4 → 0` + fade, `--t-move`. Rows stagger 15ms.
  - Arrow keys move a highlight (a `--reel` background that slides between rows, `layoutId`); Enter opens; Esc clears then closes; outside click closes. ARIA combobox pattern (`role="combobox"`, `aria-activedescendant`, `role="listbox"`).
  - Loading: a 2px `--beam` bar sweeping along the bottom of the field.
  - Empty: "Nothing found for “{query}”. Try the original title." 
  - Footer row: "See all results for “{query}”" → `/discover?q=…`.
- Delete the two per-type components after merging.

### 5.7 My lists (`components/lists/myLists.js`, `listCard.js`)

Now: a grey panel titled "My Lists", a full-width "Add A List" button, a search input placeholdered "Search Movies..." (wrong: it searches lists), and stacked list cards with uppercase names and four colour-coded buttons (red Delete, yellow Edit, blue eye icon, green/grey Public toggle). Delete has no confirmation.

Redesign: **reels on a shelf.**
```
  My lists                                               [ + New list ]
  [⌕ Search your lists ]

  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────
  │ ▒▒▒ ▒▒▒ ▒▒▒ ▒▒▒       │ │ ▒▒▒ ▒▒▒ ▒▒▒           │ │
  │ (4 poster fan)        │ │                       │ │
  │                       │ │                       │ │
  │ Weekend horror        │ │ Studio Ghibli         │ │
  │ 12 films  · Public ●  │ │ 8 films   Private     │ │
  │ Slashers for Friday…  │ │ Every one, ranked     │ │
  └───────────────────────┘ └───────────────────────┘ └──────────────
```
- Grid of list tiles (`minmax(260px, 1fr)`), not a stacked column in a narrow grey box.
- Tile top: the first 4 posters from the list fanned/overlapped (each offset 24px, rotated −3° / −1° / 1° / 3°). Empty list: a dashed `--reel` frame with "Empty" in `--grain`.
  - Hover: the fan spreads (offset 24 → 36px, rotation ×1.5), `--t-move`, `--ease-out`.
- Name: Big Shoulders 25px, sentence case as the user typed it (stop forcing uppercase). Meta: count of films, then a public/private status. Description: 2-line clamp, `--grain`.
- The whole tile links to the list. Actions move into a `⋯` menu (top-right, visible on hover/focus, always visible on touch): "Edit details", "Make public" / "Make private", "Delete list".
- Public toggle in the menu is a real switch: 36×20 track, thumb slides with a slight overshoot spring (`stiffness 500, damping 30`), track colour `--reel` → `--house`. Toast "List is now public" / "List is now private". Today it fails silently.
- Delete: confirmation dialog "Delete “Weekend horror”? This removes the list and its 12 films. This can't be undone." Buttons "Cancel" / "Delete list" (`--velvet`). Tile collapses out (height + opacity, `--t-move`) and neighbours reflow with `layout` animation.
- Search placeholder → "Search your lists". It should only search the user's own lists (today `searchListByQuery` may return other users' lists).
- Empty state (no lists): "You haven't made a list yet. Lists keep films you want to remember, and you can share them." + "Create your first list".
- Logged out: "Log in to see your lists" + "Log in" button, instead of an empty page.

### 5.8 New list / Edit list (`lists/addList.js`, `updList.js`)

Now: two separate pages with a grey card, "List Name" / "Description" fields, and on edit a disabled "Likes" field.

Redesign: one **sheet** component used for both, opened over My lists (and from the add-to-list popover) instead of a separate route. Keep `/addList` and `/updList/:id` routes rendering the same sheet for deep links.
- Desktop: centred dialog 520px; mobile: bottom sheet with a drag handle, swipe down to dismiss.
- Motion: overlay fades to `--booth`/70%; sheet rises `y: 24 → 0` (dialog) or `y: 100% → 0` (bottom sheet), spring `stiffness 380, damping 34`.
- Title "New list" / "Edit list".
- Fields:
  - "Name" (required, 60 char max, live counter appears at 45+).
  - "Description" (optional now; today it's required on create but not on edit). Textarea auto-grows, 280 char max.
  - "Who can see it": Private / Public radio pair, default Private.
  - Remove the disabled "Likes" field.
- Floating-label inputs: label sits inside the field, slides up and shrinks to 13px on focus/fill (`--t-quick`). Field bottom border goes `--reel` → `--beam` on focus with a left-to-right draw (`scaleX 0 → 1`, origin left).
- Validation inline under the field in `--velvet` 13px, slides down `--t-quick`. Error copy: "Give the list a name".
- Buttons: "Cancel" (text) and "Create list" / "Save changes" (`--beam` fill, `--booth` text). Submitting: button text cross-fades to a small leader-sweep spinner; disabled while saving.
- Edit: unsaved changes + close → "Discard changes?" inline confirmation.

### 5.9 List page (`lists/listInside.js`) and Public list page (`Public/publicListInside.js`)

Now: centred uppercase name, description, an "Add Movie" button that links to the home page, a 3-column grid of cards with a tiny red trash icon below each. "Loading list..." text. "No works found...". Public version is the same minus actions, plus the author's name as an unstyled `<h1>`.

Redesign: one component with an `editable` flag.
```
  ← My lists

  Weekend horror                                       [ Share ] [ ⋯ ]
  By Yassine   12 films   Public
  Slashers and creature features for Friday nights.

  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐
```
- Header left-aligned: back link, name (Big Shoulders 61px), meta line (author, count, visibility), description at 68ch.
- Author shown as initials avatar + name, linking nowhere for now.
- Grid identical to Movies (§5.3), skeleton while loading.
- Owner view:
  - Remove: hover a poster → an × button (top-right, 28px, `--booth`/85%). Click: poster shrinks + fades (`scale .9`, opacity 0, `--t-move`), grid reflows with `layout`. A toast "Removed from Weekend horror" with an "Undo" action (5s). Removal is optimistic; no refetch of the whole list.
  - "Add films" (replaces "Add Movie" → home): opens the header search with this list pre-selected as the add target.
  - Reorder: drag to reorder (stretch goal, behind the core redesign).
- Visitor view: "Share" button copies the URL; toast "Link copied". Header shows author.
- Empty (owner): "This list is empty. Search for a film and add it here." + "Add films". Empty (visitor): "Nothing in this list yet."
- Not found / private: "This list doesn't exist or isn't public." + "Browse public lists".
- Fix: owner page currently has no check that the viewer owns the list; route visitors to the read-only view.
- Fetch movies and series in parallel (today movies finish before series start).

### 5.10 Public lists (`Public/publiclists.js`, `publicListCard.js`)

Now: grey panel titled "Public Lists", line "Take a Look At other people's lists", search "Search Lists With key Words", cards with author name, uppercase list name, description and an eye icon button. Shows "Loading user..." per card.

Redesign:
- Title "Public lists", subtitle "Lists other people have shared".
- Same tile as My lists (§5.7) with the poster fan, plus the author's avatar + name in the meta line. No action menu. Whole tile is the link (no separate eye button).
- Search placeholder "Search by list name or description".
- Author name: fetch all needed user docs in one batch instead of one `getDoc` per card; while loading show a 60px `--leader` shimmer bar, not "Loading user...".
- Sort: "Newest" / "Most films".
- Empty search: "No public lists match “{query}”."

### 5.11 Log in / Create account (`auth/login.js`, `register.js`, `profile.js`)

Now: grey card on white/black, labels with colons, blue buttons. `/profile` shows Register to logged-out users.

Redesign: a split screen.
```
┌────────────────────────────────┬─────────────────────────────┐
│                                │                             │
│  [ slowly drifting poster wall │   Log in                    │
│    3 columns, each scrolling   │                             │
│    vertically at a different   │   Email                     │
│    speed, dimmed to 35%  ]     │   Password          Show    │
│                                │                             │
│                                │   [ Log in ]                │
│                                │   New here? Create an account│
└────────────────────────────────┴─────────────────────────────┘
```
- Left half (desktop only): three columns of popular posters scrolling vertically at 18s / 24s / 30s loops, opposite directions for the middle one, `--booth` overlay at 65%. Paused for reduced motion. Hidden under 900px.
- Right: form max 380px, left-aligned.
- Titles "Log in" / "Create account". Same floating-label fields as §5.8. Labels without colons.
- Password: "Show"/"Hide" text toggle inside the field. On create: a 4-step strength bar under the field filling in `--velvet` → `--beam` → `--house`, with a one-line hint ("Use at least 8 characters").
- "User Name" → "Display name", with helper text "Shown on your public lists".
- Errors inline under the relevant field (not just a toast): wrong password goes under Password, email-in-use goes under Email with a "Log in instead" link.
- Submit button loading state as in §5.8. On success: the button briefly turns `--house` with a drawn ✓ (`--t-move`) before navigating.
- Switching between Log in ↔ Create account: the form panel cross-fades and the fields that exist in both (email, password) stay put via `layoutId`; "Display name" slides in above them.
- Add "Forgot password?" link (Firebase `sendPasswordResetEmail`).
- `/profile` logged out → redirect to `/login`, not Register.
- After registering, sign the user in directly instead of sending them to log in again.

### 5.12 Profile (`auth/sett&logout.js`)

Now: a small grey card "Welcome to Filmory", username, "Email: …", red "Logout", and an "Admin Panel" button for `admin@admin.com` that routes to `/adminopt`, which doesn't exist.

Redesign:
- Header: 96px initials avatar (Big Shoulders, `--reel` background, a `--beam` ring), display name (Big Shoulders 49px), email in `--grain`.
- Stats row: "{n} lists", "{n} films saved", "{n} public". Numbers in Big Shoulders 39px, count up once on first view (`--t-frame`).
- Sections (left-aligned, separated by spacing, not cards):
  - "Your lists": the first 4 list tiles + "See all".
  - "Appearance": the theme segmented control (same as footer).
  - "Account": "Log out" (outlined `--velvet` button, not a red fill).
- Hide the "Admin panel" button until that route exists.
- Fix: "Guest" / "No email found" fallbacks flash while loading. Show a skeleton header instead.
- Log out: confirmation-free, but redirect to `/` (not `/register`), toast "Logged out". Also call Firebase `signOut(auth)` (today only `localStorage` is cleared; Firebase session stays alive). Remove the unrelated `localStorage.removeItem("cart")`.

### 5.13 About (`components/about.js`)

Now: centred column of emoji-laden headings ("🎥 Welcome to Filmory Official Site 🌟"), a "🏠 Home" button above the first paragraph, marketing paragraphs, author and email.

Redesign: a short page, left-aligned at 68ch, written plainly.
- Title "About Filmory".
- Three short sections, each a Big Shoulders 31px heading + one paragraph:
  - "Browse" — Find popular and new movies and series, search by title, or narrow by type, year and genre. Filmory doesn't stream; it helps you decide what to watch.
  - "Keep lists" — Make a list for anything: a festival plan, a genre deep-dive, films to watch with friends. Add and remove films from any film's page.
  - "Share" — Make a list public and anyone can see it under Public lists.
- "Made by Yassine Ben Zriouil" with links: portfolio (ybz.vercel.app) and email (`mailto:`).
- TMDB logo + attribution ("This product uses the TMDB API but is not endorsed or certified by TMDB").
- Remove the "Home" button (the header does that), all emojis, and "Official Site".

### 5.14 Not found (new)

There's no catch-all route today; unknown URLs render only header and footer.
- Add `<Route path="*">`.
- A film-leader frame that stops on a blank circle. Title "This page isn't on the reel". Button "Go to home". Plus the search field.

### 5.15 Empty `/lists` route (`components/lists.js`)

Renders an empty `<div>`. Remove the route and file, or redirect `/lists` → `/mylists`.

---

## 6. Interaction states checklist

Every interactive element gets all of these, designed, not left to defaults:

| State | Treatment |
|---|---|
| Rest | As specified per component |
| Hover (pointer only, `@media (hover: hover)`) | Colour shift `--t-quick`; cards lift; beam follows |
| Focus-visible | 2px `--beam` outline, 3px offset; beam jumps |
| Active / pressed | `scale .98`, `--t-blink` |
| Disabled | 40% opacity, `cursor: not-allowed`, `aria-disabled`, no hover change |
| Loading | Inline leader sweep; element keeps its width |
| Success | `--house` + drawn ✓, then return to rest |
| Error | `--velvet` border + inline message; a 3-step horizontal shake (±4px, 240ms total) on submit only |
| Selected | `--beam` fill or `--beam` underline, per component |

Touch targets min 44×44px. Primary buttons 44px tall, 20px horizontal padding, Atkinson 16px 700.

Buttons, three kinds only:
- **Primary**: `--beam` fill, `--booth` text. One per view.
- **Secondary**: transparent, 1px `--reel` border, `--screen` text; border → `--grain` on hover.
- **Text**: no border, `--grain` → `--screen` on hover.
- **Destructive**: Secondary with `--velvet` border and text; filled `--velvet` only inside the confirm dialog.

Remove every `→`/icon-only button that lacks an `aria-label` (eye buttons, trash icons, theme toggle, profile icon).

---

## 7. Copy pass

Global rules: sentence case everywhere, no emojis, no trailing ellipses on empty states, verbs on buttons, same verb from button to toast.

| Where | Now | New |
|---|---|---|
| Nav | HOME / MOVIES / TV SHOWS / PUBLIC LISTS / MY LISTS / ABOUT | Home / Movies / TV shows / Public lists / My lists |
| Home sections | POPULAR MOVIES / LATEST MOVIES … | Popular movies / New movies / Popular series / New series |
| Card | Rating: 7.3 | 7.3 (badge) |
| Pagination | 0 | (removed; numbered pages) |
| Details | Add To List / Add | Add to list |
| Details | See More | (removed) |
| Details | Overview not available at the moment. | No synopsis yet. |
| Filter | Filter (title and button) | Discover (title; no button, live) |
| Results | No results found | No films match these filters. |
| Search | Search Movies... / Search Series... | Search films and series |
| My lists | Add A List | New list |
| My lists search | Search Movies... | Search your lists |
| My lists empty | No lists found... | You haven't made a list yet. |
| List card | Delete / Edit / 👁 / Public | ⋯ menu: Edit details / Make public / Delete list |
| List page | Add Movie | Add films |
| List page empty | No works found... | This list is empty. Search for a film and add it here. |
| List page loading | Loading list... | (skeleton) |
| Public lists | Take a Look At other people's lists | Lists other people have shared |
| Public search | Search Lists With key Words | Search by list name or description |
| Public card | Loading user... | (shimmer) |
| Add list | Add List (title & button) | New list / Create list |
| Edit list | Edit List / Update List | Edit list / Save changes |
| Login | Email: / Password: / Log in / Sign Up | Email / Password / Log in / Create an account |
| Register | User Name / Register / Login | Display name / Create account / Log in |
| Profile | Welcome to Filmory / Email: … / Logout | (name as title) / email / Log out |
| Footer | © 2026All rights reserved.Filmory / Visit | © 2026 Filmory / ybz.vercel.app |

---

## 8. Responsive

| Width | Changes |
|---|---|
| < 480 | 16px gutter. Card rows 140px wide. Details: poster 160px centred above title; title 39px. Hero 64vh, overview hidden, one button. Bottom sheets instead of dialogs. |
| 480–767 | Card rows 160px. Grid 3 columns. |
| 768–1023 | Full nav appears; search collapses to icon. 32px gutter. Grid 4 columns. |
| 1024–1439 | Full search field. Grid 5–6 columns. Details two-column header. |
| ≥ 1440 | Content capped at 1320px; hero and backdrops stay full-bleed. |

No horizontal page scroll at any width (row scrollers are contained).

---

## 9. Accessibility floor

- Every page has one `<h1>`; sections use `<h2>` in order (today Home has four `<h1>`s and Details mixes `h1`/`h2`).
- Landmarks: `<header>`, `<nav aria-label="Main">`, `<main id="main">`, `<footer>`. "Skip to content" link, visible on focus, slides down from the top (`--t-quick`).
- All images have meaningful `alt` (film title) or `alt=""` when decorative (backdrops, poster-wall).
- Colour is never the only signal: public/private has text; rating colour also has the number.
- Dialogs/popovers: focus trap, `Esc`, return focus, `aria-modal`.
- Route changes announce the new page title through a visually hidden `aria-live` region.
- Respect `prefers-reduced-motion` (§2.4) and `prefers-contrast: more` (raise `--grain` to `--screen`, borders to 2px).

---

## 10. Implementation order

This is a sequence, so it's numbered.

1. Tokens: fonts, CSS variables, Tailwind config, delete global transition rule, focus/selection/scrollbar.
2. Shell: header, footer with theme control, toasts, loader + skeletons, 404, route transitions with `AnimatePresence`, scroll restoration.
3. Film card + row + grid components.
4. Home hero and rows.
5. Movies / TV merged browse page with URL pagination.
6. Details page: lobby card, cast, trailer, add-to-list popover.
7. Global search (replaces both search components).
8. Discover (replaces Filter + Results).
9. Lists: tiles, sheet for create/edit, list page, public lists.
10. Auth and profile.
11. About and copy pass.
12. Accessibility and reduced-motion audit; check every screen at 375, 768, 1280, 1920 in both themes.

### Dependencies
- Add: none required. Google Fonts via `<link>`. `framer-motion` (already installed) handles all motion.
- Remove: `react-responsive-carousel` after step 4.
- Font Awesome: replace with inline SVG icons for the ~15 icons used, so icon weight and stroke match Atkinson. (Optional; can stay through step 11.)

---

## 11. Plan review: what changed after the first draft

- **First draft palette was near-black with a single amber accent.** That's the "dark background, one bright accent" default. Revised to a blue-teal base (`--booth`, `--leader`, `--reel`) so the dark theme has its own colour, and gave amber one specific meaning: the projector light, used only on what the person is acting on.
- **First draft light theme was warm off-white.** That's the cream-paper default. Revised to cool silver (`#E6EAED`), the colour of a cinema screen with the house lights up.
- **First draft used a monospace face for ratings and years** (the "data label" tell). Replaced with Big Shoulders tabular figures, which keeps numbers in the marquee voice.
- **First draft added sprocket-hole borders to every card.** Too literal and decorative. Kept the film language only in the loader, the frame-advance transition and the beam.
- **First draft had staggered fade-up on every section.** Cut. One orchestrated motion (the frame advance on route change) plus motion that answers actions.
