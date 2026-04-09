---
phase: 28-gir-a11y-e2e-ship
plan: 01
subsystem: gir
tags: [wave-0, blockers, types, nav, playwright]
dependency_graph:
  requires: []
  provides:
    - "CalculatorId supports 'gir'"
    - "NavShell routes AboutSheet to 'gir' on /gir"
    - "Playwright chromium installed; empirical radio count = 6"
  affects:
    - src/lib/shared/types.ts
    - src/lib/shell/NavShell.svelte
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - src/lib/shared/types.ts
    - src/lib/shell/NavShell.svelte
decisions:
  - "Leaving about-content.ts 'gir' key gap to Plan 04 (DOC-01); this is the intended plan sequencing."
metrics:
  duration_minutes: ~4
  completed: 2026-04-09
---

# Phase 28 Plan 01: Wave 0 Blockers Summary

Extended CalculatorId union with 'gir', routed NavShell AboutSheet to the 'gir' content bucket on /gir, verified Playwright chromium installed, and empirically confirmed the GIR titration radio count is 6 at both mobile (375x667) and desktop (1280x800) viewports.

## Tasks Executed

### Task 1 — Extend CalculatorId with 'gir'
- **File:** `src/lib/shared/types.ts` line 7
- **Diff:** `export type CalculatorId = 'morphine-wean' | 'formula' | 'gir';`
- **Commit:** `28337a0`

### Task 2 — /gir branch in NavShell
- **File:** `src/lib/shell/NavShell.svelte` lines 11–15
- **Diff:** `$derived` chain now returns `'gir'` when `page.url.pathname.startsWith('/gir')`.
- **Commit:** `9b55f5e`

### Task 3 — Playwright environment verification
- `pnpm exec playwright --version` → `Version 1.59.0`
- `pnpm exec playwright install --with-deps chromium` → idempotent, chromium present.
- Temporary probe `e2e/_gir-wave0-probe.spec.ts` created, run, and deleted.
- **Empirical radio counts at /gir after filling Weight=3.1, Dextrose=12.5, Fluid=80:**
  - **Mobile 375x667:** `6`
  - **Desktop 1280x800:** `6`
- Both match Plan 02 expectation. No blocker.

## Verification
- `grep "'gir'" src/lib/shared/types.ts` → matches.
- `grep "startsWith('/gir')" src/lib/shell/NavShell.svelte` → matches.
- `pnpm exec playwright --version` → 1.59.0.
- Probe file deleted; `e2e/` remains clean.

## svelte-check Result
`svelte-check` reports 6 pre-existing errors and 1 pre-existing warning. Breakdown:
- **Environmental (4):** `$app/state`, `$app/navigation`, `virtual:pwa-info`, `virtual:pwa-register` — worktree sync artifacts, not caused by this plan.
- **Pre-existing (1):** `GirCalculator.svelte:13` GlucoseBucket id typing — predates Phase 28.
- **Expected gap (1):** `about-content.ts:14` requires `gir` key on `Record<CalculatorId, AboutContent>`. This is the **intentional surface** created by Task 1 for Plan 04 (DOC-01) to fill. Not a regression.

No new errors introduced by Plan 01 beyond the expected `about-content.ts` gap that Plan 04 is scheduled to close.

## Deviations from Plan
None.

## Self-Check: PASSED
- `src/lib/shared/types.ts` contains `'gir'` — FOUND
- `src/lib/shell/NavShell.svelte` contains `startsWith('/gir')` — FOUND
- Commit `28337a0` — FOUND
- Commit `9b55f5e` — FOUND
- `e2e/_gir-wave0-probe.spec.ts` — absent (clean)
