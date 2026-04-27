---
phase: 41-favorites-driven-navigation
plan: 01
subsystem: ui
tags: [svelte5, sveltekit, favorites, navigation, vitest, component-tests]

# Dependency graph
requires:
  - phase: 40-favorites-store-hamburger-menu
    provides: favorites.svelte.ts store with current getter, init(), toggle(), and D-08 recovery pipeline
provides:
  - NavShell.svelte rendering both nav bars from favorites.current instead of CALCULATOR_REGISTRY
  - favorites.svelte.ts module-scope default seed (D-07) so first paint shows 4 tabs without init()
  - NavShell T-01..T-06 component render tests
  - favorites.test.ts T-20 D-07 regression guard
  - navigation.spec.ts beforeEach nicu:favorites pre-clear guard
affects:
  - 41-02-plan (Playwright E2E + axe) — depends on favorites-driven NavShell being green

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Favorites-driven nav: visibleCalculators $derived from favorites.current mapped through byId Map"
    - "Registry-driven activeCalculatorId: CALCULATOR_REGISTRY.find() instead of hardcoded ternary (D-05)"
    - "Module-scope seed: $state initialized with defaultIds() for synchronous first paint (D-07)"
    - "Component test isolation: localStorage.clear() + favorites.init() in beforeEach (no vi.resetModules)"
    - "Worktree test execution: npx vitest run from worktree dir (pnpm test:run runs from main project)"

key-files:
  created:
    - src/lib/shell/NavShell.test.ts (T-01..T-06 — augmented from existing source-analysis tests)
  modified:
    - src/lib/shell/NavShell.svelte
    - src/lib/shared/favorites.svelte.ts
    - src/lib/shared/favorites.test.ts (T-20 appended)
    - e2e/navigation.spec.ts (beforeEach guard added)

key-decisions:
  - "D-07 seed applied at module scope: _ids = $state(defaultIds()) ensures NavShell renders correct tabs on first synchronous paint before any onMount fires"
  - "D-05 registry-driven activeCalculatorId: undefined on non-calculator routes; AboutSheet receives ?? 'morphine-wean' fallback at call site (D-06)"
  - "D-01 byId Map built once at module scope from static CALCULATOR_REGISTRY — typed Map<string, CalculatorEntry> because id is string not CalculatorId"
  - "T-05 queries bottom nav specifically (not container) because both desktop + mobile bars render tabs (6 total with 3 favorites, not 3)"

patterns-established:
  - "visibleCalculators pattern: favorites.current.map(id => byId.get(id)).filter(c => c !== undefined) — used in both {#each} loops"
  - "NavShell component tests use vi.mock('$app/state') with mutable mockPage object; override pathname per-test"

requirements-completed: [NAV-FAV-01, NAV-FAV-02, NAV-FAV-03, NAV-FAV-04]

# Metrics
duration: 10min
completed: 2026-04-23
---

# Phase 41 Plan 01: NavShell Favorites-Driven Rendering Summary

**NavShell flipped from CALCULATOR_REGISTRY to favorites.current for both nav bars, with registry-driven activeCalculatorId, module-scope default seed, and 7 new tests (T-01..T-06 + T-20)**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-23T21:03:00Z
- **Completed:** 2026-04-23T21:13:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- NavShell now renders only favorited calculators in both desktop top nav and mobile bottom bar via `visibleCalculators` $derived from `favorites.current`
- Replaced hardcoded 4-branch ternary with `CALCULATOR_REGISTRY.find()` (D-05) — activeCalculatorId is `CalculatorId | undefined`, AboutSheet gets `?? 'morphine-wean'` fallback
- `favorites.svelte.ts` seeds `_ids` to `defaultIds()` at module scope so first synchronous paint shows 4 tabs before `onMount` fires (D-07)
- 7 new tests: NavShell T-01..T-06 component render tests + favorites T-20 D-07 regression guard
- navigation.spec.ts guarded with `addInitScript` pre-clearing `nicu:favorites` before each E2E test

## Task Commits

1. **Task 1: NavShell visibleCalculators + activeCalculatorId + favorites seed** - `eebb883` (feat)
2. **Task 2: NavShell.test.ts T-01..T-06 + favorites.test.ts T-20 + navigation.spec.ts guard** - `d171a00` (test)

## Files Created/Modified

- `src/lib/shell/NavShell.svelte` — added favorites import, byId Map, visibleCalculators $derived, registry-driven activeCalculatorId, flipped both {#each} loops, fixed AboutSheet call site
- `src/lib/shared/favorites.svelte.ts` — one-line D-07 seed: `$state<CalculatorId[]>(defaultIds())`
- `src/lib/shell/NavShell.test.ts` — augmented with T-01..T-06 component render tests (appended to existing source-analysis describe block)
- `src/lib/shared/favorites.test.ts` — T-20 appended as separate describe block
- `e2e/navigation.spec.ts` — beforeEach `addInitScript` pre-clears `nicu:favorites`

## Decisions Made

- D-07 module-scope seed: `$state(defaultIds())` rather than `[]` ensures no flash of empty nav before `onMount`
- D-05 registry-driven derivation: `undefined` on `/` or unknown routes, removing the implicit `'morphine-wean'` default from activeCalculatorId (it's now only in the AboutSheet fallback)
- Component tests query `nav[aria-label="Calculator navigation"]:last-of-type` (bottom nav) specifically — both nav bars render tabs so querying `:last-of-type` isolates the mobile bar

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] T-05 query scope: queried container instead of bottom nav for tab count**
- **Found during:** Task 2 (NavShell.test.ts T-01..T-06)
- **Issue:** Plan's T-05 test asserted `allTabs` length of 3, but NavShell renders both a desktop nav and mobile nav — both have `[role="tab"]` elements, yielding 6 total (not 3) when 3 favorites are set
- **Fix:** Changed T-05 to query `nav[aria-label="Calculator navigation"]:last-of-type` (bottom nav only) for the length assertion, consistent with T-01/T-02/T-06
- **Files modified:** `src/lib/shell/NavShell.test.ts`
- **Verification:** T-05 now passes; `aria-selected` check on bottom nav tabs only
- **Committed in:** `d171a00` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test query scope bug)
**Impact on plan:** Minor test fix. No scope change. Behavior verified correctly.

## Issues Encountered

- Tests must be run from the worktree directory (`npx vitest run`) not the main project (`pnpm test:run` from `/mnt/data/src/nicu-assistant`) — the main project's vitest reads its own source files, not the worktree's. The full suite passes from worktree: 267 tests (260 pre-existing + 7 new).
- `pnpm check` must be run from the main project (worktree lacks `node_modules/.bin/svelte-kit`). Symlinked node_modules work correctly when run from the main project root against worktree sources.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- NavShell is now fully favorites-driven; Phase 41-02 (Playwright E2E + axe accessibility) can proceed
- T-01..T-06 component tests provide regression coverage for the render-source flip
- navigation.spec.ts guard is in place for E2E stability

---
*Phase: 41-favorites-driven-navigation*
*Completed: 2026-04-23*

## Self-Check: PASSED

Files verified:
- `src/lib/shell/NavShell.svelte` — FOUND (contains `visibleCalculators` in both {#each} loops)
- `src/lib/shared/favorites.svelte.ts` — FOUND (`$state<CalculatorId[]>(defaultIds())`)
- `src/lib/shell/NavShell.test.ts` — FOUND (T-01..T-06 present)
- `src/lib/shared/favorites.test.ts` — FOUND (T-20 present)
- `e2e/navigation.spec.ts` — FOUND (`nicu:favorites` guard present)

Commits verified:
- `eebb883` — FOUND (feat: NavShell + favorites seed)
- `d171a00` — FOUND (test: NavShell T-01..T-06 + T-20 + E2E guard)

Test results: 267 passed (22 test files), 0 failed
Type check: 0 errors, 0 warnings
