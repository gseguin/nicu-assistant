---
phase: 38-ui-state-component-tests-route-e2e-a11y
plan: 01
subsystem: feeds-ui
tags: [feeds, calculator, ui, state, svelte]
dependency_graph:
  requires: [37-01]
  provides: [feeds-calculator-ui, feeds-state-module, feeds-route]
  affects: [about-content, feeds-config, feeds-types]
tech_stack:
  added: []
  patterns: [sessionStorage-backed-state-singleton, segmented-toggle-mode-switch, derived-calculations, string-number-bridge]
key_files:
  created:
    - src/lib/feeds/state.svelte.ts
    - src/lib/feeds/FeedAdvanceCalculator.svelte
  modified:
    - src/lib/feeds/types.ts
    - src/lib/feeds/feeds-config.json
    - src/routes/feeds/+page.svelte
    - src/lib/shared/about-content.ts
decisions:
  - TPN Line 2 always visible with 0/0 defaults (simpler than toggle)
  - kcal/oz SelectPicker uses $state string with bidirectional $effect sync to numeric state
metrics:
  duration: 264s
  completed: "2026-04-10T05:23:48Z"
---

# Phase 38 Plan 01: Feed Advance Calculator UI + State + Route Summary

Complete Feed Advance Calculator UI with sessionStorage-backed state, both bedside/full-nutrition modes, extended q2h/q6h frequency + safety advisories, and route wiring.

## What Was Done

### Task 1: Extend types + config + create state module
- Extended `TrophicFrequency` type from `'q3h' | 'q4h'` to `'q2h' | 'q3h' | 'q4h' | 'q6h'`
- Added q2h (12 feeds/day) and q6h (4 feeds/day) to `feeds-config.json` frequency dropdown
- Added 4 safety advisories: advance-high (>40), goal-high (>180), goal-low (<120), weight-elbw (<0.5kg)
- Created `state.svelte.ts` with `feedsState` singleton (init/persist/reset) mirroring GIR pattern exactly
- Default state uses `weightKg: null` for empty-state behavior

### Task 2: Build FeedAdvanceCalculator component + route + about-content
- Created `FeedAdvanceCalculator.svelte` (320+ lines) with:
  - SegmentedToggle for bedside/full-nutrition mode switching
  - Weight input shared above toggle (persists across mode switches)
  - **Bedside mode**: trophic/advance/goal NumericInputs, frequency + cadence SelectPickers, three equally-prominent output rows (ml/feed + ml/kg/d echo), computed total fluids, IV backfill rate with institutional disclaimer
  - **Full nutrition mode**: dual TPN line fieldsets (a11y), SMOF lipid, enteral volume/caloric density, hero kcal/kg/d output, 2x2 secondary grid (dextrose/lipid/enteral kcal + ml/kg)
  - Advisory banner rendering with AlertTriangle icons
  - Empty state messages when weight is blank
  - Math.floor on advance events per day (D-20 clinical safety)
  - $effect persistence to sessionStorage
- Updated route `+page.svelte` with calculator context, state init, and component import
- Updated `about-content.ts` with real description replacing "Coming soon" stub

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SelectPicker onchange prop does not exist**
- **Found during:** Task 2
- **Issue:** Plan specified `onchange` callback for kcal/oz SelectPicker, but the component only supports `bind:value`
- **Fix:** Used `$state` string variable with bidirectional `$effect` sync (string-to-number and number-to-string) instead of onchange callback
- **Files modified:** `src/lib/feeds/FeedAdvanceCalculator.svelte`
- **Commit:** 148b6d7

## Verification

- svelte-check: 0 errors, 0 warnings across 4504 files
- vitest: 215/215 tests passed (no regressions)

## Self-Check: PASSED

All 6 files verified present. Both commits (5d45b7c, 148b6d7) found. All 16 acceptance grep checks passed.
