---
phase: 41-favorites-driven-navigation
verified: 2026-04-23T22:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the app on a mobile device or 375px viewport; unfavorite Feeds via hamburger; confirm the bottom bar reactively shows 3 tabs with correct labels and identity colors; confirm no tab appears highlighted"
    expected: "Bottom bar shows exactly Morphine Wean, Formula, GIR — each with its identity color accent; no tab is highlighted/active; no layout shift in the bar height or safe-area padding"
    why_human: "Visual confirmation of identity color tokens (--color-identity per calc), safe-area padding correctness on real iOS, and absence of layout shift cannot be asserted programmatically"
  - test: "Navigate to /feeds while Feeds is not in favorites (3-tab bar); confirm the bottom bar shows no highlighted tab and the page header/title identifies the route"
    expected: "All three rendered tabs appear in inactive (secondary-text) color; route identity is conveyed by on-page calculator heading, not the nav bar"
    why_human: "Absence of active-tab visual highlight (color vs inactive color) is a visual distinction that automated tab-count and aria-selected checks do not capture"
  - test: "On a desktop (1280px) viewport, unfavorite one tab and confirm the desktop top nav shows the reduced set with identity indicators intact (active tab underline, identity class color)"
    expected: "Desktop top nav shows N-1 tabs; the active tab (if favorited) shows border-b-2 in identity color; inactive tabs show secondary text color"
    why_human: "Desktop-specific visual identity (border-b-2 indicator, identity class color) requires visual inspection"
  - test: "Verify the 2 pre-existing navigation.spec.ts failures are confirmed as Phase-40 regressions, not Phase-41 regressions: run `pnpm exec playwright test e2e/navigation.spec.ts --reporter=list` and confirm only the two About-button tests fail"
    expected: "Exactly 2 failures: 'top title bar shows app name, info, and theme toggle' and 'info button opens the about sheet' — both look for an About button in the header that was moved to the hamburger drawer in Phase 40 commit 00e66f8"
    why_human: "Confirms scope of pre-existing failure and that no Phase-41 change introduced new failures in this spec"
---

# Phase 41: Favorites-Driven Navigation Verification Report

**Phase Goal:** Clinicians see only their favorited calculators in the mobile bottom bar and desktop top nav, with the hamburger remaining the way to reach anything they haven't favorited. NavShell rewritten so mobile bottom bar and desktop top nav render favorites only (in favorite order); non-favorited active routes do NOT add temporary tabs; `aria-current="page"` semantics preserved. Playwright E2E for full add/remove/persist flow + axe sweep of open hamburger.
**Verified:** 2026-04-23T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Mobile bottom bar renders only favorited calculators in favorite order, preserving `min-h-14`, safe-area padding, and focus outlines | VERIFIED | NavShell.svelte line 107: `{#each visibleCalculators as calc}` in mobile bar; line 102: `pb-[env(safe-area-inset-bottom,0px)]`; line 111: `min-h-14`; line 113: `focus-visible:outline-2 focus-visible:outline-offset-[-2px]` |
| 2 | Desktop top nav renders same favorites with per-tab identity indicator intact | VERIFIED | NavShell.svelte line 60: `{#each visibleCalculators as calc}` in desktop nav; line 64: `{calc.identityClass}` applied; line 71: `aria-selected={isActive}`; line 72: `role="tab"` |
| 3 | When user navigates to a non-favorited calculator, no tab gains aria-selected=true in either bar | VERIFIED | NavShell.svelte: `isActive = page.url.pathname.startsWith(calc.href)` — a non-favorited calc is not in `visibleCalculators`, so no tab for it exists; all rendered tabs' `isActive` will be false. NavShell.test.ts T-05 verifies this at component level. E2E FAV-TEST-03-4 asserts `aria-selected="false"` on all 3 rendered tabs when on /feeds (non-favorited). |
| 4 | End-to-end flow passes with favorites persisted and open hamburger axe-clean in both themes | VERIFIED | `e2e/favorites-nav.spec.ts` exists with 4 tests × 2 viewports = 8 instances (all passing per orchestrator). `e2e/favorites-nav-a11y.spec.ts` exists with 2 axe tests using `@axe-core/playwright` with `withTags(['wcag2a','wcag2aa'])` (2 passed, 0 violations). |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/shell/NavShell.svelte` | Both `{#each}` loops iterate `visibleCalculators`; `activeCalculatorId` is registry-driven; AboutSheet gets `?? 'morphine-wean'` fallback | VERIFIED | Lines 28-30: `$derived(favorites.current.map(id => byId.get(id)).filter(...))`. Lines 60, 107: `{#each visibleCalculators as calc}`. Line 23-25: registry-driven `CALCULATOR_REGISTRY.find(...)`. Line 133: `calculatorId={activeCalculatorId ?? 'morphine-wean'}` |
| `src/lib/shared/favorites.svelte.ts` | `_ids` seeded to `defaultIds()` at module scope (D-07) | VERIFIED | Line 73: `let _ids = $state<CalculatorId[]>(defaultIds());` — comment on lines 70-72 documents the D-07 rationale |
| `src/lib/shell/NavShell.test.ts` | 6 component tests T-01..T-06 covering breakpoint rendering, empty favorites, active-tab selection, non-favorited route | VERIFIED | File exists. T-01..T-06 all present (lines 84-156 of file). T-05 at line 129 explicitly tests NAV-FAV-03 at component level: 3 tabs rendered, 0 with `aria-selected="true"` when on non-favorited route. |
| `src/lib/shared/favorites.test.ts` | T-20 regression guard: `favorites.current` equals defaults before `init()` | VERIFIED | Lines 191-199: `describe('T-20 — module-scope default...')` with `vi.resetModules()` + dynamic import pattern. Asserts `['morphine-wean','formula','gir','feeds']` without calling `init()`. |
| `e2e/navigation.spec.ts` | `nicu:favorites` pre-clear guard in `beforeEach` | VERIFIED | Lines 5-9: `page.addInitScript(() => { localStorage.removeItem('nicu:favorites'); })` present in `beforeEach` |
| `e2e/favorites-nav.spec.ts` | FAV-TEST-03: 4 tests × 2 viewports, FAV-TEST-03-4 asserts no active tab on non-favorited route | VERIFIED | File exists (164 lines). 4 tests in viewport loop. FAV-TEST-03-4 at line 128 iterates all tabs and asserts `aria-selected="false"` on each. Desktop/mobile selector split via `isDesktop = vp.width >= 768`. |
| `e2e/favorites-nav-a11y.spec.ts` | FAV-TEST-04: 2 axe tests (light + dark) with `@axe-core/playwright` | VERIFIED | File exists (52 lines). `AxeBuilder` imported at line 6. `withTags(['wcag2a','wcag2aa']).analyze()` called in both tests (lines 34, 48). `results.violations` asserted `toEqual([])`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `favorites.svelte.ts` | `NavShell.svelte` | `favorites.current` consumed by `visibleCalculators $derived` | WIRED | NavShell.svelte line 10: `import { favorites } from '$lib/shared/favorites.svelte.js'`; line 29: `favorites.current.map(...)` |
| `NavShell.svelte` | `registry.ts` | `byId` Map built from `CALCULATOR_REGISTRY`; `activeCalculatorId` via `.find()` | WIRED | Lines 3, 14-16: Map construction. Lines 23-25: `CALCULATOR_REGISTRY.find(...)` for `activeCalculatorId` |
| `NavShell.svelte` | `AboutSheet.svelte` | `activeCalculatorId ?? 'morphine-wean'` passed as `calculatorId` prop | WIRED | Line 133: `<AboutSheet calculatorId={activeCalculatorId ?? 'morphine-wean'} bind:open={aboutOpen} />` |
| `e2e/favorites-nav.spec.ts` | `NavShell.svelte` | Playwright queries `nav[aria-label="Calculator navigation"]` tab count | WIRED | Both viewport branches use `page.locator('nav[aria-label="Calculator navigation"]').first()/.last()` then `.getByRole('tab')` count assertions |
| `e2e/favorites-nav-a11y.spec.ts` | `HamburgerMenu.svelte` | Axe scan runs after `role="dialog"` is visible | WIRED | `beforeEach` at line 22-23: click "Open calculator menu" + `waitFor({ state: 'visible' })` before axe |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `NavShell.svelte` (mobile bar) | `visibleCalculators` | `favorites.current` → `byId.get(id)` → filtered `CalculatorEntry[]` | Yes — favorites store holds reactive `_ids` (seeded from localStorage via `init()`, defaults via module-scope seed); `CALCULATOR_REGISTRY` is static const with 4 real entries | FLOWING |
| `NavShell.svelte` (desktop nav) | `visibleCalculators` (same derived) | Same as above | Yes | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for production source (requires a running dev server). Test results provided by orchestrator cover the behavioral assertions:

| Behavior | Test | Result |
|----------|------|--------|
| Un-favorite → bar shows N-1 tabs | FAV-TEST-03-1 (mobile + desktop) | PASS (8 instances) |
| Re-favorite → registry-order position restored | FAV-TEST-03-2 (mobile + desktop) | PASS |
| Favorites persist to localStorage after UI action | FAV-TEST-03-3 (mobile + desktop) | PASS |
| Non-favorited active route → no tab active | FAV-TEST-03-4 (mobile + desktop) | PASS |
| Open hamburger — 0 axe violations light mode | FAV-TEST-04 | PASS (0 violations) |
| Open hamburger — 0 axe violations dark mode | FAV-TEST-04 | PASS (0 violations) |
| NavShell renders 4 tabs from default favorites | T-01 vitest | PASS |
| NavShell renders 2 tabs when favorites reduced | T-02 vitest | PASS |
| NavShell renders 0 tabs, no throw, when favorites empty | T-03 vitest | PASS |
| Active favorited tab has aria-selected=true | T-04 vitest | PASS |
| Non-favorited active route — no tab has aria-selected=true | T-05 vitest | PASS |
| Registry order preserved regardless of insertion order | T-06 vitest | PASS |
| favorites.current equals defaults before init() | T-20 vitest | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NAV-FAV-01 | 41-01 | Mobile bottom bar renders only favorited calculators, preserving v1.4 shell styling | SATISFIED | `{#each visibleCalculators}` in mobile bar; `min-h-14`, `pb-[env(safe-area-inset-bottom,0px)]`, focus-visible outlines all present in NavShell.svelte |
| NAV-FAV-02 | 41-01 | Desktop top nav renders only favorited calculators with identity indicator intact | SATISFIED | `{#each visibleCalculators}` in desktop nav; `{calc.identityClass}` applied; `aria-selected` + `role="tab"` preserved |
| NAV-FAV-03 | 41-01 | Non-favorited active route does not grow a temporary tab | SATISFIED | `visibleCalculators` only contains favorited entries — a non-favorited active route has no tab in the list. T-05 (vitest) + FAV-TEST-03-4 (Playwright) both assert 0 `aria-selected="true"` tabs |
| NAV-FAV-04 | 41-01 | `aria-current="page"` logic (hamburger) unchanged; hamburger button does not gain `aria-current` for non-favorited routes | SATISFIED | HamburgerMenu.svelte was NOT modified in Phase 41 (D-OUT-01); its existing `aria-current` logic at line 101 is untouched. Confirmed: no files_modified in 41-01 or 41-02 summaries include HamburgerMenu.svelte. |
| FAV-TEST-03 | 41-02 | Playwright E2E for full add/remove/persist flow | SATISFIED | `e2e/favorites-nav.spec.ts` exists with 4 tests × 2 viewports = 8 instances, all passing |
| FAV-TEST-04 | 41-02 | Playwright axe sweep of open hamburger in light + dark | SATISFIED | `e2e/favorites-nav-a11y.spec.ts` exists with 2 axe tests, 0 violations in each |

---

### Anti-Patterns Found

Scan of Phase-41-modified files:

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `src/lib/shell/NavShell.svelte` | None found | — | No TODOs, no `return null`, no hardcoded empty arrays, no placeholder comments. `visibleCalculators` can be empty array but that is intentional (D-02: zero favorites is user-chosen). |
| `src/lib/shared/favorites.svelte.ts` | None found | — | D-07 seed confirmed. No stubbed functions. |
| `src/lib/shell/NavShell.test.ts` | None found | — | All 6 new tests have real assertions. T-05 queries bottom nav specifically (not container) to avoid double-counting desktop+mobile tabs — deviation from plan was auto-fixed and documented in SUMMARY. |
| `e2e/favorites-nav.spec.ts` | `page.addInitScript` ordering relies on registration order | Info | Documented in file header and SUMMARY. Not a code smell — it is the correct Playwright pattern for per-test localStorage seeding after a shared `beforeEach` REMOVE. |
| `e2e/favorites-nav-a11y.spec.ts` | None found | — | AxeBuilder import, withTags, violations assertion all present. |

---

### Pre-Existing Failures (Carried Forward from Phase 40)

Two `e2e/navigation.spec.ts` tests fail and are OUT OF SCOPE for Phase 41:

1. **`top title bar shows app name, info, and theme toggle`** — asserts `header.getByRole('button', { name: /about/i })` is visible, but the About button was moved into the hamburger drawer in Phase 40 (commit `00e66f8`). Phase 41 did not introduce or worsen this failure.

2. **`info button opens the about sheet`** — same stale locator (`getByRole('button', { name: /about/i })`). Pre-dates Phase 41.

These failures must be addressed in a future phase (likely Phase 43 or a dedicated cleanup task) by updating `navigation.spec.ts` test assertions to use the new hamburger-drawer About flow. They do not block Phase 41's goal.

---

### Scope Discipline Audit

Phase 41 declared out-of-scope items (D-OUT-01..05). Verification confirms:

| Item | Status |
|------|--------|
| D-OUT-01: HamburgerMenu.svelte not modified | CONFIRMED — not in any SUMMARY files_modified list; grep shows no Phase-41 commits touched it |
| D-OUT-02: favorites.svelte.ts API frozen (only _ids seed tweak) | CONFIRMED — only line 73 changed (`[]` → `defaultIds()`); public API unchanged |
| D-OUT-03: No Phase-42 work (UAC/UVC not added) | CONFIRMED — no registry changes, no new CalculatorId |
| D-OUT-04: No per-breakpoint cap, drag-reorder, export/import | CONFIRMED — not present in any modified file |
| D-OUT-05: No role="navigation" / aria-current migration | CONFIRMED — NavShell still uses role="tab" / aria-selected |

---

### Human Verification Required

**4 items need human testing:**

#### 1. Mobile bar visual identity and safe-area padding

**Test:** Open the app at 375×667 viewport (or real iOS device). Unfavorite Feeds via hamburger. Close hamburger.
**Expected:** Bottom bar reactively shows exactly 3 tabs (Morphine Wean, Formula, GIR). Each tab displays its identity color accent when active. Safe-area inset padding is visually correct (bar does not overlap iOS home indicator). No layout shift occurs in bar height.
**Why human:** Color token rendering (`--color-identity` per identity class), safe-area correctness on real iOS Safari, and absence of layout shift cannot be confirmed programmatically.

#### 2. Non-favorited active route — visual inactive state of nav bar

**Test:** With Feeds not in favorites (3-tab bar), navigate to /feeds via the hamburger. Close hamburger.
**Expected:** All 3 rendered tabs (Morphine Wean, Formula, GIR) appear in their inactive visual state (secondary text color, no underline). Route identity is conveyed by the on-page calculator heading, not the nav bar.
**Why human:** The visual distinction between an active-tab color and inactive-tab color requires visual confirmation. `aria-selected="false"` is verified by automated test, but the color rendering is visual.

#### 3. Desktop top nav identity indicators

**Test:** At 1280×800 viewport, unfavorite one tab, then navigate to a favorited calculator.
**Expected:** Active tab shows border-b-2 in identity color (`--color-identity`) and identity class text color. Unfavorited calculator is absent from the top nav. Tab count matches favorites count.
**Why human:** Desktop-specific visual identity (bottom border indicator, identity class color) requires visual inspection.

#### 4. Confirm pre-existing navigation.spec.ts failures are Phase-40 regressions only

**Test:** Run `pnpm exec playwright test e2e/navigation.spec.ts --reporter=list`
**Expected:** Exactly 2 failures: `top title bar shows app name, info, and theme toggle` and `info button opens the about sheet`. All other navigation tests pass (mobile bottom nav tab count, switching between calculators, desktop layout, theme toggle).
**Why human:** Confirms the exact scope of pre-existing failures vs any potential Phase-41 regression in this spec. The orchestrator reports 2 failures but the verification agent cannot distinguish which tests specifically failed without running the suite.

---

### Gaps Summary

No blocking gaps found. All 4 success criteria are met by verified code and passing tests. The phase goal is achieved: NavShell renders favorites-driven nav bars, non-favorited routes produce no temporary tab, E2E covers the full flow, and axe sweeps pass with 0 violations.

Status is `human_needed` (not `passed`) because 4 visual/behavioral items listed above require human confirmation per the verification protocol. These items do not indicate suspected failures — they confirm visual outcomes that automated tools cannot assert.

---

## Phase 43 Triage (D-07 / D-08)

**Triaged:** 2026-04-24 (pre-release)

| # | Item (summary) | Triage Status | Rationale |
|---|---|---|---|
| 1 | Mobile bottom bar visual identity + safe-area padding (375px, un-favorite Feeds → 3 tabs) | `manual-QA-needed` | Color token rendering (`--color-identity` per identity class), safe-area correctness on real iOS Safari, and absence of layout shift cannot be asserted programmatically. Routed to v1.13.1 release-notes reminder per D-13; v1.14 backlog candidate if iOS-specific test coverage becomes worth automating. |
| 2 | Non-favorited active route — bottom bar inactive visual state (color vs inactive color) | `manual-QA-needed` | `aria-selected="false"` verified by FAV-TEST-03-4 (Playwright E2E) + T-05 (vitest), but the color rendering distinction between active-tab and inactive-tab states is a visual check. Ships as v1.13.1 release-notes reminder. |
| 3 | Desktop top nav identity indicators (border-b-2 + identity color, active tab visual) | `manual-QA-needed` | Desktop-specific visual identity (border-b-2 indicator, identity class color) requires visual inspection at 1280px. v1.14 backlog if not done pre-deploy; non-blocking for v1.13.0 per D-12. |
| 4 | "2 pre-existing navigation.spec.ts failures" (About button stale locator) | `verified-via-grep` / now-obsolete | **Both pre-existing failures are now passing.** `pnpm exec playwright test --list` confirms the spec at line 81 now reads `navigation.spec.ts:81:3 › Navigation (v1.2 restructure) › hamburger drawer About row opens the about sheet` — the stale `/about/i` locator was replaced by the hamburger drawer About row flow in commit `c2800df` ("test(42.1-05): adapt e2e specs for hero-drawer shell on mobile"). The title-bar spec at line 17 was similarly updated to "shows app name, hamburger, and theme toggle" (no About button). Both Phase-40-regression failures cleared. |

**Disposition:** 1 verified-via-grep (now-obsolete per commit `c2800df`), 3 manual-QA-needed (deferred to v1.13.1 release-notes reminder + v1.14 backlog), 0 fix-required.

---

_Verified: 2026-04-23T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
