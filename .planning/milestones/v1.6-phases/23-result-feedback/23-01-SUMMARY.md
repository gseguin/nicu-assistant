---
phase: 23-result-feedback
plan: 01
subsystem: a11y, animation
tags: [aria-live, animation, prefers-reduced-motion, parity]
requires: []
provides:
  - ".animate-result-pulse shared class in src/app.css"
  - "aria-live result surfaces on Morphine + Formula"
affects:
  - src/app.css
  - src/lib/morphine/MorphineWeanCalculator.svelte
  - src/lib/fortification/FortificationCalculator.svelte
tech-stack:
  added: []
  patterns: ["{#key calcKey} re-mount for CSS entrance animation", "untrack() write inside tracking $effect"]
key-files:
  created: []
  modified:
    - src/app.css
    - src/lib/morphine/MorphineWeanCalculator.svelte
    - src/lib/fortification/FortificationCalculator.svelte
    - src/lib/morphine/MorphineWeanCalculator.test.ts
    - src/lib/fortification/FortificationCalculator.test.ts
decisions:
  - "Shared class lives in src/app.css @layer components (single source of truth)"
  - "Formula calcKey bumped via $effect + untrack to avoid update-depth loop"
metrics:
  duration: "~15 min"
  tasks: 2
  files: 5
  tests: "149/149 passing (+7 new)"
  completed: "2026-04-07"
---

# Phase 23 Plan 01: Result Feedback Parity Summary

One-liner: Extracted shared `.animate-result-pulse` keyframe into `src/app.css`, wired Morphine summary card with `aria-live="polite"`, and wrapped Formula hero content in `{#key calcKey}` with the shared class — both gated by `prefers-reduced-motion` and free of scroll/focus theft.

## What Changed

- **src/app.css**: Added `@keyframes result-pulse` (95% → 100%, 200ms cubic-bezier) and `.animate-result-pulse` class under `@layer components`, plus `prefers-reduced-motion: reduce` override.
- **MorphineWeanCalculator.svelte**: Renamed class from `animate-summary-pulse` → `animate-result-pulse`, added `aria-live="polite"` + `aria-atomic="true"` on summary card, deleted the local `<style>` keyframe block.
- **FortificationCalculator.svelte**: Added `calcKey` state bumped by a tracking `$effect` (with `untrack` on the write to avoid effect loop), wrapped hero inner content with `{#key calcKey}` and a `<div class="animate-result-pulse">` wrapper. Outer section keeps `aria-live="polite"` / `aria-atomic="true"` (screen-reader announcement).
- **Tests**: +7 assertions covering aria-live attrs, shared class presence, re-mount semantics, and no scrollIntoView / focus theft on either calculator.

## Success Criteria

1. Morphine + Formula both announce via `aria-live="polite"` + `aria-atomic="true"` — PASS (FEED-01)
2. Both replay `.animate-result-pulse` on result change — PASS (FEED-02)
3. `prefers-reduced-motion: reduce` disables animation in both — PASS (single rule in app.css)
4. Neither calls `.scrollIntoView()` or `.focus()` on result update — PASS (FEED-03, test-verified)
5. Shared class defined once; no per-component `<style>` keyframes remain — PASS
6. All tests green — PASS (149/149)

## Deviations from Plan

**[Rule 3 - Blocking] Fortification effect update-depth loop.**
Initial write `calcKey += 1` inside the tracking `$effect` triggered Svelte's effect_update_depth_exceeded in vitest. Wrapped the write in `untrack(() => { calcKey += 1; })` mirroring the existing pattern used by the mirror effects higher in the same file.

**[Rule 3 - Blocking] jsdom missing `scrollIntoView`.**
`vi.spyOn(HTMLElement.prototype, 'scrollIntoView')` failed because the property is not defined in jsdom. Added a guarded `Object.defineProperty` fallback inside each of the two new scroll/focus guard tests before spying.

## Verification

- `pnpm vitest run` → 149/149 passing
- `grep animate-summary-pulse src/` → only remaining match is in test file (asserting absence)
- `grep animate-result-pulse src/` → app.css definition + Morphine summary + Formula hero wrapper + tests
- `grep -E 'scrollIntoView|\.focus\(' src/lib/{morphine,fortification}/*.svelte` → zero matches
- `pnpm check` errors are pre-existing virtual:pwa / $app/* module issues unrelated to this plan

## Commit

- `f4530d2` feat(23-01): aria-live + shared pulse animation parity for result surfaces

## Self-Check: PASSED

- src/app.css — `.animate-result-pulse` present
- src/lib/morphine/MorphineWeanCalculator.svelte — class + aria-live applied, style block removed
- src/lib/fortification/FortificationCalculator.svelte — calcKey + {#key} + wrapper applied
- Tests — 149/149 green
- Commit f4530d2 — FOUND
