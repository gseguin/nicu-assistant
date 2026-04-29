---
gsd_state_version: 1.0
milestone: v1.15.1
milestone_name: iOS Polish & Drawer Hardening
status: executing
stopped_at: Phase 50 context gathered
last_updated: "2026-04-28T00:11:09.264Z"
last_activity: 2026-04-28
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-27)

**Core value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.
**Current focus:** Phase 49 — wave-2-visualviewport-drawer-anchoring

## Current Position

Phase: 49 (wave-2-visualviewport-drawer-anchoring) — EXECUTING
Plan: 3 of 3 complete; advancing to Plan 49-03
Status: Ready to execute
Last activity: 2026-04-29 - Completed quick task 260429-mkz: Migrate 4 state singletons to CalculatorStore<T>

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 56+ (v1.13 last counted; v1.14 + v1.15 added but not re-counted here)
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

- Run `/gsd-plan-phase 47` to break Phase 47 (Wave-0 Test Scaffolding) into plans. This phase is a Wave-0 blocker — must complete before Phases 48 + 49 can land their tests.
- Run `/gsd-plan-phase 48` to break Phase 48 (Wave-1 NOTCH + FOCUS) into plans (likely 2 sibling plans — NOTCH on `NavShell.svelte`, FOCUS on `InputDrawer.svelte` — that can land in either order or in parallel).
- Run `/gsd-plan-phase 49` to break Phase 49 (Wave-2 visualViewport Drawer) into plans. Largest surface; most testing time. Depends on Phase 47.
- Run `/gsd-plan-phase 50` to plan the real-iPhone smoke checklist (`.planning/v1.15.1-IPHONE-SMOKE.md`). Phase gate — blocks milestone close.
- Run `/gsd-plan-phase 51` to break Phase 51 (Release v1.15.1) into plans after Phases 48 + 49 + 50 are green.

### Blockers/Concerns

None at the roadmap level. Two known iOS-research gaps to monitor during planning:

- iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125, Sep 2025) — mitigation pattern (re-read on every event, never cache) is industry-standard and survives by construction. Verify on latest available iOS during Phase 50 smoke.
- Keyboard-open detection threshold (`window.innerHeight − vv.height > 100`) — needs real-device tuning to filter URL-bar collapse (~50–80 px) without missing edge cases. Verify during Phase 50.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260429-lyq | Add CalculatorStore<T> generic class for state-singleton collapse (commit 1 of 5) | 2026-04-29 | 45d86cf | [260429-lyq-add-calculatorstore-t-generic-class-for-](./quick/260429-lyq-add-calculatorstore-t-generic-class-for-/) |
| 260429-m79 | Migrate uac-uvc state singleton to CalculatorStore<UacUvcStateData> (commit 2 of 5) | 2026-04-29 | 66cf633 | [260429-m79-migrate-uac-uvc-state-singleton-to-calcu](./quick/260429-m79-migrate-uac-uvc-state-singleton-to-calcu/) |
| 260429-mkz | Migrate gir/morphine/feeds/fortification state singletons to CalculatorStore<T> (commit 3 of 5) | 2026-04-29 | d10ffc4 | [260429-mkz-migrate-gir-morphine-feeds-fortification](./quick/260429-mkz-migrate-gir-morphine-feeds-fortification/) |

## Session Continuity

Last session: 2026-04-28T00:11:09.255Z
Stopped at: Phase 50 context gathered
Resume file: 

.planning/phases/50-wave-3-real-iphone-smoke-gate/50-CONTEXT.md
