# Phase 38: UI + State + Component Tests + Route + E2E + A11y - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** auto (all decisions are recommended defaults — review before planning if needed)

<domain>
## Phase Boundary

Build the complete Feed Advance Calculator UI — `FeedAdvanceCalculator.svelte` with SegmentedToggle (Bedside Advancement + Full Nutrition modes), all inputs/dropdowns/outputs, safety advisories, `state.svelte.ts`, component tests, Playwright happy-path E2E, and axe-core accessibility sweeps. Replace the `/feeds` placeholder with the real calculator.

**Not in scope:** Calculation functions (done in Phase 37), identity hue tokens (done in Phase 36), version bump or release (Phase 39).

</domain>

<decisions>
## Implementation Decisions

### Frequency Dropdown Expansion
- **D-01:** Extend `TrophicFrequency` type from `'q3h' | 'q4h'` to `'q2h' | 'q3h' | 'q4h' | 'q6h'` per FREQ-01. Add q2h (12 feeds/day) and q6h (4 feeds/day) to `feeds-config.json` dropdowns. Calculation functions are already parameterized by `feedsPerDay` — no formula changes needed.
- **D-02:** Default frequency remains `q3h` (matching xlsx parity fixture). Existing parity tests are not affected — they test specific divisors, not dropdown options.

### Component Architecture
- **D-03:** Single `FeedAdvanceCalculator.svelte` component with SegmentedToggle at top (per ARCHITECTURE.md §3). Two mode sections rendered via `{#if mode === 'bedside'}` / `{:else}`. Shared weight input always visible above the toggle.
- **D-04:** Component mirrors GIR pattern: imports calculations from `./calculations.js`, state from `./state.svelte.js`, config from `./feeds-config.json`. Uses `$derived` for reactive calculation results.
- **D-05:** Route `src/routes/feeds/+page.svelte` imports `FeedAdvanceCalculator` — thin wrapper matching `src/routes/gir/+page.svelte` pattern.

### State Management
- **D-06:** `state.svelte.ts` follows GIR state pattern exactly: sessionStorage-backed `$state` singleton with `init()`, `persist()`, `reset()` methods. Session key: `nicu_feeds_state`.
- **D-07:** State persists across route navigation (sessionStorage). Mode toggle preserves weight and all field values — switching modes just changes which fields render.

### Bedside Output Layout
- **D-08:** Three per-feed outputs (trophic, advance-step, goal) displayed as a vertical stack of labeled rows. Each row shows the ml/feed value as primary and ml/kg/d as secondary echo text. All three are equally prominent (CORE-05: no hero/secondary split).
- **D-09:** Total fluids rate (ml/hr) and IV backfill rate displayed below the three outputs in a separate section (IV-01, IV-02).
- **D-10:** IV backfill section framed as "Estimated IV rate to meet TFI" with institution-specific disclaimer (IV-02).

### Full Nutrition Layout
- **D-11:** Hero value: `total kcal/kg/d` — large numeral treatment matching GIR/Morphine hero pattern (FULL-05).
- **D-12:** TPN inputs grouped in a labeled fieldset: "TPN Line 1" (dex% + ml/hr) and "TPN Line 2" (dex% + ml/hr). Second line defaults to 0/0. Each line's inputs are side-by-side on the same row.
- **D-13:** Below TPN: SMOF ml input, then enteral inputs (volume ml + kcal/oz). Enteral kcal/oz uses a SelectPicker with standard options: 20, 22, 24, 27, 30 kcal/oz (FULL-03).
- **D-14:** Secondary outputs below hero: dextrose kcal, lipid kcal, enteral kcal, ml/kg total — displayed as a summary grid.

### Advisory Rendering
- **D-15:** Non-blocking inline advisory banners below the relevant input group. Reuse GIR advisory visual pattern: icon (AlertTriangle for warnings, Info for info) + message text, amber/blue coloring.
- **D-16:** Advisories are data-driven from `checkAdvisories()` pure function (Phase 37). Component maps triggered advisory IDs to rendered banners.
- **D-17:** Advisory appearance uses blur-gated timing from existing `showRangeHint` pattern — appears after user finishes editing, not mid-keystroke.

### Empty State
- **D-18:** When weight is blank: "Enter a weight to see per-feed volumes." centered text (CORE-08). No ghost zeros, no partial results.
- **D-19:** When weight is entered but other fields are at defaults: show results using default values (not blank). This matches GIR behavior where defaults produce immediate results.

### Rounding Convention
- **D-20:** Non-integer advances-per-day (e.g., "every 3rd feed" at q3h = 2.67/day) use floor rounding for clinical safety — always round down to the nearest integer advance event (FREQ-05). Document this in JSDoc.

### About Content
- **D-21:** Update `feeds` stub entry in `src/lib/shared/about-content.ts` with real calculator description citing `nutrition-calculator.xlsx` Sheet1/Sheet2 as source of truth.

### Testing Strategy
- **D-22:** Component tests (TEST-05) co-located at `src/lib/feeds/FeedAdvanceCalculator.test.ts`. Cover: empty state, bedside flow (enter weight → see outputs), full-nutrition flow (enter TPN → see kcal), mode toggle preserves weight, dropdown switching updates outputs, advisory rendering.
- **D-23:** Playwright E2E (TEST-06) at `e2e/feeds.spec.ts`. Happy-path at mobile 375 + desktop 1280 for both modes. Include `inputmode="decimal"` regression assertion on weight input.
- **D-24:** Playwright axe-core sweeps (TEST-07) at `e2e/feeds-a11y.spec.ts`. Light/dark × bedside/full-nutrition × focus state. Target: bring total suite to 20/20 green.

### Claude's Discretion
- Exact CSS/Tailwind class choices for layout, spacing, and responsive breakpoints — follow existing calculator patterns
- Whether TPN Line 2 has a visual "add second line" toggle or is always visible with 0/0 defaults — pick whichever is simpler
- Component test assertion style (exact text matching vs pattern matching) — follow GIR test pattern
- Ordering of inputs within each mode section — follow the natural clinical workflow order

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 37 Foundation (imports from)
- `src/lib/feeds/types.ts` — All type definitions (FeedsStateData, BedsideResult, FullNutritionResult, etc.)
- `src/lib/feeds/calculations.ts` — All pure functions to import (calculateBedsideAdvancement, calculateFullNutrition, checkAdvisories, etc.)
- `src/lib/feeds/feeds-config.json` — Clinical defaults, input ranges, dropdown options, advisory thresholds
- `src/lib/feeds/feeds-config.ts` — Typed config wrapper with resolveAdvanceEventsPerDay

### GIR Pattern (structural template for UI)
- `src/lib/gir/GirCalculator.svelte` — Calculator component pattern ($derived calculations, $effect persist, advisory flags)
- `src/lib/gir/state.svelte.ts` — State management pattern (sessionStorage singleton)
- `src/routes/gir/+page.svelte` — Route wrapper pattern

### Shared Components
- `src/lib/shared/components/SegmentedToggle.svelte` — Mode toggle component (generic, typed)
- `src/lib/shared/components/NumericInput.svelte` — Numeric input with range hints and decimal keyboard
- `src/lib/shared/components/SelectPicker.svelte` — Dropdown component

### E2E Test Patterns
- `e2e/gir.spec.ts` — Happy-path E2E pattern (viewport loop, disclaimer dismiss, input fill, hero assertion)
- `e2e/gir-a11y.spec.ts` — Axe-core sweep pattern
- `e2e/feeds-a11y.spec.ts` — Already exists from Phase 36 (placeholder sweeps — will need updating for real content)

### Identity + Shell
- `src/app.css` — `.identity-feeds` OKLCH tokens (Phase 36)
- `src/lib/shell/registry.ts` — Calculator registry entry (Phase 36)
- `src/lib/shared/about-content.ts` — `feeds` stub to update with real content

### Source of Truth
- `nutrition-calculator.xlsx` — Sheet1 (TPN full nutrition) + Sheet2 (bedside feeding advancement)

### Research
- `.planning/research/ARCHITECTURE.md` — §3 (data flow), §4 (state shape)
- `.planning/research/FEATURES.md` — Full requirement details including UI copy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SegmentedToggle` — shared component, generic typed, handles keyboard nav and ARIA
- `NumericInput` — shared component with `inputmode="decimal"`, blur-gated range hints, identity-aware styling
- `SelectPicker` — shared dropdown component
- `AlertTriangle`, `Info` icons from `@lucide/svelte` — already used in GIR advisories
- GIR calculator component — direct structural template for the feeds calculator

### Established Patterns
- Calculator component: `$derived(calculate(...state))` for reactive results
- State persistence: `$effect(() => { JSON.stringify(state); persist(); })` for change detection
- Advisory rendering: conditional `{#if showAdvisory}` blocks with icon + message
- Route wrapper: thin `+page.svelte` importing the calculator component
- E2E viewport loop: `for (const viewport of [mobile, desktop])` pattern

### Integration Points
- `src/routes/feeds/+page.svelte` — replace placeholder content with `FeedAdvanceCalculator` import
- `src/lib/shared/about-content.ts` — update `feeds` stub entry
- `src/lib/feeds/types.ts` — extend `TrophicFrequency` with q2h/q6h
- `src/lib/feeds/feeds-config.json` — add q2h/q6h to frequency dropdown

</code_context>

<specifics>
## Specific Ideas

- The bedside mode has NO single hero value — all three per-feed outputs (trophic, advance, goal) are equally important (CORE-05). This is unlike GIR (single hero) and morphine (single hero). The output section should feel like a results table, not a hero card.
- The full nutrition mode DOES have a hero: total kcal/kg/d (FULL-05). Use the same large-numeral treatment as GIR/morphine.
- FREQ-01 says "default to match xlsx parity — final choice locked in discuss-phase, recommendation q3h per FEATURES.md." D-02 locks default to q3h.
- FREQ-05 rounding convention (floor) needs documentation in the calculation code where `advanceEventsPerDay` is computed from frequency-relative cadences.
- The Phase 36 `e2e/feeds-a11y.spec.ts` already exists with placeholder sweeps — update it for real content rather than creating a new file.
- IV backfill (IV-01 through IV-03) is part of the bedside mode output section, not a separate mode.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 38-ui-state-component-tests-route-e2e-a11y*
*Context gathered: 2026-04-10*
