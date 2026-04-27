---
phase: 42-uac-uvc-calculator
plan: 03
subsystem: testing
tags:
  - playwright
  - e2e
  - axe
  - a11y
  - favorites-flow
  - regression-guard

# Dependency graph
requires:
  - phase: 42-uac-uvc-calculator
    plan: 01
    provides: /uac-uvc route shell, src/lib/uac-uvc/ module (state, calculations, parity fixtures), identity-uac OKLCH tokens
  - phase: 42-uac-uvc-calculator
    plan: 02
    provides: UacUvcCalculator.svelte — inputs card (textbox + slider bidirectional sync) + dual hero cards (UAC/UVC with D-05 three-cue distinction)
  - phase: 40-favorites-store-hamburger-menu
    provides: HamburgerMenu aria-label contract (star add/remove/cap-full), localStorage key 'nicu:favorites', cap-full caption with em-dash
  - phase: 41-favorites-driven-navigation
    provides: NavShell mobile bottom-bar (last nav[aria-label="Calculator navigation"]) that grows/shrinks with favorites
provides:
  - e2e/uac-uvc.spec.ts — viewport-loop happy path (mobile 375 + desktop 1280) + favorites round-trip (un-favorite Feeds → star UAC/UVC) + cap-full disabled-star arm + reload persistence + slider drag sync (9 tests)
  - e2e/uac-uvc-a11y.spec.ts — axe sweeps in light + dark mode at /uac-uvc (2 tests)
  - Project axe sweep total bumped from 20/20 to 22/22
  - Phase 41's synthetic un-fav-then-re-fav Feeds round-trip promoted to a real round-trip using UAC/UVC as the 5th calculator (fulfills Phase 41 D-10 promise)
  - Live-browser validation of UAC-ARCH-05 (NavShell registry-driven activeCalculatorId handles /uac-uvc with zero edits — verified implicitly by the favorites-round-trip where non-favorited UAC/UVC route does not grow a tab)
affects:
  - Closes Phase 42 — all 18 requirements satisfied across plans 42-01, 42-02, 42-03

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composed Playwright spec — viewport-loop happy path (from e2e/gir.spec.ts) + favorites round-trip at canonical mobile viewport (from e2e/favorites-nav.spec.ts) in a single topically-focused file"
    - "addInitScript REMOVE in beforeEach + SET script registered in test body — SET wins because addInitScript scripts run on every navigation in registration order"
    - "Cap-full aria-label regex /add uac\\/uvc to favorites \\(limit reached/i — substring-matches the HamburgerMenu template regardless of trailing punctuation; distinguishes the cap-blocked variant from the plain \"Add UAC/UVC to favorites\" (no parenthesis) via exact-anchor /^add uac\\/uvc to favorites$/i"
    - "Dark-mode axe sweep gated behind `no-transition` class + 250ms wait — suppresses theme-transition flicker so axe sees a settled DOM"

key-files:
  created:
    - e2e/uac-uvc.spec.ts
    - e2e/uac-uvc-a11y.spec.ts
    - .planning/phases/42-uac-uvc-calculator/deferred-items.md
  modified: []

key-decisions:
  - "Favorites round-trip runs at mobile viewport only (not looped across mobile + desktop) — matches the e2e/favorites-nav.spec.ts canonical convention and keeps test count tight (9 tests vs. 12). Plan explicitly allowed either shape."
  - "Cap-full aria-label template confirmed from HamburgerMenu.svelte:117 is `Add UAC/UVC to favorites (limit reached — remove one to add another)` (NOT `… — 4 of 4)` as the plan skeleton hinted). Regex /add uac\\/uvc to favorites \\(limit reached/i matches the actual live string."
  - "Plain \"Add UAC/UVC to favorites\" star selector anchored with /^add uac\\/uvc to favorites$/i to PREVENT accidental match against the cap-full variant (which starts with the same prefix). Without the $ anchor both variants would match."
  - "Reload-persistence test uses an addInitScript SET script before the reload — the beforeEach REMOVE runs first on every navigation, so naively reloading after a star-click would wipe the favorite. SET script registered after the star-click re-seeds the post-star state for the reload."
  - "Optional 3rd focus-ring axe sweep NOT included — keeps Phase 42 at the minimum-viable 2 sweeps per D-16. Project total lands at 22/22 (not 23/23). OKLCH focus-ring contrast is pre-verified in RESEARCH.md and Phase 42 has no focus-ring-specific regressions to guard against."
  - "Mobile bar selector uses .last() (not .first()) because viewport=375 hides the desktop nav via md:hidden — the bottom bar is the only visible nav. Matches e2e/favorites-nav.spec.ts convention line 61."

patterns-established:
  - "Composed viewport-loop + favorites-splice Playwright spec shape — single file contains both calculator-specific regression tests (looped across 375 + 1280) AND favorites-flow round-trip (canonical mobile viewport only). Topically owned by the calculator, not split into two files."
  - "Minimum-viable axe sweep count per calculator — 2 sweeps (light + dark) establish the project's '22/22 style' baseline for future calculators (GIR's 6-sweep variant set was a bucket/advisory-specific expansion; Phase 42 documents that 2 is sufficient when the surface has neither)."

requirements-completed:
  - UAC-TEST-03
  - UAC-TEST-04
  - UAC-ARCH-05

# Metrics
duration: 14min
completed: 2026-04-24
---

# Phase 42 Plan 03: UAC/UVC E2E + Axe Playwright Tests Summary

**Playwright E2E (e2e/uac-uvc.spec.ts — 236 lines, 9 tests) covers happy path at 375 + 1280, inputmode="decimal" regression, slider-drags-textbox sync, and the favorites round-trip (un-favorite Feeds → star UAC/UVC → bar ends at 4 tabs, cap-full disables UAC/UVC star with cap caption visible, reload persists across sessions). Axe a11y suite (e2e/uac-uvc-a11y.spec.ts — 65 lines, 2 tests) sweeps /uac-uvc in light + dark mode with 0 violations first-run — .identity-uac OKLCH quartet was pre-verified at ≥ 7.66:1. Closes UAC-TEST-03 + UAC-TEST-04 + the live-browser validation of UAC-ARCH-05. Project axe total: 20/20 → 22/22.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-04-24T19:44:00Z
- **Completed:** 2026-04-24T20:05:30Z
- **Tasks:** 2 (+ 1 ancillary docs commit for deferred-items)
- **Files created:** 3 (2 specs + 1 deferred-items log)
- **Files modified:** 0
- **Commits:** 3 (2 test commits + 1 docs commit)

## Accomplishments

- Shipped `e2e/uac-uvc.spec.ts` (236 lines, ≥ 120 minimum — well above) with 9 Playwright tests:
  - **Happy path @ mobile (375) + desktop (1280), 3 tests each = 6 tests:**
    1. Renders heading "UAC/UVC Catheter Depth" + both eyebrows with em-dash (U+2014: `UAC DEPTH — ARTERIAL`, `UVC DEPTH — VENOUS`) + hero values 16.5 / 8.3 at weight 2.5 kg + `cm` suffix.
    2. `inputmode="decimal"` regression guard on Weight textbox.
    3. Slider drag (via `fill('5')` on the range input) syncs the textbox to `'5'` AND updates both hero cards to UAC 24.0 / UVC 12.0 — full bidirectional sync verified at the E2E layer.
  - **Favorites round-trip @ mobile only (canonical per `e2e/favorites-nav.spec.ts`), 3 tests:**
    1. **Un-favorite Feeds → star UAC/UVC → bar ends with 4 tabs including UAC/UVC** — the real Phase 42 round-trip that replaces Phase 41's synthetic un-fav-then-re-fav Feeds flow. Also asserts `localStorage.nicu:favorites.ids` contains `'uac-uvc'` and no longer contains `'feeds'`.
    2. **Cap-full disabled-star arm** — seed `['morphine-wean', 'formula', 'gir', 'feeds']` before hydration, open hamburger, assert cap caption `"4 of 4 favorites — remove one to add another."` is visible AND the UAC/UVC star (`Add UAC/UVC to favorites (limit reached — remove one to add another)`) has `aria-disabled="true"` + HTML `disabled`. This verifies the Phase 40 D-05 contract with UAC/UVC as the non-favorited 5th calculator for the first time in a non-synthetic flow.
    3. **Reload persistence** — favorite UAC/UVC, re-seed via `addInitScript` (so the beforeEach REMOVE does not wipe the favorite on reload), reload, assert UAC/UVC still in the nav bar AND `localStorage.nicu:favorites.ids` still contains `'uac-uvc'`.
- Shipped `e2e/uac-uvc-a11y.spec.ts` (65 lines, ≥ 40 minimum) with 2 axe sweeps:
  - Light mode: remove `dark` / add `light` + `data-theme="light"` on `<html>`, run `AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()`, assert zero violations.
  - Dark mode: add `no-transition` class (suppresses theme-transition flicker so axe sees a settled DOM — matches `e2e/gir-a11y.spec.ts:32-38`), swap to dark, wait 250ms, run axe, assert zero violations.
- Both sweeps **passed on first run**, confirming the pre-verified `.identity-uac` OKLCH quartet contrast math (≥ 7.66:1 on every identity surface) is correct end-to-end — no component retune, no token retune needed (per RESEARCH.md Pitfall #1).

## Task Commits

Each task was committed atomically (worktree executor — `--no-verify` per parallel-executor protocol):

1. **Task 1: `e2e/uac-uvc.spec.ts` — viewport-loop happy path + favorites round-trip + cap-full + reload + slider drag** — `11b9ca6` (test)
2. **Task 2: `e2e/uac-uvc-a11y.spec.ts` — axe sweeps light + dark** — `2938e5b` (test)
3. **Ancillary: deferred-items.md logging pre-existing navigation.spec.ts failures (DEFER-42-03-01)** — `e4c2ff5` (docs)

## Files Created/Modified

### Created

- `e2e/uac-uvc.spec.ts` (236 lines) — Playwright E2E spec. Imports only `@playwright/test` (no axe-core, no other deps). Uses `page.addInitScript` (3 call sites: 1 in beforeEach for REMOVE + 2 in test bodies for SET), viewport-loop wrapping `test.describe`, and the canonical `getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {})` disclaimer-dismiss pattern in every beforeEach.
- `e2e/uac-uvc-a11y.spec.ts` (65 lines) — Playwright axe-sweep spec. Imports `AxeBuilder` from `@axe-core/playwright` and uses `.withTags(['wcag2a', 'wcag2aa']).analyze()`. 2 tests (light + dark), both passing.
- `.planning/phases/42-uac-uvc-calculator/deferred-items.md` — one-entry log documenting DEFER-42-03-01 (pre-existing `navigation.spec.ts` failures from Phase 40 commit `00e66f8` that moved About into the hamburger).

### Modified

None. Plan 42-03 is test-only — zero edits to components, routes, or shared types (per plan success_criteria: "Zero edits to any file outside `e2e/`").

## Decisions Made

- **Favorites round-trip at mobile viewport only (not viewport-looped):** The plan `<behavior>` section explicitly accepted either shape. Matching `e2e/favorites-nav.spec.ts` convention (which runs the flow at both viewports but uses the same `.last()`/`.first()` nav selector) is cleaner, but Phase 42's canonical check is the mobile bottom bar — and the favorites flow depends on the hamburger (which is the same at both viewports, so desktop coverage would be redundant). Keeping mobile-only holds the test count tight (9 vs. 12) without losing coverage.
- **Cap-full aria-label regex narrowed:** Confirmed the live string from HamburgerMenu.svelte:117 is `"Add UAC/UVC to favorites (limit reached — remove one to add another)"`. The plan skeleton's regex `/add uac\/uvc to favorites \(limit reached/i` still matches as a substring, but the plain `/add uac\/uvc to favorites/i` would also match the cap-full variant (same prefix). Used `^` anchor in `/^add uac\/uvc to favorites$/i` for the plain-add selector to keep the two variants disjoint.
- **Reload-persistence flow adjusted:** The naive "star UAC/UVC, then page.reload()" would re-run the beforeEach REMOVE script during reload and wipe the favorite before hydration. Fixed by registering a second `addInitScript` SET script (with the post-star state) AFTER the star-click but BEFORE the reload. This mirrors the pattern at `e2e/favorites-nav.spec.ts:73-79`.
- **Dropped optional focus-ring axe sweep:** Kept the spec at minimum-viable 2 sweeps per D-16. The OKLCH quartet is pre-verified to pass with the focus ring visible; adding a third sweep without a specific regression to guard against is busy work.
- **Full-suite regression run disclosed 2 pre-existing failures:** `navigation.spec.ts:22` and `navigation.spec.ts:80` both look for an About button on the top banner that Phase 40 commit `00e66f8` moved into the hamburger drawer. These are NOT Plan 42-03 regressions — my specs are purely additive. Logged as DEFER-42-03-01 in `deferred-items.md`.

## Deviations from Plan

### Rule 3 — Plan skeleton regex over-matches (auto-fixed inline)

**1. [Rule 3 - Blocking-if-not-fixed] Plain-add aria-label regex anchored with `^…$` to disambiguate from cap-full variant**

- **Found during:** Task 1, before first test run — inspection of the live HamburgerMenu.svelte showed both the plain-add aria-label (`Add UAC/UVC to favorites`) and the cap-full variant (`Add UAC/UVC to favorites (limit reached — remove one to add another)`) share the same prefix. The plan skeleton used `/add uac\/uvc to favorites/i` for the plain case, which also matches the cap-full variant.
- **Issue:** Without anchors, the "favorite UAC/UVC" steps in tests 1 and 3 would ambiguously match either button when both exist simultaneously (though in practice only the plain button is enabled at the moment we click it — still, strictness improves the test's self-documenting quality).
- **Fix:** Used `/^add uac\/uvc to favorites$/i` (with `^…$` anchors) for the plain-add click target, and kept the plan's substring regex `/add uac\/uvc to favorites \(limit reached/i` for the cap-full selector (which is inherently disjoint because of the `(` character).
- **Files modified:** `e2e/uac-uvc.spec.ts` (authored with the correct regex from the start — no re-edit needed).

### Rule 3 — Reload-persistence needs SET before reload

**2. [Rule 3 - Blocking-if-not-fixed] Reload test re-seeds favorites via addInitScript before reload**

- **Found during:** Task 1, writing the reload-persistence test — the beforeEach REMOVE script runs on EVERY navigation (confirmed by the explicit comment in `e2e/favorites-nav.spec.ts:6-8`), so a naive reload after star-click would clear the favorite before the page hydrates.
- **Issue:** Plan skeleton showed "star UAC/UVC" → "reload" → "assert UAC/UVC in bar" with no intervening `addInitScript` SET.
- **Fix:** Registered a second `addInitScript` SET script (reflecting the post-star state `['morphine-wean','formula','gir','uac-uvc']`) AFTER the star-click but BEFORE the reload. This runs on the next navigation AFTER the beforeEach REMOVE, so SET wins. Verified by the existing pattern at `e2e/favorites-nav.spec.ts:73-79`.
- **Files modified:** `e2e/uac-uvc.spec.ts` (authored correctly from the start; decision documented here).

### Out-of-scope, deferred

**3. Pre-existing `e2e/navigation.spec.ts` failures — logged, not fixed**

- **Found during:** Task 2 full-suite regression run (`pnpm exec playwright test`).
- **Issue:** 2 failures in `e2e/navigation.spec.ts` (lines 17-24 and 79-82) assert an About button in the top banner; Phase 40 commit `00e66f8` moved About into the hamburger drawer.
- **Fix:** None — out of Plan 42-03 scope (this plan only adds new spec files, does not edit existing specs or shell components). Logged as DEFER-42-03-01 in `.planning/phases/42-uac-uvc-calculator/deferred-items.md`.

## Issues Encountered

None during planned work. Pre-existing `navigation.spec.ts` failures (DEFER-42-03-01) surfaced during the regression guard but are documented and handed off.

## Plan-Level Verification Gate Results

- `pnpm exec playwright test e2e/uac-uvc.spec.ts` → **9/9 passed** (6.5s wall-clock). Test breakdown:
  - Happy path × mobile × 3 tests = 3
  - Happy path × desktop × 3 tests = 3
  - Favorites round-trip × mobile × 3 tests = 3
- `pnpm exec playwright test e2e/uac-uvc-a11y.spec.ts` → **2/2 passed** (2.6s wall-clock) — zero violations in both light and dark mode on first run.
- `pnpm exec svelte-check --tsconfig ./tsconfig.json` → **0 errors, 0 warnings** (4545 files).
- `pnpm exec vitest run` → **281/281 passed** across 25 test files (no regression from adding the spec files — vitest ignores `e2e/`).
- `pnpm exec playwright test` (full suite) → **82 passed, 2 failed, 3 skipped.** The 2 failures are pre-existing (`e2e/navigation.spec.ts` About-button assertions) and are documented in `deferred-items.md` as DEFER-42-03-01. All 9 new UAC/UVC E2E + 2 new axe tests are in the 82 passed count.
- Axe sweep project total: **22/22** (20 from prior phases + 2 from Plan 42-03).

## Threat Flags

_None._ Plan 42-03 introduces no new network endpoints, auth paths, file access, or schema changes at trust boundaries. Playwright specs drive a local browser against the SvelteKit dev server (same-origin, no external calls). axe-core inspects DOM; no security implications. The threat register entry `T-42-N/A` from the plan frontmatter remains applicable.

## Known Stubs

_None._ Both spec files are shipped complete. No placeholder tests, no `test.skip()` markers, no TODO comments.

## User Setup Required

None — no external service configuration, no environment variables, no new dependencies. `@axe-core/playwright@4.11.2` is already installed (confirmed at `node_modules/@axe-core/playwright → .pnpm/@axe-core+playwright@4.11.2_playwright-core@1.59.1`).

## Success Criteria Coverage

- **UAC-TEST-03 closed:** Viewport 375 + 1280 happy paths green (6 tests); `inputmode="decimal"` regression passes (2 tests across viewports); slider-drags-textbox sync verified at E2E layer with both hero values updating (2 tests across viewports).
- **UAC-TEST-04 closed:** `/uac-uvc` light + dark axe sweeps pass with zero violations on first run. OKLCH quartet pre-verified at ≥ 7.66:1 in RESEARCH.md — no tuning loop.
- **UAC-ARCH-05 live-browser validated:** The favorites round-trip test navigates between `/` (favorited route `morphine-wean`) and `/uac-uvc` (non-favorited until star) — NavShell's `activeCalculatorId` resolves `/uac-uvc` to `'uac-uvc'` via `CALCULATOR_REGISTRY.find(...)` (Phase 41 D-05) without any NavShell edits. Implicit validation via the cap-full test's DOM inspection.
- **Favorites end-to-end flow verified with UAC/UVC as the real 5th calculator** — star → bar update → reload persists; cap-full disables. Replaces Phase 41's synthetic un-fav-then-re-fav Feeds round-trip (fulfills Phase 41 D-10 promise).
- **Project axe total reaches 22/22.**
- **Zero edits to any file outside `e2e/`** — confirmed via `git show --stat` on both test commits (only `e2e/uac-uvc.spec.ts` and `e2e/uac-uvc-a11y.spec.ts` touched, respectively).

## Next Phase Readiness

Phase 42 is complete:
- **Plan 42-01 (Wave 0):** UAC/UVC scaffolding + calcs + state + parity tests + route shell — shipped.
- **Plan 42-02 (Wave 1):** UacUvcCalculator.svelte + component tests + route wiring — shipped.
- **Plan 42-03 (Wave 2):** E2E + axe Playwright tests — shipped.

All 18 Phase 42 requirements (UAC-01..09, UAC-ARCH-01..05, UAC-TEST-01..04) are closed. The phase verifier should find nothing blocking.

## Self-Check

Verified all created files exist and all task commit hashes are present in the local git log.

**Files:**
- FOUND: `e2e/uac-uvc.spec.ts` (236 lines)
- FOUND: `e2e/uac-uvc-a11y.spec.ts` (65 lines)
- FOUND: `.planning/phases/42-uac-uvc-calculator/deferred-items.md`

**Commits:**
- FOUND: `11b9ca6` (Task 1 — E2E spec)
- FOUND: `2938e5b` (Task 2 — axe a11y spec)
- FOUND: `e4c2ff5` (ancillary — deferred-items log)

## Self-Check: PASSED

---
*Phase: 42-uac-uvc-calculator*
*Plan 03 of 03 — Phase 42 COMPLETE*
*Completed: 2026-04-24*
