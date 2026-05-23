---
gsd_state_version: 1.0
milestone: v1.17
milestone_name: Remove PERT Calculator
status: ready_to_plan
stopped_at: Phase 52 complete (3/3) — ready to discuss Phase 53
last_updated: 2026-05-23T23:06:02.962Z
last_activity: 2026-05-23 -- Phase 52 execution started
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 3
  completed_plans: 3
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.
**Current focus:** Phase 53 — favorites safety net + verification

## Current Position

Phase: 53
Plan: Not started
Status: Ready to plan
Last activity: 2026-05-23

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 65+ (v1.15.1 added 9 plans across Phases 47–49)
- v1.15.1: 9 plans across 4 phases (47, 48, 49, 50-planning-only); 63 commits; shipped 2026-05-17 (Phase 50 SMOKE deferred)
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
- [v1.13]: DESIGN.md / DESIGN.json (project root) is the design contract — all named rules (Identity-Inside, Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong, Five-Roles-Only, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, Flat-Card-Default) enforced by review.
- [v1.14]: Kendamil and Desktop Full-Nav are independently structured phases (Phase 44, Phase 45) with no shared code paths — split rather than combined to keep each phase independently verifiable.
- [v1.14]: Mobile bottom bar is explicitly UNCHANGED — favorites-driven, 4-cap, hamburger-managed. Only the desktop top toolbar diverges to render the full registry.
- [v1.15]: PERT shipped as a self-contained workstream (`milestones/ws-pert-2026-04-26/`) with internal phase numbering 01-05 — did NOT consume main-roadmap phase numbers. v1.14 ended at Phase 46; v1.15.1 picks up at Phase 47.
- [v1.15.1]: Wave structure is non-negotiable per HIGH-confidence research convergence. Wave-0 (Phase 47, Test Scaffolding) MUST land before any feature code or visualViewport-aware tests give green-by-accident. Wave-1 NOTCH + FOCUS combined into a single phase (Phase 48) because they touch different files (`NavShell.svelte` vs `InputDrawer.svelte`), have no shared state, and at granularity `coarse` two phases for ~10 LOC each is over-fragmented. Wave-2 (Phase 49, visualViewport Drawer) is its own phase due to size + risk concentration (4 blocker pitfalls). Wave-3 (Phase 50, Real-iPhone Smoke) is a phase gate that closes v1.13 D-12 deferral — CI cannot prove the fix works.
- [v1.15.1]: Slip plan: Phase 49 (Wave-2 visualViewport) is the most complex; if it slips, Phases 47 + 48 still close 2/3 of bedside complaints (notch + auto-focus) and Wave-2 becomes v1.15.2.
- [v1.17]: Milestone label v1.16 → v1.17 to re-sync with package version (drifted to 1.16.x during v1.15.1 quick-task patches). v1.16 label intentionally skipped, not consumed.
- [v1.17]: Three-phase shape — Phase 52 bundles all PURGE + TEST requirements into one atomic phase because deleting the `'pert'` member from the `CalculatorId` union, dropping the registry entry, and removing `src/lib/pert/` will immediately cascade into svelte-check + vitest + Playwright failures; splitting purge from test-repair would leave the codebase non-buildable between phases. Phase 53 isolates the SAFE-01..03 defensive favorites-filtering work (favoritesStore D-21 comment suggests the filter may already exist; phase verifies + adds regression test rather than rewriting). Phase 54 groups DOC + REL as the single "ship it" wrap-up.
- [v1.17]: No clinical data preserved — there is no plan to return PERT to this product. The workstream archive `milestones/ws-pert-2026-04-26/` stays in the repo as historical record.

### Roadmap Evolution

- v1.13 archived to `.planning/milestones/v1.13-ROADMAP.md`; main ROADMAP.md collapses v1.13 under `<details>` consistent with the v1.10/v1.11/v1.12 archive convention.
- v1.14 phases 44-46 collapsed under `<details>` after v1.14 shipped 2026-04-25.
- v1.15 PERT was a self-contained workstream archived to `milestones/ws-pert-2026-04-26/`; collapsed under `<details>` in main ROADMAP. Did NOT consume main-roadmap phase numbers.
- v1.15.1 phases 47-51 collapsed under `<details>` after v1.15.1 shipped 2026-05-17. 44 requirements mapped across 5 phases; SMOKE-01..10 deferred.
- v1.17 phases 52-54 added as the active section (2026-05-17). 26 requirements (PURGE-01..06, TEST-01..08, SAFE-01..03, DOC-01..06, REL-01..04) mapped 100% across 3 phases. No decimal phases anticipated — scope is bounded by the explicit removal-not-rewrite decision.

### Pending Todos

- Execute Phase 52 via `/gsd:execute-phase 52` (Code Purge + Test Suite Repair). Plans verified + committed (639d1ba).

### Blockers/Concerns

None at the roadmap level. The deferred v1.15.1 SMOKE-01..10 (real-iPhone gate) carries forward independently and is explicitly out of scope for v1.17. When SMOKE eventually runs, SMOKE-10 should be re-scoped from 6 calculators to 5 (PERT removed).

## Deferred Items

Items acknowledged and deferred at v1.15.1 milestone close (2026-05-17) — carry forward into v1.17 and beyond:

| Category | Item | Status | Reason |
|----------|------|--------|--------|
| smoke | SMOKE-01 .planning/v1.15.1-IPHONE-SMOKE.md checklist artifact | Pending | Human-blocked — requires clinician with real iPhone 14 Pro+ in standalone PWA mode |
| smoke | SMOKE-02 Hamburger/wordmark/theme below Dynamic Island (portrait) | Pending | Human verification required |
| smoke | SMOKE-03 Drawer opens with no keyboard; focus on close button; VoiceOver | Pending | Human verification required |
| smoke | SMOKE-04 Tap weight field → keyboard up → drawer ≥ 8 px above keyboard | Pending | Human verification required |
| smoke | SMOKE-05 Done dismisses keyboard → drawer returns flush; no flicker | Pending | Human verification required (iOS 26 #800125) |
| smoke | SMOKE-06 bfcache restore (call yourself / app switch) renders flush | Pending | Human verification required |
| smoke | SMOKE-07 Hardware-keyboard-paired iPhone does NOT lift drawer | Pending | Human verification required |
| smoke | SMOKE-08 Landscape inset respected; portrait re-rotation preserved | Pending | Human verification required |
| smoke | SMOKE-09 Light-mode black-translucent status-bar text legibility | Pending | Human verification required |
| smoke | SMOKE-10 All 6 calculators smoke-tested for drawer + notch | Pending | Re-scope to 5 calculators when run after v1.17 ships (PERT removed) |
| release | REL-04 (v1.15.1) final clinical gate (smoke sign-off portion) | Partial | Automated gates green at v1.15.1 close; SMOKE sign-off carries forward |

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260429-lyq | Add CalculatorStore<T> generic class for state-singleton collapse (commit 1 of 5) | 2026-04-29 | 45d86cf | [260429-lyq-add-calculatorstore-t-generic-class-for-](./quick/260429-lyq-add-calculatorstore-t-generic-class-for-/) |
| 260429-m79 | Migrate uac-uvc state singleton to CalculatorStore<UacUvcStateData> (commit 2 of 5) | 2026-04-29 | 66cf633 | [260429-m79-migrate-uac-uvc-state-singleton-to-calcu](./quick/260429-m79-migrate-uac-uvc-state-singleton-to-calcu/) |
| 260429-mkz | Migrate gir/morphine/feeds/fortification state singletons to CalculatorStore<T> (commit 3 of 5) | 2026-04-29 | d10ffc4 | [260429-mkz-migrate-gir-morphine-feeds-fortification](./quick/260429-mkz-migrate-gir-morphine-feeds-fortification/) |
| 260429-mr1 | Migrate PERT state singleton to CalculatorStore<PertStateData> with custom merge (commit 4 of 5) | 2026-04-29 | d092909 | [260429-mr1-migrate-pert-state-singleton-to-calculat](./quick/260429-mr1-migrate-pert-state-singleton-to-calculat/) |
| 260429-mwe | Collapse 6 calculator route shells into <CalculatorPage> + CalculatorModule; drop CalculatorContext (commit 5 of 5 — completes architecture deepening) | 2026-04-29 | 0ec8f98 | [260429-mwe-collapse-6-calculator-route-shells-into-](./quick/260429-mwe-collapse-6-calculator-route-shells-into-/) |
| 260430-cvl | Drop fullRow:true on PERT Formula RecapItem so it pairs with Volume in the recap row (matches every other calculator); bump 1.16.0 → 1.16.1 | 2026-04-30 | a96e037 | [260430-cvl-bump-patch-version-and-commit-pert-calcu](./quick/260430-cvl-bump-patch-version-and-commit-pert-calcu/) |

## Session Continuity

Last session: 2026-05-23T18:30:00.000Z
Stopped at: Phase 52 planning complete — plan-checker PASSED, 3 plans committed (639d1ba); ready to execute
Resume file: None (HANDOFF.json + .continue-here.md consumed and deleted)

## Operator Next Steps

- Run `/gsd:execute-phase 52` to execute Phase 52 (Code Purge + Test Suite Repair).
