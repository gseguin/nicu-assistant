---
phase: 49-wave-2-visualviewport-drawer-anchoring
plan: 01
subsystem: ui
tags: [svelte5, runes, visualViewport, ios, drawer, singleton, vitest, bfcache]

# Dependency graph
requires:
  - phase: 47-wave-0-test-scaffolding
    provides: visualViewport polyfill (src/test-setup.ts) + mock helpers (src/lib/test/visual-viewport-mock.ts) + webkit-iphone Playwright project
  - phase: 48-wave-1-trivial-fixes-notch-focus
    provides: drawer auto-focus removal + close-button autofocus (makes keyboardOpen observable as deliberate clinician tap, not every drawer-open)
provides:
  - "src/lib/shared/visualViewport.svelte.ts singleton (vv) with offsetTop / height / keyboardOpen $state runes"
  - "Idempotent vv.init() called from +layout.svelte:onMount alongside theme/disclaimer/favorites"
  - "DRAWER-TEST-01 vitest unit suite (6 cases) including source-grep no-scroll-listener regression sentinel"
affects: [49-02, 49-03, drawer-anchoring, ios-keyboard, bfcache, prefers-reduced-motion]

# Tech tracking
tech-stack:
  added: []  # No new runtime dependencies — class-based singleton uses only $state + $app/environment
  patterns:
    - "Class-based $state singleton (departure from existing module-scope `let _x = $state(...)` pattern in theme/disclaimer/favorites/pwa/lastEdited per CONTEXT.md D-01)"
    - "Browser-guarded init() via $app/environment.browser for SSG safety"
    - "Listener strategy: visualViewport.resize + window.pageshow.persisted + document.visibilitychange.visible (NO scroll — DRAWER-02 / P-08)"
    - "No-cache update() — re-reads vv.offsetTop / vv.height on every event (iOS 26 #800125 mitigation by construction)"

key-files:
  created:
    - "src/lib/shared/visualViewport.svelte.ts (60 lines incl. comments — class VisualViewportStore + exported `vv` instance)"
    - "src/lib/shared/visualViewport.test.ts (112 lines — 6 numbered tests T-01..T-06)"
  modified:
    - "src/routes/+layout.svelte (+2 lines — one import, one onMount call)"

key-decisions:
  - "Class-based singleton (D-01) — deliberate departure from the five existing module-scope `let _x = $state(...)` singletons in src/lib/shared/. Class instance fields with $state(...) keep all reactive state and the #initialized guard in one cohesive object."
  - "Three runes only — offsetTop / height / keyboardOpen (D-02). No width / scale runes per YAGNI; consumers in 49-02 only need the bottom-anchoring math."
  - "#initialized as a plain private field (NOT $state) — internal control flow, not reactive UI state, per D-02 hard rule."
  - "100px keyboard-open threshold (D-07 / DRAWER-09) — filters URL-bar collapse (~50-80px), admits OSK only (~290px portrait); hardware Bluetooth keyboards leave delta ≈ 0 so heuristic stays false."
  - "vv.init() inserted AFTER favorites.init() on +layout.svelte line 56 (D-13 corrected) — pwa.init() does NOT exist in the onMount; pwa is imported at line 14 but its update detection lives inline at lines 60-72."
  - "T-04 mutates the polyfill DIRECTLY (without dispatching 'resize') so the only event the singleton observes is 'pageshow' — isolates the bfcache rebind path."
  - "T-06 strips comment lines before grepping for `addEventListener('scroll')` — prevents the 'NO scroll listener' explanatory comment from self-invalidating the regression gate."

patterns-established:
  - "Class-based $state singleton with private #initialized field — sibling pattern to favorites.svelte.ts's module-scope approach; future singletons may pick either based on whether multiple distinct singletons of the same class are needed."
  - "Listener strategy with bfcache rebind — `pageshow.persisted === true` + `visibilitychange === 'visible'` covers the iOS Safari bfcache class of bugs that breaks any session-scoped reactive state."
  - "Source-grep regression sentinel pattern (T-06) — co-located vitest test reads the source file with `readFileSync`, strips comments, asserts forbidden patterns are absent. Inherited from Phase 48 D-13 / InputDrawer T-08. Catches regression at unit-test layer, before reaching e2e."
  - "Comment-stripping in source-grep tests — `line.trim().startsWith('//') || .startsWith('*')` covers single-line and block-comment continuation lines, prevents the gate from self-invalidating on its own explanatory comments."

requirements-completed:
  - DRAWER-01
  - DRAWER-02
  - DRAWER-03
  - DRAWER-04
  - DRAWER-09
  - DRAWER-TEST-01

# Metrics
duration: 5 min
completed: 2026-04-27
---

# Phase 49 Plan 01: visualViewport Singleton + Layout Init Summary

**Class-based `$state` singleton (`vv`) exposing reactive `offsetTop` / `height` / `keyboardOpen` runes, subscribed to `visualViewport.resize` + `pageshow.persisted` + `visibilitychange.visible` (NO scroll), with idempotent browser-guarded `init()` wired into `+layout.svelte:onMount` alongside `theme` / `disclaimer` / `favorites`. Zero drawer behavior change at this commit boundary — runes are produced and observed by tests, but no consumer reads them yet.**

## Performance

- **Duration:** 5 min (3 atomic task commits)
- **Started:** 2026-04-27T18:34:51Z
- **Completed:** 2026-04-27T18:39:32Z
- **Tasks:** 3 / 3
- **Files modified:** 3 (2 created, 1 edited)

## Accomplishments

- `src/lib/shared/visualViewport.svelte.ts` ships the locked class shape (CONTEXT.md D-01..D-07): `class VisualViewportStore` + three `$state` instance fields + `#initialized` private boolean + idempotent + browser-guarded + fallback-on-missing-API `init()` method + exported `vv` instance.
- `src/lib/shared/visualViewport.test.ts` ships 6 numbered cases (T-01..T-06) covering DRAWER-01..04 + DRAWER-09 + the source-grep no-scroll-listener regression sentinel; all 6 pass deterministically (~1.0s).
- `src/routes/+layout.svelte` adds exactly one import line and exactly one `vv.init();` call inside `onMount` after `favorites.init();` per the corrected D-13 (no `pwa.init()` in this onMount).
- Zero regression: full vitest suite **460/460** passing post-change.
- Build path validated: `pnpm build` succeeds — SSG prerender does NOT crash because the `browser` guard in `init()` aborts before touching `window`.

## Task Commits

1. **Task 1: Create visualViewport singleton** — `48fd954` (`feat(49-01): add visualViewport singleton (DRAWER-01..04 + DRAWER-09)`)
2. **Task 2: Create singleton vitest unit test** — `0c0098d` (`test(49-01): add visualViewport singleton vitest suite (DRAWER-TEST-01)`)
3. **Task 3: Wire vv.init() into +layout.svelte:onMount** — `4174dcb` (`feat(49-01): wire vv.init() into +layout.svelte:onMount (DRAWER-04)`)

**Plan metadata commit:** added at finalization (this SUMMARY.md + state updates).

_Note on TDD ordering: This plan declares Tasks 1 and 2 as `tdd="true"`, but the plan structure pairs them as Task 1 = source / Task 2 = co-located test. The tests in Task 2 verify Task 1's behavior. The classical RED-GREEN-REFACTOR cycle is collapsed because the singleton's behavior contracts are pre-locked in CONTEXT.md D-01..D-07 and the test cases are pre-specified in D-17 — there is no "discovery" gap that RED-first would surface. Both commits leave the suite green._

## Files Created/Modified

- `src/lib/shared/visualViewport.svelte.ts` (NEW, 60 lines) — class-based `$state` singleton with three runes, idempotent browser-guarded `init()`, three event listeners (`vv.resize` + `window.pageshow` + `document.visibilitychange`), all `{ passive: true }`. Exports `vv` instance.
- `src/lib/shared/visualViewport.test.ts` (NEW, 112 lines) — 6 numbered vitest cases consuming Phase 47 mock helpers (`dispatchVisualViewportResize`, `simulateKeyboardOpen`, `simulateKeyboardDown`, `simulateBfcacheRestore`, `_resetVisualViewportMock`). `beforeEach` combines `vi.resetModules()` + `_resetVisualViewportMock()`. T-06 source-grep sentinel.
- `src/routes/+layout.svelte` (MODIFIED, +2 lines) — `import { vv } from '$lib/shared/visualViewport.svelte.js';` after the `pwa` import (line 15); `vv.init();` after `favorites.init();` inside `onMount` (line 57).

## Decisions Made

All implementation decisions were locked in `49-CONTEXT.md` (D-01..D-07, D-13..D-15, D-17). No discretionary choices were taken during execution. The only minor judgment calls:

- **Comment style:** File header preamble follows the precise template from the plan's `<action>` block — five lines including source-pattern attribution and Phase 49 / DRAWER-XX requirement IDs.
- **Test file `beforeEach` placement:** Block lives outside `describe(...)` per the plan's literal layout (the original example showed `beforeEach` inside `describe`, but vitest accepts both — outside-describe is what the plan template wrote; we matched the plan template verbatim to avoid drift).
- **Commit message body:** Added requirement IDs (DRAWER-01..04 + DRAWER-09 + DRAWER-TEST-01) to subjects + key contracts to bodies for traceability.

## Deviations from Plan

None — plan executed exactly as written. All three tasks landed on the locked design (class shape, three runes, listener strategy, threshold, init insertion site). No bugs surfaced; no missing critical functionality; no blockers; no architectural decisions required.

**Total deviations:** 0
**Impact on plan:** Plan executed verbatim. The `<must_haves>` "truths" all hold:
- Calling `vv.init()` twice is a no-op (T-01 enforced).
- After `visualViewport.resize`, runes update synchronously (T-02 / T-03).
- On `pageshow.persisted === true`, `vv` re-reads the polyfill (T-04).
- The 100px hardware-keyboard guard holds (T-05 covers delta=0, 99, 101).
- Source has zero `addEventListener('scroll', ...)` calls (T-06 sentinel + manual `grep` confirm).
- `+layout.svelte:onMount` has `vv.init()` alongside the existing three `init()` calls.

## Issues Encountered

**Worktree was branched from a pre-Phase-49 commit (`df30e64` — last Phase 45 commit on a stale branch line) instead of the current `main` HEAD (`15393ac` — phase 49 planning artifacts present).** Per the gsd-executor `<worktree_branch_check>` protocol, performed a `git reset --hard 15393ac9f1c114677706b561c0a991179c3c9dec` at the very start of the agent run — before any task work — so the planning files (`49-01-PLAN.md`, `49-CONTEXT.md`, etc.) were available for the executor to read. This is a known issue documented in the protocol (worktree branches are sometimes created from `main` instead of feature-branch HEAD). Resolved cleanly; no work was discarded because the worktree was empty.

A second one-time setup: `node_modules/` was absent in the worktree filesystem, so `pnpm install --frozen-lockfile` was run (~8s) before any verification gates. No lockfile changes; `pnpm-lock.yaml` is untouched.

Both items are environment fixes, not deviations from plan logic.

## User Setup Required

None — no external service configuration required. This plan ships purely client-side code; no env vars, no dashboards, no credentials.

## Next Phase Readiness

**Ready for 49-02-PLAN.md** (InputDrawer wiring — DRAWER-05..08 + DRAWER-10..12 + DRAWER-TEST-02).

The singleton's API contract is now stable and observable via the `vv` export. Plan 49-02 can:

- Import `vv` directly: `import { vv } from '$lib/shared/visualViewport.svelte.js';`
- Read `vv.keyboardOpen` / `vv.height` / `vv.offsetTop` from `InputDrawer.svelte`'s `$derived` block (D-09).
- Bind the computed `--ivv-bottom` / `--ivv-max-height` CSS variables on `.input-drawer-sheet` inline `style`.
- Reuse Phase 47 mock helpers in `InputDrawer.test.ts` (DRAWER-TEST-02) without any new test infrastructure.

**Verification gates passed:**
- ✓ `pnpm exec svelte-check --tsconfig ./tsconfig.json --threshold error` → 0 errors
- ✓ `pnpm exec vitest run src/lib/shared/visualViewport.test.ts` → 6/6
- ✓ `pnpm exec vitest run` → 460/460 (zero regressions)
- ✓ `grep -rn "vv\.init" src/` → exactly 1 non-test match (`src/routes/+layout.svelte:57`)
- ✓ `grep -rn "visualViewport.svelte" src/` → exactly 2 non-test matches (source self-reference comment + `+layout.svelte` import)
- ✓ `grep -n "addEventListener" src/lib/shared/visualViewport.svelte.ts` → exactly 3 (resize / pageshow / visibilitychange); zero `'scroll'`
- ✓ `pnpm exec playwright test e2e/webkit-smoke.spec.ts` → 2/2 (chromium + webkit-iphone — Phase 47 sentinel still green)
- ✓ `pnpm build` → succeeds (SSG prerender + PWA SW + adapter-static all clean)

**No blockers carried into 49-02.** The fallback contract holds: if 49-02 slipped indefinitely, `.input-drawer-sheet` would still render with verbatim Phase-48 behavior (`80dvh` / `safe-area-inset-bottom`) because the singleton's runes stay at defaults `0 / 0 / false` and no consumer reads them.

## Self-Check: PASSED

- ✓ `src/lib/shared/visualViewport.svelte.ts` exists on disk
- ✓ `src/lib/shared/visualViewport.test.ts` exists on disk
- ✓ `src/routes/+layout.svelte` exists on disk
- ✓ `.planning/phases/49-wave-2-visualviewport-drawer-anchoring/49-01-SUMMARY.md` exists on disk
- ✓ Task 1 commit `48fd954` present in git log
- ✓ Task 2 commit `0c0098d` present in git log
- ✓ Task 3 commit `4174dcb` present in git log

---
*Phase: 49-wave-2-visualviewport-drawer-anchoring*
*Completed: 2026-04-27*
