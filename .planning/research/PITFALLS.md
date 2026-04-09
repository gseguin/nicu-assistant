# Pitfalls Research — v1.8 GIR Calculator

## Summary Table

| # | Pitfall | Manifests As | Prevention | Phase |
|---|---|---|---|---|
| 1 | Dextrose entered as fraction (0.125) instead of percent (12.5) | GIR off by 100× | Label `"Dextrose (%)"`, `%` suffix, advisory 2.5–25, placeholder `e.g. 12.5`, parity tests at 5/10/12.5/25 | A |
| 2 | Weight entered in grams | GIR ~1000× too small | Range advisory 0.3–7 kg, `kg` suffix, v1.6 blur advisory | A |
| 3 | Glucose unit ambiguity mg/dL vs mmol/L | Silent threshold misinterpretation | **Decision: mg/dL only v1.8.** Every threshold labeled `mg/dL`. Footnote: *"Multiply mmol/L by 18 to convert."* | A + C docs |
| 4 | Constant 0.167 vs 1/6 parity flap | Parity tests flaky | Use exact `10/60` in code; tests assert equality to 2 decimal places; display rounds to 1 | A |
| 5 | Display rounding re-used in math | Off-by-0.1 ml/hr | Full precision in `$state`, round only at render | A |
| 6 | Blank/zero weight → NaN GIR | Hero shows `NaN` / `∞` | Gate results on `weight > 0 && dex > 0 && ml > 0`; empty-state hero copy | A |
| 7 | Negative Δ rate ambiguous sign | "Decrease by" vs "new rate" misread | Column helper `(decrease)` / `(increase)`, ▲/▼ glyph + text (not color-only) | B |
| 8 | Target GIR ≤ 0 on aggressive wean | Negative Target rate shown | Display-clamp: if `<0`, show `"0 mg/kg/min — consider stopping infusion"`; keep raw for tests | B |
| 9 | Titration table read as recommendation | Mechanical row-pick | Frame: *"If current glucose is…"*, require explicit selection before hero updates | B |
| 10 | Over-emphasized default row implies preference | Anchor bias | **No default selection.** Hero: `"Select a glucose range to see target rate"` | B |
| 11 | Hidden rows on small screens | Severe-neuro scrolls off | Never hide rows. Vertical cards <480px, table ≥480px. All 6 visible. | B |
| 12 | 6×4 crammed into 375px | Truncation, <48px targets | Card layout on mobile (eyebrow + hero numeral + 3-col footer). No horizontal scroll. | B |
| 13 | Third identity hue fails AA in dark mode | axe contrast violation (Phase 20 Morphine repeat) | Pin literal `oklch(95% 0.04 H)` up front. Candidates: violet ~295 or green ~145. Axe before merge. | B + C |
| 14 | Identity accent on Δ confused with error red | Red reserved for errors | Identity accent for both directions; disambiguate with ▲/▼ glyph + text | B |
| 15 | Playwright a11y sweep count drifts | CI assertion mismatch | Update expected count; document in milestone notes | C |
| 16 | New calculator ships without source citation | "Where did this formula come from?" | Add GIR entry to AboutSheet citing spreadsheet + authoritative sources | C |
| 17 | `inputmode="numeric"` instead of `"decimal"` on iOS | No decimal key → can't enter 12.5 | Audit all 3 inputs; Playwright asserts `inputmode="decimal"` | A + C |
| 18 | EPIC paste brings whitespace / locale comma | `"12,5"` → NaN | Normalize: `trim().replace(',', '.')` | A |
| 19 | sessionStorage state cross-contamination | Ghost GIR from prior session | Dedicated `nicu_gir_state` key; unit test tab-switch isolation | A |
| 20 | Parity test brittleness from xlsx drift | Red on innocuous edits | Extract frozen JSON fixture at Phase A; don't re-read xlsx at test time | A |
| 21 | Registry ordering shifts muscle memory | Existing users' tab muscle memory broken | Append GIR to end of registry | B |
| 22 | Titration row SR semantics unclear | Static table, no selection semantics | `role="radiogroup"` + `role="radio"` rows with `aria-checked` | B + C |
| 23 | Dextrose % outside physiological | Silent calc on non-existent solutions | Advisory 5–25% (covers D5–D25). No clamp per v1.6. | A |
| 24 | Hero `aria-live` fires on every keystroke | SR spam while typing | `aria-live="polite"` + `aria-atomic="true"` + result only when all 3 inputs valid (v1.6 pattern) | A |
| 25 | ml/kg/day vs ml/hr confusion | GIR off by 24× | Label `"Fluid order (ml/kg/day)"` with suffix; advisory 40–200 | A |

---

## Unit of Measure Decision

### Glucose: **mg/dL only, v1.8**

**Rationale:**
1. **Source-of-truth parity** — spreadsheet uses mg/dL; any deviation risks translation bugs on safety-critical thresholds.
2. **Single-workflow principle** — supporting both units means every row needs two labels, every test needs two fixtures, cognitive load contradicts *"Earn trust through restraint."*
3. **v1.6 precedent** — Morphine committed to one unit without a toggle.
4. **Exit ramp exists** — adding mmol/L later is additive (new config + fixture file); no architectural debt.

**Prevention for mmol/L clinicians:**
- Every threshold label includes `"mg/dL"` inline.
- Footnote: *"Glucose thresholds in mg/dL. Multiply mmol/L by 18 to convert."*
- AboutSheet explicitly notes mg/dL basis.

### Dextrose %: **entered as percent (12.5), never fraction (0.125)**
- Matches spreadsheet, IV bag labeling (D12.5W), clinician mental model.
- `%` suffix inside input, placeholder `e.g. 12.5`, advisory 5–25%, parity test locks contract.

### Weight: **kg only**
### Fluid order: **ml/kg/day** (ml/hr is a derived output, never an input)

---

## Input Rails Decision

### GIR NumericInputs stay **advisory-only** (no auto-clamp), consistent with v1.6.

**Rationale tied to v1.6 precedent:**

v1.6 chose *"blur-gated 'Outside expected range — verify' advisory (no auto-clamp)"* because **clinicians must retain final authority — real patients have outlier values** (a 450g micro-preemie has a valid 0.45 kg weight).

GIR does not warrant a stricter rail:
1. **Outliers are real** — D5W–D25W and 0.3–7+ kg all legitimate.
2. **Clamping moves the error surface** — an auto-clamped weight *looks* correct in the hero, which is worse than an advisory flag.
3. **Trust-model parity** — three calculators with three input philosophies erodes the "same trusted interfaces" promise.

**GIR is the most aggressive user of the advisory pattern:**
- All 3 numeric inputs get `showRangeHint=true` and `showRangeError=true` (opt in for every field).
- Ranges sourced from `gir-config.json`, not magic numbers.
- Empty-state hero prominent: *"Enter weight, dextrose %, and fluid rate to compute GIR"*.
- Negative/impossible Target GIR → explicit message (*"Consider stopping infusion"*), not a clamped number. Display-layer guidance, not input rail.

**Rule of thumb:** rails = advisory, display = can editorialize. Phase C checkpoint: *"Did advisory-only hold up for GIR?"*

---

## Titration Table UX Hazards
1. No default row selection — explicit clinician action.
2. Selected state obvious — identity accent + border + `aria-checked="true"` + `.animate-result-pulse`.
3. Target hero updates only after selection.
4. Header: `"If current glucose is…"` not `"Recommended for…"`.
5. Severe-neuro row visually distinct but not alarming (subtle left border, not red fill).
6. All 6 rows always visible. No collapse.
7. Keyboard nav: radiogroup semantics (↑/↓/Home/End/Space).
8. Tap target ≥48px per row.
9. Δ rate sign: ▲/▼ glyph + text, not color alone.
10. No tooltips. Explanations go in AboutSheet or footnotes.

---

## Mobile Layout Hazards (6×4 on 375px)

**Do not use a horizontal table on mobile.**

**Recommended layout:**
- **<480px:** Vertical stack of 6 cards. Each card is a full-width `role="radio"` region containing:
  - Eyebrow: `"If glucose 50–60 mg/dL"`
  - Hero numeral: Target GIR (tabular-nums, bold)
  - Footer row (`grid grid-cols-3 gap-2 text-sm`): `Fluids` / `Rate` / `Δ rate`
  - Min height 88px (48px target + padding)
- **≥480px:** `role="grid"` horizontal table, 6 rows × 5 cells. Row height ≥48px. Tabular-nums. Selected row: identity border-left + subtle bg.
- **≥1024px:** Same as tablet + title alongside table.

**Never:**
- Horizontal-scroll the table.
- Use `<table>` without `role="grid"`.
- Collapse any row behind a disclosure.
- Use a dropdown to "choose" a glucose range — defeats multi-scenario display.

---

## Integration Hazards
1. **Phase 20 axe repeat risk** — start GIR identity at `oklch(95% 0.04 H)`. Don't eyeball it. Axe before PR.
2. **Palette drift** — commit to exactly the 4 identity surfaces from v1.5 (result hero, focus rings, eyebrows, active nav). No new surfaces.
3. **Playwright sweep expansion** — 12/12 → likely 16/16. Update assertion.
4. **Disclaimer trust surface** — single shared disclaimer holds. Update AboutSheet with GIR source citation.
5. **Registry ordering** — append to end. Tab order: Morphine, Formula, GIR.
6. **State singleton** — dedicated `nicu_gir_state` sessionStorage key.
7. **Parity fixture stability** — frozen JSON snapshot, not live xlsx reads.
8. **inputmode="decimal" audit** — Playwright assertion.

---

## Phase Mapping (maps to the 3-phase split in ARCHITECTURE.md)
- **Phase A (Foundation: calc + config + state):** 1, 2, 4, 5, 6, 17, 18, 19, 20, 23, 24, 25
- **Phase B (UI + identity + registration):** 7, 8, 9, 10, 11, 12, 13, 14, 21, 22
- **Phase C (A11y + E2E + version bump):** 3, 13, 15, 16, 17, 22

---

## Sources
- `.planning/PROJECT.md` v1.5 line 53 (Phase 20 Morphine identity axe catch)
- `.planning/PROJECT.md` v1.6 lines 58–63 (NumericInput advisory-only + 12/12 axe baseline)
- `.planning/PROJECT.md` v1.7 line 67 (`showRangeError` precedent)
- `CLAUDE.md` Design Context + Core Value
- `GIR-Wean-Calculator.xlsx` CALC tab
- WCAG 2.1 AA SC 1.4.1 (use of color) → ▲/▼ glyph requirement
