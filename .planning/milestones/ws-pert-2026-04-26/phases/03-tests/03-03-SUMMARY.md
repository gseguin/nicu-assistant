---
phase: 3
plan: 3
workstream: pert
subsystem: pert
tags: [pert, tests, components, vitest, testing-library-svelte]
requires:
  - src/lib/pert/PertCalculator.svelte (Phase 2; tested, not modified)
  - src/lib/pert/PertInputs.svelte (Phase 2; tested, not modified)
  - src/lib/pert/state.svelte.ts (Phase 1; tested, not modified)
  - src/lib/pert/pert-config.json (validationMessages.emptyOral / emptyTubeFeed; advisories.weight-out-of-range range 0.5..50; max-lipase-cap message)
  - CONTEXT D-07 (component test split)
  - CONTEXT D-08 (empty-state gate, STOP-red trigger)
  - CONTEXT D-09 (tertiary oral-only)
  - CONTEXT D-11 (medication change resets strengthValue)
  - CONTEXT D-14 (inputmode='decimal')
  - CONTEXT D-17 (Lipase per gram of fat label)
  - PERT-MODE-03 (mode toggle binding; shared input preserved)
provides:
  - 10 component output-surface tests for PertCalculator (empty / hero / tertiary mode-conditional / Capsules per month / STOP-red role='alert' / warning role='note' / secondaries hidden on empty)
  - 7 input-wiring tests for PertInputs (mode toggle binding / mode-switch preservation / D-11 strength reset / D-14 inputmode='decimal' / mode-conditional input visibility)
  - PERT-TEST-03 closure
affects:
  - Total vitest test count grows from 361 (Phase 2 baseline) to 378 (10 + 7 = 17 new tests; 38 + 2 = 40 test files).
tech-stack:
  added: []
  patterns:
    - "Mirrors src/lib/feeds/FeedAdvanceCalculator.test.ts and FeedAdvanceInputs.test.ts pattern verbatim (pertState.reset() in beforeEach, render(), screen queries, fireEvent.click on tabs)."
    - "STOP-red advisory disambiguated from warning advisory via role-based queries: getByRole('alert') for severity=stop, getAllByRole('note') for severity=warning."
    - "D-11 strength-reset effect is exercised via direct state mutation + double Promise.resolve flush (NOT via SelectPicker fireEvent; the dialog polyfill is flaky in jsdom per Pitfall 5)."
    - "D-14 inputmode regression guard iterates screen.getAllByRole('spinbutton') and asserts each carries inputmode='decimal' (the shared NumericInput sets the attribute at line 157)."
    - "ASCII-only strings throughout; em-dash (U+2014) and en-dash (U+2013) counts both 0 across both new files."
key-files:
  created:
    - src/lib/pert/PertCalculator.test.ts
    - src/lib/pert/PertInputs.test.ts
  modified: []
decisions:
  - "Used double Promise.resolve flush in the D-11 test (case 6 of PertInputs.test.ts) to settle the lastMedId-tracking $effect. Single flush passed locally but the second resolve is a defensive guard against rune-batching variance across jsdom + node versions."
  - "Warning advisory test (case 9 of PertCalculator.test.ts) sets weight=60 with deliberately benign other inputs (fat=10, lipase/g=1000, Creon 12000) so dailyLipase=36000 stays well under the 600,000 STOP-red cap. This isolates the warning advisory and proves the role='note' branch fires alone (no STOP-red contamination)."
  - "Live config check at planning time confirmed weightKg input range max=80 in pert-config.json (NOT the 50kg advisory cap). weight=60 is therefore a valid input that fires the warning advisory only."
metrics:
  duration: 8 minutes
  completed: 2026-04-24
---

# Phase 3 Plan 3: PertCalculator.test.ts + PertInputs.test.ts Summary

**One-liner:** 17 component tests across two new files (10 PertCalculator + 7 PertInputs) lock the PERT calculator's output surface and input wiring against regressions, mirroring the feeds split with pertState.reset() per-test isolation.

## What Shipped

- `src/lib/pert/PertCalculator.test.ts` (NEW, 139 lines) with 10 tests in a single `describe('PertCalculator output surface', ...)` block:
  1. Does not render input fields itself (extracted to PertInputs per D-07).
  2. Shows Oral empty-state hero copy when fatGrams is null (`Enter weight and fat grams`).
  3. Shows Tube-Feed empty-state hero copy when formulaId is null (`Enter weight and select a formula`).
  4. Renders Oral hero capsulesPerDose numeral with class='num' for fixture row 0 inputs (weight 10, fat 25, lipase/g 2000, Creon 12000 -> '4').
  5. Renders Oral tertiary `Estimated daily total (3 meals/day)` eyebrow.
  6. Does NOT render the tertiary in Tube-Feed mode (oral-only per D-09 regression guard).
  7. Renders Tube-Feed `Capsules per month` secondary with '150' numeral for fixture row 0 inputs.
  8. STOP-red advisory fires with `role='alert'` + `aria-live='assertive'` for stopRedTrigger inputs (weight 2, fat 50, lipase/g 4000, Creon 6000); message contains '10,000 units' substring.
  9. Warning advisory uses `role='note'` (NOT 'alert') for weight-out-of-range case (weight=60 over the 50kg advisory cap).
  10. Hides secondaries on empty state (only weight set; queries for 'Total lipase needed' and 'Lipase per dose' return null).

- `src/lib/pert/PertInputs.test.ts` (NEW, 96 lines) with 7 tests in a single `describe('PertInputs input wiring', ...)` block:
  1. Renders Weight input + mode toggle in the shared card (Oral + Tube-Feed tabs visible).
  2. Oral mode renders Fat per meal + 1 'Lipase per gram of fat' label (D-17).
  3. Tube-Feed mode renders Formula + Volume per day + 1 'Lipase per gram of fat' label.
  4. Clicking the Tube-Feed tab updates `pertState.current.mode` to 'tube-feed' AND preserves shared `weightKg` (PERT-MODE-03 binding test).
  5. Mode-switch preserves shared inputs (weightKg, medicationId, strengthValue) AND mode-specific oral inputs (oral.fatGrams, oral.lipasePerKgPerMeal) per D-07.
  6. D-11 medication-change strength reset: setting `medicationId='zenpep'` after Creon was active clears `strengthValue` to null (effect runs after Promise.resolve flush).
  7. D-14 every numeric input has `inputmode='decimal'` (regression guard via `getAllByRole('spinbutton')` iteration).

## Test Counts and Verification

| Gate | Result |
|---|---|
| `pnpm test:run src/lib/pert/PertCalculator.test.ts` | green (10/10) |
| `pnpm test:run src/lib/pert/PertInputs.test.ts` | green (7/7) |
| `pnpm test:run` (full vitest) | green (378/378 across 40 files) |
| Phase 2 baseline 361 + 17 new = 378 | matches |
| `pnpm test:run src/lib/pert/config.test.ts src/lib/pert/state.test.ts` | green (17/17 = 11 config + 6 state; Phase-1-frozen) |
| `pnpm check` | COMPLETED 4584 FILES 0 ERRORS 0 WARNINGS |
| `grep -c "—" src/lib/pert/PertCalculator.test.ts` | 0 |
| `grep -c "–" src/lib/pert/PertCalculator.test.ts` | 0 |
| `grep -c "—" src/lib/pert/PertInputs.test.ts` | 0 |
| `grep -c "–" src/lib/pert/PertInputs.test.ts` | 0 |
| `git status --short` | only the two new test files (?? src/lib/pert/PertCalculator.test.ts, ?? src/lib/pert/PertInputs.test.ts) |

## Acceptance Criteria

| Criterion | Status |
|---|---|
| File `src/lib/pert/PertCalculator.test.ts` exists | green |
| 10 tests green in PertCalculator.test.ts | green |
| `getByRole('alert')` + `aria-live='assertive'` + '10,000 units' substring asserted | green (case 8) |
| `getAllByRole('note')` + 'Outside expected pediatric range' substring asserted | green (case 9) |
| Empty-state hero copy 'Enter weight and fat grams' AND 'Enter weight and select a formula' both asserted | green (cases 2 + 3) |
| 'Estimated daily total (3 meals/day)' tertiary present in oral mode AND null in tube-feed mode | green (cases 5 + 6) |
| 'Capsules per month' + '150' numeral asserted in tube-feed mode | green (case 7) |
| File `src/lib/pert/PertInputs.test.ts` exists | green |
| 7 tests green in PertInputs.test.ts | green |
| Mode-toggle binding test uses fireEvent.click on Tube-Feed tab + asserts mode flip | green (case 4) |
| D-11 strength-reset asserts strengthValue === null after medicationId mutation | green (case 6) |
| D-14 inputmode test iterates getAllByRole('spinbutton') and asserts each has inputmode='decimal' | green (case 7) |
| Em-dash count 0 across both files | green |
| `pnpm check` 0/0 | green |
| No production code (.svelte / .ts / .json) modified | green |

## Deviations from Plan

None. The plan executed exactly as written. The cells the plan called out as "verify before asserting":

- The `weightKg.max` = 80 (input field), not 50 (which is the warning advisory cap value). Confirmed in pert-config.json:18. weight=60 is therefore a valid input value and IS outside the advisory cap (0.5 .. 50), so it correctly fires the warning advisory while staying valid as an input.
- The fat-out-of-range advisory (range 1..100) does NOT fire for fat=50 (case 8 STOP-red trigger), so case 8 cleanly tests STOP-red in isolation. fat=10 (case 9 warning) also stays inside 1..100, so case 9 cleanly tests warning in isolation.
- The STOP-red message in pert-config.json is `Exceeds 10,000 units/kg/day cap. Verify with prescriber.` and the test asserts the `/10,000 units/i` regex matches. Match confirmed.
- The tube-feed warning advisory `weight-out-of-range` has `mode: 'both'`, so it would also fire in tube-feed mode at weight=60. The test stays in oral mode (default) for case 9, so this does not affect the assertion. Tube-feed mode is exercised separately (cases 6 + 7).

## Known Stubs

None. Both test files assert against live, fully-wired Phase 2 components.

## Threat Flags

None. Both files are test surfaces with no network endpoints, no auth paths, no schema-at-trust-boundary changes. They import the production Phase 2 components read-only.

## Ready for Wave 3

This plan closes Wave 2 of Phase 3 alongside Plan 03-02 (calc-layer parity tests). Wave 3 is the e2e + verification phase:

- Plan 03-04 (e2e/pert.spec.ts) ships happy-path Playwright tests at mobile 375 + desktop 1280 across both modes, mode-switch state preservation, favorites round-trip, localStorage round-trip, inputmode='decimal' regression guard.
- Phase verifier confirms `CI=1 pnpm exec playwright test pert-a11y` returns 4/4 (PERT-TEST-06 closure declared from Phase 1).
- Full Phase 3 gate: total vitest 378 + axe 4/4 + e2e new spec green.

## Self-Check: PASSED

- File exists: FOUND: src/lib/pert/PertCalculator.test.ts (139 lines)
- File exists: FOUND: src/lib/pert/PertInputs.test.ts (96 lines)
- Test count PertCalculator.test.ts: 10/10 green (FOUND)
- Test count PertInputs.test.ts: 7/7 green (FOUND)
- Full vitest 378/378 green across 40 files (FOUND)
- Phase-1-frozen tests still green: 17/17 (FOUND)
- svelte-check: 0/0 across 4584 files (FOUND)
- Em-dash + en-dash count across both files: 0 (FOUND)
- No other file modified: confirmed (FOUND)

(Per orchestrator instructions: STATE.md is NOT updated by this plan, ROADMAP.md is NOT updated by this plan. The two test files plus this SUMMARY are the only outputs.)
