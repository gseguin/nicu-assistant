# Phase 5: Morphine Wean Calculator - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 05-morphine-wean-calculator
**Areas discussed:** Schedule table, Input defaults, Weaning endpoint, Mode switching UX

---

## Schedule Table Display

| Option | Description | Selected |
|--------|-------------|----------|
| Compact row | Two-line row per step: Step N — dose on line 1, reduction below. Vertical list. | |
| You decide | Claude picks the best mobile-friendly layout for clinical readability | ✓ |

**User's choice:** You decide (Claude's discretion)
**Notes:** User emphasized app is primarily used on mobile devices. No horizontal scrolling.

---

## Input Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Blank inputs | All fields start empty — forces intentional entry (safer for clinical use) | |
| Pre-filled defaults | Start with spreadsheet values (3.1 kg, 0.04, 10%) — faster for common cases | ✓ |
| You decide | Claude picks based on clinical safety patterns from existing calculators | |

**User's choice:** Pre-filled defaults
**Notes:** None

---

## Weaning Endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 10 steps | Always show exactly 10 steps like the spreadsheet | ✓ |
| Until near-zero | Generate steps until dose drops below a threshold | |
| Configurable | Add a 'number of steps' input so clinicians control it | |

**User's choice:** Fixed 10 steps
**Notes:** None

---

## Mode Switching UX

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle tabs | Two tabs at top of calculator (like PERT's meal/tube-feed) — familiar pattern | ✓ |
| SelectPicker | Use existing SelectPicker dialog component | |
| You decide | Claude picks based on existing app patterns | |

**User's choice:** Toggle tabs
**Notes:** Matches established pattern from PERT calculator

## Claude's Discretion

- Mobile-optimized schedule table layout
- Lucide icon selection for morphine wean calculator nav entry

## Deferred Ideas

None
