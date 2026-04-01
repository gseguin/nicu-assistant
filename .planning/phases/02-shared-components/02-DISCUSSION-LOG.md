# Phase 2: Shared Components - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 2-shared-components
**Areas discussed:** SelectPicker merge, Disclaimer content, Component API design, Testing approach

---

## SelectPicker Merge

### Picker Base

| Option | Description | Selected |
|--------|-------------|----------|
| Use bits-ui (Recommended) | Headless, accessible select/combobox primitives for Svelte 5. Style with Tailwind. | ✓ |
| Custom from PERT base | Start from PERT's native dialog, add grouping. More control, more work. | |
| You decide | Claude picks best approach | |

**User's choice:** bits-ui
**Notes:** Handles a11y, keyboard nav, focus trapping out of the box. We style it ourselves.

### Grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Optional groups prop | Flat list by default, pass groups to enable grouping | ✓ |
| You decide | Claude designs the API | |

**User's choice:** Optional groups prop

---

## Disclaimer Content

### Text Author

| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts it | Combined disclaimer based on both apps' text. User reviews before shipping. | ✓ |
| Use PERT's text | Start with PERT's disclaimer, add formula line | |
| I'll provide it | Specific text or clinical stakeholder provides | |

**User's choice:** Claude drafts it

### Review Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Ship with draft | Claude drafts, ship it, revise later | ✓ |
| Block on review | Don't ship until clinical stakeholder approves | |

**User's choice:** Ship with draft

---

## Component API Design

### API Style

| Option | Description | Selected |
|--------|-------------|----------|
| Props (Recommended) | Simple props for each config value | |
| Svelte context | Calculator pages set context; shared components read it | ✓ |
| You decide | Claude designs cleanest API | |

**User's choice:** Svelte context

### Genericity

**User's choice:** Shared components are clinical-specific, both calculators use directly (no wrapper layers)
**Notes:** User found the generic vs clinical-specific framing confusing. Simplified to: one shared component, both use it directly.

---

## Testing Approach

**User's choice:** Vitest for unit/component tests + Playwright for e2e + axe-core for a11y
**Notes:** Same pattern as both existing apps.

---

## Claude's Discretion

- bits-ui component selection
- AboutSheet content structure
- Disclaimer text wording
- Component file organization
- Whether to add /dev demo route

## Deferred Ideas

None — discussion stayed within phase scope
