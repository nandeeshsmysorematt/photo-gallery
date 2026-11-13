# Photo Gallery (React + Vite)

Single-page, one-column photo gallery with **infinite scroll** over the paginated
Picsum feed (`https://picsum.photos/v2/list?page=N`).

## Quick start

**Windows:** double-click `run.bat` (installs dependencies the first time, then starts the app).

**Any OS:**
```bash
npm install
npm run dev      # opens http://localhost:5173
```
Requires Node.js 18+ (https://nodejs.org).

Production build: `npm run build` (output in `dist/`).

## Features
- Renders each photo (`download_url`) with its `author` and a FontAwesome thumbs-up button
- Thumbs-up count starts at 0 and increases on every click
- Infinite scroll: reaching the bottom fetches the next page and appends it
- Stops automatically when a page returns no data ("You've reached the end.")
- Loading state, 8-second request timeout, and an error message with a Retry button
- Photos are de-duplicated by `id`; in-flight requests are aborted on cleanup

## Implementation notes
- Scroll detection uses `IntersectionObserver` on a sentinel element (no scroll listeners).
- `download_url` is used for every image. Since it points to the full-size original,
  the thumbnail requests a 2x-of-display-size version of the same Picsum image and
  falls back to the original `download_url` if that fails.
- Like counts live inside each memoized `Photo` component, so liking a photo never
  re-renders the rest of the list.
- **Offline fallback:** if the Picsum feed cannot be reached on the very first load
  (for example during a Picsum outage), the app switches to local sample photos and
  shows a notice. Once real photos have loaded, a later failure shows an error with
  Retry instead, so real and sample data are never mixed.
- To force sample data for testing, create `.env.local` containing `VITE_USE_MOCK=true`
  and restart the dev server. It is off by default.

## Project structure
```
src/
  App.jsx      data fetching, pagination, infinite scroll
  Photo.jsx    one photo row with like button and count
  mockApi.js   local sample data (fallback / testing only)
  App.css      styles
```

## CORS
Picsum allows cross-origin requests, so no proxy is needed. If your network blocks it,
add a dev proxy in `vite.config.js` (`server.proxy`).

## Stack
React 18, Vite 5, FontAwesome (`@fortawesome/react-fontawesome`).
