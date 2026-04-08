---
phase: 24
plan: 24-01
subsystem: a11y
tags: [a11y, wcag, axe, playwright, v1.6]
requires: []
provides: [a11y-coverage-v1.6-advisory]
affects: [e2e/morphine-wean-a11y.spec.ts, e2e/fortification-a11y.spec.ts]
tech_stack_added: []
key_files_created: []
key_files_modified:
  - e2e/morphine-wean-a11y.spec.ts
  - e2e/fortification-a11y.spec.ts
decisions:
  - No OKLCH tuning required — every v1.6 surface passed AA on first sweep
metrics:
  duration_minutes: 3
  tasks_completed: 1
  files_modified: 2
completed_date: 2026-04-07
---

# Phase 24 Plan 01: A11y Verification — v1.6 surfaces Summary

Verified WCAG 2.1 AA contrast for every v1.6 surface (SegmentedToggle active/inactive segments, NumericInput range hint, NumericInput advisory message) across both calculators in light + dark mode via the Playwright + axe-core sweep — zero violations, zero token tuning needed.

## What Changed

Added 4 new Playwright tests (2 per spec file, light + dark) that fill the first numeric input with `99999`, blur to trigger the "Outside expected range — verify" advisory, apply the existing `no-transition` settle pattern, then run axe with `wcag2a` + `wcag2aa` tags.

- Morphine: targets the Dosing weight input (max 200 → 99999 trips advisory).
- Formula: targets the first spinbutton (Starting Volume).

## Verification

| Check | Result |
|-------|--------|
| `pnpm playwright test e2e/morphine-wean-a11y.spec.ts e2e/fortification-a11y.spec.ts` | 12/12 passed (was 8) |
| `pnpm vitest run` | 149/149 passed |
| `grep -nE "disableRules\|axe-skip" e2e/` | zero matches |
| `git diff src/app.css` | zero changes |

## Deviations from Plan

None — plan executed exactly as written. No OKLCH tuning required; all v1.6 tokens (`--color-identity`, `--color-text-tertiary`, `--color-error` on `--color-surface-card`) already pass AA in both themes.

## Self-Check: PASSED

- FOUND: e2e/morphine-wean-a11y.spec.ts (modified)
- FOUND: e2e/fortification-a11y.spec.ts (modified)
- FOUND: commit 4c849fe
