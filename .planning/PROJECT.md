# NICU Assistant

## What This Is

A PWA that unifies clinical calculators into a single tool for NICU staff. Currently includes an infant formula recipe calculator and a morphine weaning schedule calculator. Built with a shared component library, responsive navigation, and a plugin-like architecture that makes adding new calculators straightforward.

## Core Value

Clinicians can switch between NICU calculation tools instantly from a single app without losing context, using the same trusted interfaces they already know.

## Requirements

### Validated

- ✓ Responsive navigation: bottom tab bar on mobile, top nav bar on desktop — v1.0
- ✓ Formula recipe calculator (modified + BMF modes) — v1.0
- ✓ Shared component library: SelectPicker, NumericInput, DisclaimerModal, AboutSheet, ResultsDisplay — v1.0
- ✓ Single shared medical disclaimer shown on first load — v1.0
- ✓ Dark/light theme toggle — v1.0
- ✓ PWA: offline-capable with service worker, installable, standalone display — v1.0
- ✓ Plugin-like calculator registration — v1.0
- ✓ Design system unification: shared color tokens, typography, spacing — v1.0
- ✓ Accessible: WCAG 2.1 AA, keyboard nav, screen reader support, 48px touch targets — v1.0
- ✓ Morphine wean calculator with linear and compounding modes — v1.1
- ✓ PERT calculator replaced by morphine wean calculator — v1.1
- ✓ Clinical data stored in JSON config for maintainability — v1.1
- ✓ Unit tests with spreadsheet parity validation — v1.1
- ✓ Automated a11y auditing via axe-core — v1.1
- ✓ Nav restructure: title bar with info/theme, full-width calculator tabs — v1.2
- ✓ Impeccable critique: all P1/P2/P3 findings fixed — v1.2
- ✓ Dock-style scroll magnification on step cards — v1.2
- ✓ Comprehensive E2E tests (Playwright) — v1.2
- ✓ App version from package.json in about dialog — v1.2
- ✓ Disclaimer flash fix for returning users — v1.2
- ✓ Unified fortification calculator matching the recipe-calculator.xlsx Calculator tab — v1.3
- ✓ 30 infant formulas embedded as clinician-editable JSON config (Abbott, Mead Johnson, Nestlé, Nutricia) — v1.3
- ✓ Spreadsheet-parity tests for fortification (documented Neocate case + per-unit + per-special-case coverage) — v1.3
- ✓ Packets unit hidden from picker for non-HMF formulas (auto-reset on formula switch) — v1.3
- ✓ WCAG 2.1 AA axe-core a11y audit for fortification (light + dark) — v1.3
- ✓ Legacy Modified Formula + BMF code removed — v1.3
- ✓ SelectPicker label association via aria-labelledby (improves a11y across all calculators) — v1.3
- ✓ Shared SelectPicker rewritten as native `<dialog>`-based modal picker (drop-in, no consumer edits) — v1.4
- ✓ Fortification mobile layout — Target Calorie + Unit on same row — v1.4
- ✓ Fortification "Amount to Add" hero restyled to match morphine wean result theming — v1.4
- ✓ Visual refinement sweep across both calculators (spacing, typography, eyebrow parity) — v1.4
- ✓ Shell polish — min-h-14 title bar, tracking-tight app name, visible focus outlines on desktop + mobile nav — v1.4
- ✓ `prefers-reduced-motion: reduce` honored across every motion surface — v1.4
- ✓ WCAG 2.1 AA dark-mode contrast fix — `--color-text-secondary` and `--color-accent` bumped; axe-core color-contrast rule now enabled in both themes — v1.4
- ✓ New `--color-scrim` OKLCH token + jsdom HTMLDialogElement polyfill with setup-time self-test — v1.4
- ✓ Searchable Formula picker — opt-in `searchable` prop on shared SelectPicker, ArrowDown/ArrowUp traversal, Enter-to-select-single-match, "No matches" state — v1.5
- ✓ Per-tab visual identity via new `--color-identity` token (Clinical Blue 220 / new Teal ~195) wired to exactly 4 surfaces: result hero, focus rings, eyebrows, active nav indicator — v1.5
- ✓ NavShell per-tab identity via `identityClass` field on registry — v1.5
- ✓ Morphine identity hero tuned to literal `oklch(95% 0.04 220)` to clear 4.5:1 (caught by Phase 20 axe sweep) — v1.5
- ✓ Playwright a11y suite extended with focus-ring + dark-visible variants; 8/8 axe sweeps green — v1.5
- ✓ `package.json` version bumped to 1.5.0 (about dialog reflects shipped state) — v1.5
- ✓ Shared `SegmentedToggle` component extracted from Morphine's tablist — identity-aware, keyboard nav (←/→/Home/End), `role="tablist"` ARIA — v1.6
- ✓ Morphine refactored + Formula `Base` SelectPicker replaced with the shared toggle — v1.6
- ✓ `NumericInput` hardened: visible range hint, blur-gated "Outside expected range — verify" advisory (no auto-clamp), `showRangeHint` opt-out prop — v1.6
- ✓ Clinical input ranges moved from magic numbers to `inputs` block in `morphine-config.json` / `fortification-config.json` with typed TS wrappers — v1.6
- ✓ Shared `.animate-result-pulse` class in `src/app.css` (200ms scale-from-95%, reduced-motion gated) applied to both calculator heroes — v1.6
- ✓ `aria-live="polite"` + `aria-atomic="true"` on both result heroes (Morphine summary + Formula "Amount to Add") — v1.6
- ✓ Playwright a11y suite extended with 4 advisory-message variants; 12/12 axe sweeps green with zero OKLCH tuning — v1.6
- ✓ `package.json` version bumped to 1.6.0 — v1.6
- ✓ Formula field labels cleaned — `"Starting Volume"` / `"Target Calorie"` drop unit parentheticals — v1.7
- ✓ Formula picker + Starting Volume share a single row at all breakpoints; Target Calorie + Unit get their own `grid-cols-2` row — v1.7
- ✓ Auto-select packets when picking a packets-capable formula; data-driven via new `packetsSupported?: boolean` field + `formulaSupportsPackets(id)` helper — v1.7
- ✓ `showRangeError` opt-out prop on NumericInput (complement to v1.6 `showRangeHint`); Formula Starting Volume opts out of both — v1.7
- ✓ `package.json` version bumped to 1.7.0 — v1.7

### Active

## Current Milestone: v1.8 GIR Calculator

**Goal:** Add a third clinical calculator — Glucose Infusion Rate (GIR) with interactive glucose-driven titration — verified against authoritative clinical sources.

**Target features:**
- Core GIR calc: Weight (kg), Dextrose %, ml/kg/day → Current GIR (mg/kg/min) + Initial rate (ml/hr) hero output
- Interactive glucose titration table (6 ranges: severe neuro, <40, 40–50, 50–60, 60–70, >70) with clinician-selected bucket highlighting Target GIR / Target Fluids / Target rate / Δ rate
- Spreadsheet-parity unit tests against `GIR-Wean-Calculator.xlsx` (CALC tab)
- New per-tab identity hue (third accent color extending v1.5 identity pattern)
- GIR formulas cross-verified against authoritative neonatal sources during research phase

### Out of Scope

- Native app builds (Capacitor/iOS/Android) — deferred, PWA-only
- User accounts or authentication — anonymous clinical tool
- Backend/API — all data embedded at build time, no server calls
- Analytics or telemetry — clinical privacy concerns

## Context

**Shipped v1.2** with 152 unit tests + 33 E2E tests. Design health score: 33/40.
Tech stack: SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4 + Vite 8 + pnpm.

**Current calculators:**
- Morphine Wean: linear/compounding modes, config-driven defaults, dock magnification, summary card
- Formula: modified/BMF modes, 40+ brands with manufacturer grouping, redesigned empty state

**Architecture:**
- Calculator registry in `src/lib/shell/registry.ts` — add new calculators with one entry + one route
- Shared components in `src/lib/shared/components/` — NumericInput, SelectPicker, ResultsDisplay, DisclaimerModal, AboutSheet
- State singletons per calculator: `$state` rune + sessionStorage backup
- PWA with Workbox precaching and non-blocking update banner
- App version injected from package.json via Vite define

**Users:** NICU clinicians (dietitians, nurses, GI physicians) at point of care. Primarily mobile, one-handed bedside use. Also desktop workstations.

## Constraints

- **Tech stack**: SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite 8 + pnpm
- **No native**: PWA only, no Capacitor
- **Offline-first**: All clinical data embedded at build time, service worker for caching
- **Accessibility**: WCAG 2.1 AA minimum, 48px touch targets, always-visible nav labels
- **Clinical data in JSON**: Store calculation parameters in .json files for easier maintainability

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Responsive nav (bottom mobile / top desktop) | Standard PWA pattern; thumb zone for bedside use | ✓ Good |
| Both dark and light theme | NICU environment needs both | ✓ Good |
| Single shared disclaimer | One acceptance covers all tools | ✓ Good |
| Plus Jakarta Sans typeface | Polished, already in formula-calculator | ✓ Good |
| Plugin-like calculator architecture | Easy to add/swap calculators | ✓ Good — proved by PERT→morphine swap |
| bits-ui for headless components | Accessible primitives for Svelte 5 | ✓ Good |
| JSON config for clinical data | Easier maintainability/updates | ✓ Good |
| Co-located test files | Svelte community standard | ✓ Good |
| Title bar for info/theme buttons | Frees bottom nav for full-width tabs | ✓ Good — v1.2 |
| Dock magnification on mobile | Scroll-driven card scaling, distinctive UX | ✓ Good — v1.2 |
| Version from package.json | Single source of truth via Vite define | ✓ Good — v1.2 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 — v1.8 GIR Calculator milestone started*
