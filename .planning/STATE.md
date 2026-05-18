---
gsd_state_version: 1.0
milestone: v1.17
milestone_name: Remove PERT Calculator
status: planning
last_updated: "2026-05-18T02:42:19.564Z"
last_activity: 2026-05-18
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.
**Current focus:** Planning next milestone (v1.16 — remove PERT calculator)

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-05-18 — Milestone v1.17 started

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
- [Phase 47-02]: Test helper convention: src/lib/test/ directory holds plain-TS framework-neutral helpers — First test helper (visual-viewport-mock.ts) imports nothing — no vitest/jest/mocha. Reusable from any future test runner. Distinct from src/lib/shared/ (runtime singletons) and src/test-setup.ts (setup-time polyfill installer).
- [Phase 47-02]: visual-viewport-mock helper mutates the live polyfill instance — never replaces window.visualViewport — Pitfall 2 from RESEARCH.md. Tests holding a 'const vv = window.visualViewport' reference must observe new values without refetching. Internal getPolyfill() applies the cast once; T-07 unit test is the regression sentinel against future 'replace instance' refactors.
- [Phase ?]: Synthetic-dispatch CI proxy via page.evaluate Object.defineProperty(window.visualViewport, ..., { configurable: true }) + dispatchEvent — real-iPhone soft keyboard verification deferred to Phase 50 SMOKE-04..07
- [Phase ?]: DRAWER-TEST-04 satisfied as regression-only gate (CONTEXT.md D-20) — 32 pre-existing Playwright failures (28 axe dlitem + 2 disclaimer-banner + 3 calc UI) verified to pre-exist on 66bf1d5 and logged to deferred-items.md per executor SCOPE BOUNDARY rule
- [Phase ?]: Build+preview path workaround for system inotify watcher saturation (ENOSPC) — single pnpm run preview started manually on port 5173 and reused via Playwright reuseExistingServer:true, avoiding both dev-server crash and CI=1 (forbidden by user memory feedback_playwright_no_ci_env)

### Roadmap Evolution

- v1.13 archived to `.planning/milestones/v1.13-ROADMAP.md`; main ROADMAP.md collapses v1.13 under `<details>` consistent with the v1.10/v1.11/v1.12 archive convention.
- v1.14 phases 44-46 collapsed under `<details>` after v1.14 shipped 2026-04-25.
- v1.15 PERT was a self-contained workstream archived to `milestones/ws-pert-2026-04-26/`; collapsed under `<details>` in main ROADMAP. Did NOT consume main-roadmap phase numbers.
- v1.15.1 phases 47-51 added as the active section (2026-04-27). 44 requirements mapped 100% across 5 phases. No decimal phases anticipated (scope is tightly bounded — no DESIGN.md changes, no new identity hues, no per-calculator behavioral changes).

### Pending Todos

- Run `/gsd-new-milestone 1.16 remove pert calculator` to open v1.16.

### Blockers/Concerns

None at the roadmap level. Two iOS-research gaps remain to be verified on real hardware as part of the deferred v1.15.1 SMOKE work (see Deferred Items below):

- iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125, Sep 2025) — mitigation pattern (re-read on every event, never cache) is industry-standard and survives by construction. Needs real-iPhone confirmation during deferred SMOKE-05 run.
- Keyboard-open detection threshold (`window.innerHeight − vv.height > 100`) — needs real-device tuning to filter URL-bar collapse (~50–80 px) without missing edge cases. Needs real-iPhone confirmation during deferred SMOKE-04/07.

## Deferred Items

Items acknowledged and deferred at v1.15.1 milestone close (2026-05-17):

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
| smoke | SMOKE-10 All 6 calculators smoke-tested for drawer + notch | Pending | Human verification required (PERT removed in v1.16 — re-scope to 5 calculators if SMOKE runs after v1.16 ships) |
| release | REL-04 final clinical gate (smoke sign-off portion) | Partial | Automated gates green at v1.15.1 close; SMOKE sign-off carries forward |
| quick_task | 260429-lyq Add CalculatorStore<T> generic class | Complete (audit manifest gap) | PLAN + SUMMARY exist; audit "missing" status is a manifest-entry artifact, not real work missing |
| quick_task | 260429-m79 Migrate uac-uvc state singleton to CalculatorStore | Complete (audit manifest gap) | PLAN + SUMMARY exist; ditto |
| quick_task | 260429-mkz Migrate gir/morphine/feeds/fortification state singletons | Complete (audit manifest gap) | PLAN + SUMMARY exist; ditto |
| quick_task | 260429-mr1 Migrate PERT state singleton with custom merge | Complete (audit manifest gap) | PLAN + SUMMARY exist; ditto |
| quick_task | 260429-mwe Collapse 6 calculator route shells into CalculatorPage | Complete (audit manifest gap) | PLAN + SUMMARY exist; ditto |
| quick_task | 260430-cvl PERT Formula RecapItem fullRow drop + version bump | Complete (audit manifest gap) | PLAN + SUMMARY exist; ditto |

This re-opens v1.13 D-12 (real-iPhone smoke gate). When SMOKE runs, expect SMOKE-10 to re-scope to 5 calculators (PERT removed in v1.16).

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

Last session: 2026-04-28T00:11:09.255Z
Stopped at: Phase 50 context gathered
Resume file: 

.planning/phases/50-wave-3-real-iphone-smoke-gate/50-CONTEXT.md

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
