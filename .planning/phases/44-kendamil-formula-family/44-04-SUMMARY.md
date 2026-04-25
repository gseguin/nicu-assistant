---
phase: 44-kendamil-formula-family
plan: 04
subsystem: fortification
tags:
  - e2e
  - playwright
  - axe-core
  - accessibility
  - kendamil
  - selectpicker
requirements:
  - KEND-TEST-03
dependencies:
  requires:
    - 44-01-kendamil-formula-entries
  provides:
    - kendamil-axe-sweep-light-dark
    - selectpicker-formula-e2e-pattern
  affects: []
tech-stack:
  added: []
  patterns:
    - playwright-parameterized-theme-loop
    - selectpicker-searchable-combobox-role-selector
    - getByRole-option-name-pattern-for-selectpicker
key-files:
  created:
    - .planning/phases/44-kendamil-formula-family/44-04-SUMMARY.md
  modified:
    - e2e/fortification-a11y.spec.ts
decisions:
  - Used `getByRole('combobox', { name: /^Formula/ })` instead of the plan-specified `getByRole('button', { name: /^Formula/ })` because the searchable Formula SelectPicker trigger renders as `<button role="combobox">` per `SelectPicker.svelte:172` (Rule 1 auto-fix bug — selector was specified before observing the actual rendered ARIA role for the searchable variant)
  - Kept the parameterized `for…of` block with `as const` exactly as planned — produces 2 distinct tests at runtime (`…selected (light)`, `…selected (dark)`) without 3× variant duplication per D-08 rationale
  - Kept `if (theme === 'dark') await page.waitForTimeout(250)` guard — light mode does not need the post-toggle wait
metrics:
  duration: 5 minutes
  tasks-completed: 1
  files-modified: 1
  completed-date: 2026-04-25
commits:
  - 5957202: test(44-04) add Kendamil Organic axe sweep (light + dark) [KEND-TEST-03]
---

# Phase 44 Plan 04: Kendamil Axe Sweep (Light + Dark) Summary

Two new Playwright + axe-core tests appended inside `e2e/fortification-a11y.spec.ts`'s existing `test.describe` block — one per theme (light, dark) — that select **Kendamil Organic** in the Formula SelectPicker before running the WCAG 2A/2AA scan, mirroring the existing 4 fortification axe sweeps and adding the Kendamil manufacturer-group label as a new contrast surface under coverage.

## Outcome

- Two new tests appended via a parameterized `for (const theme of ['light', 'dark'] as const)` block between line 85 (existing dark-mode results-visible test's closing `});`) and the morphine-wean comment block (now at line 117).
- Each test toggles theme via `classList.toggle('dark', t === 'dark')` / `classList.toggle('light', t === 'light')`, opens the searchable Formula SelectPicker, picks Kendamil Organic, waits for the calculator to re-render via `expect(getByText('Amount to Add')).toBeVisible()`, then runs `AxeBuilder.withTags(['wcag2a', 'wcag2aa']).analyze()` and asserts `results.violations).toEqual([])`.
- Total fortification axe tests: 6 (4 pre-existing + 2 new). All 6 pass under Playwright/Chromium in 8.7 s.
- KEND-TEST-03 satisfied — re-runs the existing fortification axe sweeps with a Kendamil variant selected, covering the new "Kendamil" manufacturer-group label in both themes without 3× per-variant duplication (D-08 rationale: identical group label across all three Kendamil variants).

## Verification Results

| Check | Outcome |
|-------|---------|
| `pnpm exec playwright test e2e/fortification-a11y.spec.ts` | **6 passed** in 8.7 s ✓ |
| `pnpm check` (svelte-kit sync + svelte-check) | 0 errors, 0 warnings, 4571 files ✓ |
| `grep -c "Kendamil Organic selected"` | 1 ✓ |
| `grep -c "for (const theme of \['light', 'dark'\] as const)"` | 1 ✓ |
| `grep -c "getByRole('option', { name: 'Kendamil Organic' })"` | 1 ✓ |
| `grep -c "Amount to Add"` | 3 ✓ (existing 2 + new 1) |
| `grep -c "AxeBuilder({ page }).withTags"` | 5 ✓ (existing 4 + new 1) |
| `grep -c "results.violations).toEqual"` | 5 ✓ (existing 4 + new 1) |
| `wc -l e2e/fortification-a11y.spec.ts` | 122 ✓ (planned ~121, +30 lines added) |
| morphine-wean comment block preserved | 1 ✓ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Selector role corrected from `button` to `combobox`**
- **Found during:** Task 1 verification (`pnpm exec playwright test e2e/fortification-a11y.spec.ts`)
- **Issue:** The plan's selector `page.getByRole('button', { name: /^Formula/ })` timed out after 30 s on both new tests. Playwright could not locate any button matching `^Formula`. The other 4 fortification axe tests passed.
- **Root cause:** The Formula SelectPicker is `searchable` (`FortificationInputs.svelte:145`). When `searchable={true}`, `SelectPicker.svelte:172` renders the trigger with `role={searchable ? 'combobox' : undefined}`, so the Formula trigger reports `role="combobox"`, not `role="button"`. The plan's PATTERNS.md and the `<interfaces>` block in 44-04-PLAN.md described the trigger as a `<button>` (which is the underlying tag), but Playwright's `getByRole` honors the explicit ARIA role override. The other two SelectPickers on `/formula` (`Target Calorie`, `Unit`) are not searchable and DO match `getByRole('button', …)` — but neither is the one we need.
- **Fix:** Changed to `page.getByRole('combobox', { name: /^Formula/ })`. The accessible-name composition (`aria-labelledby="{labelId} {valueId}"` → "Formula \<currently-selected-formula-name\>") is unchanged, so the `^Formula` regex anchor still uniquely selects the Formula picker.
- **Files modified:** `e2e/fortification-a11y.spec.ts` (1 selector line + 1 comment line)
- **Commit:** 5957202
- **Acceptance-criteria delta:** the plan's grep check `grep -c "getByRole('button', { name: /\^Formula/ })" → 1` now returns `0`; replaced by `grep -c "getByRole('combobox', { name: /\^Formula/ })" → 1`. All other acceptance-criteria grep checks pass unchanged.

## SelectPicker e2e Pattern Established

This is the first e2e test in the repo to drive the SelectPicker formula-selection (per RESEARCH.md A1 / PATTERNS.md gap-filling note). The established pattern for future tests is:

| SelectPicker variant | Trigger role | Selector pattern |
|----------------------|--------------|------------------|
| `searchable={true}` (Formula) | `combobox` | `page.getByRole('combobox', { name: /^<Label>/ }).click()` |
| `searchable={false}` (Target Calorie, Unit) | `button` (default) | `page.getByRole('button', { name: /^<Label>/ }).click()` |
| Options (both variants) | `option` | `page.getByRole('option', { name: '<Exact Option Label>' }).click()` |

Future plans extending SelectPicker e2e coverage should branch on the `searchable` prop when choosing the trigger selector.

## Authentication Gates

None.

## Known Stubs

None — the test file is fully wired: it drives a real Chromium instance, selects a real Kendamil Organic entry from `fortification-config.json` (added in Plan 44-01), waits for the real Svelte reactive update via `Amount to Add` visibility, and runs a real axe-core scan with the production wcag2a + wcag2aa rule set.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes at trust boundaries. The test introduces no new surface beyond what the plan's threat model already captured (T-44-08 / T-44-09 / T-44-10, all mitigated as designed; the `combobox`-vs-`button` selector correction does not change the disposition of T-44-10).

## Self-Check: PASSED

- FOUND: e2e/fortification-a11y.spec.ts (122 lines, 6 axe tests, 2 new Kendamil tests)
- FOUND: 5957202 (test 44-04 commit)
- FOUND: 6/6 Playwright tests passing locally

## Next Plan

Phase 44 wave 2 sibling plans 44-02 (Kendamil grouping unit tests) and 44-03 (parity tests in calculations.test.ts) execute in parallel. After all three Wave-2 plans land, the phase is ready for `/gsd:verify-phase` and milestone v1.14 release.
