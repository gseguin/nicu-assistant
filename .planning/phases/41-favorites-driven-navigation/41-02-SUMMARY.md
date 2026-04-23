---
phase: 41-favorites-driven-navigation
plan: 02
subsystem: e2e
tags: [playwright, e2e, a11y, favorites, navigation, axe]

# Dependency graph
requires:
  - phase: 41-01
    provides: favorites-driven NavShell (visibleCalculators, activeCalculatorId, D-07 seed)
provides:
  - e2e/favorites-nav.spec.ts (FAV-TEST-03: 4 tests × 2 viewports = 8 instances)
  - e2e/favorites-nav-a11y.spec.ts (FAV-TEST-04: 2 axe tests light + dark)
affects:
  - FAV-TEST-03 requirement — closed
  - FAV-TEST-04 requirement — closed

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "addInitScript REMOVE + SET ordering for per-test favorites isolation without reload clearing state"
    - "Viewport-aware nav selector: first() for desktop top nav, last() for mobile bottom nav (md:hidden)"
    - "localStorage persist verification via page.evaluate() rather than reload (avoids addInitScript re-run)"

key-files:
  created:
    - e2e/favorites-nav.spec.ts (FAV-TEST-03 — 8 test instances)
    - e2e/favorites-nav-a11y.spec.ts (FAV-TEST-04 — 2 axe tests)
  modified: []

key-decisions:
  - "addInitScript scripts run on EVERY navigation including reload — SET scripts registered in test body after beforeEach REMOVE will override it (registration order determines execution order)"
  - "Desktop top nav (first()) vs mobile bottom nav (last()) selector split — needed because md:hidden hides bottom nav at 1280px viewport"
  - "FAV-TEST-03-3 verifies localStorage persist via page.evaluate() rather than page.reload() to avoid beforeEach addInitScript clearing the changed state on reload"

patterns-established:
  - "Per-test favorites seeding: register addInitScript with setItem in test body before reload; runs after beforeEach removeItem in registration order"
  - "Nav bar selector by viewport: isDesktop = vp.width >= 768; use first() for desktop, last() for mobile"

requirements-completed: [FAV-TEST-03, FAV-TEST-04]

# Metrics
duration: 13min
completed: 2026-04-23
---

# Phase 41 Plan 02: Playwright E2E + Axe Accessibility Tests Summary

**FAV-TEST-03 (8 E2E instances) and FAV-TEST-04 (2 axe instances) closing Phase 41 — full favorites flow verified at mobile + desktop viewports; open hamburger passes axe with 0 violations in light and dark themes**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-04-23T21:16:53Z
- **Completed:** 2026-04-23T21:30:00Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- `e2e/favorites-nav.spec.ts` — FAV-TEST-03: 4 behavior tests × 2 viewports (mobile 375×667 + desktop 1280×800) = 8 test instances
  - FAV-TEST-03-1: un-favorite Feeds → bar reactively shows 3 tabs
  - FAV-TEST-03-2: re-favorite Feeds → bar shows 4 tabs in registry order (Morphine Wean / Formula / GIR / Feeds)
  - FAV-TEST-03-3: localStorage persisted after UI un-favorite (verified via page.evaluate, not reload)
  - FAV-TEST-03-4: navigate to non-favorited route via hamburger → no tab is active (all aria-selected=false)
- `e2e/favorites-nav-a11y.spec.ts` — FAV-TEST-04: open hamburger passes `@axe-core/playwright` wcag2a+wcag2aa in both light and dark themes
- Full Playwright suite: 71 passed, 2 pre-existing failures (navigation.spec.ts stale assertions — pre-existing from Wave 1, out of scope), 3 skipped

## Task Commits

1. **Task 1: favorites-nav.spec.ts FAV-TEST-03** — `596328e` (test)
2. **Task 2: favorites-nav-a11y.spec.ts FAV-TEST-04** — `35cc291` (test)

## Files Created

- `e2e/favorites-nav.spec.ts` — 164 lines, 4 tests × 2 viewports
- `e2e/favorites-nav-a11y.spec.ts` — 52 lines, 2 axe tests

## Decisions Made

- **addInitScript ordering**: `page.addInitScript` scripts run in registration order on every page navigation including reload. The `beforeEach` registers a REMOVE script; tests that need a specific initial favorites state register a SET script in the test body before `page.reload()`. The SET runs after REMOVE so it wins. This is the critical insight for test isolation without leaking state between tests.
- **Desktop vs mobile nav selector**: At 1280px viewport, the mobile bottom nav has `md:hidden` (display:none). Used `isDesktop = vp.width >= 768` to pick `first()` (desktop top nav) vs `last()` (mobile bottom nav). The `.last()` selector on its own returns the bottom nav at both viewports but that nav is not visible at desktop.
- **Persist verification via localStorage**: FAV-TEST-03-3 avoids `page.reload()` because the `beforeEach` `addInitScript` would clear `nicu:favorites` on reload, defeating the persistence test. Instead, `page.evaluate(() => localStorage.getItem('nicu:favorites'))` directly reads the stored value after UI interaction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FAV-TEST-03-2 and 03-4: page.evaluate for localStorage setup + reload was defeated by beforeEach addInitScript**
- **Found during:** Task 1 (first test run)
- **Issue:** Plan's test 03-2 and 03-4 used `page.evaluate()` to set localStorage then `page.reload()`. The `beforeEach`'s `page.addInitScript` runs on every navigation including reload and clears `nicu:favorites`, so the evaluate-then-reload pattern never persisted.
- **Fix:** Changed to `page.addInitScript` in the test body (registered before reload). Since addInitScript runs in registration order, the test-body SET fires after the beforeEach REMOVE, so SET wins.
- **Files modified:** `e2e/favorites-nav.spec.ts`
- **Commit:** `596328e`

**2. [Rule 1 - Bug] FAV-TEST-03-3: reload-based persistence check defeated by beforeEach addInitScript**
- **Found during:** Task 1 (first test run — showed 4 tabs after reload instead of 3)
- **Issue:** `page.reload()` triggers `beforeEach`'s `addInitScript` which clears `nicu:favorites`, then app defaults to 4 tabs.
- **Fix:** Verify persistence via `page.evaluate(() => localStorage.getItem('nicu:favorites'))` — checks the stored value directly without reloading.
- **Files modified:** `e2e/favorites-nav.spec.ts`
- **Commit:** `596328e`

**3. [Rule 1 - Bug] Desktop viewport: `.last()` on nav returns hidden bottom nav with 0 tabs**
- **Found during:** Task 1 (FAV-TEST-03-1 desktop: expected 3 tabs, got 0)
- **Issue:** At 1280px viewport, the mobile bottom nav is `md:hidden`. Querying `.last()` returns the hidden bottom nav with 0 visible tabs instead of the desktop top nav.
- **Fix:** Added `isDesktop = vp.width >= 768` constant; used `.first()` for desktop (top nav in header), `.last()` for mobile (bottom nav).
- **Files modified:** `e2e/favorites-nav.spec.ts`
- **Commit:** `596328e`

---

**Total deviations:** 3 auto-fixed (all Rule 1 — test logic bugs discovered on first run)
**Impact on plan:** Test behavior and assertions unchanged; implementation corrected for Playwright API semantics.

## Pre-existing Failures (Out of Scope)

Two `navigation.spec.ts` tests fail against the current NavShell (pre-existing from Wave 1):
- `top title bar shows app name, info, and theme toggle` — asserts `header.getByRole('button', { name: /about/i })` but the About button moved into the hamburger menu in Phase 40
- `info button opens the about sheet` — same stale locator

These failures exist at commit `4226e7d` (the Wave 1 base) and are not caused by this plan's changes. Logged to deferred-items.

## Issues Encountered

- The NICU assistant dev server was not running on port 5173 (which was occupied by pert-calculator). The NICU server was on port 5178. Used `PLAYWRIGHT_BASE_PORT` env var to override `playwright.config.ts` baseURL during testing; reverted the config change before committing.
- The `PLAYWRIGHT_TEST_BASE_URL` env var does NOT override baseURL in Playwright 1.59 — only a temporary config modification or `--base-url` flag (which doesn't exist in 1.59) works. The `PLAYWRIGHT_BASE_PORT` override pattern was added temporarily.

## User Setup Required

None.

## Next Phase Readiness

- Phase 41 is complete: NAV-FAV-01..04 (Wave 1) + FAV-TEST-03 + FAV-TEST-04 (Wave 2) all closed
- Phase 42 (UAC/UVC calculator) can proceed — NavShell is favorites-driven and registry-ready for a 5th calculator

---
*Phase: 41-favorites-driven-navigation*
*Completed: 2026-04-23*

## Self-Check: PASSED

Files verified:
- `e2e/favorites-nav.spec.ts` — FOUND
- `e2e/favorites-nav-a11y.spec.ts` — FOUND
- `.planning/phases/41-favorites-driven-navigation/41-02-SUMMARY.md` — FOUND

Commits verified:
- `596328e` — FOUND (test: FAV-TEST-03 E2E favorites flow spec)
- `35cc291` — FOUND (test: FAV-TEST-04 axe sweep of open hamburger)

Test results: 8 passed (favorites-nav.spec.ts) + 2 passed (favorites-nav-a11y.spec.ts) = 10 new test instances; 0 new failures introduced
