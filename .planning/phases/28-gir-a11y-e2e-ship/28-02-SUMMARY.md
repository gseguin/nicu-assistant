---
phase: 28-gir-a11y-e2e-ship
plan: 02
subsystem: gir
tags: [wave-2, tests, e2e, a11y, keyboard]
dependency_graph:
  requires: ["28-01"]
  provides:
    - "Full keyboard matrix coverage for GlucoseTitrationGrid"
    - "GirCalculator valid-flow, bucket-propagation, and GIR<4/GIR>12 advisory coverage"
    - "GIR happy-path E2E at mobile 375 and desktop 1280 with inputmode regression"
  affects:
    - src/lib/gir/GlucoseTitrationGrid.test.ts
    - src/lib/gir/GirCalculator.test.ts
    - e2e/gir.spec.ts
tech-stack:
  added: []
  patterns:
    - "test.use({ viewport }) scoped to a single spec file for mobile+desktop parity"
requirements: [TEST-02, TEST-04, TEST-06]
key-files:
  created:
    - e2e/gir.spec.ts
  modified:
    - src/lib/gir/GlucoseTitrationGrid.test.ts
    - src/lib/gir/GirCalculator.test.ts
decisions:
  - "Used getByText('TARGET GIR', { exact: true }) to disambiguate from the desktop grid header 'Target GIR' column (strict-mode violation discovered during test run)."
metrics:
  duration_minutes: ~5
  completed: 2026-04-09
---

# Phase 28 Plan 02: GIR Test Coverage Summary

Closed the component and E2E coverage gaps for the GIR subsystem: full keyboard matrix on the titration grid, valid-flow + bucket-propagation + high/low advisory coverage on GirCalculator, and a mobile+desktop Playwright happy-path spec that also asserts `inputmode="decimal"` on all three numeric inputs.

## Tasks Executed

### Task 1 — GlucoseTitrationGrid keyboard matrix (TEST-02)
- **File:** `src/lib/gir/GlucoseTitrationGrid.test.ts`
- **Added tests (5):**
  - `ArrowUp moves selection backward (wraps to end from first)` → expects `gt70`
  - `ArrowRight advances selection (same as ArrowDown)` → expects `lt40`
  - `ArrowLeft moves selection backward (same as ArrowUp)` → expects `severe-neuro`
  - `Space selects the focused row without moving` → expects `40-50`
  - `Enter selects the focused row without moving` → expects `40-50`
- **Result:** 16/16 tests passing (`pnpm test:run src/lib/gir/GlucoseTitrationGrid.test.ts`)
- **Commit:** `df7b470`

### Task 2 — GirCalculator valid-flow + advisories (TEST-02)
- **File:** `src/lib/gir/GirCalculator.test.ts`
- **Added import:** `fireEvent` from `@testing-library/svelte`
- **Added tests (4):**
  - `valid inputs render non-null Current GIR and Initial rate numbers`
  - `selecting a bucket updates target-guidance hero` → asserts `TARGET GIR` visible after click on radios[2]
  - `GIR >12 advisory surfaces when computed GIR is high` (w=1, dex=20, fluid=150)
  - `GIR <4 advisory surfaces when computed GIR is low` (w=3.1, dex=5, fluid=40)
- **Result:** 11/11 tests passing (`pnpm test:run src/lib/gir/GirCalculator.test.ts`)
- **Commit:** `8c866b1`

### Task 3 — e2e/gir.spec.ts (TEST-04, TEST-06)
- **File:** `e2e/gir.spec.ts` (new)
- **Structure:** Option B pattern — `for` loop over mobile 375×667 and desktop 1280×800, each `describe` uses `test.use({ viewport })`.
- **Tests (3 per viewport × 2 = 6 cases):**
  1. `enter inputs → current hero updates → select bucket → target hero updates` — fills Weight=3.1, Dextrose=12.5, Fluid order=80; asserts `CURRENT GIR`, `mg/kg/min`, exactly 6 radios, click first radio, assert `TARGET GIR` (exact match).
  2. `empty-state hero renders when inputs null` — clears all three inputs, asserts `Enter weight, dextrose %, and fluid rate` text.
  3. `all three NumericInputs have inputmode="decimal"`.
- **Radio count:** Flat `6` at both viewports, per Wave 0 empirical measurement (28-01-SUMMARY.md).
- **Labels used (verified against `GirCalculator.svelte`):** `Weight`, `Dextrose`, `Fluid order`.
- **Result:** 6/6 tests passing (`pnpm exec playwright test e2e/gir.spec.ts`)
- **Commit:** `4478afa`

## Verification

| Command | Result |
|---|---|
| `pnpm test:run src/lib/gir/GlucoseTitrationGrid.test.ts` | 16 passed |
| `pnpm test:run src/lib/gir/GirCalculator.test.ts` | 11 passed |
| `pnpm exec playwright test e2e/gir.spec.ts` | 6 passed |
| `grep -E "ArrowUp\|ArrowLeft\|ArrowRight\|Enter\|' '" src/lib/gir/GlucoseTitrationGrid.test.ts` | matches |
| `grep -E "TARGET GIR\|hyperinsulinism\|Below basal" src/lib/gir/GirCalculator.test.ts` | matches |
| `grep -E "inputmode\|decimal\|'3\.1'\|'12\.5'\|'80'" e2e/gir.spec.ts` | matches |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `getByText('TARGET GIR')` strict-mode violation on desktop**
- **Found during:** Task 3 verification
- **Issue:** Desktop grid renders a column header `<div>Target GIR</div>` (from `GlucoseTitrationGrid.svelte` line 153). Playwright's `getByText` does a case-insensitive substring match by default, so `'TARGET GIR'` matched both the hero's uppercase text and the header's `'Target GIR'` cell, producing a strict-mode violation.
- **Fix:** Used `getByText('TARGET GIR', { exact: true })` so only the uppercase hero label (`text-2xs ... uppercase`) matches.
- **Files modified:** `e2e/gir.spec.ts`
- **Commit:** folded into `4478afa`

Otherwise the plan executed verbatim from the RESEARCH.md patterns. Bucket IDs matched the research doc's guesses (`severe-neuro`/`lt40`/`40-50`/`gt70`), so no string corrections were needed in Task 1.

## Self-Check: PASSED

- `src/lib/gir/GlucoseTitrationGrid.test.ts` — contains `ArrowUp`, `ArrowRight`, `ArrowLeft`, `Enter`, `' '` — FOUND
- `src/lib/gir/GirCalculator.test.ts` — contains `TARGET GIR`, `hyperinsulinism`, `Below basal` — FOUND
- `e2e/gir.spec.ts` — contains `inputmode`, `decimal`, `'3.1'`, `'12.5'`, `'80'` — FOUND
- Commit `df7b470` — FOUND
- Commit `8c866b1` — FOUND
- Commit `4478afa` — FOUND
- All vitest + playwright runs green
