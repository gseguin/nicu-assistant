# Phase 3: Calculators - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-01
**Phase:** 3-calculators
**Areas discussed:** Code porting strategy, State preservation, Dark mode migration

---

## Code Porting Strategy

### Business Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Copy verbatim | Exact copies, no changes | |
| Adapt imports only | Copy but update import paths and types | ✓ |
| You decide | | |

### UI Components

| Option | Description | Selected |
|--------|-------------|----------|
| Port + refactor to shared | Replace pickers/inputs with Phase 2 shared components in one pass | ✓ |
| Copy then refactor | Two-pass approach | |
| You decide | | |

---

## State Preservation

**User's choice:** Module-level $state + sessionStorage
**Notes:** User asked about offline compatibility — confirmed sessionStorage works fully offline. Chose sessionStorage over localStorage because stale clinical inputs between sessions are a safety risk.

---

## Dark Mode Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate during port | Replace hardcoded colors with tokens in one pass | ✓ |
| Port first, migrate later | Two-pass approach | |
| You decide | | |

---

## Claude's Discretion

- File organization within calculator directories
- DosingCalculator splitting strategy
- Test placement and coverage
- Shared calculation utilities vs separate

## Deferred Ideas

None
