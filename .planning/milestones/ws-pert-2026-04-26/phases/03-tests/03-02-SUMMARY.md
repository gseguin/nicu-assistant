---
phase: 3
plan: 2
workstream: pert
subsystem: tests
tags: [pert, tests, parity, advisory-engine, calc-layer]
type: execute
wave: 2
requirements_completed:
  - PERT-TEST-01
  - PERT-TEST-02
  - PERT-TEST-04
dependency_graph:
  requires:
    - .planning/workstreams/pert/phases/03-tests/03-01-SUMMARY.md
    - src/lib/pert/calculations.ts
    - src/lib/pert/config.ts
    - src/lib/pert/pert-parity.fixtures.json
  provides:
    - src/lib/pert/calculations.test.ts
  affects:
    - vitest baseline (378 -> 423)
tech_stack:
  added: []
  patterns:
    - inlined-closeEnough-helper (verbatim from src/lib/feeds/calculations.test.ts:23-31)
    - Object.entries fixture iteration with _-prefixed key skip
    - explicit Pitfall 2 field-name mapping at call site
key_files:
  created:
    - src/lib/pert/calculations.test.ts
  modified: []
decisions:
  - Used `any` in fixture-row casts (per plan CRITICAL rule "Cast fixture row to `{ input: any; expected: any }` to avoid TypeScript widening issues with the JSON import"). Initial attempt with `Record<string, number>` failed svelte-check because the row's input contains string-typed `medicationId` / `formulaId`. Fixed in-line to match the plan-specified pattern.
  - Hoisted the `r = row as ...` cast OUT of the inner `it()` callback so the row's `_derivation` string is available to the `it()` title without a nested cast (one cast per row instead of two). Equivalent semantics to the plan template.
  - Block 4 ships 8 advisory tests (plan estimated ~7); added a second weight-out-of-range test for the `< 0.5` lower-bound symmetry alongside the `> 50` upper-bound case. Both come from the same `outside` comparator; coverage is symmetric.
  - Block 3 ships 8 defensive tests (plan estimated ~5); added explicit Infinity-input rows for both Oral and Tube to lock the `Number.isFinite` branch in `calculations.ts:80,82,84,122,124,126,128,130`.
metrics:
  duration: 4m
  tasks_completed: 1
  files_created: 1
  files_modified: 0
  vitest_before: 378
  vitest_after: 423
  vitest_delta: +45
  svelte_check: 0 errors / 0 warnings
  em_dash_count: 0
  en_dash_count: 0
completed: 2026-04-24
---

# Phase 3 Plan 02: calculations.test.ts (parity matrix + advisory engine + PERT-TEST-04 integration delta) Summary

**One-liner:** Locks xlsx-canonical PERT math behavior against the 9 oral + 18 tube hand-derived parity fixtures from Plan 03-01, exercises the `getTriggeredAdvisories` engine including the `stopRedTrigger` STOP-red firing path, and closes the PERT-TEST-04 integration delta beyond Phase 1 `config.test.ts` shape coverage.

## Files Created

- `src/lib/pert/calculations.test.ts` (NEW; 347 lines; 45 vitest cases across 5 describe blocks).

## Files Modified

None. Production code, fixtures, Phase-1-frozen tests, and Wave-1 component tests all unchanged.

## Test Counts per Describe Block

| Block | Describe | Tests |
|-------|----------|------:|
| 1 | `PERT Oral parity (xlsx Pediatric PERT Tool, B10)` | 9 |
| 2 | `PERT Tube-Feed parity (xlsx Pediatric Tube Feed PERT, B14 + B15 + B13)` | 18 |
| 3 | `PERT defensive zero-return` | 8 |
| 4 | `PERT advisory engine - getTriggeredAdvisories` | 8 |
| 5 | `PERT-TEST-04 config-to-calc integration (D-09 delta)` | 2 |
| **Total** | | **45** |

Block 1: 4 closeEnough assertions per row × 9 rows = 36 calc-layer assertions covered by 9 tests.
Block 2: 5 closeEnough assertions per row × 18 rows = 90 calc-layer assertions covered by 18 tests.

## Verification Results

| Gate | Result |
|------|--------|
| `test -f src/lib/pert/calculations.test.ts` | PASS |
| 11 grep gates (imports + closeEnough + fixtures + advisories + PERT-TEST-04) | 11/11 PASS |
| `grep -c "—"` (em-dash ban) | 0 |
| `grep -c "–"` (en-dash ban) | 0 |
| `pnpm test:run src/lib/pert/calculations.test.ts` | 45/45 PASS |
| `pnpm test:run src/lib/pert/config.test.ts src/lib/pert/state.test.ts` (Phase-1 frozen) | 17/17 PASS |
| `pnpm test:run src/lib/pert/` (full PERT scope) | 79/79 PASS |
| `pnpm test:run` (full vitest) | 423/423 PASS (378 baseline + 45 new) |
| `pnpm check` | 0 errors / 0 warnings |
| `git diff --name-only` shows ONLY `src/lib/pert/calculations.test.ts` | PASS |

## Requirement Closure

- **PERT-TEST-01** (oral spreadsheet parity): CLOSED. 9 fixture rows × 4 outputs (capsulesPerDose, totalLipase, lipasePerDose, estimatedDailyTotal), all within EPSILON=0.01 / ABS_FLOOR=0.5.
- **PERT-TEST-02** (tube spreadsheet parity): CLOSED. 18 fixture rows × 5 outputs (capsulesPerDay, totalLipase, totalFatG, lipasePerKg unrounded, capsulesPerMonth), all within tolerance.
- **PERT-TEST-04** (config wiring integration): CLOSED. Combined coverage = Phase 1 `config.test.ts` (11 shape + FDA-allowlist hostile-injection tests) + Phase 3 Block 5 (2 end-to-end wiring tests). Both Block 5 tests carry the inline docstring comment per plan acceptance criteria.

PERT-SAFE-01 calc-side verified: Block 4 test "max-lipase-cap fires for the dedicated stopRedTrigger fixture row (oral)" exercises the `594000 > 20000` cap-violation path on the dedicated `fixtures.stopRedTrigger` row; the negative case "does NOT fire when dailyLipase <= cap" exercises the under-cap path; the severity-DESC ordering test triggers BOTH the cap (stop) AND weight-out-of-range + fat-out-of-range (warning) and confirms ordering.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Type widening] Hoisted fixture-row cast and used `any` per plan CRITICAL rule**
- **Found during:** First svelte-check run after authoring.
- **Issue:** Initial attempt typed the cast as `{ input: Record<string, number>; expected: Record<string, number> }`, which fails svelte-check because the fixture row's `input` object includes string-typed `medicationId` / `formulaId` fields ("Type 'string' is not comparable to type 'number'").
- **Fix:** Cast row to `{ _derivation: string; input: any; expected: any }` per the plan's explicit CRITICAL writing rule ("Cast fixture row to `{ input: any; expected: any }` to avoid TypeScript widening issues with the JSON import — matches feeds/calculations.test.ts patterns"). Hoisted the cast OUT of the `it()` callback so `r._derivation` is available in the `it()` title; one cast per row instead of nested casts.
- **Files modified:** `src/lib/pert/calculations.test.ts` (Block 1 oral, Block 2 tube, Block 4 stopRedTrigger).
- **No production-code or fixture changes.**

No behavioral deviations. No fixture rows skipped. No `closeEnough` slack added. No production code modified.

## Self-Check

**Verifying claims.**

| Claim | Verification | Result |
|-------|--------------|--------|
| `src/lib/pert/calculations.test.ts` exists | `test -f src/lib/pert/calculations.test.ts` | FOUND |
| Test file is 347 lines | `wc -l` = 347 | PASS |
| 45 new tests | vitest stdout "Tests 45 passed (45)" | PASS |
| 423 total vitest | vitest stdout "Tests 423 passed (423)" | PASS |
| 0 em-dash | `grep -c "—"` = 0 | PASS |
| 0 en-dash | `grep -c "–"` = 0 | PASS |
| svelte-check 0/0 | "0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS" | PASS |
| Only test file modified | `git status --short` shows only `?? src/lib/pert/calculations.test.ts` | PASS |
| Phase-1-frozen tests still pass | 17/17 | PASS |

## Self-Check: PASSED

## Ready for Wave 3 (Plan 03-04 e2e tests)

Wave 2 calc-layer + component tests complete. Plan 03-04 (e2e) now has the parity-fixture safety net underneath: any drift in the math layer fails the calc-test before reaching e2e. Vitest baseline for Phase 3 Wave 3 entry: **423 passing**.
