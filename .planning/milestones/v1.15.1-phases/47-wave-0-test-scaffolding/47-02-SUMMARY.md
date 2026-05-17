---
phase: 47-wave-0-test-scaffolding
plan: 02
subsystem: testing
tags: [vitest, jsdom, test-helpers, visualViewport, ios-keyboard, bfcache, framework-neutral]

# Dependency graph
requires:
  - phase: 47-01
    provides: window.visualViewport polyfill installed via src/test-setup.ts (EventTarget-backed, mutable surface, throw-on-regression self-test). Plan 47-02's helper module mutates this exact instance — without 47-01, getPolyfill() throws.
provides:
  - src/lib/test/visual-viewport-mock.ts — five exports (dispatchVisualViewportResize, simulateKeyboardOpen, simulateKeyboardDown, simulateBfcacheRestore, _resetVisualViewportMock)
  - src/lib/test/ directory convention for plain-TS, framework-neutral test helpers (D-07)
  - Co-located unit test (src/lib/test/visual-viewport-mock.test.ts) covering T-01..T-07
  - Pitfall 2 regression sentinel (T-07 — guards against future "replace instance" refactors)
affects:
  - 47-03-PLAN (Playwright webkit-iphone — independent track; not affected at code level)
  - Phase 48 (FOCUS-TEST-01..02 — may reuse simulateKeyboardOpen/Down for cross-calculator focus assertions)
  - Phase 49 (DRAWER-TEST-01..02 — first feature consumer of all 5 helpers; uses _resetVisualViewportMock in beforeEach for isolation, simulateBfcacheRestore for DRAWER-03 rebind logic)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plain-TS framework-neutral test helper module pattern — no imports from vitest/jest/mocha/@testing-library; helper exports are reusable from any test runner."
    - "Internal `getPolyfill()` guard with actionable error message — surfaces vite.config.ts setupFiles misconfiguration immediately rather than silently returning undefined."
    - "PageTransitionEvent constructor + Object.defineProperty fallback — try/catch that degrades gracefully if a future jsdom drops the constructor (RESEARCH.md A3 LOW-risk hedge)."
    - "Mutate-don't-replace pattern: helper writes to the live polyfill instance via a single MutableVisualViewport cast inside getPolyfill(); Pitfall 2 sentinel test (T-07) is the regression guard."

key-files:
  created:
    - src/lib/test/visual-viewport-mock.ts
    - src/lib/test/visual-viewport-mock.test.ts
  modified: []

key-decisions:
  - "Five exports exactly — dispatchVisualViewportResize, simulateKeyboardOpen, simulateKeyboardDown, simulateBfcacheRestore, _resetVisualViewportMock — locked by D-08..D-10 plus CONTEXT.md Claude's Discretion §2 (reset helper). No more, no fewer; future additions (e.g. simulateOrientationChange) deferred to Phase 49 if needed."
  - "Helper imports nothing — framework-neutral per CONTEXT.md Established Patterns §3 + W-02 in PATTERNS.md. Verified by `grep -E \"from\\s+['\\\"](vitest|jest|mocha|@testing-library)\" src/lib/test/visual-viewport-mock.ts` returning zero matches."
  - "MutableVisualViewport type alias is internal (not exported) — local lens for the Pitfall-2 cast, applied once in getPolyfill() and reused by all five helpers. Mirrors Plan 47-01's `as unknown as EventTarget & {…}` idiom in test-setup.ts:184."
  - "_resetVisualViewportMock dispatches a final 'resize' event after restoring defaults — Phase 49's singleton reads $state runes off the resize event, so a silent reset would leave listeners with stale values."
  - "PageTransitionEvent fallback path is dead code under jsdom 29 (constructor is supported per RESEARCH.md A3) but kept for future-proofing — costs 4 lines, eliminates a future-jsdom regression risk."

patterns-established:
  - "src/lib/test/ directory — plain-TS framework-neutral test helpers. Distinct from src/lib/shared/ (runtime singletons) and src/test-setup.ts (suite-startup polyfill installer). Future test helpers (simulateOrientationChange, simulateBfcacheNavigateAway, etc.) live here."
  - "Co-located helper-module .test.ts files use T-NN numeric prefixes (matches src/lib/shared/favorites.test.ts convention)."
  - "beforeEach(() => _resetHelper()) idiom for shared mutable-global state — vitest workers reuse window across tests in a file; explicit reset is the deterministic alternative to vi.resetModules() (which doesn't help when state lives on globals like window.visualViewport)."

requirements-completed: [TEST-02]

# Metrics
duration: 3min
completed: 2026-04-27
---

# Phase 47 Plan 02: visual-viewport-mock helper Summary

**Plain-TS, framework-neutral test helper module at `src/lib/test/visual-viewport-mock.ts` exporting five named functions that mutate the live `window.visualViewport` polyfill (Plan 47-01) in place and dispatch synthetic events — gives Phase 49's drawer-anchoring tests a deterministic "synthesize keyboard up / keyboard down / bfcache restore / reset baseline" surface, with a co-located T-01..T-07 unit test that pins the helper's behavior including the Pitfall 2 mutate-don't-replace sentinel.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-27T07:37:29Z
- **Completed:** 2026-04-27T07:40:37Z
- **Tasks:** 2/2 complete (no deviations)
- **Files modified:** 2 (both created — src/lib/test/ directory is new)
- **Vitest delta:** 444 / 42 files (Plan 47-01 baseline) → 451 / 43 files (+7 tests, +1 file — exactly the planned delta)
- **svelte-check delta:** 4587 → 4589 files (+2 — helper module + helper test in the type-check graph)

## Accomplishments

- Created `src/lib/test/` (NEW directory per D-07) — establishes the plain-TS, framework-neutral test-helper module convention for v1.15.1 onward.
- Added `src/lib/test/visual-viewport-mock.ts` (113 lines) with the five locked exports per D-08..D-10:
  - `dispatchVisualViewportResize(height: number, offsetTop = 0, width?: number): void` — D-08 helper that mutates the polyfill's `width` (optional), `height`, and `offsetTop`, then fires `resize`.
  - `simulateKeyboardOpen(): void` — D-09 wrapper using `window.innerHeight - 290` (290 px = iOS portrait soft-keyboard height per PITFALLS.md DRAWER-09).
  - `simulateKeyboardDown(): void` — D-09 wrapper using `window.innerHeight` (no-keyboard baseline).
  - `simulateBfcacheRestore(): void` — D-10 helper dispatching `pageshow` with `persisted: true` for Phase 49's DRAWER-03 rebind logic. Includes `PageTransitionEvent` constructor + `Object.defineProperty` fallback path for future-jsdom safety.
  - `_resetVisualViewportMock(): void` — RESEARCH.md Open Question §1 / CONTEXT.md Claude's Discretion §2 reset helper for `beforeEach` isolation. Underscore prefix marks it as test-internal (Phase 49 production code never calls it).
- Internal `getPolyfill()` guard surfaces an actionable error message ("Did src/test-setup.ts load? Confirm vite.config.ts setupFiles…") when the polyfill is missing — turns "undefined property access" into a fast, debuggable failure mode.
- Helper has **zero external imports** — verified by `grep -E "from\s+['\"](vitest|jest|mocha|@testing-library)" src/lib/test/visual-viewport-mock.ts` returning zero matches. Framework-neutral constraint (CONTEXT.md "Established Patterns" §3 + W-02 in PATTERNS.md) satisfied.
- Helper mutates the live polyfill instance in place via a single `MutableVisualViewport` cast inside `getPolyfill()` (Pitfall 2). Tests holding a `const vv = window.visualViewport` reference observe new values without re-fetching from `window`.
- Added co-located unit test `src/lib/test/visual-viewport-mock.test.ts` (127 lines) with seven named tests T-01..T-07 covering all five exports plus the Pitfall 2 sentinel.
- All 7 new tests pass on `pnpm test:run` (targeted + full suite).
- Existing 444 vitest tests remain green (no regressions); `pnpm run check` stays at 0 errors / 0 warnings.

## Task Commits

Each task was committed atomically per project convention:

1. **Task 1: Create the visual-viewport-mock helper module** — `bb0b407` (feat)
2. **Task 2: Add co-located unit test for the helper module** — `76c9152` (test)

**Plan metadata:** _to be appended after SUMMARY commit_

## Files Created/Modified

- `src/lib/test/visual-viewport-mock.ts` (NEW, 113 lines) — five named exports, internal `getPolyfill()` guard, internal `MutableVisualViewport` type alias. Zero imports.
- `src/lib/test/visual-viewport-mock.test.ts` (NEW, 127 lines) — vitest spec importing all five exports via relative `./visual-viewport-mock` path (matches `src/lib/shared/favorites.test.ts:3` style). T-01..T-07. `beforeEach(_resetVisualViewportMock)` for isolation. Listener registrations clean up in `finally` blocks.
- `src/lib/test/` directory created implicitly when the helper file was written.

## Decisions Made

1. **Five exports exactly — no more, no fewer.** Locked by D-08..D-10 + CONTEXT.md Claude's Discretion §2 (reset helper recommended). `simulateOrientationChange` and other future helpers are deferred to Phase 49 if a concrete need emerges (per CONTEXT.md "Helper API surface" guidance).
2. **`MutableVisualViewport` type alias is internal.** Not exported — it's the local lens through which the helper writes to the polyfill. The Pitfall-2 cast happens once in `getPolyfill()` and is reused by all five helpers. Keeps the public surface narrow.
3. **`getPolyfill()` is internal too.** Helper consumers don't need to handle the "polyfill missing" branch themselves — the guard fires once and surfaces the actionable error message at the helper's API boundary.
4. **`PageTransitionEvent` fallback path is dead code in jsdom 29.** Per RESEARCH.md A3, jsdom 29 supports the constructor. The `try/catch` is a 4-line hedge against future jsdom regressions or alternative test environments — costs nothing at runtime, eliminates a tail-risk class.
5. **`_resetVisualViewportMock` dispatches `'resize'` after restoring defaults.** Phase 49's singleton reads `$state` runes off the `resize` event, so a silent reset would leave listeners with stale values. T-06 verifies the dispatch fires (count === 1).
6. **Listener cleanup via `finally` blocks in every test that registers a listener.** vitest workers reuse `window` across tests; un-removed listeners would contaminate later tests in the same file. T-01, T-05, T-06 all clean up explicitly.

## Deviations from Plan

None — plan executed exactly as written. Both action sketches landed byte-for-byte (modulo the project's tab-indent style, which was applied uniformly across both files for consistency with `src/test-setup.visualviewport.test.ts:9` and the rest of `src/lib/`).

The PageTransitionEvent constructor fallback path was **NOT exercised** by the test suite (jsdom 29 supports the constructor, so the `try` branch always succeeds). It remains in the helper as future-proofing — see Decision §4 above. T-05 verifies `persisted: true` is observable on the dispatched event regardless of which code path produced it.

## Issues Encountered

None.

## User Setup Required

None — test infrastructure only. No environment variables, no external services, no secrets.

## Verification Results

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| `pnpm run check` (svelte-check) | 0 errors / 0 warnings | 0 errors / 0 warnings (4589 files — Plan 47-01 baseline 4587 + 2 new files) | PASS |
| `pnpm test:run` (vitest, full suite) | 444 + 7 = 451 tests, 42 + 1 = 43 files | 451 / 451 across 43 files | PASS |
| Targeted `pnpm test:run src/lib/test/visual-viewport-mock.test.ts` | 7 / 7 tests pass (T-01..T-07) | 7 / 7 PASS | PASS |
| Helper is framework-neutral | `grep -E "from\s+['\"](vitest\|jest\|mocha\|@testing-library)" src/lib/test/visual-viewport-mock.ts` → 0 matches | 0 matches | PASS |
| Pitfall 2 sentinel passes | `pnpm test:run -t 'T-07'` → 1 / 1 pass | 1 / 1 pass (6 skipped — only T-07 selected) | PASS |
| No production import of helper | No `import .*visual-viewport-mock` from application code (excluding the co-located test and a doc-comment in `src/test-setup.ts:156`) | Zero application-code imports — only the co-located test imports it; `src/test-setup.ts:156` references the path inside a `//` comment as documentation, not code | PASS |
| Existing 444 vitest tests still pass | No regression | 451 - 7 = 444 prior tests still passing | PASS |
| Atomic commit prefixes | `feat(47-02):` + `test(47-02):` | `feat(47-02): …` (bb0b407) + `test(47-02): …` (76c9152) | PASS |

## Threat Surface Notes

The plan's `<threat_model>` register lists T-47-05..T-47-08. All mitigations relevant to this plan landed as written:

- **T-47-05 (Tampering — production-bundle leak via `$lib/test/visual-viewport-mock`):** mitigated by convention. The directory name `src/lib/test/` (NOT `src/lib/shared/`) plus the underscore prefix on `_resetVisualViewportMock` mark the module as test-only. Verification deferred to Phase 51 REL-04 final clinical gate (`pnpm build` bundle inspection — `grep -r 'visual-viewport-mock' build/`). NOT a Phase 47 blocker — `pnpm build` passes today without the helper being imported anywhere outside `src/lib/test/`.
- **T-47-06 (Tampering — instance replacement instead of mutation):** covered by T-07 of the unit test. T-07 explicitly asserts `window.visualViewport === vvRef` after a helper call, so any future "replace the instance" refactor fails fast.
- **T-47-07 (Information disclosure — production-code call):** accept (per plan). The polyfill's installation gate in `src/test-setup.ts` ensures the polyfill is NEVER installed when a real `visualViewport` exists; if production code somehow imports and invokes the helper at runtime, it would corrupt real-browser visualViewport state — which is bad enough to surface as an obvious QA bug.
- **T-47-08 (DoS — `_reset` infinite loop):** accept (per plan). The polyfill's `dispatchEvent` is synchronous; `_reset` does not register its own listener. T-06 verifies a single-fire dispatch (count === 1).

No new threat flags surfaced during execution.

## Next Phase Readiness

**Plan 47-03 (Playwright webkit-iphone):** Ready — independent track, no dependency on this plan's artifacts. Real WebKit ships its own `visualViewport`; the helper here is unit/component-test scope only.

**Phase 48 (FOCUS-TEST-01..02):** Unblocked. The helper provides the keyboard up/down state machine that focus-related tests can use to exercise InputDrawer.svelte's auto-focus removal under jsdom.

**Phase 49 (DRAWER-TEST-01..02):** Unblocked. All five helpers are the building blocks DRAWER-03 (bfcache rebind), DRAWER-04 (offsetTop tracking), and DRAWER-05 (keyboard-open height adjustment) tests will use. T-07 ensures Phase 49 can hold long-lived `const vv = window.visualViewport` references across `beforeEach` resets without refetching.

## Self-Check: PASSED

- File `src/lib/test/visual-viewport-mock.ts` created (commit `bb0b407`) — verified.
- File `src/lib/test/visual-viewport-mock.test.ts` created (commit `76c9152`) — verified.
- Commit `bb0b407` exists on the worktree branch — verified via `git log`.
- Commit `76c9152` exists on the worktree branch — verified via `git log`.
- `pnpm run check` 0/0 — verified after both Task 1 and Task 2.
- `pnpm test:run` 451/451 — verified after Task 2.
- Targeted helper-test run 7/7 — verified.
- T-07 Pitfall 2 sentinel passes in isolation — verified via `pnpm test:run -t 'T-07'`.
- Helper has zero test-framework imports — verified via grep.
- No production-code imports the helper — verified via grep (only the co-located test imports it; `src/test-setup.ts:156` is a documentation comment, not code).

---

*Phase: 47-wave-0-test-scaffolding*
*Completed: 2026-04-27*
