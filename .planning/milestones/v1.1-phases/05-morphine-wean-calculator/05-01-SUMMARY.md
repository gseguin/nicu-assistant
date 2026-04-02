---
phase: 05-morphine-wean-calculator
plan: 01
subsystem: calculator
tags: [morphine, weaning, clinical-logic, svelte-5, sessionStorage]

# Dependency graph
requires:
  - phase: 03-calculators
    provides: Calculator registration pattern, state.svelte.ts pattern, NavShell
provides:
  - Morphine wean calculation functions (linear + compounding)
  - Morphine state singleton with sessionStorage persistence
  - Morphine types (WeanStep, WeanMode, MorphineStateData)
  - Clinical config JSON with defaults and step count
  - Updated calculator registry with morphine-wean entry
affects: [05-02-PLAN (UI component and route)]

# Tech tracking
tech-stack:
  added: []
  patterns: [JSON config for clinical defaults, config-driven step count]

key-files:
  created:
    - src/lib/morphine/calculations.ts
    - src/lib/morphine/calculations.test.ts
    - src/lib/morphine/types.ts
    - src/lib/morphine/state.svelte.ts
    - src/lib/morphine/morphine-config.json
  modified:
    - src/lib/shell/registry.ts
    - src/lib/shared/types.ts
    - src/lib/shared/about-content.ts
    - src/lib/shared/context.ts
    - src/lib/shell/NavShell.svelte
    - src/lib/shell/__tests__/registry.test.ts
    - src/routes/+page.svelte
    - src/routes/+layout.svelte

key-decisions:
  - "Syringe icon chosen for morphine wean nav entry"
  - "Idle detection updated to compare morphine state against defaults instead of checking empty strings"

patterns-established:
  - "JSON config pattern: clinical defaults stored in morphine-config.json, imported by calculations and state"

requirements-completed: [MORPH-04, MORPH-05, INT-01, INT-02]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 5 Plan 1: Remove PERT and Create Morphine Wean Foundation Summary

**Linear and compounding morphine wean calculations with TDD, config-driven defaults, and complete PERT removal from registry/nav/routes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T20:18:48Z
- **Completed:** 2026-04-02T20:21:48Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Complete removal of PERT calculator (12 files deleted, all references cleared from shell, shared, routes, layout)
- Two morphine wean calculation functions passing 12 tests (linear with clamping, compounding with exponential decay)
- State singleton with sessionStorage persistence following established pattern
- Clinical config JSON with defaults (3.1 kg, 0.04 mg/kg/dose, 10% decrease, 10 steps)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove PERT calculator and update shared types/content** - `36892b7` (feat)
2. **Task 2 RED: Failing tests for morphine wean calculations** - `c47cc96` (test)
3. **Task 2 GREEN: Implement morphine wean calculations and state** - `cf77cfc` (feat)
4. **Deviation fix: Remove remaining PERT references** - `c3d4d5d` (fix)

## Files Created/Modified
- `src/lib/morphine/calculations.ts` - Linear and compounding weaning schedule functions
- `src/lib/morphine/calculations.test.ts` - 12 tests covering both modes + edge cases
- `src/lib/morphine/types.ts` - WeanStep, WeanMode, MorphineStateData types
- `src/lib/morphine/state.svelte.ts` - SessionStorage-backed state singleton
- `src/lib/morphine/morphine-config.json` - Clinical defaults and step count
- `src/lib/shell/registry.ts` - Replaced PERT with morphine-wean entry (Syringe icon)
- `src/lib/shared/types.ts` - CalculatorId updated to 'morphine-wean' | 'formula'
- `src/lib/shared/about-content.ts` - Replaced PERT about with morphine wean about
- `src/lib/shared/context.ts` - Updated fallback calculator ID
- `src/lib/shell/NavShell.svelte` - Updated active calculator default
- `src/lib/shell/__tests__/registry.test.ts` - Updated to expect morphine-wean
- `src/routes/+page.svelte` - Root redirect to /morphine-wean
- `src/routes/+layout.svelte` - Replaced pertState with morphineState for idle detection

## Decisions Made
- Syringe icon selected for morphine wean nav entry (clinical appropriateness)
- Idle detection logic changed from checking empty string inputs to comparing against config defaults (morphine state uses numbers, not strings)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Remaining PERT references in NavShell, layout, context, and registry tests**
- **Found during:** Task 1 verification (post-commit)
- **Issue:** Plan only listed 4 files to update but NavShell.svelte, +layout.svelte, context.ts, and registry.test.ts also referenced PERT
- **Fix:** Updated all four files to reference morphine-wean instead
- **Files modified:** src/lib/shell/NavShell.svelte, src/routes/+layout.svelte, src/lib/shared/context.ts, src/lib/shell/__tests__/registry.test.ts
- **Verification:** grep -r "pert" confirms zero PERT references in shell/shared/routes
- **Committed in:** c3d4d5d

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix to avoid broken imports and stale references. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All calculation logic, types, and state ready for Plan 02 UI component
- Registry updated, route /morphine-wean registered
- Plan 02 can focus entirely on building the Svelte component and route page

---
*Phase: 05-morphine-wean-calculator*
*Completed: 2026-04-02*
