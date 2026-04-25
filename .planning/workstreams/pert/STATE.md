---
workstream: pert
created: 2026-04-25
---

# Project State — Workstream `pert`

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements for milestone v1.15
Last activity: 2026-04-25 — Milestone v1.15 (Pediatric EPI PERT Calculator) started in workstream `pert`

## Progress

**Phases Complete:** 0
**Current Plan:** N/A

## Session Continuity

**Stopped At:** N/A
**Resume File:** None

## Accumulated Context

- **Source of truth:** `epi-pert-calculator.xlsx` Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`)
- **Reference codebase:** `/home/ghislain/src/pert-calculator` (SvelteKit 2 + Svelte 5, same family) — mine `dosing.ts`, `clinical-config.json` step-config pattern, SelectPicker formula picker, but NOT the adult tabs or Capacitor build
- **Workstream scope:** parallel to main `v1.14` (Kendamil + desktop nav) — must not touch `src/lib/fortification/` or `src/lib/shell/NavShell.svelte` desktop branch beyond the registry-driven extension that adding a 6th calculator already provides
- **Reuse first:** existing `<HeroResult>`, `<SegmentedToggle>`, `<NumericInput>`, `<SelectPicker>`, `<RangedNumericInput>`, sticky `<InputDrawer>` — no new shared components expected
