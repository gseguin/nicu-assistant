# Roadmap: NICU Assistant

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-04-01)
- v1.1 Morphine Wean Calculator - Phases 5-6 (shipped 2026-04-02)
- v1.2 UI Polish - Phases 7-8 (shipped 2026-04-07)
- v1.3 Fortification Calculator Refactor - Phases 9-11 (shipped 2026-04-07) — see [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md)
- v1.4 UI Polish - Phases 12-17 (shipped 2026-04-07) — see [milestones/v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md)
- [v1.5 Tab Identity & Search](milestones/v1.5-ROADMAP.md) - Phases 18-20 (shipped 2026-04-07)
- [v1.6 Toggle & Harden](milestones/v1.6-ROADMAP.md) - Phases 21-24 (shipped 2026-04-08)
- [v1.7 Formula Micro-Polish](milestones/v1.7-ROADMAP.md) - Phase 25 (shipped 2026-04-08)
- **v1.8 GIR Calculator — Phases 26-28 (active, started 2026-04-09)**

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-04-01</summary>

- [x] **Phase 1: Foundation**
- [x] **Phase 2: Shared Components**
- [x] **Phase 3: Calculators**
- [x] **Phase 4: PWA & Offline**

</details>

<details>
<summary>v1.1 Morphine Wean Calculator (Phases 5-6) - SHIPPED 2026-04-02</summary>

- [x] **Phase 5: Morphine Wean Calculator**
- [x] **Phase 6: Quality & Accessibility**

</details>

<details>
<summary>v1.2 UI Polish (Phases 7-8) - SHIPPED 2026-04-07</summary>

- [x] **Phase 7: Navigation Restructure**
- [x] **Phase 8: Impeccable Critique & Polish**

</details>

<details>
<summary>v1.3-v1.7 (Phases 9-25) - SHIPPED</summary>

See individual milestone archives under `milestones/`.

</details>

### v1.8 GIR Calculator (Phases 26-28)

- [ ] **Phase 26: GIR Foundation** — Types, config JSON, pure calculations, state singleton with spreadsheet-parity tests (headless, zero UI)
- [ ] **Phase 27: GIR UI, Identity & Registration** — GlucoseTitrationGrid radiogroup, GirCalculator composition, `/gir` route, registry entry, `.identity-gir` OKLCH block
- [ ] **Phase 28: GIR A11y, E2E & Ship** — Playwright E2E + axe sweeps (light/dark/focus/advisory/selected), OKLCH tuning, AboutSheet entry, 1.8.0 bump

## Phase Details

<details>
<summary>v1.0-v1.7 — Phases 1-25 (shipped)</summary>

See individual milestone archives for phase details.

</details>

### Phase 26: GIR Foundation
**Goal**: Spreadsheet parity is locked for the GIR calculation engine before any UI is built — types, config, pure functions, and state singleton are headless, tested, and ready for composition.
**Depends on**: Phase 25 (v1.7 shipped)
**Requirements**: CORE-02, CORE-03, SAFE-05, ARCH-04 (module scaffolding for `types.ts`, `gir-config.json`, `gir-config.ts`, `calculations.ts`, `state.svelte.ts`), TEST-01, TEST-03
**Success Criteria** (what must be TRUE):
  1. `calculateCurrentGir` and `calculateInitialRateMlHr` return values matching the `GIR-Wean-Calculator.xlsx` CALC tab within ~1% epsilon across all 6 glucose buckets × all formula columns, using exact `10/60` and `1/144` constants (not spreadsheet's truncated `0.167`/`0.0069`)
  2. `gir-config.json` defines defaults, `inputs` ranges (weightKg, dextrosePct, mlPerKgPerDay), and 6 `glucoseBuckets` with `targetGirDelta` values; a config shape test locks the structure
  3. `girState` singleton persists `weightKg`, `dextrosePct`, `mlPerKgPerDay`, and `selectedBucketId` to sessionStorage under key `nicu_gir_state` with `init/persist/reset` matching the Morphine pattern
  4. Input normalization (trim whitespace, locale comma → decimal point) is implemented and unit-tested for EPIC paste tolerance
  5. `pnpm test` is green; no Svelte component or route code exists yet (pure headless gate)
**Plans**: 2 plans
- [x] 26-01-PLAN.md — Types, config, parity fixtures, pure calculations (CORE-02, CORE-03, SAFE-05, ARCH-04, TEST-01, TEST-03)
- [x] 26-02-PLAN.md — Input normalization helper + girState rune singleton (ARCH-04, SAFE-05, TEST-01)

### Phase 27: GIR UI, Identity & Registration
**Goal**: A clinician can navigate to the GIR tab, enter weight / dextrose % / ml/kg/day, see the Current GIR + Initial rate hero update live, and select a glucose range from an accessible 6-row titration grid that drives a target-guidance hero — all wearing a distinct third identity hue.
**Depends on**: Phase 26
**Requirements**: CORE-01, CORE-04, CORE-05, TITR-01, TITR-02, TITR-03, TITR-04, TITR-05, TITR-06, TITR-07, TITR-08, SAFE-01, SAFE-02, SAFE-03, SAFE-04, REF-01, ARCH-01, ARCH-02, ARCH-03, ARCH-04 (UI surfaces `GirCalculator.svelte`, `GlucoseTitrationGrid.svelte`), ARCH-05, ARCH-06
**Success Criteria** (what must be TRUE):
  1. GIR appears as the third tab (appended after Morphine and Formula) in both mobile and desktop nav; route `/gir` composes `<GirCalculator />` inside an `identity-gir` wrapper and initializes `girState` on mount
  2. With valid inputs, the hero displays Current GIR in mg/kg/min and Initial rate in mL/hr, triggers `.animate-result-pulse` on change, and carries `aria-live="polite"` + `aria-atomic="true"`; with any invalid/empty input, the hero shows an empty-state message (no NaN/∞/ghost zeros)
  3. `GlucoseTitrationGrid` renders 6 rows with `role="radiogroup"` + per-row `role="radio"` semantics, roving tabindex, arrow/Home/End/Space/Enter keyboard nav, no default selection, "If current glucose is…" framing, an institutional-helper disclaimer, and ▲/▼ glyphs + explicit "(increase)"/"(decrease)" labels on Δ rate (never color alone); ≤0 Target GIR displays "0 mg/kg/min — consider stopping infusion"
  4. Selected bucket is highlighted via `--color-identity-hero` (not opacity) and drives a target-guidance hero below the grid; at <480px the grid stacks as 88px+ tappable cards, at ≥480px as a table with 48px+ rows — all 6 rows always visible, no horizontal scroll
  5. Dextrose % > 12.5 shows a prominent amber-toned "requires central venous access" advisory (visually stronger than the grey range hint); Current GIR > 12 and < 4 each surface their respective advisories; all three inputs source advisory min/max from `gir-config.json` with both `showRangeHint` and `showRangeError` enabled (advisory-only, no clamp); a static population reference card (IDM/LGA 3–5, IUGR 5–7, Preterm/NPO 4–6) is visible inline
  6. `.identity-gir` is added to `src/app.css` with literal `oklch(...)` values (hue ~145 dextrose green) for both light and dark, the `identityClass` union is extended to include `'identity-gir'`, and no shared component (`NumericInput`, `ResultsDisplay`, `NavShell`, `AboutSheet`, `DisclaimerModal`, `SegmentedToggle`) receives any new prop for v1.8
**Plans**: TBD
**UI hint**: yes

### Phase 28: GIR A11y, E2E & Ship
**Goal**: GIR ships clinical-grade — Playwright covers the happy-path flow and every axe variant passes in both themes, identity OKLCH is tuned if needed, AboutSheet cites authoritative sources, and the app version reflects the shipped milestone.
**Depends on**: Phase 27
**Requirements**: TEST-02, TEST-04, TEST-05, TEST-06, DOC-01, DOC-02, DOC-03
**Success Criteria** (what must be TRUE):
  1. Component tests for `GirCalculator` and `GlucoseTitrationGrid` cover empty-state, valid-input flow, bucket selection, full keyboard navigation (↑/↓/Home/End/Space/Enter), and Δ-rate glyph rendering
  2. `tests/e2e/gir.spec.ts` covers the happy-path flow (enter inputs → hero updates → select bucket → target hero updates) on both mobile and desktop viewports
  3. `tests/e2e/gir-a11y.spec.ts` runs axe-core in light and dark modes with focus-ring-visible, advisory-message, and selected-bucket variants; the overall project a11y sweep count is updated and all sweeps are green — with OKLCH values tuned literally in `src/app.css` if axe flags contrast (pre-empting the v1.5 Phase 20 Morphine repeat)
  4. All three `NumericInput` fields carry `inputmode="decimal"` (not `"numeric"`), asserted by a Playwright test for iOS decimal-keyboard compatibility
  5. `AboutSheet` gains a GIR entry citing `GIR-Wean-Calculator.xlsx` plus at least one authoritative source (MDCalc or Hawkes *J Perinatol* PMC7286731), explicitly noting the titration protocol is institutional; `package.json` is bumped to `1.8.0` and the About dialog reflects it; `.planning/PROJECT.md` Validated list is updated with v1.8 entries
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order. v1.8 begins at Phase 26.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-8 | v1.0-v1.2 | — | Complete | 2026-04-07 |
| 9-11 | v1.3 | — | Complete | 2026-04-07 |
| 12-17 | v1.4 | — | Complete | 2026-04-07 |
| 18-20 | v1.5 | 5/5 | Complete | 2026-04-07 |
| 21-24 | v1.6 | 5/5 | Complete | 2026-04-08 |
| 25 | v1.7 | 1/1 | Complete | 2026-04-08 |
| 26. GIR Foundation | v1.8 | 2/2 | Complete   | 2026-04-09 |
| 27. GIR UI, Identity & Registration | v1.8 | 0/? | Not started | - |
| 28. GIR A11y, E2E & Ship | v1.8 | 0/? | Not started | - |
