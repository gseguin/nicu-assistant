---
phase: 27
plan: 03
subsystem: gir
tags: [composition, hero, advisories, reference-card, route-wiring]
requires: [phase-27-plan-01, phase-27-plan-02]
provides: [gir-calculator-composition, gir-route-live]
affects:
  - src/lib/gir/GirCalculator.svelte
  - src/lib/gir/GirCalculator.test.ts
  - src/routes/gir/+page.svelte
tech_added: []
patterns: [derived-aggregator, aria-live-hero, animate-result-pulse-key, tier1-amber-advisory, tier2-grey-advisory]
files_created:
  - src/lib/gir/GirCalculator.svelte
  - src/lib/gir/GirCalculator.test.ts
files_modified:
  - src/routes/gir/+page.svelte
key_decisions:
  - "calculateGir aggregator drives all $derived — single source of truth, null→empty hero"
  - "Dex>12.5 amber uses existing BMF tokens — no new color token introduced"
  - "Both heroes aria-live polite + atomic; pulse keyed on composite value string"
  - "Zero new props on NumericInput; all three fields opt into showRangeHint + showRangeError"
completed: 2026-04-09
requirements: [CORE-01, CORE-04, CORE-05, SAFE-01, SAFE-02, SAFE-03, SAFE-04, REF-01, ARCH-04, ARCH-06]
---

# Phase 27 Plan 03: GirCalculator Composition Summary

Composed the top-level `GirCalculator.svelte` — inputs card, Current GIR + Initial rate hero, Tier 1 amber Dex>12.5 advisory, Tier 2 grey GIR>12 / <4 advisories, titration grid header + `<GlucoseTitrationGrid />` embed, target-guidance hero, and population reference card — and wired it into `/gir`, replacing the Wave 1 placeholder.

## Tasks Completed

| Task | Name                                         | Commit  | Files                                    |
| ---- | -------------------------------------------- | ------- | ---------------------------------------- |
| 1    | Create GirCalculator.svelte composition      | 87a08b8 | src/lib/gir/GirCalculator.svelte         |
| 2    | Create GirCalculator.test.ts smoke/advisory  | caec179 | src/lib/gir/GirCalculator.test.ts        |
| 3    | Wire GirCalculator into /gir route           | 2e4f4b9 | src/routes/gir/+page.svelte              |

## Contract Honored

- Composition order matches UI-SPEC exactly: header → inputs → Current GIR + Initial rate hero → titration header (`"If current glucose is…"` + institutional disclaimer) → grid → target-guidance hero → contextual advisories → population reference card
- Both heroes: `aria-live="polite"` + `aria-atomic="true"` + `.animate-result-pulse` wrapped in `{#key}`
- Empty-state copy verbatim: `"Enter weight, dextrose %, and fluid rate to compute GIR"` and `"Select a glucose range to see target rate"`
- All 3 NumericInputs: `showRangeHint={true}` + `showRangeError={true}`, min/max/step from `gir-config.json` `inputs`
- SAFE-02 amber advisory: `"Dextrose >12.5% requires central venous access"` using `--color-bmf-50` / `--color-bmf-600` (no new tokens)
- SAFE-03 grey: `"GIR >12 mg/kg/min — consider hyperinsulinism workup / central access"`
- SAFE-04 grey: `"Below basal glucose utilization (≈4–6 mg/kg/min)"`
- REF-01 card: `Starting GIR by population` with IDM/LGA 3–5, IUGR 5–7, Preterm or NPO 4–6 mg/kg/min + footnote
- Result driven by `calculateGir(girState.current, buckets)` — null → empty hero state
- Tabular `.num` on every clinical numeric output
- Route wiring preserves Wave 1 onMount → `girState.init()` and identity-gir wrapper

## Test Results

```
Test Files  5 passed (5)
      Tests  40 passed (40)
```

GirCalculator.test.ts: 7/7 green
- renders without crashing
- Current GIR hero with default state values
- empty-state hero when inputs null
- amber Dex>12.5% advisory
- population reference card (3 rows + range)
- titration grid header
- target-guidance empty state

## Verification

- `pnpm test src/lib/gir/ --run` → 40/40 green (all 5 files: calculations, config, state, GlucoseTitrationGrid, GirCalculator)
- `pnpm build` → success (SPA + PWA service worker generated)
- `git diff --stat src/lib/shared/components/` → empty (ARCH-06 zero-new-props guarantee)
- `grep 'aria-live="polite"' src/lib/gir/GirCalculator.svelte` → 2 hits (both heroes)
- `grep 'Dextrose &gt;12.5%' src/lib/gir/GirCalculator.svelte` → hit
- `grep 'Starting GIR by population' src/lib/gir/GirCalculator.svelte` → hit
- `grep '<GirCalculator />' src/routes/gir/+page.svelte` → hit
- `grep 'coming online' src/routes/gir/+page.svelte` → no hits (placeholder removed)

## Deviations from Plan

None — plan executed exactly as written (verbatim skeleton). Note: the `>` character inside `Dextrose >12.5%` is rendered as HTML entity `&gt;` inside the Svelte template, per the plan's verbatim code block; this is semantically identical and is the correct Svelte rendering.

## Known Stubs

None. `/gir` now renders the full calculator composition end-to-end.

## Self-Check: PASSED

- FOUND: src/lib/gir/GirCalculator.svelte
- FOUND: src/lib/gir/GirCalculator.test.ts
- FOUND: src/routes/gir/+page.svelte (wired with `<GirCalculator />`)
- FOUND commit: 87a08b8
- FOUND commit: caec179
- FOUND commit: 2e4f4b9
- VERIFIED: src/lib/shared/components/ unchanged (ARCH-06)
- VERIFIED: pnpm build success
- VERIFIED: 40/40 gir tests green
