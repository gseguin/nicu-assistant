---
gsd_state_version: 1.0
milestone: v1.15.1
milestone_name: iOS Polish & Drawer Hardening
status: planning
last_updated: "2026-04-27T06:00:06.770Z"
last_activity: 2026-04-27
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-25)

**Core value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.
**Current focus:** Phase 45 — Desktop Full-Nav Divergence

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-27 — Milestone v1.15.1 started

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 56
- v1.13: 15 plans across 5 phases (40, 41, 42, 42.1, 43), shipped 2026-04-24
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
- [v1.13]: First-run favorites default `['morphine-wean', 'formula', 'gir', 'feeds']` preserves the v1.12 bottom bar so existing users see zero visible change at the Phase 41 cut.
- [v1.13]: DESIGN.md / DESIGN.json (project root) is the design contract — all named rules (Identity-Inside, Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong, Five-Roles-Only, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, Flat-Card-Default) enforced by review. v1.14 explicitly declares NO new tokens, NO rule additions.
- [v1.14]: Kendamil and Desktop Full-Nav are independently structured phases (Phase 44, Phase 45) with no shared code paths — split rather than combined to keep each phase independently verifiable and to match the project's "one feature area per phase" pattern.
- [v1.14]: Mobile bottom bar is explicitly UNCHANGED — favorites-driven, 4-cap, hamburger-managed. Only the desktop top toolbar diverges to render the full registry.
- [44-01]: Used HCP-printed displacement_factor 0.77 for all three Kendamil variants (D-03 derivation rounds to 0.77 anyway; matches REQUIREMENTS KEND-01 + 2dp config style)
- [44-01]: JSDoc audit-trail header at top of fortification-config.ts; per-variant lines carry URL + region + ISO date only (raw HCP values stay in PLAN/RESEARCH per D-14)
- [45-01] Phase 45 Plan 01 — Desktop top toolbar diverged from mobile bottom bar via desktopVisibleCalculators const + mobileVisibleCalculators rename. Auto-scroll active tab + ResizeObserver mask-fade affordances added inline.
- [45-01] Element.prototype.scrollIntoView shimmed in test-setup.ts (jsdom polyfill convention) — no-op shim alongside ResizeObserver / matchMedia / Element.animate.

### Roadmap Evolution

- v1.13 archived to `.planning/milestones/v1.13-ROADMAP.md`; main ROADMAP.md collapses v1.13 under `<details>` consistent with the v1.10/v1.11/v1.12 archive convention.
- v1.14 phases 44-46 added as the active section. No decimal phases anticipated (scope is JSON-only Kendamil + NavShell branch split, with explicit "no DESIGN.md changes" / "no new identity hues" Out of Scope guards).

### Pending Todos

- Run `/gsd-plan-phase 44` to break Phase 44 (Kendamil Formula Family) into plans.
- Run `/gsd-plan-phase 45` to break Phase 45 (Desktop Full-Nav Divergence) into plans (can run before, after, or in parallel with Phase 44).
- Run `/gsd-plan-phase 46` to break Phase 46 (Release v1.14.0) into plans after both feature phases are green.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-25T04:47:55.681Z
Stopped at: Completed 45-01-PLAN.md
Resume file: None

**Planned Phase:** 45 () — 0 plans — 2026-04-25T04:36:57.642Z
