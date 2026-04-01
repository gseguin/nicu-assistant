# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 1-foundation
**Areas discussed:** Color unification, Theme persistence, Nav layout details, Scaffold approach

---

## Color Unification

### Color System

| Option | Description | Selected |
|--------|-------------|----------|
| OKLCH (Recommended) | Perceptually uniform, formula-calc already uses it. Convert PERT's hex values to OKLCH. | ✓ |
| Hex/RGB | Simpler, more familiar. Convert formula's OKLCH to hex. | |
| You decide | Claude picks what works best for dark/light parity | |

**User's choice:** OKLCH
**Notes:** Formula calculator already uses OKLCH; perceptually uniform is better for dark/light parity.

### Dark Mode Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Impeccable designs it | Delegate to Impeccable skill to create dark mode variants of Clinical Blue + BMF Amber | ✓ |
| Mirror PERT's approach | Use PERT's dark mode token pattern and extend to formula colors | |
| You decide | Claude picks the best approach combining both | |

**User's choice:** Impeccable designs it
**Notes:** Consistent with project-level decision to delegate UI design to Impeccable skill.

### Palette Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per-calculator accent | PERT routes use Clinical Blue, Formula routes use their Blue/Amber based on mode. Nav uses neutral shared accent. | ✓ |
| Shared Blue + Amber | Both colors available everywhere as part of the unified design system | |
| Single accent | Pick one accent color for the whole app | |

**User's choice:** Per-calculator accent
**Notes:** Each calculator keeps its visual identity; nav stays neutral.

---

## Theme Persistence

### Default Theme

| Option | Description | Selected |
|--------|-------------|----------|
| System preference | Follow OS dark/light setting, user can override | ✓ |
| Light | Start light (NICU is bright), user can switch to dark | |
| Dark | Start dark (matches PERT's current primary mode) | |

**User's choice:** System preference

### Toggle Placement

| Option | Description | Selected |
|--------|-------------|----------|
| In the nav bar | Small icon button (sun/moon) in the nav alongside calculator tabs | |
| Header area | Top-right corner of the page, separate from nav | |
| You decide | Claude places it where it fits best | |

**User's choice:** Other — "Refer to impeccable skill recommendation"
**Notes:** Toggle placement delegated to Impeccable skill during UI design phase.

### Storage Key

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Claude picks a sensible key name | ✓ |
| Let me specify | I have a preference for the key name | |

**User's choice:** You decide

---

## Nav Layout Details

### Tab Icons

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Claude picks appropriate Lucide icons for PERT (capsule/pill) and Formula (flask/beaker) | |
| Let me specify | I have specific icons in mind | |
| Impeccable decides | Delegate icon selection to Impeccable skill during UI phase | ✓ |

**User's choice:** Impeccable decides

### Placeholder Routes

| Option | Description | Selected |
|--------|-------------|----------|
| Simple label | Just the calculator name and 'Coming soon' text | |
| Skeleton cards | Loading skeleton that mimics the eventual calculator layout | ✓ |
| You decide | Claude picks a minimal placeholder approach | |

**User's choice:** Skeleton cards

---

## Scaffold Approach

### Starting Point

| Option | Description | Selected |
|--------|-------------|----------|
| Fresh scaffold | Run create-svelte, add dependencies manually. Clean start, no cruft. | ✓ |
| Clone formula-calc | Copy formula-calculator as base (newer Vite 8, OKLCH tokens). Strip calculator-specific code. | |
| Clone pert-calc | Copy pert-calculator as base (has dark mode, PWA config). Strip calculator-specific code. | |

**User's choice:** Fresh scaffold

### Vite Version

| Option | Description | Selected |
|--------|-------------|----------|
| Vite 8 (Recommended) | Formula-calc already runs on it. Latest features and fixes. | ✓ |
| Vite 7 | More conservative. PERT is proven on it. | |
| You decide | Claude picks based on compatibility testing | |

**User's choice:** Vite 8

---

## Claude's Discretion

- localStorage key name for theme preference
- Exact nav breakpoint value
- Placeholder skeleton card layout
- Tailwind @custom-variant dark mode syntax
- Plus Jakarta Sans loading strategy

## Deferred Ideas

None — discussion stayed within phase scope
