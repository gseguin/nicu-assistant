# Requirements: NICU Assistant — Milestone v1.13

**Defined:** 2026-04-23
**Core Value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.

## v1.13 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### UAC/UVC Calculator

- [ ] **UAC-01**: User can enter infant weight in kilograms as a decimal numeric textbox (input range 0.3–10 kg, `inputmode="decimal"`)
- [ ] **UAC-02**: User can adjust the same weight value with a slider control, range 0.3–10 kg, with bidirectional sync between textbox and slider
- [ ] **UAC-03**: System displays UAC depth in a hero result card computing `weight × 3 + 9` cm (parity with `uac-uvc-calculator.xlsx` cell B3)
- [ ] **UAC-04**: System displays UVC depth in a second hero result card computing `(weight × 3 + 9) / 2` cm (parity with `uac-uvc-calculator.xlsx` cell B7)
- [ ] **UAC-05**: The two hero cards are visually distinct from each other (not just labels differ) — distinct treatment (color accent, icon, or layout) so a clinician can't confuse UAC for UVC at a glance
- [ ] **UAC-06**: Result cards follow the established clinical hero pattern — tabular numerals, large bold value, `aria-live="polite"`, reduced-motion-gated pulse animation
- [ ] **UAC-07**: Out-of-range input (outside 0.3–10 kg) shows blur-gated "Outside expected range — verify" advisory without auto-clamping (consistent with v1.6 NumericInput behavior)
- [ ] **UAC-08**: Weight value persists across sessionStorage reloads (consistent with other calculators)
- [ ] **UAC-09**: AboutSheet has a UAC/UVC entry citing `uac-uvc-calculator.xlsx` as source and noting the formula is a common rule-of-thumb that must be confirmed by imaging per institutional protocol

### UAC/UVC Architecture & Identity

- [ ] **UAC-ARCH-01**: `CalculatorId` union extended with `'uac-uvc'`; registry entry added with icon, identity class, and route
- [ ] **UAC-ARCH-02**: New `.identity-uac` OKLCH token pair with hue researched before PR; passes 4.5:1 contrast on all identity surfaces in light + dark on first axe sweep (per v1.8 decision)
- [ ] **UAC-ARCH-03**: Calculation logic lives in `src/lib/uac-uvc/` with typed config wrapper and pure calculation function; no modifications to shared components
- [ ] **UAC-ARCH-04**: `/uac-uvc` route renders the calculator
- [ ] **UAC-ARCH-05**: NavShell `activeCalculatorId` ternary extended for `/uac-uvc` (prevents the v1.8 AboutSheet routing bug class)

### UAC/UVC Testing

- [ ] **UAC-TEST-01**: Spreadsheet-parity unit tests for UAC and UVC formulas across representative weights (including 0.3, 1.0, 2.5, 5.0, 10.0 kg) within 1% epsilon
- [ ] **UAC-TEST-02**: Component test for UacUvcCalculator covering empty state, valid input flow, textbox↔slider bidirectional sync, out-of-range advisory
- [ ] **UAC-TEST-03**: Playwright E2E happy path at mobile 375 and desktop 1280 with `inputmode="decimal"` regression
- [ ] **UAC-TEST-04**: Playwright axe sweeps for `/uac-uvc` in light and dark modes (extends the existing 20/20 suite)

### Hamburger Menu

- [ ] **NAV-HAM-01**: Hamburger menu button in the title bar (adjacent to existing info/theme buttons) with aria-label and 48px touch target
- [ ] **NAV-HAM-02**: Opens a full-screen or side-sheet menu listing every registered calculator from the registry (no hardcoded list)
- [ ] **NAV-HAM-03**: Each row shows the calculator's icon, name, and a star toggle; tapping the row (outside the star) navigates to that calculator and closes the menu
- [ ] **NAV-HAM-04**: Menu is keyboard-navigable (Tab/Shift+Tab, Enter to activate, Esc to close) with focus returned to the hamburger button on close
- [ ] **NAV-HAM-05**: Menu honors `prefers-reduced-motion` and uses the established scrim token for backdrop

### Favorites System

- [ ] **FAV-01**: Each calculator row in the hamburger menu has a toggleable star button; tapping it adds or removes that calculator from favorites
- [ ] **FAV-02**: Favorites are capped at 4; when the cap is reached, star buttons for non-favorites are `disabled` with accessible disabled reason (`aria-disabled="true"` + tooltip/helper text explaining the cap)
- [ ] **FAV-03**: Favorites are persisted to `localStorage` (not sessionStorage) so they survive across sessions
- [ ] **FAV-04**: First-run / no-stored-favorites default is exactly `['morphine', 'formula', 'gir', 'feeds']` (preserves the current v1.12 bottom bar)
- [ ] **FAV-05**: Removing a calculator from favorites via the hamburger updates the bottom bar / top nav immediately (reactive)
- [ ] **FAV-06**: Favorite order is stable (order in which they were favorited, or an explicit registry ordering — not random); removing and re-adding does not scramble position
- [ ] **FAV-07**: Schema-safe recovery from malformed / stale localStorage values (e.g., favorites referencing calculators that no longer exist): silently drop invalid IDs and fall back to defaults if the set becomes empty

### Favorites-Driven Navigation

- [ ] **NAV-FAV-01**: Mobile bottom bar renders only the favorited calculators (in favorite order), preserving the v1.4 shell styling (`min-h-14`, safe-area padding, focus outlines)
- [ ] **NAV-FAV-02**: Desktop top nav renders only the favorited calculators with the same visual identity pattern (active indicator, `identityClass`)
- [ ] **NAV-FAV-03**: If the user navigates to a non-favorited calculator via the hamburger, the bottom bar / top nav does **not** add a temporary tab — the hamburger remains the way to reach non-favorited calculators
- [ ] **NAV-FAV-04**: A11y: bottom bar and top nav `aria-current="page"` logic unchanged; hamburger button does not gain `aria-current` for non-favorited active routes (that's indicated by title / header)

### Favorites Testing

- [ ] **FAV-TEST-01**: Unit tests for the favorites store: add, remove, cap enforcement, localStorage serialization round-trip, malformed-value recovery
- [ ] **FAV-TEST-02**: Component test for hamburger menu: opens, lists all calculators, star toggle behavior, disabled-at-cap state
- [ ] **FAV-TEST-03**: Playwright E2E for the full flow: open hamburger, un-favorite one tab, favorite UAC/UVC, confirm bottom bar updates; reload page and confirm favorites persisted
- [ ] **FAV-TEST-04**: Playwright axe sweep of the open hamburger menu in light + dark (adds to the a11y suite)

### Release

- [ ] **REL-01**: `package.json` bumped to `1.13.0`; AboutSheet reflects new version via existing `__APP_VERSION__` build-time constant
- [ ] **REL-02**: PROJECT.md Validated list updated with v1.13 entries at milestone completion
- [ ] **REL-03**: Final gates: svelte-check 0/0, vitest fully green, `pnpm build` ✓, Playwright E2E + axe sweeps green (extends 20/20 sweeps with UAC/UVC + hamburger variants)

## Future Requirements

Deferred to future releases. Tracked but not in this milestone.

### Favorites — Power-User

- **FAV-FUT-01**: Drag-to-reorder favorites in the hamburger menu
- **FAV-FUT-02**: Per-breakpoint cap (e.g. 5 on desktop, 4 on mobile) if the 4-cap feels limiting in practice
- **FAV-FUT-03**: Export / import favorites (for shared device profiles)

### Calculator Catalog

- **CAT-FUT-01**: Search box in the hamburger menu (becomes relevant beyond ~8 calculators)

## Out of Scope

Explicitly excluded for v1.13.

| Feature | Reason |
|---------|--------|
| Drag-reorder favorites | Complexity not justified until favorites churn becomes a real complaint; star toggle + registry order is enough for 5 calculators |
| Per-device / per-user favorite profiles | Requires accounts; NICU Assistant is anonymous by design (PROJECT.md Out of Scope) |
| Temporary "recent" tab for non-favorited active calculator | Ambiguous UX; breaks "bottom bar = favorites" mental model |
| UAC/UVC alternate formulas (Shukla, Dunn, etc.) | Single rule-of-thumb formula matches `uac-uvc-calculator.xlsx`; adding alternates is a v1.14+ discussion |
| Imaging confirmation workflow | Out of scope for a depth calculator; disclaimer must point clinicians to their institutional imaging protocol |
| Cap > 5 | Bottom bar physically cannot fit more than 5 tabs at 48px touch targets on mobile 375px with labels |

## Traceability

Filled during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UAC-01 | Phase 42 | ✓ Validated |
| UAC-02 | Phase 42 | ✓ Validated |
| UAC-03 | Phase 42 | ✓ Validated |
| UAC-04 | Phase 42 | ✓ Validated |
| UAC-05 | Phase 42 | ✓ Validated |
| UAC-06 | Phase 42 | ✓ Validated |
| UAC-07 | Phase 42 | ✓ Validated |
| UAC-08 | Phase 42 | ✓ Validated |
| UAC-09 | Phase 42 | ✓ Validated |
| UAC-ARCH-01 | Phase 42 | ✓ Validated |
| UAC-ARCH-02 | Phase 42 | ✓ Validated |
| UAC-ARCH-03 | Phase 42 | ✓ Validated |
| UAC-ARCH-04 | Phase 42 | ✓ Validated |
| UAC-ARCH-05 | Phase 42 | ✓ Validated |
| UAC-TEST-01 | Phase 42 | ✓ Validated |
| UAC-TEST-02 | Phase 42 | ✓ Validated |
| UAC-TEST-03 | Phase 42 | ✓ Validated |
| UAC-TEST-04 | Phase 42 | ✓ Validated |
| NAV-HAM-01 | Phase 40 | ✓ Validated |
| NAV-HAM-02 | Phase 40 | ✓ Validated |
| NAV-HAM-03 | Phase 40 | ✓ Validated |
| NAV-HAM-04 | Phase 40 | ✓ Validated |
| NAV-HAM-05 | Phase 40 | ✓ Validated |
| FAV-01 | Phase 40 | ✓ Validated |
| FAV-02 | Phase 40 | ✓ Validated |
| FAV-03 | Phase 40 | ✓ Validated |
| FAV-04 | Phase 40 | ✓ Validated |
| FAV-05 | Phase 40 | ✓ Validated |
| FAV-06 | Phase 40 | ✓ Validated |
| FAV-07 | Phase 40 | ✓ Validated |
| NAV-FAV-01 | Phase 41 | ✓ Validated |
| NAV-FAV-02 | Phase 41 | ✓ Validated |
| NAV-FAV-03 | Phase 41 | ✓ Validated |
| NAV-FAV-04 | Phase 41 | ✓ Validated |
| FAV-TEST-01 | Phase 40 | ✓ Validated |
| FAV-TEST-02 | Phase 40 | ✓ Validated |
| FAV-TEST-03 | Phase 41 | ✓ Validated |
| FAV-TEST-04 | Phase 41 | ✓ Validated |
| REL-01 | Phase 43 | Pending |
| REL-02 | Phase 43 | Pending |
| REL-03 | Phase 43 | Pending |

**Coverage:**
- v1.13 requirements: 41 total
- Mapped to phases: 41 (100%)
- Unmapped: 0 ✓

**Per-phase counts:**
- Phase 40 (Favorites Store + Hamburger Menu): 14 requirements (FAV-01..07, NAV-HAM-01..05, FAV-TEST-01, FAV-TEST-02)
- Phase 41 (Favorites-Driven Navigation): 6 requirements (NAV-FAV-01..04, FAV-TEST-03, FAV-TEST-04)
- Phase 42 (UAC/UVC Calculator): 18 requirements (UAC-01..09, UAC-ARCH-01..05, UAC-TEST-01..04)
- Phase 43 (Release v1.13.0): 3 requirements (REL-01..03)

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-24 — all v1.13 requirements validated at release (Phase 43)*
