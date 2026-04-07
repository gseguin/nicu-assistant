# Phase 9: Fortification Reference Data & Business Logic — Research

**Researched:** 2026-04-07
**Domain:** Pure TypeScript clinical calculation + embedded JSON reference table
**Confidence:** HIGH

## Summary

Phase 9 mirrors the established morphine calculator pattern exactly: a single `calculations.ts` of pure functions, a `types.ts` of shared interfaces, a colocated `calculations.test.ts` using hardcoded constants for spreadsheet parity, and a JSON config embedded via static import. All building blocks are already in the repo — the morphine module is the reference implementation, and the existing `src/lib/formula/` module demonstrates both the JSON validation pattern we want to reuse and the legacy code Phase 11 will delete.

The key design decision this research drives: **create `src/lib/fortification/` as a fresh sibling directory** rather than mutating `src/lib/formula/` in place. This keeps Phase 9 pure-additive, leaves the shipped Modified+BMF calculator untouched until Phase 10 swaps routes, and gives Phase 11 a trivial `rm -rf src/lib/formula/` cleanup target.

**Primary recommendation:** Scaffold `src/lib/fortification/{types.ts,fortification-config.json,fortification-config.ts,calculations.ts,calculations.test.ts}` following the morphine layout 1:1. Do not touch `src/lib/formula/` in this phase.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REF-01 | Reference table of ~30 formulas with displacement/kcal/scoop | JSON config shape (§5), data sourced from xlsx Calculator tab A3:D35 |
| REF-02 | Stored in JSON config, editable without TS changes | Mirrors morphine-config.json pattern; `fortification-config.ts` parser validates at load |
| CALC-01 | Pure `calculateFortification(inputs)` returning 4 outputs | Function signature in §4, pseudocode in §6 |
| CALC-02 | General formula `(V × (targetKcal − baseKcal)) / (29.57 × kcalG − disp × targetKcal)` | §6 Algorithm, general path |
| CALC-03 | Unit conversion: Grams=1, Scoops=gPerScoop, Tsp=2.5g, Tbsp=7.5g, Packets=special | §6 unit divisor table |
| CALC-04 | Packets: 0 except Similac HMF; HMF@24=V/25, HMF@22=V/50, else 0 | §6 special case (a) |
| CALC-05 | BM+Tsp+22 → (V/90)×0.5; BM+Tsp+24 → (V/90)×1 | §6 special case (b, c) |
| CALC-06 | Yield = V + (gramsAdded × disp) | §6 yield formula |
| CALC-07 | Exact kcal/oz = ((baseKcal × V/29.57) + (g × kcalG)) / (yield/29.57) | §6 kcal/oz formula |
| CALC-08 | Suggested start volume rounds to whole units, back-calculates, formats "<mL> (<oz> oz)" | §6 suggestedStartingVolume algorithm |
| VAL-01 | Spreadsheet-parity test: Neocate + BM + 180 + 24 + Tsp → 2 / 183.5 / 23.51 / "180 (6.1 oz)" + one per special case | §7 test plan |
| VAL-02 | Full v1.2 suite still green | Phase 9 is pure-additive — no changes to morphine/shared/formula/PWA |

## Project Constraints (from CLAUDE.md)

- **Stack locked**: SvelteKit 2 + Svelte 5 runes + TS 5.9 + Vitest 4. No new deps.
- **GSD workflow**: all edits go through a GSD command.
- **Test colocation (from MEMORY.md)**: co-locate `*.test.ts` next to source, NOT in `__tests__/` dirs. Morphine already follows this; existing `src/lib/formula/__tests__/formula.test.ts` is a legacy inconsistency that Phase 11 will delete anyway — do not replicate it.
- **Zero mocks philosophy (v1.1 pattern)**: tests use real JSON config and hardcoded expected values, no mocking of fs/config.
- **No new runtime deps**, no new shared components in Phase 9.
- **Clinical data in JSON** (v1.1 decision, REF-02).

## 1. Pattern Reference — `src/lib/morphine/`

### File layout (verified)
```
src/lib/morphine/
├── calculations.ts              # 77 lines — pure functions
├── calculations.test.ts         # 147 lines — colocated, hardcoded spreadsheet parity
├── types.ts                     # 15 lines — WeanMode, WeanStep, MorphineStateData
├── morphine-config.json         # 18 lines — defaults + stepCount + mode metadata
├── state.svelte.ts              # 58 lines — sessionStorage-backed runes (OUT OF SCOPE for P9)
├── MorphineWeanCalculator.svelte
└── MorphineWeanCalculator.test.ts
```

### Key conventions observed

**Pure functions with explicit primitive params** (not input objects):
```ts
export function calculateLinearSchedule(
  weightKg: number,
  maxDoseMgKgDose: number,
  decreasePct: number
): WeanStep[]
```
Morphine took numeric params. **Phase 9 should diverge and take a single `FortificationInputs` object** because 5 inputs of mixed string-literal + number types become unwieldy positionally and the planner's proposed signature in CALC-01 explicitly calls for `calculateFortification(inputs)`.

**JSON imported statically** (no fs, no fetch, tree-shaken by Vite):
```ts
import config from './morphine-config.json';
```
Works because `tsconfig` has `resolveJsonModule: true` (verified by morphine compiling).

**Import style uses `.js` extension** (verified in calculations.ts and state.svelte.ts):
```ts
import type { WeanStep } from './types.js';
```
This is SvelteKit/Vite convention for NodeNext-style resolution. Phase 9 files MUST follow this.

### Test pattern (critical for VAL-01)

The morphine parity tests use **hardcoded expected-value arrays** inlined in the test file, not external CSV/JSON fixtures:

```ts
describe('Linear mode — Sheet1 spreadsheet parity', () => {
  const steps = calculateLinearSchedule(3.1, 0.04, 0.10);
  const expected: { step: number; doseMg: number; ... }[] = [
    { step: 1, doseMg: 0.124, doseMgKgDose: 0.04, reductionMg: 0 },
    // ...
  ];
  for (const row of expected) {
    it(`step ${row.step} matches Sheet1 row`, () => {
      expect(s.doseMg).toBeCloseTo(row.doseMg, 4);
    });
  }
});
```

**Float precision**: morphine uses `toBeCloseTo(value, 4)` (4 decimal places) for parity assertions and `toBeCloseTo(value, 6)` for exact-math identities. **Phase 9 should use `toBeCloseTo(value, 4)` for kcal/oz (spreadsheet shows 23.5101662125341; matching to 4 decimals = 23.5102 which passes cleanly) and exact equality for integer/whole-unit outputs (amountToAdd, yieldMl when expected is a whole number).**

## 2. Existing Formula Code Inventory (for Phase 11 delete list)

All files under `src/lib/formula/` — Phase 11 will remove these. Documented here so the Phase 11 plan can cite them explicitly.

| File | Lines | Exports / Contents |
|------|-------|--------------------|
| `formula.ts` | 362 | `FormulaResult`, `BMFResult`, `ValidationResult`, `validateRecipeInputs`, `validateBMFInputs`, `calculateRecipe`, `calculateBMF`, `calculateScoops`, `calculatePackets`, `parsePacketSize`, `formatOutput`, `ML_PER_OZ` const |
| `formula-config.ts` | 300 | `BrandConfig`, `Disclaimer`, `ValidationMessages`, `FormulaConfig`, `parseFormulaConfig`, `FORMULA_CONFIG`, `BRANDS`, `getBrandByName`, `getBrandById`, `getBrandsByManufacturer`, `isPacketBrand`, `hasCalorieData` |
| `formula-config.json` | 397 | ~40 brands grouped by manufacturer (Abbott, Nutricia, Mead Johnson, Nestlé) with `id`, `brand`, `manufacturer`, `displacementMlPerG`, `kcalPerG`, `canSize`, `gPerScoop`, `gPerTbsp`, `gPerTsp`, `packetLabel` |
| `state.svelte.ts` | 82 | `FormulaModifiedState`, `FormulaBMFState`, `FormulaStateData`, `formulaState` runes singleton with `modified` and `bmf` modes |
| `FormulaCalculator.svelte` | — | Top-level tabbed wrapper (Modified ↔ BMF) |
| `ModifiedFormulaCalculator.svelte` | — | Modified formula UI |
| `BreastMilkFortifierCalculator.svelte` | — | BMF UI |
| `__tests__/formula.test.ts` | 652 | Unit tests for formula.ts (uses `__tests__/` dir — inconsistent with project convention, will be deleted in P11) |

**External consumers of `src/lib/formula/`** (Phase 11 must update):
- `src/routes/formula/+page.svelte` — imports `formulaState`, `FormulaCalculator`
- `src/routes/+layout.svelte` — imports `formulaState` to read `modified.targetKcalOzRaw` and `bmf.targetKcalOzRaw` for disclaimer gating
- `src/lib/shell/registry.ts` — (verify in P11) likely has `formula` calculator entry

**Reusable data from existing `formula-config.json`**: the ~40 brands have richer metadata than Phase 9 needs (manufacturer grouping, canSize, packetLabel, gPerTbsp, gPerTsp). Phase 9 only needs the ~30 brands from the xlsx Calculator tab A3:D35 with 3 fields: displacement, kcalG, gPerScoop. **Recommendation: do NOT reuse `formula-config.json` — transcribe fresh from `recipe-calculator.xlsx` Calculator tab.** Rationale:
1. Brand lists differ: the xlsx has "Enfamil A.R, Enfamil Reguline, PediaSure, Portagen, Boost Kid Essentials, Monogen" etc. that may not be in `formula-config.json`, and `formula-config.json` has entries like "Calcilo XD" that aren't in the Calculator tab.
2. Reusing risks silent value drift between the two sources of truth; fresh transcription + parity tests catches transcription errors.
3. Phase 11 deletes the old file anyway — any "reuse" just becomes a copy/paste at that point.

However, the Phase 10 UI will want manufacturer grouping (per success criterion: "~30 brands grouped by manufacturer"). **Recommendation**: add an optional `manufacturer` field to the new config now so Phase 10 has it ready, even though Phase 9 calculations don't use it. Source manufacturer strings from `formula-config.json` by matching brand names where possible; flag unmatched brands for user confirmation.

## 3. Recommended File Layout for Phase 9

```
src/lib/fortification/
├── types.ts                          # FortificationInputs, FortificationOutputs, FortificationFormula, Base, Unit, TargetKcalOz
├── fortification-config.json         # { formulas: [...], defaults: {...} }
├── fortification-config.ts           # Parser + validator + FORTIFICATION_CONFIG + FORMULAS + lookup helpers
├── calculations.ts                   # calculateFortification + internal helpers
└── calculations.test.ts              # Spreadsheet parity + special cases + unit coverage (co-located)
```

**NOT in Phase 9** (deferred to Phase 10):
- `state.svelte.ts` (UI state for inputs)
- `Fortification.svelte` component
- Any route changes

**Why new `fortification/` dir instead of editing `formula/` in place:**
1. **Pure-additive phase**: zero risk of breaking shipped v1.2 morphine or v1.0 formula code. VAL-02 (full suite green) is trivially satisfied.
2. **Clean Phase 11 target**: Phase 11 success criterion is "grep returns zero matches for ModifiedFormula/BreastMilkFortifier". A separate dir means Phase 11 can delete the whole directory in one step.
3. **Phase 10 becomes a swap, not a rewrite**: Phase 10 just points `/formula/+page.svelte` at the new module.
4. **Name `fortification/` matches the domain term** used throughout REQUIREMENTS.md (CALC-* are all "calculateFortification") — "formula" was the legacy name for a narrower concept.

## 4. Recommended TypeScript Types

Following morphine's convention (small types.ts with plain interfaces + exported string union types):

```ts
// src/lib/fortification/types.ts

/** Base liquid the powder is added to. Affects baseKcal constant. */
export type Base = 'breast-milk' | 'water';

/** Dispensing unit for amountToAdd. */
export type Unit = 'grams' | 'scoops' | 'teaspoons' | 'tablespoons' | 'packets';

/** Fixed target calorie dropdown values from spreadsheet (kcal/fl oz). */
export type TargetKcalOz = 22 | 24 | 26 | 28 | 30;

/** One row of the Calculator tab reference table (A3:D35). */
export interface FortificationFormula {
  /** Stable kebab-case id for UI keys (e.g., "neocate-infant"). */
  id: string;
  /** Exact display name as it appears in xlsx column A. */
  name: string;
  /** Optional manufacturer for Phase 10 grouping (not used by calculations). */
  manufacturer?: string;
  /** Powder displacement in mL per gram (xlsx column B). */
  displacementFactor: number;
  /** Calorie density in kcal per gram (xlsx column C). */
  calorieConcentration: number;
  /** Grams per scoop (xlsx column D). */
  gramsPerScoop: number;
}

/** All inputs needed to compute a fortification recipe. */
export interface FortificationInputs {
  base: Base;
  startingVolumeMl: number;
  formula: FortificationFormula;  // Pass the full row, not just an id — matches morphine's "caller resolves config" pattern
  targetKcalOz: TargetKcalOz;
  unit: Unit;
}

/** All four outputs the spreadsheet's Calculator tab produces (G9–G12). */
export interface FortificationOutputs {
  /** G9 — amount to add, in the chosen unit. May be fractional; UI rounds for display. */
  amountToAdd: number;
  /** G10 — post-fortification total volume in mL. */
  yieldMl: number;
  /** G11 — actual achieved calorie concentration in kcal/fl oz. */
  exactKcalPerOz: number;
  /** G12 — pre-formatted string "<mL> (<oz> oz)" for the suggested whole-unit starting volume. */
  suggestedStartingVolumeMl: string;
}
```

### Design decisions & rationale

| Decision | Why |
|----------|-----|
| `Base` is string union `'breast-milk' \| 'water'`, not enum | Morphine uses `WeanMode = 'linear' \| 'compounding'` — same pattern. Plays nicely with JSON state persistence and URL params in Phase 10. |
| `Unit` is lowercase string union | Same as Base. The spreadsheet uses "Grams"/"Scoops"/"Teaspoons" etc.; the calculator normalizes at the boundary. |
| `TargetKcalOz = 22 \| 24 \| 26 \| 28 \| 30` literal union | The xlsx has a fixed dropdown. A literal type lets TS catch typos and enables exhaustive switching in the CALC-04 packet logic. **Open Q**: should we widen to `number` to allow off-menu values (e.g. 23)? See §8. |
| `FortificationInputs.formula` is the full `FortificationFormula` object, not `formulaId: string` | Keeps `calculateFortification` pure — it doesn't need to know about the config module. The caller (UI / tests) resolves the lookup. Morphine's `calculateLinearSchedule` took raw numbers for the same reason. |
| `amountToAdd: number` (unrounded) in outputs | Spreadsheet G9 is raw; rounding is a UI concern. Tests can assert exact raw values. Phase 10 UI rounds for display per CALC-08 logic. |
| `suggestedStartingVolumeMl: string` (pre-formatted) | Spreadsheet G12 is literally a string like `"180 (6.1 oz)"`. Mirroring that keeps the pure function output = spreadsheet output for trivial parity testing. **Alternative considered**: return `{ ml: number, oz: number }` and format in UI. Rejected because the rounding logic is load-bearing (CALC-08: "round to whole units and back-calculate") and belongs in the tested pure function, not in a formatter. |
| No `ValidationResult` type | Phase 9 scope is the pure calculation. Input validation (VAL-01 is about parity, not input guards) can be added as a sibling function `validateFortificationInputs` if needed, but is not required by any listed requirement. **Recommendation**: skip input validation in P9; add a minimal `isFinite && > 0` guard on `startingVolumeMl` only. Invalid formula lookup is handled upstream by config. |

## 5. Recommended JSON Config Shape

```json
{
  "defaults": {
    "base": "breast-milk",
    "startingVolumeMl": 180,
    "formulaId": "neocate-infant",
    "targetKcalOz": 24,
    "unit": "teaspoons"
  },
  "targetKcalOzOptions": [22, 24, 26, 28, 30],
  "baseKcalByBase": {
    "breast-milk": 20,
    "water": 0
  },
  "unitWeightGrams": {
    "grams": 1,
    "teaspoons": 2.5,
    "tablespoons": 7.5
  },
  "formulas": [
    {
      "id": "neocate-infant",
      "name": "Neocate Infant",
      "manufacturer": "Nutricia",
      "displacementFactor": 0.7,
      "calorieConcentration": 4.83,
      "gramsPerScoop": 4.6
    },
    {
      "id": "similac-hmf",
      "name": "Similac HMF",
      "manufacturer": "Abbott",
      "displacementFactor": 1.0,
      "calorieConcentration": 1.4,
      "gramsPerScoop": 5
    }
    // ... 28 more rows from xlsx A3:D35
  ]
}
```

### Why an array, not a record keyed by id
- Morphine doesn't have multi-row data to compare against, but `formula-config.json` uses an array + parser builds lookup maps. That's the established project pattern.
- Preserves insertion order (xlsx order) for UI rendering consistency.
- Allows duplicate-id detection in the parser (existing `formula-config.ts` does this at line 163 — copy that check).

### Why embed `baseKcalByBase` and `unitWeightGrams` in config instead of hardcoding in calculations.ts
- **REF-02 spirit**: "a non-developer can update values without touching TypeScript code." The 20 kcal/oz EBM baseline is a clinical constant that could change per protocol.
- The 2.5g/tsp and 7.5g/tbsp values are from the spreadsheet — if someone corrects the xlsx they should be able to update the app without a code edit.
- Small cost: the parser validates one more section.

### Why include `targetKcalOzOptions` in config even though it's also in the type union
- The type union drives compile-time safety; the array drives the Phase 10 dropdown rendering. Single source of truth for the UI.
- Phase 9's calculation doesn't use it at all — it's there for Phase 10's convenience and REF-02 editability.

### Parser (`fortification-config.ts`)
Port the validator style directly from `src/lib/formula/formula-config.ts` lines 62–253:
- `assertString`, `assertKebabCase`, `assertPositiveNumber`, `assertNonNegativeNumber` helpers
- Fail-fast at module load
- Export `FORTIFICATION_CONFIG`, `FORMULAS` convenience alias, `getFormulaById(id)`, `getFormulaByName(name)`
- Assert unique ids, positive `displacementFactor` / `calorieConcentration` / `gramsPerScoop`, non-empty `name`

## 6. Calculation Algorithm (pseudocode)

```ts
export function calculateFortification(inputs: FortificationInputs): FortificationOutputs {
  const { base, startingVolumeMl: V, formula, targetKcalOz: target, unit } = inputs;
  const { displacementFactor: disp, calorieConcentration: kcalG, gramsPerScoop, name } = formula;
  const baseKcal = config.baseKcalByBase[base];  // 20 for breast-milk, 0 for water

  // ── STEP 1: amountToAdd (G9) — three-tier special-case cascade ────────────

  let amountToAdd: number;

  // Special case (a): Packets unit (CALC-04)
  //   Packets only meaningful for Similac HMF; returns 0 otherwise
  if (unit === 'packets') {
    if (name === 'Similac HMF' && target === 24) {
      amountToAdd = V / 25;
    } else if (name === 'Similac HMF' && target === 22) {
      amountToAdd = V / 50;
    } else {
      amountToAdd = 0;  // Packets not applicable
    }
  }
  // Special case (b): Breast milk + Teaspoons clinical shortcut (CALC-05)
  //   HMF clinical protocol: 1 tsp per 90 mL → 24 kcal; 0.5 tsp per 90 mL → 22 kcal
  else if (base === 'breast-milk' && unit === 'teaspoons' && target === 22) {
    amountToAdd = (V / 90) * 0.5;
  }
  else if (base === 'breast-milk' && unit === 'teaspoons' && target === 24) {
    amountToAdd = (V / 90) * 1;
  }
  // General case (CALC-02 + CALC-03)
  else {
    // Grams needed (general fortification formula)
    const numerator = V * (target - baseKcal);
    const denominator = 29.57 * kcalG - disp * target;
    const gramsNeeded = numerator / denominator;

    // Divide by unit weight to convert grams → requested unit
    const unitDivisor = {
      grams: 1,
      teaspoons: 2.5,
      tablespoons: 7.5,
      scoops: gramsPerScoop,
      packets: 1,  // unreachable — packets handled above
    }[unit];

    amountToAdd = gramsNeeded / unitDivisor;

    // Guard: denominator ≤ 0 or NaN → return 0 (matches spreadsheet IFERROR(..., 0))
    if (!isFinite(amountToAdd)) amountToAdd = 0;
  }

  // ── STEP 2: gramsAdded — reverse the unit conversion to get raw grams ─────

  const gramsAdded = unit === 'teaspoons'   ? amountToAdd * 2.5
                   : unit === 'tablespoons' ? amountToAdd * 7.5
                   : unit === 'grams'       ? amountToAdd
                   : /* scoops OR packets */   amountToAdd * gramsPerScoop;

  // ── STEP 3: yieldMl (G10) — CALC-06 ──────────────────────────────────────
  //   Plain-English: starting volume + volume displaced by the powder.
  //   ⚠ The spreadsheet G10 formula looks like a tangled nested IF, but it
  //   reduces to exactly this. See manual verification below.

  const yieldMl = V + gramsAdded * disp;

  // ── STEP 4: exactKcalPerOz (G11) — CALC-07 ───────────────────────────────
  //   Total kcal delivered / total fl oz produced.
  //   totalKcal = (base kcal content of starting volume) + (kcal from powder)
  //   totalOz   = yield in mL / 29.57

  const totalKcal = (baseKcal * V / 29.57) + (gramsAdded * kcalG);
  const totalOz   = yieldMl / 29.57;
  const exactKcalPerOz = totalKcal / totalOz;

  // ── STEP 5: suggestedStartingVolumeMl (G12) — CALC-08 ─────────────────────
  //   "What starting volume would yield a whole-unit amountToAdd?"
  //   Rounds amountToAdd to nearest whole (min 1), then back-solves V
  //   such that amountToAdd(V') = roundedAmount. Formats as "<mL> (<oz> oz)".

  let suggestedStartingVolumeMl: string;
  if (amountToAdd === 0) {
    suggestedStartingVolumeMl = '0 (0 oz)';
  } else if (unit === 'grams') {
    // Grams doesn't have a "whole-unit" rounding benefit — just echo starting volume
    const mL = Math.round(V);
    const oz = Math.round((V / 29.57) * 10) / 10;
    suggestedStartingVolumeMl = `${mL} (${oz} oz)`;
  } else {
    const wholeAmount = Math.max(1, Math.round(amountToAdd));
    const suggestedV = Math.round(wholeAmount * (V / amountToAdd));
    const oz = Math.round((suggestedV / 29.57) * 10) / 10;
    suggestedStartingVolumeMl = `${suggestedV} (${oz} oz)`;
  }

  return { amountToAdd, yieldMl, exactKcalPerOz, suggestedStartingVolumeMl };
}
```

### Manual verification of the documented test case

**Inputs**: Neocate Infant (disp=0.7, kcalG=4.83, gPerScoop=4.6) + breast-milk + V=180 + target=24 + teaspoons

1. **Special case (b) branch matches**: `base='breast-milk' && unit='teaspoons' && target===24`
   - `amountToAdd = (180 / 90) × 1 = 2` ✓ (spreadsheet G9 = 2)
2. **gramsAdded** = `2 × 2.5 = 5`
3. **yieldMl** = `180 + 5 × 0.7 = 180 + 3.5 = 183.5` ✓ (spreadsheet G10 = 183.5)
4. **totalKcal** = `(20 × 180 / 29.57) + (5 × 4.83) = 121.7450... + 24.15 = 145.8950...`
5. **totalOz** = `183.5 / 29.57 = 6.2056...`
6. **exactKcalPerOz** = `145.8950 / 6.2056 = 23.5101...` ✓ (spreadsheet G11 = 23.5101662125341)
7. **suggestedStartingVolumeMl**: `amountToAdd=2` (whole already), `suggestedV = round(2 × 180/2) = 180`, `oz = round(180/29.57 × 10)/10 = 6.1`
   → `"180 (6.1 oz)"` ✓ (spreadsheet G12 = "180 (6.1 oz)")

**All four outputs match to full precision.** The algorithm above is correct.

### Note on the spreadsheet's "tangled" G10 formula
The xlsx G10 formula has nested IFs that look like they multiply by `disp` across all branches. Plain-English simplification: the nested IF computes `gramsAdded` and the outer expression is `V + gramsAdded × disp`. This is CALC-06 verbatim. **The planner should transcribe CALC-06, not the nested Excel IF.** The TS algorithm above does this.

## 7. Suggested Plan Breakdown

Recommend **two plans** for Phase 9:

### Plan 09-01: Reference data scaffold
**Scope**:
- Create `src/lib/fortification/` directory
- Write `types.ts` (FortificationInputs, FortificationOutputs, FortificationFormula, Base, Unit, TargetKcalOz)
- Transcribe xlsx Calculator tab A3:D35 into `fortification-config.json` (~30 rows + defaults + baseKcalByBase + unitWeightGrams + targetKcalOzOptions)
- Write `fortification-config.ts` parser (port from `formula-config.ts` validator style)
- Unit test the parser: valid config loads, duplicate id throws, negative displacement throws, missing field throws, known row (Neocate Infant) retrievable via `getFormulaById`

**Verification**: `npm run test -- fortification-config` passes, `npm run check` (tsc) passes, `npm run build` succeeds.

**Requirements addressed**: REF-01, REF-02

### Plan 09-02: calculateFortification + spreadsheet parity tests
**Scope**:
- Write `calculations.ts` with `calculateFortification(inputs)` per §6
- Write `calculations.test.ts` co-located, covering:
  - **Parity anchor**: Neocate Infant + BM + 180 + 24 + Tsp → documented outputs (4 assertions, toBeCloseTo precision 4)
  - **Special case (a) Packets**:
    - Similac HMF + 180 mL + 24 → `amountToAdd = 7.2`
    - Similac HMF + 180 mL + 22 → `amountToAdd = 3.6`
    - Similac HMF + 180 mL + 26 → `amountToAdd = 0` (neither 22 nor 24)
    - Non-HMF (e.g. Neocate Infant) + Packets → `amountToAdd = 0` at any kcal
  - **Special case (b) BM+Tsp shortcut**:
    - BM + Tsp + 22 → `(V/90)×0.5` verified on two volumes
    - BM + Tsp + 24 → `(V/90)×1` verified on two volumes
  - **General case coverage**:
    - Water base + Grams: verify baseKcal=0 is applied
    - Water base + Scoops: verify scoop conversion
    - BM base + Tablespoons + 26 kcal (not a special case): verify general formula
    - BM base + Scoops + 26 kcal: verify general formula
  - **Yield and exactKcalPerOz identities**: for a general-case computation, assert `yieldMl ≈ V + gramsAdded × disp` and that back-computed kcal content is consistent
  - **suggestedStartingVolumeMl format**: regex match `/^\d+ \(\d+\.\d oz\)$/`, plus the `"0 (0 oz)"` branch when amountToAdd=0

**Verification**: `npm run test` full suite green (VAL-02), parity test passes (VAL-01).

**Requirements addressed**: CALC-01..CALC-08, VAL-01, VAL-02

### Why two plans, not one or three
- One plan would work but becomes ~400 LOC of new code + tests and is harder to review. Morphine Phase 3 was split similarly.
- Three plans (types / config / calculations) over-fragments — types + config are coupled (parser uses types) and land together cleanly.
- The split places the riskiest work (CALC logic + parity) in its own plan with a tight verification signal.

## 8. Open Questions (RESOLVED)


**RESOLVED (D-01):** Use literal union `22 | 24 | 26 | 28 | 30` for Phase 9. Matches the shipped UI dropdown and gives exhaustive type-checking in the CALC-04 packet branch. If a future requirement adds an off-menu target, widen to `number` then. 1. **`TargetKcalOz` literal union vs. `number`?**
   - Spreadsheet dropdown is fixed at 22/24/26/28/30. Literal union gives exhaustive type checks in the CALC-04 packet logic.
   - But the general formula works for any positive number, and a future off-menu target (e.g. 27) would be a type error.
   - **Recommendation**: literal union for Phase 9 (matches shipped UI shape, catches typos). Widen to `number` later if requirements change. Flag for planner to confirm with user.

**RESOLVED (D-02):** Include `manufacturer` in `fortification-config.json` now (option a). Plan 09-01 transcribes from xlsx and derives manufacturer by matching brand name against the existing `src/lib/formula/formula-config.json` brand list. Brands not in the legacy config get an empty `manufacturer` string and are flagged in 09-01-SUMMARY.md for human review. 2. **Manufacturer grouping — where does it come from?**
   - The xlsx Calculator tab only has formula name. Phase 10 needs manufacturer grouping. Options:
     - (a) Add `manufacturer` to each row in `fortification-config.json` now, sourced by matching brand names against existing `formula-config.json`.
     - (b) Defer to Phase 10 and leave the field out.
   - **Recommendation**: (a). It's a 5-minute transcription task now, vs. a schema migration in Phase 10. Flag unmatched brands (e.g. "Boost Kid Essentials", "Monogen") for user confirmation during Plan 09-01 execution.

**RESOLVED (D-03):** Match the spreadsheet's `IFERROR(..., 0)` behavior — return zeros (`amountToAdd: 0`, `yieldMl: 0`, `exactKcalPerOz: 0`, `suggestedStartingVolumeMl: '0 (0 oz)'`) on non-finite results or `volumeMl <= 0`. Never throw. Phase 10 UI is responsible for input constraints and the 'Packets only available for Similac HMF' inline message. 3. **Should `calculateFortification` throw or return sentinel on invalid inputs?**
   - Morphine's functions assume valid inputs (no guards). The old `formula.ts` throws.
   - Spreadsheet behavior: wraps the general case in `IFERROR(..., 0)` — returns 0 on division error.
   - **Recommendation**: match the spreadsheet — return 0 for `amountToAdd` on non-finite results, never throw. Phase 10 UI will show a "Packets only available for Similac HMF" inline message when `unit=packets && name≠'Similac HMF'` (per UI success criterion), which is pure output-driven, no exception needed. Flag for planner confirmation.

**RESOLVED (D-04):** Exact row count is determined empirically by Plan 09-01 Task 1 (read xlsx Calculator tab A3:D35). Plan 09-01 Task 2 verify asserts the exact count as a hard equality (executor fills in the literal after Task 1). Expected range is 28–33 based on the xlsx layout; the SUMMARY records the final number. 4. **Does the xlsx Calculator tab list exactly 30 brands or does it vary?**
   - Phase description says "~30" and REF-01 says "~30". Actual row count depends on xlsx. The 30-brand list in `additional_context` is authoritative. Planner should verify row count during transcription in Plan 09-01 and document the final count in the plan frontmatter.

**RESOLVED (D-05):** `toBeCloseTo(value, 4)` for `exactKcalPerOz` and any non-integer `amountToAdd`/`yieldMl`; `toBe()` for integer/whole-unit outputs and string outputs. Matches morphine's precedent. 5. **Float precision for parity tests**
   - Spreadsheet returns `23.5101662125341` for G11. `toBeCloseTo(23.5102, 4)` = precision to 4 decimal places = passes.
   - G10 `183.5` is exact → use `toBe(183.5)`.
   - G9 `2` (Teaspoons) is exact → use `toBe(2)`.
   - G12 is a string → use `toBe("180 (6.1 oz)")`.
   - **Recommendation**: use `toBeCloseTo(expected, 4)` for `exactKcalPerOz` and any general-case `amountToAdd` / `yieldMl`; use `toBe()` for integer or string outputs. Follow morphine's `, 4)` precedent.

**RESOLVED (D-06):** No imports from `src/lib/shared/` in Phase 9. `calculations.ts` is a pure function with zero UI/state dependencies, exactly like `src/lib/morphine/calculations.ts`. 6. **Does `src/lib/shared/` provide anything the new module needs?**
   - Checked: `src/lib/shared/` contains `about-content.ts`, `context.ts`, `disclaimer.svelte.ts`, `index.ts`, `pwa.svelte.ts`, `theme.svelte.ts`, `types.ts`, `components/`. Morphine's `calculations.ts` imports nothing from shared. **Phase 9 calculations.ts should also import nothing from shared** — pure function has no UI/state dependencies. Types, config, and tests are all self-contained in `src/lib/fortification/`.

## Runtime State Inventory

This phase is pure-additive new code — no rename, no refactor, no state migration. All categories: **None**.

| Category | Status |
|----------|--------|
| Stored data | None — no sessionStorage changes, no new persistence keys (state is Phase 10) |
| Live service config | None — no external services |
| OS-registered state | None |
| Secrets/env vars | None |
| Build artifacts | None — new files only, no rename/move of existing build outputs |

## Environment Availability

Phase 9 is pure TypeScript with existing tooling. All dependencies already available:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| TypeScript | types, parser, calculations | ✓ | 5.9.3 (package.json) | — |
| Vitest | calculations.test.ts | ✓ | 4.1.2 | — |
| Vite JSON import | `import config from './*.json'` | ✓ | resolveJsonModule enabled (morphine works) | — |
| SvelteKit `$lib` alias | not used in Phase 9 (intra-lib relative imports) | ✓ | ^2.55.0 | — |

No missing dependencies. No new packages to install.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vite.config.ts` (inferred from project layout; verify in Plan 09-01) |
| Quick run | `npm run test -- src/lib/fortification` |
| Full suite | `npm run test` |

### Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REF-01 | ~30 formulas loaded from JSON | unit (parser) | `npm run test -- fortification-config` | ❌ Plan 09-01 |
| REF-02 | JSON parser validates + fails fast on bad data | unit (parser) | `npm run test -- fortification-config` | ❌ Plan 09-01 |
| CALC-01 | Pure function returns all 4 outputs | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| CALC-02 | General formula numerically correct | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| CALC-03 | Each unit converts correctly | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| CALC-04 | Packets special case (HMF only, by kcal) | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| CALC-05 | BM+Tsp shortcuts at 22 and 24 | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| CALC-06 | Yield formula | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| CALC-07 | Exact kcal/oz formula | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| CALC-08 | Suggested starting volume format | unit | `npm run test -- calculations` | ❌ Plan 09-02 |
| VAL-01 | Spreadsheet parity anchor (Neocate/BM/180/24/Tsp) | unit (parity) | `npm run test -- calculations` | ❌ Plan 09-02 |
| VAL-02 | No regressions in morphine/shared/pwa/formula | unit (full suite) | `npm run test` | ✅ existing |

### Sampling Rate
- Per task commit: `npm run test -- src/lib/fortification`
- Per wave merge: `npm run test`
- Phase gate: `npm run test` + `npm run check` + `npm run build` all green

### Wave 0 Gaps
- `src/lib/fortification/calculations.test.ts` — covers CALC-01..08, VAL-01 (Plan 09-02)
- `src/lib/fortification/fortification-config.test.ts` — covers REF-01, REF-02 parser (Plan 09-01)
- No framework install needed.

## Security Domain

Phase 9 is pure mathematical calculation over static JSON — no user input persistence, no network, no auth, no crypto, no DOM. ASVS categories that would apply (V2–V6) are not in scope for pure-function code. No threats identified at this layer; input validation happens at the Phase 10 UI boundary.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tsconfig.json` has `resolveJsonModule: true` | §1 | LOW — morphine already imports JSON, so verified by existing working code |
| A2 | Existing `formula-config.json` manufacturer strings can be matched to the ~30 Calculator-tab brands for the optional `manufacturer` field | §2, §8 Q2 | MEDIUM — some xlsx brands (e.g. Boost Kid Essentials, Monogen) may not exist in `formula-config.json`; transcriber must flag unmatched rows |
| A3 | The xlsx Calculator tab actually contains the exact 30 brands listed in `additional_context` | §5, §8 Q4 | LOW — the planner will re-verify during Plan 09-01 transcription |
| A4 | Spreadsheet's G10 nested IF reduces to `V + gramsAdded × disp` | §6 | LOW — manually verified against documented test case (180 + 5×0.7 = 183.5) |
| A5 | Spreadsheet's IFERROR(..., 0) behavior on divide errors should be matched | §8 Q3 | LOW — pragmatic default; planner confirms with user |
| A6 | `TargetKcalOz` should be a literal union not `number` | §4, §8 Q1 | LOW — easy to widen later |
| A7 | Test colocation (not `__tests__/`) is the correct convention | Constraints | LOW — confirmed by morphine pattern and MEMORY.md |

All other claims in this research are VERIFIED by reading the source files directly.

## Sources

### Primary (HIGH confidence)
- `src/lib/morphine/calculations.ts` — pattern reference, import style, function shape
- `src/lib/morphine/calculations.test.ts` — parity test pattern, `toBeCloseTo(..., 4)` precedent
- `src/lib/morphine/types.ts` — type export convention
- `src/lib/morphine/morphine-config.json` — JSON config shape
- `src/lib/formula/formula.ts` — legacy inventory for Phase 11, `ML_PER_OZ = 29.57` constant
- `src/lib/formula/formula-config.ts` — validator pattern to port
- `src/lib/formula/state.svelte.ts` — legacy state inventory for Phase 11
- `.planning/REQUIREMENTS.md` — REF-01/02, CALC-01..08, VAL-01/02 verbatim
- `.planning/ROADMAP.md` — Phase 9 success criteria
- `recipe-calculator.xlsx` Calculator tab formulas — provided verbatim in additional_context, manually verified against documented test case

### Secondary
- `/mnt/data/src/nicu-assistant/CLAUDE.md` — project constraints, stack, convention pointers
- `.../memory/MEMORY.md` — test colocation rule

## Metadata

**Confidence breakdown:**
- Pattern reference (morphine layout): HIGH — files read directly
- Existing formula inventory: HIGH — files read directly
- Type design: HIGH — derived from morphine + requirement signatures
- JSON config shape: HIGH — mirrors two existing working configs in this repo
- Calculation algorithm: HIGH — manually verified against the one documented test case to full precision
- Special cases: HIGH — transcribed directly from REQUIREMENTS.md CALC-04/05
- Plan breakdown: MEDIUM — reasonable split, but planner may choose differently

**Research date:** 2026-04-07
**Valid until:** ~2026-05-07 (30 days; the morphine/formula patterns are stable)

## RESEARCH COMPLETE
