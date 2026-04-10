# Phase 37: Pure Logic + Config + Parity Tests - Research

**Researched:** 2026-04-09
**Domain:** Pure calculation functions, configuration, and spreadsheet-parity testing for NICU Feed Advance calculator
**Confidence:** HIGH

## Summary

Phase 37 implements all Feed Advance calculation logic as pure TypeScript functions with zero UI dependencies, locked to `nutrition-calculator.xlsx` Sheet1 (full nutrition) and Sheet2 (bedside advancement). The phase creates `src/lib/feeds/` module files: types, config JSON + typed wrapper, calculation functions, parity fixtures, and comprehensive tests. The GIR module (`src/lib/gir/`) serves as the exact structural template -- every file has a direct parallel.

The domain is well-constrained: two calculation modes (bedside advancement + full nutrition), each with a known formula set from the xlsx. The primary risk is clinical correctness -- getting the formulas wrong or under-testing the dual-TPN-line dextrose summation. The CONTEXT.md decisions (D-01 through D-16) lock every meaningful architectural choice, leaving only internal code organization to Claude's discretion.

**Primary recommendation:** Follow the GIR module structure exactly. Create files in dependency order: types.ts -> feeds-config.json + feeds-config.ts -> calculations.ts -> feeds-parity.fixtures.json -> test files. Gate on `pnpm test` green before declaring phase complete.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Manually extract canonical rows from xlsx into `feeds-parity.fixtures.json` with documented cell references, following GIR precedent
- **D-02:** Sheet2 fixture: weight 1.94 kg, default frequency/cadence. Sheet1 fixture: weight 1.74 kg, defaults from xlsx
- **D-03:** Dual-line TPN uses explicit paired fields: `tpnDex1Pct`/`tpnMl1Hr` and `tpnDex2Pct`/`tpnMl2Hr` (not array, not single field)
- **D-04:** `calculateFullNutrition()` accepts both dex/ml pairs and sums: `((dex1%/100 x ml1) + (dex2%/100 x ml2)) x 3.4`
- **D-05:** Cadence options map to `advance_events_per_day` via config lookup: `every` = frequency-relative, `every-other` = feeds_per_day/2, `every-3rd` = feeds_per_day/3, `bid` = 2 (absolute), `qd` = 1 (absolute)
- **D-06:** Advance-step formula: `weight x advance_ml_kg_d / feeds_per_day / advance_events_per_day`
- **D-07/D-08/D-09:** Advisory thresholds in `feeds-config.json` under `advisories` array; pure function checking, never blocking
- **D-10:** Named constants with JSDoc: DEXTROSE_KCAL_PER_GRAM=3.4, LIPID_KCAL_PER_ML=2, ML_PER_OZ=30, HOURS_PER_DAY=24
- **D-11:** Two trophic frequency options: q4h (6/day) and q3h (8/day)
- **D-12/D-13:** Config follows GIR precedent: defaults, inputs, dropdowns, advisories sections; typed TS wrapper
- **D-14:** Parity tests use ~1% epsilon with `Math.abs(actual - expected) / expected < 0.01`
- **D-15:** Parameter-matrix tests: every frequency x cadence combo, internal consistency (not xlsx-locked)
- **D-16:** Config shape tests: validate ranges, dropdown IDs, advisory fields

### Claude's Discretion
- Internal file organization (import order, function order)
- Whether to split bedside and full-nutrition into separate functions or one with mode parameter
- Epsilon comparison helper: inline or extracted utility
- Whether config tests use snapshot or explicit assertions -- follow GIR pattern

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORE-09 | Bedside calculations match xlsx Sheet2 row-by-row within ~1% epsilon | GIR parity test pattern with `closeEnough()` helper; fixture file with documented cell references |
| FREQ-04 | Advance-step formula: `weight x advance_ml_kg_d / feeds_per_day / advance_events_per_day` | D-05/D-06 lock the formula; config maps cadence to advance_events_per_day |
| FULL-04 | Dextrose kcal = sum of both TPN lines x 3.4 | D-03/D-04 lock dual-line model; PITFALLS.md P2 warns against single-line bug |
| FULL-05 | Full nutrition outputs: ml/kg total, total kcal/kg/d, auto-advance ml/feed | `calculateFullNutrition()` returns result interface with all three |
| FULL-06 | Unit constants are named constants with JSDoc, not magic numbers | D-10 specifies exact names and values |
| FULL-07 | Full nutrition calculations match xlsx Sheet1 row-by-row within ~1% epsilon | Fixture with weight 1.74, both TPN lines non-zero |
| SAFE-06 | Advisory thresholds in `feeds-config.json` under advisories block | D-07/D-08/D-09 define shape and initial entries |
| TEST-01 | Spreadsheet-parity tests for Sheet1 (full nutrition) | GIR `calculations.test.ts` pattern; fixture per D-02 |
| TEST-02 | Spreadsheet-parity tests for Sheet2 (bedside advancement) | GIR `calculations.test.ts` pattern; fixture per D-02 |
| TEST-03 | Parameter-matrix tests for every frequency x cadence combo | Per D-15: internal consistency, not xlsx-locked |
| TEST-04 | Config shape tests for `feeds-config.json` | GIR `gir-config.test.ts` pattern; per D-16 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.9.3 | Type safety for calculation functions | Already in project [VERIFIED: package.json] |
| Vitest | ^4.1.4 | Unit testing framework | Already in project, used by GIR tests [VERIFIED: package.json] |

### Supporting
No new dependencies. Phase 37 is pure TypeScript logic + JSON config + tests. Zero runtime or dev dependencies to add. [VERIFIED: CONTEXT.md D-12, ARCH-07]

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/feeds/
  types.ts                      # Type definitions (state, input ranges, results, dropdowns)
  feeds-config.json             # Clinical config (defaults, inputs, dropdowns, advisories)
  feeds-config.ts               # Typed wrapper over JSON
  feeds-config.test.ts          # Config shape validation tests
  calculations.ts               # Pure calculation functions with JSDoc
  calculations.test.ts          # Parity + parameter-matrix tests
  feeds-parity.fixtures.json    # Canonical xlsx values (Sheet1 + Sheet2)
```

### Pattern 1: Pure Calculation Functions (from GIR precedent)
**What:** Stateless functions that take numeric inputs and return typed result objects. No side effects, no state access, no DOM.
**When to use:** All clinical calculation logic.
**Example:**
```typescript
// Source: src/lib/gir/calculations.ts (existing pattern)
/**
 * Trophic ml per feed.
 *
 * Formula: weight_kg x trophic_ml_kg_d / feeds_per_day
 *
 * Derivation:
 *   trophic_ml_kg_d is the daily target in ml/kg.
 *   Dividing by feeds_per_day converts to per-feed volume.
 */
export function calculateTrophicMlPerFeed(
  weightKg: number,
  trophicMlKgDay: number,
  feedsPerDay: number,
): number {
  return (weightKg * trophicMlKgDay) / feedsPerDay;
}
```

### Pattern 2: Typed Config Wrapper (from GIR precedent)
**What:** JSON file with clinical data, imported and re-exported with TypeScript types via a `.ts` wrapper.
**When to use:** All configuration that drives dropdowns, ranges, and thresholds.
**Example:**
```typescript
// Source: src/lib/gir/gir-config.ts (existing pattern)
import type { FeedsInputRanges, FrequencyOption, CadenceOption, Advisory } from './types.js';
import config from './feeds-config.json';

export const defaults = config.defaults as { /* typed shape */ };
export const inputs: FeedsInputRanges = config.inputs as FeedsInputRanges;
export const frequencyOptions: FrequencyOption[] = config.dropdowns.frequency as FrequencyOption[];
export const cadenceOptions: CadenceOption[] = config.dropdowns.cadence as CadenceOption[];
export const advisories: Advisory[] = config.advisories as Advisory[];
```

### Pattern 3: Parity Fixture File (from GIR precedent)
**What:** JSON file with `input` + `expected` sections, values hand-copied from xlsx with cell references documented.
**When to use:** Spreadsheet parity testing.
**Example:**
```json
{
  "_cellRefs": {
    "sheet2": "Sheet2!B3:B12 (weight 1.94, trophic 20, advance 30, goal 160, q4h, bid)"
  },
  "sheet2": {
    "input": {
      "weightKg": 1.94,
      "trophicMlKgDay": 20,
      "advanceMlKgDay": 30,
      "goalMlKgDay": 160,
      "frequencyId": "q4h",
      "cadenceId": "bid"
    },
    "expected": {
      "trophicMlPerFeed": 6.47,
      "advanceStepMlPerFeed": 4.85,
      "goalMlPerFeed": 51.73,
      "totalFluidsMlHr": 12.93
    }
  }
}
```

### Pattern 4: Epsilon Comparison Helper (from GIR precedent)
**What:** A `closeEnough()` function that handles both relative (1%) and absolute floor comparison.
**When to use:** All parity tests.
**Example:**
```typescript
// Source: src/lib/gir/calculations.test.ts (existing pattern)
const EPSILON = 0.01;
const ABS_FLOOR = 0.15;

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= ABS_FLOOR) return true;
  if (expected === 0) return absDiff < EPSILON;
  return Math.abs(absDiff / expected) <= EPSILON;
}
```

### Pattern 5: Advisory Checking as Pure Function
**What:** A function that takes calculation results + config thresholds and returns triggered advisories. No side effects, no DOM, no blocking.
**When to use:** SAFE-06 advisory threshold checking.
**Example:**
```typescript
export function checkAdvisories(
  results: BedsideResult | FullNutritionResult,
  mode: FeedsMode,
  advisories: Advisory[],
): TriggeredAdvisory[] {
  return advisories
    .filter(a => a.mode === mode || a.mode === 'both')
    .filter(a => evaluateThreshold(results, a))
    .map(a => ({ id: a.id, message: a.message }));
}
```

### Anti-Patterns to Avoid
- **Single TPN dextrose field:** PITFALLS.md P2 warns this silently under-reports kcal. D-03 mandates explicit paired fields.
- **Magic numbers in formulas:** D-10 requires named constants. Never `* 3.4` inline -- always `* DEXTROSE_KCAL_PER_GRAM`.
- **Editing locked fixtures to match new defaults:** PITFALLS.md P1. The xlsx-locked fixtures must NEVER be edited to accommodate code changes. If the locked test fails, the code is wrong.
- **Array for dual dex lines:** D-03 explicitly chose paired scalar fields over array. Do not use `dextroseLines: Array<...>` despite PITFALLS.md P2 suggesting it -- the CONTEXT.md decision supersedes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Epsilon comparison | Custom per-test tolerance logic | Reuse GIR's `closeEnough()` pattern | Proven pattern, handles edge cases (zero values, absolute floor) |
| JSON type assertion | Manual type guards for config | TypeScript `as` assertion in typed wrapper (GIR pattern) | Config is build-time-loaded, shape validated by tests |
| Advisory framework | Complex rule engine | Simple filter + evaluate pattern | D-09 specifies pure function; 3-5 advisories don't need a framework |

## Common Pitfalls

### Pitfall 1: Dual Dextrose Line Omission (PITFALLS.md P2)
**What goes wrong:** Single TPN dextrose input silently under-reports total kcal/kg/d
**Why it happens:** Naive xlsx port reads only one line pair
**How to avoid:** D-03/D-04 mandate explicit dual fields; parity fixture MUST use both lines non-zero
**Warning signs:** Full nutrition kcal/kg/d is suspiciously low in parity test

### Pitfall 2: Fixture Drift (PITFALLS.md P1)
**What goes wrong:** Locked parity fixtures get edited to match new code defaults
**Why it happens:** Developer changes a default, test breaks, developer "fixes" the fixture
**How to avoid:** Comment in fixture file: "Values hand-copied from xlsx. NEVER edit to match code changes."
**Warning signs:** Git diff shows fixture changes alongside calculation changes

### Pitfall 3: Cadence Relative vs Absolute Confusion
**What goes wrong:** `every` cadence uses absolute 1 instead of frequency-relative feeds_per_day
**Why it happens:** Mixing up the two cadence categories (D-05)
**How to avoid:** Config stores a `type: 'relative' | 'absolute'` flag per cadence option; calculation resolves based on type
**Warning signs:** Parameter-matrix tests show wrong advance step for `every` + `q3h` vs `every` + `q4h`

### Pitfall 4: Unit Constant Misapplication (PITFALLS.md P3)
**What goes wrong:** Dextrose constant 3.4 applied to ml instead of grams, or lipid constant applied wrong
**Why it happens:** Sheet1 formula is `dex% / 100 x ml x 3.4` -- the `/100` converts percent to fraction, then `x ml` gives grams, then `x 3.4` gives kcal
**How to avoid:** JSDoc derivation comment on every formula showing dimensional analysis; named constants make units explicit
**Warning signs:** Parity test off by factor of 100

### Pitfall 5: Enteral kcal/oz to kcal/ml Conversion
**What goes wrong:** Forgetting the `/ 30` (ml per oz) conversion when computing enteral kcal from volume in ml
**Why it happens:** Enteral input is kcal/oz but volume is in ml
**How to avoid:** Formula: `enteralMl x enteralKcalPerOz / ML_PER_OZ`; named constant makes the conversion visible
**Warning signs:** Enteral kcal contribution is 30x too high

## Code Examples

### Bedside Advancement Calculation
```typescript
// Pattern from GIR calculations.ts, adapted for feeds
import { HOURS_PER_DAY } from './constants.js';

/**
 * Advance step per feed (ml).
 *
 * Formula: weight_kg x advance_ml_kg_d / feeds_per_day / advance_events_per_day
 *
 * Derivation:
 *   advance_ml_kg_d is the daily advance target in ml/kg.
 *   feeds_per_day comes from frequency (q3h=8, q4h=6).
 *   advance_events_per_day comes from cadence config:
 *     - 'every' = feeds_per_day (advance at every feed)
 *     - 'every-other' = feeds_per_day / 2
 *     - 'every-3rd' = feeds_per_day / 3
 *     - 'bid' = 2 (absolute)
 *     - 'qd' = 1 (absolute)
 *
 * xlsx Sheet2 hardcodes /6/2 = q4h + bid.
 */
export function calculateAdvanceStepMlPerFeed(
  weightKg: number,
  advanceMlKgDay: number,
  feedsPerDay: number,
  advanceEventsPerDay: number,
): number {
  return (weightKg * advanceMlKgDay) / feedsPerDay / advanceEventsPerDay;
}
```

### Full Nutrition Dextrose Calculation
```typescript
import { DEXTROSE_KCAL_PER_GRAM } from './constants.js';

/**
 * Dextrose kcal from both TPN lines.
 *
 * Formula: ((dex1% / 100 x ml1) + (dex2% / 100 x ml2)) x 3.4
 *
 * Derivation:
 *   dex% / 100 converts percentage to fraction.
 *   Fraction x ml gives grams of dextrose.
 *   Grams x 3.4 kcal/g gives kcal.
 *   Sum both lines per xlsx Sheet1 layout.
 *
 * xlsx Sheet1: =B4*B3/100*3.4 + B6*B5/100*3.4
 */
export function calculateDextroseKcal(
  dex1Pct: number,
  ml1: number,
  dex2Pct: number,
  ml2: number,
): number {
  return ((dex1Pct / 100) * ml1 + (dex2Pct / 100) * ml2) * DEXTROSE_KCAL_PER_GRAM;
}
```

### Config Shape Test
```typescript
// Source: src/lib/gir/gir-config.test.ts (existing pattern)
describe('feeds-config shape', () => {
  it('all input ranges have min < max', () => {
    for (const [key, range] of Object.entries(inputs)) {
      expect(range.min, `${key}.min < max`).toBeLessThan(range.max);
      expect(range.step, `${key}.step > 0`).toBeGreaterThan(0);
    }
  });

  it('all frequency options have valid feedsPerDay', () => {
    for (const opt of frequencyOptions) {
      expect(opt.feedsPerDay).toBeGreaterThan(0);
      expect(opt.id).toBeTruthy();
    }
  });

  it('all advisory entries have required fields', () => {
    for (const adv of advisories) {
      expect(adv.id).toBeTruthy();
      expect(adv.field).toBeTruthy();
      expect(['gt', 'lt', 'range']).toContain(adv.comparator);
      expect(adv.message).toBeTruthy();
      expect(['bedside', 'full-nutrition', 'both']).toContain(adv.mode);
    }
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Spreadsheet with hardcoded divisors | Parameterized pure functions with dropdown-driven divisors | This phase | Generalizes xlsx; enables frequency/cadence flexibility |
| Single TPN dextrose field | Explicit dual dex/ml paired fields | D-03 decision | Prevents silent under-reporting of kcal |
| Inline magic numbers | Named constants with JSDoc | D-10 decision | Clinical auditability |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ABS_FLOOR of 0.15 from GIR is appropriate for feeds calculations too | Code Examples | Low -- feeds values are similar magnitude; can adjust if parity tests show systematic small-value issues |
| A2 | The exact xlsx cell values for fixtures will be hand-extracted by the implementer from the xlsx file | Architecture Patterns | Medium -- if xlsx is ambiguous, fixture values may be wrong; but D-01 mandates documented cell references |

## Open Questions

1. **Exact xlsx cell references and values for fixtures**
   - What we know: Weight 1.94 for Sheet2, weight 1.74 for Sheet1, formulas are documented
   - What's unclear: The exact numeric expected values must be read from the xlsx at implementation time
   - Recommendation: Implementer opens xlsx, reads cells, documents references in fixture JSON `_cellRefs` field

2. **Whether to split constants into a separate `constants.ts` file or keep at top of `calculations.ts`**
   - What we know: GIR has no separate constants file (constants are inline in the formula)
   - What's unclear: D-10 specifies 4 named constants which is more than GIR needed
   - Recommendation: Claude's discretion per CONTEXT.md; either approach works, but a separate `constants.ts` is cleaner with 4+ constants

## Project Constraints (from CLAUDE.md)

- **Package manager:** pnpm (not npm despite CLAUDE.md header saying npm -- project uses pnpm)
- **Tech stack:** SvelteKit 2 + Svelte 5 + TypeScript + Vitest
- **Test colocation:** Co-locate test files with source (memory: feedback_test_colocation.md)
- **No new dependencies:** ARCH-07 mandates zero new runtime or dev deps
- **GSD workflow:** Must use GSD commands for execution
- **NumericInput advisory:** Never auto-clamp (v1.6 decision, STATE.md)
- **Spreadsheet parity:** ~1% epsilon (v1.8 decision, STATE.md)

## Sources

### Primary (HIGH confidence)
- `src/lib/gir/calculations.ts` -- Pure function pattern with JSDoc [VERIFIED: codebase read]
- `src/lib/gir/calculations.test.ts` -- Parity test structure with epsilon [VERIFIED: codebase read]
- `src/lib/gir/gir-config.json` -- Config shape pattern [VERIFIED: codebase read]
- `src/lib/gir/gir-config.ts` -- Typed wrapper pattern [VERIFIED: codebase read]
- `src/lib/gir/gir-parity.fixtures.json` -- Fixture structure [VERIFIED: codebase read]
- `src/lib/gir/gir-config.test.ts` -- Config shape test pattern [VERIFIED: codebase read]
- `src/lib/gir/types.ts` -- Type definitions pattern [VERIFIED: codebase read]
- `src/lib/shared/types.ts` -- NumericInputRange, CalculatorId [VERIFIED: codebase read]
- `.planning/phases/37-pure-logic-config-parity-tests/37-CONTEXT.md` -- All 16 locked decisions [VERIFIED: file read]
- `.planning/research/ARCHITECTURE.md` -- Build order, state shape, file list [VERIFIED: file read]
- `.planning/research/FEATURES.md` -- Feature landscape, safety advisories [VERIFIED: file read]
- `.planning/research/PITFALLS.md` -- P1 fixture drift, P2 dual dex, P3 unit confusion [VERIFIED: file read]

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- Requirement definitions and traceability [VERIFIED: file read]
- `.planning/STATE.md` -- Accumulated decisions from prior milestones [VERIFIED: file read]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already in project
- Architecture: HIGH -- direct parallel with GIR module, all patterns verified in codebase
- Pitfalls: HIGH -- documented in PITFALLS.md research, cross-referenced with CONTEXT.md decisions
- Formulas: HIGH -- locked by CONTEXT.md D-04/D-06, xlsx is authoritative reference

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable domain, no external dependency changes expected)
