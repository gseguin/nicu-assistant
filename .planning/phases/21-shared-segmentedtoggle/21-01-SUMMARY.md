---
phase: 21
plan: 01
subsystem: shared-components
tags: [svelte5, a11y, tablist, refactor]
requires: []
provides:
  - SegmentedToggle component
  - $lib/shared SegmentedToggle export
affects:
  - src/lib/shared/index.ts
tech-stack:
  added: []
  patterns:
    - "Svelte 5 generic component (<script generics='T extends string'>)"
    - "WAI-ARIA tablist with roving tabindex"
    - "crypto.randomUUID per-instance ids"
key-files:
  created:
    - src/lib/shared/components/SegmentedToggle.svelte
    - src/lib/shared/components/SegmentedToggle.test.ts
    - src/lib/shared/components/SegmentedToggleHarness.svelte
  modified:
    - src/lib/shared/index.ts
decisions:
  - "Dropped aria-controls (Pitfall 1 — Morphine's panel ids were dangling)"
  - "Test harness component used to exercise bind:value writeback"
metrics:
  duration: ~5min
  tasks: 2
  files: 4
  tests: 7
completed: 2026-04-07
requirements: [TOG-01, TOG-02, TOG-03, A11Y-03]
---

# Phase 21 Plan 01: Shared SegmentedToggle Summary

**One-liner:** Generic Svelte 5 SegmentedToggle component lifted 1:1 from Morphine's tablist with WAI-ARIA roving tabindex and ←/→/Home/End/Space/Enter keyboard nav, exported from `$lib/shared` with 7 component tests.

## What Was Built

- `SegmentedToggle.svelte` — generic `<T extends string>` component, `bind:value` SelectPicker-shaped API, `role="tablist"` + `role="tab"` markup verbatim from Morphine lines 188-209, `handleKeydown` lifted from lines 115-148. Active segment uses `var(--color-identity)` (cascades from route identity wrapper). Per-instance `crypto.randomUUID()` for tab ids.
- `SegmentedToggle.test.ts` — T-01..T-07 covering render, active class, ArrowRight wrap, ArrowLeft wrap, Home/End jump, Space/Enter activation, click → bind:value writeback.
- `SegmentedToggleHarness.svelte` — tiny wrapper exposing `bind:value` for the writeback test.
- Export added to `src/lib/shared/index.ts`.

## Verification

- `npx svelte-check`: 5 errors total — all pre-existing baseline (MorphineWeanCalculator's `triggerMagnification` scope, virtual:pwa modules, $app/state). Zero new errors in SegmentedToggle.
- `npx vitest run src/lib/shared/components/SegmentedToggle.test.ts`: 7/7 pass.
- `npx vitest run` (full suite): 131/131 pass (124 baseline + 7 new).

## Deviations from Plan

**None.** Plan executed verbatim. One small additive: created `SegmentedToggleHarness.svelte` as a test fixture (not in plan's files_modified), which is the cleanest way to exercise `bind:value` writeback in Svelte 5 testing-library — mirrors the harness pattern implied by SelectPicker's test setup. Listed under `key-files.created`.

## Commit

- `be52000` — feat(21-01): add shared SegmentedToggle component + tests

## Self-Check: PASSED

- FOUND: src/lib/shared/components/SegmentedToggle.svelte
- FOUND: src/lib/shared/components/SegmentedToggle.test.ts
- FOUND: src/lib/shared/components/SegmentedToggleHarness.svelte
- FOUND: src/lib/shared/index.ts (SegmentedToggle export)
- FOUND: commit be52000
