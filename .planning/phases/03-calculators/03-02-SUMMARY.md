---
phase: 03-calculators
plan: 02
subsystem: calculators
tags: [pert, dosing-calculator, svelte-components, shared-components, state-persistence, refactor]

# Dependency graph
requires:
  - phase: 03-calculators
    plan: 01
    provides: PERT business logic, medications data, state.svelte.ts singleton, clinical-config
  - phase: 02
    provides: Shared SelectPicker, NumericInput, ResultsDisplay, context.ts
provides:
  - DosingCalculator.svelte component with meal and tube-feed modes
  - /pert route rendering full PERT calculator
affects:
  - src/routes/pert/+page.svelte (replaced skeleton with live calculator)

# Tech stack
added: []
patterns:
  - pertState.current reads/writes for mode-persisted calculator state
  - $effect with JSON.stringify for deep state change tracking and persistence
  - CSS var references only (no hardcoded oklch or Tailwind color classes)
  - svelte:document for global click/keydown handlers

# Key files
created:
  - src/lib/pert/DosingCalculator.svelte
modified:
  - src/routes/pert/+page.svelte

# Decisions
key-decisions:
  - Kept fat grams as raw string input (not NumericInput) because validateFatGrams works on string values and needs empty-string vs zero distinction
  - Used svelte:document instead of onMount event listeners for tooltip close handlers
  - Removed header theme toggle and about button (now handled by app shell NavShell)

# Metrics
duration: 4min
completed: "2026-04-01T07:23:00Z"
tasks_completed: 2
tasks_total: 2
files_created: 1
files_modified: 1
---

# Phase 3 Plan 02: PERT Dosing Calculator UI Summary

Ported the full DosingCalculator.svelte from the standalone pert-calculator app into the unified NICU Assistant, refactoring in a single pass to use Phase 2 shared components and the pertState module from Plan 01.

**One-liner:** Full PERT dosing calculator with meal and tube-feed dual-mode UI, wired to pertState for session persistence, using shared SelectPicker components.

## What Was Done

### Task 1: Port DosingCalculator.svelte (6703c7a)
- Ported ~977-line DosingCalculator from `/mnt/data/src/pert-calculator/src/lib/components/DosingCalculator.svelte`
- Removed BUILD_FLAGS import, `footerVisible`/`footerHidden` state, branded footer template
- Removed header theme toggle and about button (app-shell concerns in unified app)
- Adapted all imports to `$lib/pert/` paths
- Replaced local SelectPicker with shared `$lib/shared/components/SelectPicker.svelte`
- Wired all mode/input state to `pertState.current` (meal and tubeFeed sub-objects)
- Added `$effect` to persist state on any change via `pertState.persist()`
- Replaced all hardcoded colors (`bg-surface`, `text-primary`, `text-secondary`, `text-tertiary`, `border-border`, `bg-surface-card`, `bg-surface-alt`) with CSS variable references
- Preserved: `calculateCapsules()` call signature, `validateFatGrams()`, `getStrengths()` branching, keyboard navigation, lipase rate display, error display

### Task 2: Wire PERT route page (ced15f7)
- Replaced skeleton placeholder content with `<DosingCalculator />` component
- Added `onMount` with `setCalculatorContext({ id: 'pert', accentColor: 'var(--color-accent)' })` and `pertState.init()`
- Removed all animated skeleton divs and "coming in Phase 3" notice
- Kept `<svelte:head>` title: "PERT Dosing | NICU Assistant"

## Verification Results

| Check | Result |
|-------|--------|
| svelte-check (pert files) | Zero errors |
| pnpm build | Exit 0 |
| BUILD_FLAGS in pert/ | Zero matches |
| Hardcoded colors in DosingCalculator | Zero matches |
| lucide-svelte (wrong package) in pert/ | Zero matches |
| pertState references in DosingCalculator | Present |

## Deviations from Plan

### Adaptation: Fat grams kept as raw input (not NumericInput)

**Reason:** The plan suggested using the shared NumericInput component for fat grams, but `validateFatGrams()` operates on raw strings and needs to distinguish between empty string, zero, and invalid values. NumericInput works with `number | null` which loses this distinction. Kept the original inline fat grams input with raw string handling for validation compatibility. This is functionally equivalent and preserves the exact validation UX from the source app.

### Adaptation: Removed header elements

**Reason:** The source DosingCalculator included a header with theme toggle button and about button. In the unified app, these are handled by the NavShell (Phase 1). Removed to avoid duplication. Kept the PERT acronym tooltip trigger.

## Known Stubs

None. All data sources are wired, all modes functional, all 5 FDA brands present.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 6703c7a | Port DosingCalculator.svelte to unified app |
| 2 | ced15f7 | Wire PERT route page with DosingCalculator |

## Self-Check: PASSED

- FOUND: src/lib/pert/DosingCalculator.svelte
- FOUND: src/routes/pert/+page.svelte
- FOUND: .planning/phases/03-calculators/03-02-SUMMARY.md
- FOUND: commit 6703c7a
- FOUND: commit ced15f7
- Build: exit 0
- svelte-check: zero errors in pert/ files
