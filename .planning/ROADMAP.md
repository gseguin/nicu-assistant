# Roadmap: NICU Assistant

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-04-01)
- v1.1 Morphine Wean Calculator - Phases 5-6 (shipped 2026-04-02)
- v1.2 UI Polish - Phases 7-8 (shipped 2026-04-07)
- v1.3 Fortification Calculator Refactor - Phases 9-11 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-04-01</summary>

- [x] **Phase 1: Foundation** - SvelteKit scaffold, design system tokens, theme system, and responsive navigation shell
- [x] **Phase 2: Shared Components** - Unified SelectPicker, NumericInput, ResultsDisplay, DisclaimerModal, and AboutSheet
- [x] **Phase 3: Calculators** - PERT and formula calculators ported into the unified shell with cross-calculator state behavior
- [x] **Phase 4: PWA & Offline** - Service worker, manifest, offline validation, update notifications, and install prompt

</details>

<details>
<summary>v1.1 Morphine Wean Calculator (Phases 5-6) - SHIPPED 2026-04-02</summary>

- [x] **Phase 5: Morphine Wean Calculator** - Remove PERT calculator and build morphine wean calculator with linear and compounding modes
- [x] **Phase 6: Quality & Accessibility** - Unit tests for both calculation modes and accessibility validation

</details>

<details>
<summary>v1.2 UI Polish (Phases 7-8) - SHIPPED 2026-04-07</summary>

- [x] **Phase 7: Navigation Restructure** - Move info and theme buttons to title bar; calculator tabs fill full mobile width
- [x] **Phase 8: Impeccable Critique & Polish** - Visual assessment via Impeccable commands and implementation of all recommendations

</details>

### v1.3 Fortification Calculator Refactor (In Progress)

- [x] **Phase 9: Fortification Reference Data & Business Logic** - Embed formula reference table and implement pure `calculateFortification` function with all special cases and spreadsheet-parity tests
- [ ] **Phase 10: Fortification Calculator UI** - Build new Svelte component using shared primitives, wire to new business logic, replace `/formula` route content
- [ ] **Phase 11: Migration & Cleanup** - Remove all dead Modified Formula and BMF code, update registry/About, run axe-core a11y audit

## Phase Details

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-04-01</summary>

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
- [x] 03-02-PLAN.md — Port PERT DosingCalculator.svelte (meal + tube-feed modes, shared components, state wiring); wire /pert route
- [x] 03-03-PLAN.md — Port formula FormulaCalculator + ModifiedFormulaCalculator + BreastMilkFortifierCalculator (dark mode tokens, shared components, state wiring); wire /formula route
- [x] 03-04-PLAN.md — Unit tests for PERT and formula calculation functions; visual checkpoint

### Phase 4: PWA & Offline
**Goal**: The app installs to the home screen, operates fully offline, and notifies clinicians when a new version with updated clinical data is available
**Depends on**: Phase 3
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04
**Success Criteria** (what must be TRUE):
  1. The app loads and all calculations work with DevTools network set to Offline after first visit
  2. The app is installable (Add to Home Screen / browser install prompt available) and launches in standalone mode without browser chrome
  3. When a new service worker is detected, a visible update banner appears; the app does not silently reload during an active calculation session
  4. The web app manifest includes correct icons (192px, 512px, 180px apple-touch), standalone display mode, and correct start URL
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Install @vite-pwa/sveltekit; SvelteKitPWA plugin config (Workbox precaching, manifest, icons); pwa.svelte.ts singleton; placeholder icons
- [x] 04-02-PLAN.md — UpdateBanner.svelte + +layout.svelte wiring (SW registration, idle detection, auto-reload)

</details>

<details>
<summary>v1.1 Morphine Wean Calculator (Phases 5-6) - SHIPPED 2026-04-02</summary>

### Phase 5: Morphine Wean Calculator
**Goal**: Clinicians can access a morphine weaning calculator from the app nav, enter patient parameters, choose a weaning mode, and see a complete step-by-step dose reduction schedule
**Depends on**: Phase 4
**Requirements**: MORPH-01, MORPH-02, MORPH-03, MORPH-04, MORPH-05, INT-01, INT-02, INT-03
**Success Criteria** (what must be TRUE):
  1. PERT calculator is completely removed — no PERT route, no PERT nav entry, no PERT business logic remains in the codebase
  2. Morphine wean calculator appears in the nav bar and navigates to a functional calculator page
  3. User can enter dosing weight (kg), max morphine dose (mg/kg/dose), and % decrease per step using the existing NumericInput components
  4. User can switch between Linear and Compounding weaning modes; Linear subtracts a fixed mg amount each step, Compounding multiplies the previous dose by (1 - decreasePct) each step
  5. A step-by-step weaning schedule table displays step number, dose (mg), dose (mg/kg/dose), and reduction amount (mg) for all steps until the dose reaches zero or near-zero
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Remove PERT calculator; create morphine wean business logic, types, state, and update registry/about/types
- [x] 05-02-PLAN.md — Build MorphineWeanCalculator UI component with mode tabs, NumericInput fields, schedule display, and route page

### Phase 6: Quality & Accessibility
**Goal**: The morphine wean calculator is verified against known spreadsheet values and meets the app's established accessibility standards
**Depends on**: Phase 5
**Requirements**: QA-01, QA-02
**Success Criteria** (what must be TRUE):
  1. Unit tests pass for both linear and compounding calculation functions using known input/output pairs from the reference spreadsheet
  2. All morphine wean calculator inputs and the schedule table are keyboard-navigable, have appropriate ARIA labels, and meet WCAG 2.1 AA contrast in both themes
  3. Touch targets on the morphine wean calculator are at least 48px and the interface is usable one-handed on mobile
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Spreadsheet parity unit tests + MorphineWeanCalculator component tests
- [x] 06-02-PLAN.md — Playwright axe-core WCAG 2.1 AA accessibility audit (light + dark themes)

</details>

<details>
<summary>v1.2 UI Polish (Phases 7-8) - SHIPPED 2026-04-07</summary>

### Phase 7: Navigation Restructure
**Goal**: Calculator tab buttons occupy the full width of the bottom nav on mobile, because info and theme controls have moved to the top title bar
**Depends on**: Phase 6
**Requirements**: NAV-06, NAV-07, NAV-08, NAV-09
**Success Criteria** (what must be TRUE):
  1. On mobile, the bottom tab bar contains only calculator tabs (Morphine Wean, Formula) and they stretch to fill the full viewport width
  2. The top title bar displays the app name, an info (about) button, and a theme toggle button on both mobile and desktop viewports
  3. Info button in the title bar opens the AboutSheet and theme toggle switches between dark and light mode — same behavior as before, new location
  4. On desktop, the top nav bar contains the app name, calculator tabs, info button, and theme toggle — all accessible and functional
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md — Restructure NavShell: top title bar with app name + info + theme; tab-only bottom nav on mobile; desktop tabs in top bar

### Phase 8: Impeccable Critique & Polish
**Goal**: The app's visual hierarchy, layout, and UX quality meet professional standards validated by systematic critique and iterative polish
**Depends on**: Phase 7
**Requirements**: UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. An Impeccable /critique assessment has been run against the live dev server and all findings are documented
  2. All actionable recommendations from the critique are implemented in the codebase
  3. All suggested follow-up Impeccable commands (e.g., /polish, /typeset, /arrange) have been run and their recommendations implemented
  4. The app visually passes a final inspection — consistent spacing, clear visual hierarchy, and no layout issues across mobile and desktop
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 08-01-PLAN.md — Run Impeccable /critique, document findings, implement all P0/P1/P2 recommendations
- [x] 08-02-PLAN.md — Run follow-up Impeccable commands (/polish, /typeset, /arrange, etc.) and implement their recommendations

</details>

### v1.3 Fortification Calculator Refactor (In Progress)

### Phase 9: Fortification Reference Data & Business Logic
**Goal**: A pure, fully tested `calculateFortification` function and embedded formula reference table that match the spreadsheet's Calculator tab exactly, with no UI changes
**Depends on**: Phase 8
**Requirements**: REF-01, REF-02, CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08, VAL-01, VAL-02
**Success Criteria** (what must be TRUE):
  1. A JSON config file embeds ~30 formulas (rows A3:D35 of recipe-calculator.xlsx) with `displacement_factor`, `calorie_concentration`, and `grams_per_scoop`, editable without touching TypeScript
  2. `calculateFortification(inputs)` returns `{ amountToAdd, yieldMl, exactKcalPerOz, suggestedStartingVolumeMl }` for any combination of base, formula, volume, target kcal, and unit, with no UI dependencies
  3. The documented spreadsheet-parity test passes: Neocate Infant + Breast milk + 180 mL + 24 kcal/oz + Teaspoons returns 2 tsp / 183.5 mL / 23.51 kcal/oz / "180 (6.1 oz)"
  4. At least one unit test exists for each special case: HMF Packets at 22 kcal/oz, HMF Packets at 24 kcal/oz, Breast milk + Teaspoons + 22 kcal shortcut, Breast milk + Teaspoons + 24 kcal shortcut, Water base, and each unit type (Grams, Scoops, Teaspoons, Tablespoons, Packets)
  5. The full v1.2 unit test suite still passes after the refactor — no regressions in morphine, shared components, or PWA behavior
**Plans**: TBD

### Phase 10: Fortification Calculator UI
**Goal**: A clinician can open `/formula`, configure all five inputs using the existing shared components, and see all four outputs update live in both light and dark themes
**Depends on**: Phase 9
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. From the nav bar a user opens the Formula calculator and sees five inputs: Base (Breast milk / Water), Starting Volume (mL), Formula Selection (~30 brands grouped by manufacturer), Target Calorie (22/24/26/28/30 kcal/oz dropdown), and Unit Selection (Grams / Scoops / Teaspoons / Tablespoons / Packets)
  2. As the user changes any input, four outputs update live: Amount to Add in the selected unit (e.g. "2 Teaspoons"), Yield (mL), Exact kcal/oz, and Suggested Starting Volume formatted as "<mL> (<oz> oz)"
  3. When Packets is selected with a formula other than Similac HMF, an inline message appears explaining Packets is only available for Similac HMF — the calculator does not silently display 0
  4. All inputs reuse existing NumericInput and SelectPicker shared components — no new component primitives are introduced
  5. The new calculator renders correctly in both light and dark themes with no hardcoded color values; `/formula` route renders the new Fortification component
**Plans**: TBD
**UI hint**: yes

### Phase 11: Migration & Cleanup
**Goal**: All legacy Modified Formula and BMF code is removed, the registry and About sheet reflect the unified Fortification calculator, and an axe-core audit confirms WCAG 2.1 AA compliance in both themes
**Depends on**: Phase 10
**Requirements**: MIG-01, MIG-02, MIG-03, MIG-04
**Success Criteria** (what must be TRUE):
  1. A grep for "ModifiedFormula" or "BreastMilkFortifier" anywhere under `src/` returns no matches outside test fixtures — no dead components, no orphaned tests, no unreferenced imports
  2. `src/lib/shell/registry.ts` contains a single Fortification calculator entry and the AboutSheet content describes the unified calculator
  3. Navigating to `/formula` renders the new Fortification calculator (verified by an end-to-end smoke check)
  4. A Playwright axe-core accessibility audit reports zero WCAG 2.1 AA violations against the Fortification calculator in both light and dark themes, matching the v1.1 morphine audit pattern
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-04-01 |
| 2. Shared Components | v1.0 | 5/5 | Complete | 2026-04-01 |
| 3. Calculators | v1.0 | 4/4 | Complete | 2026-04-01 |
| 4. PWA & Offline | v1.0 | 2/2 | Complete | 2026-04-01 |
| 5. Morphine Wean Calculator | v1.1 | 2/2 | Complete | 2026-04-02 |
| 6. Quality & Accessibility | v1.1 | 2/2 | Complete | 2026-04-02 |
| 7. Navigation Restructure | v1.2 | 1/1 | Complete   | 2026-04-02 |
| 8. Impeccable Critique & Polish | v1.2 | 2/2 | Complete | 2026-04-07 |
| 9. Fortification Reference Data & Business Logic | v1.3 | 2/2 | Complete | 2026-04-07 |
| 10. Fortification Calculator UI | v1.3 | 0/0 | Not started | - |
| 11. Migration & Cleanup | v1.3 | 0/0 | Not started | - |
