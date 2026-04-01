# Roadmap: NICU Assistant

## Overview

Build a unified NICU clinical PWA by layering bottom-up: establish the design system foundation first, then assemble the shared component library, then wire up both calculators into the shell, and finally seal the app with PWA/offline infrastructure. Each phase is a hard prerequisite for the next — nothing can be styled before tokens exist, no calculator can be ported before shared components are settled, and the precache manifest cannot be finalized until all routes exist.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - SvelteKit scaffold, design system tokens, theme system, and responsive navigation shell
- [x] **Phase 2: Shared Components** - Unified SelectPicker, NumericInput, ResultsDisplay, DisclaimerModal, and AboutSheet (completed 2026-04-01)
- [ ] **Phase 3: Calculators** - PERT and formula calculators ported into the unified shell with cross-calculator state behavior
- [ ] **Phase 4: PWA & Offline** - Service worker, manifest, offline validation, update notifications, and install prompt

## Phase Details

### Phase 1: Foundation
**Goal**: Clinicians can open the app, see a responsive nav shell, toggle dark/light theme without a flash, and navigate between placeholder calculator routes
**Depends on**: Nothing (first phase)
**Requirements**: DS-01, DS-02, DS-03, DS-04, DS-05, NAV-01, NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. The app loads with the correct theme (dark or light) on first paint — no white flash in dark mode
  2. On a mobile viewport the bottom tab bar is visible with icon and text label per calculator; on desktop a top nav bar appears instead
  3. Active tab is visually distinct and screen-reader-announced when the user navigates between routes
  4. The dark/light theme toggle persists across page reloads
  5. The design token file defines Clinical Blue, BMF Amber, and slate neutrals; Plus Jakarta Sans is loaded; all interactive elements meet 48px touch target and WCAG 2.1 AA contrast in both themes
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — SvelteKit scaffold + dependency installation + build config
- [x] 01-02-PLAN.md — Unified design token system (app.html FOUC script + app.css OKLCH tokens)
- [x] 01-03-PLAN.md — Responsive nav shell (theme module, registry, NavShell, layout, placeholder routes)

**UI hint**: yes

### Phase 2: Shared Components
**Goal**: A complete, tested shared component library is available for both calculators to consume without duplication or component divergence
**Depends on**: Phase 1
**Requirements**: SC-01, SC-02, SC-03, SC-04, SC-05, SC-06
**Success Criteria** (what must be TRUE):
  1. The medical disclaimer modal appears on first load, cannot be dismissed without acknowledgment, and does not reappear on subsequent visits
  2. SelectPicker opens via keyboard and touch, supports grouped options, and navigates options with arrow keys; scroll does not leak to the page behind it
  3. NumericInput accepts decimal values, enforces min/max bounds, and surfaces an inline error rather than silently accepting invalid input
  4. ResultsDisplay announces updated values to screen readers via an aria-live region
  5. All shared components render correctly in both dark and light themes without hardcoded color values
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Install bits-ui + dev deps; foundation files (disclaimer singleton, types, context helpers, barrel index)
- [x] 02-02-PLAN.md — SelectPicker.svelte (bits-ui Select, grouped/flat options, keyboard nav, scroll lock)
- [x] 02-03-PLAN.md — DisclaimerModal.svelte (bits-ui Dialog, non-dismissable) + wire +layout.svelte
- [x] 02-04-PLAN.md — NumericInput.svelte + ResultsDisplay.svelte (ports from formula-calculator with token migration)
- [x] 02-05-PLAN.md — AboutSheet.svelte + integration tests + visual checkpoint

**UI hint**: yes

### Phase 3: Calculators
**Goal**: Both PERT and formula calculators are fully functional inside the unified app with feature parity to their standalone predecessors and isolated, preserved state across tab switches
**Depends on**: Phase 2
**Requirements**: PERT-01, PERT-02, PERT-03, PERT-04, PERT-05, FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, CC-01, CC-02, CC-03
**Success Criteria** (what must be TRUE):
  1. PERT meal mode and tube-feed mode each produce correct capsule counts for all FDA medication brands; switching between modes preserves both states
  2. Formula modified mode and BMF mode each produce correct water mL and powder gram outputs; dispensing measures appear when available
  3. Switching from PERT to formula (or back) via the nav bar does not clear or corrupt the calculator the user left
  4. Entering an invalid or empty value in any numeric field blocks calculation and shows an inline error — no silent zero-substitution
  5. Formula components render correctly in dark mode (BMF Amber and Clinical Blue tokens, no hardcoded OKLCH literals)
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Copy PERT + formula business logic into src/lib/pert/ and src/lib/formula/; create pertState and formulaState sessionStorage singletons
- [ ] 03-02-PLAN.md — Port PERT DosingCalculator.svelte (meal + tube-feed modes, shared components, state wiring); wire /pert route
- [ ] 03-03-PLAN.md — Port formula FormulaCalculator + ModifiedFormulaCalculator + BreastMilkFortifierCalculator (dark mode tokens, shared components, state wiring); wire /formula route
- [ ] 03-04-PLAN.md — Unit tests for PERT and formula calculation functions; visual checkpoint

**UI hint**: yes

### Phase 4: PWA & Offline
**Goal**: The app installs to the home screen, operates fully offline, and notifies clinicians when a new version with updated clinical data is available
**Depends on**: Phase 3
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04
**Success Criteria** (what must be TRUE):
  1. The app loads and all calculations work with DevTools network set to Offline after first visit
  2. The app is installable (Add to Home Screen / browser install prompt available) and launches in standalone mode without browser chrome
  3. When a new service worker is detected, a visible update banner appears; the app does not silently reload during an active calculation session
  4. The web app manifest includes correct icons (192px, 512px, 180px apple-touch), standalone display mode, and correct start URL
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-04-01 |
| 2. Shared Components | 5/5 | Complete   | 2026-04-01 |
| 3. Calculators | 0/4 | Not started | - |
| 4. PWA & Offline | 0/? | Not started | - |
