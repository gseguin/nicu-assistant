---
phase: 09
plan: 01
subsystem: fortification
tags: [reference-data, types, loader]
requirements: [REF-01, REF-02]
status: complete
---

# Phase 9 Plan 01: Fortification Reference Data & Loader Summary

Embedded the fortification formula reference table from `recipe-calculator.xlsx` (Calculator tab A3:D35) as a typed JSON config with a parser/loader and unit tests. Pure additive — no existing files touched.

## Tasks Completed

1. **Task 1 — Types**: Created `src/lib/fortification/types.ts` with `BaseType`, `UnitType`, `TargetKcalOz`, `FortificationFormula`, `FortificationInputs`, `FortificationResult`. `npx tsc --noEmit` passes for fortification files (pre-existing unrelated errors in `src/lib/shell/NavShell.test.ts`).
2. **Task 2 — JSON config**: Transcribed 30 formulas from xlsx Calculator tab (A3:D35 contains 30 non-empty rows; rows 7, 9, 12 are blank in the sheet). Wrote `src/lib/fortification/fortification-config.json`, alphabetically sorted, with `id`, `name`, `manufacturer`, `displacement_factor`, `calorie_concentration`, `grams_per_scoop`. JSON verify passes.
3. **Task 3 — Loader + tests**: Created `fortification-config.ts` (`getFortificationFormulas`, `getFormulaById`) and `fortification-config.test.ts` (9 tests, all green, no mocks).

## Files Created

- `src/lib/fortification/types.ts`
- `src/lib/fortification/fortification-config.json`
- `src/lib/fortification/fortification-config.ts`
- `src/lib/fortification/fortification-config.test.ts`

## Test Results

- `npx vitest run src/lib/fortification/fortification-config.test.ts` → **9 passed / 9**
- `npx tsc --noEmit` → fortification files clean (only pre-existing `src/lib/shell/NavShell.test.ts` `fs/path/__dirname` errors remain — out of scope, not introduced by this plan).

## XLSX Row Count

**N = 30** non-empty rows in `recipe-calculator.xlsx` Calculator tab range A3:D35. Rows 7, 9, and 12 are blank (xlsx layout artifact); the plan’s `≤33` upper bound is satisfied.

## Manufacturer Mapping (from src/lib/formula/formula-config.json)

Built a normalized lookup (lowercased, punctuation-stripped) plus a partial-match fallback (legacy brand contained in xlsx name with length delta ≤4, e.g. "Enfamil A.R." → "Enfamil A.R", "EleCare" → "Elecare"). Mapped manufacturers verbatim where the legacy config had a confident match.

| Mapped (13) | Manufacturer |
|---|---|
| EleCare | Abbott |
| Enfamil A.R | Mead Johnson |
| Enfamil EnfaCare | Mead Johnson |
| Enfamil ProSobee | Mead Johnson |
| Monogen | Nutricia |
| Neocate Infant | Nutricia |
| Portagen | Mead Johnson |
| Pregestimil | Mead Johnson |
| Similac Advance | Abbott |
| Similac Alimentum | Abbott |
| Similac NeoSure | Abbott |
| Similac Total Comfort | Abbott |
| Vivonex Pediatric | Nestlé |

## Unmapped Brands (manufacturer = "") — Human Review Needed

These 17 xlsx rows had no confident match in `src/lib/formula/formula-config.json`. Per Plan 09-01 Task 2 step 3, I did NOT guess — `manufacturer` is set to `""`. A clinician/maintainer should fill these before Plan 10’s manufacturer-grouped UI ships.

1. Alfamino Infant *(legacy has "Alfamino" — Nestlé; intentionally not auto-matched, names differ)*
2. Boost Kid Essentials *(not in legacy)*
3. Enfamil Gentlease *(legacy has "Enfamil NeuroPro Gentlease" — Mead Johnson)*
4. Enfamil Infant *(legacy has "Enfamil NeuroPro Infant" — Mead Johnson)*
5. Enfamil NeuroPro *(legacy has "Enfamil NeuroPro Infant"/"Gentlease" — Mead Johnson)*
6. Enfamil Reguline *(not in legacy — likely Mead Johnson)*
7. Gerber Good Start *(not in legacy — Nestlé)*
8. Nutramigen *(legacy has "Nutramigen with Enflora LGG" — Mead Johnson)*
9. PediaSure *(not in legacy — Abbott)*
10. PediaSure Peptide *(not in legacy — Abbott)*
11. Peptamen Junior *(not in legacy — Nestlé)*
12. Puramino Infant *(legacy has "Puramino" — Mead Johnson)*
13. Similac 360 Total Care *(not in legacy — Abbott)*
14. Similac HMF *(not in legacy — Abbott; the only formula supporting Packets)*
15. Similac Isomil *(legacy has "Similac Soy Isomil" — Abbott)*
16. Similac Pro-Advance *(not in legacy — Abbott)*
17. Similac Sensitive *(legacy has "Similac Pro-Sensitive" — Abbott)*

## Notable Values

- All 30 rows have non-zero `grams_per_scoop` (xlsx had no blank scoop entries in this dataset).
- `Similac HMF` has unusual values: `displacement_factor=1`, `calorie_concentration=1.4` — this is a fortifier, not a standalone formula, and is the only row that will support the `packets` unit per the plan’s spot-check note.

## Deviations from Plan

1. **[Rule 3 — blocking issue] Spot-check name conflict.** Plan 09-01 Task 2 `<behavior>` says "`Similac Human Milk Fortifier` (verbatim xlsx label)". The xlsx Calculator tab actually labels this row **"Similac HMF"** verbatim. Per the plan’s explicit instruction "`name` is verbatim from the xlsx", I used `"Similac HMF"`. The verify command’s `.includes('similac human milk fortifier')` substring check would fail, so I broadened the executor’s verify-time spot-check to accept either `'hmf'` or `'human milk fortifier'`. The committed unit test asserts the verbatim xlsx string `"Similac HMF"` and explicitly notes the discrepancy in a comment. **Action for downstream plans:** if Plan 09-02 / Plan 10 expect the longer label, this row should be renamed in the JSON (clinician approval required).
2. **[Conflict — plan vs xlsx layout] Row count.** Plan said “up to 33 rows (A3:D35)”. Actual non-empty count is 30 (rows 7, 9, 12 are blank in the sheet). N=30 is hard-coded into the test.
3. **[Pre-existing, out of scope]** `src/lib/shell/NavShell.test.ts` already had `tsc` errors (`Cannot find module 'fs'/'path'`, `__dirname` undefined) before this plan started. Not touched. Logged here for visibility; not a fortification regression.

## Authentication Gates

None.

## Self-Check: PASSED

- `src/lib/fortification/types.ts` — FOUND
- `src/lib/fortification/fortification-config.json` — FOUND (30 formulas)
- `src/lib/fortification/fortification-config.ts` — FOUND
- `src/lib/fortification/fortification-config.test.ts` — FOUND (9/9 passing)
- No files outside `src/lib/fortification/` modified.
