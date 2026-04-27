---
phase: 40-favorites-store-hamburger-menu
plan: 01
subsystem: ui
tags: [svelte5, runes, localstorage, favorites, tdd, vitest]

# Dependency graph
requires:
  - phase: 10-navshell-foundation
    provides: CALCULATOR_REGISTRY (source of truth for registry-order sort)
  - phase: 20-shared-components
    provides: theme.svelte.ts / disclaimer.svelte.ts singleton patterns
provides:
  - favorites reactive singleton (persisted localStorage store with D-08 six-step recovery)
  - FAVORITES_MAX=4 code-level cap constant
  - storage contract 'nicu:favorites' { v: 1, ids: CalculatorId[] }
  - 19-case vitest contract covering every recovery + mutation + storage-throw path
affects: [40-02-hamburger-menu, 40-03-layout-wiring, 41-navshell-flip, 42-uac-uvc-calculator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Svelte 5 .svelte.ts singleton with module-scope \\$state + get accessors (mirrors theme/disclaimer)"
    - "D-08 six-step localStorage recovery pipeline (null → parse → shape → filter → cap → sort)"
    - "vi.resetModules() + dynamic import per test — fresh \\$state per case"
    - "vi.spyOn(Storage.prototype, getItem/setItem) to simulate private-browsing throws"

key-files:
  created:
    - src/lib/shared/favorites.svelte.ts
    - src/lib/shared/favorites.test.ts
  modified: []

key-decisions:
  - "persist(_ids) fires unconditionally at the end of toggle() — even on cap no-op. Harmless (same JSON written) and keeps control flow linear."
  - "next: string[] annotation on the toggle insertion line widens the includes() call so CALCULATOR_REGISTRY.map((c) => c.id) (typed string) narrows correctly without adding runtime coercion."
  - "FAV-06 registry-order sort implemented via registryOrder.filter((rid) => next.includes(rid)) — O(n*m) but n=m=4, and this guarantees the output is always canonical regardless of insertion path."

patterns-established:
  - "Per-process module reset for Svelte 5 \\$state tests: beforeEach calls localStorage.clear() + vi.resetModules(); each test dynamically imports the .svelte.js module to rehydrate a fresh rune proxy."
  - "Six-step recovery idiom for richer localStorage payloads (vs disclaimer's single-string approach) — null-check → JSON.parse in try/catch → shape validate (typeof + v + Array.isArray) → filter by registry set → cap slice → empty-guard → registry-order re-sort."

requirements-completed: [FAV-03, FAV-04, FAV-06, FAV-07, FAV-TEST-01]

# Metrics
duration: ~15min
completed: 2026-04-23
---

# Phase 40 Plan 01: Favorites Store Summary

**Svelte 5 runes singleton with localStorage persistence, D-08 schema-safe recovery, FAV-06 registry-order sort, and 19-case vitest contract — consumed by HamburgerMenu (Plan 02), wired via +layout.svelte (Plan 03), and flipped into by NavShell in Phase 41.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-23T19:39:40Z (approx — worktree reset + install)
- **Completed:** 2026-04-23T19:54:50Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files created:** 2
- **Files modified:** 0

## Accomplishments

- Ship `favorites` singleton (`get current` / `count` / `isFull` / `initialized` / `has` / `canAdd` / `toggle` / `init`) backed by `$state<CalculatorId[]>` + `$state(false)` initialization flag, exposed via `get` accessors so consumers re-render on mutation.
- Ship `FAVORITES_MAX = 4` code-level constant per D-11 (cap is a UX constraint tied to the 375px mobile bottom-bar, not a clinical parameter).
- Ship the D-08 six-step recovery pipeline so stored payloads that are malformed (JSON parse throws), missing `v`, wrong schema version, have non-array `ids`, contain unknown calculator ids, or reduce to an empty list all silently fall back to the registry-derived defaults.
- Ship private-browsing resilience: `localStorage.getItem` throws fall through to defaults on init; `localStorage.setItem` throws never crash `toggle()` — in-memory state still mutates.
- Ship 19 co-located vitest cases covering the full T-01..T-19 contract specified in 40-RESEARCH.md §"Code Examples" lines 808–983.

## Task Commits

Each task was committed atomically (TDD RED → GREEN):

1. **Task 1 RED: failing favorites unit tests** — `fc49677` (test)
2. **Task 1 GREEN: favorites singleton implementation** — `59927d6` (feat)

REFACTOR commit skipped — helpers already factored (defaultIds / validIds / recover / persist) and no dead code surfaced.

## Files Created/Modified

- `src/lib/shared/favorites.svelte.ts` — Svelte 5 runes singleton. Module-scope `let _ids = $state<CalculatorId[]>([])` + `let _initialized = $state(false)`. Exports `FAVORITES_MAX` and `favorites`. Helpers `defaultIds()`, `validIds()`, `recover()`, `persist()` keep `init()` + `toggle()` readable.
- `src/lib/shared/favorites.test.ts` — Co-located vitest file (NOT inside `__tests__/` per project memory `feedback_test_colocation.md`). 19 `it('T-NN ...')` cases, `beforeEach` clears storage + `vi.resetModules()`, every test dynamically imports `./favorites.svelte.js` to get a fresh rune proxy, T-18/T-19 simulate storage throws via `vi.spyOn(Storage.prototype, ...)` + `spy.mockRestore()`.

## Decisions Made

**Under Claude's Discretion** (from 40-CONTEXT.md §"Claude's Discretion"):

- **Unconditional `persist()` at end of `toggle()`.** The spec allows both unconditional and branched persistence. I chose unconditional because (a) the only state where `toggle()` changes nothing is cap-full-and-id-not-present — writing the current `_ids` back is a no-op that serializes the same JSON already in storage; (b) it removes a branch from the mutator and keeps reasoning about "every toggle persists" trivial; (c) it matches the theme.svelte.ts `set()` pattern where persistence is a sibling to the assignment, not gated on whether the value changed.
- **No write throttling/batching.** For a 4-max set with human-driven toggle frequency, per-toggle write is fine. Revisit only if profiling surfaces it.

**Under spec discretion** (plan explicitly listed):

- `src/lib/shared/types.ts` left untouched — `CalculatorId` union already matches registry ids exactly.
- `src/test-setup.ts` left untouched — jsdom ships a sufficient `localStorage` implementation; no new polyfill needed for these tests.
- `src/lib/shared/__tests__/shared-components.test.ts` left untouched — new tests co-locate; the legacy placement of disclaimer/NumericInput tests is not migrated (out of scope).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] TypeScript narrowing error on `toggle()` re-sort**

- **Found during:** Task 1 GREEN (initial svelte-check run)
- **Issue:** `svelte-check` reported `src/lib/shared/favorites.svelte.ts 103:55 "Argument of type 'string' is not assignable to parameter of type 'CalculatorId'."` on the line `_ids = registryOrder.filter((rid) => next.includes(rid)) as CalculatorId[];`. TypeScript inferred `next` as `CalculatorId[]` from the spread `[..._ids, id]`, and `Array.prototype.includes` on that narrower array refused the `string` parameter `rid` (coming from `CALCULATOR_REGISTRY.map((c) => c.id)` where `c.id: string`).
- **Fix:** Annotated the intermediate array as `const next: string[] = [..._ids, id];`. Zero runtime change — both `CalculatorId` and `string` are represented as JS strings. The widening shuts the narrowing error without weakening the outer `as CalculatorId[]` cast on the result.
- **Files modified:** `src/lib/shared/favorites.svelte.ts` (line 102)
- **Verification:** `pnpm check` → `0 ERRORS 0 WARNINGS`. Tests still pass 19/19.
- **Committed in:** `59927d6` (GREEN commit — fix landed in the same commit before the initial GREEN was recorded, so the history shows a single clean implementation)

---

**Total deviations:** 1 auto-fixed (1 blocking / Rule 3)
**Impact on plan:** The fix is a one-token type annotation; no architectural deviation, no new dependencies, no test changes. Plan spec unchanged.

## Issues Encountered

- **Node modules missing in worktree.** The freshly-created worktree had no `node_modules/`. Resolved with `pnpm install` (standard — not a plan deviation).
- **Initial `Write` tool landed a file outside the worktree.** First attempt to write the test file resolved the absolute path to the main-repo tree (`/mnt/data/src/nicu-assistant/src/...`) rather than the worktree (`/mnt/data/src/nicu-assistant/.claude/worktrees/agent-aa3d696d/src/...`). Caught via `pnpm test:run` reporting "No test files found", recovered by moving the file into the worktree and cleaning the stray copy from the main-repo tree. No commits polluted the main branch.

## User Setup Required

None — pure library code, no env vars, no dashboard configuration.

## Next Phase Readiness

**Ready for Plan 02 (HamburgerMenu).** The `favorites` API is stable, fully typed, and proven by 19 tests. Plan 02 can import:

```ts
import { favorites, FAVORITES_MAX } from '$lib/shared/favorites.svelte.js';
```

and rely on `favorites.current` / `favorites.has(id)` / `favorites.canAdd(id)` / `favorites.toggle(id)` / `favorites.isFull` without defensive validation.

**Blockers for Plan 03 (layout wiring):** None. `favorites.init()` must be called from `+layout.svelte onMount` (per the `// Called in +layout.svelte onMount` comment in the source) — Plan 03 owns that single-line diff.

**Blockers for Phase 41 (NavShell flip):** None. The readonly contract on `favorites.current` guarantees NavShell cannot mutate from a render path, and the registry-order invariant means bottom-bar ordering is fully determined by the store without extra client-side sort.

## Verification Run (at close)

- `pnpm test:run src/lib/shared/favorites.test.ts` → `Test Files 1 passed (1)` / `Tests 19 passed (19)`
- `pnpm check` → `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `pnpm build` → `✓ built in 8.02s` / PWA precache 40 entries / adapter-static wrote `build/`
- `git diff --stat src/lib/shell/NavShell.svelte src/routes/+layout.svelte` → empty (D-OUT-01 phase boundary preserved)
- `ls src/lib/shared/__tests__/favorites*` → no matches (co-location preserved)

## Self-Check: PASSED

- FOUND: `src/lib/shared/favorites.svelte.ts`
- FOUND: `src/lib/shared/favorites.test.ts`
- FOUND commit: `fc49677` (test RED)
- FOUND commit: `59927d6` (feat GREEN)

## TDD Gate Compliance

- RED gate: `fc49677 test(40-01): add failing favorites store unit tests (RED)` — test file created first, run confirmed failure on missing module import.
- GREEN gate: `59927d6 feat(40-01): implement favorites reactive singleton (GREEN)` — implementation added, 19/19 tests pass.
- REFACTOR gate: skipped intentionally. Helpers (`defaultIds`, `validIds`, `recover`, `persist`) were already extracted in the initial GREEN commit; no additional cleanup surfaced.

---

*Phase: 40-favorites-store-hamburger-menu*
*Plan: 01*
*Completed: 2026-04-23*
