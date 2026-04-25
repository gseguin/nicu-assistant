---
phase: 3
plan: 1
workstream: pert
subsystem: pert
tags: [pert, tests, fixtures, parity, xlsx]
requires:
  - epi-pert-calculator.xlsx (Pediatric tabs; live read at planning time, not at runtime)
  - CONTEXT D-04 (cell mapping ground truth)
  - CONTEXT D-05 (row 0 anchors)
  - CONTEXT D-06 (fixture authoring methodology, derivation lock)
  - CONTEXT D-08 (STOP-red trigger)
  - CONTEXT D-15 (oral xlsx-canonical formula)
  - CONTEXT D-16 (tube xlsx-canonical formula)
  - CONTEXT D-12 (capsulesPerMonth = capsulesPerDay times 30)
  - CONTEXT D-02 (Math.round half-away-from-zero)
  - RESEARCH §Code Examples C (verbatim 27-row matrix + stopRedTrigger row)
provides:
  - 28 hand-derived xlsx-parity fixture rows (9 oral + 18 tube-feed + 1 stopRedTrigger)
  - Derivation-locked authority for Plan 03-02 calc-layer parity tests
  - Top-level _comment + _cellRefs naming xlsx cells (oral B5..B11; tube B6..B15)
  - Per-row _derivation strings showing the math hand-applied per row
affects:
  - src/lib/pert/calculations.test.ts (Plan 03-02 will import this fixture file)
tech-stack:
  added: []
  patterns:
    - "Mirrors src/lib/feeds/feeds-parity.fixtures.json shape exactly: top-level _comment + _cellRefs + per-named-key {input, expected, _derivation}."
    - "ASCII-only strings throughout (no em-dash, no en-dash); 'times' word substitutes for any multiplication symbol in _comment."
    - "lipasePerKg expected values are UNROUNDED per Q4 default (matches calc-layer return form)."
key-files:
  created:
    - src/lib/pert/pert-parity.fixtures.json
  modified: []
decisions:
  - "Used Q4 default: lipasePerKg fixture values are UNROUNDED (calc-layer return), no _xlsxB13Rounded sibling field."
  - "Used Q5 default: dedicated stopRedTrigger row (not a matrix row that incidentally triggers) is the named STOP-red advisory fixture."
  - "Used Q6 default: no tube-feed-specific stopRedTriggerTubeFeed row; matrix rows 0/4/6/7/8/10/11 incidentally trigger STOP-red and that natural coverage is sufficient."
metrics:
  duration: 6 minutes
  completed: 2026-04-25
---

# Phase 3 Plan 1: pert-parity.fixtures.json Summary

**One-liner:** 28 hand-derived xlsx-parity fixture rows for the PERT calculator (9 oral + 18 tube-feed + 1 dedicated stopRedTrigger), derivation-locked per CONTEXT D-06 to keep parity tests independent of calculations.ts.

## What Shipped

- `src/lib/pert/pert-parity.fixtures.json` (NEW, 152 lines) containing:
  - `_comment`: derivation-lock notice citing D-15 + D-16 + D-12 + D-02 + the literal "NEVER edit to match code changes" phrase, em-dash-free.
  - `_cellRefs.oral`: cites `Pediatric PERT Tool!B5..B11` and explicitly names `B10=ROUND(B9/B8,0) capsulesPerDose` (NOT B11) per CONTEXT D-04.
  - `_cellRefs.tubeFeed`: cites `Pediatric Tube Feed PERT!B6..B15` and explicitly names `B14=ROUND(B12/B11,0) capsulesPerDay` and `B15=B14*30 capsulesPerMonth` (NOT B13/B14) per CONTEXT D-04.
  - `oral` object: 9 rows keyed `row0_xlsx_default` through `row8`. Row 0 reproduces xlsx default verbatim (weight=10, fat=25, lipasePerG=2000, Creon 12000 -> capsulesPerDose=4, totalLipase=50000, lipasePerDose=48000, estimatedDailyTotal=12).
  - `tubeFeed` object: 18 rows keyed `row0_xlsx_default` through `row17`. Row 0 reproduces xlsx default verbatim (weight=15, formulaId=`kate-farms-ped-std-12` with fatGPerL=48 NOT 40, volume=1500, lipasePerG=2500, Pancreaze 37000 -> capsulesPerDay=5, capsulesPerMonth=150, lipasePerKg=12000.0 unrounded, totalFatG=72.0).
  - `stopRedTrigger` row at top level: `_mode='oral'`, weight=2, fat=50, lipasePerG=4000, Creon 6000 -> capsulesPerDose=33, stopRedTriggers=true, daily lipase 594000 vs cap 20000 fires the advisory per D-08.
  - Every row carries `input` + `expected` + `_derivation` keys; `_derivation` strings are verbatim from RESEARCH §Code Examples C (lines 499-507 oral, 536-553 tube, 561 stopRed).

## Row 0 Anchor Verification (CONTEXT D-05)

| Anchor | Expected | Fixture Value | Match |
|---|---|---|---|
| `oral.row0_xlsx_default.expected.capsulesPerDose` | 4 | 4 | yes |
| `oral.row0_xlsx_default.expected.totalLipase` | 50000 | 50000 | yes |
| `oral.row0_xlsx_default.expected.lipasePerDose` | 48000 | 48000 | yes |
| `oral.row0_xlsx_default.expected.estimatedDailyTotal` | 12 | 12 | yes |
| `tubeFeed.row0_xlsx_default.expected.capsulesPerDay` | 5 | 5 | yes |
| `tubeFeed.row0_xlsx_default.expected.capsulesPerMonth` | 150 | 150 | yes |
| `tubeFeed.row0_xlsx_default.expected.totalFatG` | 72.0 | 72.0 | yes |
| `tubeFeed.row0_xlsx_default.expected.lipasePerKg` (unrounded per Q4) | 12000.0 | 12000.0 | yes |
| `tubeFeed.row0_xlsx_default.input.formulaId` | "kate-farms-ped-std-12" | "kate-farms-ped-std-12" | yes |

## Independent Re-derivation Cross-check

Beyond the manual transcription from RESEARCH §Code Examples C, an independent JS re-derivation (re-applying D-15 oral / D-16 tube / D-02 Math.round half-away / D-12 capsulesPerMonth times 30 to each `input`) was run against every row's `expected`. All 9 oral + 18 tube + 1 stopRed rows produced exact matches on `totalLipase`, `capsulesPerDose`/`capsulesPerDay`, `lipasePerDose`, `estimatedDailyTotal`, `totalFatG`, `capsulesPerMonth`, and `lipasePerKg` (within 0.001 tolerance for the .333/.667 truncated values). No discrepancies found between RESEARCH §C and the fixture file.

This is consistency cross-check, not the primary derivation source. Per D-06, the math executed by hand at planning time inside RESEARCH §C is the derivation authority; the runtime cross-check proves transcription fidelity.

## Acceptance Criteria

| Criterion | Status |
|---|---|
| File `src/lib/pert/pert-parity.fixtures.json` exists and is valid JSON | green |
| `oral` has exactly 9 rows | green (9) |
| `tubeFeed` has exactly 18 rows | green (18) |
| `stopRedTrigger` exists at top level | green |
| `oral.row0_xlsx_default.expected.capsulesPerDose === 4` | green |
| `tubeFeed.row0_xlsx_default.expected.capsulesPerDay === 5` and `capsulesPerMonth === 150` | green |
| `tubeFeed.row0_xlsx_default.input.formulaId === "kate-farms-ped-std-12"` | green |
| `stopRedTrigger.expected.capsulesPerDose === 33` and `stopRedTriggers === true` | green |
| `_cellRefs.oral` mentions `B10` | green |
| `_cellRefs.tubeFeed` mentions `B14` AND `B15` | green |
| em-dash count in fixture file (U+2014) returns 0 | green (0) |
| en-dash count in fixture file (U+2013) returns 0 | green (0) |
| `_comment` contains "NEVER edit" | green |
| `pnpm test:run src/lib/pert/config.test.ts src/lib/pert/state.test.ts` passes 17/17 | green (11 + 6 = 17) |
| `pnpm check` returns 0 errors / 0 warnings across 4582 files | green |
| `git diff --name-only` shows only `src/lib/pert/pert-parity.fixtures.json` | green |

## Verification Results

```
node JSON.parse: valid JSON; top-level keys: _comment,_cellRefs,oral,tubeFeed,stopRedTrigger
shape OK
oral=9 tube=18
row 0 anchors OK
stopRedTrigger OK
cellRefs OK (oral has B10; tube has B14 + B15)
em-dash count: 0
en-dash count: 0
NEVER edit phrase count: 1
pnpm test:run pert/config.test.ts pert/state.test.ts: 17 passed (11 config + 6 state)
pnpm check: COMPLETED 4582 FILES 0 ERRORS 0 WARNINGS
git status --short: ?? src/lib/pert/pert-parity.fixtures.json (no other file modified)
Independent re-derivation: ALL 28 ROWS HAND-VERIFIED OK
```

## Deviations from Plan

None. The plan executed exactly as written. RESEARCH §Code Examples C verbatim _derivation strings copied without modification (none contained em-dashes or en-dashes; ASCII-only as authored).

## Known Stubs

None. This plan ships data only (no rendering surface, no UI). The fixture file's `expected` blocks are concrete numeric values, not placeholders.

## Threat Flags

None. JSON data file with no network surface, no auth path, no schema-at-trust-boundary changes.

## Ready for Wave 2

This plan is the Wave 1 prerequisite. Plans 03-02 (calc-layer parity tests) and 03-03 (component tests) can now run in parallel:

- Plan 03-02 imports the fixture via `import fixtures from './pert-parity.fixtures.json'` and iterates `fixtures.oral` + `fixtures.tubeFeed` through `computeOralResult` / `computeTubeFeedResult`, asserting via `closeEnough` (D-02 epsilon contract).
- Plan 03-02 references `fixtures.stopRedTrigger` for the dedicated STOP-red advisory test in `getTriggeredAdvisories`.
- Plan 03-03 (component tests) does NOT depend on this fixture (uses pertState mutation directly), but can read row 0 anchors from this file for documentation parity.

## Self-Check: PASSED

- File exists: FOUND: src/lib/pert/pert-parity.fixtures.json (152 lines)
- JSON valid: FOUND
- Row counts: 9 oral + 18 tube + 1 stopRedTrigger = 28 (FOUND)
- Em-dash + en-dash count: 0 (FOUND)
- Phase-1-frozen tests still green: 17/17 (FOUND)
- svelte-check: 0/0 (FOUND)
- No other file modified: confirmed (FOUND)

(Per orchestrator instructions: STATE.md is NOT updated by this plan, ROADMAP.md is NOT updated by this plan. The fixture commit is the only output.)
