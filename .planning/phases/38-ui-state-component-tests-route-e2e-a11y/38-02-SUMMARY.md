---
phase: 38-ui-state-component-tests-route-e2e-a11y
plan: 02
subsystem: feeds-tests
tags: [component-tests, e2e, a11y, playwright, vitest, axe-core]
dependency_graph:
  requires: [38-01]
  provides: [feeds-component-tests, feeds-e2e, feeds-a11y-sweeps]
  affects: []
tech_stack:
  added: []
  patterns: [viewport-loop-e2e, axe-core-multi-state-sweep, component-test-state-reset]
key_files:
  created:
    - src/lib/feeds/FeedAdvanceCalculator.test.ts
    - e2e/feeds.spec.ts
  modified:
    - e2e/feeds-a11y.spec.ts
decisions:
  - Used getAllByText for labels appearing in both input and output sections (Trophic, Goal)
  - Used exact match for kcal/kg/d unit text to avoid substring collision with TOTAL KCAL/KG/DAY heading
  - Used locator IDs (#feeds-dex1-pct, #feeds-ml1-hr) for TPN inputs to avoid label ambiguity across Line 1/Line 2 fieldsets
metrics:
  duration: 191s
  completed: "2026-04-10T05:29:29Z"
---

# Phase 38 Plan 02: Feed Advance Calculator Tests Summary

Component + E2E + axe-core a11y test suite for FeedAdvanceCalculator covering bedside/full-nutrition modes, advisory rendering, and WCAG 2.1 AA compliance across light/dark themes at mobile and desktop viewports.

## What Was Done

### Task 1: Component tests for FeedAdvanceCalculator (b2a9679)
Created `src/lib/feeds/FeedAdvanceCalculator.test.ts` with 13 test cases:
- Renders without crashing
- Empty-state message when weight is null (bedside + full-nutrition)
- Bedside outputs (Trophic, Advance step, Goal) with ml/feed units
- ml/kg/d echo on each output row (CORE-06)
- Total fluids rate in ml/hr
- Mode toggle switches to full nutrition via SegmentedToggle tab role
- Mode toggle preserves weight across mode switch
- Full nutrition hero displays TOTAL KCAL/KG/DAY with numeric value
- Advisory: trophic-exceeds-advance (SAFE-01)
- Advisory: dextrose >12.5% in full-nutrition mode (SAFE-05)
- Advisory: weight below 500g / ELBW (SAFE-03)
- IV backfill section renders when total fluids entered

All 13 vitest tests pass.

### Task 2: Playwright E2E happy-path + axe-core sweeps (82f54f8)

**e2e/feeds.spec.ts** -- 5 test cases x 2 viewports (mobile 375 + desktop 1280) = 10 test runs:
- Bedside mode: enter weight, verify three output rows visible
- Bedside mode: empty state when weight cleared
- Full nutrition mode: enter TPN inputs, verify hero kcal/kg/d visible
- Mode toggle preserves weight across switch
- inputmode="decimal" regression check

**e2e/feeds-a11y.spec.ts** -- 6 axe-core sweeps:
- Bedside light mode with outputs rendered
- Bedside dark mode with outputs rendered
- Full-nutrition light mode with hero rendered
- Full-nutrition dark mode with hero rendered
- Focus ring visible state
- Bedside with ELBW advisory rendered (light mode)

All 16 Playwright tests pass with zero axe violations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed getByText strict mode violations**
- **Found during:** Task 1 + Task 2
- **Issue:** `screen.getByText('Trophic')` and `screen.getByText('Goal')` matched both input labels and output headings; `page.getByText('kcal/kg/d')` matched both the heading and unit span
- **Fix:** Used `getAllByText` for dual-occurrence labels; used `{ exact: true }` for kcal/kg/d unit text; used element IDs for TPN inputs
- **Files modified:** src/lib/feeds/FeedAdvanceCalculator.test.ts, e2e/feeds.spec.ts
- **Commit:** b2a9679, 82f54f8

## Verification

- `npx vitest run src/lib/feeds/FeedAdvanceCalculator.test.ts` -- 13/13 passed
- `npx playwright test e2e/feeds.spec.ts e2e/feeds-a11y.spec.ts` -- 16/16 passed (5.1s)
- Zero axe-core violations across all 6 a11y sweeps

## Self-Check: PASSED

- [x] `src/lib/feeds/FeedAdvanceCalculator.test.ts` exists (13 test cases)
- [x] `e2e/feeds.spec.ts` exists (5 test cases x 2 viewports)
- [x] `e2e/feeds-a11y.spec.ts` updated (6 axe sweeps)
- [x] Commit b2a9679 exists
- [x] Commit 82f54f8 exists
