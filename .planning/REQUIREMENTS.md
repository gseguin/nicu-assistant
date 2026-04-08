# Requirements — v1.5 Tab Identity & Search

**Milestone goal:** Give each calculator tab a unified-but-distinct visual identity and make the Formula picker searchable so clinicians orient instantly and find a formula in under a second.

## v1.5 Requirements

### Search (Formula picker)

- [x] **SEARCH-01**: User can type to filter formulas in the Formula picker by both label and detail/manufacturer text (case-insensitive substring match).
- [x] **SEARCH-02**: User sees a "No matches" empty state inside the picker dialog when the search query filters out every option.
- [x] **SEARCH-03**: User can keyboard-navigate between the search input and the filtered list — ArrowDown from the input jumps to the first option; ArrowUp from the first option returns to the input.
- [x] **SEARCH-04**: User can press Enter in the search input to select the single remaining option when exactly one match is filtered.
- [x] **SEARCH-05**: The `searchable` prop on the shared `SelectPicker` is opt-in; Morphine-tab pickers and any non-Formula consumer remain unchanged (no search affordance rendered).
- [x] **SEARCH-06**: Search query resets to empty every time the picker reopens; focus lands on the search input on open when `searchable` is true.

### Tab Identity

- [ ] **IDENT-01**: A new `--color-identity` CSS custom property is defined for both light and dark themes, scoped per calculator route (Morphine = Clinical Blue 220, Formula = new Teal ~195).
- [ ] **IDENT-02**: The Morphine and Formula result hero cards pick up `--color-identity` (background and/or large numeric color) so the displayed result instantly signals which tab the user is in.
- [ ] **IDENT-03**: Focus-visible outlines on inputs, buttons, and pickers inside a calculator body use `--color-identity` so keyboard focus reinforces tab identity.
- [ ] **IDENT-04**: Section eyebrow labels (e.g. "Step", "Target calorie") within a calculator use `--color-identity`.
- [ ] **IDENT-05**: The active calculator tab in the responsive nav (bottom bar on mobile, top nav on desktop) uses `--color-identity` for its active indicator.
- [ ] **IDENT-06**: BMF Amber remains scoped exclusively to the fortifier-mode semantic signal and is NOT reused as Formula-tab identity — switching to fortifier mode still reads as a distinct in-tab state.
- [ ] **IDENT-07**: Shell chrome (title bar, app name, theme toggle, info button, body text, input borders, surface tokens) stays on neutral/global tokens and does NOT pick up `--color-identity`.

### Accessibility

- [ ] **A11Y-01**: Every surface that uses `--color-identity` meets WCAG 2.1 AA contrast in both light and dark mode, verified via the existing axe-core sweep (color-contrast rule enabled).
- [ ] **A11Y-02**: The new teal hue passes 4.5:1 for text/icon usage and 3:1 for non-text UI (focus rings, indicators) against its adjacent surface tokens in both themes.
- [x] **A11Y-03**: Searchable picker keyboard interactions (SEARCH-03, SEARCH-04) are covered by a component test or E2E test asserting ArrowDown/ArrowUp traversal and Enter-to-select-single-match.

## Future Requirements

- Identity tokens for a third calculator when one is added (apply same pattern).
- Persisted "recent formulas" at the top of the picker.
- Fuzzy matching / typo tolerance in search (currently plain substring).

## Out of Scope (v1.5)

- Full `--color-accent` replacement by `--color-identity` — `--color-accent` remains as global fallback for shell chrome and non-identity surfaces.
- Recoloring buttons, input borders, picker check marks, or body icons with identity hue — these stay neutral to preserve "warm restraint."
- New calculators.
- Server-side search or remote formula catalog.
- Animation/transition for identity color swap on tab change (deferred; instant swap is acceptable).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEARCH-01 | Phase 18 | Complete |
| SEARCH-02 | Phase 18 | Complete |
| SEARCH-03 | Phase 18 | Complete |
| SEARCH-04 | Phase 18 | Complete |
| SEARCH-05 | Phase 18 | Complete |
| SEARCH-06 | Phase 18 | Complete |
| IDENT-01 | Phase 19 | Pending |
| IDENT-02 | Phase 19 | Pending |
| IDENT-03 | Phase 19 | Pending |
| IDENT-04 | Phase 19 | Pending |
| IDENT-05 | Phase 19 | Pending |
| IDENT-06 | Phase 19 | Pending |
| IDENT-07 | Phase 19 | Pending |
| A11Y-01 | Phase 20 | Pending |
| A11Y-02 | Phase 20 | Pending |
| A11Y-03 | Phase 18 | Complete |

**Coverage:** 16/16 v1.5 requirements mapped ✓

---
*Last updated: 2026-04-07 — v1.5 roadmap created, traceability populated*
