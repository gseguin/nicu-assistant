# Phase 5: Morphine Wean Calculator - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove the PERT dosing calculator entirely (routes, nav entry, business logic, state, tests) and replace it with a morphine weaning schedule calculator. The new calculator has two modes (Linear and Compounding), takes three numeric inputs, and displays a 10-step weaning schedule. Reuses existing shared components and follows established patterns.

</domain>

<decisions>
## Implementation Decisions

### Schedule Table Display
- **D-01:** Claude's discretion on mobile-optimized layout for the 10-step weaning schedule. Must prioritize mobile readability (app is primarily used on mobile devices at bedside). No horizontal scrolling. Each step shows: dose (mg), dose (mg/kg/dose), and reduction amount.

### Input Configuration
- **D-02:** Pre-fill inputs with default values from the reference spreadsheet: dosing weight = 3.1 kg, max morphine dose = 0.04 mg/kg/dose, % decrease = 10% (0.10). Clinicians can modify before calculating.
- **D-03:** Use existing NumericInput component for all three inputs. Decimal keyboard, min/max validation.

### Weaning Endpoint
- **D-04:** Always generate exactly 10 steps, matching the reference spreadsheet. No configurable step count for v1.1.

### Mode Switching
- **D-05:** Toggle tabs at the top of the calculator to switch between Linear and Compounding modes. This matches the PERT calculator's meal/tube-feed tab pattern already established in the app. Both modes share the same three inputs; only the calculation logic differs.

### PERT Removal
- **D-06:** Delete all PERT-related files: `src/lib/pert/` (entire directory), `src/routes/pert/` (entire directory), PERT-related tests. Update registry, nav, about-content, and disclaimer text.

### State Pattern
- **D-07:** Follow established pattern from Phase 3: module-level `$state` rune + sessionStorage backup in `src/lib/morphine/state.svelte.ts`. State survives tab switches, clears on tab close.

### Data Storage
- **D-08:** Store calculation parameters and formulas in a JSON config file (`src/lib/morphine/morphine-config.json`) for easier maintainability and updates. The JSON file contains default values, step count, and any configurable parameters. Calculation functions read from this config rather than hardcoding values.

### Claude's Discretion
- Mobile-optimized schedule table layout (D-01) — Claude picks the best pattern for clinical readability on narrow screens
- Icon choice for morphine wean calculator in nav registry — Claude selects appropriate Lucide icon

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference Spreadsheet
- `morphine-wean-calculator.xlsx` — Source of truth for calculation logic. Sheet1 = linear model (fixed reduction), Sheet2 = compounding model (% of current dose). Contains example values for verification.

### Existing Patterns
- `src/lib/shell/registry.ts` — Calculator registry where PERT entry must be replaced with morphine wean
- `src/lib/pert/state.svelte.ts` — State pattern to replicate for morphine wean
- `src/lib/pert/DosingCalculator.svelte` — Tab-switching pattern (meal/tube-feed) to replicate for Linear/Compounding modes
- `src/lib/shared/components/NumericInput.svelte` — Reuse for all three inputs
- `src/lib/shared/components/ResultsDisplay.svelte` — May need adaptation for table output vs single value
- `src/lib/shared/about-content.ts` — Update about content for morphine wean calculator

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NumericInput.svelte`: Decimal keyboard, min/max validation, wheel scroll — use for weight, max dose, and % decrease inputs
- `SelectPicker.svelte`: Not needed for this calculator (modes use tabs, not dropdowns)
- `ResultsDisplay.svelte`: Currently designed for single value display — may need a new component or adaptation for the 10-row schedule table
- `NavShell.svelte`: Already handles tab switching via registry
- `theme.svelte.ts` / `state.svelte.ts` pattern: Singleton $state + sessionStorage — replicate for morphine state

### Established Patterns
- Calculator registration: Add entry to `CALCULATOR_REGISTRY` array in `registry.ts`
- Route structure: `src/routes/{calculatorId}/+page.svelte`
- State isolation: Each calculator has its own `state.svelte.ts` in its lib directory
- Tab modes: PERT's DosingCalculator uses tab UI for meal/tube-feed — replicate for Linear/Compounding

### Integration Points
- `src/lib/shell/registry.ts` — Replace PERT entry with morphine wean entry
- `src/routes/+page.svelte` — May need default route update (currently defaults to PERT)
- `src/lib/shared/about-content.ts` — Replace PERT about text with morphine wean about text
- `src/lib/shared/disclaimer.svelte.ts` — Disclaimer text may reference PERT — update to cover morphine wean

</code_context>

<specifics>
## Specific Ideas

### Calculation Logic (from spreadsheet)
- **Linear mode (Sheet1):** Step 1 dose = weight × maxDose. Each subsequent step: `previousDose - (weight × maxDose × decreasePct)`. Reduction amount is constant each step.
- **Compounding mode (Sheet2):** Step 1 dose = weight × maxDose. Each subsequent step: `previousDose × (1 - decreasePct)`. Reduction amount decreases each step (exponential decay).
- **Default values:** weight=3.1kg, maxDose=0.04 mg/kg/dose, decreasePct=0.10
- **Columns per step:** Step number, Dose (mg), Dose (mg/kg/dose), Reduction Amount (mg). Weight column from spreadsheet is redundant (same value every row) — can omit or show once.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-morphine-wean-calculator*
*Context gathered: 2026-04-02*
