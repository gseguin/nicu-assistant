---
phase: 32-gir-simplification
plan: 01
subsystem: gir
tags: [gir, simplification, ux, a11y]
requirements: [GIR-SIMP-01, GIR-SIMP-02, GIR-SIMP-03, GIR-SIMP-04, GIR-SIMP-05, GIR-SIMP-07]
key-files:
  modified:
    - src/lib/gir/GirCalculator.svelte
    - src/lib/gir/GlucoseTitrationGrid.svelte
    - src/lib/gir/GirCalculator.test.ts
    - src/lib/gir/GlucoseTitrationGrid.test.ts
    - e2e/gir.spec.ts
metrics:
  vitest: 203/203
  svelte-check: 0/0
  playwright-gir: 12/12
  build: ok
---

# Phase 32 Plan 01: GIR Simplification Summary

Stripped the GIR calculator chrome to inputs → CURRENT GIR hero → advisories → titration grid only. Removed the Target GIR summary hero, the per-card Fluids/Rate/GIR secondary metrics row, and the bottom "Starting GIR by population" reference card; preserved bucket selection visuals + a11y scaffolding; updated all stale tests.

## Final state

| File | Before | After |
|---|---|---|
| `src/lib/gir/GirCalculator.svelte` | 249 | **166** |
| `src/lib/gir/GlucoseTitrationGrid.svelte` | 200 | **177** |

## Tasks executed

Tasks 1–4 (audit, GIR-SIMP-02 secondary row, GIR-SIMP-01/05 summary hero + aria-live, GIR-SIMP-03 population reference) were already committed before this executor ran (commits `5fce6f7`, `bd96120`, `5995c38`). This executor performed:

1. **Reverted GIR-SIMP-06** (Rule 1 deviation — see below).
2. **Task 5 — GIR-SIMP-07**: rewrote stale test assertions across vitest + Playwright.
3. **Task 6 — gate sweep**: vitest 203/203, svelte-check 0/0, Playwright GIR 12/12 (incl. 6 axe sweeps light+dark+focus+advisory+selected-light+selected-dark), `pnpm build` ok.

## Deviations from Plan

### Rule 1 — Bug fix: revert GIR-SIMP-06 gating

- **Found during:** Task 5 audit of `GlucoseTitrationGrid.svelte` (commit `7d6da92` on the worktree base).
- **Issue:** `stopInfusion` in both branches had been changed to `row.bucketId === 'severe-neuro' || row.targetGirMgKgMin <= 0`. The revised plan and the orchestrator scope note both require this gate to be `row.targetGirMgKgMin <= 0` only — GIR-SIMP-06 was explicitly DROPPED by user decision.
- **Fix:** Restored both `{@const stopInfusion = row.targetGirMgKgMin <= 0}` declarations (mobile L101, desktop L152). Severe-neuro card now renders the same Δ rate hero as every other bucket.
- **Files modified:** `src/lib/gir/GlucoseTitrationGrid.svelte`
- **Commit:** `e5b1f72`

## Test deltas (Task 5 / GIR-SIMP-07)

- `GirCalculator.test.ts`: dropped the `selecting a bucket updates target-guidance hero with Δ rate as the action` test (asserted on the now-deleted `ADJUST RATE` summary hero). Replaced with an aria-checked assertion on the bucket card itself, since selection state now lives only on the card. No assertions on `Starting GIR by population` / `IDM` / `IUGR` / `Preterm` were present (already removed).
- `GlucoseTitrationGrid.test.ts`:
  - Removed the severe-neuro STOP test added by the dropped GIR-SIMP-06 commit (`severe-neuro bucket renders STOP unconditionally even when targetGirMgKgMin > 0`).
  - Rewrote the `desktop header row text order` test to expect `['Range', 'Δ rate']` (2 columns) instead of the old 5-column header.
  - Did **not** add a new severe-neuro test (GIR-SIMP-06 dropped).
  - `ariaLabelFor` SR strings still reference target context — left intact per plan.
- `e2e/gir.spec.ts`: dropped the `/ADJUST RATE|HYPERGLYCEMIA|TARGET REACHED/` assertion; replaced with an `aria-checked=true` assertion on the selected radio.
- `e2e/gir-a11y.spec.ts`: no changes needed (purely structural axe sweeps).

## Gate results

| Gate | Result |
|---|---|
| `pnpm vitest run` | **203 / 203 passed** (17 files) |
| `pnpm svelte-check` | **0 errors / 0 warnings** (4493 files) |
| `pnpm playwright test e2e/gir.spec.ts e2e/gir-a11y.spec.ts` | **12 / 12 passed** (6 axe sweeps green in light + dark + focus + advisory + selected-light + selected-dark) |
| `pnpm build` | **ok** — PWA generated, 35 precache entries, 319.11 KiB |

## Success-criteria audit

1. ✅ `GirCalculator.svelte` contains no `ADJUST RATE` / `HYPERGLYCEMIA` / `TARGET REACHED` / `Starting GIR by population` / `IDM` / `IUGR` / `Preterm` literals.
2. ✅ `GlucoseTitrationGrid.svelte` contains no visible-chrome `Fluids` / `Target fluids` / `Target rate` / `Target GIR` literals (header is `Range` / `Δ rate` only). `ariaLabelFor()` SR strings retain target context.
3. ✅ `stopInfusion` in BOTH branches is `row.targetGirMgKgMin <= 0` — no `bucketId === 'severe-neuro'` clause. (Reverted in this plan.)
4. ✅ `selectedBucketId` still bound from `GirCalculator` into `<GlucoseTitrationGrid>` and persisted via `girState.persist()`.
5. ✅ `role="radiogroup"` / `role="radio"` / roving `tabindex` / keyboard handlers / focus-visible ring classes intact.
6. ✅ `aria-live="polite"` on the deleted target-guidance hero is gone. CURRENT GIR hero `aria-live` untouched (L102).
7. ✅ All four quality gates green.

## Notes

- **GIR-SIMP-06 explicitly dropped by user decision.** Severe-neuro card continues to render the Δ rate hero like every other bucket. The v1.9-deferred clinical bolus copy question for severe-neuro remains deferred (NOTES.md).
- Selection visual scaffolding (`border-l-4`, `--color-identity-hero` fill, roving tabindex, keyboard nav, focus rings) preserved exactly per GIR-SIMP-04.

## Self-Check: PASSED

- FOUND: src/lib/gir/GirCalculator.svelte (166 lines)
- FOUND: src/lib/gir/GlucoseTitrationGrid.svelte (177 lines)
- FOUND commit e5b1f72 (revert GIR-SIMP-06)
- FOUND commit 772029f (test GIR-SIMP-07)
