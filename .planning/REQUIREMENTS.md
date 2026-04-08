# Requirements — v1.6 Toggle & Harden

**Milestone goal:** Resolve the "two patterns for one decision" inconsistency between calculators, and harden the input layer so out-of-range values can't slip through silently.

## v1.6 Requirements

### Shared SegmentedToggle (from /critique P1: Consistency)

- [ ] **TOG-01**: A new shared `SegmentedToggle` component exists in `src/lib/shared/components/` with a 2–N option API consistent with `SelectPicker` (label, options, value binding).
- [ ] **TOG-02**: The `SegmentedToggle` active segment renders using `var(--color-identity)` so it picks up the per-tab identity hue automatically (Clinical Blue in Morphine, Teal in Formula).
- [ ] **TOG-03**: The `SegmentedToggle` supports keyboard navigation: `←` / `→` move between segments, `Home` / `End` jump to first/last, and the active state is reflected via `aria-pressed` or `role="tab"` ARIA semantics matching Morphine's existing tablist pattern.
- [ ] **TOG-04**: Morphine `MorphineWeanCalculator.svelte` consumes the shared `SegmentedToggle` for the Linear/Compounding mode switch with no behavior change. The inline tablist code is removed.
- [ ] **TOG-05**: Formula `FortificationCalculator.svelte` uses `SegmentedToggle` for the `Base` choice (Breast milk / Formula) instead of `SelectPicker`. The old `Base` SelectPicker option list is removed.
- [ ] **TOG-06**: Existing morphine and fortification tests still pass. Morphine mode switching behavior is unchanged from v1.5; Formula base switching behavior is unchanged from v1.5.

### NumericInput Hardening (from /critique P1: Error Prevention)

- [ ] **HARD-01**: `NumericInput` accepts optional `min` and `max` props.
- [ ] **HARD-02**: When `min` and/or `max` are provided, a small range hint renders under the input (e.g. `0.5–10 kg`) using existing `text-tertiary` typography.
- [ ] **HARD-03**: On blur, if the entered value is outside the `min..max` range, the field shows an inline message ("Outside expected range — verify") in `var(--color-error)`. The value is NOT auto-clamped — the user keeps typing freedom; the message is advisory only.
- [ ] **HARD-04**: When the entered value returns to within range on subsequent edits, the inline message clears immediately.
- [ ] **HARD-05**: All Morphine and Formula `NumericInput` instances are wired with their clinical ranges sourced from existing JSON config files (`morphine-config.json`, `fortification-config.json`). No magic numbers in component code.
- [ ] **HARD-06**: Component tests assert: hint renders when min/max provided, blur outside range shows message, blur back inside range clears it, no auto-clamp.

### Result Feedback (from /critique P1: Result Appears Silently)

- [ ] **FEED-01**: The result hero number element in both `MorphineWeanCalculator.svelte` and `FortificationCalculator.svelte` carries `aria-live="polite"` and `aria-atomic="true"` so screen readers announce the new value when calculations update.
- [ ] **FEED-02**: When the result transitions from hidden to visible (or value changes), the hero scales from 95% → 100% over ~200ms. The transition is gated by the existing `prefers-reduced-motion: reduce` constant pattern (matches v1.4 motion audit).
- [ ] **FEED-03**: The transition does NOT auto-scroll the page or steal focus. Users stay in input flow.

### Accessibility

- [ ] **A11Y-01**: WCAG 2.1 AA contrast holds for the new `SegmentedToggle` active and inactive segments in both light and dark modes, both tabs (Clinical Blue + Teal identity), via the existing axe-core sweep.
- [ ] **A11Y-02**: WCAG 2.1 AA contrast holds for the new range hint text and the inline error message in both themes.
- [ ] **A11Y-03**: SegmentedToggle keyboard interactions (TOG-03) covered by component tests.

## Future Requirements

- Reset button on each calculator (P2 deferred from v1.6 critique)
- "Verify against your protocol" microcopy under each result hero (P2 deferred)
- Inline tooltip definitions for clinical units like "mg/kg/dose" and "kcal/oz" for new staff (P3)
- Keyboard shortcut to switch tabs (1/2 or ←/→) — power user efficiency (P3)
- Theme toggle 150ms transition (P3 polish)

## Out of Scope (v1.6)

- Replacing `SelectPicker` itself — it stays for the formula picker (30+ options) and any future N-of-many choice. SegmentedToggle is for 2–4 option choices only.
- Auto-clamping out-of-range values — advisory message only, never overwrite the user's input.
- New calculators.
- Server-side validation or remote range catalog.
- Reset / undo affordances (deferred to a future polish milestone).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOG-01 | Phase 21 | Pending |
| TOG-02 | Phase 21 | Pending |
| TOG-03 | Phase 21 | Pending |
| TOG-04 | Phase 21 | Pending |
| TOG-05 | Phase 21 | Pending |
| TOG-06 | Phase 21 | Pending |
| HARD-01 | Phase 22 | Pending |
| HARD-02 | Phase 22 | Pending |
| HARD-03 | Phase 22 | Pending |
| HARD-04 | Phase 22 | Pending |
| HARD-05 | Phase 22 | Pending |
| HARD-06 | Phase 22 | Pending |
| FEED-01 | Phase 23 | Pending |
| FEED-02 | Phase 23 | Pending |
| FEED-03 | Phase 23 | Pending |
| A11Y-01 | Phase 24 | Pending |
| A11Y-02 | Phase 24 | Pending |
| A11Y-03 | Phase 21 | Pending |

**Coverage:** 18/18 v1.6 requirements mapped.

---
*Last updated: 2026-04-07 — v1.6 requirements defined*
