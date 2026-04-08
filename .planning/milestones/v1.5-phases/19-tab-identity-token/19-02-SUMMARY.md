---
phase: 19-tab-identity-token
plan: 02
subsystem: theming
tags: [identity, tokens, a11y, focus-visible]
requires: [19-01]
provides: [IDENT-02, IDENT-03, IDENT-04]
affects:
  - src/lib/morphine/MorphineWeanCalculator.svelte
  - src/lib/fortification/FortificationCalculator.svelte
  - src/lib/shared/components/NumericInput.svelte
  - src/lib/shared/components/SelectPicker.svelte
tech-stack:
  added: []
  patterns: ["per-route identity via CSS cascade from Plan 19-01 wrappers"]
key-files:
  modified:
    - src/lib/morphine/MorphineWeanCalculator.svelte
    - src/lib/fortification/FortificationCalculator.svelte
    - src/lib/shared/components/NumericInput.svelte
    - src/lib/shared/components/SelectPicker.svelte
decisions: []
metrics:
  duration: ~5m
  completed: 2026-04-07
  tasks: 3
  tests: 124/124
---

# Phase 19 Plan 02: Tab Identity Token Wiring Summary

Wired `--color-identity` and `--color-identity-hero` to the result hero cards, eyebrow labels, and focus-visible outlines across both calculator bodies, completing IDENT-02/03/04.

## Changes

**Task 1 — MorphineWeanCalculator.svelte**
- Mode-tab pills (linear/compounding): `focus-visible:ring`, active `text-`, hover `text-` swapped from `--color-accent*` to `--color-identity` (IDENT-03).
- Result hero summary card: `bg-[var(--color-accent-light)]` → `bg-[var(--color-identity-hero)]` (IDENT-02).
- Four eyebrow spans (`Start`, `Step N`, `Total reduction`, `Step 1 — Starting dose` / `Step N`): `text-[var(--color-text-secondary)]` → `text-[var(--color-identity)]` (IDENT-04).

**Task 2 — FortificationCalculator.svelte**
- "Amount to Add" hero card: `bg-[var(--color-accent-light)]` → `bg-[var(--color-identity-hero)]` (IDENT-02).
- "Amount to Add" + "Verification" eyebrow spans: `text-[var(--color-text-secondary)]` → `text-[var(--color-identity)]` (IDENT-04).

**Task 3 — Focus-visible outlines (IDENT-03)**
- NumericInput: focus border, focus ring, and scale-focus border swapped to `var(--color-identity)`. Idle border preserved on `--color-border`.
- SelectPicker trigger: hover border + focus-visible outline → `var(--color-identity)`.
- SelectPicker option buttons (both grouped + flat branches): focus-visible outline → `var(--color-identity)`.
- Untouched: checkmark `style="color: {accentColor}"` (4 occurrences of `accentColor` preserved), `ctx.accentColor` wiring.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `pnpm exec vitest run`: **124/124 passed**
- `grep -c "bg-[var(--color-identity-hero)]"`: 1 in each calculator file
- `grep -c "bg-[var(--color-accent-light)]"`: 0 in both calculator files
- `grep -niE "identity.*bmf|bmf.*identity" src/`: no matches (IDENT-06 guard)
- `grep -c accentColor SelectPicker.svelte`: 4 (unchanged — Pitfall 2 guard)
- `git diff src/lib/shared/context.ts`: no changes
- `git diff src/lib/shared/components/AboutSheet.svelte src/lib/shared/components/DisclaimerModal.svelte`: no changes

## Commits

- `630def6` — feat(19-02): wire identity tokens to hero, eyebrows, focus rings

## Self-Check: PASSED

- Files exist: all 4 modified files present
- Commit `630def6` found in git log
- Acceptance criteria verified for all 3 tasks
