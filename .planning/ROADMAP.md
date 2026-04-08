# Roadmap: NICU Assistant

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-04-01)
- v1.1 Morphine Wean Calculator - Phases 5-6 (shipped 2026-04-02)
- v1.2 UI Polish - Phases 7-8 (shipped 2026-04-07)
- v1.3 Fortification Calculator Refactor - Phases 9-11 (shipped 2026-04-07) — see [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md)
- v1.4 UI Polish - Phases 12-17 (shipped 2026-04-07) — see [milestones/v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md)
- [v1.5 Tab Identity & Search](milestones/v1.5-ROADMAP.md) - Phases 18-20 (shipped 2026-04-07)

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

<details>
<summary>v1.3 Fortification Calculator Refactor (Phases 9-11) - SHIPPED 2026-04-07</summary>

See [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md) for full archive.

</details>

<details>
<summary>v1.4 UI Polish (Phases 12-17) - SHIPPED 2026-04-07</summary>

See [milestones/v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md) for full archive.

</details>

### v1.5 Tab Identity & Search (Phases 18-20)

- [x] **v1.5 shipped 2026-04-07** — see [milestones/v1.5-ROADMAP.md](milestones/v1.5-ROADMAP.md)

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

<details>
<summary>v1.5 — Phases 18-20 (shipped 2026-04-07)</summary>

See [milestones/v1.5-ROADMAP.md](milestones/v1.5-ROADMAP.md) for full phase details, accomplishments, and commits.

</details>

## Progress

**Execution Order:**
Phases execute in numeric order. v1.5 begins at Phase 18.

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
| 9-11. v1.3 Fortification Refactor | v1.3 | — | Complete | 2026-04-07 |
| 12-17. v1.4 UI Polish | v1.4 | — | Complete | 2026-04-07 |
| 18-20. v1.5 Tab Identity & Search | v1.5 | 5/5 | Complete | 2026-04-07 |
| 21. Shared SegmentedToggle | v1.6 | 0/? | Not started | - |
| 22. NumericInput Hardening | v1.6 | 0/? | Not started | - |
| 23. Result Feedback | v1.6 | 0/? | Not started | - |
| 24. A11y Verification | v1.6 | 0/? | Not started | - |

### v1.6 Toggle & Harden (Phases 21-24)

- [ ] **Phase 21: Shared SegmentedToggle (build + wire)** - Extract toggle from Morphine, wire Morphine + Formula consumers
- [ ] **Phase 22: NumericInput Hardening** - Optional min/max with visible hint and advisory blur message (no clamp)
- [ ] **Phase 23: Result Feedback** - aria-live result hero with reduced-motion-gated entrance
- [ ] **Phase 24: A11y Verification** - axe sweep covering toggle, range hint, and error message in both themes/tabs

## Phase Details (v1.6)

### Phase 21: Shared SegmentedToggle (build + wire)
**Goal**: Both calculators express 2-option choices through one shared, identity-aware, keyboard-accessible toggle component
**Depends on**: Phase 20 (v1.5 identity token)
**Requirements**: TOG-01, TOG-02, TOG-03, TOG-04, TOG-05, TOG-06, A11Y-03
**Success Criteria** (what must be TRUE):
  1. A `SegmentedToggle` component exists in `src/lib/shared/components/` with a SelectPicker-consistent API (label, options, bound value)
  2. The active segment renders with `var(--color-identity)`, automatically picking up Clinical Blue in Morphine and Teal in Formula
  3. Keyboard users can move between segments with `←`/`→` and jump with `Home`/`End`; ARIA semantics match Morphine's prior tablist
  4. Morphine Linear/Compounding switch and Formula Breast milk/Formula base switch both use `SegmentedToggle`; old inline tablist + Base SelectPicker code is gone
  5. All pre-existing morphine and fortification tests still pass with no behavior change; new component tests cover keyboard nav
**Plans**: TBD
**UI hint**: yes

### Phase 22: NumericInput Hardening
**Goal**: Out-of-range clinical values cannot slip through silently, but the user keeps full typing freedom
**Depends on**: Phase 21
**Requirements**: HARD-01, HARD-02, HARD-03, HARD-04, HARD-05, HARD-06
**Success Criteria** (what must be TRUE):
  1. `NumericInput` accepts optional `min` and `max` props and renders a visible range hint (e.g. `0.5-10 kg`) under the field when supplied
  2. On blur, a value outside `[min, max]` shows an inline "Outside expected range — verify" advisory in `var(--color-error)` with no auto-clamp
  3. Editing the value back within range clears the advisory immediately on next valid input
  4. Every Morphine and Formula `NumericInput` instance is wired with ranges sourced from `morphine-config.json` / `fortification-config.json` — no inline magic numbers
  5. Component tests cover hint rendering, blur-outside message, blur-back-inside clear, and the no-clamp guarantee
**Plans**: TBD
**UI hint**: yes

### Phase 23: Result Feedback (aria-live + entrance)
**Goal**: When a result appears or updates, screen reader users hear it and sighted users see a calm motion cue — without losing input flow
**Depends on**: Phase 22
**Requirements**: FEED-01, FEED-02, FEED-03
**Success Criteria** (what must be TRUE):
  1. The result hero in both Morphine and Fortification carries `aria-live="polite"` + `aria-atomic="true"` and announces value updates
  2. The hero scales 95% → 100% over ~200ms when transitioning from hidden to visible or when the value changes
  3. The entrance transition is gated by the existing `prefers-reduced-motion: reduce` constant pattern (matches v1.4 motion audit)
  4. No auto-scroll, no focus theft — the user stays in their current input field
**Plans**: TBD
**UI hint**: yes

### Phase 24: A11y Verification
**Goal**: Every new v1.6 surface passes WCAG 2.1 AA in both themes and both tab identities, verified by the axe-core sweep
**Depends on**: Phase 23
**Requirements**: A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. `SegmentedToggle` active and inactive segments meet WCAG 2.1 AA contrast in light + dark for both Clinical Blue (Morphine) and Teal (Formula) identity
  2. The NumericInput range hint and the inline error message both meet WCAG 2.1 AA contrast in light + dark
  3. The Playwright axe sweep is extended to cover the new states (toggle rendered, range hint visible, error message visible) with no `disableRules` escape hatches
  4. All axe sweeps green across both calculators in both themes
**Plans**: TBD
**UI hint**: yes
