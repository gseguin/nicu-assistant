# Phase 6: Quality & Accessibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 06-quality-accessibility
**Areas discussed:** Test scope, A11y audit depth

---

## Test Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Spreadsheet parity | Row-by-row match of xlsx values | |
| Component tests | Test MorphineWeanCalculator component | |
| Both | Spreadsheet parity + component tests | ✓ |
| You decide | Claude picks additional coverage | |

**User's choice:** Both
**Notes:** 12 unit tests already exist from Phase 5

---

## A11y Audit Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Automated only | axe-core via Playwright | ✓ |
| Manual + automated | axe-core + keyboard nav + screen reader | |
| You decide | Claude picks | |

**User's choice:** Automated only
**Notes:** None

## Claude's Discretion

- Test file organization and naming
- Playwright test structure for axe-core

## Deferred Ideas

None
