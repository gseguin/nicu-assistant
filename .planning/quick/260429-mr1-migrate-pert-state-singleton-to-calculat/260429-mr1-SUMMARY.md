---
phase: 260429-mr1
plan: 01
subsystem: shell
tags: [svelte5, runes, localstorage, singleton, refactor, calculator-store]

# Dependency graph
requires:
  - phase: 260429-lyq
    provides: CalculatorStore<T> generic class with optional merge option
  - phase: 260429-m79
    provides: First slice migrated (uac-uvc) — proven shape for thin instantiation
  - phase: 260429-mkz
    provides: 4 slices migrated (gir, morphine, feeds, fortification) — final batch before PERT
provides:
  - PERT slice migrated to CalculatorStore<PertStateData> with custom merge
  - Defensive nested-merge contract preserved (oral / tubeFeed sub-objects)
  - All 6 calculator slices now share the same persistence backend
affects:
  - Future commit 5 of the collapse — route shell collapse (CalculatorPage + CalculatorModule)
  - Any future calculator with nested sub-state can copy the PERT pattern verbatim

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom merge option on CalculatorStore<T> for nested sub-objects"
    - "Defensive partial-data merge keeps `oral` / `tubeFeed` intact when stored JSON is incomplete"

key-files:
  created: []
  modified:
    - src/lib/pert/state.svelte.ts

key-decisions:
  - "Used CalculatorStore's `merge` option to preserve the pre-migration defensive nested merge verbatim — no behavior change, no test modification."
  - "Did not modify state.test.ts — it is the regression guard for the merge contract and stayed green as-is."

patterns-established:
  - "Slices with nested sub-objects pass `merge` option to CalculatorStore<T> rather than introducing a deep-clone helper."

requirements-completed: [260429-mr1]

# Metrics
duration: ~3min
completed: 2026-04-29
---

# Phase 260429-mr1: Migrate PERT State Singleton to CalculatorStore<T> with Custom Merge

**80 LOC PertState class collapsed into a 30 LOC CalculatorStore<PertStateData> instantiation that preserves the defensive nested-merge contract for `oral` / `tubeFeed` sub-objects.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-29T16:25:00Z
- **Completed:** 2026-04-29T16:28:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- PERT slice now uses the shared `CalculatorStore<T>` generic backend — completes the 6-slice state-singleton collapse (~451 LOC across 6 hand-written classes → ~167 LOC across 6 thin instances).
- Custom `merge` option on `CalculatorStore` exercised end-to-end: PERT is the only slice that needs it, validating the design from commit 1.
- Existing `state.test.ts` defensive-merge tests (lines 61-82) stay green without modification — the contract is preserved verbatim.
- Storage key `'nicu_pert_state'` preserved → no user-data loss on upgrade. `LastEdited` stamp at `'nicu_pert_state_ts'` derived automatically by `CalculatorStore`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate src/lib/pert/state.svelte.ts to CalculatorStore<PertStateData> with custom merge** - `d092909` (refactor)

**Plan metadata:** TBD (this SUMMARY commit)

## Files Created/Modified
- `src/lib/pert/state.svelte.ts` - Replaced 80 LOC `class PertState` with a 30 LOC `new CalculatorStore<PertStateData>({ ... })` that passes a custom `merge` function for the nested `oral` and `tubeFeed` sub-objects.

## Decisions Made
- Used `CalculatorStore`'s built-in `merge` option (already designed for this case in commit 1) rather than introducing any new abstraction.
- Kept the `defaultState()` factory inline in the file for symmetry with `src/lib/uac-uvc/state.svelte.ts`, `src/lib/feeds/state.svelte.ts`, etc. — every slice's state file has the same shape now.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

- State-singleton collapse fully complete across all 6 slices.
- Commit 5 of 5 (route shell collapse — `CalculatorPage` + `CalculatorModule`) is unblocked.
- No follow-up cleanups required for this commit; consumers (`PertCalculator.svelte`, `PertInputs.svelte`, `+page.svelte`, `calculations.ts`, `config.ts`, `types.ts`) untouched and continue to use the unchanged public API (`pertState.{current,init,persist,reset,lastEdited}`).

## Verification Results

- `pnpm exec vitest run src/lib/pert/` — 5 files, 81 tests passed.
- `pnpm exec vitest run` — 46 files, **481 tests passed** (suite count unchanged from pre-migration).
- `pnpm exec svelte-check` — **0 errors, 0 warnings** (4595 files scanned).
- `git diff --name-only HEAD~1 HEAD` — single file: `src/lib/pert/state.svelte.ts`.

## Self-Check: PASSED

- File exists: `src/lib/pert/state.svelte.ts` — FOUND.
- Code commit `d092909` — FOUND in `git log --oneline`.
- All defensive-merge regression tests green without modification.

---
*Phase: 260429-mr1-migrate-pert-state-singleton-to-calculat*
*Completed: 2026-04-29*
