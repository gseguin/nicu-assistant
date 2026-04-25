---
phase: 45-desktop-full-nav-divergence
plan: 03
subsystem: testing
tags: [playwright, axe-core, accessibility, wcag2aa, e2e, navigation, dark-mode, viewport]

# Dependency graph
requires:
  - phase: 45-desktop-full-nav-divergence
    plan: 01
    provides: NavShell.svelte with desktopVisibleCalculators (5 tabs always rendered) + .tablist-scroll + .is-overflowing mask CSS surface
  - phase: 44-kendamil-formulas
    plan: 04
    provides: Canonical for-theme parameterized axe pattern (fortification-a11y.spec.ts:91-115) — verbatim source for this spec
provides:
  - e2e/desktop-full-nav-a11y.spec.ts (NAV-ALL-TEST-03)
  - 4 axe sweep tests (light/dark × 1280/768) covering desktop top toolbar
  - Runtime verification of .is-overflowing mask fade contrast at narrow desktop widths
  - Auto-scrolled-active-tab axe coverage (lands on /uac-uvc, the 5th and last tab)
affects: [phase-45-completion, future-desktop-nav-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Re-used Phase 44 Kendamil for-theme parameterized axe loop (no new patterns)
    - test.use({ viewport }) at describe-level + page.setViewportSize() mid-test override for narrow-desktop sweep

key-files:
  created:
    - e2e/desktop-full-nav-a11y.spec.ts
  modified: []

key-decisions:
  - "Spec spliced verbatim from RESEARCH.md §4 — zero deviations from plan-locked content"
  - "/uac-uvc landing route preserves auto-scroll-active-tab + scroll-fade interaction under axe scrutiny (worst-case surface)"
  - "768 viewport via page.setViewportSize() mid-test (not test.use override) keeps the 1280 baseline + 768 overflow tests in the same describe block"

patterns-established: []

requirements-completed: [NAV-ALL-TEST-03]

# Metrics
duration: 8min
completed: 2026-04-25
---

# Phase 45 Plan 03: Desktop Full-Nav Axe Sweep Summary

**Adds NAV-ALL-TEST-03 — a 4-test Playwright + axe-core sweep of the desktop top toolbar (light/dark × 1280/768) that locks the WCAG 2.0 A/AA contract for the new 5-tab desktop nav and the narrow-desktop `.is-overflowing` mask-image fade surface introduced by Plan 45-01.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-25T04:50:15Z
- **Completed:** 2026-04-25T04:58:30Z
- **Tasks:** 1
- **Files created:** 1
- **Files modified:** 0

## Accomplishments

- Created `e2e/desktop-full-nav-a11y.spec.ts` containing the verbatim NAV-ALL-TEST-03 spec from RESEARCH.md §4 (lines 469-541).
- 4 tests at runtime, produced by 2 source-level for-theme loops:
  - **Light @1280** — desktop top toolbar baseline; pre-scan precondition asserts `getByRole('tab')` count is 5 to confirm Plan 45-01 desktop divergence is in effect.
  - **Dark @1280** — same baseline, dark theme (waitForTimeout(250) verbatim from Phase 44 Kendamil pattern).
  - **Light @768** — overflow + `.is-overflowing` mask fade visible (mid-test `page.setViewportSize({ width: 768, height: 800 })` override).
  - **Dark @768** — same narrow-desktop overflow case, dark theme.
- Each test runs `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()` and asserts `expect(results.violations).toEqual([])`.
- Pattern parity with `e2e/fortification-a11y.spec.ts:91-115` (canonical Kendamil for-theme loop from Phase 44):
  - Same `no-transition` class injection during theme toggle.
  - Same `waitForTimeout(250)` for dark (so axe reads final computed colors after the theme transition completes — NOT skipped per RESEARCH.md §4 critical note).
  - Same `withTags(['wcag2a', 'wcag2aa'])` scoping.
  - Same `expect(results.violations).toEqual([])` assertion.
- Spec lands at `/uac-uvc` so the auto-scrolled-into-view active-tab state (5th tab, worst-case for the `.is-overflowing` + scroll-fade interaction) is also under axe scrutiny.
- All 4 tests pass: `CI=1 pnpm exec playwright test e2e/desktop-full-nav-a11y.spec.ts` exits 0.
- No regressions in adjacent axe specs: `e2e/fortification-a11y.spec.ts` and `e2e/favorites-nav-a11y.spec.ts` exit 0 (one pre-existing flake on the Phase 44 Kendamil Organic light-mode test, retried green — pre-existing, not introduced here, see Issues Encountered).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create e2e/desktop-full-nav-a11y.spec.ts (NAV-ALL-TEST-03)** — `9a282d6` (test)

**Plan metadata:** _pending_ (final docs commit follows this SUMMARY)

## Files Created/Modified

- `e2e/desktop-full-nav-a11y.spec.ts` — New file. 68 lines. Verbatim splice of the RESEARCH.md §4 spec (post-prettier formatting: `useTabs: false, tabWidth: 2` per project `.prettierrc` — TS-file convention, identical to the analog `fortification-a11y.spec.ts`).

## NAV-ALL-TEST-03 Traceability

| Test | Viewport | Theme | Surface verified |
| ---- | -------- | ----- | ---------------- |
| `desktop top toolbar has no axe violations (light)` | 1280×800 | light | Full 5-tab desktop nav baseline, no overflow, scroll-fade hidden |
| `desktop top toolbar has no axe violations (dark)` | 1280×800 | dark | Full 5-tab desktop nav baseline, dark theme |
| `desktop top toolbar @768 (overflow + fade visible) has no axe violations (light)` | 768×800 | light | Narrow desktop, `.is-overflowing` mask fade visible, horizontal scroll active, active tab auto-scrolled into view |
| `desktop top toolbar @768 (overflow + fade visible) has no axe violations (dark)` | 768×800 | dark | Same narrow-desktop overflow case, dark theme |

## Decisions Made

All content of `e2e/desktop-full-nav-a11y.spec.ts` is verbatim from RESEARCH.md §4 lines 469-541. No design decisions made by the executor — every behavioral and structural choice was locked by the planner.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Use `CI=1` mode (preview server on 4173) instead of dev server (5173) for verification**

- **Found during:** Task 1 verification step (`pnpm exec playwright test e2e/desktop-full-nav-a11y.spec.ts`).
- **Issue:** Playwright `playwright.config.ts` defines `reuseExistingServer: true` for the dev-mode webServer. A long-running `vite dev` process (PID 1374428, started Apr 16) was holding port 5173 from the parent project root and serving stale HMR output (the pre-Wave-1 `visibleCalculators` symbol — confirmed via `curl http://localhost:5173/src/lib/shell/NavShell.svelte`). With Playwright reusing that server, the `toHaveCount(5)` precondition assertion fired against a 4-tab favorites-driven nav and failed both 1280 tests with `expected 5, received 4`. The 768 tests passed because they only scan, with no precondition check.
- **Fix:** Re-run with `CI=1` env var. This flips Playwright's webServer to `pnpm run build && pnpm run preview --port 4173` with `reuseExistingServer: false` — Playwright builds my worktree's source from scratch and serves the correct post-Wave-1 NavShell on port 4173 (which was free at run time). All 4 tests pass.
- **Files modified:** None — runtime-only. Spec text remains verbatim from RESEARCH.md §4. `playwright.config.ts` already supports both modes.
- **Verification:** `CI=1 pnpm exec playwright test e2e/desktop-full-nav-a11y.spec.ts` exits 0 with `4 passed (23.9s)`.
- **Committed in:** No code changes required; the spec was committed separately as `9a282d6` (Task 1). The deviation is the verification command used, not a code edit.

---

**Total deviations:** 1 (runtime / verification command, not code).
**Impact on plan:** None on the deliverable. Spec content is verbatim from RESEARCH.md §4. Future runs in CI will use the same path; future local runs against a fresh dev server (or against the user's restarted dev server, which now points at the correct branch) will also pass.

## Issues Encountered

**Pre-existing flake (out of scope):** `e2e/fortification-a11y.spec.ts:92` ("fortification page has no axe violations with Kendamil Organic selected (light)") was flaky on the regression run — failed once with two non-violation rule additions (`RGAAv4`, `RGAA-3.2.1`) in the violation array, then passed on retry. This test was added in Phase 44 (KEND-TEST-03) and is unrelated to the Phase 45 desktop nav surface. Per the executor's deviation-rule scope boundary ("only auto-fix issues directly caused by the current task's changes"), this was logged but not fixed. Tracking note: a future Phase 44 audit may want to investigate axe rule-set instability.

## User Setup Required

None — spec runs entirely in CI / local Playwright with no external service configuration.

## Self-Check: PASSED

- File `e2e/desktop-full-nav-a11y.spec.ts` exists.
- `grep -F "Desktop full-nav accessibility (NAV-ALL-TEST-03)" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `grep -F "import AxeBuilder from '@axe-core/playwright';" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `grep -F "test.use({ viewport: { width: 1280, height: 800 } })" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `grep -F "page.setViewportSize({ width: 768, height: 800 })" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `grep -c "for (const theme of \['light', 'dark'\] as const)" e2e/desktop-full-nav-a11y.spec.ts` returns `2` (>= 2).
- `grep -F "document.documentElement.classList.add('no-transition');" e2e/desktop-full-nav-a11y.spec.ts` matches twice (once per for-loop).
- `grep -c "page.waitForTimeout(250)" e2e/desktop-full-nav-a11y.spec.ts` returns `2`.
- `grep -c "withTags(\['wcag2a', 'wcag2aa'\])" e2e/desktop-full-nav-a11y.spec.ts` returns `2`.
- `grep -c "expect(results.violations).toEqual(\[\])" e2e/desktop-full-nav-a11y.spec.ts` returns `2`.
- `grep -F "page.goto('/uac-uvc')" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `grep -F "addInitScript" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `grep -F "page.locator('nav[aria-label=\"Calculator navigation\"]').first()" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `grep -F "toHaveCount(5)" e2e/desktop-full-nav-a11y.spec.ts` matches.
- `CI=1 pnpm exec playwright test e2e/desktop-full-nav-a11y.spec.ts` exits 0 (4 tests pass: 1280 light + 1280 dark + 768 light + 768 dark).
- `CI=1 pnpm exec playwright test e2e/fortification-a11y.spec.ts e2e/favorites-nav-a11y.spec.ts` exits 0 (7 passed, 1 pre-existing Phase 44 flake retried green — see Issues Encountered).
- Commit `9a282d6` exists in `git log --oneline` (Task 1: test).

## Next Phase Readiness

Phase 45 deliverables now complete across all three plans:

- Plan 45-01 — NavShell.svelte refactor + vitest T-07..T-12 coverage (commits `430397f`, `f505410`, `c672960`).
- Plan 45-02 — Playwright NAV-ALL-TEST-01 spec (commit `71e5678`, in sibling worktree).
- Plan 45-03 — Playwright NAV-ALL-TEST-03 axe spec (commit `9a282d6`, this plan).

NAV-ALL-01..05 + NAV-ALL-TEST-01..03 (8 requirements) are fully covered. Phase 45 is ready for verifier sign-off and merge.

---
*Phase: 45-desktop-full-nav-divergence*
*Completed: 2026-04-25*
