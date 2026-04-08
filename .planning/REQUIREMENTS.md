# Requirements — v1.7 Formula Micro-Polish

**Milestone goal:** Tighten three small rough edges in the Formula calculator uncovered during bedside use. Labels stop repeating units, Formula + Starting Volume share a row, and packets auto-select when the formula supports them.

## v1.7 Requirements

### Label cleanup

- [ ] **LBL-01**: The `Starting Volume` NumericInput label reads `"Starting Volume"` (not `"Starting Volume (mL)"`). The `mL` suffix on the input already communicates the unit.
- [ ] **LBL-02**: The `Target Calorie` NumericInput label reads `"Target Calorie"` (not `"Target Calorie (kcal/oz)"`). The `kcal/oz` suffix on the input already communicates the unit.
- [ ] **LBL-03**: No other Formula labels are modified. Base, Formula, Unit pickers keep their current labels.

### Row layout

- [ ] **ROW-01**: The Formula picker and Starting Volume input render on the same row — Formula first (wider), Starting Volume second (narrower) — across all screen sizes (mobile + desktop).
- [ ] **ROW-02**: The row preserves existing minimum touch target sizes (48px) and existing NumericInput chrome (focus ring, range advisory, suffix).
- [ ] **ROW-03**: The existing searchable Formula picker (v1.5) keeps working — tapping the Formula trigger still opens the search dialog. Row layout does not regress keyboard nav, ARIA semantics, or identity-color focus rings.

### Auto-select packets

- [ ] **AUTO-01**: When the user picks a packets-capable formula (currently `similac-hmf`), the Unit selection automatically changes to `packets` — regardless of the previously selected unit.
- [ ] **AUTO-02**: The existing v1.3 behavior — auto-reset off `packets` when switching FROM `similac-hmf` to a non-HMF formula — is preserved.
- [ ] **AUTO-03**: The auto-select does NOT fire on initial page load for users who already had a packets-capable formula selected in persisted state; it only fires in response to an active `formulaId` change.
- [ ] **AUTO-04**: If additional packets-capable formulas are added to config in the future, the behavior applies automatically (data-driven based on whether the formula's unit list includes `packets`, not hardcoded to `similac-hmf`).

### Regression safety

- [ ] **REG-01**: All existing vitest tests (149/149) still pass.
- [ ] **REG-02**: All existing Playwright a11y sweeps (12/12) still pass with no new violations.
- [ ] **REG-03**: New component/integration tests cover ROW-03 (picker still opens from row layout), AUTO-01 (switching to similac-hmf auto-selects packets), and AUTO-02 (switching away clears packets).

## Future Requirements

- Reset button on each calculator (P2 still deferred)
- "Verify against your protocol" microcopy under each result hero (P2 still deferred)
- Inline tooltips for clinical units for new staff (P3)
- Keyboard shortcut to switch tabs (P3)
- Theme toggle 150ms transition (P3)

## Out of Scope (v1.7)

- New calculators
- Hardcoding formula IDs in the auto-select logic — must be data-driven from config
- Changing NumericInput behavior (that was v1.6)
- Changing SelectPicker behavior (that was v1.5)
- Changing SegmentedToggle behavior (that was v1.6)

## Traceability

*(populated by roadmap)*

---
*Last updated: 2026-04-08 — v1.7 requirements defined*
