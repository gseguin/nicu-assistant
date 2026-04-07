---
phase: 10-fortification-calculator-ui
plan: 01
subsystem: fortification-ui
tags: [svelte5, runes, fortification, ui]
requires: [fortification/calculations.ts, fortification/fortification-config.ts, shared/NumericInput, shared/SelectPicker]
provides: [fortificationState singleton, FortificationCalculator component]
affects: []
tech-stack:
  added: []
  patterns: [morphine-state-mirror, string-bridge-kcal, auto-reset-effect]
key-files:
  created:
    - src/lib/fortification/state.svelte.ts
    - src/lib/fortification/state.svelte.test.ts
    - src/lib/fortification/FortificationCalculator.svelte
    - src/lib/fortification/FortificationCalculator.test.ts
    - src/lib/fortification/test-mock-state.svelte.ts
  modified: []
decisions:
  - "Split mirror→state into 4 per-field effects with untrack to eliminate cross-field stale-write reverts"
  - "Added test-mock-state.svelte.ts helper to expose a $state-backed mock so post-render mutations drive component reactivity (morphine's plain-object mock can't do this)"
requirements: [UI-01, UI-02, UI-03, UI-04, UI-05]
metrics:
  duration: "~15 min"
  tasks: 3
  tests: 14
  completed: 2026-04-07
---

# Phase 10 Plan 01: Fortification Calculator UI — Summary

Built the fortification state singleton and FortificationCalculator Svelte component that renders the Phase 9 `calculateFortification` API. Five inputs (Base, Volume, Formula grouped by manufacturer, Target kcal/oz, Unit), four live outputs (Amount to Add, Yield, Exact kcal/oz, Suggested Starting Volume), isBlocked suppression for Packets+non-HMF, and auto-reset on HMF→non-HMF transitions. Wiring to the /formula route lands in Plan 10-02.

## Files Created

1. **`src/lib/fortification/state.svelte.ts`** — `fortificationState` singleton mirroring the morphine pattern. Defaults: BM / 180 mL / neocate-infant / 24 / teaspoons. `init`/`persist`/`reset`/`current` methods, all sessionStorage calls try/catch-silenced.
2. **`src/lib/fortification/state.svelte.test.ts`** — 6 tests covering defaults, init merge, corrupt JSON, persist round-trip, reset, and no-throw on sessionStorage failure.
3. **`src/lib/fortification/FortificationCalculator.svelte`** — unified calculator component. String-bridge mirrors (kcalStr / baseStr / formulaStr / unitStr), per-field mirror→state effects with `untrack`, single state→mirrors effect, isBlocked derived, auto-reset effect with prevFormulaId tracking, real `calculateFortification` via `$derived.by`, hero card with `formatAmount`, verification card with `.toFixed(1)`.
4. **`src/lib/fortification/FortificationCalculator.test.ts`** — 8 tests covering UI-01..UI-05.
5. **`src/lib/fortification/test-mock-state.svelte.ts`** — test-only helper exposing a `$state`-backed mutable mock plus `resetMockState()`. Enables post-render reactivity that the plain-object morphine pattern cannot provide.

## Test Results

**State tests (6/6 passing):** defaults, init merge, corrupt JSON no-throw, persist writes JSON, reset clears state and storage, sessionStorage failures silenced.

**Component tests (8/8 passing):**

| Test | Requirement | Status |
|---|---|---|
| renders all 5 inputs | UI-01 | PASS |
| default outputs (Neocate parity: 2 Teaspoons / 183.5 mL / 23.5 kcal/oz / 180 (6.1 oz)) | UI-02 | PASS |
| live recalc volumeMl 180→360 (4 Teaspoons / 367.0 mL / 23.5 kcal/oz / 360 (12.2 oz)) | UI-02 | PASS |
| isBlocked steady state on mount | UI-03 | PASS |
| blocked transition (non-HMF + select Packets) | UI-03 | PASS |
| auto-reset on similac-hmf → non-HMF while Packets | UI-03 | PASS |
| reuses only NumericInput + SelectPicker (4 triggers + 1 spinbutton) | UI-04 | PASS |
| OKLCH tokens only, no hardcoded colors | UI-05 | PASS |

**Full `src/lib/fortification/` directory:** 32/32 tests pass (state 6 + component 8 + Phase 9 calculations/config 18). Phase 9 regression suite still green. `npm run check` reports no new tsc errors in `src/lib/fortification/`.

## Locked Literals (verified against real calculateFortification)

Neocate Infant + BM + 180 mL + 24 kcal/oz + teaspoons:
- amountToAdd = 2 (bm-tsp-24 shortcut: `180/90 * 1`)
- yieldMl = 180 + (2 * 2.5 * 0.7) = **183.5 mL**
- exactKcalPerOz = ((20 * 180/29.57) + 5 * 4.83) / (183.5/29.57) ≈ 23.509 → **"23.5 kcal/oz"**
- suggestedStartingVolumeMl = wholeAmount(2) * 90 = 180 mL; 180/29.57 ≈ 6.087 → **"180 (6.1 oz)"**

Same at 360 mL: amountToAdd=4, yieldMl=367.0, exact=23.5, suggested="360 (12.2 oz)". Linear scale because the bm-tsp-24 branch is linear in volume.

## Deviations from Plan

### [Rule 3 - Blocker] Split mirror→state effect into per-field effects

**Found during:** Task 3 (auto-reset test)

**Issue:** The locked spec used a single `$effect` for mirror→state. With both mirror→state and auto-reset writing to `fortificationState.current.unit`, the mirror→state effect would re-run when an *unrelated* tracked mirror changed (e.g. `formulaStr` updating during a formulaId transition), read the *stale* `unitStr='packets'`, and revert the auto-reset's `unit='teaspoons'` write. The bug reproduced deterministically in Test 6 (debugged via console logs) — after auto-reset set `s.unit='teaspoons'`, mirror→state fired because formulaStr had changed and clobbered `s.unit` back to `'packets'`.

**Fix:** Split mirror→state into 4 per-field effects. Each effect tracks only its own mirror string, so a change to `formulaStr` no longer re-triggers the unit-writing branch. Each effect also reads state via `untrack(() => ...)` so external state mutations never re-trigger the effect. This preserves the locked string-bridge semantics (user input still flows mirror → state) and closes the feedback loop.

**Why this is Rule 3:** The single-effect spec as locked cannot coexist with the auto-reset effect — they fundamentally race on `unit`. The fix is the minimal change to make both locked behaviors work together without violating any other lock. All 4 mirrors still exist, the state→mirrors effect is unchanged, the auto-reset effect is unchanged verbatim.

**Files modified:** `src/lib/fortification/FortificationCalculator.svelte`

### [Rule 3 - Blocker] test-mock-state.svelte.ts reactive mock

**Found during:** Task 3 (Test 3 live recalc, Tests 5-6 post-render mutation)

**Issue:** The locked spec said to mirror the morphine test pattern with a plain mutable object behind `get current()`. That pattern works for morphine because morphine tests set state BEFORE render. The locked Phase 10 Test 3 (and Tests 5-6) mutate state AFTER render and rely on Svelte `$effect`/`$derived` re-running. Plain objects have no reactive signals, so writes don't propagate.

**Fix:** Created `test-mock-state.svelte.ts` — a test-only helper that exports a `$state`-backed mutable object plus `resetMockState()`. The component mock still uses `get current() { return mockState; }`, so the morphine `get current()` pattern is preserved; the difference is that `mockState` is a rune proxy, so property writes are tracked. Test file imports `mockState` from this helper, uses it identically to the plain morphine mockState. No change to production code, no new runtime deps, test-only.

**Why this is Rule 3:** The locked tests cannot pass with a plain-object mock — it's a physical impossibility in Svelte 5's reactivity model. The helper is the minimal viable adapter.

**Files created:** `src/lib/fortification/test-mock-state.svelte.ts`

### [Rule 1 - Bug] SelectPicker label query strategy

**Found during:** Task 3 (Test 1)

**Issue:** SelectPicker renders its label as a `<span>`, not a `<label for=...>`. `getByLabelText('Base')` finds nothing. The trigger button carries `aria-label="{label}: {selectedLabel}"`.

**Fix:** Introduced a `getSelectTrigger(label)` helper that matches the trigger by `role="button"` with `name` regex `^{label}:`. `getByLabelText` is still used for the NumericInput (which DOES render a proper `<label for=>`). This keeps the locked labels exact in the component template (`Base`, `Starting Volume (mL)`, `Formula`, `Target Calorie (kcal/oz)`, `Unit`) and the test still asserts each one — just via the label-prefix pattern rather than `getByLabelText`.

**Note:** This is a SelectPicker accessibility concern (no programmatic label association) but fixing it is out of scope — CONTEXT locks "do not modify SelectPicker". Logged as a deferred a11y item for Phase 11's axe-core audit.

**Files modified:** `src/lib/fortification/FortificationCalculator.test.ts`

### [Rule 1 - Bug] `combobox` role assertion

**Found during:** Task 3 (Test 7)

**Issue:** bits-ui SelectPicker triggers have `role="button"` (not `combobox`) with `aria-haspopup="listbox"` and `data-select-trigger`. The locked Test 7 asserted `getAllByRole('combobox')`.

**Fix:** Test 7 now queries `document.querySelectorAll('[data-select-trigger]')` to count the 4 SelectPicker triggers. Still proves UI-04 ("only NumericInput + SelectPicker"): exactly 4 SelectPicker triggers + 1 spinbutton. This is a test authoring correction against the actual rendered DOM — the lock on the intent (4 SelectPickers + 1 NumericInput) is honored.

**Files modified:** `src/lib/fortification/FortificationCalculator.test.ts`

## Deferred Items

- **SelectPicker label a11y:** the component renders its label as `<span>` rather than `<label for=>` so `getByLabelText` cannot target it. The trigger button's `aria-label` is "{label}: {selectedValue}" which is functional for screen readers, but a programmatic `<label for=>` association would be stronger. Defer to Phase 11 axe-core pass or a future shared-components plan.

## Locked-Behavior Confirmation

- **String-bridge:** four local `$state` mirrors (kcalStr, baseStr, formulaStr, unitStr) implemented. One state→mirrors effect and four per-field mirror→state effects (split for correctness — see Deviation above). `parseInt(kcalStr,10) as TargetKcalOz` cast preserved. No `as string` casts in `bind:value` expressions.
- **isBlocked:** pure `$derived`, no mutation, exactly the spec.
- **Auto-reset:** `prevFormulaId` tracked via closure `let`, fires only on `similac-hmf → non-HMF` while `unit === 'packets'`, sets `unit = 'teaspoons'`. Verbatim from spec.
- **Number formatting:** `formatAmount(n) = n.toFixed(2).replace(/\.?0+$/, '')` — verified Neocate case yields `"2"`.
- **Verification precision:** `yieldMl.toFixed(1)` and `exactKcalPerOz.toFixed(1)`.
- **OKLCH tokens only:** all colors via `var(--color-*)`. No hex / oklch literals / Tailwind palette classes.
- **No new dependencies.**
- **No emojis.**
- **No modifications to SelectPicker, NumericInput, morphine, Phase 9 fortification files, /formula route, registry, or about-content.**

## Self-Check: PASSED

All 5 created files exist on disk. Commit `2b22042` contains all 5 files. 32/32 tests pass.
