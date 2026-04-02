# Phase 6: Quality & Accessibility - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the morphine wean calculator against known spreadsheet values (row-by-row parity) and validate accessibility through automated axe-core scanning. Also add component-level tests for the MorphineWeanCalculator Svelte component.

</domain>

<decisions>
## Implementation Decisions

### Test Scope
- **D-01:** Add spreadsheet parity tests: verify exact values from Sheet1 (linear mode) and Sheet2 (compounding mode) of `morphine-wean-calculator.xlsx`, row-by-row match for all 10 steps with default inputs (weight=3.1, maxDose=0.04, decreasePct=0.10).
- **D-02:** Add component tests for MorphineWeanCalculator.svelte: mode switching between Linear/Compounding tabs, input validation behavior, schedule rendering with correct step count, and that shared NumericInput components are used.
- **D-03:** 12 unit tests for calculation functions already pass from Phase 5 — do not duplicate, only extend with spreadsheet parity and component coverage.

### Accessibility Audit
- **D-04:** Automated accessibility only — run axe-core via Playwright on the morphine wean page. Catches WCAG 2.1 AA contrast issues, missing ARIA attributes, landmark problems, and touch target sizing.
- **D-05:** No manual keyboard nav or screen reader testing in this phase — automated scanning is sufficient.

### Claude's Discretion
- Test file organization and naming conventions
- Specific Playwright test structure for axe-core integration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reference Data
- `morphine-wean-calculator.xlsx` — Source of truth for expected values. Sheet1 rows 15-24 = linear mode 10 steps. Sheet2 rows 14-23 = compounding mode 10 steps. Both use weight=3.1, maxDose=0.04 (Sheet1) or 0.08 (Sheet2), decreasePct=0.10.

### Existing Tests
- `src/lib/morphine/calculations.test.ts` — 12 existing unit tests for calculation functions (do not duplicate)
- `src/lib/shared/__tests__/shared-components.test.ts` — Pattern for component testing

### Component Under Test
- `src/lib/morphine/MorphineWeanCalculator.svelte` — The calculator component to test
- `src/lib/morphine/morphine-config.json` — Config file with defaults and step count
- `src/lib/morphine/calculations.ts` — Calculation functions under test
- `src/lib/morphine/types.ts` — Type definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calculations.test.ts`: Already tests both modes with default values and edge cases — extend, don't replace
- `shared-components.test.ts`: Pattern for Vitest + @testing-library/svelte component tests
- Existing Playwright config: Check if e2e directory exists for axe-core integration

### Established Patterns
- Vitest for unit and component tests (Phase 2 D-08)
- Test files co-located or in `__tests__/` directories
- `@testing-library/jest-dom` for DOM assertions

### Integration Points
- Playwright axe-core test needs the dev server running
- Component tests import from `$lib/morphine/` path aliases

</code_context>

<specifics>
## Specific Ideas

### Spreadsheet Reference Values (for parity tests)

**Linear mode (Sheet1)** — weight=3.1, maxDose=0.04, decrease=10%:
| Step | Dose (mg) | Dose (mg/kg/dose) | Reduction (mg) |
|------|-----------|-------------------|----------------|
| 1 | 0.124 | 0.04 | 0 |
| 2 | 0.1116 | 0.036 | 0.0124 |
| 3 | 0.0992 | 0.032 | 0.0124 |
| ... | ... | ... | 0.0124 |
| 10 | 0.0124 | 0.004 | 0.0124 |

**Compounding mode (Sheet2)** — weight=3.1, maxDose=0.08, decrease=10%:
| Step | Dose (mg) | Dose (mg/kg/dose) | Reduction (mg) |
|------|-----------|-------------------|----------------|
| 1 | 0.248 | 0.08 | 0 |
| 2 | 0.2232 | 0.072 | 0.0248 |
| 3 | 0.2009 | 0.0648 | 0.0223 |
| ... | ... | ... | decreasing |
| 10 | 0.0961 | 0.031 | 0.0107 |

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-quality-accessibility*
*Context gathered: 2026-04-02*
