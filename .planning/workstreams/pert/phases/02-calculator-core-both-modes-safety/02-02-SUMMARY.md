---
phase: 2
plan: 2
workstream: pert
subsystem: pert/calculations
tags:
  - pert
  - calc-layer
  - xlsx-parity
  - clinical-math
  - pure-functions
requirements:
  - PERT-ORAL-06
  - PERT-ORAL-07
  - PERT-ORAL-08
  - PERT-TUBE-06
  - PERT-TUBE-07
  - PERT-SAFE-01
  - PERT-SAFE-04
dependency-graph:
  requires:
    - 01-04 (pertState shape + types.ts Phase-1 frozen)
    - 02-01 (Wave-0 hygiene baseline)
  provides:
    - pure-function math layer for Plan 02-04 (PertCalculator body)
    - parity surface for Phase 3 PERT-TEST-01/02 fixtures
  affects:
    - src/lib/pert/types.ts (additive: TriggeredAdvisory)
tech-stack:
  added: []
  patterns:
    - "feeds/calculations.ts mirror — pure-function calc + advisory engine"
    - "xlsx-canonical fat-based dosing (D-15 + D-16); JSON keys Phase-1-frozen (D-17)"
    - "Math.round (NOT Math.ceil) per D-02 user-locked 2026-04-25"
    - "Defensive zero-return on null/NaN/≤0 inputs (never Infinity / NaN)"
    - "10,000 units/kg/day STOP-red cap as literal in calc layer (D-03); JSON entry is a marker"
    - "D-10 severity-DESC sort (stop > warning), stable within tier"
key-files:
  created:
    - src/lib/pert/calculations.ts
  modified:
    - src/lib/pert/types.ts
decisions:
  - "Honored D-02 (Math.round, NOT Math.ceil) verbatim — 7 Math.round call sites; zero Math.ceil/floor in production code (only 1 docstring mention noting non-use)."
  - "Honored D-15 oral formula: capsulesPerDose = Math.round((fatGrams * lipasePerKgPerMeal) / strengthValue). Treats lipasePerKgPerMeal as lipase units per gram of fat per D-17."
  - "Honored D-16 tube formula: totalFatG = (formulaFatGPerL * volumePerDayMl) / 1000; totalLipase = totalFatG * lipasePerKgPerDay; capsulesPerDay = Math.round(totalLipase / strengthValue); lipasePerKg = totalLipase / weightKg (secondary display, NOT divisor)."
  - "Honored D-12 capsulesPerMonth = Math.round(capsulesPerDay * 30) — × 30 not × 30.4."
  - "Honored D-03 max-lipase cap as literal `dailyLipase > weightKg * 10000` in calc layer; JSON marker entry's field/comparator/value are ignored on the `max-lipase-cap` id branch."
  - "Honored D-05 dailyLipase: oral × 3, tube-feed direct."
  - "Honored D-17 JSON keys (lipasePerKgPerMeal, lipasePerKgPerDay) unchanged — UI label change is Plan 02-03's scope."
  - "Defensive zero-return policy: every public compute* + dailyLipaseUnits guards on Number.isFinite + ≤ 0 before doing math. Never produces Infinity / NaN."
  - "TriggeredAdvisory in pert/types.ts is a separate interface from the one in feeds/types.ts (different shapes — feeds has {id, message}, pert has {id, message, severity} per D-04 + D-10). No collision because they're scoped to their own modules."
  - "getTriggeredAdvisories returns [] when result === null (D-08 empty-state gate)."
  - "Pertzye=2.0 strength cross-check from RESEARCH §A1 (Pitfall 3) NOT implemented — calc layer takes resolved numeric inputs already; Plan 04 (component layer) is responsible for filtering invalid persisted state through getStrengthsForMedication."
metrics:
  duration: ~7 minutes
  completed: 2026-04-25T17:39:55Z
  tasks_completed: 2
  files_created: 1
  files_modified: 1
  lines_added: 294
  test_baseline_preserved: true
---

# Phase 2 Plan 2: Pure-Function Calculation Layer Summary

**One-liner:** Pure-function PERT math module (`src/lib/pert/calculations.ts`) with xlsx-canonical fat-based dosing (Math.round, NOT Math.ceil) for both Oral and Tube-Feed modes, plus a severity-aware advisory engine that runs the 10,000 units/kg/day STOP-red cap as a literal cross-input rule.

## What Shipped

### Files

| File | Status | Lines | Purpose |
|------|--------|-------|---------|
| `src/lib/pert/calculations.ts` | NEW | 284 | Pure-function calc + advisory engine |
| `src/lib/pert/types.ts` | additive | +10 (78→90) | New `TriggeredAdvisory` interface |

### Exports from `src/lib/pert/calculations.ts`

| Export | Kind | Purpose |
|--------|------|---------|
| `MAX_LIPASE_PER_KG_PER_DAY` | `const = 10000` | FDA-published max lipase cap (PERT-SAFE-01) |
| `OralCalcInputs` | interface | Resolved oral inputs (`fatGrams`, `lipasePerKgPerMeal`, `strengthValue`) |
| `TubeFeedCalcInputs` | interface | Resolved tube inputs (`formulaFatGPerL`, `volumePerDayMl`, `lipasePerKgPerDay`, `weightKg`, `strengthValue`) |
| `computeOralResult(inputs)` | function | Oral B9/B10 — returns `PertOralResult` |
| `computeTubeFeedResult(inputs)` | function | Tube B7/B12/B13/B14 — returns `PertTubeFeedResult` |
| `dailyLipaseUnits(mode, capsules, strength)` | function | Per-mode daily lipase (D-05); used by cap check |
| `getTriggeredAdvisories(mode, state, result, advisoryConfig)` | function | Advisory engine; severity-DESC sort |

### Exports from `src/lib/pert/types.ts` (additive)

| Export | Kind | Purpose |
|--------|------|---------|
| `TriggeredAdvisory` | interface `{id, message, severity}` | Render-layer payload — STOP-red vs warning branching (D-04 + D-10) |

All Phase-1 exports (`PertMode`, `PertOralInputs`, `PertTubeFeedInputs`, `PertStateData`, `PertOralResult`, `PertTubeFeedResult`, `PertInputRanges`, `Medication`, `Formula`, `AdvisorySeverity`, `Advisory`, `ValidationMessages`) preserved verbatim. State schema is Phase-1-frozen.

## Formula Text (Verbatim)

### Oral (D-15, xlsx oral B9/B10)

```typescript
const totalLipase = fatGrams * lipasePerKgPerMeal;        // xlsx B9 = B5*B6
const capsulesPerDose = Math.round(totalLipase / strengthValue);  // xlsx B10 = ROUND(B9/B8, 0)
const lipasePerDose = capsulesPerDose * strengthValue;
const estimatedDailyTotal = capsulesPerDose * 3;          // PERT-ORAL-08, 3 meals/day
```

### Tube-Feed (D-16, xlsx tube B7/B12/B13/B14)

```typescript
const totalFatG = (formulaFatGPerL * volumePerDayMl) / 1000;       // xlsx B7-family
const totalLipase = totalFatG * lipasePerKgPerDay;                 // xlsx B12 = B8*B9
const capsulesPerDay = Math.round(totalLipase / strengthValue);    // xlsx B14 = ROUND(B12/B11, 0)
const lipasePerKg = totalLipase / weightKg;                        // xlsx B13 — display
const capsulesPerMonth = Math.round(capsulesPerDay * 30);          // D-12, × 30 (NOT 30.4)
```

### Daily Lipase (D-05)

```typescript
mode === 'oral'   ? capsules * strengthValue * 3          // 3 meals/day
                  : capsules * strengthValue;             // tube-feed already daily
```

### Max-Lipase Cap (D-03, PERT-SAFE-01)

```typescript
if (dailyLipase > weightKg * MAX_LIPASE_PER_KG_PER_DAY) {  // 10,000 literal
  triggered.push({ id: 'max-lipase-cap', message, severity: 'stop' });
}
```

The JSON `max-lipase-cap` advisory entry's `field: "computed"`, `comparator: "gt"`, `value: 0` are markers — the literal cross-input rule fires regardless.

### Defensive zero-return policy (D-02 + Pitfall 6)

Every compute function guards via `Number.isFinite(x) && x > 0` on each required input; on failure returns the `PertOralResult` / `PertTubeFeedResult` with all numeric fields = `0`. `dailyLipaseUnits` returns `0` similarly. `getTriggeredAdvisories(_, _, null, _)` returns `[]`. The math layer never produces `Infinity` or `NaN`.

## Verification Results

| Gate | Command | Result |
|------|---------|--------|
| 1 | `pnpm svelte-check` | 0 errors / 0 warnings / 0 files-with-problems (4581 files) |
| 2 | `pnpm test:run` | **361/361 passing** (38 test files; full Phase-1 baseline preserved) |
| 3 | `pnpm test:run src/lib/pert/` | **17/17 passing** (config.test.ts + state.test.ts untouched) |
| 4 | `grep -E "Math\.(round\|ceil\|floor)" calculations.ts \| grep -v Math.round` | empty — Math.round only |
| 5 | `grep -E "from '\./(state\|config)'" calculations.ts` | empty — no state or config imports |
| Smoke | xlsx default oral: 25g fat × 1000 lipase/g ÷ Creon 12000 | `Math.round(2.0833) = 2` ✓ matches plan |
| Smoke | xlsx default tube: 48 g/L × 1000 mL × 1000 lipase/g ÷ 12000 | `Math.round(4.0) = 4` ✓ matches plan |

## Acceptance Criteria — All Met

- [x] `src/lib/pert/types.ts` exports `TriggeredAdvisory` (additive only).
- [x] `src/lib/pert/calculations.ts` exists with `computeOralResult`, `computeTubeFeedResult`, `dailyLipaseUnits`, `getTriggeredAdvisories`, `MAX_LIPASE_PER_KG_PER_DAY` exported.
- [x] All capsule rounding uses `Math.round` per D-02 (no `Math.ceil`, no `Math.floor` for capsule fields). 7 `Math.round` call sites; 0 `Math.ceil`/`Math.floor` in production code.
- [x] Oral formula matches D-15: `Math.round((fatGrams * lipasePerKgPerMeal) / strengthValue)`.
- [x] Tube-feed formula matches D-16: `Math.round(((formulaFatGPerL * volumePerDayMl / 1000) * lipasePerKgPerDay) / strengthValue)`.
- [x] capsulesPerMonth = `Math.round(capsulesPerDay × 30)` per D-12.
- [x] dailyLipase per D-05 (oral × 3, tube-feed direct).
- [x] Cap check uses literal `dailyLipase > weightKg * 10000` per D-03.
- [x] Advisories sorted severity-DESC per D-10 (stop > warning), stable within tier.
- [x] Defensive zero-return on null/NaN/≤0 inputs.
- [x] No `./state` or `./config` imports in calculations.ts (pure-function rule per D-01).
- [x] svelte-check 0/0; pnpm test:run 361/361; src/lib/pert tests 17/17.
- [x] Commit message: `feat(pert/02-02): add pure-function calc layer with xlsx-canonical fat-based dosing` (commit `6f05cfc`).

## Deviations from Plan

**None.** Plan executed exactly as written.

The math is mechanically locked by D-02/D-15/D-16/D-12/D-05/D-03/D-17 (all user-locked or auto-recommended); the calc layer reproduces them verbatim. The two suspicious grep matches during in-flight verification (`Math.ceil/floor` count = 1, `pert-config.json` count = 2) were both confirmed to be docstring mentions of *non-use* rules in the file's header comment — the plan's exact verify commands (with `grep -v Math.round` and `import.*pert-config.json`) returned clean.

## Threat Surface Scan

No new security-relevant surface introduced. Pure-function module with no I/O, no network, no file system, no DOM. The `Pertzye=2.0` re-injection vector flagged in RESEARCH §Pitfall 3 / Risk-3 is **not** mitigated in this layer (assumption A1 from RESEARCH; Plan 04's component layer must filter `state.strengthValue` against `getMedicationById(state.medicationId).strengths` before passing it as a resolved number to `compute*Result`).

The threat register's `T-02-03` (localStorage tampering) is mitigated as planned: defensive `Number.isFinite + > 0` guards on every numeric input return zero results rather than Infinity / NaN. `T-02-06` (DoS via pathological inputs) is mitigated identically. `T-02-04` (info disclosure) and `T-02-05` (clinical safety / wrong formula) accept-or-mitigate dispositions are unchanged from plan.

## Self-Check: PASSED

- src/lib/pert/calculations.ts FOUND
- src/lib/pert/types.ts FOUND (TriggeredAdvisory interface present)
- Commit 6f05cfc FOUND in git log
