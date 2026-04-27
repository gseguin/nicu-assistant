---
phase: 45-desktop-full-nav-divergence
plan: 01
subsystem: ui
tags: [svelte5, sveltekit, runes, $effect, $derived, ResizeObserver, scrollIntoView, mask-image, prefers-reduced-motion, vitest, jsdom, navigation, responsive]

# Dependency graph
requires:
  - phase: 41-favorites-driven-navigation
    provides: visibleCalculators $derived from favorites store; T-01..T-06 NavShell vitest suite; mobile bottom-bar contract preserved
  - phase: 42-uac-uvc-calculator
    provides: 5th calculator entry (UAC/UVC) in CALCULATOR_REGISTRY — exercises the >4 desktop overflow case
provides:
  - desktopVisibleCalculators const = full CALCULATOR_REGISTRY (registry-driven, immune to favorites)
  - mobileVisibleCalculators $derived (renamed from visibleCalculators, body unchanged)
  - Inner <div role="tablist"> as scroll container with .tablist-scroll class + bind:this={tablistEl} + class:is-overflowing
  - Auto-scroll-active-tab $effect (route-change driven, prefers-reduced-motion override per WCAG 2.3.3)
  - ResizeObserver $effect toggling isOverflowing on scrollWidth > clientWidth, with explicit ro.disconnect() teardown
  - 24px right-edge mask-image fade gated on .is-overflowing (with -webkit-mask-image fallback)
  - T-07..T-12 vitest coverage for desktopVisibleCalculators under 4/2/0 favorites + active-tab-always-lit at /uac-uvc + source-string structural assertions
  - Element.prototype.scrollIntoView no-op shim in test-setup.ts
affects: [45-02-PLAN, 45-03-PLAN, future-calculator-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-scope readonly const for static derivations of frozen registries (companion to existing byId Map pattern)
    - Auto-scroll active tab pattern via scrollIntoView({ inline:'nearest', block:'nearest' }) — no-op on in-view tabs
    - Cross-parent nav selector pattern (querySelectorAll + index) replacing the brittle :last-of-type CSS pseudo-class
    - jsdom no-op shim convention for missing DOM APIs in test-setup.ts (alongside ResizeObserver, matchMedia, Element.animate)

key-files:
  created: []
  modified:
    - src/lib/shell/NavShell.svelte
    - src/lib/shell/NavShell.test.ts
    - src/test-setup.ts

key-decisions:
  - "D-01..D-09 + AUTO-1..AUTO-10 implemented verbatim from CONTEXT.md and UI-SPEC.md (no deviations from locked decisions)"
  - "scrollIntoView shimmed in test-setup.ts (jsdom lacks the method) — keeps the new auto-scroll $effect testable under vitest"
  - "Pre-existing T-01..T-06 selectors switched from :last-of-type to navs[length-1] index pattern — :last-of-type was accidentally green pre-divergence (both navs rendered identical tab counts) and silently picked the wrong nav once desktop diverged"
  - "T-03 zero-favorites assertion scoped to bottom nav only (desktop is registry-driven post-Phase-45 and always renders 5)"

patterns-established:
  - "Tablist-scroll affordance: inner-div as scroll container + ResizeObserver-driven .is-overflowing class + mask-image fade on the inner div, never the outer <nav> (preserves aria-label semantic boundary)"
  - "Reduced-motion override inside $effect: read window.matchMedia('(prefers-reduced-motion: reduce)').matches inline within the effect body (NOT as $state outside) — media-query subscriptions don't re-run $effect cleanly"
  - "ResizeObserver cleanup via $effect return-function pattern (return () => ro.disconnect())"

requirements-completed: [NAV-ALL-01, NAV-ALL-02, NAV-ALL-03, NAV-ALL-04, NAV-ALL-05, NAV-ALL-TEST-02]

# Metrics
duration: 8min
completed: 2026-04-25
---

# Phase 45 Plan 01: Desktop Full-Nav Divergence Summary

**Desktop top toolbar now iterates the full CALCULATOR_REGISTRY independent of favorites, with horizontal scroll affordances (auto-scroll active tab, ResizeObserver-driven mask fade, prefers-reduced-motion override); mobile bottom bar preserves the Phase 41 favorites-driven contract verbatim under the rename to `mobileVisibleCalculators`.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-25T04:38:12Z
- **Completed:** 2026-04-25T04:46:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Renamed `visibleCalculators` → `mobileVisibleCalculators` and added `desktopVisibleCalculators: readonly CalculatorEntry[] = [...CALCULATOR_REGISTRY]` module-scope const so desktop renders all 5 calculators regardless of favorites state.
- Made the inner `<div role="tablist">` the scroll container with the `.tablist-scroll` class, `bind:this={tablistEl}`, and conditional `class:is-overflowing` binding — preserves the outer `<nav aria-label>` as the semantic boundary.
- Added two `$effect` blocks: (1) auto-scroll the active tab into view on route change with `scrollIntoView({ inline:'nearest', block:'nearest' })`, overriding `behavior` to `'auto'` under `prefers-reduced-motion`; (2) ResizeObserver toggling `isOverflowing` when `scrollWidth > clientWidth`, with explicit `ro.disconnect()` cleanup.
- Added scoped `<style>` block declaring `.tablist-scroll { overflow-x: auto; scrollbar-width: thin; scrollbar-color: var(--color-border) transparent; scroll-behavior: smooth; }` and `.tablist-scroll.is-overflowing { mask-image: linear-gradient(to right, black calc(100% - 24px), transparent); -webkit-mask-image: ...; }` (Safari ≤ 16 fallback).
- Appended T-07..T-12 to NavShell.test.ts: 6 new tests covering desktop = 5 at default/2/0 favorites, active-tab-always-lit at `/uac-uvc`, and source-string structural assertions for the `.tablist-scroll` + `.is-overflowing` rules.
- All 354 vitest tests pass (was 348 + 6 new); `pnpm check` reports 0 errors / 0 warnings across 4571 files.

## Task Commits

Each task was committed atomically:

1. **Task 1: NavShell.svelte — apply all 9 verbatim edits** — `430397f` (feat)
2. **Task 2: Extend NavShell.test.ts with T-07..T-12** — `f505410` (test)

**Plan metadata:** _pending_ (final docs commit follows this SUMMARY)

## Files Created/Modified

- `src/lib/shell/NavShell.svelte` — All 9 verbatim edits applied: rename + new desktop const + 2 iteration updates + scroll-container restructure + ref/state declarations + 2 `$effect` blocks + scoped `<style>` block.
- `src/lib/shell/NavShell.test.ts` — Appended T-07..T-12 describe block (6 new tests). Also fixed T-01..T-06 selectors (Rule 1 deviation — see below).
- `src/test-setup.ts` — Added `Element.prototype.scrollIntoView` no-op shim (Rule 3 deviation — see below).

## Decisions Made

All decisions from CONTEXT.md (D-01..D-09) and UI-SPEC.md (AUTO-1..AUTO-10) implemented verbatim. No scope additions. The two test-related fixes documented under Deviations are mechanical consequences of the divergence, not new design decisions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Add `Element.prototype.scrollIntoView` no-op shim**

- **Found during:** Task 1 (verification step `pnpm exec vitest run src/lib/shell/NavShell.test.ts`)
- **Issue:** jsdom does not implement `Element.prototype.scrollIntoView`. The new auto-scroll `$effect` calls it on every render whenever an `[aria-selected="true"]` tab is present, throwing `TypeError: active.scrollIntoView is not a function` and failing all 6 Phase 41 tests (T-01..T-06).
- **Fix:** Added a no-op shim in `src/test-setup.ts` immediately after the `ResizeObserver` shim, following the same convention used for ResizeObserver, matchMedia, and Element.animate.
- **Files modified:** `src/test-setup.ts` (5 lines added)
- **Verification:** Vitest now runs to completion; T-04 (which uses `/gir` pathname and would trigger scrollIntoView) passes.
- **Committed in:** `430397f` (Task 1 commit)

**2. [Rule 1 - Bug] Replace `:last-of-type` selector in T-01, T-02, T-05, T-06 with `navs[navs.length - 1]` index pattern**

- **Found during:** Task 1 (verification step — once scrollIntoView shim landed, Phase 41 selector tests still failed).
- **Issue:** The pre-existing tests used `container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')` to target the bottom (mobile) nav. The CSS `:last-of-type` pseudo-class is parent-scoped — desktop nav lives inside `<header>`, mobile nav at body level — so each nav is `:last-of-type` of its own parent. `querySelector` then returns the first match in document order, which is the desktop nav. Pre-Phase-45 this was masked because both navs rendered identical favorites-driven tab counts (4 at default), so the wrong-nav-selected error was invisible. Post-divergence, desktop renders 5 and mobile renders 4 (or 2, or 0), and the bug surfaces as `expected 4 to have a length of 4 but got 5`.
- **Fix:** Switched all `:last-of-type` selectors to `const navs = container.querySelectorAll(...)` followed by `navs[navs.length - 1]`. Mirrors the pattern used in the new T-07..T-12 (`navs[0]` for desktop, `navs[1]` for mobile).
- **Files modified:** `src/lib/shell/NavShell.test.ts` (T-01, T-02, T-05, T-06; same edit pattern with explanatory comment).
- **Verification:** All 12 pre-existing tests pass after the selector fix; the new T-07..T-12 use the same pattern and pass on first run.
- **Committed in:** `430397f` (Task 1 commit)

**3. [Rule 1 - Bug] Scope T-03 zero-favorites assertion to the bottom nav only**

- **Found during:** Task 1 (verification — after the selector fix, T-03 was the lone remaining failure).
- **Issue:** T-03 originally asserted `container.querySelectorAll('[role="tab"]').toHaveLength(0)` after toggling all favorites off. Pre-Phase-45 both navs were favorites-driven, so 0 favorites → 0 tabs document-wide. Post-Phase-45, desktop is registry-driven and always renders 5 tabs regardless of favorites, so the cross-bar assertion is no longer valid. The test description ("both bars render no tabs") is also no longer accurate.
- **Fix:** Renamed test to "T-03 zero favorites: bottom nav renders no tabs and throws no error", scoped the query to the bottom nav (`navs[navs.length - 1]`), asserted `bottomTabs.toHaveLength(0)`. Added an inline comment explaining the divergence rationale.
- **Files modified:** `src/lib/shell/NavShell.test.ts` (T-03 only).
- **Verification:** T-03 passes after the rescoping; the new T-09 (Task 2) explicitly covers the desktop side of the same scenario (`expect(desktopTabs).toHaveLength(5); expect(mobileTabs).toHaveLength(0)`).
- **Committed in:** `430397f` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bug — all in test infrastructure / pre-existing test selectors).
**Impact on plan:** All three deviations were necessary to satisfy the plan's own success criterion that `pnpm exec vitest run src/lib/shell/NavShell.test.ts` exits 0. None alter the production behavior contract; all three are mechanical consequences of introducing the desktop/mobile divergence (deviation #1 is a missing jsdom polyfill exposed by the new `$effect`; deviations #2 and #3 are pre-existing test selector bugs masked by the previous-shared-state condition). No scope creep.

## Issues Encountered

None beyond the three deviations documented above. All 9 RESEARCH.md verbatim edits applied cleanly on first pass; the verification surfaced the test-side issues immediately and they were each one-shot fixes following existing conventions.

## User Setup Required

None — no external service configuration required.

## Self-Check: PASSED

- `src/lib/shell/NavShell.svelte` exists and contains `desktopVisibleCalculators` (3 occurrences), `mobileVisibleCalculators` (2 occurrences), bare `\bvisibleCalculators\b` (0 occurrences — confirmed by negative grep), `scrollIntoView`, `ResizeObserver`, `mask-image` (3 occurrences), `prefers-reduced-motion`, `class:is-overflowing={isOverflowing}`, `ro.disconnect`, `overflow-x: auto`, `scrollbar-color: var(--color-border) transparent`. Negative grep for `aria-current="page"` returns no matches.
- `src/lib/shell/NavShell.test.ts` exists and contains the `desktop full-nav divergence (Phase 45)` describe block, T-07..T-12 (6 tests), `expect(tabs).toHaveLength(5)`, `expect(desktopTabs).toHaveLength(5)` (2 occurrences), `expect(mobileTabs).toHaveLength(2)`, `expect(mobileTabs).toHaveLength(0)`, `mockPage.url.pathname = '/uac-uvc'`, `expect(desktopSelected).toHaveLength(1)`, `class="tablist-scroll flex gap-2"` source-string assertion, `class:is-overflowing={isOverflowing}` source-string assertion, `mask-image` reference.
- `src/test-setup.ts` exists and contains the `Element.prototype.scrollIntoView` no-op shim.
- Commit `430397f` exists in `git log --oneline` (Task 1: feat).
- Commit `f505410` exists in `git log --oneline` (Task 2: test).
- `pnpm check` exits 0 (0 errors, 0 warnings, 4571 files).
- `pnpm exec vitest run src/lib/shell/NavShell.test.ts` exits 0 (18 tests pass: 6 structural + T-01..T-06 + T-07..T-12).
- `pnpm exec vitest run` exits 0 (354 tests pass across 36 files; +6 vs. pre-Phase-45 baseline of 348).

## Next Phase Readiness

Plan 45-01 ships the entire NavShell.svelte refactor and its vitest coverage. Plans 45-02 (Playwright e2e at 768px viewport — runtime overflow + auto-scroll behavior) and 45-03 (visual / a11y polish) can now proceed independently. The Phase 41 favorites contract (`favorites.current` → `mobileVisibleCalculators` → bottom-bar render) is preserved verbatim — no Phase 41 e2e regressions expected. NAV-ALL-04 (hamburger button visible on desktop) is covered by the existing `e2e/navigation.spec.ts:23-25` regression guard with no new test required.

---
*Phase: 45-desktop-full-nav-divergence*
*Completed: 2026-04-25*
