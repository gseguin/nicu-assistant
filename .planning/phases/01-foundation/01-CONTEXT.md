# Phase 1: Foundation - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

SvelteKit scaffold, unified design system tokens (colors, typography, spacing), dark/light theme system with FOUC prevention, and responsive navigation shell (bottom tab bar on mobile, top nav on desktop) with placeholder calculator routes. No calculator business logic — just the shell and design system.

</domain>

<decisions>
## Implementation Decisions

### Color Unification
- **D-01:** Use OKLCH color system for all design tokens. Convert PERT's hex values (#2563eb, #0f172a, etc.) to OKLCH equivalents.
- **D-02:** Delegate dark mode palette creation to the Impeccable skill. It should design dark mode variants for Clinical Blue, BMF Amber, and all neutrals.
- **D-03:** Per-calculator accent colors: PERT routes use Clinical Blue, Formula routes use Clinical Blue + BMF Amber based on mode. The nav shell uses a neutral shared accent (not tied to either calculator).

### Theme Persistence
- **D-04:** Default theme follows system preference (`prefers-color-scheme`). User can override with a toggle.
- **D-05:** Theme toggle placement delegated to Impeccable skill during UI design.
- **D-06:** Inline `<script>` in `app.html` for FOUC prevention — reads localStorage before first paint.

### Nav Layout
- **D-07:** Tab icons delegated to Impeccable skill — it will select appropriate Lucide icons for PERT and Formula calculators.
- **D-08:** Placeholder routes (before calculators are ported in Phase 3) show skeleton cards mimicking the eventual calculator layout.
- **D-09:** Responsive nav: single component, bottom on mobile (<768px), top on desktop (>=768px), toggled via Tailwind responsive classes. Always-visible icon + text labels.

### Scaffold Approach
- **D-10:** Fresh SvelteKit scaffold via create-svelte. Do not clone either existing app. Add dependencies manually.
- **D-11:** Use Vite 8 (matches formula-calculator, latest features).
- **D-12:** pnpm as package manager (matches both existing apps, pnpm@10.33.0).

### Claude's Discretion
- localStorage key name for theme preference
- Exact breakpoint value for nav switch (768px default, can adjust)
- Placeholder skeleton card layout details
- Tailwind @custom-variant syntax for dark mode toggle mechanism
- Plus Jakarta Sans loading strategy (Google Fonts link vs self-hosted)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System References
- `/mnt/data/src/formula-calculator/src/app.css` — OKLCH color tokens (Clinical Blue + BMF Amber scales), custom type scale, Plus Jakarta Sans font stack, .card and .num component classes
- `/mnt/data/src/pert-calculator/src/app.css` — Hex-based design tokens with dark mode via @media prefers-color-scheme, .icon-btn pattern, Tailwind @theme bridge

### App Shell References
- `/mnt/data/src/pert-calculator/src/routes/+layout.svelte` — Root layout pattern (PWA init, modal shell, disclaimer, about sheet)
- `/mnt/data/src/formula-calculator/src/routes/+layout.svelte` — Root layout pattern (disclaimer modal, about sheet, PWA setup)
- `/mnt/data/src/pert-calculator/src/app.html` — HTML template with manifest link, viewport meta
- `/mnt/data/src/formula-calculator/src/app.html` — HTML template with Google Fonts preload, CSP headers

### Build Configuration References
- `/mnt/data/src/formula-calculator/svelte.config.js` — adapter-static with fallback: 'index.html'
- `/mnt/data/src/formula-calculator/vite.config.ts` — Vite 8 + @vite-pwa/sveltekit + @tailwindcss/vite config
- `/mnt/data/src/formula-calculator/tsconfig.json` — TypeScript strict mode config

### Research
- `/mnt/data/src/nicu-assistant/.planning/research/STACK.md` — Stack decisions, @lucide/svelte, dark mode @custom-variant
- `/mnt/data/src/nicu-assistant/.planning/research/ARCHITECTURE.md` — Directory structure, registry pattern, shell architecture
- `/mnt/data/src/nicu-assistant/.planning/research/PITFALLS.md` — FOUC prevention, Tailwind 4 dark mode gotchas

### Project Context
- `/mnt/data/src/nicu-assistant/.planning/PROJECT.md` — Core value, constraints, key decisions
- `/mnt/data/src/nicu-assistant/.planning/REQUIREMENTS.md` — DS-01..05, NAV-01..05 requirements for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Formula calculator's `app.css`: OKLCH Clinical Blue + BMF Amber scales can be directly adopted as the unified token foundation
- PERT calculator's `app.css`: Dark mode token pattern (CSS custom properties with light/dark variants) provides the structural pattern for theme switching
- Both apps' `svelte.config.js` + `vite.config.ts`: Build configuration patterns for adapter-static + PWA

### Established Patterns
- Both apps use Tailwind CSS 4 with `@theme` block for design token bridging
- Both apps use `@layer base` for root-level CSS variable definitions
- PERT uses `@media (prefers-color-scheme: dark)` for dark tokens — unified app will use `@custom-variant` for class-based toggle instead
- Formula uses `.card` component class and `.num` tabular numerics class — both should be in the unified design system

### Integration Points
- `src/routes/+layout.svelte` — Root layout will house the NavShell component, theme provider, and slot for calculator routes
- `src/app.html` — Inline theme script for FOUC prevention, Google Fonts link, PWA manifest
- `src/app.css` — Unified design tokens, @theme block, @custom-variant for dark mode
- `src/lib/registry.ts` — Calculator manifest (static array) read by NavShell for tab rendering

</code_context>

<specifics>
## Specific Ideas

- Impeccable skill should drive all visual design decisions: dark mode palette, icon selection, toggle placement, overall aesthetic
- Skeleton card placeholders should feel like the eventual calculator UI — not generic loading states
- The nav should feel like a natural part of a clinical tool — not a consumer app tab bar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-31*
