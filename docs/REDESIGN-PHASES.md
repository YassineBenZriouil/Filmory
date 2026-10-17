# Redesign phases

Five phases to take Filmory from its current look to the design in `REDESIGN.md`. Do them in order: each phase builds on the one before it. Section numbers (§) point into `REDESIGN.md`.

Every phase ends with the same check: run `npm start`, click through every route in both themes at 375px and 1280px wide, and confirm nothing from an earlier phase broke.

---

## Phase 1: Foundation

Set up the design system so every later change uses it. Very little looks different yet beyond colours and fonts.

**Do**
- Load Big Shoulders Display and Atkinson Hyperlegible from Google Fonts in `public/index.html` (§2.2).
- Define the colour variables for Booth (dark) and Matinee (light) in `src/style/global.css`, and map them in `tailwind.config.js` (§2.1).
- Add motion tokens and the `prefers-reduced-motion` fallbacks (§2.4).
- Delete the global `* { transition-all }` rule (§3.1).
- Add focus rings, `::selection`, caret colour, scrollbar styling, `color-scheme` and `theme-color` (§3.4).
- Change `useTheme` to support Light / System / Dark, with System as the default (§4.2).
- Replace the favicon and set a page title per route (§3.4).

**Done when**
- No `blue-500`, `gray-200`/`gray-900` or other old palette classes remain in `src/`.
- Switching theme doesn't smear colours.
- Tabbing through any page shows an amber focus ring on every control.

---

## Phase 2: Shell and shared pieces

Build the parts every page uses, so the screens in later phases are just assembly.

**Do**
- Header with sliding active-link rule, sticky blur, mobile sheet menu, profile initials (§4.1).
- Footer with TMDB attribution, fixed copyright and the three-way theme control (§4.2).
- Leader-countdown loader and poster skeletons; fix `class` → `className` (§4.3).
- Restyled toasts and the new toast copy (§4.4, §7).
- Route transitions with `AnimatePresence`, scroll to top on navigation, and remove `<Animations>` wrappers from cards and sections (§3.2).
- The beam that follows hover and focus (§3.3).
- Film card, horizontal row and responsive grid components (§5.2).
- Button styles: primary, secondary, text, destructive (§6).
- Not-found page and the `/lists` cleanup (§5.14, §5.15).

**Done when**
- Every route shows the new header and footer and animates in with the frame advance.
- Unknown URLs show the not-found page.
- Cards look the same wherever they appear.

---

## Phase 3: Browsing

Redesign every page where people find films.

**Do**
- Home: full-bleed hero replacing the carousel, then the four scrolling rows with "See all" (§5.1). Remove `react-responsive-carousel`.
- Movies and TV shows merged into one browse page, with numbered pagination stored in the URL (§5.3).
- Film details: lobby-card header, rating bar, cast row, trailer modal, details list, "More like this" row, poster morph from cards (§5.4). Leave the add-to-list button as a placeholder until Phase 4.
- One header search for films and series, with keyboard navigation (§5.6). Delete `searchDivMovie.js` and `searchDivTv.js`.
- Discover page replacing Filter and Results, with live filters in the URL (§5.5).

**Done when**
- Refreshing any browse, details or Discover page keeps its state.
- Search works with only the keyboard.
- No page shows "NaN", "0.0" or a broken poster image.

---

## Phase 4: Lists

Redesign everything to do with making, editing and sharing lists.

**Do**
- Add-to-list popover on the details page and the quick-add button on cards (§5.4, §5.2).
- My lists as a grid of poster-fan tiles with the `⋯` menu, public switch and delete confirmation (§5.7).
- One create/edit sheet replacing `addList.js` and `updList.js` (§5.8).
- One list page for owners and visitors: remove with undo, share link, empty and not-found states (§5.9).
- Public lists with tiles, batched author names and sort (§5.10).

**Done when**
- You can create a list, add a film from the details page, remove it with undo, make the list public and see it under Public lists, all without a full-page reload or a silent failure.
- Deleting a list always asks first.

---

## Phase 5: Accounts, content and polish

Finish the remaining screens, then audit the whole app.

**Do**
- Log in and Create account as a split screen with inline errors, password strength and "Forgot password?" (§5.11).
- Profile with stats, your lists, appearance and log out that calls Firebase `signOut` (§5.12).
- About page rewrite (§5.13).
- Apply the full copy table (§7).
- Accessibility pass: one `<h1>` per page, landmarks, skip link, alt text, dialog focus handling, route announcements (§9).
- Responsive pass at 375, 768, 1280 and 1920 in both themes (§8).
- Reduced-motion pass: turn the setting on and walk every screen (§2.4).
- Optional: replace Font Awesome with inline SVG icons (§10).

**Done when**
- Every row in the interaction states checklist (§6) holds for every control.
- No old copy from the "Now" column of §7 remains.
- The app has no horizontal scroll at any width and works with reduced motion on.
