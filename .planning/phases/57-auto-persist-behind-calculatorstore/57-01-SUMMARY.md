---
phase: 57-auto-persist-behind-calculatorstore
plan: "01"
subsystem: ui
tags: [svelte5, runes, effect.root, localStorage, calculator-store, persistence]

# Dependency graph
requires:
  - phase: 56-last-edited-persistence-seam
    provides: LastEdited class with seam-backed PersistentValue and 60s STAMP_DEBOUNCE_MS

provides:
  - CalculatorStore constructor with $effect.root() auto-persist (one canonical location)
  - 3 new regression tests pinning auto-persist, drawer-only-mount path, 60s debounce
  - Zero per-fragment persist effects in any *Inputs.svelte file

affects: [58-release-v1-18-0]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "$effect.root() inside class constructor for singleton-lifetime reactive effects"
    - "SSR guard form: typeof localStorage !== 'undefined' wrapping the block (matches persist/reset)"
    - "async test idiom: await tick() from 'svelte' to flush Svelte 5 batch scheduler"
    - "Spy-after-construction pattern: install setItem spy post-construction to exclude benign initial write"

key-files:
  created: []
  modified:
    - src/lib/shell/calculator-store.svelte.ts
    - src/lib/shell/calculator-store.test.ts
    - src/lib/gir/GirInputs.svelte
    - src/lib/morphine/MorphineWeanInputs.svelte
    - src/lib/fortification/FortificationInputs.svelte
    - src/lib/feeds/FeedAdvanceInputs.svelte
    - src/lib/uac-uvc/UacUvcInputs.svelte

key-decisions:
  - "$effect.root() return value intentionally discarded — singleton lives app lifetime, no cleanup needed (D-07)"
  - "SSR guard uses wrapping form (typeof localStorage !== 'undefined') not early-return form — matches persist()/reset() style (D-08)"
  - "Auto-persist placed after this.init() so order is: restore-from-storage → install-effect → return"
  - "Existing tests confirmed: 11 pre-existing tests (plan said 10 — actual count); total 14 after 3 new"

patterns-established:
  - "$effect.root(() => $effect(...)) pattern for class-level reactive effects outside component context"
  - "TDD RED-then-GREEN: tests committed before implementation (b795bc2 RED, then 32e137d GREEN)"

requirements-completed: [AUTO-01, AUTO-02]

# Metrics
duration: 4min
completed: 2026-05-29
---

# Phase 57 Plan 01: Auto-Persist Behind CalculatorStore Summary

**$effect.root() auto-persist folded into CalculatorStore constructor, eliminating 5 identical per-fragment effects from all *Inputs.svelte files, preserving drawer-only-mount persistence and 60s debounce invariants**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-29T20:17:12Z
- **Completed:** 2026-05-29T20:21:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `$effect.root(() => $effect(() => { JSON.stringify(this.current); this.persist(); }))` to `CalculatorStore` constructor, wrapped in `typeof localStorage !== 'undefined'` SSR guard, placed after `this.init()`
- Wrote 3 new async tests (TDD RED-then-GREEN: tests committed before constructor change) pinning auto-persist mutation trigger, drawer-only-mount path, and 60s debounce no-re-stamp behavior
- Deleted the identical persist effect + preceding comment from all 5 `*Inputs.svelte` files — persistence is now a class-level invariant of the store, not a component responsibility

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing tests for CalculatorStore auto-persist** - `b795bc2` (test)
2. **Task 1 GREEN: Add $effect.root auto-persist to CalculatorStore constructor** - `32e137d` (feat)
3. **Task 2: Delete per-fragment persist effects from 5 *Inputs.svelte files** - `a3e3768` (refactor)

## Files Created/Modified

- `src/lib/shell/calculator-store.svelte.ts` - Constructor gains 11-line `$effect.root()` auto-persist block after `this.init()`
- `src/lib/shell/calculator-store.test.ts` - Added `import { tick } from 'svelte'` + new describe block with 3 async tests
- `src/lib/gir/GirInputs.svelte` - Deleted lines 22-27 (comment + persist effect)
- `src/lib/morphine/MorphineWeanInputs.svelte` - Deleted lines 19-24 (comment + persist effect)
- `src/lib/fortification/FortificationInputs.svelte` - Deleted lines 132-137 (comment + persist effect, last block before `</script>`)
- `src/lib/feeds/FeedAdvanceInputs.svelte` - Deleted lines 33-38 (comment + persist effect)
- `src/lib/uac-uvc/UacUvcInputs.svelte` - Deleted lines 26-31 (comment + persist effect)

## Decisions Made

- `$effect.root()` return value is intentionally not stored — the singleton lives the app lifetime and cleanup at browser close discards the entire JS context. Storing it would be dead code (D-07).
- SSR guard uses the wrapping form `if (typeof localStorage !== 'undefined') { ... }` to match `persist()` and `reset()`, not the early-return form used by `init()`. Consistency with adjacent code patterns (D-08).
- Note on grep count: `grep -c 'JSON.stringify(this.current)'` returns 2 (not 1 as plan's acceptance check stated) because `persist()` also contains `JSON.stringify(this.current)` in its `localStorage.setItem` call. The new in-effect occurrence is correctly 1. Tests prove the behavior is correct.
- Actual existing test count was 11 (not 10 as plan stated), making total 14 (not 13). This is a pre-existing discrepancy in the plan's count, not a regression.

## Deviations from Plan

None - plan executed exactly as written. The only minor discrepancy was the plan's acceptance criteria grep count of "exactly 1" for `JSON.stringify(this.current)` — this could not be satisfied because persist() also contains that string. The spirit (exactly 1 new effect in the constructor) is satisfied and verified by passing tests.

## Issues Encountered

The worktree environment lacks `node_modules` (shared from the main repo). Running `pnpm vitest run` from the worktree directory fails; the correct invocation uses the main repo's binary: `/home/ghislain/src/nicu-assistant/node_modules/.bin/vitest run --config <worktree>/vite.config.ts`. Similarly for `vite build` and `svelte-check`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 58 (release v1.18.0) is ready. All AUTO-01 and AUTO-02 requirements satisfied.
- `grep -rn 'JSON.stringify.*State\.current' src/lib/**/*Inputs.svelte` returns zero matches (ROADMAP SC-1)
- 3 new tests pin drawer-only-mount persist path and 60s debounce (ROADMAP SC-2, SC-3)
- Full test suite: 451 tests green; svelte-check 0/0; pnpm build OK

---
*Phase: 57-auto-persist-behind-calculatorstore*
*Completed: 2026-05-29*
