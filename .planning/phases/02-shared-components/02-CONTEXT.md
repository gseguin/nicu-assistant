# Phase 2: Shared Components - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a unified shared component library for both calculators: SelectPicker, DisclaimerModal, NumericInput, ResultsDisplay, AboutSheet. All components must work in both dark and light themes, meet WCAG 2.1 AA, and be ready for consumption by Phase 3 (calculator ports). No calculator business logic — just the shared UI primitives.

</domain>

<decisions>
## Implementation Decisions

### SelectPicker Merge
- **D-01:** Use bits-ui as the base for SelectPicker. It provides headless, accessible select/combobox primitives for Svelte 5. We style it with Tailwind using our design tokens.
- **D-02:** SelectPicker supports optional option grouping via a groups prop. Flat list by default (PERT use case), grouped by manufacturer when groups are provided (formula use case). Same component for both.

### Disclaimer Content
- **D-03:** Claude drafts a combined medical disclaimer covering both PERT dosing and formula calculations. Based on both existing apps' disclaimer text.
- **D-04:** Ship with the draft text — no blocking clinical review gate. Revise later if stakeholder feedback requires changes.
- **D-05:** New localStorage key: `nicu_assistant_disclaimer_v1`. Does not inherit acceptance from either standalone app.

### Component API Design
- **D-06:** Use Svelte context for calculator-specific config (accent color, calculator identity). Calculator pages set context; shared components read it. Reduces prop drilling.
- **D-07:** Shared components are clinical-specific — built for clinical use (decimal keyboard, units display, large result typography). Not a generic component library. Both calculators use them directly, no wrapper layers.

### Testing Approach
- **D-08:** Vitest for unit and component tests. Playwright for e2e tests including a11y via axe-core. Same pattern as both existing apps.

### Claude's Discretion
- bits-ui component selection (which primitives to use for SelectPicker, Dialog, etc.)
- AboutSheet content structure (unified vs per-calculator via calculatorId prop)
- Exact disclaimer text wording
- Component file organization within src/lib/shared/
- Whether to add a /dev demo route for visual component testing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Component Implementations (source of truth for behavior)
- `/mnt/data/src/pert-calculator/src/lib/components/SelectPicker.svelte` — Native dialog picker with ARIA keyboard nav, arrow keys, focus management
- `/mnt/data/src/pert-calculator/src/lib/components/DisclaimerModal.svelte` — Medical disclaimer with localStorage persistence
- `/mnt/data/src/pert-calculator/src/lib/components/AboutSheet.svelte` — Info dialog with focus restore
- `/mnt/data/src/formula-calculator/src/lib/components/SelectPicker.svelte` — Positioned overlay with manufacturer grouping, Svelte transitions
- `/mnt/data/src/formula-calculator/src/lib/components/DisclaimerModal.svelte` — Disclaimer with different localStorage key
- `/mnt/data/src/formula-calculator/src/lib/components/NumericInput.svelte` — Decimal input with wheel scroll, min/max, error display
- `/mnt/data/src/formula-calculator/src/lib/components/ResultsDisplay.svelte` — Large clinical typography with aria-live
- `/mnt/data/src/formula-calculator/src/lib/components/AboutSheet.svelte` — Info panel

### Design System (already built in Phase 1)
- `/mnt/data/src/nicu-assistant/src/app.css` — OKLCH tokens, semantic colors, dark mode @custom-variant, .card and .num classes
- `/mnt/data/src/nicu-assistant/src/lib/shared/theme.svelte.ts` — Theme singleton for dark/light

### Phase 1 Context (prior decisions that apply)
- `/mnt/data/src/nicu-assistant/.planning/phases/01-foundation/01-CONTEXT.md` — D-01 OKLCH, D-02 Impeccable dark mode, D-03 per-calculator accents

### Research
- `/mnt/data/src/nicu-assistant/.planning/research/ARCHITECTURE.md` — Component merge strategy, shared library pattern
- `/mnt/data/src/nicu-assistant/.planning/research/PITFALLS.md` — SelectPicker merge risks, DisclaimerModal localStorage conflicts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/shared/theme.svelte.ts` — Theme singleton, components can import to check current theme
- `src/app.css` — Semantic color tokens (--color-surface, --color-accent, etc.) and component classes (.card, .num)
- Both existing SelectPicker implementations — behavior reference for keyboard nav (PERT) and grouping (formula)

### Established Patterns
- Svelte 5 runes ($state, $derived, $effect) for all reactivity
- Native HTML `<dialog>` for modals in PERT (formula uses div overlay — unified app should use dialog or bits-ui)
- Tailwind utility classes with semantic token references (bg-surface, text-primary, etc.)
- 48px minimum touch targets on all interactive elements

### Integration Points
- `src/lib/shared/` — where new components live (alongside theme.svelte.ts)
- `src/routes/+layout.svelte` — DisclaimerModal mounts here (shown on first load before any route)
- Calculator routes (Phase 3) will import shared components from `$lib/shared/`
- Svelte context set by calculator page → read by shared components for accent color

</code_context>

<specifics>
## Specific Ideas

- bits-ui for accessible primitives — don't reinvent keyboard nav, focus trapping, ARIA roles
- DisclaimerModal must be dismissable only via explicit acknowledgment (button click), not Escape key or backdrop click
- NumericInput should support `inputmode="decimal"` for mobile decimal keyboards
- ResultsDisplay needs `aria-live="polite" aria-atomic="true"` for screen reader announcements

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-shared-components*
*Context gathered: 2026-04-01*
