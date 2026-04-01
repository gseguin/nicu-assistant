---
phase: 03-calculators
verified: 2026-03-31T01:35:00Z
status: human_needed
score: 12/13 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate PERT -> Formula -> PERT via nav and confirm inputs are preserved in both calculators"
    expected: "PERT inputs still filled after switching to Formula and back; Formula inputs still filled after switching back"
    why_human: "sessionStorage-backed state preservation requires browser navigation; cannot verify without a running app"
  - test: "Toggle dark mode on both /pert and /formula routes"
    expected: "Both calculators adapt fully to dark mode; BMF result card shows amber color (--color-bmf-*); no hardcoded white backgrounds visible"
    why_human: "CSS variable rendering and dark mode visual correctness requires browser inspection"
  - test: "On /formula, select a brand that has scoops (e.g. Similac Advance), enter 24 kcal/oz and 100 mL"
    expected: "Dispensing measures section appears below ResultsDisplay with scoops value populated"
    why_human: "Conditional rendering of dispensing measures block requires a live app"
  - test: "On /pert tube-feed mode, select Pancreaze and confirm 2600 and 37000 appear as strength options"
    expected: "Pancreaze strength picker includes 2600 and 37000 (tube-feed-specific strengths not available in meal mode)"
    why_human: "SelectPicker content requires a running browser to inspect"
---

# Phase 3: Calculators Verification Report

**Phase Goal:** Both PERT and formula calculators are fully functional inside the unified app with feature parity to their standalone predecessors and isolated, preserved state across tab switches
**Verified:** 2026-03-31T01:35:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PERT business logic files exist in src/lib/pert/ with adapted import paths | VERIFIED | 8 files confirmed; grep finds zero old `$lib/clinical-config` refs; all use `$lib/pert/` prefix |
| 2 | Formula business logic files exist in src/lib/formula/ with adapted import paths | VERIFIED | 5 logic files confirmed; zero old `$lib/formula-config` refs; all use `$lib/formula/` prefix |
| 3 | pertState singleton exposes init/persist/reset and both meal + tubeFeed sub-states | VERIFIED | `src/lib/pert/state.svelte.ts` exports `pertState` with all three methods and both sub-states |
| 4 | formulaState singleton exposes init/persist/reset and both modified + bmf sub-states | VERIFIED | `src/lib/formula/state.svelte.ts` exports `formulaState` with all three methods and both sub-states |
| 5 | State modules do not call sessionStorage at module level | VERIFIED | grep confirms all 3 sessionStorage calls in each state file are inside function bodies (init/persist/reset) |
| 6 | Both state modules use separate sessionStorage keys: nicu_pert_state and nicu_formula_state | VERIFIED | SESSION_KEY constants confirmed in both files |
| 7 | PERT meal mode accepts fat grams + lipase rate + brand/strength and produces capsule count | VERIFIED | DosingCalculator wired to calculateCapsules via pertState; unit tests pass (5 capsules for 15g x 2000/g x 6000 strength) |
| 8 | PERT tube-feed mode has independent inputs and produces its own capsule count | VERIFIED | Separate tubeFeed sub-state; getTubeFeedStrengthsForBrand branches independently; tube-feed test passes |
| 9 | Switching between meal and tube-feed tabs preserves both states | UNCERTAIN | Reads/writes to pertState.current.meal and pertState.current.tubeFeed separately; $effect persists; requires human browser verification |
| 10 | All 5 FDA brands appear in meal mode brand picker | VERIFIED | clinical-config.json contains Creon, Zenpep, Pancreaze, Pertzye, Viokace; MEDICATIONS mapped from this config |
| 11 | Tube-feed mode shows Pancreaze 2600/37000 and Pertzye 4000/24000 strengths | VERIFIED | tube-feed/clinical-data.ts: Pancreaze [2600,4200,10500,16800,21000,37000]; Pertzye [4000,8000,16000,24000]; absent from meal-mode clinical-config.json |
| 12 | Formula modified mode produces water mL and powder grams | VERIFIED | calculateRecipe called in $derived.by; ResultsDisplay wired with primaryValue=g_powder, secondaryValue=mL_water; unit test confirms mL_water > 0 and g_powder > 0 |
| 13 | BMF mode guard: kcal/oz must exceed baselineKcalOz or no result shown | VERIFIED | guardViolation $derived prevents calculation when targetKcalOz <= baselineKcalOz; unit test confirms calculateBMF throws when target <= baseline |
| 14 | Dispensing measures appear below result when available | VERIFIED | Conditional block in ModifiedFormulaCalculator and BreastMilkFortifierCalculator renders scoops/packets/tbsp/tsp when non-null |
| 15 | All formula brands appear with manufacturer grouping | VERIFIED | brandOptions built with `group: b.manufacturer`; SelectPicker receives options with group field |
| 16 | Both calculators show inline errors for invalid numeric inputs | VERIFIED | validateFatGrams() errors surface in PERT; validateRecipeInputs/validateBMFInputs errors surface in formula; unit tests confirm |
| 17 | No BUILD_FLAGS or branded footer code in ported components | VERIFIED | grep on DosingCalculator.svelte returns zero matches for build-flags, footerVisible, footerHidden |
| 18 | No hardcoded colors in any ported component | VERIFIED | grep on pert/ and formula/ finds zero matches for bg-white, text-slate-*, bg-clinical-*, oklch(, bg-bmf-50 |
| 19 | calculateCapsules produces correct output for all tested brands | VERIFIED | 3 unit tests pass: Creon 6000 (5 caps), Creon 3000 (3 caps), tube-feed Pancreaze 2600 (positive integer) |
| 20 | calculateRecipe and calculateBMF produce correct outputs | VERIFIED | Unit tests: mL_water > 0 and g_powder > 0 for Similac Advance 24 kcal/oz 100 mL; mL_ebm > 0 for Neocate Infant BMF |
| 21 | State preserved across cross-calculator navigation | UNCERTAIN | Architecture correct (pertState/formulaState are singletons, persisted in sessionStorage); requires human browser verification |
| 22 | pnpm build exits 0 | VERIFIED | Build succeeded: "built in 10.57s" |
| 23 | pnpm test exits 0 with all 31 tests passing | VERIFIED | "31 passed (31)" including 8 PERT tests and 9 formula tests |

**Score:** 21/23 truths verified programmatically (2 require human browser verification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/pert/dosing.ts` | calculateCapsules, validateFatGrams, calculateTotalLipase | VERIFIED | All 3 functions exported; runFormula and resolveOptionLabel also present |
| `src/lib/pert/medications.ts` | MEDICATIONS, getStrengthsForBrand, LIPASE_RATES | VERIFIED | File exists; referenced in DosingCalculator imports |
| `src/lib/pert/clinical-config.ts` | Clinical config parser | VERIFIED | Exports CLINICAL_CONFIG, FormulaDefinition, FormulaStep types |
| `src/lib/pert/clinical-config.json` | All 5 FDA brands + formulas + validation messages | VERIFIED | 397 lines; Creon/Zenpep/Pancreaze/Pertzye/Viokace confirmed |
| `src/lib/pert/tube-feed/clinical-data.ts` | TUBE_FEED_MEDICATIONS | VERIFIED | Exports TUBE_FEED_MEDICATIONS with tube-feed-specific strengths |
| `src/lib/pert/tube-feed/medications.ts` | getTubeFeedStrengthsForBrand | VERIFIED | Exports TUBE_FEED_LIPASE_RATES, TUBE_FEED_MEDICATION_BRANDS, getTubeFeedStrengthsForBrand |
| `src/lib/pert/tube-feed/examples.ts` | Tube-feed clinical examples | VERIFIED | File exists |
| `src/lib/pert/state.svelte.ts` | pertState with init/persist/reset | VERIFIED | Full implementation; nicu_pert_state key; defaultState factory |
| `src/lib/formula/formula.ts` | calculateRecipe, calculateBMF, validateRecipeInputs, validateBMFInputs | VERIFIED | All 4 exported; plus calculateScoops, calculatePackets, formatOutput, parsePacketSize |
| `src/lib/formula/formula-config.ts` | BRANDS, getBrandById | VERIFIED | Exported; consumed by formula components |
| `src/lib/formula/formula-config.json` | Formula brands with displacement and kcal data | VERIFIED | 32 brands (see spec note below) |
| `src/lib/formula/state.svelte.ts` | formulaState with init/persist/reset | VERIFIED | Full implementation; nicu_formula_state key; baselineKcalOzRaw defaults to '20' |
| `src/lib/pert/DosingCalculator.svelte` | Full PERT calculator UI — meal and tube-feed modes | VERIFIED | Wired to pertState; uses SelectPicker, NumericInput, ResultsDisplay; no BUILD_FLAGS |
| `src/routes/pert/+page.svelte` | PERT route page — mounts DosingCalculator, sets context, inits state | VERIFIED | onMount calls setCalculatorContext and pertState.init(); DosingCalculator rendered |
| `src/lib/formula/FormulaCalculator.svelte` | Formula mode switcher (modified vs BMF tabs) | VERIFIED | Tab switcher with formulaState.current.activeMode; renders ModifiedFormulaCalculator or BreastMilkFortifierCalculator |
| `src/lib/formula/ModifiedFormulaCalculator.svelte` | Modified formula mode UI | VERIFIED | Full wiring: calculateRecipe, ResultsDisplay, dispensing measures, formulaState |
| `src/lib/formula/BreastMilkFortifierCalculator.svelte` | BMF mode UI | VERIFIED | BMF guard, calculateBMF, accentVariant="bmf", ResultsDisplay with mL_ebm |
| `src/routes/formula/+page.svelte` | Formula route page — mounts FormulaCalculator, sets context, inits state | VERIFIED | onMount calls setCalculatorContext and formulaState.init(); FormulaCalculator rendered |
| `src/lib/pert/__tests__/dosing.test.ts` | Unit tests for PERT calculation functions | VERIFIED | 8 tests (4 validateFatGrams, 1 calculateTotalLipase, 3 calculateCapsules); all pass |
| `src/lib/formula/__tests__/formula.test.ts` | Unit tests for formula calculation functions | VERIFIED | 9 tests (3 validateRecipeInputs, 1 calculateRecipe, 1 validateBMFInputs, 2 calculateBMF, 2 calculateScoops); all pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/pert/dosing.ts` | `src/lib/pert/clinical-config.ts` | import | WIRED | `import { CLINICAL_CONFIG } from '$lib/pert/clinical-config'` confirmed |
| `src/lib/pert/state.svelte.ts` | sessionStorage | init/persist/reset only | WIRED | All 3 sessionStorage calls are inside function bodies; no module-level access |
| `src/lib/formula/formula.ts` | `src/lib/formula/formula-config.ts` | import | WIRED | `import { type BrandConfig } from '$lib/formula/formula-config'` confirmed |
| `src/routes/pert/+page.svelte` | `src/lib/pert/state.svelte.ts` | pertState.init() in onMount | WIRED | Line 12: `pertState.init()` inside onMount |
| `src/routes/pert/+page.svelte` | `src/lib/shared/context.ts` | setCalculatorContext in onMount | WIRED | Lines 8-11: `setCalculatorContext({ id: 'pert', accentColor: 'var(--color-accent)' })` |
| `src/lib/pert/DosingCalculator.svelte` | `src/lib/pert/dosing.ts` | calculateCapsules call | WIRED | Line 133: `calculateCapsules(parseFatGrams(fatRaw), parseLipaseRate(lipaseRateStr), parseStrength(strengthStr))` |
| `src/lib/pert/DosingCalculator.svelte` | `src/lib/shared/components/SelectPicker.svelte` | brand/strength dropdowns | WIRED | 6 SelectPicker instances in template |
| `src/lib/pert/DosingCalculator.svelte` | `src/lib/shared/components/NumericInput.svelte` | fat grams input | WIRED | NumericInput imported and used |
| `src/lib/pert/DosingCalculator.svelte` | `src/lib/shared/components/ResultsDisplay.svelte` | capsule count output | WIRED | ResultsDisplay imported and used |
| `src/routes/formula/+page.svelte` | `src/lib/formula/state.svelte.ts` | formulaState.init() in onMount | WIRED | Line 12: `formulaState.init()` inside onMount |
| `src/lib/formula/ModifiedFormulaCalculator.svelte` | `src/lib/formula/formula.ts` | calculateRecipe call | WIRED | Line 56: `calculateRecipe(selectedBrand, targetKcalOz, volumeMl)` in $derived.by |
| `src/lib/formula/BreastMilkFortifierCalculator.svelte` | `src/lib/formula/formula.ts` | calculateBMF call | WIRED | Line 71: `calculateBMF(selectedBrand, targetKcalOz, volumeMl, baselineKcalOz)` in $derived.by |
| `src/lib/formula/ModifiedFormulaCalculator.svelte` | `src/lib/shared/components/SelectPicker.svelte` | brand selector using value field | WIRED | `value: b.id` confirmed; SelectPicker used |
| `src/lib/formula/ModifiedFormulaCalculator.svelte` | `src/lib/shared/components/ResultsDisplay.svelte` | powder g and water mL | WIRED | ResultsDisplay with primaryValue=g_powder, secondaryValue=mL_water, accentVariant="clinical" |
| `src/lib/pert/__tests__/dosing.test.ts` | `src/lib/pert/dosing.ts` | direct import | WIRED | `import { validateFatGrams, calculateTotalLipase, calculateCapsules } from '$lib/pert/dosing'` |
| `src/lib/formula/__tests__/formula.test.ts` | `src/lib/formula/formula.ts` | direct import | WIRED | `import { validateRecipeInputs, validateBMFInputs, calculateRecipe, calculateBMF, calculateScoops } from '$lib/formula/formula'` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DosingCalculator.svelte` | mealCapsulesNeeded | calculateCapsules(fatGrams, lipaseUnitsPerGram, capsuleStrength) from dosing.ts | Yes — pure math from clinical-config.json formulas | FLOWING |
| `ModifiedFormulaCalculator.svelte` | recipe | calculateRecipe(selectedBrand, targetKcalOz, volumeMl) from formula.ts | Yes — algebraic formula from brand's kcalPerG and displacementMlPerG from JSON | FLOWING |
| `BreastMilkFortifierCalculator.svelte` | recipe | calculateBMF(selectedBrand, targetKcalOz, volumeMl, baselineKcalOz) from formula.ts | Yes — algebraic formula with BMF-specific derivation | FLOWING |
| `pertState.current` | activeMode, meal, tubeFeed | sessionStorage (init) + $effect writes | Real data from sessionStorage or defaults | FLOWING |
| `formulaState.current` | activeMode, modified, bmf | sessionStorage (init) + $effect writes | Real data from sessionStorage or defaults | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 31 unit tests pass | `pnpm test run` | "31 passed (31)" | PASS |
| TypeScript zero errors | `pnpm exec tsc --noEmit` | No output (zero errors) | PASS |
| Production build succeeds | `pnpm build` | "built in 10.57s" | PASS |
| calculateCapsules Creon 6000 | unit test | 5 capsules for 15g x 2000/g | PASS |
| calculateRecipe Similac Advance 24/100 | unit test | mL_water > 0, g_powder > 0 | PASS |
| calculateBMF throws on guard violation | unit test | throws when target=20 <= baseline=24 | PASS |
| No old import paths in pert/ | grep `from '$lib/clinical-config'` | 0 matches | PASS |
| No old import paths in formula/ | grep `from '$lib/formula-config'` | 0 matches | PASS |
| No wrong lucide package | grep `from 'lucide-svelte'` | 0 matches | PASS |
| No hardcoded colors | grep `oklch\|bg-white\|bg-clinical-` | 0 matches in pert/ and formula/ | PASS |
| No BUILD_FLAGS in DosingCalculator | grep `build-flags\|footerVisible` | 0 matches | PASS |
| sessionStorage only in functions | grep `sessionStorage` in state files | All 3 uses per file inside function bodies | PASS |
| State preserved across nav | Requires browser + navigation | Cannot verify programmatically | SKIP (human) |
| Dark mode rendering correct | Requires browser + CSS inspection | Cannot verify programmatically | SKIP (human) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PERT-01 | 03-01, 03-02 | Meal mode: fat grams + lipase rate + brand/strength inputs produce capsule count | SATISFIED | calculateCapsules wired; unit test confirms 5 capsules for Creon 6000 |
| PERT-02 | 03-01, 03-02 | Tube-feed mode with independent state from meal mode | SATISFIED | Separate tubeFeed sub-state in pertState; getTubeFeedStrengthsForBrand branches correctly |
| PERT-03 | 03-02 | Tab switching between meal and tube-feed preserves both states | NEEDS HUMAN | Architecture correct (separate sub-states, sessionStorage-backed); requires browser verification |
| PERT-04 | 03-01, 03-02 | All FDA medication brands and strengths from clinical-config.json | SATISFIED | All 5 brands (Creon, Zenpep, Pancreaze, Pertzye, Viokace) in clinical-config.json; tube-feed has additional strengths |
| PERT-05 | 03-02, 03-04 | Feature parity with standalone pert-calculator app | SATISFIED | All calculation logic ported verbatim; shared components replace local ones; no functional regressions found |
| FORM-01 | 03-01, 03-03 | Modified formula mode: brand + target kcal/oz + volume produce water mL and powder grams | SATISFIED | calculateRecipe wired; unit test confirms outputs; ResultsDisplay shows primary/secondary values |
| FORM-02 | 03-01, 03-03 | BMF mode: brand + target kcal/oz + volume + baseline EBM produce EBM mL and powder grams | SATISFIED | calculateBMF wired; mL_ebm output confirmed in unit test |
| FORM-03 | 03-03 | Dispensing measures (scoops, packets, tbsp, tsp) displayed when available | SATISFIED | Conditional dispensing block in both sub-calculators; renders when recipe.scoops/packets/tbsp/tsp non-null |
| FORM-04 | 03-01, 03-03 | All 40+ formula brands from formula-config.json with manufacturer grouping | PARTIAL — see spec note | 32 brands present (not 40+); all brands from source app ported; grouping via manufacturer field works |
| FORM-05 | 03-03, 03-04 | Feature parity with standalone formula-calculator app | SATISFIED | Source app also has 32 brands; all calculation logic ported; shared components used correctly |
| CC-01 | 03-02, 03-03 | Calculator state preserved when switching between PERT and formula via nav | NEEDS HUMAN | sessionStorage-backed; requires browser navigation test |
| CC-02 | 03-02, 03-03 | Each calculator's state isolated — no cross-contamination | SATISFIED | Separate SESSION_KEYs (nicu_pert_state, nicu_formula_state); separate state singletons |
| CC-03 | 03-02, 03-03 | Input validation on all numeric fields | SATISFIED | validateFatGrams (PERT), validateRecipeInputs, validateBMFInputs (formula); errors surfaced in UI |

### Spec Note: Formula Brand Count

The REQUIREMENTS.md FORM-04 and plan truths state "40+ formula brands." The actual formula-config.json in both the source standalone app and the unified app contains exactly 32 brands. This is an error in the specification, not an implementation gap — the standalone formula-calculator (the parity target) also has 32 brands. Feature parity (FORM-05) is fully achieved. The "40+" figure appears to have been an estimate written before inspecting the source data. No remediation needed.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | No stubs, placeholders, TODO comments, or hardcoded values found in phase 3 files |

No anti-patterns detected. Verified:
- Zero `TODO/FIXME/HACK/PLACEHOLDER` comments in phase 3 files
- Zero `animate-pulse/skeleton/"Phase 3"/"coming soon"` mentions in route pages
- Zero hardcoded colors (`oklch`, `bg-white`, `text-slate-*`, `bg-clinical-*`) in pert/ or formula/
- Zero `from 'lucide-svelte'` (wrong package); all use `from '@lucide/svelte'`
- Zero old unqualified import paths (`$lib/clinical-config`, `$lib/formula-config`)

### Human Verification Required

#### 1. Cross-Calculator State Preservation

**Test:** Open /pert, enter fat grams=15, select any lipase rate, select Creon 6000. Navigate to /formula, enter brand=Similac Advance, kcal/oz=24, volume=100. Navigate back to /pert.
**Expected:** PERT inputs (fat grams=15, rate, Creon 6000) are restored. Navigate back to /formula — formula inputs (Similac Advance, 24, 100) are restored.
**Why human:** sessionStorage restoration happens inside onMount which requires a real browser navigation cycle.

#### 2. PERT Tab Switching State Isolation

**Test:** On /pert, enter meal mode inputs (fat grams=20, Creon 6000). Switch to tube-feed tab, enter different inputs. Switch back to meal tab.
**Expected:** Meal tab shows original inputs (fat grams=20, Creon 6000). Tube-feed inputs are not overwritten.
**Why human:** Requires interaction with a running app.

#### 3. Tube-Feed Brand Strengths Visible in UI

**Test:** On /pert tube-feed mode, open brand picker, select Pancreaze, then open strength picker.
**Expected:** Strength options include 2600 and 37000 (tube-feed-specific; meal mode Pancreaze only shows 4200/10500/16800/21000).
**Why human:** SelectPicker dropdown content requires browser interaction.

#### 4. Dark Mode Visual Correctness

**Test:** Toggle dark mode on both /pert and /formula routes. On /formula BMF mode with a result visible.
**Expected:** Both calculators adapt to dark mode with no hardcoded white backgrounds; BMF result card shows amber accent color (--color-bmf-600).
**Why human:** CSS variable rendering and visual correctness requires browser and eye inspection.

## Summary

Phase 3 goal is substantively achieved. All 20 artifacts exist and are fully wired — none are stubs or placeholders. The calculation engines (dosing.ts, formula.ts) are verified by 17 unit tests, all passing. Both route pages correctly initialize their state singletons in onMount. The state persistence architecture (separate sessionStorage keys, singleton pattern following theme.svelte.ts) is correctly implemented. Build succeeds and TypeScript reports zero errors.

Two truths (PERT-03 and CC-01 — state preservation across navigation) require human browser verification because they depend on sessionStorage round-trip across SvelteKit route transitions. The code architecture is correct for this behavior but programmatic verification is not possible.

One spec discrepancy found: FORM-04 claims "40+ brands" but both source and target apps have exactly 32. This is a documentation error, not an implementation gap. Feature parity (FORM-05) is fully achieved.

---

_Verified: 2026-03-31T01:35:00Z_
_Verifier: Claude (gsd-verifier)_
