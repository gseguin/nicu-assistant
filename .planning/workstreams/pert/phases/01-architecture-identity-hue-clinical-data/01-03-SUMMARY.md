---
phase: 1
plan: 03
title: "Wave 1 — Clinical config: types, JSON, typed wrapper, FDA allowlist filter"
workstream: pert
wave: 1
requirements:
  - PERT-DATA-01
  - PERT-DATA-02
  - PERT-DATA-03
  - PERT-ARCH-04
files_modified:
  - src/lib/pert/types.ts
  - src/lib/pert/pert-config.json
  - src/lib/pert/config.ts
  - src/lib/pert/config.test.ts
files_modified_deviations: []
verification:
  svelte-check: "0 errors / 0 warnings (4575 files)"
  vitest-config: "11 / 11 passed"
  vitest-full: "355 / 355 passed (37 test files)"
  hostile-injection-gate: "verified — injected Pertzye=2.0 into both strengths and fdaAllowlist; CI fails (2 tests fail); reverted"
  config-counts: "{ meds: 5, formulas: 17, advisories: 4 }"
status: complete
commit: f7683bd
---

# Phase 1 Plan 01-03: Clinical Config — Summary

## One-Liner

Lands the `src/lib/pert/` clinical-data spine: TypeScript types (`PertMode`, `PertStateData` with mode-split oral/tube-feed sub-objects per D-10, `Medication`, `Formula`, `Advisory` with `severity:'stop'`), the `pert-config.json` with 5 FDA-allowlisted medications + 17 pediatric formulas (fat g/L sourced from `epi-pert-calculator-pediatric-updated.xlsx` Pediatric Tube Feed PERT tab) + lipase rates `[500/1000/2000/4000]` + 4 advisories including the STOP-red `max-lipase-cap` for the v1.13 carve-out, the typed `config.ts` wrapper that filters per-medication strengths against `fdaAllowlist` at module load (defense-in-depth against future JSON drift), and an 11-test shape suite that fails CI if a non-allowlisted strength sneaks in.

## Objective Recap

Land the clinical-data foundation Phase 2 will compile against — types, JSON, typed wrapper with an FDA-allowlist runtime filter, and a shape test that fails CI if `Pertzye=2.0` or any sub-1000 strength reaches the loaded config. Plan does NOT yet wire calculator math, the route shell, the `<PertCalculator />` component, the `pertState` singleton, the AboutSheet entry, or the SegmentedToggle (those are 01-04, 01-05, and Phase 2 territory). This plan is parallel to 01-02 (identity hue) — different files, both depend on Wave-0 (01-01).

## Tasks Executed

| Task     | Title                                                                          | Status   |
| -------- | ------------------------------------------------------------------------------ | -------- |
| 01-03-01 | Create src/lib/pert/types.ts                                                   | Complete |
| 01-03-02 | Create src/lib/pert/pert-config.json with FDA-allowlisted meds + 17 pediatric formulas | Complete |
| 01-03-03 | Create src/lib/pert/config.ts typed wrapper with FDA-allowlist filter          | Complete |
| 01-03-04 | Create src/lib/pert/config.test.ts shape test                                  | Complete |

All per-task `<acceptance_criteria>` PASSED before moving to the next task.

## Files Created

### `src/lib/pert/types.ts` (NEW, 12 export lines)

12 exports: `PertMode`, `PertOralInputs`, `PertTubeFeedInputs`, `PertStateData`, `PertOralResult`, `PertTubeFeedResult`, `PertInputRanges`, `Medication`, `Formula`, `AdvisorySeverity`, `Advisory`, `ValidationMessages`. Verbatim per the plan's `<action>` block. Imports `NumericInputRange` from `$lib/shared/types.js`. `PertStateData` carries the D-10 mode-split shape (shared keys `weightKg`/`medicationId`/`strengthValue` at root; mode-specific `oral`/`tubeFeed` sub-objects). `Advisory.severity` is `'warning' | 'stop'` so the `max-lipase-cap` carries the STOP-red carve-out signal cleanly into Phase 2.

### `src/lib/pert/pert-config.json` (NEW, 5751 bytes)

- **defaults**: `mode: 'oral'`, `weightKg: 3.0` (matches CONTEXT D-11/D-12 + 5-calculator convention), `medicationId/strengthValue/oral.fatGrams/tubeFeed.formulaId/tubeFeed.volumePerDayMl: null` (first-run empty-state per PERT-SAFE-04). `oral.lipasePerKgPerMeal` and `tubeFeed.lipasePerKgPerDay` default to 1000 units/kg (mid-pediatric clinical default).
- **inputs**: 5 numeric ranges (weightKg 0.3–80, fatGrams 0–200, volumePerDayMl 0–3000, lipasePerKg* 500–4000).
- **dropdowns.medications**: 5 entries, all FDA-allowlisted strengths only (Creon 5; Zenpep 8; Pancreaze 6; Pertzye 4; Viokace 2 — strengths total = 25). Each has `source.url` pointing to DailyMed `setid` and `source.nda` (per CONTEXT D-24's secondary-citation convention).
- **dropdowns.formulas**: 17 entries with the IDs from the plan's draft (alphabetical-by-name happens at the SelectPicker level per D-06; the JSON preserves draft order). `fatGPerL` values sourced from xlsx `Pediatric Tube Feed PERT` tab column G — see Deviations below.
- **dropdowns.lipaseRates**: `[500, 1000, 2000, 4000]` per xlsx Pediatric PERT Tool E31–E34 + reference clinical-config.json.
- **advisories**: 4 entries. `max-lipase-cap` (`severity: 'stop'`, `mode: 'both'`) is the v1.13 STOP-red trigger. The other 3 are range warnings (weight, fat, volume).
- **validationMessages**: 6 strings (empty oral / empty tube-feed / invalid weight / invalid fat / invalid volume / invalid lipase rate). Per CONTEXT "Claude's Discretion" the exact phrasing is intentionally minimal here; final empty-state copy unification lands in Phase 2.
- **fdaAllowlist**: per-medication number arrays. Source-of-truth for the runtime filter in `config.ts`. Mirrors the per-medication `strengths` arrays exactly — duplicated by design per the plan's "Critical notes for the executor" so a future contributor inadvertently adding `Pertzye=2.0` to one but not both still gets filtered out at load.

### `src/lib/pert/config.ts` (NEW, 1427 bytes)

Typed wrapper following the `feeds-config.ts` pattern. Loads the JSON, applies `filterStrengthsByAllowlist` to every medication (drops any per-med strength not in `fdaAllowlist`), then drops any medication that ends up with zero strengths. Exports: `defaults`, `inputs`, `medications`, `formulas`, `lipaseRates`, `advisories`, `validationMessages`, plus 3 accessors (`getMedicationById`, `getFormulaById`, `getStrengthsForMedication`). The accessors all delegate to the post-filter `medications`/`formulas` arrays so consumers can never receive a non-allowlisted strength.

### `src/lib/pert/config.test.ts` (NEW, 11 tests passing)

8 shape tests (5-meds-allowlisted, 17-formulas-shape, lipaseRates exact, 4-advisories with max-lipase-cap STOP, hostile-injection filter, defaults shape, input-range shape, validation messages) + 3 accessor tests (`getMedicationById`, `getFormulaById`, `getStrengthsForMedication`). The hostile-injection test (`it('drops Pertzye=2.0...')`) recreates an attacker-shaped `pertzye` med with strengths `[2.0, 800, 4000, 8000]` and runs it through the same allowlist Set the loader uses; asserts `[4000, 8000]` and absence of `2.0`/`800`. Combined with the per-strength `s >= 1000` invariant in the first test, any future contributor accidentally adding `Pertzye=2.0` to JSON+allowlist gets caught by CI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] FDA strength lists in plan draft missing 2 valid pediatric strengths**

- **Found during:** Task 01-03-02, while cross-referencing the plan's draft strengths (lines 192–218 of 01-03-PLAN.md) against the xlsx Pediatric PERT Tool sheet (`/home/ghislain/src/pert-calculator/pert-calculator-pediatric-updated.xlsx`, columns E + F rows 4–28) AND the reference app's `clinical-config.json` (`/home/ghislain/src/pert-calculator/src/lib/clinical-config.json`).
- **Issue:** Plan draft listed `zenpep: [3000, 5000, 10000, 15000, 20000, 25000, 40000]` and `pancreaze: [2600, 4200, 10500, 16800, 21000]`. Both the xlsx (parity authority per CONTEXT canonical_refs) and the reference clinical-config.json (verified 2026-04-02) include two additional FDA-approved strengths: `Zenpep 60000` (NDA 022210) and `Pancreaze 37000` (NDA 022523). Both are well above the sub-1000 floor and are unambiguously legitimate pediatric strengths.
- **Plan-authorized fix:** The plan's own `<action>` block (line 303) anticipates this exact scenario: *"If your reading of the xlsx contradicts a strength listed above (e.g., a strength is missing from FDA's actual listing), update both the per-medication `strengths` AND the `fdaAllowlist` to match the FDA source — DO NOT trust this plan's hand-drafted numbers blindly."* The orchestrator's hard constraint (#6) reinforces: "Source of truth for medication strengths is the FDA labeling list embedded in CONTEXT.md / xlsx".
- **Fix:** Added `60000` to Zenpep `strengths` + `fdaAllowlist.zenpep`; added `37000` to Pancreaze `strengths` + `fdaAllowlist.pancreaze`. Total medication-strength count increased from plan-draft 23 to 25.
- **Files modified:** `src/lib/pert/pert-config.json`.
- **CI gate impact:** All 11 shape tests still pass; the `s >= 1000` invariant still holds (60000 and 37000 are well above 1000); the hostile-injection test still fails CI when `Pertzye=2.0` is injected.

**2. [Rule 1 — Bug] Pediatric-formula fatGPerL in plan draft contradicted xlsx for 11 of 17 entries**

- **Found during:** Task 01-03-02, while cross-referencing the plan's draft formula `fatGPerL` values (lines 220–238 of 01-03-PLAN.md) against the xlsx `Pediatric Tube Feed PERT` tab columns F + G + I rows 4–20.
- **Issue:** Plan draft and xlsx disagreed on 11 of 17 formulas. Six matched (EleCare Jr 47, PediaSure Enteral 38, PediaSure Grow & Gain 38, Peptamen Junior 38, Peptamen Junior Fiber 38, Compleat Pediatric was actually 38 not 39); 11 did not. CONTEXT.md canonical_refs identifies the xlsx as *"the parity authority for this app"*. Phase 3 spreadsheet-parity tests will compare engine output against xlsx fixtures — shipping the wrong fat g/L would propagate divergence into every parity test downstream.
- **Plan-authorized fix:** The plan's `<read_first>` for task 01-03-02 explicitly directs to *"epi-pert-calculator.xlsx (data source — columns D/E/L for medications; H/I for formulas)"*; the plan's `<action>` line 303 escape clause covers strengths but not fat g/L explicitly — however, the same principle applies (xlsx is parity authority; ship correct data). The orchestrator's hard constraint #6 mirrors this: "If a value is uncertain, log a deviation and STOP rather than ship wrong clinical data" — these values were not uncertain (xlsx is unambiguous), so I corrected them inline and logged the deviation here.
- **Fix:** Used xlsx column G fatGPerL verbatim for all 17 formulas. The 11 corrected values:

  | Formula | Plan draft | xlsx (used) |
  |---------|-----------:|------------:|
  | Alfamino Junior | 36 | **44** |
  | Compleat Pediatric | 39 | **38** |
  | Compleat Pediatric Organic Blends | 41 | **53** |
  | Equacare Jr | 35 | **45** |
  | Kate Farms Pediatric Peptide 1.5 | 56 | **68** |
  | Kate Farms Pediatric Standard 1.2 | 40 | **48** |
  | Neocate Junior | 35 | **50** |
  | Nutren Junior | 42 | **48** |
  | Nutren Junior Fiber | 42 | **48** |
  | PediaSure Peptide 1.0 | 38 | **41** |
  | Peptamen Junior 1.5 | 56 | **68** |
  | PurAmino Jr | 35 | **51** |

  The 6 unchanged: PediaSure Grow & Gain 38; PediaSure Enteral 38; Peptamen Junior 38; Peptamen Junior Fiber 38; EleCare Jr 47. (Compleat Pediatric moved from plan-draft 39 to xlsx 38 — included in the corrected set above.)

- **Knock-on test edit:** The plan's draft `config.test.ts` asserted `getFormulaById('kate-farms-ped-std-12')?.fatGPerL).toBe(40)`. With the correction, this is updated to `.toBe(48)` so the test reflects xlsx truth. No other tests had hardcoded fat g/L assertions. Acceptance grep `grep -F "expect(formulas.length).toBe(17)"` still returns 1 — preserved.
- **Files modified:** `src/lib/pert/pert-config.json` (formula entries), `src/lib/pert/config.test.ts` (one assertion).

### Out-of-scope Discoveries (deferred, not fixed)

None. All tooling that this plan touches stayed within `src/lib/pert/`. Pre-existing residue (Playwright `favorites-nav.spec.ts` / `navigation.spec.ts` failures noted in Plan 01-02 SUMMARY) is unrelated to this plan; the plan's verification block doesn't run Playwright. Vitest full-suite (37 files / 355 tests) is green.

### Architectural Decisions Surfaced

None — no Rule 4 stops were triggered. Both deviations were Rule-1 data corrections within the plan's explicitly-authorized escape clauses.

### Authentication Gates

None.

## Verification Results

| Gate | Result |
|------|--------|
| `pnpm check` (svelte-check + svelte-kit sync) | 0 errors / 0 warnings across 4575 files |
| `pnpm test:run src/lib/pert/config.test.ts` | 11 / 11 passed |
| `pnpm test:run` (full suite, regression check) | 355 / 355 passed (37 test files) — 11 new tests, 0 regressions vs Wave-0/1.1 baseline of 344 |
| `node -e "...console.log({meds, formulas, advisories})"` | `{ meds: 5, formulas: 17, advisories: 4 }` (matches plan's expected) |
| `grep -c '^export ' src/lib/pert/types.ts` (≥ 11) | 12 |
| `grep -F "PertMode = 'oral' \| 'tube-feed'" src/lib/pert/types.ts` (1) | 1 |
| `grep -F "severity: AdvisorySeverity" src/lib/pert/types.ts` (1) | 1 |
| `grep -F '"Pertzye"' src/lib/pert/pert-config.json` (≥ 1) | 1 |
| `grep -F '2.0' src/lib/pert/pert-config.json` (= 0) | 0 |
| sub-1000 strength scan (node) | OK — no medication has any strength below 1000 |
| `grep -F '"max-lipase-cap"' src/lib/pert/pert-config.json` (1) | 1 |
| `grep -F '"severity": "stop"' src/lib/pert/pert-config.json` (1) | 1 |
| `grep -cF "filterStrengthsByAllowlist" src/lib/pert/config.ts` (≥ 2) | 2 |
| `grep -cF "export const medications" src/lib/pert/config.ts` (1) | 1 |
| `grep -cF "export function getMedicationById" src/lib/pert/config.ts` (1) | 1 |
| `grep -cF "export function getFormulaById" src/lib/pert/config.ts` (1) | 1 |
| `grep -cF "expect(medications.length).toBe(5)" src/lib/pert/config.test.ts` (1) | 1 |
| `grep -cF "expect(formulas.length).toBe(17)" src/lib/pert/config.test.ts` (1) | 1 |
| `grep -cF "drops Pertzye=2.0" src/lib/pert/config.test.ts` (1) | 1 |

### Safety-critical Gate Verification (orchestrator step 5)

The FDA-allowlist filter is the safety-critical gate of this plan. The orchestrator's instruction was: *"the test must fail CI if a non-allowlisted strength sneaks in. Verify by running the shape test and confirming it actually fails when you temporarily inject `2.0` into a Pertzye strengths array (then revert)."*

Verified by injecting `2.0` into BOTH `dropdowns.medications[id=pertzye].strengths` AND `fdaAllowlist.pertzye` (the worst case — a contributor adding the bad value to both sites). Re-ran `pnpm test:run src/lib/pert/config.test.ts`:

```
 Test Files  1 failed (1)
      Tests  2 failed | 9 passed (11)
   AssertionError: expected [ 2, 4000, 8000 ] to not include 2 (drops Pertzye=2.0...)
   + the per-strength s >= 1000 invariant fails for Pertzye in the meds-shape test
```

**Two tests fail** — the hostile-injection test catches it directly, and the per-medication `s >= 1000` invariant in the meds-shape test catches it from a second angle. CI gate is real. Reverted the injection and re-ran: 11/11 green.

This is the defense-in-depth the plan describes: the per-medication `strengths` array is filtered against `fdaAllowlist` at module load (drops Pertzye=2.0 if it's only in `strengths`), and the test invariants catch it if it sneaks into `fdaAllowlist` too.

## Key Decisions Made (Plan-Level)

These are not new decisions — all are pre-decided in `01-CONTEXT.md` D-05..D-12 and codified by this plan's execution:

| Decision | Source | Codified by |
|----------|--------|-------------|
| Mirror feeds-config.json shape `{ defaults, inputs, dropdowns, advisories }` | D-05 | `pert-config.json` structure + `config.ts` exports mirror `feeds-config.ts` |
| Pediatric formulas as flat array `[{ id, name, fatGPerL }]` | D-06 | `dropdowns.formulas` |
| Static FDA strength allowlist; `Pertzye=2.0` and sub-1000 absent + CI fails on non-allowlist value | D-07 + PERT-DATA-03 | `fdaAllowlist` + `filterStrengthsByAllowlist` + 11-test shape suite |
| `advisories[]` array, `max-lipase-cap` carries `severity: 'stop'` | D-08 + PERT-SAFE-01 | `advisories[0]` `severity: 'stop'` + `Advisory` type's `AdvisorySeverity` union |
| Mode-split state shape `{ mode, weight, med, strength, oral: {...}, tubeFeed: {...} }` | D-10 + PERT-MODE-03 | `PertStateData` interface + `defaults` block in JSON |
| First-run weight = 3.0 kg, all other inputs null | D-11 + PERT-SAFE-04 | `defaults.weightKg = 3.0` + others `null` |
| First-run mode = oral (most-recent-edited override Phase 2) | D-12 | `defaults.mode = 'oral'` |

## Known Stubs

None. All four files are fully wired against real clinical data; no placeholder or mock values escape into the loaded config.

The `validationMessages` strings are intentionally minimal per CONTEXT.md "Claude's Discretion" ("Validation message phrasing for empty/invalid inputs (config-level — exact strings TBD in Phase 2 with empty-state copy unification") — they are valid and consumer-ready, just polishable in Phase 2 alongside empty-state copy unification. This is NOT a stub in the sense of a placeholder blocking the plan goal; the plan's goal (clinical data spine + FDA-allowlist filter + shape-test gate) is fully achieved.

## Threat Flags

None. CSS-free TypeScript types + JSON data + a typed wrapper + a vitest test. No new network endpoints, auth paths, file I/O at runtime, schema migrations, or trust-boundary surface introduced. The only "trust boundary" is the static FDA-allowlist filter — which is *strengthened*, not introduced, by this plan.

## Next-Phase Readiness

Plan 01-03 unblocks/parallels:

- **01-04 (route shell + AboutSheet)** — Imports `defaults` from `config.ts` for the `pertState` singleton initial state; imports `medications`/`formulas` for the placeholder `<PertCalculator />` component (or stubs them out). The CONTEXT D-24 AboutSheet copy can cite the JSON's `dropdowns.medications[*].source.url` (DailyMed setids) directly.
- **Phase 2 (calculator math)** — Imports `defaults`, `inputs`, `medications`, `formulas`, `lipaseRates`, `advisories`, `validationMessages` and the three `getXById`/`getStrengthsForMedication` accessors. The B11/B12/B13/B14 spreadsheet-parity formulas operate on these typed exports.
- **Phase 3 (spreadsheet-parity tests)** — Loads xlsx fixtures and asserts engine output against the xlsx; the medication-strength + formula-fatGPerL values now match xlsx exactly, so parity tests will not fail on data divergence.

## Self-Check: PASSED

- `src/lib/pert/types.ts` — FOUND (12 exports including `PertMode`, `Medication`, `Formula`, `Advisory`, `AdvisorySeverity`)
- `src/lib/pert/pert-config.json` — FOUND (5 medications, 17 formulas, 4 advisories, fdaAllowlist matching meds; 0 occurrences of "2.0"; no sub-1000 strengths)
- `src/lib/pert/config.ts` — FOUND with `filterStrengthsByAllowlist` + 7 exports + 3 accessor functions
- `src/lib/pert/config.test.ts` — FOUND with 11 passing tests including the hostile-injection gate
- Commit `f7683bd` — FOUND in `git log`: `feat(pert/01-03): clinical config with FDA-allowlist strength filter`
- `pnpm check` — PASSED (0/0)
- `pnpm test:run` full suite — PASSED (355/355, no regressions)
- Hostile-injection gate — PASSED (2 tests fail when Pertzye=2.0 injected into both strengths + fdaAllowlist; reverted to clean)
- Workstream constraint (4 files in plan `files_modified`, nothing else) — HONORED (`git status --short` showed only `src/lib/pert/` new)
- STATE.md not touched — HONORED
- No worktree isolation used — HONORED
- No new runtime deps added — HONORED (TypeScript types + JSON data + vitest test only)

All claims verified. Self-check passed.
