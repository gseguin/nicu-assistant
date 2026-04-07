# Milestone v1.4 — UI Polish Requirements

**Goal:** Broad polish pass across both calculators and the shell — visual refinement, mobile UX, animation/feedback, accessibility deep-dive — guided by `.impeccable.md` as the design contract.

## Pending

### Picker (PICK) — shared SelectPicker rewrite

- [ ] **PICK-01**: User sees a custom-styled `<dialog>`-based modal picker (replacing bits-ui Select) wherever a SelectPicker is rendered
- [ ] **PICK-02**: User can open the picker, navigate options with keyboard (Arrow/Home/End/Enter/Esc), and the trigger refocuses on close
- [ ] **PICK-03**: User sees grouped options (e.g. formulas grouped by manufacturer) rendered with the new picker style
- [ ] **PICK-04**: User sees focus-visible outlines and selected-state styling that match `.impeccable.md` (warm clinical, OKLCH tokens, no hardcoded colors)
- [ ] **PICK-05**: User on mobile sees the picker fill the available width with comfortable touch targets (≥48 px) and safe-area-aware bottom padding
- [ ] **PICK-06**: No `bits-ui` `Select` imports remain anywhere in `src/`. Full `bits-ui` dependency removal deferred — `AboutSheet.svelte` and `DisclaimerModal.svelte` still consume `bits-ui` `Dialog` and will be ported in a later milestone phase.

### Fortification calculator (FORT)

- [ ] **FORT-01**: User on mobile sees "Target Calorie" and "Unit" pickers laid out on the same row
- [ ] **FORT-02**: User sees the "Amount to Add" hero card restyled to match morphine wean's result theming (typographic hierarchy, surface treatment, brand accent)
- [ ] **FORT-03**: User sees consistent spacing, typography, and empty-state styling across the Fortification calculator after the polish pass

### Morphine wean calculator (MORPH)

- [ ] **MORPH-01**: User sees the morphine wean calculator pass the same visual refinement sweep (spacing, typography, focus states, empty/loading states)
- [ ] **MORPH-02**: User sees the morphine wean calculator pick up the new shared SelectPicker without regressions

### Shell & navigation (SHELL)

- [ ] **SHELL-01**: User sees a polished title bar (info + theme buttons) consistent with `.impeccable.md`
- [ ] **SHELL-02**: User sees a polished bottom tab bar / top nav with refined active-state, hover, and focus styling
- [ ] **SHELL-03**: User sees a polished theme toggle and About sheet with consistent typography and motion

### Animation & feedback (ANIM)

- [ ] **ANIM-01**: User sees micro-animations (focus transitions, recalc affordances, hero updates) tuned for calm, not flashy
- [ ] **ANIM-02**: User with `prefers-reduced-motion: reduce` sees all non-essential motion disabled or reduced to instant transitions

### Accessibility deep-dive (A11Y)

- [ ] **A11Y-01**: User sees all interactive surfaces meet WCAG 2.1 AA contrast in both light and dark themes after a high-contrast review pass
- [ ] **A11Y-02**: Screen reader user can navigate both calculators and the shell with correct labels, live regions, and reading order
- [ ] **A11Y-03**: Keyboard-only user can reach every interactive surface, with visible focus and predictable tab order
- [ ] **A11Y-04**: axe-core e2e suite passes for both calculators in light + dark after the polish pass

## Future

- Native app builds (Capacitor) — still deferred
- Additional calculators beyond Morphine Wean + Fortification

## Out of Scope

- New calculation features — this is a polish-only milestone
- New libraries beyond what is already in the stack (no new component frameworks)
- Backend / accounts / telemetry — unchanged from project constraints

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PICK-01 | Phase 12 | Pending |
| PICK-02 | Phase 12 | Pending |
| PICK-03 | Phase 12 | Pending |
| PICK-04 | Phase 12 | Pending |
| PICK-05 | Phase 12 | Pending |
| PICK-06 | Phase 12 | Pending |
| FORT-01 | Phase 13 | Pending |
| FORT-02 | Phase 13 | Pending |
| FORT-03 | Phase 13 | Pending |
| MORPH-01 | Phase 14 | Pending |
| MORPH-02 | Phase 14 | Pending |
| SHELL-01 | Phase 15 | Pending |
| SHELL-02 | Phase 15 | Pending |
| SHELL-03 | Phase 15 | Pending |
| ANIM-01 | Phase 16 | Pending |
| ANIM-02 | Phase 16 | Pending |
| A11Y-01 | Phase 17 | Pending |
| A11Y-02 | Phase 17 | Pending |
| A11Y-03 | Phase 17 | Pending |
| A11Y-04 | Phase 17 | Pending |

**Coverage:** 20/20 requirements mapped.
