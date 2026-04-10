---
phase: 37-pure-logic-config-parity-tests
plan: 02
subsystem: feeds/tests
tags: [testing, parity, clinical-correctness, config-validation]
dependency_graph:
  requires: [37-01]
  provides: [feeds-parity-tests, feeds-config-tests]
  affects: [src/lib/feeds/]
tech_stack:
  added: []
  patterns: [closeEnough-epsilon, fixture-locked-parity, parameter-matrix]
key_files:
  created:
    - src/lib/feeds/feeds-parity.fixtures.json
    - src/lib/feeds/calculations.test.ts
    - src/lib/feeds/feeds-config.test.ts
key_decisions:
  - "Used GIR test pattern (closeEnough with 1% epsilon + ABS_FLOOR) for feeds parity tests"
  - "Hand-calculated dual-dextrose fixture (10%/50ml + 7.5%/30ml = 24.65 kcal) for P2 regression prevention"
metrics:
  duration: 169s
  completed: "2026-04-10T04:55:12Z"
  tasks: 2
  files_created: 3
  tests_added: 30
---

# Phase 37 Plan 02: Feeds Parity Tests + Config Shape Summary

Spreadsheet-parity fixtures and tests locking all feeds calculation functions to `nutrition-calculator.xlsx` Sheet1 and Sheet2 values within 1% epsilon, plus parameter-matrix internal consistency and config shape validation.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `2482001` | feeds-parity fixture with xlsx canonical values |
| 2 | `a5bf788` | parity tests, parameter matrix, config shape tests |

## What Was Done

### Task 1: feeds-parity.fixtures.json
Created canonical fixture file with hand-extracted xlsx values:
- **Sheet1** (full nutrition): weight 1.74, enteral 200ml/24kcal/oz -> 160 enteralKcal, 91.954 totalKcalPerKgDay, 147.126 mlPerKg
- **Sheet2** (bedside advancement): weight 1.94, trophic q4h(/6) -> 6.467 ml/feed, advance q3h(/8) bid(/2) -> 3.6375 ml/feed, goal q3h(/8) -> 38.8 ml/feed
- **Sheet2 IV backfill**: totalFluids 12, enteral 9, q3h -> 9 ml/hr
- **Dual-dextrose** (hand-calculated): dex1=10%/50ml + dex2=7.5%/30ml -> 24.65 kcal (P2 regression prevention)
- `_cellRefs` documenting exact xlsx cell addresses for audit trail

### Task 2: calculations.test.ts + feeds-config.test.ts
Created comprehensive test suite following GIR test patterns:
- **Sheet2 parity** (5 tests): trophicMlPerFeed, advanceStepMlPerFeed, goalMlPerFeed, ivBackfillRate, calculateBedsideAdvance aggregator
- **Sheet1 parity** (4 tests): enteralKcal, dextroseKcal (zero case), lipidKcal (zero case), calculateFullNutrition (totalKcalPerKgDay, mlPerKg, autoAdvanceMlPerFeed)
- **Dual dextrose** (2 tests): both TPN lines non-zero summation, full nutrition integration
- **Parameter matrix** (5 tests): all 10 frequency x cadence combos produce positive results, frequency changes feedsPerDay, relative vs absolute cadence behavior, every-3rd non-integer case (P10), algebraic identity verification
- **Advisory checking** (6 tests): trophic-exceeds-advance trigger/non-trigger, dextrose-high, total-kcal-high, mode filtering (bedside/full-nutrition isolation)
- **Config shape** (7 tests): defaults match xlsx, all input ranges min < max, frequency/cadence dropdown validation, advisory field requirements, getFrequencyById/getCadenceById resolution, resolveAdvanceEventsPerDay for relative and absolute

## Verification

- `pnpm test -- --run src/lib/feeds/`: 215/215 passed
- `pnpm test -- --run`: 215/215 passed (zero regressions)
- All parity tests pass within 1% epsilon
- Parameter matrix covers all 10 frequency x cadence combinations
- Config shape validates all inputs, dropdowns, and advisories

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
