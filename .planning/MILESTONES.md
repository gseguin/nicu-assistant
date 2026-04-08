# Milestones

## v1.5 Tab Identity & Search (Shipped: 2026-04-07)

**Phases completed:** 3 phases (18, 19, 20), 5 plans, 18 commits, +3030/-47 diff across 28 files

**Tag:** `v1.5.0`

**Key accomplishments:**

- Searchable Formula picker — case-insensitive label+manufacturer filter, ArrowDown/ArrowUp traversal between input and listbox, Enter-to-select-single-match, "No matches" state, query reset on reopen. Wired via opt-in `searchable` prop on the shared SelectPicker; Morphine pickers untouched (existing T-01..T-11 still pass).
- Per-tab visual identity via new `--color-identity` CSS token — Morphine reuses Clinical Blue 220, Formula gets a new Teal ~195 (light + dark, OKLCH). Wired to exactly 4 surfaces: result hero card, focus-visible outlines, section eyebrow labels, and the active calculator tab indicator in both mobile and desktop nav. Shell chrome and BMF tokens untouched.
- NavShell per-tab identity via new `identityClass` field on `CalculatorEntry` — applied directly to each tab `<a>` element, solving the "nav lives above the route" cascade trap.
- Real WCAG failure caught and fixed by Phase 20's axe sweep: Phase 19's Morphine schedule eyebrow on the new identity-hero card was 3.61:1 (re-used `--color-accent-light`). Tuned `.identity-morphine` light hero to literal `oklch(95% 0.04 220)`, restoring 4.5:1 without touching `--color-accent*`.
- Playwright a11y suite extended — focus-ring rendered + dark-mode results-visible variants now covered for both calculators. 8/8 axe sweeps green, no `disableRules` escape hatches.
- App version finally bumped from `1.2.0` (stuck since v1.2) to `1.5.0` so the about dialog reflects shipped state.

See [milestones/v1.5-ROADMAP.md](milestones/v1.5-ROADMAP.md) and [milestones/v1.5-REQUIREMENTS.md](milestones/v1.5-REQUIREMENTS.md) for full archive.

---

## v1.4 UI Polish (Shipped: 2026-04-07)

**Phases completed:** 6 phases (12, 13, 14, 15, 16, 17), 6 plans, 8 commits

**Key accomplishments:**

- Shared SelectPicker rewritten from bits-ui Select to a hand-rolled Svelte 5 component on native `HTMLDialogElement.showModal()` — drop-in compatible, 11 new colocated unit tests, jsdom polyfill with setup-time self-test, BLOCKER fix for dialog aria-labelledby collision with the trigger
- Fortification visual polish — mobile row pairing for Target Calorie + Unit, "Amount to Add" hero restyled with `bg-[var(--color-accent-light)]` + `text-5xl` tabular numeric matching morphine wean result theming, spacing/typography sweep with `text-2xs` eyebrow unification
- Morphine Wean polish — step card eyebrows and meta typography aligned to Phase 13 rhythm; dock-style scroll magnification untouched
- Shell & navigation polish — `min-h-14` title bar, `tracking-tight` app name, visible accent focus outlines on desktop tabs and mobile tab bar, active-state weight bump
- Animation & reduced-motion audit — full motion table documented; NumericInput `transition:slide` guarded via `matchMedia('(prefers-reduced-motion: reduce)')` at module load; no layout-shift animations anywhere
- Accessibility deep-dive — 5 dark-mode color-contrast violations traced to two under-bright OKLCH tokens and fixed (`--color-text-secondary` 70%→80%, `--color-accent` 72%→82%); `disableRules(['color-contrast'])` escape hatch removed from both a11y specs; Playwright axe suite 6/6 green with color-contrast enabled in both themes
- New `--color-scrim` OKLCH token added for `<dialog>::backdrop` styling; all shell and calculator surfaces use only `var(--color-*)` tokens

---

## v1.3 Fortification Calculator Refactor (Shipped: 2026-04-07)

**Phases completed:** 3 phases (9, 10, 11) + 1 inserted/reverted (10.1), 5 plans

**Key accomplishments:**

- Unified Fortification calculator matching the recipe-calculator.xlsx Calculator tab exactly, replacing legacy Modified Formula + BMF modes
- 30 infant formulas (Abbott, Mead Johnson, Nestlé, Nutricia) embedded as clinician-editable JSON config with displacement_factor, calorie_concentration, grams_per_scoop
- Spreadsheet-parity unit tests verifying the documented Neocate case to 13 decimals, plus per-unit and per-special-case coverage (BM+Tsp HMF shortcut, Packets HMF protocol)
- Packets unit hidden from picker for non-HMF formulas with auto-reset on formula switch
- WCAG 2.1 AA axe-core a11y audit for fortification calculator in light + dark modes
- Carryover wins: SelectPicker label association via aria-labelledby (a11y improvement across all calculators), legacy Modified Formula + BMF code fully removed
- Phase 10.1 (all-units display refactor) explored and reverted via clean git revert after customer feedback preferred the unit selector matching the spreadsheet

---

## v1.2 UI Polish (Shipped: 2026-04-03)

**Phases completed:** 4 phases, 14 plans, 27 tasks

**Key accomplishments:**

- SvelteKit 2.55 + Vite 8 + Tailwind CSS 4 scaffold with adapter-static SPA output and TypeScript strict mode
- OKLCH Clinical Blue + BMF Amber token scales with FOUC-safe dark mode via inline script and @custom-variant dark
- Responsive nav shell with theme singleton, calculator registry, and skeleton placeholder routes at /pert and /formula
- bits-ui installed, shared types/context/disclaimer singleton created as foundation for Plans 02-04 parallel component work
- Unified SelectPicker with bits-ui Select primitives supporting grouped and flat option rendering, scroll lock, and keyboard navigation
- 1. [Rule 3 - Blocking] Fixed Svelte 5 test environment resolution
- AboutSheet side sheet with per-calculator content, plus integration tests for disclaimer singleton and NumericInput validation
- PERT dosing logic (7 files) and formula recipe logic (3 files) ported with adapted imports, plus sessionStorage-backed state singletons for both calculators
- Reason:
- Three formula calculator components (mode switcher, modified mode, BMF mode) ported with dark mode tokens, Phase 2 shared components, 40+ brand picker with manufacturer grouping, and dispensing measures
- 17 unit tests covering all PERT and formula pure calculation functions with real clinical config data, zero mocks
- SvelteKitPWA with Workbox precaching (28 assets), web app manifest, placeholder icons, and pwa.svelte.ts reactive update singleton
- Non-blocking UpdateBanner.svelte with idle-detection auto-reload wired through +layout.svelte SW registration lifecycle

---

## v1.1 Morphine Wean Calculator (Shipped: 2026-04-02)

**Phases completed:** 6 phases, 18 plans, 35 tasks

**Key accomplishments:**

- SvelteKit 2.55 + Vite 8 + Tailwind CSS 4 scaffold with adapter-static SPA output and TypeScript strict mode
- OKLCH Clinical Blue + BMF Amber token scales with FOUC-safe dark mode via inline script and @custom-variant dark
- Responsive nav shell with theme singleton, calculator registry, and skeleton placeholder routes at /pert and /formula
- bits-ui installed, shared types/context/disclaimer singleton created as foundation for Plans 02-04 parallel component work
- Unified SelectPicker with bits-ui Select primitives supporting grouped and flat option rendering, scroll lock, and keyboard navigation
- 1. [Rule 3 - Blocking] Fixed Svelte 5 test environment resolution
- AboutSheet side sheet with per-calculator content, plus integration tests for disclaimer singleton and NumericInput validation
- PERT dosing logic (7 files) and formula recipe logic (3 files) ported with adapted imports, plus sessionStorage-backed state singletons for both calculators
- Reason:
- Three formula calculator components (mode switcher, modified mode, BMF mode) ported with dark mode tokens, Phase 2 shared components, 40+ brand picker with manufacturer grouping, and dispensing measures
- 17 unit tests covering all PERT and formula pure calculation functions with real clinical config data, zero mocks
- SvelteKitPWA with Workbox precaching (28 assets), web app manifest, placeholder icons, and pwa.svelte.ts reactive update singleton
- Non-blocking UpdateBanner.svelte with idle-detection auto-reload wired through +layout.svelte SW registration lifecycle
- Linear and compounding morphine wean calculations with TDD, config-driven defaults, and complete PERT removal from registry/nav/routes
- Morphine wean calculator with three NumericInput fields, Linear/Compounding mode tabs, and mobile-optimized 10-step stacked card schedule
- 38 total tests passing: 20 spreadsheet parity tests verifying row-by-row clinical accuracy plus 6 component tests for MorphineWeanCalculator UI behavior
- Playwright axe-core e2e tests validating WCAG 2.1 AA compliance for morphine wean calculator in light mode, dark mode, and with schedule visible

---
