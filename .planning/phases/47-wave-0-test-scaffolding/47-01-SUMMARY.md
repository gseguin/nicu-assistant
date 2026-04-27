---
phase: 47-wave-0-test-scaffolding
plan: 01
subsystem: testing
tags: [vitest, jsdom, polyfill, visualViewport, EventTarget, test-setup, ios-keyboard]

# Dependency graph
requires:
  - phase: pre-existing test-setup.ts polyfill harness
    provides: ResizeObserver / matchMedia / Element.animate / HTMLDialogElement polyfill patterns + setup-time self-test idiom (lines 1-150 of src/test-setup.ts)
provides:
  - window.visualViewport polyfill in src/test-setup.ts (class extends EventTarget, defensive double-gate, probe-then-throw self-test)
  - Co-located unit test (src/test-setup.visualviewport.test.ts) covering the polyfill's runtime shape (T-01..T-05)
  - Throw-on-regression suite-startup safety net so silent polyfill drift fails CI loudly
affects:
  - 47-02-PLAN (visual-viewport-mock helper — will mutate this polyfill's properties and dispatch resize events)
  - 47-03-PLAN (Playwright webkit-iphone — independent track; not affected at code level but lives in same phase)
  - Phase 48 (FOCUS-TEST-01..02 mounting InputDrawer.svelte — relies on this polyfill so jsdom does not throw on visualViewport access)
  - Phase 49 (DRAWER-TEST-01..02 — first feature consumer of window.visualViewport via the singleton at src/lib/shared/visualViewport.svelte.ts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EventTarget-subclass polyfill pattern (class extends EventTarget) — mirrors ResizeObserver shape at test-setup.ts:5-11 with the additional EventTarget inheritance for synchronous listener semantics."
    - "Probe-cast through `as unknown as EventTarget & { … }` in self-tests so runtime instanceof guards stay reachable under TS strict mode (lib.dom narrows VisualViewport to extend EventTarget statically — the cast keeps the negative branch from collapsing to `never`)."

key-files:
  created:
    - src/test-setup.visualviewport.test.ts
  modified:
    - src/test-setup.ts

key-decisions:
  - "Polyfill class extends EventTarget (not object literal) — D-04 / RESEARCH.md Q2: native instanceof EventTarget, free listener storage, no Object.setPrototypeOf ceremony, mirrors ResizeObserver shape."
  - "Self-test cast through `as unknown as EventTarget & { addEventListener; removeEventListener; dispatchEvent }` — needed because lib.dom types VisualViewport as extending EventTarget, which would otherwise narrow the negative branch of `if (!(vv instanceof EventTarget))` to `never` and break compilation under TS strict + verbatimModuleSyntax. Auto-fix recorded as Rule 3 deviation."
  - "Throw on self-test failure (not console.warn). Mirrors HTMLDialogElement self-test at lines 145-148. CONTEXT.md specifics §1 + RESEARCH.md Pitfall 1: console warnings are invisible in CI; throw-err is the only way to catch silent polyfill regression."

patterns-established:
  - "visualViewport-aware tests rely on the live polyfill installed by setupFiles — no import from test-setup.ts is needed; the polyfill is global state on `window`."
  - "Co-located polyfill regression sentinel: src/test-setup.<feature>.test.ts as a sibling of test-setup.ts asserts the polyfill's runtime shape from a vitest perspective, complementing (not replacing) the suite-startup self-test."

requirements-completed: [TEST-01]

# Metrics
duration: 12min
completed: 2026-04-27
---

# Phase 47 Plan 01: visualViewport polyfill foundation Summary

**EventTarget-backed `window.visualViewport` polyfill in `src/test-setup.ts` with throw-on-regression suite-startup self-test, plus a co-located T-01..T-05 unit test that pins the polyfill's runtime shape so Phase 48 + 49 component tests can mount visualViewport-aware code without jsdom throwing.**

## Performance

- **Duration:** ~12 min (one Rule 3 auto-fix for TS narrowing)
- **Started:** 2026-04-27T07:21:38Z
- **Completed:** 2026-04-27T07:33:51Z
- **Tasks:** 2/2 complete
- **Files modified:** 2 (1 modified, 1 created)
- **Vitest delta:** 439 / 41 files → 444 / 42 files (+5 tests, +1 file — exactly the planned delta)

## Accomplishments

- Added an additive `window.visualViewport` polyfill to `src/test-setup.ts` with the D-04 surface (`width`, `height`, `offsetTop`, `offsetLeft`, `pageTop`, `pageLeft`, `scale`, `onresize`, `onscroll`, `onscrollend` plus inherited `EventTarget` methods) and D-05 baseline defaults (innerWidth/innerHeight, offsets=0, scale=1).
- Defensive double-gate (`typeof window !== 'undefined' && typeof window.visualViewport === 'undefined'`) so the polyfill never overwrites a real `visualViewport` (D-02 / D-17 — additive guarantee preserved across browsers, future jsdom versions, and any production code paths that would never load the file in the first place).
- Probe → mutate → assert → throw self-test mirrors the HTMLDialogElement pattern at lines 121-149: validates instance is `EventTarget`, listener fires synchronously on `dispatchEvent('resize')`, `removeEventListener` detaches. `console.error` followed by `throw err` — never `console.warn` — per CONTEXT.md specifics §1.
- Co-located unit test (`src/test-setup.visualviewport.test.ts`) with five named tests (T-01..T-05) covering installation, surface shape, default values, listener register/dispatch/remove semantics, and property mutability for Plan 02's helper.
- Existing 439 vitest tests remain green (no regressions); polyfill self-test fires once at suite startup and passes silently — no console output, no throw.
- svelte-check stays at 0 errors / 0 warnings (4587 files — one more than baseline 4586, reflecting the new test file in the type-check graph).

## Task Commits

Each task was committed atomically per project convention:

1. **Task 1: Add visualViewport polyfill block + self-test to src/test-setup.ts** — `350d279` (feat)
2. **Task 2: Add co-located unit test asserting the polyfill's runtime shape** — `ad6715c` (test)

**Plan metadata:** _to be appended after SUMMARY commit_

## Files Created/Modified

- `src/test-setup.ts` — appended visualViewport polyfill block (61 lines) after the existing HTMLDialogElement block (line 150). Block contains the `VisualViewportPolyfill` class, `Object.defineProperty(window, 'visualViewport', …)` install, and the probe-then-throw self-test. No edits to existing polyfill blocks (lines 1-150 unchanged).
- `src/test-setup.visualviewport.test.ts` (NEW) — 74-line co-located unit test with T-01..T-05. Relies on the LIVE polyfill installed by the setupFile; no import from `../test-setup` (polyfill is global `window` state by the time test imports run).

## Decisions Made

1. **Polyfill class extends EventTarget over object-literal-with-delegate.** Locked by D-04 + RESEARCH.md Q2: native `instanceof EventTarget`, no `Object.setPrototypeOf` ceremony, mirrors the in-repo ResizeObserver shim shape.
2. **Probe cast through `as unknown as EventTarget & { addEventListener; removeEventListener; dispatchEvent }`.** Auto-fix during Task 1 verification — see deviations §1 below. The naive `const vv = window.visualViewport!` pattern collapses the negative branch of `if (!(vv instanceof EventTarget))` to `never` because lib.dom statically types `VisualViewport` as extending `EventTarget`. The cast is the minimum-surface idiom that keeps the self-test runtime-meaningful AND TS-strict-clean.
3. **Self-test throws, never warns.** Mirrors `console.error([test-setup] X polyfill self-test failed: , err); throw err;` at lines 146-148. Per CONTEXT.md specifics §1 — invisible warnings are the failure mode this phase exists to prevent.
4. **Co-located test relies on the live polyfill, not a test-time install.** Since `vite.config.ts:64` already wires `setupFiles: ['src/test-setup.ts']`, the polyfill is installed before any test file is imported. The unit test treats `window.visualViewport` as a global fact and tests its observable behavior. This is how Phase 49's drawer-anchoring tests will use it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] svelte-check 5 errors after Task 1 implementation due to TS narrowing of self-test probe to `never`.**

- **Found during:** Task 1 verification (`pnpm run check` after the polyfill block landed).
- **Issue:** The plan's action sketch wrote the self-test as `const vv = window.visualViewport!;` followed by `if (!(vv instanceof EventTarget)) { throw … }`. Under TS strict + verbatimModuleSyntax, `lib.dom.d.ts` types `VisualViewport` as already extending `EventTarget`, so the negative branch of the `instanceof` check narrows `vv` to `never`. svelte-check then emitted 5 errors: "The left-hand side of an `instanceof` expression must be of type `any`, an object type or a type parameter" + "Property `addEventListener`/`dispatchEvent`/`removeEventListener` does not exist on type `never`."
- **Fix:** Cast the probe through `as unknown as EventTarget & { addEventListener: VisualViewport['addEventListener']; removeEventListener: VisualViewport['removeEventListener']; dispatchEvent: VisualViewport['dispatchEvent'] }`. This widens the type from compile-time `VisualViewport` (which always-extends-EventTarget by lib.dom) to a runtime-meaningful intersection that keeps the negative branch reachable. Added a one-line code comment explaining the rationale so future maintainers don't refactor it back. Idiom matches the existing `as unknown as typeof ResizeObserver` cast at line 10 and `as unknown as VisualViewport` at the polyfill install site.
- **Files modified:** `src/test-setup.ts` (probe cast only; the rest of the self-test body unchanged).
- **Verification:** `pnpm run check` → 0 errors / 0 warnings; `pnpm test:run` → 439 / 439 still green; the self-test still throws on the same regression cases (verified by Task 2's T-04, which exercises the same dispatch-listener path).
- **Committed in:** `350d279` (rolled into the Task 1 commit — the cast was applied before commit, not as a separate fix-up commit).

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking TS strict-mode error).
**Impact on plan:** Necessary for the project's safety gate (CLAUDE.md `/gsd-execute-phase` mandates 0/0 svelte-check). The plan's action sketch was correct in spirit but did not anticipate the TS-narrowing interaction; the cast is in keeping with the in-file `as unknown as <DomType>` idiom and adds zero behavioral difference at runtime. No scope creep.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None — test infrastructure only. No environment variables, no external services.

## Verification Results

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| `pnpm run check` (svelte-check) | 0 errors / 0 warnings | 0 errors / 0 warnings (4587 files) | PASS |
| `pnpm test:run` (vitest, full suite) | 439+ tests pass + 5 new = 444 | 444 / 444 across 42 files | PASS |
| Polyfill self-test fires at suite startup | Silent on success, throws on regression | Silent on success (no `[test-setup] visualViewport polyfill self-test failed:` in output) | PASS |
| Polyfill is additive (defensive gate honored) | `grep -rn 'window.visualViewport' src/` outside test-setup files returns 0 hits | 0 application-code matches | PASS |
| Atomic commit prefixes | `feat(47-01):` + `test(47-01):` | `feat(47-01): …` (350d279) + `test(47-01): …` (ad6715c) | PASS |
| No production-bundle leak | n/a (T-47-02 is verification-only; deferred to Phase 51 REL-04 final clinical gate) | n/a | DEFERRED (per threat model T-47-02) |

## Threat Surface Notes

The plan's `<threat_model>` register lists T-47-01..T-47-04. All mitigations relevant to this plan landed as written:

- **T-47-01 (Tampering — gate regression overwriting real visualViewport):** mitigated by the double `typeof` gate. Self-test (in-file lines 180-208) and Task 2 unit tests T-01..T-05 cover this. No new surface introduced.
- **T-47-02 (Information disclosure — production bundle leak):** verification deferred to Phase 51 REL-04 (`pnpm build` clinical gate). No code change required by Phase 47 — the polyfill lives in a setup file referenced only by `vite.config.ts:64`, never by any application module. `grep -rn 'window.visualViewport' src/` outside test-setup files returns 0 — confirmed.
- **T-47-03 (DoS — vitest startup):** mitigated by design. Self-test runs once at worker startup; if it throws, the suite fails fast with the actionable error. No threat surface.
- **T-47-04 (EoP — n/a):** test-only code; no privilege boundary crossed.

No new threat flags surfaced during execution.

## Next Phase Readiness

**Plan 47-02 (visual-viewport-mock helper):** Ready — the polyfill provides exactly the mutable surface the helper needs. T-05 in this plan's unit test pre-exercises the helper's write path (`vv.height = …; vv.offsetTop = …;`), so any future regression that breaks property mutability will fail T-05 before Plan 02's helper tests even run.

**Plan 47-03 (Playwright webkit-iphone):** Independent track — no dependency on this plan's artifacts. Real WebKit ships its own `visualViewport`, so the polyfill is not exercised in e2e.

**Phase 48 + 49:** Unblocked. `InputDrawer.svelte` mounts and visualViewport singleton imports can now run under jsdom without throwing `TypeError: Cannot read properties of undefined`. The throw-on-regression self-test guarantees the polyfill stays correctly shaped throughout the milestone.

## Self-Check: PASSED

- File `src/test-setup.ts` modified (commit 350d279) — verified.
- File `src/test-setup.visualviewport.test.ts` created (commit ad6715c) — verified.
- Commit `350d279` exists in `git log` — verified.
- Commit `ad6715c` exists in `git log` — verified.
- `pnpm run check` 0/0 — verified at the end of both tasks.
- `pnpm test:run` 444/444 — verified at the end of Task 2.
- No application-code consumers of `window.visualViewport` — verified via grep.

---

*Phase: 47-wave-0-test-scaffolding*
*Completed: 2026-04-27*
