---
phase: 40-favorites-store-hamburger-menu
plan: 02
subsystem: ui
tags: [svelte5, dialog, aria-pressed, favorites, component-test, vitest, tailwind]

# Dependency graph
requires:
  - phase: 40-favorites-store-hamburger-menu (Plan 01)
    provides: favorites singleton (has/toggle/isFull/count/init) + FAVORITES_MAX constant
provides:
  - HamburgerMenu.svelte — native <dialog> with sibling link+star rows, cap caption, focus restoration
  - Public API `{ triggerEl: HTMLButtonElement | null, open?: boolean $bindable }` for NavShell mount in Plan 03
  - 14 passing vitest component tests covering open/close, lists, star toggle, cap caption, tab order, scrim click
  - Canonical `<dialog>` + reactive `$effect(showModal)` + `onclose`-driven focus restoration pattern for the shell layer
affects: [41-playwright-favorites, 42-uac-uvc]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native <dialog>.showModal() via `$effect` guarded by `!dialog.open` (prevents InvalidStateError)"
    - "Scrim click detection via `e.target === dialog` on the `<dialog>` onclick handler"
    - "Focus restoration in single `handleClose` wired to `onclose` (fires for BOTH programmatic close AND native Esc)"
    - "Sibling <a> + <button> row (not nested interactives) for WAI-ARIA compliance"
    - "aria-pressed toggle pattern (WAI-ARIA 1.2) for star/unstar buttons — first use in this project"
    - "Component test isolation via static import + localStorage.clear + favorites.init() in beforeEach (NOT vi.resetModules + dynamic import, which creates module-instance divergence)"

key-files:
  created:
    - src/lib/shell/HamburgerMenu.svelte
    - src/lib/shell/HamburgerMenu.test.ts
  modified: []

key-decisions:
  - "Replaced plan's dynamic-import + vi.resetModules() isolation with static import + favorites.init() in beforeEach — necessary because HamburgerMenu imports favorites statically; vi.resetModules() yields a fresh favorites singleton that diverges from HamburgerMenu's cached instance, breaking state visibility in tests."
  - "Used <h2 id=titleId> for the dialog heading (not <span>) — the plan's <action> specified <h2>, matching dialog aria-labelledby semantics."
  - "Kept T-09 as the RESEARCH-documented placeholder asserting `expect(true).toBe(true)` — upgrading this test requires a 5th calculator (Phase 42 UAC/UVC work)."

patterns-established:
  - "Shell-layer modal = native <dialog> + $effect + onclose (NOT bits-ui — D-02)"
  - "Component tests that consume module-singleton $state: import statically, reset state via localStorage.clear + init() in beforeEach"

requirements-completed: [FAV-01, FAV-02, FAV-05, NAV-HAM-02, NAV-HAM-03, NAV-HAM-04, NAV-HAM-05, FAV-TEST-02]

# Metrics
duration: 6min
completed: 2026-04-23
---

# Phase 40 Plan 02: HamburgerMenu Component Summary

**Native `<dialog>`-based hamburger menu with sibling link+star rows, cap-reached caption, scrim-click close, focus restoration — plus 14 passing component tests.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-23T19:59:17Z
- **Completed:** 2026-04-23T20:05:42Z
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 0

## Accomplishments

- Shipped `HamburgerMenu.svelte` (157 lines) implementing the full Plan 40-02 contract: native `<dialog>`, reactive `showModal()` gate, sibling link+star rows per `CALCULATOR_REGISTRY`, cap-reached caption from `favorites.isFull`, disabled-star-at-cap with extended aria-label, focus restoration via `onclose`, scrim-click close, mobile bottom-sheet at `max-width: 640px`, `aria-current="page"` on active link.
- Shipped `HamburgerMenu.test.ts` with all 14 tests green (T-01 open/closed DOM gate, T-02 lists all 4 calcs, T-03 close-button focus restoration, T-04 programmatic-close focus restoration, T-05 link-closes-menu, T-06 star-does-not-close, T-07/T-08/T-12 aria-pressed toggle, T-09 Phase-42 placeholder, T-10/T-11 cap caption presence/absence, T-13 tab order, T-14 scrim click closes).
- Full project gates green: `pnpm svelte-check` reports 0 errors / 0 warnings; `pnpm vitest run` passes all 260 tests (22 files); `pnpm build` succeeds and generates the PWA output.
- NavShell.svelte, +layout.svelte, registry.ts, and types.ts are byte-identical — Plan 02 shipped as purely additive (zero boundary changes), preserving Plan 03's small-diff surface.

## Task Commits

Each task was committed atomically on the worktree branch:

1. **Task 1: Create HamburgerMenu.svelte** — `11b4646` (feat)
2. **Task 2: Create HamburgerMenu.test.ts (14 tests)** — `fb4c0a8` (test)

No separate REFACTOR commit was needed — both artifacts landed clean with 0 svelte-check warnings.

## Files Created/Modified

- `src/lib/shell/HamburgerMenu.svelte` *(created, 157 lines)* — native-dialog hamburger component. Imports favorites + FAVORITES_MAX, CALCULATOR_REGISTRY, `page` (for `aria-current`), Star + X lucide icons. Props: `triggerEl: HTMLButtonElement | null` (required for focus restore), `open: boolean` ($bindable default false). Uses `$effect` to drive `dialog.showModal()` when `open` flips true, guarded by `!dialog.open` to avoid InvalidStateError. `handleClose` wired to `onclose` fires on both programmatic `close()` and native Esc, restoring focus to `triggerEl`. Scrim click detected via `e.target === dialog`. Row is `<li>` with sibling `<a>` + `<button>`; star button uses `aria-pressed={isFavorite}` (WAI-ARIA 1.2), gets `disabled` + extended aria-label when `!isFavorite && favorites.isFull`. `::backdrop { background: var(--color-scrim); }` with mobile bottom-sheet transform.
- `src/lib/shell/HamburgerMenu.test.ts` *(created, 208 lines)* — 14 vitest component tests, co-located per project convention. Static import of `favorites`, `localStorage.clear()` + `favorites.init()` in `beforeEach` gives deterministic default state. Tests that need a non-default state seed localStorage then re-init. Programmatic close for T-04 (jsdom polyfill does not wire Esc). Scrim test (T-14) uses `fireEvent.click(dialog)` to target the dialog element itself.

## Decisions Made

- **Test isolation strategy change (Rule 1 auto-fix):** The plan's `<action>` prescribed `vi.resetModules()` in `beforeEach` + dynamic `await import('$lib/shared/favorites.svelte.js')` inside each test. This produced 3 failing tests (T-06, T-07, T-10) because `HamburgerMenu.svelte` statically imports `favorites`, so `vi.resetModules()` caused the test's dynamic-imported `favorites` to be a *different* module instance than the one the component reads from — state mutations in the test were invisible to the component. Replaced with static import of `favorites` + `localStorage.clear()` + `favorites.init()` in `beforeEach`; tests that need non-default state seed localStorage and re-call `favorites.init()`. All 14 tests now pass and the isolation story is simpler. This change is documented inline in the test file's header comment.
- **T-09 kept as placeholder** per plan: no 5th calculator exists in Phase 40 to exercise the cap-disabled path. Assertion is `expect(true).toBe(true)` with a comment telling Phase 42 authors how to upgrade it.
- **Heading uses `<h2>` not `<span>`** for the dialog title, matching the plan's `<action>` block (though the earlier RESEARCH skeleton used `<span>`). `<h2 id="hamburger-title">` is the proper landmark for `aria-labelledby` on the dialog.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test isolation: replaced `vi.resetModules()` + dynamic import with static import + `favorites.init()` in `beforeEach`.**
- **Found during:** Task 2 (first vitest run after writing the test file per the RESEARCH skeleton)
- **Issue:** Following the skeleton verbatim produced 3 failing tests (T-06, T-07, T-10). `vi.resetModules()` causes `await import('$lib/shared/favorites.svelte.js')` in a test to return a freshly-constructed module instance. But `HamburgerMenu.svelte` statically imports `favorites` at compile time, so the component continues reading from the ORIGINAL module instance. Calling `favorites.init()` on the fresh instance mutates state invisible to the component.
- **Fix:** Removed `vi.resetModules()` from `beforeEach`. Added static `import { favorites } from '$lib/shared/favorites.svelte.js'` at the top of the test file. `beforeEach` now calls `localStorage.clear()` then `favorites.init()` (using the same module instance HamburgerMenu uses), which resets defaults deterministically. Tests that need a different state seed localStorage and re-call `favorites.init()` on the same singleton. Removed inline dynamic-import boilerplate from T-02, T-05, T-06, T-07, T-08, T-10, T-11, T-12.
- **Files modified:** `src/lib/shell/HamburgerMenu.test.ts`
- **Verification:** `pnpm vitest run src/lib/shell/HamburgerMenu.test.ts` → 14/14 passed. `pnpm vitest run src/lib/shared/favorites.test.ts src/lib/shell/HamburgerMenu.test.ts` → 33/33 passed. `pnpm vitest run` (full suite) → 260/260 passed.
- **Committed in:** `fb4c0a8` (Task 2 commit). Inline file-header comment explains the decision for future maintainers.

### Observations (no code change)

**A. Plan acceptance-criterion grep `"4 of 4 favorites" src/lib/shell/HamburgerMenu.svelte`** expected a literal string in the component source, but the component uses `{FAVORITES_MAX} of {FAVORITES_MAX} favorites` templating. The rendered output (and therefore the T-10 test `getByText(/4 of 4 favorites/)`) correctly produces "4 of 4 favorites". The grep check is a plan-writing artifact, not a functional gap — behavior is correct and covered by T-10.

**B. Plan acceptance-criterion grep `"let { triggerEl, open = $bindable(false) }"` expected a single-line prop destructuring**, but the plan's own `<action>` skeleton writes it over multiple lines (matching SelectPicker's canonical style). The multi-line form was retained; behavior is identical and `$bindable(false)` is correctly applied.

---

**Total deviations:** 1 auto-fixed (Rule 1 bug: test isolation strategy)
**Impact on plan:** Zero scope creep. The change made tests more reliable (no module-instance divergence bug to debug later) and the isolation story simpler. All plan behavior and API contracts preserved; NavShell/layout/registry/types unmodified per D-OUT-01 / D-OUT-02.

## Issues Encountered

- First vitest run reported 3 failures (T-06, T-07, T-10) because the plan's `<action>` skeleton used `vi.resetModules()`-based isolation that is incompatible with a component consuming a statically-imported singleton. Diagnosed via rendered-DOM dump (T-06 showed `Add Morphine Wean` / `aria-pressed=false` when the test expected `Remove Morphine Wean` / `aria-pressed=true`, confirming the seeded state never reached the component). Root cause and fix logged above.

## User Setup Required

None — purely a component + test addition. No env vars, no external services, no manual configuration.

## Next Phase Readiness

**Plan 03 (NavShell + layout integration) is unblocked.** NavShell just needs:
- Two new imports: `Menu` icon from `@lucide/svelte` and `HamburgerMenu` from `./HamburgerMenu.svelte`
- Two new `$state` bindings: `menuOpen` and `menuTriggerBtn`
- One new trigger `<button bind:this={menuTriggerBtn} aria-haspopup="dialog" aria-expanded={menuOpen} onclick={() => menuOpen = true}>` with the Menu icon
- One new mount: `<HamburgerMenu triggerEl={menuTriggerBtn} bind:open={menuOpen} />`
- `+layout.svelte` onMount: one line `favorites.init()`

That ships the user-facing menu. Plan 03 surface is ~5 lines in NavShell + 1 line in +layout — by design, small and reviewable.

## Self-Check: PASSED

Verified before commit of this SUMMARY:

- `src/lib/shell/HamburgerMenu.svelte` — FOUND (157 lines)
- `src/lib/shell/HamburgerMenu.test.ts` — FOUND (208 lines)
- Commit `11b4646` (feat Task 1) — FOUND in git log
- Commit `fb4c0a8` (test Task 2) — FOUND in git log
- `pnpm svelte-check` → 0 errors / 0 warnings
- `pnpm vitest run src/lib/shell/HamburgerMenu.test.ts` → 14/14 passed
- `pnpm vitest run src/lib/shared/favorites.test.ts src/lib/shell/HamburgerMenu.test.ts` → 33/33 passed
- `pnpm vitest run` (full suite) → 260/260 passed
- `pnpm build` → succeeds, PWA output generated
- `git diff --stat src/lib/shell/NavShell.svelte src/routes/+layout.svelte src/lib/shell/registry.ts src/lib/shared/types.ts` → empty (boundary files unmodified)
- `grep -c "aria-current=" src/lib/shell/HamburgerMenu.svelte` → 1
- `grep "import { page } from '$app/state'" src/lib/shell/HamburgerMenu.svelte` → present
- `grep -c "it('T-" src/lib/shell/HamburgerMenu.test.ts` → 14
- No stubs introduced; no new threat surface added (component does not open network, auth, or storage surfaces beyond what Plan 01 ships).

---
*Phase: 40-favorites-store-hamburger-menu*
*Plan: 02*
*Completed: 2026-04-23*
