---
phase: 45-desktop-full-nav-divergence
plan: 02
subsystem: ui
tags: [playwright, e2e, navigation, responsive, hamburger, viewport, divergence, NAV-ALL-TEST-01]

# Dependency graph
requires:
  - phase: 45-desktop-full-nav-divergence
    plan: 01
    provides: Post-divergence NavShell — desktop renders 5 tabs (registry-driven), mobile renders favorites-driven 4-cap; horizontal scroll affordance + auto-scroll active tab + ResizeObserver-driven mask fade.
  - phase: 41-favorites-driven-navigation
    provides: HamburgerMenu "Remove {label} from favorites" / "Add {label} to favorites" aria-labels (selector contract), `nicu:favorites` localStorage shape, "Open calculator menu" button label.
  - phase: 42-uac-uvc-calculator
    provides: 5th calculator (UAC/UVC) — exercises the >4 tabs scenario at narrow desktop (NAV-ALL-TEST-01d).
provides:
  - e2e/desktop-full-nav.spec.ts — 4 Playwright tests (NAV-ALL-TEST-01a..d) covering the desktop/mobile rendering divergence at runtime.
affects: [45-03-PLAN, future-favorites-nav-spec-update]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Playwright `page.setViewportSize` per-test (instead of describe-level `test.use({ viewport })`) — used when a single describe block exercises multiple viewports (1280, 768, 375)."
    - "`expect(activeTab).toBeInViewport()` (Playwright 1.43+) as runtime proof of `Element.scrollIntoView({ inline: 'nearest' })` auto-scroll — the runtime equivalent of source-string assertion in jsdom (where ResizeObserver + scrollIntoView are no-ops)."

key-files:
  created:
    - e2e/desktop-full-nav.spec.ts
  modified: []

key-decisions:
  - "All 4 tests spliced verbatim from RESEARCH.md §3 — zero deviations from research drafts."
  - "Per-test inline `page.setViewportSize()` chosen over describe-level `test.use({ viewport })` because each test runs at a deliberately distinct viewport (01a/01b/01c at 1280, 01b mid-test resize to 375, 01d at 768)."
  - "New file (not extended `e2e/favorites-nav.spec.ts`) — that file's assertion model is 'favorites bar matches favorites set,' which is the OPPOSITE of Phase 45's desktop assertion. Mixing them would obscure intent and complicate rollback if Phase 45 is ever reverted."
  - "Verified under CI mode (build + preview :4173, `reuseExistingServer: false`) to guarantee the test runs against the worktree's post-Wave-1 NavShell — not against a stale dev server from another checkout."

patterns-established:
  - "When multiple worktrees may have a dev server on :5173, run Playwright with `CI=1` to force the build+preview server on :4173 (`reuseExistingServer: false`) and isolate tests from cross-worktree pollution."

requirements-completed: [NAV-ALL-TEST-01]

# Metrics
duration: 4min
completed: 2026-04-25
---

# Phase 45 Plan 02: Desktop Full-Nav E2E Coverage Summary

**Created `e2e/desktop-full-nav.spec.ts` — 4 verbatim Playwright tests (NAV-ALL-TEST-01a..d) lock the runtime divergence: desktop @1280 always renders 5 calculators regardless of favorites state; mobile @375 still tracks favorites; narrow desktop @768 auto-scrolls the active tab into view.**

## Performance

- **Duration:** ~4 min (file creation + verification + commit)
- **Started:** 2026-04-25T04:51:00Z
- **Completed:** 2026-04-25T04:55:00Z
- **Tasks:** 1
- **Files created:** 1
- **Files modified:** 0

## Accomplishments

- Created `e2e/desktop-full-nav.spec.ts` (100 lines) containing the 4 NAV-ALL-TEST-01 sub-tests verbatim from RESEARCH.md §3.
- Verified all 4 tests pass under CI mode (`CI=1 pnpm exec playwright test e2e/desktop-full-nav.spec.ts`) against the post-Wave-1 NavShell shipped in commits 430397f / f505410 / c672960.
- Confirmed pattern parity with `e2e/favorites-nav.spec.ts`: same `addInitScript` localStorage clear, same hamburger toggle idiom (`Open calculator menu` → `dialog` → `remove feeds from favorites` → `Escape`), same `.first()` (desktop) / `.last()` (mobile) selector convention on `nav[aria-label="Calculator navigation"]`.
- Confirmed `e2e/navigation.spec.ts` (NAV-ALL-04 hamburger-button-visible regression guard) is unaffected — 8/8 pass.

## Task Commits

1. **Task 1: Create e2e/desktop-full-nav.spec.ts (NAV-ALL-TEST-01a..d)** — `71e5678` (test)

## Files Created/Modified

- **e2e/desktop-full-nav.spec.ts (NEW, 100 lines):**
  - `test.describe('Desktop full-nav divergence (Phase 45)')` block.
  - `beforeEach` registers an `addInitScript` to remove `nicu:favorites` and `nicu:disclaimer-accepted` (canonical Phase 41 idiom).
  - **NAV-ALL-TEST-01a** @1280: asserts the first nav has 5 tabs in registry order (Morphine, Formula, GIR, Feeds, UAC/UVC).
  - **NAV-ALL-TEST-01b** @1280 → @375: opens hamburger, un-favorites Feeds, asserts desktop nav still has 5 tabs (Feeds visible), then resizes to 375x667 and asserts mobile nav has 3 tabs and Feeds is gone (`toHaveCount(0)` on `{ name: /feeds/i }` filter).
  - **NAV-ALL-TEST-01c** @1280 with seeded `{ v: 1, ids: [] }`: asserts desktop nav still has 5 tabs (zero-favorites edge case).
  - **NAV-ALL-TEST-01d** @768 on `/uac-uvc`: asserts all 5 tabs render and `expect(activeTab).toBeInViewport()` — runtime proof of A2 auto-scroll.

## NAV-ALL-TEST-01 Traceability

| Requirement clause | Covering test(s) | Assertion |
|--------------------|------------------|-----------|
| Desktop @1280 renders all 5 calculators with default favorites | 01a | `toHaveCount(5)` + ordered `toContainText` per registry order |
| Toggle non-favorite calc off via hamburger → remains in desktop top bar but disappears from mobile bottom bar @375 | 01b | desktop `toHaveCount(5)` + `toBeVisible` on Feeds; mobile `toHaveCount(3)` + `toHaveCount(0)` on Feeds |
| Zero favorites edge case | 01c | seeded `{ v: 1, ids: [] }` → desktop `toHaveCount(5)` |
| Narrow desktop @768 (Tailwind `md` breakpoint) — A1 horizontal scroll + A2 auto-scroll + A3 fade overlay | 01d | `toHaveCount(5)` + `toBeInViewport()` on UAC/UVC active tab |

All 4 plan-level "must_have truths" satisfied verbatim:
- ✅ Spec @1280 asserts all 5 registered calculators visible regardless of favorites state (01a + 01c)
- ✅ Spec toggles Feeds off via hamburger → desktop 5 (Feeds visible), mobile 3 (Feeds gone) (01b)
- ✅ Spec covers zero-favorites edge case `{ v: 1, ids: [] }` → desktop still 5 (01c)
- ✅ Spec @768 asserts all 5 tabs render and active tab is in viewport (01d)

## Decisions Made

All decisions from CONTEXT.md (D-01..D-09) honored at the test level. The test file makes the runtime divergence observable to CI; no new design decisions were introduced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree had no `node_modules`; installed dependencies before running Playwright**

- **Found during:** Task 1 verification (`pnpm exec playwright test`)
- **Issue:** This worktree is freshly created and shares no `node_modules` with the main checkout. `pnpm exec playwright` returned `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL — Command "playwright" not found`.
- **Fix:** Ran `pnpm install --frozen-lockfile` (7.5s — uses the central pnpm store). No `package.json` / `pnpm-lock.yaml` modification.
- **Files modified:** none (only `node_modules/` populated)
- **Committed in:** N/A (build artifact, not source)

**2. [Rule 3 - Blocking] Stale dev server on :5173 from another checkout served pre-Wave-1 code**

- **Found during:** Task 1 verification — the first Playwright run reported `expected 5, received 4` (and 3 in 01b after un-favoriting).
- **Issue:** A dev server from `/mnt/data/src/nicu-assistant` (the main checkout, pre-Wave-1) was already listening on :5173. Playwright's local config is `reuseExistingServer: true` on :5173, so it bound to that stale server instead of starting a new one against the worktree's post-Wave-1 source. The pre-Wave-1 NavShell is favorites-driven on desktop (`visibleCalculators` for both bars), explaining the 4/3 tab counts.
- **Fix:** Re-ran with `CI=1`, which switches `playwright.config.ts` to `pnpm run build && pnpm run preview --port 4173` with `reuseExistingServer: false`. This builds the worktree's source (Wave 1 included) and serves it on a worktree-isolated port.
- **Files modified:** none (config supports both modes already)
- **Committed in:** N/A (test invocation only)
- **Documented as new pattern** under `patterns-established` for future parallel-wave executors.

**3. [Out of scope — deferred] `e2e/favorites-nav.spec.ts` desktop assertions are now stale**

- **Found during:** plan-level regression check (`CI=1 pnpm exec playwright test e2e/favorites-nav.spec.ts`)
- **Issue:** Phase 41's `favorites-nav.spec.ts` runs every test at both `mobile (375x667)` and `desktop (1280x800)` viewports and asserts the favorites-bar count matches the favorites set (e.g., `toHaveCount(3)` after un-favoriting Feeds). Post-Wave-1 the **desktop** is registry-driven (always 5), so the desktop arm of FAV-TEST-03-1..03-4 fails (4 tests × 1 viewport = 4 fails). The mobile arm is unaffected (4 tests pass).
- **Fix:** **Not applied — out of scope.** This worktree (Wave 2 / Plan 45-02) only owns `e2e/desktop-full-nav.spec.ts`. Updating `favorites-nav.spec.ts` is the responsibility of Plan 45-03 (running concurrently in another worktree). Per wave isolation note: "Your only file scope is `e2e/desktop-full-nav.spec.ts`."
- **Status:** logged here for visibility; Plan 45-03 is expected to either scope FAV-TEST-03-1..03-4 to mobile-only or update the desktop assertions to reflect the new 5-always contract.
- **Verifier check (recommended):** confirm `e2e/favorites-nav.spec.ts` is updated (or scoped) by 45-03 before phase-gate.

---

**Total deviations:** 2 auto-fixed (both blocking, both environmental — no source-code changes), 1 out-of-scope deferred.
**Impact on plan:** None. The deliverable file is exactly as specified; its assertions are exactly as drafted in RESEARCH.md.

## Issues Encountered

None beyond the deviations above. The spec was greenfield and applied cleanly on first write.

## User Setup Required

None — no external service configuration required.

## Self-Check: PASSED

- `e2e/desktop-full-nav.spec.ts` exists (100 lines).
- `grep -F "Desktop full-nav divergence (Phase 45)"` matches.
- `grep -c "NAV-ALL-TEST-01[abcd]"` returns 4.
- `grep -cF "page.setViewportSize({ width: 1280, height: 800 })"` returns 3 (01a, 01b initial, 01c).
- `grep -cF "page.setViewportSize({ width: 768, height: 800 })"` returns 1 (01d).
- `grep -cF "page.setViewportSize({ width: 375, height: 667 })"` returns 1 (01b mobile resize).
- `grep -cF "page.locator('nav[aria-label=\"Calculator navigation\"]').first()"` returns 4 (one per test).
- `grep -cF "page.locator('nav[aria-label=\"Calculator navigation\"]').last()"` returns 1 (01b mobile assertion).
- `grep -cF "toHaveCount(5)"` returns 4 (one per test).
- `grep -cF "toHaveCount(3)"` returns 1 (01b mobile = 3).
- `grep -cF "toHaveCount(0)"` returns 1 (01b — Feeds gone from mobile).
- `grep -cF "remove feeds from favorites"` returns 1.
- `grep -cF "JSON.stringify({ v: 1, ids: [] })"` returns 1 (01c zero-favorites).
- `grep -cF "toBeInViewport"` returns 1 (01d).
- `grep -cF "/uac-uvc"` returns 1 (01d).
- `grep -cF "addInitScript"` returns 3 (1 in beforeEach + 1 in 01c + 1 SET-after-REMOVE override).
- `CI=1 pnpm exec playwright test e2e/desktop-full-nav.spec.ts` exits 0 — 4 passed (21.5s).
- `CI=1 pnpm exec playwright test e2e/navigation.spec.ts` exits 0 — 8 passed (no NAV-ALL-04 regression).
- Commit `71e5678` exists in `git log --oneline` (Task 1: test).

## Next Phase Readiness

NAV-ALL-TEST-01 is now covered at runtime via `e2e/desktop-full-nav.spec.ts`. Plan 45-03 (running concurrently in another worktree) will own the axe sweep (NAV-ALL-TEST-03) and any updates to `e2e/favorites-nav.spec.ts` to reflect the post-Wave-1 desktop contract. Phase 45 will be ready for `/gsd-secure-phase` audit + phase-gate verification once Wave 2 closes.

---
*Phase: 45-desktop-full-nav-divergence*
*Plan: 02*
*Completed: 2026-04-25*
