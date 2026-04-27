---
phase: 44-kendamil-formula-family
plan: 03
subsystem: fortification
tags:
  - parity-test
  - kendamil
  - kend-test-01
  - calc-02
requirements:
  - KEND-TEST-01
dependencies:
  requires:
    - kendamil-formula-entries
  provides:
    - kendamil-parity-tests
  affects: []
tech-stack:
  added: []
  patterns:
    - hand-computed-parity-expected-via-calc-02-walk
    - tobeCloseTo-precision-4-default
    - derivation-comment-header-per-it-block
key-files:
  created: []
  modified:
    - src/lib/fortification/calculations.test.ts
decisions:
  - Variant order is Organic → Classic → Goat (matches REQUIREMENTS KEND-01/02/03 traceability; Organic locked-in canonical lands first)
  - Helper constants placed above SUGGESTED_RE to group with the other formula helpers (neocate / hmf)
  - Expected `amountToAdd` literals copied verbatim from RESEARCH.md full-precision floats; `toBeCloseTo(value, 4)` matches the existing Neocate VAL-01 / HMF-scoops precision
  - 4-line derivation comment header per it-block (disp/cal/gps → denom → grams → scoops) so the expected value is reproducible from the comment alone
metrics:
  duration: 3 minutes
  tasks-completed: 2
  files-modified: 1
  completed-date: 2026-04-25
commits:
  - 3d40d0a: test(44-03) add Kendamil helper constants to calculations.test.ts
  - 864d1f4: test(44-03) add Kendamil parity describe block (KEND-TEST-01)
---

# Phase 44 Plan 03: Kendamil Parity Tests (KEND-TEST-01) Summary

Added three spreadsheet-parity unit tests (one per Kendamil variant — Organic, Classic, Goat) to `src/lib/fortification/calculations.test.ts`, mirroring the existing HMF-scoops parity test shape. Each test inputs `{ formula: kendamil*, base: 'breast-milk', volumeMl: 180, targetKcalOz: 24, unit: 'scoops' }` and asserts `amountToAdd` against a hand-computed expected value at `toBeCloseTo` precision 4, plus `yieldMl > 180`, `Number.isFinite(exactKcalPerOz)`, and `suggestedStartingVolumeMl` matching `SUGGESTED_RE`.

## Outcome

- 3 helper constants added between the existing `hmf` helper and `SUGGESTED_RE` (lines 8-10): `kendamilOrganic`, `kendamilClassic`, `kendamilGoat`. All cast as `FortificationFormula` matching the existing `neocate` / `hmf` pattern.
- 1 new sibling describe block appended at the end of the file: `'calculateFortification — Kendamil parity (KEND-TEST-01)'` with 3 it-blocks (Organic → Classic → Goat ordering).
- Each it-block carries a 4-line derivation-comment header showing `disp`/`cal`/`gps` → `denom` → `grams` → `scoops` so the expected value is reproducible from the comment alone (mitigates T-44-07 math opacity).

## Per-Variant Hand-Computed Parity Values

| Variant | calorie_concentration | denom (29.57·cal − 0.77·24) | grams (180·4 / denom) | scoops (grams / 4.3) |
|---------|-----------------------|-----------------------------|-----------------------|----------------------|
| Kendamil Organic | 5.12 | 132.9184 | 5.416857259792473 | **1.2597342464633658** |
| Kendamil Classic | 5.21 | 135.5797 | 5.310529526175379 | **1.2350068665524137** |
| Kendamil Goat    | 5.09 | 132.0313 | 5.453252372732829 | **1.268198226216937**  |

All three pass `toBeCloseTo(value, 4)` (≈5e-5 absolute tolerance — well inside the 1% epsilon required by D-09).

## Verification Results

| Check | Outcome |
|-------|---------|
| `pnpm exec vitest run src/lib/fortification/calculations.test.ts` | PASS (12 tests, +3 from baseline 9) |
| `pnpm run check` (`svelte-kit sync && svelte-check`) | PASS (4571 files, 0 errors, 0 warnings) |
| `grep -c "as FortificationFormula"` | 5 (existing 2 + new 3) ✓ |
| `grep -c "describe('calculateFortification — Kendamil parity (KEND-TEST-01)'"` | 1 ✓ |
| `grep -c "Kendamil Organic + breast milk + 180 + 24 + scoops"` | 1 ✓ |
| `grep -c "Kendamil Classic + breast milk + 180 + 24 + scoops"` | 1 ✓ |
| `grep -c "Kendamil Goat + breast milk + 180 + 24 + scoops"` | 1 ✓ |
| `grep -c "toBeCloseTo(1.2597342464633658, 4)"` | 1 ✓ |
| `grep -c "toBeCloseTo(1.2350068665524137, 4)"` | 1 ✓ |
| `grep -c "toBeCloseTo(1.268198226216937, 4)"` | 1 ✓ |
| 4 assertion shapes per it-block (toBeCloseTo + toBeGreaterThan(180) + Number.isFinite + toMatch(SUGGESTED_RE)) | 4 each ✓ |
| Helpers appear above `SUGGESTED_RE` (lines 8-10 vs line 12) | ✓ |

## Vitest Output Excerpt

```
RUN  v4.1.4
Test Files  1 passed (1)
     Tests  12 passed (12)
```

The 3 new it-blocks reported as `calculateFortification — Kendamil parity (KEND-TEST-01) > Kendamil {Organic,Classic,Goat} + breast milk + 180 + 24 + scoops`.

## Whole-Module Vitest Status (Wave-2 Hand-Off)

`pnpm exec vitest run src/lib/fortification/` reports **41 passed, 1 failed**. The single failure is the **expected** Wave-1 → Wave-2 documented hand-off:

- `fortification-config.test.ts:17` — `expect(formulas).toHaveLength(30)` fails with "expected 33 to have length 30"
- This is exactly what 44-01-SUMMARY.md flagged: "The count assertion at `fortification-config.test.ts:17` currently FAILS with 'expected 33 to have length 30'. Plan 44-02 bumps the literal to 33."
- **Plan 44-02 owns this fix** — running concurrently in a sibling Wave-2 worktree. Out of scope per this plan's wave isolation note: "Your only file scope is `src/lib/fortification/calculations.test.ts`."

When all three Wave-2 plans (44-02, 44-03, 44-04) merge back to the integration branch, the whole module goes green. This plan delivered its slice cleanly: `calculations.test.ts` is fully green on its own (12/12).

## Deviations from Plan

### Out-of-scope discoveries (logged, not fixed)

**1. [Out-of-scope, Plan 44-02 ownership] `fortification-config.test.ts:17` count assertion still says `30`**
- **Found during:** Task 2 verification (`pnpm exec vitest run src/lib/fortification/`)
- **Status:** Pre-existing Wave-1 → Wave-2 hand-off, owned by Plan 44-02 (D-11)
- **Action taken:** None. Wave isolation note explicitly limits this plan's file scope to `calculations.test.ts`.

### Worktree integration

The agent worktree was forked from a base commit prior to Wave 1 landing on `main`. Before Task 1, the worktree was rebased onto `main` to pick up the 3 Wave-1 commits (3a0ccd1 + 0d425b0 + 92f13fc) so the Kendamil entries existed for `getFormulaById` lookups. This is normal Wave-2 integration setup (not a deviation from the plan).

### Auto-fixed issues

None.

## Authentication Gates

None.

## Known Stubs

None — all three it-blocks call the real `calculateFortification` pure function with real `getFormulaById` lookups against the JSON config; expected values are derived from RESEARCH.md hand math, not hardcoded placeholders.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes. T-44-06 (clinical-value drift) and T-44-07 (math opacity) are mitigated as planned by `toBeCloseTo` against full-precision expected + per-it-block derivation comment.

## Self-Check: PASSED

- FOUND: src/lib/fortification/calculations.test.ts (12 tests, 3 new Kendamil parity it-blocks)
- FOUND: 3d40d0a (test 44-03 helper constants)
- FOUND: 864d1f4 (test 44-03 parity describe block)
- FOUND: describe('calculateFortification — Kendamil parity (KEND-TEST-01)' (line ~157)
- FOUND: kendamilOrganic / kendamilClassic / kendamilGoat at lines 8-10

## Next Plan

Plan 44-04 (Wave 2) extends the Playwright axe sweep with a Kendamil-variant fixture (KEND-TEST-03). Plan 44-02 (Wave 2) bumps the count assertion 30 → 33 and adds the manufacturer-grouping describe block in `fortification-config.test.ts` (KEND-04 / KEND-TEST-02 / KEND-05). All three Wave-2 plans merge back to phase integration, after which the whole `src/lib/fortification/` module + Playwright sweep passes.
