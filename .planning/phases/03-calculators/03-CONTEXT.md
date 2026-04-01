# Phase 3: Calculators - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Port both PERT dosing calculator and formula recipe calculator into the unified app. Full feature parity with standalone apps. Use shared components from Phase 2. Isolated, preserved state across tab switches. No new features — faithful ports with dark mode token migration.

</domain>

<decisions>
## Implementation Decisions

### Code Porting Strategy
- **D-01:** Copy business logic files (dosing.ts, medications.ts, clinical-config.ts/json, formula.ts, formula-config.ts/json) with import path adaptations only. No logic changes — these are proven correct.
- **D-02:** Port UI components (DosingCalculator, FormulaCalculator, etc.) and refactor to use Phase 2 shared components (SelectPicker, NumericInput, ResultsDisplay) in a single pass. Don't copy-then-refactor — do it in one step.
- **D-03:** Business logic lives in `src/lib/pert/` and `src/lib/formula/` respectively. UI components live in calculator-specific route directories or co-located component files.

### State Preservation
- **D-04:** Module-level `$state` (Svelte 5 runes) with sessionStorage backup for each calculator. State survives tab switches and page refreshes. Clears on tab close (safe for clinical use — no stale inputs between sessions).
- **D-05:** Each calculator gets its own state module (e.g., `src/lib/pert/state.svelte.ts`, `src/lib/formula/state.svelte.ts`). States are fully isolated — no cross-contamination.
- **D-06:** Pattern matches `theme.svelte.ts` from Phase 1 — singleton module with `$state` runes, init/persist functions.

### Dark Mode Token Migration
- **D-07:** Replace hardcoded OKLCH color literals in formula components with semantic CSS custom property tokens (bg-surface, text-primary, border-border, etc.) during the port — not as a separate pass.
- **D-08:** All ported components must render correctly in both dark and light themes. No hardcoded `oklch(...)`, `bg-white`, `text-slate-*`, or `bg-clinical-*` literals.

### Claude's Discretion
- File organization within src/lib/pert/ and src/lib/formula/
- How to split the large DosingCalculator.svelte (~900 lines) — keep as one file or extract sub-components
- Tube-feed specific files organization
- Test file placement and coverage scope
- Whether to create a shared calculation utilities module or keep calculator logic fully separate

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PERT Calculator Source (port from)
- `/mnt/data/src/pert-calculator/src/lib/dosing.ts` — Pure calculation functions (capsule counts)
- `/mnt/data/src/pert-calculator/src/lib/medications.ts` — FDA medication brands and strengths
- `/mnt/data/src/pert-calculator/src/lib/clinical-config.ts` — Config loader + types
- `/mnt/data/src/pert-calculator/src/lib/clinical-config.json` — Clinical data source
- `/mnt/data/src/pert-calculator/src/lib/components/DosingCalculator.svelte` — Main calculator UI (~900 lines)
- `/mnt/data/src/pert-calculator/src/lib/tube-feed/` — Tube-feed specific data and logic

### Formula Calculator Source (port from)
- `/mnt/data/src/formula-calculator/src/lib/formula.ts` — Pure calculation functions
- `/mnt/data/src/formula-calculator/src/lib/formula-config.ts` — Config loader + types
- `/mnt/data/src/formula-calculator/src/lib/formula-config.json` — 40+ formula brands
- `/mnt/data/src/formula-calculator/src/lib/components/FormulaCalculator.svelte` — Mode switcher
- `/mnt/data/src/formula-calculator/src/lib/components/ModifiedFormulaCalculator.svelte` — Modified formula UI
- `/mnt/data/src/formula-calculator/src/lib/components/BreastMilkFortifierCalculator.svelte` — BMF UI
- `/mnt/data/src/formula-calculator/src/lib/components/BrandSelector.svelte` — Grouped brand dropdown

### Shared Components (built in Phase 2)
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/SelectPicker.svelte` — Unified picker with bits-ui
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/NumericInput.svelte` — Decimal input with validation
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/ResultsDisplay.svelte` — Clinical output with aria-live
- `/mnt/data/src/nicu-assistant/src/lib/shared/context.ts` — setCalculatorContext/getCalculatorContext

### Design System
- `/mnt/data/src/nicu-assistant/src/app.css` — OKLCH tokens, semantic colors, dark mode
- `/mnt/data/src/nicu-assistant/src/lib/shared/theme.svelte.ts` — Theme singleton

### Prior Phase Context
- `/mnt/data/src/nicu-assistant/.planning/phases/01-foundation/01-CONTEXT.md` — D-03 per-calculator accents
- `/mnt/data/src/nicu-assistant/.planning/phases/02-shared-components/02-CONTEXT.md` — D-06 Svelte context for accents

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/shared/components/` — SelectPicker, NumericInput, ResultsDisplay, DisclaimerModal, AboutSheet
- `src/lib/shared/context.ts` — setCalculatorContext/getCalculatorContext for accent colors
- `src/lib/shared/types.ts` — SelectOption, CalculatorId, CalculatorContext types
- `src/lib/shared/theme.svelte.ts` — Pattern reference for state.svelte.ts modules
- `src/routes/pert/+page.svelte` and `src/routes/formula/+page.svelte` — skeleton placeholders to replace

### Established Patterns
- Svelte 5 runes ($state, $derived, $effect) everywhere
- bits-ui for accessible primitives (SelectPicker already uses it)
- Semantic CSS tokens (bg-surface, text-primary, etc.) — no hardcoded colors
- Calculator context set via setCalculatorContext() in route page onMount

### Integration Points
- `src/routes/pert/+page.svelte` — replace skeleton with actual PERT calculator
- `src/routes/formula/+page.svelte` — replace skeleton with actual Formula calculator
- `src/lib/pert/` — new directory for PERT business logic + state
- `src/lib/formula/` — new directory for Formula business logic + state
- NavShell already handles routing and active tab

</code_context>

<specifics>
## Specific Ideas

- PERT calculator must support both meal and tube-feed modes with independent state per mode (exactly as standalone app)
- Formula calculator must support both modified and BMF modes
- All 5 FDA medication brands (Creon, Zenpep, Pancreaze, Pertzye, Viokace) must work in PERT
- All 40+ formula brands with manufacturer grouping must work in Formula
- sessionStorage keys should be namespaced: `nicu_pert_state`, `nicu_formula_state`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-calculators*
*Context gathered: 2026-04-01*
