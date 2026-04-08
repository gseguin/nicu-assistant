# Roadmap: NICU Assistant

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-04-01)
- v1.1 Morphine Wean Calculator - Phases 5-6 (shipped 2026-04-02)
- v1.2 UI Polish - Phases 7-8 (shipped 2026-04-07)
- v1.3 Fortification Calculator Refactor - Phases 9-11 (shipped 2026-04-07) — see [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md)
- v1.4 UI Polish - Phases 12-17 (shipped 2026-04-07) — see [milestones/v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md)
- v1.5 Tab Identity & Search - Phases 18-20 (active)

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

- [ ] **Phase 18: Searchable SelectPicker** - Port `searchable` prop with filter, keyboard traversal, and Enter-to-select; wire Formula picker
- [ ] **Phase 19: Tab Identity Token** - Define `--color-identity` per-route token (Clinical Blue / new Teal ~195) and wire to 4 surfaces
- [ ] **Phase 20: Identity A11y Verification** - axe-core color-contrast sweep across both tabs and both themes; tune and lock in

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

### Phase 18: Searchable SelectPicker
**Goal**: Clinicians using the Formula picker can filter 30+ formulas by typing and reach the right option in under a second via keyboard or touch, while Morphine pickers remain unchanged
**Depends on**: Phase 17 (v1.4 complete)
**Requirements**: SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04, SEARCH-05, SEARCH-06, A11Y-03
**Success Criteria** (what must be TRUE):
  1. Typing in the Formula picker filters the list by case-insensitive substring match across both label and detail/manufacturer text, with a "No matches" empty state when the query filters everything out
  2. Keyboard traversal works bidirectionally — ArrowDown from the search input focuses the first filtered option, ArrowUp from the first option returns focus to the input, and Enter in the input selects the single remaining option when exactly one match remains
  3. Reopening the Formula picker resets the search query to empty and places initial focus on the search input
  4. Morphine-tab pickers and any other SelectPicker consumer that does not opt in render with no search affordance and behave identically to v1.4
  5. Component or E2E test asserts ArrowDown/ArrowUp traversal and Enter-to-select-single-match behavior, passing in CI
**Plans**: 2 plans

Plans:
- [ ] 18-01-PLAN.md — SelectPicker searchable prop, filter, keyboard, no-matches
- [x] 18-02-PLAN.md — Wire Formula picker + T-12..T-18 component tests
**UI hint**: yes

### Phase 19: Tab Identity Token
**Goal**: Each calculator tab carries a distinct but restrained visual identity via a single `--color-identity` token wired to exactly four surfaces, so clinicians instantly recognize which calculator they are in without the shell or body chrome changing color
**Depends on**: Phase 18
**Requirements**: IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-05, IDENT-06, IDENT-07
**Success Criteria** (what must be TRUE):
  1. A `--color-identity` CSS custom property is defined for both light and dark themes and is scoped per calculator route — Morphine resolves to Clinical Blue hue 220, Formula resolves to new Teal hue ~195 with new OKLCH values added for both themes
  2. The result hero card, focus-visible outlines inside the calculator body, section eyebrow labels, and the active calculator tab indicator in both the mobile bottom nav and desktop top nav all pick up `--color-identity` — and no other surfaces do
  3. Shell chrome (title bar, app name, theme toggle, info button, body text, input borders, neutral surfaces) remains on global/neutral tokens and shows no identity hue
  4. BMF Amber continues to be scoped exclusively to fortifier-mode semantic signaling on the Formula tab — it is not reused as Formula tab identity, and switching into fortifier mode still reads as a distinct in-tab state
  5. Navigating between Morphine and Formula visibly swaps the four identity surfaces while leaving everything else unchanged
**Plans**: TBD
**UI hint**: yes

### Phase 20: Identity A11y Verification
**Goal**: Every surface using `--color-identity` meets WCAG 2.1 AA contrast in both themes for both tabs, verified by the existing axe-core sweep with color-contrast enabled
**Depends on**: Phase 19
**Requirements**: A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. The Playwright axe-core sweep runs on both the Morphine and Formula routes in light and dark themes with the color-contrast rule enabled and reports zero violations on any surface using `--color-identity`
  2. The new Teal ~195 token measures at least 4.5:1 contrast for text/icon use and at least 3:1 for non-text UI (focus rings, active tab indicator) against its adjacent surface tokens in both themes, documented in the phase notes
  3. If any identity surface fails contrast, the OKLCH lightness/chroma values are tuned and re-verified until green — no `disableRules(['color-contrast'])` escape hatches are added
**Plans**: TBD
**UI hint**: yes

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
| 18. Searchable SelectPicker | v1.5 | 1/2 | In Progress|  |
| 19. Tab Identity Token | v1.5 | 0/0 | Not started | - |
| 20. Identity A11y Verification | v1.5 | 0/0 | Not started | - |
