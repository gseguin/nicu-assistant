---
phase: 03-calculators
plan: 01
subsystem: calculators
tags: [pert, formula, dosing, clinical-config, sessionStorage, svelte-runes, state-management]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: SvelteKit scaffold with $lib alias, theme.svelte.ts singleton pattern
  - phase: 02-shared-components
    provides: shared types, vitest config, component testing infrastructure
provides:
  - PERT business logic (dosing, medications, clinical-config, tube-feed) in $lib/pert/
  - Formula business logic (formula, formula-config, 32 brand configs) in $lib/formula/
  - pertState singleton with sessionStorage persistence (init/persist/reset)
  - formulaState singleton with sessionStorage persistence (init/persist/reset)
affects: [03-02, 03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [sessionStorage-backed $state singleton, JSON clinical config with runtime validation]

key-files:
  created:
    - src/lib/pert/dosing.ts
    - src/lib/pert/medications.ts
    - src/lib/pert/clinical-config.ts
    - src/lib/pert/clinical-config.json
    - src/lib/pert/tube-feed/clinical-data.ts
    - src/lib/pert/tube-feed/medications.ts
    - src/lib/pert/tube-feed/examples.ts
    - src/lib/pert/state.svelte.ts
    - src/lib/formula/formula.ts
    - src/lib/formula/formula-config.ts
    - src/lib/formula/formula-config.json
    - src/lib/formula/state.svelte.ts
  modified: []

key-decisions:
  - "Import path strategy: $lib/pert/ and $lib/formula/ prefixes for all internal imports; JSON configs use relative imports from same directory"
  - "State singletons follow theme.svelte.ts pattern exactly: $state rune + exported object with get/init/persist/reset"
  - "BMF default baseline EBM calories set to 20 kcal/oz (clinical standard)"

patterns-established:
  - "Calculator state singleton: SESSION_KEY constant + defaultState() factory + $state rune + init/persist/reset methods"
  - "sessionStorage only accessed inside function bodies, never at module level (SSR safety)"

requirements-completed: [PERT-01, PERT-02, PERT-03, PERT-04, FORM-01, FORM-02, FORM-03, FORM-04, CC-01, CC-02]

# Metrics
duration: 6min
completed: 2026-04-01
---

# Phase 3 Plan 1: Calculator Business Logic Summary

**PERT dosing logic (7 files) and formula recipe logic (3 files) ported with adapted imports, plus sessionStorage-backed state singletons for both calculators**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-01T07:11:18Z
- **Completed:** 2026-04-01T07:17:14Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Ported all 7 PERT business logic files (dosing, medications, clinical-config, tube-feed modules) with $lib/pert/ import paths
- Ported all 3 formula business logic files (formula, formula-config with 32 brands, JSON config) with $lib/formula/ import paths
- Created pertState and formulaState singletons following theme.svelte.ts pattern with sessionStorage persistence
- Zero TypeScript errors, full build succeeds with no SSR/prerender issues

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy PERT business logic into src/lib/pert/** - `a468569` (feat)
2. **Task 2: Copy formula business logic into src/lib/formula/** - `b4e5c6a` (feat)
3. **Task 3: Create pertState and formulaState sessionStorage singletons** - `7f64695` (feat)

## Files Created/Modified
- `src/lib/pert/dosing.ts` - Core PERT dosing formula (calculateCapsules, validateFatGrams, calculateTotalLipase, resolveOptionLabel)
- `src/lib/pert/medications.ts` - FDA medication brands and strengths (MEDICATIONS, getStrengthsForBrand, LIPASE_RATES)
- `src/lib/pert/clinical-config.ts` - Clinical config parser with runtime validation
- `src/lib/pert/clinical-config.json` - Medications, lipase rates, formulas, validation messages
- `src/lib/pert/tube-feed/clinical-data.ts` - Tube feed medication data (TUBE_FEED_MEDICATIONS)
- `src/lib/pert/tube-feed/medications.ts` - Tube feed medication helpers (getTubeFeedStrengthsForBrand)
- `src/lib/pert/tube-feed/examples.ts` - Tube feed clinical examples for validation
- `src/lib/pert/state.svelte.ts` - pertState singleton (init/persist/reset, SESSION_KEY='nicu_pert_state')
- `src/lib/formula/formula.ts` - Recipe calculations (calculateRecipe, calculateBMF, validateRecipeInputs, validateBMFInputs)
- `src/lib/formula/formula-config.ts` - Brand config parser (32 brands, getBrandById, getBrandByName)
- `src/lib/formula/formula-config.json` - 32 brand entries with displacement, calories, scoop data
- `src/lib/formula/state.svelte.ts` - formulaState singleton (init/persist/reset, SESSION_KEY='nicu_formula_state')

## Decisions Made
- Import path strategy: all $lib/ imports updated to $lib/pert/ or $lib/formula/ prefix; JSON imports kept relative (./clinical-config.json, ./formula-config.json) since they are in the same directory
- State singletons follow the theme.svelte.ts pattern exactly with $state runes, ensuring consistency across the app
- BMF default baseline set to '20' kcal/oz in formulaState (clinical standard for expressed breast milk)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ran svelte-kit sync to generate .svelte-kit/tsconfig.json**
- **Found during:** Task 1 (PERT file verification)
- **Issue:** TypeScript could not resolve $lib/ paths because .svelte-kit directory did not exist
- **Fix:** Ran `pnpm exec svelte-kit sync` to generate the SvelteKit type declarations
- **Files modified:** .svelte-kit/ (generated, gitignored)
- **Verification:** tsc --noEmit returns zero errors after sync
- **Committed in:** Not committed (generated files are gitignored)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Standard SvelteKit setup step, no scope creep.

## Issues Encountered
None beyond the svelte-kit sync requirement.

## Known Stubs
None - all business logic files are complete with full implementations ported from source apps.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Business logic layer complete, ready for UI component development (Plan 02-04)
- State singletons ready for use in calculator page components
- Both calculators can be wired to UI with init() in onMount and persist() on state changes

---
*Phase: 03-calculators*
*Completed: 2026-04-01*
