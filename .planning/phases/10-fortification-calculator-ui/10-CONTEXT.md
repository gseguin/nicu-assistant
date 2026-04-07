# Phase 10: Fortification Calculator UI - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning
**Source:** /gsd-discuss-phase fast-track (manufacturer mapping discussed; all other gray areas use defaults)

<domain>
## Phase Boundary

This phase builds the Svelte UI for the unified fortification calculator. It consumes the pure `calculateFortification(inputs)` API delivered in Phase 9 and renders it at the existing `/formula` route. The old Modified Formula and BMF code remains untouched in `src/lib/formula/` — Phase 11 deletes it.

**In scope:**
- New Svelte component `src/lib/fortification/FortificationCalculator.svelte`
- New state singleton `src/lib/fortification/state.svelte.ts` (sessionStorage-backed, mirrors morphine pattern)
- Update `src/routes/formula/+page.svelte` to render the new component
- Update calculator registry entry for Formula calculator
- Update About sheet content to describe the unified Fortification calculator
- Component tests for the new calculator

**Out of scope (Phase 11):**
- Deleting `src/lib/formula/`
- Removing legacy state singleton, components, tests
- axe-core accessibility audit (Phase 11)
- The pre-existing tsc errors in `src/lib/shell/NavShell.test.ts` (predates v1.3, separate concern)

</domain>

<decisions>
## Implementation Decisions

### Manufacturer Mapping (DISCUSSED)

The 17 unmapped formulas in `src/lib/fortification/fortification-config.json` have been patched with manufacturer values during this discuss-phase session. Final distribution: Abbott 12, Mead Johnson 11, Nestlé 5, Nutricia 2 = 30 formulas across 4 manufacturers. The SelectPicker for Formula Selection uses these manufacturer values for grouped rendering.

Mapping applied:
- **Abbott** (12): EleCare, PediaSure, PediaSure Peptide, Similac 360 Total Care, Similac Advance, Similac Alimentum, Similac HMF, Similac Isomil, Similac NeoSure, Similac Pro-Advance, Similac Sensitive, Similac Total Comfort
- **Mead Johnson** (11): Enfamil A.R, Enfamil EnfaCare, Enfamil Gentlease, Enfamil Infant, Enfamil NeuroPro, Enfamil ProSobee, Enfamil Reguline, Nutramigen, Portagen, Pregestimil, Puramino Infant
- **Nestlé** (5): Alfamino Infant, Boost Kid Essentials, Gerber Good Start, Peptamen Junior, Vivonex Pediatric
- **Nutricia** (2): Monogen, Neocate Infant

### State Persistence (DEFAULT)

Match the morphine pattern: `state.svelte.ts` singleton with `$state` rune backed by sessionStorage. Restores on mount, persists on every change. Mirror the file shape of `src/lib/morphine/state.svelte.ts`.

### Default Inputs on First Load (DEFAULT)

Use the values from the spreadsheet's Inputs block (cells G3-G7 of recipe-calculator.xlsx Calculator tab):
- Base: `breast-milk`
- Starting Volume: `180` mL
- Formula: `neocate-infant` (id from fortification-config.json)
- Target Calorie: `24` kcal/oz
- Unit: `teaspoons`

These defaults make the documented parity case (2 tsp / 183.5 mL / 23.51 kcal/oz / "180 (6.1 oz)") visible immediately on first load — useful as a smoke test.

### Layout Structure (DEFAULT)

Single primary "Amount to Add" hero card with the value in large bold tabular numerals (matching morphine's result card). Three secondary outputs (Yield mL, Exact kcal/oz, Suggested Starting Volume) appear in a verification card below the hero. Inputs stack above on mobile and to the side on desktop, mirroring morphine's responsive layout.

The hero card displays: amountToAdd value + unit label (e.g. "2 Teaspoons"). The secondary card displays: "Yield: 183.5 mL", "Exact: 23.5 kcal/oz", "Suggested start: 180 (6.1 oz)".

### Packets-Not-Allowed UX — UI-03 (DEFAULT)

When the user selects Packets with a non-HMF formula, **disable the Packets option in the unit picker** when the current formula isn't Similac HMF. This is the cleanest UX — no error state, no silent zero. If the user has Packets selected and switches to a non-HMF formula, the unit auto-resets to Teaspoons (the spreadsheet default).

Fall-back if disabling proves too aggressive during implementation: show an inline message below the unit picker reading "Packets is only available for Similac HMF" and keep the Amount to Add output suppressed (not zero).

The Phase 10 plan should attempt the disable approach first. If component constraints make it impractical, fall back to inline message.

### kcal/oz Input UX (DEFAULT)

Use SelectPicker with a flat list of 5 options (22, 24, 26, 28, 30) for visual consistency with the other dropdowns (Base, Formula, Unit). Do not use radio segmented buttons.

### Live Update Semantics (DEFAULT)

Recalculate outputs on every input change (no debounce, no blur trigger). `calculateFortification` is pure and microsecond-fast — debouncing adds complexity for no user benefit. Match morphine's recalculation pattern.

### Magnification Animation (DEFAULT)

No magnification effect. The dock-style scroll magnification added in v1.2 was specific to morphine's 10-step schedule cards. Fortification has 4 stacked outputs that fit on one screen — magnification doesn't apply. Use plain card layout.

### File Layout (LOCKED — mirrors morphine)

```
src/lib/fortification/
  types.ts                      (existing — Phase 9)
  fortification-config.json     (existing — Phase 9, manufacturers patched)
  fortification-config.ts       (existing — Phase 9)
  fortification-config.test.ts  (existing — Phase 9)
  calculations.ts               (existing — Phase 9)
  calculations.test.ts          (existing — Phase 9)
  state.svelte.ts               (NEW — sessionStorage singleton)
  FortificationCalculator.svelte (NEW — main component)
  FortificationCalculator.test.ts (NEW — component tests)
```

Route file: `src/routes/formula/+page.svelte` (existing — replace its content with `<FortificationCalculator />`).

### Component Reuse (LOCKED — UI-04)

Use only existing shared components from `src/lib/shared/components/`:
- `NumericInput` — for Starting Volume (mL), with min/max bounds
- `SelectPicker` — for Base, Formula Selection (grouped by manufacturer), Target Calorie, Unit Selection

No new component primitives. The disabled-option behavior (UI-03 packets-disable) must be achievable with the existing SelectPicker — if it isn't, the planner should flag this as a blocker before execution.

### Theming (LOCKED — UI-05)

All colors via existing OKLCH design tokens (Clinical Blue, slate neutrals). No hardcoded colors. Renders correctly in both light and dark themes.

### Accessibility (LOCKED — project standard)

WCAG 2.1 AA, 48px touch targets, ARIA labels on all inputs, screen-reader-friendly result announcement via `aria-live` on the output card (matches morphine pattern). Phase 10 includes a baseline a11y check in component tests; full Playwright axe-core audit is Phase 11.

### Out of Scope for Phase 10

- Deleting any code from `src/lib/formula/` (Phase 11)
- Modifying the calculator registry's PERT/morphine entries (only the Formula entry)
- Changing Phase 9's calculation logic, types, or config structure
- Adding new shared components
- Print/export functionality (out of scope for v1.3 entirely)
- Per-brand kcal/oz constraints (deferred to Future Requirements)
- Saving favorites or recently-used formulas (deferred)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pattern reference (mirror this exactly)

- `src/lib/morphine/state.svelte.ts` — sessionStorage singleton pattern
- `src/lib/morphine/MorphineWeanCalculator.svelte` — component structure, layout, ARIA, theming
- `src/lib/morphine/MorphineWeanCalculator.test.ts` — component test pattern (vitest + jsdom + Svelte 5 runes)

### Phase 9 contract (do not modify)

- `src/lib/fortification/types.ts` — input/output types
- `src/lib/fortification/calculations.ts` — `calculateFortification(inputs)` API
- `src/lib/fortification/fortification-config.ts` — `getFormulaById`, formula list

### Shared components (consume only, do not modify)

- `src/lib/shared/components/NumericInput.svelte`
- `src/lib/shared/components/SelectPicker.svelte`

### Routing and registry

- `src/routes/formula/+page.svelte` — replace contents
- `src/lib/shell/registry.ts` — Formula calculator entry (update label/description if needed)
- `src/lib/shared/about-content.ts` — About sheet copy for Formula calculator

### Project conventions

- `CLAUDE.md` — test colocation, no mocks, no new deps, no emojis
- `.planning/PROJECT.md` — design principles (warm clinical, restraint, OKLCH tokens)

</canonical_refs>

<specifics>
## Specific Ideas

### Result card layout (visual reference)

```
┌──────────────────────────────────────┐
│  AMOUNT TO ADD                       │
│                                      │
│       2 Teaspoons                    │  ← large bold tabular numeral
│                                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Verification                        │
│                                      │
│  Yield              183.5 mL         │
│  Exact              23.5 kcal/oz     │
│  Suggested start    180 (6.1 oz)     │
└──────────────────────────────────────┘
```

### Recalculation pulse (optional)

The v1.2 polish phase added a recalculation pulse animation to morphine. Phase 10 may inherit this if the planner thinks it adds value, but it's not a requirement. Skip if it complicates implementation.

### Packets disable behavior (concrete UX)

When formula = `similac-hmf`: all 5 unit options available.
When formula ≠ `similac-hmf`: Packets option appears with `disabled` attribute and grayed-out styling. If the user had Packets selected before switching formulas, the unit resets to `teaspoons` and a brief inline note appears: "Packets unavailable for this formula".

</specifics>

<deferred>
## Deferred Ideas

- Per-brand allowed kcal/oz constraints (Future Requirements in REQUIREMENTS.md)
- Recipe sharing / printing / export (project-level Out of Scope)
- Saving recently-used formulas as favorites (Future Requirements)
- Pre-existing tsc errors in `src/lib/shell/NavShell.test.ts` — separate concern, not v1.3

</deferred>

---

*Phase: 10-fortification-calculator-ui*
*Context gathered: 2026-04-07 via /gsd-discuss-phase fast-track*
