---
phase: 49-wave-2-visualviewport-drawer-anchoring
plan: 02
subsystem: ui
tags: [svelte5, runes, visualViewport, ios, drawer, css-variables, vitest, jsdom]

# Dependency graph
requires:
  - phase: 49-01
    provides: vv singleton with offsetTop / height / keyboardOpen $state runes; idempotent vv.init() wired in +layout.svelte:onMount
  - phase: 47-wave-0-test-scaffolding
    provides: simulateKeyboardOpen / simulateKeyboardDown / _resetVisualViewportMock helpers in src/lib/test/visual-viewport-mock.ts
  - phase: 48-wave-1-trivial-fixes-notch-focus
    provides: drawer auto-focus removal + close-button autofocus (T-07/T-08); preserved verbatim by 49-02
provides:
  - "InputDrawer.svelte consumes --ivv-bottom + --ivv-max-height CSS variables on inner .input-drawer-sheet div"
  - "$derived ivvStyle empty-string short-circuit when keyboardOpen=false (preserves Phase-48 behavior bit-for-bit via var(...) fallbacks)"
  - "T-09..T-12 InputDrawer test coverage (component keyboard-up/down + 2 source-grep regression sentinels)"
affects: [49-03, drawer-anchoring, ios-keyboard-up-rendering, prefers-reduced-motion]

# Tech tracking
tech-stack:
  added: []  # No new runtime dependencies. CSS custom properties + $derived rune (both already in stack).
  patterns:
    - "Empty-string short-circuit in $derived for inline style binding — when reactive condition is false, return '' so CSS var() fallbacks govern. Preserves prior behavior bit-for-bit at the var-fallback boundary."
    - "Inline style binding on the INNER sheet div, never on the outer <dialog> — preserves SelectPicker dialog-inside-drawer pattern (P-15)"
    - "max() composition of env(safe-area-inset-bottom, 0px) and var(--ivv-bottom, 0px) — single rule handles keyboard-up and keyboard-down branches without conditional CSS (P-07 double-offset trap mitigation)"
    - "Cascade-defeated max-height: 80vh; fallback line preserved alongside max-height: calc(var(--ivv-max-height, 80dvh)); for browsers without dvh support"
    - "Source-grep regression sentinel pattern (T-11 + T-12) — co-located vitest test reads source file, regex-rejects forbidden patterns. T-11 rejects style on <dialog>; T-12 rejects transition: in always-on sheet rule. Inherited from Phase 48 D-13 / Plan 49-01 T-06."

key-files:
  created: []
  modified:
    - "src/lib/shared/components/InputDrawer.svelte (+22 lines: 1 import, 15-line $derived block w/ comments, 1 inline style attr, 5 CSS lines incl. 3-line explanatory comment)"
    - "src/lib/shared/components/InputDrawer.test.ts (+78 lines: 5-line import block, 3-line beforeEach extension, 4 new test cases T-09..T-12 ~70 lines incl. comments)"

key-decisions:
  - "Empty-string short-circuit (D-09) — when vv.keyboardOpen is false, ivvStyle returns '' (not a fully-computed string with --ivv-bottom: 0px). Empty string lets the CSS var(..., default) fallbacks kick in cleanly; a defensive --ivv-bottom: 0px would composition with max(env(...), var(...)) fragile against future edits."
  - "Inline binding on inner .input-drawer-sheet div ONLY (D-11 / DRAWER-08 / P-15). T-11 source-grep sentinel guards future regression."
  - "No transition: declarations introduced (D-12 / D-27 / DRAWER-10). CSS variable changes propagate via the browser's normal recomputation pipeline; iOS keyboard appearance is itself a system-controlled animation we cannot synchronize with. T-12 source-grep sentinel guards future regression."
  - "Test file extends existing T-01..T-08 numbering with T-09..T-12 (D-18 / PATTERNS.md flat T-XX numbering). No new describe block. _resetVisualViewportMock() added to existing beforeEach."
  - "T-09 / T-10 explicitly call vv.init() inside the test body (component test does not run +layout.svelte:onMount). Idempotency guard makes repeated init() across tests a no-op."
  - "T-09 regex tolerates floating-point AND negative pixel values (-?\\d+(\\.\\d+)?px) — defense against jsdom polyfill reporting unusual offsetTop. Plan-spec exact regex shape preserved verbatim."
  - "T-10 asserts ABSENCE of variable substrings (not toBe('')) — Svelte 5's renderer may emit style=\"\" or omit attribute entirely; both are valid empty-style states."
  - "T-12 regex matches the FIRST .input-drawer-sheet { ... } body via [^}]* non-greedy capture. The @media-gated rule has selector `.input-drawer-dialog[open] .input-drawer-sheet` (different prefix), so the regex correctly extracts only the always-on rule."

patterns-established:
  - "Empty-string $derived short-circuit for CSS variable inline binding — applicable any time a Svelte 5 component reactively switches between 'apply CSS variables' and 'leave CSS variables unset to use fallback path'."
  - "Phase 49 wiring pattern (singleton import + $derived + inline style on element + CSS rule consumes var with fallback identical to prior value) — safe template for adding any future global reactive state to scoped components without risking keyboard-down regression."

requirements-completed:
  - DRAWER-05
  - DRAWER-06
  - DRAWER-07
  - DRAWER-08
  - DRAWER-10
  - DRAWER-11
  - DRAWER-12
  - DRAWER-TEST-02

# Metrics
duration: 9 min
completed: 2026-04-27
---

# Phase 49 Plan 02: InputDrawer visualViewport Wiring Summary

**Wire `vv` singleton (Plan 49-01) into `InputDrawer.svelte` via a `$derived ivvStyle` computation + inline `style={ivvStyle}` on the inner `.input-drawer-sheet` `<div>`. Two CSS rule changes (`max-height` consumes `calc(var(--ivv-max-height, 80dvh))`; `padding-bottom` consumes `max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))`) produce visualViewport-aware sizing that preserves Phase-48 behavior bit-for-bit when the keyboard is down (CSS `var(...)` fallbacks resolve to the prior values) and lifts the sheet above the iOS soft keyboard when up. Extends `InputDrawer.test.ts` with T-09 (component keyboard-up), T-10 (component keyboard-down), and two source-grep regression sentinels (T-11: no `style=` on `<dialog>`; T-12: no `transition:` in always-on sheet rule). Zero per-calculator edits; six calculator routes inherit the new behavior via single source of truth in `InputDrawer.svelte`. `<dialog>` `showModal()` + Esc-to-close + focus-trap + close-button `autofocus` byte-identical to Phase 48.**

## Performance

- **Duration:** ~9 min (2 atomic task commits)
- **Started:** 2026-04-27T18:43:36Z
- **Completed:** 2026-04-27T18:52:19Z
- **Tasks:** 2 / 2
- **Files modified:** 2

## Accomplishments

- `src/lib/shared/components/InputDrawer.svelte` lands the four locked edits per plan + CONTEXT.md D-08..D-12 + UI-SPEC.md LC-01..LC-05 + Reduced-Motion Contract:
  1. `vv` singleton import after `@lucide/svelte` import
  2. `$derived ivvStyle` block with empty-string short-circuit on `keyboardOpen === false`
  3. Inline `style={ivvStyle}` on the inner `.input-drawer-sheet` `<div>` (NOT on outer `<dialog>` — DRAWER-08 / P-15)
  4. CSS rule changes inside `.input-drawer-sheet { ... }`:
     - `max-height: 80dvh` → `max-height: calc(var(--ivv-max-height, 80dvh))` (DRAWER-06)
     - `padding-bottom: env(safe-area-inset-bottom, 0px)` → `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))` (DRAWER-07)
  Cascade-defeated `max-height: 80vh;` line preserved (older-browser fallback). Fallback values (`80dvh` and `0px`) bit-for-bit identical to Phase-48 rules — keyboard-down behavior preserved verbatim.
- `src/lib/shared/components/InputDrawer.test.ts` extended with T-09..T-12 (DRAWER-TEST-02):
  - **T-09** (component): mount drawer expanded → `simulateKeyboardOpen()` → `.input-drawer-sheet` style attribute contains both `--ivv-bottom:` and `--ivv-max-height:` substrings.
  - **T-10** (component): mount drawer expanded → keyboard-up → keyboard-down → style attribute does NOT contain either CSS variable (LC-03 empty-string short-circuit).
  - **T-11** (source-grep / P-15 / DRAWER-08): rejects any `<dialog ... style=` attribute. Prevents regression that would inherit transforms into SelectPicker's nested top-layer dialog.
  - **T-12** (source-grep / D-27 / DRAWER-10): rejects any `transition:` declaration in the always-on `.input-drawer-sheet { ... }` rule. Preserves the reduced-motion contract; prevents reintroduction of scroll-driven coupling DRAWER-02 forbids.
  Test imports extended with three Phase 47 mock helpers (`simulateKeyboardOpen`, `simulateKeyboardDown`, `_resetVisualViewportMock`). `beforeEach` now calls `_resetVisualViewportMock()` so each test starts from the no-keyboard baseline.
- **Zero regression in any verification gate:**
  - `pnpm exec svelte-check --threshold error` → 0 errors (1 pre-existing `a11y_autofocus` warning at line 129 unchanged from Phase 48 — out of scope)
  - `pnpm exec vitest run src/lib/shared/components/InputDrawer.test.ts --reporter=verbose` → 12/12 passing (T-01..T-08 unchanged, T-09..T-12 new)
  - `pnpm exec vitest run` → 464/464 passing (vs 460 post-49-01; +4 from this plan)
  - `pnpm build` → succeeds (SSG prerender + PWA SW + adapter-static all clean)

## Task Commits

1. **Task 1: Wire vv singleton into InputDrawer.svelte (4 pinpoint edits)** — `07ff46b` (`feat(49-02): wire vv singleton into InputDrawer (DRAWER-05..08 + DRAWER-10..12)`)
2. **Task 2: Extend InputDrawer.test.ts with T-09..T-12** — `7d3c22d` (`test(49-02): add T-09..T-12 InputDrawer visualViewport tests (DRAWER-TEST-02)`)

**Plan metadata commit:** added at finalization (this SUMMARY.md + state updates).

## Files Created/Modified

- `src/lib/shared/components/InputDrawer.svelte` (MODIFIED, +22 lines):
  - Line 20: `import { vv } from '$lib/shared/visualViewport.svelte.js';` (Edit 1)
  - Lines 69-82: 9-line explanatory comment block + `const ivvStyle = $derived(...)` ternary with empty-string short-circuit (Edit 2)
  - Line 110: `style={ivvStyle}` on inner `.input-drawer-sheet` `<div>` (Edit 3)
  - Line 175: `max-height: calc(var(--ivv-max-height, 80dvh));` (Edit 4a)
  - Lines 178-181: 3-line explanatory comment + `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));` (Edit 4b)
  - Cascade-defeated `max-height: 80vh;` at line 174 preserved
  - Lines 1-19, 21-67, 84-96, 99-105, 112-147, 150-171, 184-211 byte-identical to Phase 48 (DRAWER-12 / D-26 — `<dialog>` showModal/close, focus-trap, close-button autofocus, `::backdrop`, `@media (prefers-reduced-motion: no-preference)`, both `@keyframes` blocks all unchanged)
- `src/lib/shared/components/InputDrawer.test.ts` (MODIFIED, +78 lines):
  - Lines 13-17: import block extension (`simulateKeyboardOpen`, `simulateKeyboardDown`, `_resetVisualViewportMock`)
  - Lines 36-38: `beforeEach` extension with `_resetVisualViewportMock()` call + comment
  - Lines 132-150: T-09 (component, keyboard-up, ~19 lines)
  - Lines 152-171: T-10 (component, keyboard-down, ~20 lines)
  - Lines 173-180: T-11 (source-grep, no style on dialog, ~8 lines)
  - Lines 182-200: T-12 (source-grep, no transition on sheet, ~19 lines)
  - Existing T-01..T-08 (lines 39-129) unchanged
  - Trailing `void InputDrawer;` keep-alive line preserved

## Decisions Made

All implementation decisions were locked in `49-CONTEXT.md` (D-08..D-12, D-18, D-26, D-27) and `49-PLAN.md` HARD RULES. Execution followed the plan verbatim — no discretionary choices were taken. Specific points worth noting:

- **Edit application via Python helper script** rather than the Edit/Write tools. Encountered an apparent caching issue in this session where Edit/Write tools reported success but did not modify the file on disk for edits 2-4 of Task 1 (Edit 1 did persist). Fell back to direct `python3` rewrite (Task 1 Edit 4) and `awk` insertions (Task 1 Edits 2 + 3) to apply changes deterministically. Final file content matches the plan-spec verbatim. **Not a deviation from plan logic** — the resulting file has exactly the four edits described in `<action>`. Strictly an executor-tooling routing.
- **Comment block phrasing in `<script>`** matches the plan's `<action>` block 9-line preamble verbatim (D-09 explanation including UI-SPEC.md LC-03 + CONTEXT.md D-09 references). Reduces cognitive load for future maintainers reading the diff.
- **CSS comment block above `padding-bottom`** matches the plan's `<action>` block 3-line preamble verbatim (DRAWER-07 explanation of the `max()` composition behavior across keyboard-down and keyboard-up branches).
- **Test numbering and structure** follow the plan's `<action>` block verbatim: T-09 / T-10 / T-11 / T-12 inside the existing `describe('InputDrawer', ...)` block, with the four new tests inserted between T-08's closing `});` and the trailing `void InputDrawer;` keep-alive line.

## Deviations from Plan

None — plan executed exactly as written. Both tasks landed on the locked four edits + four new test cases. Zero bugs surfaced, zero missing critical functionality, zero blockers, zero architectural decisions required.

**Total deviations:** 0
**Impact on plan:** Plan executed verbatim. All `<must_haves>` "truths" hold:
- ✓ When `vv.keyboardOpen === false`, `.input-drawer-sheet` style attribute is empty and CSS fallbacks govern (verified by T-10, full vitest suite green).
- ✓ When `vv.keyboardOpen === true`, style attribute contains both `--ivv-bottom: <px>` and `--ivv-max-height: <px>` substrings (verified by T-09).
- ✓ Inline style binding on inner `<div class='input-drawer-sheet'>` only, NEVER on outer `<dialog>` (verified by T-11 source-grep sentinel + manual grep `<dialog[^>]*\sstyle=` returns empty).
- ✓ `.input-drawer-sheet` always-on rule declares no `transition:` (verified by T-12 source-grep sentinel + manual `grep -F "transition:" InputDrawer.svelte` returns empty).
- ✓ `<dialog>.showModal()` + Esc-to-close + focus-trap + close-button `autofocus` byte-identical to Phase 48 (verified by T-07 + T-08 still passing; lines 42-65, 99-105, 109-141 unchanged).
- ✓ All six calculator routes inherit the new behavior with zero per-calculator edits (single source of truth — only `InputDrawer.svelte` + `InputDrawer.test.ts` modified by this plan).
- ✓ Existing `md:hidden` rule on the `<InputsRecap>` trigger (`InputsRecap.svelte:162`) preserved unchanged (DRAWER-11 — not touched by this plan; no `md:hidden` class added to drawer/dialog).
- ✓ T-09 + T-10 + T-11 + T-12 all pass deterministically (12/12 vitest run).

## Issues Encountered

**Worktree was branched from a stale pre-Phase-49 commit** (`df30e64` — last Phase 45 commit). At agent startup the worktree did not contain Plan 49-01's outputs (the `vv` singleton at `src/lib/shared/visualViewport.svelte.ts`, which is required for this plan's `import { vv } from ...` line). Per the `<worktree_branch_check>` protocol, performed `git reset --hard 6e398c0` (the current main HEAD post-49-01-state-update) at the very start of the agent run before any task work. No work was discarded because the worktree had no uncommitted changes. Identical issue documented in Plan 49-01 SUMMARY's "Issues Encountered" section.

**Edit/Write tool caching mid-session:** As noted in "Decisions Made" above, the Edit and Write tools reported success but did not modify the file on disk for Task 1 Edits 2-4. Detected via `md5sum` comparison + `grep` returning zero matches for content the Read tool claimed was present. Fell back to Bash-level `python3` and `awk` rewrites to apply changes deterministically; final file content matches plan spec exactly. This was an executor-tooling issue, not a plan-logic deviation.

**`node_modules/` was absent in the worktree filesystem** (worktree freshly created); ran `pnpm install --frozen-lockfile` (~6s) before any verification gates. No lockfile changes; `pnpm-lock.yaml` is untouched.

All three items are environment / tooling fixes, not deviations from plan logic.

## User Setup Required

None — no external service configuration required. This plan ships purely client-side code; no env vars, no dashboards, no credentials, no per-calculator edits.

## Next Phase Readiness

**Ready for 49-03-PLAN.md** (Playwright spec + axe regression gate — DRAWER-TEST-03 + DRAWER-TEST-04).

The drawer wiring is now live and observable:

- `.input-drawer-sheet` consumes `--ivv-bottom` / `--ivv-max-height` CSS custom properties via `inline style={ivvStyle}` (live in dev + production builds).
- DRAWER-TEST-03 Playwright spec can synthesize `Object.defineProperty(window.visualViewport, 'height', { value: 400 })` + `dispatchEvent(new Event('resize'))` and assert `getComputedStyle('.input-drawer-sheet').maxHeight === '384px'` (i.e., `400 - 16`). Spec inherits both `chromium` and `webkit-iphone` projects per Phase 47 D-15.
- DRAWER-TEST-04 axe re-run gate has zero new color tokens / ARIA / landmarks to verify — only CSS variable consumption on an existing element.
- `e2e/drawer-no-autofocus.spec.ts` (Phase 48 cross-calculator focus contract) preserved verbatim — Phase 49-02 makes zero focus-management change. Expected to remain 12/12 green.

**Verification gates passed:**
- ✓ `pnpm exec svelte-check --tsconfig ./tsconfig.json --threshold error` → 0 errors
- ✓ `pnpm exec vitest run src/lib/shared/components/InputDrawer.test.ts --reporter=verbose` → 12/12 passing (T-01..T-12)
- ✓ `pnpm exec vitest run` → 464/464 passing (zero regressions; +4 from this plan)
- ✓ `grep -nE "<dialog[^>]*\sstyle=" src/lib/shared/components/InputDrawer.svelte` → empty (T-11 sentinel)
- ✓ `grep -nF "transition:" src/lib/shared/components/InputDrawer.svelte` → empty (T-12 sentinel)
- ✓ `grep -nF "vv.init" src/lib/shared/components/InputDrawer.svelte` → empty (D-14 — layout-level init only)
- ✓ `grep -nF "style={ivvStyle}" src/lib/shared/components/InputDrawer.svelte` → exactly 1 match at line 110 (inner sheet div)
- ✓ `grep -nF "max-height: 80vh;" src/lib/shared/components/InputDrawer.svelte` → exactly 1 match at line 174 (cascade-defeated older-browser fallback preserved)
- ✓ `pnpm build` → succeeds (SSG prerender + PWA SW + adapter-static all clean)

**No blockers carried into 49-03.**

## Self-Check: PASSED

- ✓ `src/lib/shared/components/InputDrawer.svelte` exists on disk (12,152 bytes, 211 lines)
- ✓ `src/lib/shared/components/InputDrawer.test.ts` exists on disk (10,271 bytes, 205 lines)
- ✓ `.planning/phases/49-wave-2-visualviewport-drawer-anchoring/49-02-SUMMARY.md` exists on disk (this file)
- ✓ Task 1 commit `07ff46b` present in git log (`git log --oneline | grep 07ff46b`)
- ✓ Task 2 commit `7d3c22d` present in git log (`git log --oneline | grep 7d3c22d`)

---
*Phase: 49-wave-2-visualviewport-drawer-anchoring*
*Completed: 2026-04-27*
