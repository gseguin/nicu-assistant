---
phase: 30
plan: "01"
subsystem: ui-polish
tags: [impeccable, critique, polish, a11y, dark-mode]
requires: [phase-29]
provides: [refined-segmented-toggle, softer-gir-dark-identity, en-dash-range-labels]
affects: [src/app.css, src/lib/shared/components/SegmentedToggle.svelte, src/lib/morphine/MorphineWeanCalculator.svelte, src/lib/gir/GirCalculator.svelte, src/lib/gir/gir-config.json]
tech-stack:
  added: []
  patterns: [token-only-fallback-ladder, per-context-weight-tune]
key-files:
  created:
    - .planning/phases/30-impeccable-polish-tech-debt-sweep/GIR-CRITIQUE.md
    - .planning/phases/30-impeccable-polish-tech-debt-sweep/MORPHINE-CRITIQUE.md
    - .planning/phases/30-impeccable-polish-tech-debt-sweep/FORMULA-CRITIQUE.md
    - .planning/phases/30-impeccable-polish-tech-debt-sweep/30-01-SUMMARY.md
  modified:
    - src/lib/gir/GirCalculator.svelte
    - src/lib/gir/gir-config.json
    - src/lib/morphine/MorphineWeanCalculator.svelte
    - src/lib/shared/components/SegmentedToggle.svelte
    - src/app.css
decisions:
  - Phase 29 Δ-rate hero swap finished at page level (Target GIR summary now matches grid)
  - Severe-neuro clinical bolus copy deferred for clinician review (see NOTES.md)
  - Bucket range labels normalized to en-dash typography (labels only, IDs unchanged)
  - GIR dark-mode identity-hero dropped from oklch(30% 0.09) → oklch(22% 0.045) to restrain saturation and keep axe 4.5:1
  - SegmentedToggle inactive text lifted to primary token so it reads "unselected" not "disabled"
metrics:
  completed: 2026-04-09
  tasks-committed: 7
  axe-sweeps: 16/16 green
---

# Phase 30 Plan 01: Impeccable Polish — Critique + Fix Loop Summary

Three-surface impeccable critique pass (GIR, Morphine, Formula) followed by an atomic fix loop resolving every P1 finding and every addressable P2/P3 finding, with all 16 axe sweeps green at close.

## Fixes Applied

| # | Finding | Commit | File(s) |
|---|---|---|---|
| GIR-P1 #1 | Target GIR summary hero swap to Δ rate (finishes Phase 29) | `b278e7c` | `src/lib/gir/GirCalculator.svelte`, `GirCalculator.test.ts` |
| GIR-P1 #2 | Severe-neuro clinical bolus copy — deferred (see Deferred section) | `5dc06ca` | `.planning/NOTES.md` |
| GIR-P2 #3 | Dark-mode selected-bucket fill softened (chroma 0.09 → 0.045, L 30% → 22%) | `ca6c235`, `521c0a9` | `src/app.css` |
| MORPHINE/FORMULA-P2 #5 | SegmentedToggle inactive text lifted to primary | `c2a548b` | `src/lib/shared/components/SegmentedToggle.svelte` |
| MORPHINE-P2 #6 | Summary card label weight bumped (`font-medium` → `font-semibold`) | `f37c096` | `src/lib/morphine/MorphineWeanCalculator.svelte` |
| MORPHINE-P3 #9 | Step card delta right padding (`pr-1`) | `f37c096` | `src/lib/morphine/MorphineWeanCalculator.svelte` |
| GIR-P3 #8 | Bucket range labels en-dash normalization (`40-50` → `40–50`) | `60d9c2b` | `src/lib/gir/gir-config.json` |

Plus the Phase 29 deferred registry test fix picked up opportunistically:

| # | Finding | Commit | File(s) |
|---|---|---|---|
| Phase 29 deferred | `registry.test.ts` length 2 → key-set assertion | `43b3246` | `src/lib/shell/__tests__/registry.test.ts` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] GIR dark-mode identity-hero first-pass bump failed axe**
- **Found during:** final verification
- **Issue:** Initial softening to `oklch(28% 0.05 145)` dropped contrast of `ml/hr` tertiary text below WCAG 4.5:1 (axe reported 3.61:1)
- **Fix:** Dropped lightness further to `oklch(22% 0.045 145)` — higher contrast against light tertiary text, still softer than the original saturated value
- **Commit:** `521c0a9`

### Out of scope — Deferred

Eight pre-existing Playwright e2e failures (non-a11y) were confirmed via `git stash` on unmodified HEAD to be pre-existing test drift from the v1.8 GIR addition and earlier Formula/Morphine redesigns. They are NOT caused by this plan's changes. Logged to `.planning/phases/30-impeccable-polish-tech-debt-sweep/deferred-items.md` for Phase 30-02 (or a dedicated e2e cleanup plan).

## Critique Artifacts

- `GIR-CRITIQUE.md` — score 27/40, 2 × P1, 2 × P2, 1 × P3
- `MORPHINE-CRITIQUE.md` — score 35/40, 0 × P1, 2 × P2, 1 × P3
- `FORMULA-CRITIQUE.md` — score 37/40, 0 × P1, 1 × P2 (shared), 1 × P3

Transient screenshots in `critique/` are left in place this run (not cleaned up) so Phase 30-02 or later plans can reuse them for visual diffing; they are gitignored in intent and not committed.

## Final Verification Gate

| Check | Result |
|---|---|
| `pnpm test:run` | **205 / 205 passing** |
| `pnpm svelte-check` | 5 pre-existing errors + 1 warning (no new) — Phase 30-02 scope |
| Playwright axe sweeps (GIR 6 + Fortification 4 + Morphine 6) | **16 / 16 green** ✅ |
| Full Playwright e2e | 41 passed, 8 pre-existing failures deferred, 3 skipped |

## Key Constraints Honored

- Zero new OKLCH tokens, zero new identity hues — existing-token refinement only
- Zero changes to `calculations.ts`, `*-config.json` calculation logic (gir-config.json labels-only change is allowed per PROGRESS.md explicit carve-out)
- Zero changes to `role="radiogroup"` semantics or keyboard nav
- Severe-neuro bucket rendering untouched (deferred per NOTES.md)
- `.impeccable.md` design contract respected throughout: restraint, warm clinical, "result is the interface"

## Self-Check: PASSED

- Summary file exists: `.planning/phases/30-impeccable-polish-tech-debt-sweep/30-01-SUMMARY.md`
- All referenced commits exist in this worktree branch: `b278e7c`, `5dc06ca`, `43b3246`, `ca6c235`, `c2a548b`, `f37c096`, `60d9c2b`, `521c0a9`
- 16/16 axe sweep evidence verified via direct Playwright run
- Vitest 205/205 verified post-fix
