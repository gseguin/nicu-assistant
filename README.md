# NICU Assistant

A Progressive Web App that unifies four clinical calculators for NICU staff into a single, offline-capable tool with a shared component library and responsive navigation.

**This is an educational / reference tool.** It is not a medical device and not a substitute for clinical judgement or institutional protocols. See the in-app disclaimer.

## Calculators

| Calculator | Source of truth | Key outputs |
|------------|-----------------|-------------|
| **Formula** | `recipe-calculator.xlsx` | Fortification recipe (amount to add) across 40+ infant formulas, modified + BMF modes |
| **Morphine Wean** | `morphine-wean-calculator.xlsx` Sheet1 | Fixed-reduction wean schedule (single linear formula) |
| **GIR** | `GIR-Wean-Calculator.xlsx` + Hawkes *J Perinatol* 2020 (PMC7286731) | Current GIR, initial rate, interactive 6-bucket glucose-driven titration grid with Δ rate heroes |
| **Feed Advance** | `nutrition-calculator.xlsx` Sheet1 + Sheet2 | Bedside advancement (trophic/advance/goal per-feed volumes + IV backfill) and full nutrition (dual TPN dextrose + SMOF + enteral, total kcal/kg/d) |

All clinical data is embedded at build time from JSON config files under `src/lib/*/` — no network calls, no backend.

## Tech Stack

- SvelteKit 2.57 + Svelte 5.55 (runes) + TypeScript 6
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Vite 8, Vitest 4 (unit + component), Playwright 1.59 (E2E + axe-core a11y sweeps)
- `@vite-pwa/sveltekit` with Workbox precaching, `adapter-static` (SPA + `200.html` fallback)
- `bits-ui` (headless primitives), `@lucide/svelte` (icons)
- pnpm 10.33 (see `packageManager` in `package.json`)

## Prerequisites

- Node.js 22+ (matches the Docker builder)
- pnpm 10.33+ (via `corepack enable`)

## Getting Started

```sh
pnpm install
pnpm dev              # Vite dev server on http://localhost:5173
pnpm dev -- --open    # and open the browser
```

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Production build (SPA, PWA-enabled) |
| `pnpm preview` | Preview the production build locally |
| `pnpm check` | `svelte-kit sync` + `svelte-check` (TypeScript + Svelte diagnostics) |
| `pnpm check:watch` | Same as above, watch mode |
| `pnpm test` | Vitest (watch) |
| `pnpm test:run` | Vitest (one-shot, for CI) |
| `pnpm format` | Prettier across the repo |
| `pnpm docker:build` | Build the production Docker image |
| `pnpm docker:deploy` | Build + `docker compose up -d` |

End-to-end tests live alongside the app; run them with:

```sh
pnpm exec playwright test
```

## Project Structure

```
src/
  lib/
    shell/        # App shell: registry, NavShell, title bar, theme, disclaimer
    shared/       # Cross-calculator components: NumericInput, SelectPicker,
                  # SegmentedToggle, AboutSheet, DisclaimerModal
    formula/      # Formula recipe calculator + formulas.json
    morphine/     # Morphine wean calculator + morphine-config.json
    gir/          # GIR calculator + titration grid + gir-config.json
    feeds/        # Feed advance calculator + feeds-config.json
  routes/         # /, /morphine, /gir, /feeds, /formula (one per calculator)
static/           # Icons, manifest assets
```

Adding a new calculator is a one-entry change to `src/lib/shell/registry.ts` plus a new route and `src/lib/<name>/` module — see the plugin-like architecture in the existing calculators as precedent.

## Accessibility & Design

- WCAG 2.1 AA contrast across light and dark themes — enforced in CI via `@axe-core/playwright` sweeps
- 48px minimum touch targets, `viewport-fit=cover`, safe-area padding for iOS home indicator
- Keyboard navigation and visible focus states on every interactive surface
- `prefers-reduced-motion` honored across dock magnification, result pulses, and transitions
- Per-tab identity hue (OKLCH) scoped to exactly four surfaces: result hero, focus rings, eyebrows, active nav indicator

## Deployment

The app is deployed as a static bundle served by nginx. The Docker build uses a two-stage `node:22-alpine` → `nginx:alpine` pipeline (see `Dockerfile`).

```sh
pnpm docker:build     # builds production image (runs build + test:run first)
pnpm docker:deploy    # builds + docker compose up -d
```

Because the output is `adapter-static` (SPA with `200.html` fallback), it can also be hosted on any static file server.

## License

No license file is currently published. Contact the maintainer before reuse.
