---
workstream: pert
created: 2026-04-25
---

# Project State — Workstream `pert`

## Current Position

Phase: Phase 1 — Architecture, Identity Hue & Clinical Data — Context captured
Plan: —
Status: Ready to plan Phase 1
Last activity: 2026-04-25 — Phase 1 CONTEXT.md captured (4 areas: identity hue 285, feeds-shape config, localStorage state with mode sub-objects, alphabetical registry with cross-cutting favorites changes)

## Progress

**Phases Complete:** 0 / 5
**Current Plan:** N/A

## Session Continuity

**Stopped At:** Phase 1 context gathered
**Resume File:** `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-CONTEXT.md`
**Next Action:** `/gsd-plan-phase 1 --ws pert`

## Accumulated Context

- **Source of truth:** `epi-pert-calculator.xlsx` Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`)
- **Reference codebase:** `/home/ghislain/src/pert-calculator` (SvelteKit 2 + Svelte 5, same family) — mine `dosing.ts`, `clinical-config.json` step-config pattern, SelectPicker formula picker, but NOT the adult tabs or Capacitor build
- **Workstream scope:** parallel to main `v1.14` (Kendamil + desktop nav) — must not touch `src/lib/fortification/` or `src/lib/shell/NavShell.svelte` desktop branch beyond the registry-driven extension that adding a 6th calculator already provides
- **Reuse first:** existing `<HeroResult>`, `<SegmentedToggle>`, `<NumericInput>`, `<SelectPicker>`, `<RangedNumericInput>`, sticky `<InputDrawer>` — no new shared components expected
- **Phase shape:** 5 phases (Architecture+Hue+Data → Core+Modes+Safety → Tests → Design Polish → Release), mirroring v1.8 / v1.12 / v1.13 milestone cadence
- **Quality bar inherited from v1.13:** svelte-check 0/0, vitest all green, `pnpm build` ✓, Playwright E2E + extended axe suite (currently 33/33, target 35/35 after `/pert` light + dark sweeps)
