# Requirements: NICU Assistant — Milestone v1.3

**Milestone:** v1.3 Fortification Calculator Refactor
**Started:** 2026-04-07

## Goal

Replace the existing Modified Formula + BMF calculator with a single unified fortification calculator that matches the "Calculator" tab of `recipe-calculator.xlsx` exactly. One `/formula` route, one calculator, five unit options, four outputs, displacement-corrected math, and special-case handling for Similac HMF protocols.

---

## v1.3 Requirements

### Reference Data (REF)

- [ ] **REF-01**: A reference table of ~30 infant/pediatric formulas is embedded in the app, each with `displacement_factor` (mL/g), `calorie_concentration` (kcal/g), and `grams_per_scoop`, sourced from the Calculator tab of `recipe-calculator.xlsx` (rows A3:D35)
- [ ] **REF-02**: The reference table is stored in a JSON config file (consistent with the v1.1 clinical-data-in-JSON decision) so a non-developer can update values without touching TypeScript code

### Business Logic (CALC)

- [ ] **CALC-01**: A pure `calculateFortification(inputs)` function returns `{ amountToAdd, yieldMl, exactKcalPerOz, suggestedStartingVolumeMl }` for any combination of inputs, with no UI dependencies
- [ ] **CALC-02**: The function implements the general formula `(volume × (targetKcal − baseKcal)) / (29.57 × calorieConcentration − displacementFactor × targetKcal)`, where `baseKcal` = 20 for Breast milk and 0 for Water
- [ ] **CALC-03**: The function correctly converts the gram result into the requested unit (Grams = 1, Scoops = grams per scoop, Teaspoons = 2.5 g, Tablespoons = 7.5 g, Packets = special-case)
- [ ] **CALC-04**: Special case — Packets unit returns 0 for any formula except Similac HMF; for Similac HMF returns `volume / 25` at 24 kcal/oz, `volume / 50` at 22 kcal/oz, and 0 otherwise
- [ ] **CALC-05**: Special case — Breast milk + Teaspoons + 22 kcal/oz returns `(volume / 90) × 0.5` and Breast milk + Teaspoons + 24 kcal/oz returns `(volume / 90) × 1` (HMF clinical protocol shortcut)
- [ ] **CALC-06**: Yield (mL) is calculated as `volume + (gramsAdded × displacementFactor)` so the user sees the true post-fortification volume
- [ ] **CALC-07**: Exact kcal/oz is calculated as `((baseKcal × volume/29.57) + (gramsAdded × calorieConcentration)) / (yield/29.57)` so the user sees the actual achieved concentration after rounding
- [ ] **CALC-08**: Suggested Starting Volume rounds the amount-to-add to whole units and back-calculates the starting volume that would produce that whole-unit amount, formatted as `"<mL> (<oz> oz)"`

### Validation (VAL)

- [ ] **VAL-01**: Spreadsheet-parity unit tests verify `calculateFortification` outputs against known reference values from the Calculator tab — at minimum the documented case (Neocate Infant + Breast milk + 180 mL + 24 kcal/oz + Teaspoons → 2 tsp / 183.5 mL / 23.51 kcal/oz / "180 (6.1 oz)") plus one test per special case (HMF Packets at 22 kcal, HMF Packets at 24 kcal, BM+Tsp+22 shortcut, BM+Tsp+24 shortcut, Water base, each unit type)
- [ ] **VAL-02**: All v1.2 unit tests still pass after the refactor (no regressions in morphine, shared components, or PWA behavior)

### User Interface (UI)

- [x] **UI-01**: A user can open the Formula calculator from the nav bar and see five inputs: Base (Breast milk / Water), Starting Volume (mL), Formula Selection (~30 brands grouped by manufacturer), Target Calorie (fixed dropdown of 22/24/26/28/30 kcal/oz), and Unit Selection (Grams / Scoops / Teaspoons / Tablespoons / Packets)
- [x] **UI-02**: A user sees four outputs update live as they change inputs: Amount to Add (in the selected unit, e.g. "2 Teaspoons"), Yield (mL), Exact kcal/oz, and Suggested Starting Volume
- [x] **UI-03**: When Packets is selected with a formula other than Similac HMF, the UI surfaces a clear inline message explaining that Packets is only available for Similac HMF (rather than silently showing 0)
- [x] **UI-04**: All inputs use existing shared components (NumericInput for volume, SelectPicker for formula/base/unit/kcal) — no new component primitives are introduced
- [x] **UI-05**: The calculator works correctly in both light and dark themes with no hardcoded color values

### Refactor — All-Units Display (REFACTOR) — added inline at Phase 10.1

- [ ] **REFACTOR-01**: The Unit SelectPicker is removed from the FortificationCalculator UI; the calculator has 4 inputs (Base, Starting Volume, Formula, Target Calorie); the unit auto-reset effect, the `prevFormulaId` tracking, the `isBlocked` derived, and Tests 4/5/6 are removed
- [ ] **REFACTOR-02**: The Amount to Add card displays the computed amount in all applicable units simultaneously (grams, teaspoons, tablespoons, scoops, and packets when formula = Similac HMF); the packets row is hidden entirely for non-HMF formulas (no inline message, no zero placeholder); display order is grams → teaspoons → tablespoons → scoops → packets; the BM+Tsp+22/24 HMF teaspoon shortcut is preserved and applied to the teaspoons row when conditions match
- [ ] **REFACTOR-03**: The verification card shows a single Yield (mL) and Exact kcal/oz computed using the grams branch; the Suggested Starting Volume output is dropped from the UI; the documented Neocate parity case (BM/180/Neocate Infant/24 → grams 4.51, teaspoons 2, tablespoons 0.6, scoops 0.98, no packets row, yield 183.5 mL, exact 23.5 kcal/oz) is asserted in the new form; all other v1.3 tests still pass

### Migration & Cleanup (MIG)

- [ ] **MIG-01**: The existing Modified Formula and BMF code paths in `src/lib/formula/` are removed entirely — no dead code, no orphaned components, no orphaned tests
- [ ] **MIG-02**: The calculator registry (`src/lib/shell/registry.ts`) and About sheet content reflect the new unified Fortification calculator (one entry, updated description)
- [ ] **MIG-03**: The `/formula` route renders the new Fortification calculator
- [ ] **MIG-04**: A Playwright axe-core accessibility audit (light + dark) passes for the new calculator at WCAG 2.1 AA, matching the v1.1 morphine pattern

---

## Future Requirements (deferred beyond v1.3)

- Per-brand allowed kcal/oz constraints (open question: does each formula brand have its own valid kcal/oz range, and where does that data come from?)
- Recipe sharing / printing / export
- Saving recently-used formulas as favorites

## Out of Scope

- Adding new calculators beyond Fortification — milestone is purely a refactor
- Backend persistence of patient recipes — anonymous tool, no accounts (consistent with project-level out-of-scope)
- Native app builds — PWA only (consistent with project-level out-of-scope)
- The "Patient Recipe" tab of the spreadsheet (a different model — may inform a future milestone)
- The "Modified Recipes" tab of the spreadsheet (also a different model)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REF-01 | Phase 9 | Validated |
| REF-02 | Phase 9 | Validated |
| CALC-01 | Phase 9 | Validated |
| CALC-02 | Phase 9 | Validated |
| CALC-03 | Phase 9 | Validated |
| CALC-04 | Phase 9 | Validated |
| CALC-05 | Phase 9 | Validated |
| CALC-06 | Phase 9 | Validated |
| CALC-07 | Phase 9 | Validated |
| CALC-08 | Phase 9 | Validated |
| VAL-01 | Phase 9 | Validated |
| VAL-02 | Phase 9 | Validated |
| UI-01 | Phase 10 | Complete |
| UI-02 | Phase 10 | Complete |
| UI-03 | Phase 10 | Complete |
| UI-04 | Phase 10 | Complete |
| UI-05 | Phase 10 | Complete |
| REFACTOR-01 | Phase 10.1 | Pending |
| REFACTOR-02 | Phase 10.1 | Pending |
| REFACTOR-03 | Phase 10.1 | Pending |
| MIG-01 | Phase 11 | Pending |
| MIG-02 | Phase 11 | Pending |
| MIG-03 | Phase 11 | Pending |
| MIG-04 | Phase 11 | Pending |

**Coverage:** 24/24 requirements mapped (REF×2, CALC×8, VAL×2, UI×5, REFACTOR×3, MIG×4)
