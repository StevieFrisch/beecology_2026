# Beecology web app — redesign sandbox

A clean, front-end-only rebuild of https://beecology.wpi.edu/webapp for redesign work.
It is not the original source. The pages were rewritten by hand to match the live app's layout and flows.

```
npm install
npm run dev
```

## Where things live
- `src/index.css` holds the design tokens (colors, font). Start the redesign here.
- `src/components/Layout.jsx` is the top bar and the sidebar. On mobile the sidebar becomes a bottom tab bar.
- `src/pages/` contains Home, Beedex (bees and butterflies), species details, Logs, Collect, Tutorial, Login and Signup.
- `src/collect/` contains the collection flows. Native capture and upload are mocked:
  - `FrameCapture.jsx` is a fake video player. It accepts a real local file or falls back to a sample image.
  - Species matching, iNaturalist suggestions and the map are all stand-ins.
  - Logs are saved to `localStorage`. Nothing is sent to a server.
- `src/data/` holds the species data (11 bees, 120 butterflies) taken from the live app.

## Notes
- Images are hot-linked from the live site through `src/config.js`. To work offline, download them into `/public` and set `ASSET = ''`.
- The tutorial text is paraphrased placeholder copy.
- Auth, data sync, and the marketing and analysis pages (`/home`, `/learn`, `/analyze`, …) are not included.
