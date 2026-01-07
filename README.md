# Fullstack Site - TypeScript build

This project bundles UI scripts written in TypeScript into a single `scripts.js` file used by the static pages.

Quick start (requires Node.js >= 14):

1. Install dev dependencies:

```powershell
npm install
```

2. Build bundled script:

```powershell
npm run build
```

This will produce `scripts.js` (minified with sourcemap) in the project root — the HTML files reference `/scripts.js`.

To watch for changes during development:

```powershell
npm run build:watch
```

Notes:
- Uses `esbuild` for fast bundling.
- The TypeScript source is in `src/scripts.ts`.
- If you want a production-ready pipeline, consider adding linting and CI steps.
