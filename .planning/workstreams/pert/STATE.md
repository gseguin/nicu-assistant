---
workstream: pert
created: 2026-04-25
---

# Project State — Workstream `pert`

## Current Position

Phase: Phase 1 — Architecture, Identity Hue & Clinical Data — **COMPLETE**
Plan: 5/5 plans complete across 4 waves (01-01 W0, 01-02+01-03 W1, 01-04 W2, 01-05 W3)
Status: Phase 1 verified — ready for Phase 2
Last activity: 2026-04-24 — Phase 1 executed and verified (5/5 success criteria, 14/14 requirements, 4/4 quality gates green; 0 defects)

## Progress

**Phases Complete:** 1 / 5
**Current Plan:** Phase 2 — Calculator Core (Both Modes + Safety) — not yet planned

## Session Continuity

**Stopped At:** Phase 1 complete + verified (HEAD = 017963a)
**Resume File:** `.planning/workstreams/pert/ROADMAP.md` (Phase 2 entry)
**Next Action:** `/gsd-plan-phase 2 --ws pert`

## Phase 1 outcomes (HEAD 017963a, baseline fcf3e4d → 9 commits)

- **Architecture:** `CalculatorId = 'pert'`, `CALCULATOR_REGISTRY` alphabetized (feeds, formula, gir, morphine-wean, pert, uac-uvc), `Pill` icon registered, favorites `defaultIds()` naturally returns `['feeds','formula','gir','morphine-wean']` and `recover()` preserves stored order verbatim (D-21).
- **Identity hue:** `.identity-pert` OKLCH tokens at hue 285 — light `oklch(42% 0.12 285)` / dark `oklch(80% 0.10 285)` — pass axe 4.5:1 first run, no retuning, no `disableRules`.
- **Clinical data:** `src/lib/pert/{types.ts, pert-config.json, config.ts, config.test.ts}` — 5 medications × 25 FDA-allowlisted strengths, 17 pediatric formulas with xlsx-sourced `fatGPerL`, 4 advisories including STOP-red max-lipase carve-out. Hostile-injection test verified (Pertzye=2.0 fails CI).
- **Route shell:** `/pert` renders heading + placeholder hero + Pill icon + AboutSheet entry citing xlsx pediatric tabs + DailyMed + 10,000 units/kg/day cap. State singleton with mode-specific sub-objects + most-recent-mode persistence.
- **Quality gates:** svelte-check 0/0 (4580 files), vitest 361/361 (38 files), pnpm build OK (PWA 50 entries / 563 KiB), Playwright CI 105/106 (1 unrelated baseline-flake on `disclaimer-banner.spec.ts:28` pre-existing).

## Phase 1 deviations applied (all auto, none Rule-4)

- 01-01: placeholder `pert` AboutSheet entry added (replaced fully in 01-04); NavShell + HamburgerMenu test specs updated for alphabetical order.
- 01-02: created `e2e/pert-a11y.spec.ts` (project topology) instead of plan-named `tests/playwright/extended-axe.spec.ts`; gated literal `/pert` axe sweeps behind `pertRouteReady` flag for 01-04 to flip.
- 01-03: **clinical-data corrections against xlsx parity authority** — Zenpep 60000 + Pancreaze 37000 strengths added; 11 of 17 formula `fatGPerL` values corrected. Phase 2 spreadsheet-parity tests will lock these against xlsx Pediatric Oral / Tube-Feed tabs.
- 01-04: re-baselined 3 pre-existing Playwright e2e specs (favorites-nav × 2 + navigation × 1) for alphabetical registry order; flipped `pertRouteReady = true`.

## Accumulated Context

- **Source of truth:** `epi-pert-calculator.xlsx` Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`)
- **Reference codebase:** `/home/ghislain/src/pert-calculator` (SvelteKit 2 + Svelte 5, same family) — mine `dosing.ts`, `clinical-config.json` step-config pattern, SelectPicker formula picker, but NOT the adult tabs or Capacitor build
- **Workstream scope:** parallel to main `v1.14` (Kendamil + desktop nav) — must not touch `src/lib/fortification/` or `src/lib/shell/NavShell.svelte` desktop branch beyond the registry-driven extension that adding a 6th calculator already provides
- **Reuse first:** existing `<HeroResult>`, `<SegmentedToggle>`, `<NumericInput>`, `<SelectPicker>`, `<RangedNumericInput>`, sticky `<InputDrawer>` — no new shared components expected
- **Phase shape:** 5 phases (Architecture+Hue+Data → Core+Modes+Safety → Tests → Design Polish → Release), mirroring v1.8 / v1.12 / v1.13 milestone cadence
- **Quality bar inherited from v1.13:** svelte-check 0/0, vitest all green, `pnpm build` ✓, Playwright E2E + extended axe suite — Phase 1 added 4 PERT axe sweeps (synthetic + literal × light + dark) all green first run.

## Accumulated Context

- **Source of truth:** `epi-pert-calculator.xlsx` Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`)
- **Reference codebase:** `/home/ghislain/src/pert-calculator` (SvelteKit 2 + Svelte 5, same family) — mine `dosing.ts`, `clinical-config.json` step-config pattern, SelectPicker formula picker, but NOT the adult tabs or Capacitor build
- **Workstream scope:** parallel to main `v1.14` (Kendamil + desktop nav) — must not touch `src/lib/fortification/` or `src/lib/shell/NavShell.svelte` desktop branch beyond the registry-driven extension that adding a 6th calculator already provides
- **Reuse first:** existing `<HeroResult>`, `<SegmentedToggle>`, `<NumericInput>`, `<SelectPicker>`, `<RangedNumericInput>`, sticky `<InputDrawer>` — no new shared components expected
- **Phase shape:** 5 phases (Architecture+Hue+Data → Core+Modes+Safety → Tests → Design Polish → Release), mirroring v1.8 / v1.12 / v1.13 milestone cadence
- **Quality bar inherited from v1.13:** svelte-check 0/0, vitest all green, `pnpm build` ✓, Playwright E2E + extended axe suite (currently 33/33, target 35/35 after `/pert` light + dark sweeps)
