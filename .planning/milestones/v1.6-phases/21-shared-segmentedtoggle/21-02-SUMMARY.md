---
phase: 21
plan: 02
subsystem: shared-components
tags: [svelte5, refactor, consumers]
requires: [21-01]
provides:
  - Morphine consuming SegmentedToggle
  - Formula Base consuming SegmentedToggle
affects:
  - src/lib/morphine/MorphineWeanCalculator.svelte
  - src/lib/fortification/FortificationCalculator.svelte
tech-stack:
  added: []
  patterns:
    - "Consumer 1:1 swap to shared SegmentedToggle"
    - "MutationObserver-only magnification re-trigger (per RESEARCH A1)"
key-files:
  created: []
  modified:
    - src/lib/morphine/MorphineWeanCalculator.svelte
    - src/lib/fortification/FortificationCalculator.svelte
    - src/lib/fortification/FortificationCalculator.test.ts
decisions:
  - "No $effect for magnification re-trigger — triggerMagnification is scoped inside onMount and not reachable from top-level $effect. The existing MutationObserver (line 94-95) already catches mode-switch re-renders (Assumption A1 holds)."
  - "Removed the dangling ARIA tabpanel placeholder loop along with the tablist (panels were hidden empty divs, never used)."
metrics:
  duration: ~3min
  tasks: 2
  files: 3
  tests: 131
completed: 2026-04-07
requirements: [TOG-04, TOG-05, TOG-06]
---

# Phase 21 Plan 02: Consumer wiring Summary

**One-liner:** Morphine drops its inline tablist + MODE_CONFIG/handlers for `<SegmentedToggle>`; Formula swaps its Base `<SelectPicker>` for `<SegmentedToggle>`. All 131 tests green.

## What Was Built

**Morphine (`MorphineWeanCalculator.svelte`):**
- Added `SegmentedToggle` import
- Replaced `MODE_ORDER` + `MODE_CONFIG` with a single `MODE_OPTIONS: { value: WeanMode; label: string }[]` const
- Deleted `activateMode` function (~9 lines)
- Deleted `handleModeTabKeydown` function (~34 lines)
- Deleted the inline `<div role="tablist">…</div>` block (~22 lines) — now `<SegmentedToggle label="Weaning mode" ariaLabel="Weaning mode" bind:value={morphineState.current.activeMode} options={MODE_OPTIONS} />`
- Deleted the dangling `role="tabpanel"` placeholder loop (panels were hidden empty divs, never wired to real content — dropping them aligns with RESEARCH Pitfall 1)

**Formula (`FortificationCalculator.svelte`):**
- Added `SegmentedToggle` import alongside (not replacing) the existing `SelectPicker` import
- Line 153: `<SelectPicker label="Base" …>` → `<SegmentedToggle label="Base" …>`
- All other SelectPickers (Formula searchable, Target Calorie, Unit) untouched
- `baseStr` string-bridge mirror pattern untouched — still flows through `fortificationState.current.base`

**Tests (`FortificationCalculator.test.ts`):**
- Updated UI-04 to reflect the new structure: 3 SelectPicker triggers (was 4), 1 numeric input, plus 1 tablist with 2 tabs for the Base toggle. Behavior under test unchanged.

## Verification

- `pnpm vitest run` — **131/131 pass** (same count as Wave 1 baseline; no new tests, no regressions)
- `pnpm check` — **4 errors, 1 warning** — all pre-existing baseline (`$app/state`, `$app/navigation`, `virtual:pwa-info`, `virtual:pwa-register`, and the Harness runes warning from Wave 1). The Wave 1 baseline had 5 errors including `triggerMagnification` scope in MorphineWeanCalculator — removing the obsolete `activateMode` function eliminated that error. **Net: -1 error, 0 new errors.**
- Grep guards:
  - `grep SelectPicker` in FortificationCalculator.svelte → 5 matches (1 import, 1 comment, 3 call sites: Formula/kcal/Unit) ✓
  - `grep role="tablist"|MODE_CONFIG|MODE_ORDER|handleModeTabKeydown|activateMode` in MorphineWeanCalculator.svelte → zero matches ✓
  - `grep SegmentedToggle` in both consumers → present in both ✓

## Deviations from Plan

**1. [Rule 3 — Blocking] Magnification `$effect` not added**
- **Found during:** Task 1 editing
- **Issue:** The plan's action step 7 said to add a `$effect(() => { morphineState.current.activeMode; rAF(rAF(triggerMagnification?.())); })`. But `triggerMagnification` is declared *inside* `onMount` (line 27) as a closure-local `let`, not on the module scope. A top-level `$effect` cannot see it — referencing it would be a TypeScript/scope error.
- **Fix:** Relied on the existing MutationObserver at lines 94-95 alone. This was explicitly documented in RESEARCH Open Question #2 / Assumption A1 as the fallback ("If after running tests… the `$effect` causes double-firing/flicker, remove the `$effect` and rely on the MutationObserver alone"). The MutationObserver watches `scheduleContainer` for `childList`+`subtree` changes, which fires when the `$derived` schedule swaps linear↔compounding and Svelte re-renders the card list — exactly the mode-switch re-magnification case.
- **Files modified:** none (change of approach, not code)
- **Follow-up:** Manual smoke (not executed here) recommended: toggle Linear↔Compounding on mobile width and confirm magnification re-passes. If it doesn't, the minimal fix is to hoist `triggerMagnification` to a top-level `let triggerMagnification: (() => void) | null = $state(null)` and then add the `$effect`.

**2. [Rule 1 — Cleanup] Removed dangling ARIA tabpanel loop**
- **Found during:** Task 1
- **Issue:** Morphine also had a separate `{#each MODE_ORDER as mode}` loop rendering empty `<div role="tabpanel">` placeholders. These referenced the now-deleted `MODE_ORDER`, so they had to go anyway, and RESEARCH Pitfall 1 already flagged these panel IDs as dangling (the real schedule content wasn't inside them).
- **Fix:** Deleted the whole placeholder loop. The schedule content below already renders inline and is `aria-live="polite"` — the tabpanel placeholders contributed nothing.
- **Files modified:** `src/lib/morphine/MorphineWeanCalculator.svelte`

**3. [Rule 1 — Test update] UI-04 assertion update**
- **Found during:** Task 2 verification
- **Issue:** `FortificationCalculator.test.ts` UI-04 asserted `data-select-trigger` count === 4. Now 3 (Base is a tablist).
- **Fix:** Updated the test to assert 3 select triggers + 1 tablist with 2 tabs. Behavior under test (UI shape) is unchanged in intent — we're just reflecting the new Base control.
- **Files modified:** `src/lib/fortification/FortificationCalculator.test.ts`

## Commit

- `f0547b9` — feat(21-02): wire Morphine + Formula to shared SegmentedToggle

## Self-Check: PASSED

- FOUND: src/lib/morphine/MorphineWeanCalculator.svelte (SegmentedToggle import + usage)
- FOUND: src/lib/fortification/FortificationCalculator.svelte (SegmentedToggle import + Base usage)
- FOUND: commit f0547b9
- VERIFIED: 131/131 tests pass
- VERIFIED: zero new svelte-check errors (net -1 from Wave 1 baseline)
