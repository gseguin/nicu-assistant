---
phase: 37-pure-logic-config-parity-tests
plan: 01
subsystem: feeds-calculator
tags: [types, config, calculations, pure-functions]
dependency_graph:
  requires: [shared/types.ts]
  provides: [feeds/types.ts, feeds/feeds-config.json, feeds/feeds-config.ts, feeds/calculations.ts]
  affects: [37-02 parity tests, phase-38 UI]
tech_stack:
  added: []
  patterns: [json-config-with-typed-wrapper, named-constants, data-driven-advisories]
key_files:
  created:
    - src/lib/feeds/types.ts
    - src/lib/feeds/feeds-config.json
    - src/lib/feeds/feeds-config.ts
    - src/lib/feeds/calculations.ts
  modified: []
decisions:
  - "Dual TPN dextrose fields (tpnDex1Pct/tpnMl1Hr + tpnDex2Pct/tpnMl2Hr) instead of array per D-03"
  - "CadenceOption uses relative/absolute type discriminator for feedsPerDay vs fixed divisor per D-05"
  - "Advisory thresholds are data-driven from config JSON, not hardcoded in calculation functions per D-09"
  - "ML_PER_OZ = 30 matching xlsx convention, not scientific 29.5735"
metrics:
  duration: 149s
  completed: 2026-04-10T04:49:10Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 37 Plan 01: Feeds Types, Config, and Pure Calculations Summary

Typed contracts, clinical configuration, and all pure calculation functions for the Feed Advance calculator -- parameterized bedside advancement with dual-line TPN dextrose and data-driven advisories.

## What Was Built

### types.ts
Complete type system for the feeds calculator: `FeedsMode` (bedside/full-nutrition), `FeedsStateData` with explicit dual TPN line fields, `BedsideResult` and `FullNutritionResult` output interfaces, `Advisory`/`TriggeredAdvisory` for threshold checking, `FrequencyOption` and `CadenceOption` with relative/absolute discriminator.

### feeds-config.json
Clinical configuration with defaults (1.94kg, q3h, bid), input ranges for all numeric fields, frequency dropdown (q3h/q4h), cadence dropdown (every/every-other/every-3rd/bid/qd), and 5 advisory thresholds (trophic-exceeds-advance, dextrose-high-line1, dextrose-high-line2, total-kcal-high, total-kcal-low).

### feeds-config.ts
Typed wrapper over JSON config exporting `defaults`, `inputs`, `frequencyOptions`, `cadenceOptions`, `advisories` plus helper functions `getFrequencyById`, `getCadenceById`, and `resolveAdvanceEventsPerDay`.

### calculations.ts
All pure functions with named constants (DEXTROSE_KCAL_PER_GRAM=3.4, LIPID_KCAL_PER_ML=2, ML_PER_OZ=30, HOURS_PER_DAY=24). Bedside: trophic/advance/goal ml-per-feed with parameterized frequency and cadence. Full nutrition: dual-line dextrose kcal, lipid kcal, enteral kcal, total kcal/kg/day. Advisory checker with cross-field comparison support.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 3dd699d | types.ts, feeds-config.json, feeds-config.ts |
| 2 | d1bd31d | calculations.ts with all pure functions |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `pnpm check`: 0 errors, 0 warnings (4527 files checked)
- No inline magic numbers in formula bodies (all use named constants)
- Dual TPN dextrose fields present in types and calculations
- All imports resolve correctly across the 4 new files

## Self-Check: PASSED

- All 4 created files exist on disk
- Both task commits (3dd699d, d1bd31d) verified in git log
