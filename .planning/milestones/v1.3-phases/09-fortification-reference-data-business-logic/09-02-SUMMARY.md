---
phase: 09-fortification-reference-data-business-logic
plan: 02
subsystem: fortification
tags: [calculations, pure-function, spreadsheet-parity, tdd]
requires: [09-01]
provides:
  - calculateFortification
  - src/lib/fortification/calculations.ts
affects: []
tech-stack:
  added: []
  patterns: [pure-function, branch-tagged-inverse, single-helper-gramsAdded]
key-files:
  created:
    - src/lib/fortification/calculations.ts
    - src/lib/fortification/calculations.test.ts
  modified: []
decisions:
  - "packets gramsAdded uses scoops branch (amount * grams_per_scoop) per B-4 — no HMF packet-mass constant"
  - "Branch tag drives the SSV inverse so general/shortcut/packets paths each use their own back-calculation"
  - "IFERROR parity: invalid/zero inputs return {0, 0, 0, '0 (0 oz)'} as a hard literal"
metrics:
  duration: ~5min
  completed: 2026-04-07
---

# Phase 9 Plan 02: calculateFortification Summary

Pure `calculateFortification(inputs)` matching the recipe-calculator.xlsx Calculator tab to spreadsheet parity, with TDD coverage for every unit type, every special case, and the documented Neocate reference.

## What Was Built

- `src/lib/fortification/calculations.ts` (188 lines, vs morphine/calculations.ts 77 lines — larger because of branch tagging + SSV inverse)
- `src/lib/fortification/calculations.test.ts` (9 tests, all passing)

## gramsAdded Helper (B-4 confirmation)

```ts
function gramsAdded(amount, unit, formula) {
  switch (unit) {
    case 'grams':       return amount;
    case 'scoops':      return amount * formula.grams_per_scoop;
    case 'packets':     return amount * formula.grams_per_scoop; // packets == scoops branch
    case 'teaspoons':   return amount * 2.5;
    case 'tablespoons': return amount * 7.5;
  }
}
```

Single source of truth for the gram mass driving both `yieldMl` and `exactKcalPerOz`. No HMF packet-mass constant — Similac HMF's `grams_per_scoop = 5` (from 09-01 config) is the ground truth.

## Documented Neocate Case (VAL-01)

Inputs: Neocate Infant + breast milk + 180 mL + 24 kcal/oz + teaspoons.

| Field                       | Computed                | Asserted                          |
| --------------------------- | ----------------------- | --------------------------------- |
| amountToAdd (tsp)           | 2 (BM+Tsp+24 shortcut)  | `toBe(2)`                          |
| gramsAdded (g)              | 5.0 (= 2 × 2.5)         | (intermediate)                    |
| yieldMl                     | 183.5 (= 180 + 5×0.7)   | `toBeCloseTo(183.5, 4)`            |
| exactKcalPerOz              | **23.510166212534063**  | `toBeCloseTo(23.5101662125341, 4)` |
| suggestedStartingVolumeMl   | "180 (6.1 oz)"          | `toBe('180 (6.1 oz)')`             |

The computed kcal/oz `23.510166212534063` matches the manually-verified reference `23.5101662125341` to 13 decimals.

## Test Coverage

9 tests across 5 describe blocks:

1. **Documented case (VAL-01):** 1 test — Neocate exact-match.
2. **Packets special case (CALC-04):** 3 tests — HMF@24 → 7.2, HMF@22 → 3.6, non-HMF → 0.
3. **BM+Tsp shortcut (CALC-05):** 1 test — Neocate BM+22 → 1 (BM+24 covered by documented case).
4. **General formula + units (CALC-02/03):** 3 tests — grams (water, baseKcal=0), scoops (HMF BM 24), tablespoons (Neocate BM 26).
5. **Invalid input (IFERROR):** 1 test — volumeMl=0 → zero result with `'0 (0 oz)'`.

Every unit type (grams, scoops, teaspoons, tablespoons, packets) has at least one assertion. Invariants asserted: `yieldMl >= volumeMl`, `exactKcalPerOz` finite, suggested-volume regex match.

## Deviations

None. Plan executed exactly as written.

## Verification

- `npx vitest run src/lib/fortification/calculations.test.ts` → 9/9 passing
- `npx vitest run` → **170/170 passing** (full v1.2 + Phase 9 suite, no regressions — VAL-02 satisfied)
- `npx tsc --noEmit` → 3 pre-existing errors in `src/lib/shell/NavShell.test.ts` (fs/path/__dirname) carried over from v1.2; explicitly noted in execution context as out-of-scope. **No new tsc errors introduced by this plan.** The fortification module compiles cleanly.

## Requirements Closed

CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08, VAL-01, VAL-02.

## Self-Check: PASSED

- `src/lib/fortification/calculations.ts` — FOUND
- `src/lib/fortification/calculations.test.ts` — FOUND
- Commit `16ed66d` — FOUND
