---
gsd_state_version: 1.0
milestone: v1.13
milestone_name: UAC/UVC Calculator + Favorites Nav
status: planning
stopped_at: Phase 40 context gathered (--auto)
last_updated: "2026-04-23T19:48:26.791Z"
last_activity: 2026-04-23 — Roadmap drafted for v1.13 (Phases 40-43, 41/41 requirements mapped)
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-23)

**Core value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.
**Current focus:** v1.13 — UAC/UVC Calculator + Favorites Nav (Phase 40 next)

## Current Position

Phase: 40 — Favorites Store + Hamburger Menu (not started)
Plan: —
Status: Roadmap complete, ready to plan Phase 40
Last activity: 2026-04-23 — Roadmap drafted for v1.13 (Phases 40-43, 41/41 requirements mapped)

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 41
- v1.12: 7 plans across 4 phases (36-39), 52 commits
- v1.11: 1 plan, 1 commit
- v1.10: 3 plans across 3 phases (32-34)
- v1.9: 4 plans across 3 phases (29-31)
- v1.8: 9 plans across 3 phases (26-28), 13 commits

## Accumulated Context

### Decisions

- [v1.6]: SegmentedToggle is for 2-4 option choices only; SelectPicker stays for N-of-many
- [v1.6]: NumericInput min/max is advisory only — never auto-clamp
- [v1.8]: Identity hue research BEFORE PR to avoid repeat of earlier Morphine issues
- [v1.8]: Spreadsheet parity tests with ~1% epsilon (clinical calculators must match source authority)
- [v1.8]: Wave 0 latent-bug fixes before feature work (CalculatorId + NavShell + registry)
- [v1.13]: Ship favorites-nav BEFORE UAC/UVC to avoid bottom-bar overflow at 375px and throwaway code. Phase 40 delivers the store + hamburger (NavShell unchanged), Phase 41 flips NavShell to read from the store, Phase 42 lands UAC/UVC as a non-favorited 5th calculator that exercises the add/disable-at-cap flow end-to-end.
- [v1.13]: First-run favorites default `['morphine', 'formula', 'gir', 'feeds']` preserves the current v1.12 bottom bar so existing users see zero visible change at the Phase 41 cut.

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: --stopped-at
Stopped at: Phase 40 context gathered (--auto)
Resume file: --resume-file

**Planned Phase:** 40 (Favorites Store + Hamburger Menu) — 3 plans — 2026-04-23T19:48:26.788Z
