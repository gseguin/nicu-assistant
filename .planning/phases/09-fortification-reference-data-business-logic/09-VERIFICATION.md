---
phase: 09
phase_name: fortification-reference-data-business-logic
verified_at: 2026-04-07
status: passed
score: 5/5 success criteria, 12/12 requirements
---

# Phase 9 Verification

## Success Criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | ~30 formulas embedded as JSON, editable without TS edits | PASS | `src/lib/fortification/fortification-config.json` — 30 entries with full schema (id, name, manufacturer, displacement_factor, calorie_concentration, grams_per_scoop) |
| 2 | `calculateFortification(inputs)` pure, returns 4-field result | PASS | `src/lib/fortification/calculations.ts:68` — pure function, no Svelte/DOM/I/O imports |
| 3 | Documented Neocate parity case passes | PASS | `calculations.test.ts:12-25` — `toBe(2)`, `toBeCloseTo(183.5,4)`, `toBeCloseTo(23.5101662125341,4)`, `toBe('180 (6.1 oz)')` — green |
| 4 | One test per special case + per unit type | PASS | HMF Packets@22 (line 42), HMF Packets@24 (line 28), BM+Tsp+22 shortcut (line 69), BM+Tsp+24 shortcut (documented case), Water base (line 88), grams/scoops/tsp/tbsp/packets all covered |
| 5 | Full v1.2 suite still passes — no regressions | PASS | `npx vitest run` → 170/170 passing across 9 test files |

## Requirements Coverage (12/12)

| REQ | Status | Implementation |
|---|---|---|
| REF-01 | VALIDATED | `fortification-config.json` (30 rows) |
| REF-02 | VALIDATED | JSON-only edits sufficient; loader uses static import |
| CALC-01 | VALIDATED | `calculations.ts:68` exported pure function |
| CALC-02 | VALIDATED | General formula `calculations.ts:100-102`, baseKcal map line 15 |
| CALC-03 | VALIDATED | Unit conversion switch `calculations.ts:103-116` |
| CALC-04 | VALIDATED | Packets→HMF special case `calculations.ts:82-91` |
| CALC-05 | VALIDATED | BM+Tsp shortcut `calculations.ts:92-97` |
| CALC-06 | VALIDATED | `gramsAdded` helper `calculations.ts:21-34` + yield `:123` |
| CALC-07 | VALIDATED | Exact kcal/oz `calculations.ts:124-125` |
| CALC-08 | VALIDATED | Suggested volume back-calc `calculations.ts:130-180` |
| VAL-01 | VALIDATED | `calculations.test.ts:12-25` |
| VAL-02 | VALIDATED | 170/170 vitest green |

## Out-of-Scope Boundaries Respected

- No `.svelte` or `.svelte.ts` files in `src/lib/fortification/`
- `src/lib/formula/` intact (Phase 11 cleanup target)
- No route changes
- No state singletons

## Notes (informational, not gaps)

1. **17 unmapped manufacturers** in `fortification-config.json` (manufacturer = `""`). Plan 09-01 SUMMARY lists them with likely candidates from the legacy config. Phase 9 success criteria do not require manufacturer values — deferred to Phase 10 planning when grouped UI is built.
2. **Pre-existing tsc errors** in `src/lib/shell/NavShell.test.ts` (fs/path/__dirname). Predates Phase 9, documented in both plan summaries, does not affect vitest runtime — VAL-02 still PASS.
3. **HMF naming**: id is `similac-hmf` (verbatim from xlsx "Similac HMF"), not the longer "Similac Human Milk Fortifier" form. Documented in 09-01 SUMMARY.

## Verdict

**PHASE VERIFIED.** Ready for Phase 10 (Fortification Calculator UI).
