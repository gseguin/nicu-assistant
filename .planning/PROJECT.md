# NICU Assistant

## What This Is

A PWA that unifies clinical calculators into a single tool for NICU staff. Currently includes an infant formula recipe calculator, a morphine weaning schedule calculator, and a glucose infusion rate (GIR) calculator with interactive glucose-driven titration. Built with a shared component library, responsive navigation, and a plugin-like architecture that makes adding new calculators straightforward.

## Current State

**Shipped:** v1.9 GIR Titration Hero Swap + Polish (2026-04-09) — three clinical calculators in production with Δ rate as the bedside hero on GIR titration buckets, impeccable polish pass across all three calculators in both themes, dependency + lint/TS sweep (svelte-check 0/0), 16/16 axe sweeps green, PWA at version 1.9.0.

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
- ✓ Third clinical calculator: Glucose Infusion Rate (GIR) with Weight/Dextrose%/Fluid-order inputs, Current GIR + Initial rate hero outputs (CORE-01..05) — v1.8
- ✓ Interactive 6-bucket glucose-driven titration grid with keyboard nav, roving tabindex, radiogroup semantics, identity highlighting, ▲/▼ Δ-rate glyphs, institutional-protocol disclaimer (TITR-01..08) — v1.8
- ✓ GIR safety advisories: Dex>12.5% central-access, GIR>12 hyperinsulinism, GIR<4 below-basal, config-driven NumericInput ranges, EPIC paste normalization (SAFE-01..05) — v1.8
- ✓ GIR population reference card: IDM/LGA, IUGR, Preterm/NPO starting ranges (REF-01) — v1.8
- ✓ GIR architecture: registry entry, `.identity-gir` OKLCH tokens, `src/lib/gir/` module, `/gir` route, zero shared-component modifications (ARCH-01..06) — v1.8
- ✓ Spreadsheet-parity unit tests for GIR (all 6 buckets × all formula columns) and config shape tests (TEST-01, TEST-03) — v1.8
- ✓ Component tests for GirCalculator + GlucoseTitrationGrid: empty-state, valid-flow, bucket selection, full keyboard matrix, advisory rendering (TEST-02) — v1.8
- ✓ Playwright E2E happy-path at mobile 375 + desktop 1280, with `inputmode="decimal"` regression (TEST-04, TEST-06) — v1.8
- ✓ Playwright a11y suite extended with 6 GIR axe sweeps (light/dark/focus/advisory/selected-bucket); 16/16 axe sweeps green (morphine 6 + fortification 4 + gir 6) with zero OKLCH tuning (TEST-05) — v1.8
- ✓ AboutSheet updated with GIR entry citing `GIR-Wean-Calculator.xlsx` + MDCalc/Hawkes *J Perinatol* 2020 (PMC7286731), institutional-protocol disclaimer (DOC-01) — v1.8
- ✓ `package.json` version bumped to 1.8.0 (DOC-02) — v1.8
- ✓ PROJECT.md Validated list updated with v1.8 entries at milestone completion (DOC-03) — v1.8
- ✓ GIR titration hero swap: Δ rate (ml/hr ▲/▼ with increase/decrease label) is the bedside hero on every bucket card; GIR mg/kg/min demoted to the secondary row; neutral STOP-card treatment for the Δ=0 "current state" bucket (GIR-SWAP-01..03) — v1.9
- ✓ v1.8 GIR a11y guarantees preserved through the swap: radiogroup semantics, roving tabindex, aria-live, prefers-reduced-motion, focus rings; component + E2E + 16/16 axe sweeps updated for the new layout and remain green (GIR-SWAP-04..07) — v1.9
- ✓ Impeccable critique pass across Morphine, Formula, and GIR in both themes at mobile 375 + desktop 1280 with all P1 and addressable P2/P3 findings fixed; dark identity-hero retuned to `oklch(22% 0.045 145)` to preserve 4.5:1 against new tertiary ml/hr text; SegmentedToggle inactive text lifted to primary token; bucket labels normalized to en-dash typography (POLISH-01..04) — v1.9
- ✓ Dependency sweep within current majors — Svelte 5.55.2, SvelteKit 2.57.0, Vite 8.0.8, Vitest 4.1.4, Playwright 1.59.1, @lucide/svelte 1.8.0, bits-ui 2.17.3 — full test suite re-verified after each group (DEBT-01) — v1.9
- ✓ Dead code removal: `ResultsDisplay.svelte` + `$lib/shared` barrel deleted (zero src/ importers confirmed) (DEBT-02) — v1.9
- ✓ svelte-check cleaned to 0 errors / 0 warnings across 4493 files; ESLint explicitly dropped in favor of svelte-check + Prettier (DEBT-03) — v1.9
- ✓ Prior-milestone deferred cleanups closed: Phase 29 deferred items (6) + 8 pre-existing e2e assertion drifts from v1.5–v1.8 (DEBT-04) — v1.9
- ✓ `package.json` version bumped to 1.9.0; AboutSheet reflects v1.9.0 via the `__APP_VERSION__` build-time constant sourced from `package.json` (REL-01, REL-02) — v1.9
- ✓ PROJECT.md Validated list updated with v1.9 entries at milestone completion (REL-03) — v1.9

### Active

## Current Milestone: v1.10 GIR Simplification + Dock + Tech Debt

**Goal:** Strip the GIR calculator to its essentials — the bucket grid is the sole focal point. Remove the summary hero card, per-card secondary metrics row, and bottom reference card. Preserve click/tap visual feedback on bucket cards (no downstream consumer). Port morphine-wean dock magnification to the now-thinner GIR bucket list. Resolve v1.9's deferred severe-neuro clinical bolus correctness fix. Close v1.9's two deferred dep majors (`@types/node` 22→25, `typescript` 5→6).

**Target features:**
- **GIR Simplification (Phase 32)** — drop Target GIR summary hero card, drop per-card Fluids|Rate|GIR secondary row, drop "Starting GIR by population" reference card; keep click/tap visual treatment + radiogroup a11y; drop `aria-live` (redundant); fix severe-neuro STOP gating unconditionally
- **GIR Dock Magnification (Phase 33)** — port morphine-wean scroll-driven dock magnification to `GlucoseTitrationGrid` with mobile-only + reduced-motion guards; 16/16 axe re-verify
- **Tech Debt Majors + Release (Phase 34)** — upgrade `@types/node` 22→25, `typescript` 5→6; bump `package.json` to 1.10.0; update PROJECT.md Validated list with retired-entry strikethroughs

**Key context:** Follow-up clinician feedback after v1.9 shipped. The Δ rate hero swap was the right move, but the summary card + per-card secondary row + reference card are all noise around the actual bedside artifact (the bucket grid). Simpler = faster to read = safer at bedside.

_Active requirements defined in REQUIREMENTS.md._

### Out of Scope

- Native app builds (Capacitor/iOS/Android) — deferred, PWA-only
- User accounts or authentication — anonymous clinical tool
- Backend/API — all data embedded at build time, no server calls
- Analytics or telemetry — clinical privacy concerns

## Context

**Shipped v1.9** with three clinical calculators, GIR titration Δ rate hero swap (bedside action-first), impeccable polish pass in both themes, dependency + lint/TS sweep (svelte-check 0/0, ESLint dropped), comprehensive a11y coverage (16/16 axe sweeps), and co-located Vitest (205/205) + Playwright suites.
Tech stack: SvelteKit 2.57 + Svelte 5.55 (runes) + Tailwind CSS 4 + Vite 8.0 + pnpm 10.33.

**Current calculators:**
- Morphine Wean: linear/compounding modes, config-driven defaults, dock magnification, summary card
- Formula: modified/BMF modes, 40+ brands with manufacturer grouping, redesigned empty state
- GIR: Weight/Dextrose%/Fluid-order inputs, interactive 6-bucket glucose titration, dextrose-green identity, clinical safety advisories (dextrose >12.5%, GIR >12, GIR <4)

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
| Research before PR for new identity hues | Axe-core tuning costs more than upfront OKLCH audit (v1.5 Phase 20 Morphine pain) | ✓ Good — v1.8 GIR hue 145 passed on first sweep |
| Wave 0 latent-bug fixes before feature work | Type unions and route branches must extend cleanly before downstream phases can compile | ✓ Good — v1.8 caught `CalculatorId` + `NavShell.activeCalculatorId` gaps before DOC-01 |
| Spreadsheet-parity tests with ~1% epsilon | Clinical calculators must match source authority, with tolerance for truncated spreadsheet constants | ✓ Good — v1.8 GIR all 6 buckets pass |
| Drop ESLint from DEBT-03 in favor of `svelte-check` + Prettier only | eslint was never installed (Phase 29 noted `pnpm lint` fails with "eslint not installed"). `svelte-check` already covers TS + Svelte semantic errors, accessibility warnings, and untyped-prop lint. Prettier covers formatting. Adding ESLint + a plugin stack (typescript-eslint + svelte-eslint-parser + eslint-plugin-svelte) would introduce ~6 devDeps and a second overlapping rule source for zero additional signal on a 3-calculator PWA. The stale `"lint": "eslint ."` script will be removed. (2026-04-09 / Phase 30-02) | ✓ Good — zero-dep decision |

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
*Last updated: 2026-04-09 — v1.10 GIR Simplification + Dock + Tech Debt milestone started*
