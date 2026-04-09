# Requirements — v1.8 GIR Calculator

**Milestone goal:** Add a third clinical calculator (Glucose Infusion Rate) with interactive glucose-driven titration, verified against authoritative clinical sources.

**Source of truth:** `GIR-Wean-Calculator.xlsx` (CALC tab) + peer-reviewed neonatal references (MDCalc, Hawkes J Perinatol PMC7286731, Pediatric Oncall, Cornell PICU, Ashford St Peters).

---

## v1.8 Requirements

### GIR Calculator — Core Calculation (CORE)

- [ ] **CORE-01**: User can enter Weight (kg), Dextrose %, and Fluid order (ml/kg/day) as the three calculator inputs
- [x] **CORE-02**: User sees **Current GIR (mg/kg/min)** computed as `(Dex% × Initial rate ml/hr × 10) / (Weight × 60)` using exact constants (not spreadsheet's truncated `0.167`)
- [x] **CORE-03**: User sees **Initial rate (ml/hr)** computed as `(Weight × ml/kg/day) / 24` as a secondary hero value
- [ ] **CORE-04**: User sees an empty-state hero message until all three inputs are valid (no `NaN`, no `∞`, no ghost zeros)
- [x] **CORE-05**: Result hero uses `aria-live="polite"` + `aria-atomic="true"` and triggers the shared `.animate-result-pulse` on change (v1.6 pattern)

### GIR Calculator — Glucose Titration (TITR)

- [x] **TITR-01**: User sees 6 glucose-range buckets (Severe neurologic signs, <40, 40–50, 50–60, 60–70, >70 mg/dL) each showing Target GIR, Target Fluids (ml/kg/day), Target rate (ml/hr), and Δ rate from the initial rate
- [x] **TITR-02**: User can select a glucose bucket by click/tap or keyboard (arrow keys, Home/End, Space/Enter) with roving tabindex and `role="radiogroup"` + `role="radio"` semantics
- [x] **TITR-03**: Selected bucket is highlighted using the new `--color-identity` token (not opacity alone) and updates a target-guidance hero below the grid
- [x] **TITR-04**: No bucket is selected by default; the target-guidance hero shows `"Select a glucose range to see target rate"` until the clinician picks one
- [x] **TITR-05**: Grid header copy frames the table as **"If current glucose is…"** (not "Recommended for…") and includes an "institutional titration helper — verify against your protocol" disclaimer
- [x] **TITR-06**: Δ rate sign carries a ▲/▼ glyph + explicit "(increase)"/"(decrease)" label (never color-alone, per WCAG 1.4.1)
- [x] **TITR-07**: If Target GIR computes to ≤ 0 (aggressive wean from high baseline), display shows `"0 mg/kg/min — consider stopping infusion"` (display-layer guidance only; raw value preserved for tests)
- [x] **TITR-08**: On viewports <480px, the 6-row grid renders as a vertical stack of 88px+ tappable cards (eyebrow + Target GIR hero + 3-column footer); ≥480px renders as a table with 48px+ row height; all 6 rows always visible (no collapse, no horizontal scroll)

### GIR Calculator — Clinical Safety Rails (SAFE)

- [ ] **SAFE-01**: `NumericInput` advisory ranges (min/max) for Weight, Dextrose %, ml/kg/day are sourced from `gir-config.json` `inputs` block (no magic numbers), with `showRangeHint=true` and `showRangeError=true` for all three fields (advisory-only, no clamp — v1.6 contract)
- [ ] **SAFE-02**: When Dextrose % > 12.5, user sees a prominent amber-toned advisory **"Dextrose >12.5% requires central venous access"** (visually stronger than the standard grey range hint)
- [ ] **SAFE-03**: When Current GIR > 12 mg/kg/min, user sees an advisory **"GIR >12 mg/kg/min — consider hyperinsulinism workup / central access"**
- [ ] **SAFE-04**: When Current GIR < 4 mg/kg/min, user sees an advisory **"Below basal glucose utilization (≈4–6 mg/kg/min)"**
- [x] **SAFE-05**: Input values are normalized on entry to tolerate EPIC paste: trim whitespace, convert locale comma to decimal point

### GIR Calculator — Population Reference (REF)

- [ ] **REF-01**: User sees a static inline reference card showing starting GIR ranges by population: IDM/LGA 3–5, IUGR 5–7, Preterm or NPO 4–6 mg/kg/min

### Architecture & Integration (ARCH)

- [x] **ARCH-01**: GIR calculator is added as the third entry in `src/lib/shell/registry.ts`, appended after Morphine and Formula (preserves existing tab order / muscle memory)
- [x] **ARCH-02**: New `.identity-gir` CSS block in `src/app.css` (light + dark) with literal OKLCH values (hue ~145 green or ~295 violet), pinned at `oklch(95% 0.04 H)` pattern to pre-empt the v1.5 Phase 20 axe-contrast issue; scoped to exactly the 4 identity surfaces (result hero, focus rings, eyebrows, active nav indicator) — no palette drift
- [x] **ARCH-03**: `identityClass` union in the registry extended to include `'identity-gir'`
- [x] **ARCH-04**: New `src/lib/gir/` module contains `types.ts`, `gir-config.json`, `gir-config.ts` (typed wrapper), `calculations.ts` (pure functions), `state.svelte.ts` (rune singleton with dedicated `nicu_gir_state` sessionStorage key), `GirCalculator.svelte`, `GlucoseTitrationGrid.svelte`
- [x] **ARCH-05**: New route `src/routes/gir/+page.svelte` composes `<GirCalculator />` with `identity-gir` wrapper and calls `girState.init()` on mount
- [ ] **ARCH-06**: Existing shared components (`NumericInput`, `ResultsDisplay`, `DisclaimerModal`, `AboutSheet`, `NavShell`, `.animate-result-pulse`) are reused with **zero modifications** — no new props added to any shared component for v1.8

### Testing & Quality (TEST)

- [x] **TEST-01**: Spreadsheet-parity unit tests (`calculations.test.ts`) cover all 6 titration buckets × all formula columns (Current GIR, Target GIR, Target Fluids, Target rate, Δ rate) using frozen JSON fixtures extracted from the CALC tab (no live xlsx reads at test time); assertion tolerance ~1% epsilon to accommodate spreadsheet constant truncation
- [ ] **TEST-02**: Component tests (`GirCalculator.test.ts`, `GlucoseTitrationGrid.test.ts`) cover empty-state, valid-input flow, bucket selection, keyboard navigation (↑/↓/Home/End/Space/Enter), and Δ-rate glyph rendering
- [x] **TEST-03**: Config shape tests (`gir-config.test.ts`) lock the JSON structure and range values
- [ ] **TEST-04**: Playwright E2E (`gir.spec.ts`) covers the happy-path flow (enter inputs → hero updates → select bucket → target hero updates)
- [ ] **TEST-05**: Playwright a11y sweeps (`gir-a11y.spec.ts`) assert axe-core clean in light + dark modes, with focus-ring visible variant, advisory-message variant, and selected-bucket variant; overall project a11y sweep count updated in the assertion (12/12 → expected new count)
- [ ] **TEST-06**: All three `NumericInput` fields have `inputmode="decimal"` (not `"numeric"`) — asserted in a Playwright test for iOS decimal-keyboard compatibility

### Documentation & Trust (DOC)

- [ ] **DOC-01**: `AboutSheet` updated with a GIR entry citing the source spreadsheet + at least one authoritative formula source (MDCalc or Hawkes J Perinatol)
- [ ] **DOC-02**: `package.json` version bumped to `1.8.0`; About dialog reflects the new version via existing Vite define
- [ ] **DOC-03**: `.planning/PROJECT.md` Validated requirements list updated with v1.8 entries at milestone completion

---

## Future Requirements (deferred from v1.8)

- Copy/export result as EPIC dot-phrase-friendly text (`.hypoglywean` integration)
- Total daily glucose load (g/kg/day) secondary display
- Total daily fluid (ml/day) secondary display
- Glucose unit toggle (mg/dL ↔ mmol/L) for international deployment
- Dextrose % as a discrete SelectPicker (D5/D7.5/D10/D12.5/D15) instead of free numeric entry
- Protocol-origin citation (external reference for the specific 6-bucket adjustment values)
- Weight-change impact preview on persisted inputs

## Out of Scope (explicit exclusions)

- **History of recent calculations** — clinical privacy / PHI risk, complicates offline PWA model
- **IV fluid mixing / compounding helper** — pharmacy domain, safety risk outside the "compute only" mandate
- **Auto-prescribing / auto-ordering to EHR** — the tool computes, it does not prescribe
- **Patient identifiers or account linking** — PWA is anonymous per v1.0 decision
- **Alarms / notifications / monitoring** — static calculation tool, not a monitor
- **TPN macronutrient calculator** (amino acids, lipids) — different calculator, scope creep
- **GIR-specific disclaimer** — single shared disclaimer holds (v1.0 decision); AboutSheet citation instead
- **Starting IV dextrose decision tree** (beyond the static population reference card) — out of the "compute" mandate

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 27 | Pending |
| CORE-02 | Phase 26 | Complete |
| CORE-03 | Phase 26 | Complete |
| CORE-04 | Phase 27 | Pending |
| CORE-05 | Phase 27 | Complete |
| TITR-01 | Phase 27 | Complete |
| TITR-02 | Phase 27 | Complete |
| TITR-03 | Phase 27 | Complete |
| TITR-04 | Phase 27 | Complete |
| TITR-05 | Phase 27 | Complete |
| TITR-06 | Phase 27 | Complete |
| TITR-07 | Phase 27 | Complete |
| TITR-08 | Phase 27 | Complete |
| SAFE-01 | Phase 27 | Pending |
| SAFE-02 | Phase 27 | Pending |
| SAFE-03 | Phase 27 | Pending |
| SAFE-04 | Phase 27 | Pending |
| SAFE-05 | Phase 26 | Complete |
| REF-01  | Phase 27 | Pending |
| ARCH-01 | Phase 27 | Complete |
| ARCH-02 | Phase 27 | Complete |
| ARCH-03 | Phase 27 | Complete |
| ARCH-04 | Phase 26 + 27 (module scaffolded in 26, UI files added in 27) | Complete |
| ARCH-05 | Phase 27 | Complete |
| ARCH-06 | Phase 27 | Pending |
| TEST-01 | Phase 26 | Complete |
| TEST-02 | Phase 28 | Pending |
| TEST-03 | Phase 26 | Complete |
| TEST-04 | Phase 28 | Pending |
| TEST-05 | Phase 28 | Pending |
| TEST-06 | Phase 28 | Pending |
| DOC-01  | Phase 28 | Pending |
| DOC-02  | Phase 28 | Pending |
| DOC-03  | Phase 28 | Pending |

**Coverage:** 34/34 requirements mapped ✓
