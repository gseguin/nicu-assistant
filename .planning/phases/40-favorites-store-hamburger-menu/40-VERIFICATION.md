---
phase: 40-favorites-store-hamburger-menu
verified: 2026-04-23T14:20:00Z
status: human_needed
score: 5/5 observable truths verified (all 5 ROADMAP success criteria satisfied by code/tests; SC-5 full keyboard flow needs a human browser run)
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open hamburger, Tab through close + all 8 link/star controls, Shift+Tab back, press Esc — confirm focus returns to hamburger button"
    expected: "Tab order = [close, link1, star1, link2, star2, link3, star3, link4, star4]. Esc closes dialog and focus lands on the hamburger button. aria-current='page' appears on the link whose href matches the current route."
    why_human: "Native <dialog> Esc handling + focus trap behavior is not exercised by jsdom; SelectPicker has an analogous human-only check. T-04 simulates programmatic close, not a real keydown."
  - test: "Install fresh (clear storage), load the app, open devtools → Application → Local Storage, look for key 'nicu:favorites'"
    expected: "Stored value is exactly {\"v\":1,\"ids\":[\"morphine-wean\",\"formula\",\"gir\",\"feeds\"]}. Reload the page — favorites.current in the hamburger still shows all 4 starred."
    why_human: "Unit tests cover init() behavior, but the actual +layout.svelte onMount firing in a real browser is a deployment-level concern not covered by vitest."
  - test: "Tap the hamburger, un-star Morphine, close menu. Observe the mobile bottom nav (md viewport off)."
    expected: "Bottom nav STILL shows all 4 calculators (D-OUT-01). This is correct for Phase 40 — Phase 41 flips it."
    why_human: "Visually confirms the boundary: favorites store mutates, HamburgerMenu UI reacts, but NavShell rendering stays v1.12. Grep proves NavShell does not import favorites, but a live tap verifies user-facing intent."
  - test: "Enable 'Reduce motion' in OS preferences, open and close the hamburger"
    expected: "No motion sickness — open/close is instantaneous; no residual transitions. (HamburgerMenu.svelte has no open/close animations defined, so this is vacuously satisfied, but worth a live confirm.)"
    why_human: "Motion perception is subjective and not testable in jsdom."
gaps: []
---

# Phase 40: Favorites Store + Hamburger Menu — Verification Report

**Phase Goal (ROADMAP.md):** Clinicians can open a hamburger menu, see every registered calculator, and star/unstar calculators to choose which appear in their nav — with a cap of 4 favorites enforced and their choices surviving across sessions. NavShell rendering is INTENTIONALLY unchanged in this phase (Phase 41 flips it).

**Verified:** 2026-04-23T14:20:00Z
**Status:** `human_needed` — all automated evidence passes; 4 user-facing flows (keyboard, storage roundtrip in a real browser, D-OUT-01 live confirmation, reduced-motion) need a human browser run.
**Re-verification:** No — initial verification.

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth (from ROADMAP Phase 40 success criteria) | Status | Evidence |
|---|---|---|---|
| SC-1 | Tap hamburger → dialog lists every registered calculator with icon + name | VERIFIED | `NavShell.svelte:65-75` trigger button (Menu icon, 48x48, aria-haspopup=dialog, aria-expanded); `HamburgerMenu.svelte:94-106` iterates `CALCULATOR_REGISTRY` with `<calc.icon>` + `<span>{calc.label}</span>`; T-02 asserts all 4 rows rendered. |
| SC-2 | Tap star → add/remove + hamburger UI updates reactively (Phase 40 scope: self only, NavShell flip in Phase 41) | VERIFIED | `HamburgerMenu.svelte:107-130` star button calls `favorites.toggle(id)`; T-12 proves aria-pressed updates within one tick; `favorites.has()` read inside `{#each}` as a rune accessor drives reactivity. D-OUT-01 NavShell boundary preserved (verified below). |
| SC-3 | At cap of 4, non-favorite stars disabled with accessible reason (Phase 40 caveat: cap always reached at start, full disabled-state lands in Phase 42) | VERIFIED (with scoped caveat) | `HamburgerMenu.svelte:96,118-119` `capBlocked = !isFavorite && favorites.isFull` drives `disabled` + `aria-disabled='true'`; extended aria-label `Add X to favorites (limit reached — remove one to add another)`; menu caption `"4 of 4 favorites — remove one to add another."` at `:76-80`. T-10 covers caption presence, T-11 absence. T-09 is a documented placeholder — the 5th-calculator path is exercised in Phase 42. |
| SC-4 | Reload / reopen preserves favorites; fresh install defaults to `['morphine-wean', 'formula', 'gir', 'feeds']` | VERIFIED | `favorites.svelte.ts:110-122` init() reads `localStorage['nicu:favorites']`, runs D-08 6-step recovery, seeds defaults + persists when raw=null (D-09); `+layout.svelte:42` calls `favorites.init()` on mount. T-01 asserts first-run seed + persistence; T-02 round-trip; T-03..T-09 every recovery branch; T-18/T-19 cover private-browsing storage throws. |
| SC-5 | Full keyboard open/navigate/star/close with focus return to hamburger button | VERIFIED (code) / HUMAN-CONFIRM | Close button is first tabbable child (T-13); `handleClose` wired to `onclose` restores focus to `triggerEl` (T-03 click, T-04 programmatic). Native `<dialog>` provides the Esc handler and tab trap — jsdom can't exercise Esc keydown, so a live browser confirmation is routed to the human-verification section. |

**Score:** 5/5 observable truths verified (SC-5 has a live-browser confirmation item routed to `human_verification`).

### Deferred Items

None. Every Phase 40 success criterion has code-level evidence; SC-3's full disabled-state assertion is pre-accepted in the ROADMAP note that Phase 42 adds the 5th calculator.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/lib/shared/favorites.svelte.ts` | Reactive singleton with `$state`, D-08 recovery, FAVORITES_MAX export | VERIFIED | 123 lines. Exports `favorites`, `FAVORITES_MAX`. Module-scope `let _ids = $state<CalculatorId[]>([])`. All helpers present: `defaultIds`, `validIds`, `recover` (6-step pipeline), `persist`. |
| `src/lib/shared/favorites.test.ts` | 19 co-located vitest cases (T-01..T-19) | VERIFIED | 189 lines, `grep -c "it('T-"` = 19. Covers recovery, mutation, cap, storage throws. |
| `src/lib/shell/HamburgerMenu.svelte` | Native `<dialog>` component, sibling link+star rows, cap caption, focus restore | VERIFIED | 157 lines. `<dialog bind:this={dialog}>` + `$effect` showModal gate + `onclose` focus restore. Sibling `<a>` + `<button>` (not nested). `::backdrop { background: var(--color-scrim); }`. |
| `src/lib/shell/HamburgerMenu.test.ts` | 14 co-located vitest cases (T-01..T-14) | VERIFIED | 208 lines, `grep -c "it('T-"` = 14. T-09 is a documented Phase-42 placeholder; 13 tests perform real assertions. |
| `src/lib/shell/NavShell.svelte` (modified) | +hamburger button + HamburgerMenu mount; bottom + top nav byte-identical | VERIFIED | Menu icon import at line 5; HamburgerMenu import at line 7; hamburger button with `bind:this`, `aria-haspopup="dialog"`, `aria-expanded`, 48x48 at lines 65-75; HamburgerMenu mount at line 128. Desktop + mobile nav loops still iterate `CALCULATOR_REGISTRY` (grep=2), zero `favorites` reference (grep=0) — D-OUT-01 preserved. |
| `src/routes/+layout.svelte` (modified) | +favorites import + `favorites.init()` as 3rd onMount init line | VERIFIED | Import at line 9; `favorites.init()` at line 42, after theme + disclaimer. |

### Stubs / Orphans

None. Every artifact is wired (imports + usage traced below).

---

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `favorites.svelte.ts` | `registry.ts` | `import { CALCULATOR_REGISTRY }` | WIRED | Line 5; used in `defaultIds`, `validIds`, `recover` (registry-order sort), `toggle` (registry-order insertion). |
| `favorites.svelte.ts` | `types.ts` | `import type { CalculatorId }` | WIRED | Line 6; typed `_ids`, public API params, return shapes. |
| `HamburgerMenu.svelte` | `favorites.svelte.ts` | `import { favorites, FAVORITES_MAX }` | WIRED | Line 8; `favorites.has`, `favorites.isFull`, `favorites.toggle`, `FAVORITES_MAX` in caption. |
| `HamburgerMenu.svelte` | `registry.ts` | `import { CALCULATOR_REGISTRY }` | WIRED | Line 7; `{#each CALCULATOR_REGISTRY}` at line 94. |
| `HamburgerMenu.svelte` | `@lucide/svelte` | `import { Star, X }` | WIRED | Line 6; Star at line 122, X (close button) at line 89. |
| `NavShell.svelte` | `HamburgerMenu.svelte` | `import HamburgerMenu` + mount | WIRED | Line 7 import; line 128 `<HamburgerMenu triggerEl={menuTriggerBtn} bind:open={menuOpen} />` mount. |
| `NavShell.svelte` | `@lucide/svelte` | `import { ..., Menu }` extension | WIRED | Line 5 — `{ Sun, Moon, Info, Menu }`; Menu icon used at line 74. |
| `+layout.svelte` | `favorites.svelte.ts` | `import { favorites }` + `favorites.init()` | WIRED | Line 9 import; line 42 init call inside onMount. |

All 8 key links wired.

---

## Data-Flow Trace (Level 4)

Applied to the rendering artifact (`HamburgerMenu.svelte`):

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `HamburgerMenu.svelte` | `CALCULATOR_REGISTRY` | Static readonly array in `registry.ts` | Yes — 4 entries (morphine-wean, formula, gir, feeds) with real icons/hrefs/labels | FLOWING |
| `HamburgerMenu.svelte` | `favorites.has(id)`, `favorites.isFull` | `_ids = $state<CalculatorId[]>` populated by `init()` reading `localStorage['nicu:favorites']` (or seeded defaults on first run) | Yes — traces through `init()` → `recover()` → returns 4 defaults or stored array | FLOWING |
| `HamburgerMenu.svelte` | `page.url.pathname` (aria-current) | SvelteKit `$app/state` | Yes — live route | FLOWING |
| `NavShell.svelte` | `menuTriggerBtn` prop passed to HamburgerMenu | `bind:this={menuTriggerBtn}` on the Menu button | Yes — resolved to real HTMLButtonElement after mount | FLOWING |
| `NavShell.svelte` | `menuOpen` bound to HamburgerMenu.open | `$state(false)` + `onclick={() => (menuOpen = true)}` | Yes — toggles true on click, $effect fires showModal | FLOWING |

No hollow props, no hardcoded empty arrays, no disconnected fetches.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| svelte-check reports 0/0 | `pnpm check` | `COMPLETED 4533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | PASS |
| Full vitest suite green | `pnpm test:run` | `Test Files 22 passed (22)` / `Tests 260 passed (260)` — matches baseline 227 + 33 new = 260 | PASS |
| Production build succeeds | `pnpm build` | `✓ built in 8.55s`; `adapter-static` wrote `build/`; `PWA v1.2.0 precache 40 entries (497.55 KiB)` | PASS |
| HamburgerMenu chunk baked into layout bundle | `find build -name "*.js" -exec grep -l "hamburger-dialog" {} \;` | `build/_app/immutable/nodes/0.CpAm_o3B.js` (layout bundle node 0) | PASS |
| Test count matches plan | `grep -c "it('T-" src/lib/shared/favorites.test.ts + HamburgerMenu.test.ts` | 19 + 14 = 33 | PASS |
| D-OUT-01 grep: 2 registry loops in NavShell, 0 favorites refs | `grep -c "{#each CALCULATOR_REGISTRY" NavShell.svelte; grep -c "favorites" NavShell.svelte` | `2` / `0` | PASS |
| Registry untouched (D-OUT-02) | Registry file is 4 entries, no UAC/UVC | morphine-wean, formula, gir, feeds — exactly 4 | PASS |
| FAVORITES_MAX single code constant (D-OUT-03) | `grep -nE "if.*md:|breakpoint|innerWidth" favorites.svelte.ts` | No matches — single `FAVORITES_MAX = 4` at line 8 | PASS |

---

## Requirements Coverage (14/14)

| Req | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| FAV-01 | 40-02 | Star toggle per row adds/removes favorites | SATISFIED | `HamburgerMenu.svelte:107-130` star button calls `favorites.toggle(id)`; T-12 reactive toggle; T-06 toggle does not close menu. |
| FAV-02 | 40-02 | Cap at 4; non-favorite stars disabled with aria-disabled + accessible reason | SATISFIED | `HamburgerMenu.svelte:96,118-119` disabled + aria-disabled; extended aria-label; menu caption at :76-80. T-10/T-11 caption presence/absence; T-09 placeholder pending Phase 42 5th calc. |
| FAV-03 | 40-01 | Persist to localStorage (not session) | SATISFIED | `favorites.svelte.ts:9,64,113` uses `localStorage.setItem/getItem` with key `'nicu:favorites'`. T-01, T-02, T-18 validate. |
| FAV-04 | 40-01, 40-03 | First-run defaults exactly `['morphine-wean', 'formula', 'gir', 'feeds']` | SATISFIED | `favorites.svelte.ts:17-20` `defaultIds()` = registry.slice(0,4); D-09 seed-on-null at :121. `+layout.svelte:42` init() call. T-01. |
| FAV-05 | 40-02, 40-03 | Removing a favorite updates nav immediately (reactive) | SATISFIED (scoped) | Phase 40 scope: HamburgerMenu's own UI reacts via `favorites.has()`/`.isFull` rune reads inside `{#each}` (T-12). NavShell flip is Phase 41 (D-OUT-01 boundary). |
| FAV-06 | 40-01 | Stable favorite order (registry-order) | SATISFIED | `favorites.svelte.ts:59,101-103` sort by `registryOrder.filter((rid) => next.includes(rid))` both in recovery and on toggle insert. T-10 (recovery re-sort), T-14 (remove+re-add places at registry position). |
| FAV-07 | 40-01 | Schema-safe recovery from malformed / stale localStorage | SATISFIED | `favorites.svelte.ts:36-60` full 6-step D-08 pipeline. T-03..T-09 exercise every branch (invalid JSON, missing v, wrong v, non-array ids, unknown ids, over-cap, empty filtered). |
| NAV-HAM-01 | 40-03 | Hamburger button in title bar with aria-label + 48px target | SATISFIED | `NavShell.svelte:65-75` — `aria-label="Open calculator menu"`, `aria-haspopup="dialog"`, `aria-expanded`, `icon-btn min-h-[48px] min-w-[48px]`, Menu icon. Leftmost per D-01. |
| NAV-HAM-02 | 40-02 | Menu opens with every registered calculator (no hardcoded list) | SATISFIED | `HamburgerMenu.svelte:94` `{#each CALCULATOR_REGISTRY as calc (calc.id)}` direct registry iteration. T-02 asserts all 4 present. |
| NAV-HAM-03 | 40-02 | Each row shows icon + name + star; row-link navigates and closes, star toggles without closing | SATISFIED | `:98-106` sibling `<a>` with icon + label + `handleLinkClick=close`; `:107-130` sibling `<button>` star with `handleStarClick` that stopsPropagation and does NOT close. T-05 (link closes), T-06 (star does not close). |
| NAV-HAM-04 | 40-02, 40-03 | Keyboard-navigable with focus return to hamburger on close | SATISFIED (code) / HUMAN-CONFIRM | Native `<dialog>` tab trap + Esc; close-button first tabbable (T-13); `handleClose` wired to `onclose` restores focus (T-03, T-04). Live Esc key + full Tab sweep routed to human-verification. |
| NAV-HAM-05 | 40-02 | Honors `prefers-reduced-motion` + uses established scrim token | SATISFIED | HamburgerMenu has ZERO open/close animations/transitions — motion is vacuously gated. `app.css:138` global reduced-motion rule `html * { transition: none !important }` covers any inherited transitions. Backdrop uses `var(--color-scrim)` at HamburgerMenu.svelte:147. |
| FAV-TEST-01 | 40-01 | Unit tests for favorites store (add/remove/cap/roundtrip/recovery) | SATISFIED | `favorites.test.ts` — 19 tests, every D-08 branch + private-browsing throws. |
| FAV-TEST-02 | 40-02 | Component test for hamburger menu (opens, lists, star toggle, disabled-at-cap) | SATISFIED | `HamburgerMenu.test.ts` — 14 tests (13 functional + T-09 placeholder documented for Phase 42). All open/close, link/star behavior, cap caption, reactive toggle, tab order, scrim click covered. |

**14/14 SATISFIED** (NAV-HAM-04 has a live-keyboard confirmation routed to human-verification as belt-and-suspenders; all automated evidence is in place).

---

## Locked Decisions Honored (D-01..D-14)

| Decision | Claim | Evidence | Status |
|---|---|---|---|
| D-01 | Hamburger leftmost in action cluster; order `Menu, Info, Theme` | `NavShell.svelte:65-95` — Menu button is first child of action `<div>`, then Info, then Theme | HONORED |
| D-02 | Native `<dialog>` + `showModal()` (NOT bits-ui) | `HamburgerMenu.svelte:60` `<dialog bind:this={dialog}>` + `:27-30` `$effect` calling `dialog.showModal()` gated by `!dialog.open` | HONORED |
| D-03 | Sibling link + star button (NOT nested) | `:98-106` `<a>` sibling of `:107-130` `<button>` inside `<li>` wrapper; `<li>` itself is NOT interactive | HONORED |
| D-04 | aria-pressed + fill-swap on star | `:112` `aria-pressed={isFavorite}`; `:124` `fill={isFavorite ? 'currentColor' : 'none'}`; color via identityClass | HONORED |
| D-05 | Disabled stars at cap with extended aria-label + menu caption | `:96` `capBlocked`, `:113-117` extended aria-label, `:118` `disabled`, `:119` `aria-disabled`; `:76-80` cap caption guarded by `favorites.isFull` | HONORED |
| D-06 | `{ v: 1, ids: CalculatorId[] }` at key `nicu:favorites` | `favorites.svelte.ts:9-15,64` — STORAGE_KEY, SCHEMA_VERSION=1, StoredShape, persist() | HONORED |
| D-07 | Registry-order sort | `:59` (recovery) + `:101-103` (toggle insert) both use `registryOrder.filter((rid) => next.includes(rid))` | HONORED |
| D-08 | 6-step recovery pipeline | `:26-60` — (1) null→defaults, (2) JSON.parse try/catch, (3) shape validate (typeof/v/Array.isArray), (4) filter by registry, (5) slice MAX, (6) empty→defaults, registry-order re-sort | HONORED |
| D-09 | First-run seeds defaults + writes immediately | `:121` `if (raw === null) persist(recovered);` | HONORED |
| D-10 | API: current/count/isFull/has/toggle/canAdd/init + FAVORITES_MAX export | `:8,73-123` — all 7 accessors/methods + constant present | HONORED |
| D-11 | FAVORITES_MAX=4 as code constant (not config.json) | `:8` `export const FAVORITES_MAX = 4;` — not in `.planning/config.json` (verified: `grep FAVORITES_MAX .planning/config.json` → no match) | HONORED |
| D-12 | Hamburger iterates CALCULATOR_REGISTRY | `HamburgerMenu.svelte:94` `{#each CALCULATOR_REGISTRY}` — no separate menu-items config | HONORED |
| D-13 | Native tab order (no roving tabindex) | No `tabindex` attributes in HamburgerMenu; close button first-tabbable verified by T-13 | HONORED |
| D-14 | Reduced-motion honored + `--color-scrim` + "Calculators" header | Zero local animations; global reduced-motion guard covers; `:147` `::backdrop { background: var(--color-scrim); }`; `:74` `<h2>Calculators</h2>` | HONORED |

14/14 decisions honored.

---

## Out-of-Scope Boundaries (D-OUT-01..03)

| Boundary | Claim | Evidence | Status |
|---|---|---|---|
| D-OUT-01 | NavShell bottom + desktop nav loops over `CALCULATOR_REGISTRY` unchanged; NavShell never imports `favorites` | `grep -c "{#each CALCULATOR_REGISTRY" NavShell.svelte` → 2; `grep -c "favorites" NavShell.svelte` → 0. `git diff 307d218 HEAD -- NavShell.svelte` shows only additive hamburger edits in header action cluster + HamburgerMenu mount; the two `{#each}` loops at lines 39 and 107 are byte-identical to the v1.12 logic. | PRESERVED |
| D-OUT-02 | No new registry entries in `registry.ts` | Registry has exactly 4 entries: morphine-wean, formula, gir, feeds. No UAC/UVC. | PRESERVED |
| D-OUT-03 | No per-breakpoint cap conditionals; `FAVORITES_MAX` single constant | `grep -nE "if.*md:|breakpoint|innerWidth" src/lib/shared/favorites.svelte.ts` → no matches. | PRESERVED |

3/3 boundaries preserved.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `HamburgerMenu.test.ts` | 142 | `expect(true).toBe(true);` (T-09 placeholder) | Info | Documented in the test file's T-09 comment and the Plan 02 summary. The assertion is a no-op that exists to reserve the test slot until Phase 42 adds UAC/UVC (the 5th calculator needed to exercise the cap-disabled path with a real non-favorite row). Not a stub of production code; does not affect runtime. |
| `HamburgerMenu.svelte` | 109-111 | `class="... {capBlocked ? 'cursor-not-allowed opacity-60' : ''}"` | Info | Ternary expands to empty string when not blocked — intentional per D-05 visual pattern. |

No Blockers. No Warnings.

No TODO/FIXME/XXX/HACK/placeholder markers found in production code. No `return null`, empty implementations, or console.log-only handlers in the new files. The only hardcoded `[]` in `favorites.svelte.ts:70` is the initial `$state<CalculatorId[]>([])` value that is immediately populated by `init()` — recovery pipeline writes real data before any consumer reads.

---

## Commit Trail

11 commits cover Phase 40 (in order, after the planning commits):

```
fc49677 test(40-01): add failing favorites store unit tests (RED)
59927d6 feat(40-01): implement favorites reactive singleton (GREEN)
06f0551 docs(40-01): complete favorites-store plan summary
3fa699b chore: merge executor worktree (40-01 favorites store)
11b4646 feat(40-02): add HamburgerMenu.svelte native <dialog> component
fb4c0a8 test(40-02): add HamburgerMenu.test.ts (14 tests — FAV-TEST-02)
24bf5dd docs(40-02): complete HamburgerMenu plan summary
38250e9 feat(40-03): wire hamburger button + HamburgerMenu into NavShell
40f107b feat(40-03): init favorites singleton in layout onMount
73eb313 docs(40-03): complete integration wiring plan summary
733f45e chore: merge executor worktree (40-03 shell integration)
```

- **Atomic:** Each plan's implementation + test + summary land in separate commits; Plan 01 follows strict TDD RED→GREEN.
- **Informative messages:** Conventional prefixes (`test`, `feat`, `docs`, `chore`), plan/task identifiers in parentheses, clear scope (RED vs GREEN, which artifact shipped).
- **No mega commit**, no WIP messages.
- Worktree merges are chore-prefixed and scoped, which is appropriate for the parallel-plan workflow.

---

## Gate Evidence (fresh re-run at verification time)

```
$ pnpm check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
1776975513497 COMPLETED 4533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ pnpm test:run
Test Files  22 passed (22)
     Tests  260 passed (260)
  Start at  14:18:34
  Duration  19.29s

$ pnpm build
✓ built in 8.55s
PWA v1.2.0
mode      generateSW
precache  40 entries (497.55 KiB)

$ find build -name "*.js" -exec grep -l "hamburger-dialog" {} \;
build/_app/immutable/nodes/0.CpAm_o3B.js
```

HamburgerMenu is compiled into the layout bundle (node 0) and included in the PWA precache manifest.

---

## Gaps Summary

**No gaps.**

Phase 40's goal is fully achieved in code:
- The favorites store is a tested, defensive, schema-safe Svelte 5 rune singleton with localStorage persistence.
- The hamburger menu lists every registered calculator, renders sibling link+star rows, honors the 4-cap with disabled/caption affordances, and restores focus on close.
- NavShell mounts the menu and provides the trigger button as a pure additive change — D-OUT-01 (bottom + top nav render v1.12-identical) is grep-verified.
- Layout wiring seeds favorites on first-mount via `favorites.init()`.
- 33 new tests (19 + 14) land, full suite is 260/260, svelte-check is 0/0, build produces a PWA precache manifest containing the HamburgerMenu chunk.

**Why `human_needed` rather than `passed`:** Four user-facing confirmations need a real browser:

1. **Full keyboard flow** — T-03/T-04 cover focus restoration on close, T-13 covers tab order, but jsdom can't fire a real Escape keydown through the native `<dialog>` Esc handler; SC-5 (from ROADMAP) explicitly requires the full keyboard round-trip.
2. **Live first-run storage seed** — `favorites.init()` is unit-tested, but confirming the real `+layout.svelte` onMount writes `{"v":1,"ids":[...]}` into the browser's `localStorage` on a cold load is a deployment-level check.
3. **D-OUT-01 visual confirmation** — grep proves NavShell does not read `favorites`; a live tap confirms the intended user-facing behavior (un-star Morphine, bottom bar still shows 4 tabs — the Phase 40 boundary).
4. **Reduced-motion** — No local animations means there is nothing to suppress, but a live run with OS-level "Reduce motion" is a 10-second sanity check.

None of these reveal gaps in the implementation; they are the normal human-verification belt that complements a fully-green automated suite for clinical-tool UI work. The parent orchestrator may choose to mark this phase `passed` on visual confirmation or proceed to Phase 41 on the automated evidence alone — both are defensible given the code + test evidence.

---

## Phase 43 Triage (D-07 / D-08)

**Triaged:** 2026-04-24 (pre-release)

| # | Item (summary) | Triage Status | Rationale |
|---|---|---|---|
| 1 | Full keyboard flow through hamburger (Tab/Shift+Tab/Esc, focus return to hamburger button) | `manual-QA-needed` | jsdom cannot fire a real Escape keydown through native `<dialog>` Esc handler. T-03, T-04, T-13 cover focus restore + tab order at component level. Live 30-second human check routed to v1.13.1 release-notes reminder per D-13. v1.14 backlog if iOS-specific keyboard automation becomes worth the investment. |
| 2 | Fresh-install localStorage seed `{"v":1,"ids":["morphine-wean","formula","gir","feeds"]}` persisted after reload | `verified-via-grep` | `favorites.test.ts` T-01 (first-run seed + persistence), T-02 (round-trip), T-18/T-19 (private-browsing throws) cover every branch of `init()`. `+layout.svelte:42` calls `favorites.init()` on mount (confirmed in Required Artifacts table). |
| 3 | Un-star Morphine, bottom nav still shows 4 tabs (D-OUT-01 visual confirm) | `verified-via-grep` | **Obsolete after Phase 41 D-OUT-01 flip.** Phase 40's D-OUT-01 boundary was intentionally inverted in Phase 41: NavShell now reads from favorites (`visibleCalculators` $derived), so un-starring Morphine reactively shrinks the bottom bar to 3 tabs. Current behavior verified by FAV-TEST-03 (Playwright E2E, 8 passing instances across viewports) per 41-VERIFICATION.md. |
| 4 | Reduced-motion open/close hamburger (no residual transitions) | `manual-QA-needed` | HamburgerMenu has zero local open/close animations (vacuously satisfied per code), but motion perception is subjective. 10-second sanity check noted in v1.13.1 release notes. |

**Disposition:** 2 verified-via-grep, 2 manual-QA-needed (deferred to v1.13.1 release-notes reminder + v1.14 backlog), 0 fix-required.

---

*Verified: 2026-04-23T14:20:00Z*
*Verifier: Claude (gsd-verifier)*
