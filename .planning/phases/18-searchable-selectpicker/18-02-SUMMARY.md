---
phase: 18
plan: 02
subsystem: shared-components
tags: [searchable, selectpicker, fortification, a11y]
requires: [18-01]
provides:
  - "Live searchable Formula picker in FortificationCalculator"
  - "Component test coverage T-12..T-18 for SEARCH-01..06 + A11Y-03"
key-files:
  modified:
    - src/lib/fortification/FortificationCalculator.svelte
    - src/lib/fortification/FortificationCalculator.test.ts
    - src/lib/shared/components/SelectPicker.test.ts
decisions:
  - "Updated FortificationCalculator.test.ts helper getSelectTrigger to use getByLabelText (Rule 1: trigger now exposes role=combobox when searchable, breaking the previous getByRole('button') match)"
metrics:
  duration: "~3min"
  tasks: 2
  files: 3
---

# Phase 18 Plan 02: Wire Formula Picker + Searchable Tests Summary

Wired Formula picker with `searchable` and added 7 component tests (T-12..T-18) covering SEARCH-01..06 + A11Y-03; full suite green at 124/124.

## Tasks

- **Task 1** (f2e5861): Added `searchable` to the Formula `<SelectPicker>` at FortificationCalculator.svelte:166. Other 3 pickers (Base, Target Calorie, Unit) untouched. Updated test helper.
- **Task 2** (1171cff): Appended `searchableOptions` fixture and `describe('SelectPicker searchable mode')` block with T-12..T-18 to SelectPicker.test.ts.

## Verification

- `pnpm vitest run src/lib/shared/components/SelectPicker.test.ts` → 18/18
- `pnpm vitest run src/lib/fortification/FortificationCalculator.test.ts` → 8/8
- `pnpm vitest run` → 124/124 across 11 files

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed FortificationCalculator test helper after combobox role**
- **Found during:** Task 1 verification
- **Issue:** Adding `searchable` causes the trigger to render `role="combobox"` (per 18-01 conditional ARIA), so `screen.getByRole('button', { name: 'Formula' })` no longer found it. UI-01 failed.
- **Fix:** Updated `getSelectTrigger` helper in FortificationCalculator.test.ts to use `screen.getByLabelText(label)`, which is role-agnostic and matches the trigger via `aria-labelledby`.
- **Files modified:** src/lib/fortification/FortificationCalculator.test.ts
- **Commit:** f2e5861

## Self-Check: PASSED

- src/lib/fortification/FortificationCalculator.svelte — FOUND (searchable wired on Formula picker only)
- src/lib/shared/components/SelectPicker.test.ts — FOUND (T-12..T-18 added)
- src/lib/fortification/FortificationCalculator.test.ts — FOUND (helper fix)
- f2e5861 — FOUND
- 1171cff — FOUND
