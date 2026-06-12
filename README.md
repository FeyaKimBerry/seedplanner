# Horizon

A local-first personal finance and retirement projection app.
Multi-currency, multi-language (EN / TH / DE / FR), reactive bar-chart
projections, savings goals, debts, net worth, and JSON / PDF export.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL.

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Storage

Data is saved to the browser's `localStorage` via the `store` adapter in
`src/App.jsx`. To add cross-device sync, replace `store.load` / `store.save`
with Google Drive `appDataFolder` calls — the rest of the app is unchanged.

## Deploy

Push to GitHub, then connect the repo to Netlify or Vercel.
Build command `npm run build`, publish directory `dist`.
