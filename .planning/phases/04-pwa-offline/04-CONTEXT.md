# Phase 4: PWA & Offline - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add PWA infrastructure: @vite-pwa/sveltekit service worker with precaching, web app manifest with icons, offline validation, and update notification. Final phase — after this the app is shippable as a PWA.

</domain>

<decisions>
## Implementation Decisions

### Update Strategy
- **D-01:** Use `registerType: 'prompt'` in @vite-pwa/sveltekit config. This gives the app control over when updates activate.
- **D-02:** Auto-reload when idle (no inputs filled). If user is mid-calculation, show a non-intrusive update banner instead. Never silently reload during active use.
- **D-03:** The update banner should be minimal — "Update available" with a reload button. Not modal, not blocking.

### Icons & Branding
- **D-04:** Delegate PWA icon design (192px, 512px, 180px apple-touch) to the Impeccable skill. Use placeholders during implementation, replace with Impeccable-designed icons.
- **D-05:** Manifest name: "NICU Assistant". Short name: "NICU Assist" (for home screen).
- **D-06:** Theme color and background color follow the design system — use the surface token values. Dark theme meta should match dark mode surface.

### Claude's Discretion
- Exact Workbox caching strategies (precache vs runtime cache split)
- Service worker scope and navigation fallback
- Manifest display, orientation, start_url values
- Update banner component placement and styling
- How to detect "idle" vs "mid-calculation" for auto-reload logic
- Placeholder icon generation approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PWA Config References (from existing apps)
- `/mnt/data/src/pert-calculator/vite.config.ts` — @vite-pwa/sveltekit config with SvelteKitPWA, Workbox, manifest
- `/mnt/data/src/formula-calculator/vite.config.ts` — Similar PWA config pattern

### Current Build Config (to modify)
- `/mnt/data/src/nicu-assistant/vite.config.ts` — Currently has NO SvelteKitPWA (deliberately excluded until Phase 4)
- `/mnt/data/src/nicu-assistant/src/app.html` — Needs manifest link, may need apple-touch-icon links

### Design System
- `/mnt/data/src/nicu-assistant/src/app.css` — OKLCH surface tokens for manifest theme/background colors

### Research
- `/mnt/data/src/nicu-assistant/.planning/research/STACK.md` — PWA setup decisions
- `/mnt/data/src/nicu-assistant/.planning/research/PITFALLS.md` — Stale cache clinical safety concerns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Both reference apps have working @vite-pwa/sveltekit configs — copy and adapt
- PERT app uses `registerType: 'autoUpdate'` — we change to `'prompt'`
- Workbox glob patterns from existing apps: `**/*.{js,css,html,ico,png,svg,woff2}`

### Established Patterns
- vite.config.ts already has tailwindcss() + sveltekit() plugins — add SvelteKitPWA as third
- app.html already has viewport-fit=cover and Google Fonts — add manifest link
- src/routes/+layout.svelte already has onMount for theme.init() and disclaimer.init() — add SW registration here

### Integration Points
- `vite.config.ts` — add SvelteKitPWA plugin with manifest + workbox config
- `src/routes/+layout.svelte` — register SW, handle update prompt
- `src/app.html` — manifest link, apple-touch-icon
- `static/` — PWA icons (192px, 512px, 180px)

</code_context>

<specifics>
## Specific Ideas

- The update banner should be clinically appropriate — calm, not alarming. Something like "A newer version is available" with a subtle reload button.
- Impeccable skill designs the icons — consistent with project-wide decision to delegate visual design
- Offline must work for ALL calculations — both PERT and formula, all brands, all modes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-pwa-offline*
*Context gathered: 2026-04-01*
