---
phase: 28-gir-a11y-e2e-ship
plan: 03
subsystem: gir
tags: [a11y, e2e, axe, gir, test-05]
requires: [28-01]
provides: [gir-axe-sweeps]
affects: [e2e/gir-a11y.spec.ts]
tech-stack:
  added: []
  patterns: [axe-core playwright sweep, morphine-wean-a11y fork]
key-files:
  created:
    - e2e/gir-a11y.spec.ts
  modified: []
decisions:
  - "OKLCH tuning for .identity-gir not needed — all 6 sweeps green on first run"
metrics:
  duration: ~3 min
  completed: 2026-04-09
requirements: [TEST-05]
---

# Phase 28 Plan 03: GIR A11y Axe Sweeps Summary

Added 6 axe-core accessibility sweeps for `/gir` mirroring the Morphine Wean pattern; all green on first run, so the contingent OKLCH tuning task was a no-op.

## Tasks Completed

### Task 1: e2e/gir-a11y.spec.ts with 6 variants — PASSED
Forked `e2e/morphine-wean-a11y.spec.ts` verbatim, adapted selectors for GIR:
- Heading: `Glucose Infusion Rate`
- Labels: `Weight`, `Dextrose`, `Fluid order`
- Advisory trigger: `Dextrose = 15` (>12.5%), matched on `/requires central venous access/i`
- Bucket selection via radiogroup `glucose range titration helper` → first radio click

**6 variants, all green:**
1. Light mode baseline — PASS
2. Dark mode baseline — PASS
3. Focus ring visible (weight input focused) — PASS
4. Dextrose advisory rendered (light) — PASS
5. Selected bucket (light) — PASS
6. Selected bucket (dark) — PASS

Runtime: 4.4s across 6 workers.
Commit: `3883efe`

### Task 2: CONTINGENT OKLCH tuning — SKIPPED (no-op)
Axe reported zero `color-contrast` violations on `.identity-gir` hero in both light and dark, with and without a selected bucket. Current OKLCH values retained unchanged:
- Light hero: `oklch(94% 0.045 145)`
- Dark hero: `oklch(30% 0.09 145)`

The Phase 20 Morphine green-hue contrast trap did not recur — chroma was already low enough (0.045 light / 0.09 dark) to keep luminance within WCAG AA against text tokens. No edits to `src/app.css`.

## Deviations from Plan

None — plan executed exactly as written. Contingent Task 2 correctly resolved to no-op per its own acceptance criteria.

## Verification

- `pnpm exec playwright test e2e/gir-a11y.spec.ts --reporter=line` → `6 passed (4.4s)`
- `grep -c AxeBuilder e2e/gir-a11y.spec.ts` → 6
- `git diff src/app.css` → empty (no tuning applied)

## Project Sweep Count

After this plan: 16 total axe sweeps (prior 10 from morphine-wean + fortification + formula, plus 6 new GIR).

## Self-Check: PASSED
- FOUND: e2e/gir-a11y.spec.ts
- FOUND: commit 3883efe
