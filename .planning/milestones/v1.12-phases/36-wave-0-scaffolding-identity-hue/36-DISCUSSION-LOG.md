# Phase 36: Wave 0 — Scaffolding + Identity Hue - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 36-wave-0-scaffolding-identity-hue
**Areas discussed:** Icon choice, Identity hue, Placeholder content, Tab label
**Mode:** --auto (all areas auto-selected, recommended defaults chosen)

---

## Icon Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Baby | Distinct from Syringe/Milk/Droplet, unambiguous clinical subject, verified in @lucide/svelte | ✓ |
| Utensils | Adult-dining register, wrong semantics for NICU | |
| Wheat | Too abstract for clinical context | |

**User's choice:** Baby (auto-selected: recommended default from STACK.md)
**Notes:** Verified present in installed @lucide/svelte package.

---

## Identity Hue

| Option | Description | Selected |
|--------|-------------|----------|
| Hue ~30 (Warm Terracotta) | Maximal separation from 145/195/220 (Δ≥115°), nutrition-semantic, avoids error-red | ✓ |
| Hue ~300 (Magenta) | Good separation but cold tone for nutrition | |
| Hue ~285 (Violet) | Less separation from blue-220, no nutrition semantics | |

**User's choice:** Hue ~30 Warm Terracotta (auto-selected: recommended by ARCHITECTURE.md + STACK.md)
**Notes:** Starting OKLCH values provided; axe sweep is hard gate before completion.

---

## Placeholder Content

| Option | Description | Selected |
|--------|-------------|----------|
| "Coming soon" placeholder | Centered text with identity hue, matches GIR v1.8 Wave 0 | ✓ |
| Empty page | No content, just the route exists | |
| Full skeleton | Wireframe of the eventual UI — premature for Wave 0 | |

**User's choice:** "Coming soon" placeholder (auto-selected: recommended, matches prior Wave 0 pattern)
**Notes:** None.

---

## Tab Label

| Option | Description | Selected |
|--------|-------------|----------|
| Feeds | Short, fits mobile width, matches /feeds route | ✓ |
| Feed Advance | More descriptive but longer, may cramp 4-tab mobile nav | |
| Nutrition | Too broad — could imply growth/macro tracking | |

**User's choice:** Feeds (auto-selected: recommended, consistent with existing naming)
**Notes:** None.

---

## Claude's Discretion

- Placeholder page layout details (typography, spacing, icon inclusion)
- Import style for Baby icon in registry.ts

## Deferred Ideas

None.
