---
phase: 27
plan: 02
subsystem: gir
tags: [titration-grid, radiogroup, keyboard-nav, a11y]
requires: [phase-27-plan-01]
provides: [glucose-titration-grid-component]
affects:
  - src/lib/gir/GlucoseTitrationGrid.svelte
  - src/lib/gir/GlucoseTitrationGrid.test.ts
tech_added: []
patterns: [wai-aria-radiogroup, roving-tabindex, color-independent-glyph]
files_created:
  - src/lib/gir/GlucoseTitrationGrid.svelte
  - src/lib/gir/GlucoseTitrationGrid.test.ts
files_modified: []
key_decisions:
  - "radiogroup (not tablist) — 6-row clinical selector is single-select radio semantics"
  - "Zero default selection; first row carries tabindex=0 so keyboard users can Tab in"
  - "Δ rate uses ▲/▼ + (increase)/(decrease) text in text-secondary — WCAG 1.4.1 color-independent"
  - "Severe-neuro row differentiated by 2px tertiary left border, never red, never filled"
  - "sm: Tailwind breakpoint (640px) accepted for v1.8 vs UI-SPEC 480px — Phase 28 axe sweep will flag if needed"
completed: 2026-04-09
requirements: [TITR-01, TITR-02, TITR-03, TITR-04, TITR-05, TITR-06, TITR-07, TITR-08, CORE-05]
---

# Phase 27 Plan 02: GlucoseTitrationGrid Component Summary

Standalone WAI-ARIA radiogroup titration helper component with full keyboard navigation, responsive card/table layout, color-independent Δ-rate glyph rendering, and ≤0 stop-infusion display. Ready for composition by `GirCalculator` in Plan 03.

## Tasks Completed

| Task | Name                                                | Commit  | Files                                    |
| ---- | --------------------------------------------------- | ------- | ---------------------------------------- |
| 1    | Create GlucoseTitrationGrid.svelte (radiogroup)     | 20966e5 | src/lib/gir/GlucoseTitrationGrid.svelte  |
| 2    | Create co-located GlucoseTitrationGrid.test.ts      | 4ac401c | src/lib/gir/GlucoseTitrationGrid.test.ts |

## Contract Honored

- `role="radiogroup"` wrapper (2x — mobile + desktop), per-row `role="radio"` + `aria-checked`
- Roving tabindex (exactly one row focusable at a time)
- Keyboard: Arrow Up/Down/Left/Right wrap, Home/End jump, Space/Enter affirm (no toggle-off)
- No default selection — `selectedBucketId` starts null; first row carries `tabindex=0`
- Δ rate: `▲`/`▼` glyph + `(increase)`/`(decrease)`/`(no change)` text, `text-[var(--color-text-secondary)]`, never red/green
- TITR-07: `targetGirMgKgMin <= 0` renders `"0 mg/kg/min — consider stopping infusion"` (display-only; raw preserved for tests)
- Severe-neuro row: `border-l-2 border-l-[var(--color-text-tertiary)]` at rest; promoted to 4px identity on select
- Responsive: `flex flex-col gap-3 sm:hidden` (mobile card stack) + `hidden sm:grid` (table grid); all 6 always visible
- `.num` tabular-nums on all numeric cells
- Per-row `aria-label` built from `srLabel` (avoids SR reading `<40` as a tag)

## Test Results

```
Test Files  1 passed (1)
      Tests  11 passed (11)
```

All 11 cases green:
1. Renders 6 rows (12 radios across mobile+desktop layouts)
2. No `aria-checked="true"` by default
3. First row has `tabindex="0"`, others `-1`
4. Click fires `onselect` with correct bucketId
5. ArrowDown advances selection
6. Home jumps to first row
7. End jumps to last row
8. `targetGirMgKgMin <= 0` renders stop-infusion copy
9. Positive delta renders `▲` + `(increase)`
10. Negative delta renders `▼` + `(decrease)`
11. Zero delta renders `(no change)`

## Verification

- `ls src/lib/gir/GlucoseTitrationGrid.svelte` → exists (190 lines)
- `grep 'role="radiogroup"' src/lib/gir/GlucoseTitrationGrid.svelte` → 2 hits
- `grep "consider stopping infusion" src/lib/gir/GlucoseTitrationGrid.svelte` → 2 hits (mobile + desktop)
- `pnpm test src/lib/gir/GlucoseTitrationGrid.test.ts --run` → 11/11 green
- `git diff --stat src/lib/shared/components/` → empty (ARCH-06 honored)

## Deviations from Plan

None — plan executed exactly as written. The acceptable-variance note on `sm:` (640px) vs UI-SPEC (480px) is pre-documented in the plan and inherited here; Phase 28 axe sweep is the gate.

## Known Stubs

None. Component is fully wired and receives its `rows`/`selectedBucketId`/`onselect` via props; the parent `GirCalculator` wiring is Plan 03's scope.

## Self-Check: PASSED

- FOUND: src/lib/gir/GlucoseTitrationGrid.svelte
- FOUND: src/lib/gir/GlucoseTitrationGrid.test.ts
- FOUND commit: 20966e5
- FOUND commit: 4ac401c
- VERIFIED: src/lib/shared/components/ unchanged
