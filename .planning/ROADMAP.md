# Roadmap: NICU Assistant

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-04-01)
- v1.1 Morphine Wean Calculator - Phases 5-6 (shipped 2026-04-02)
- v1.2 UI Polish - Phases 7-8 (shipped 2026-04-07)
- v1.3 Fortification Calculator Refactor - Phases 9-11 (shipped 2026-04-07) — see [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md)
- v1.4 UI Polish - Phases 12-17 (shipped 2026-04-07) — see [milestones/v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md)
- [v1.5 Tab Identity & Search](milestones/v1.5-ROADMAP.md) - Phases 18-20 (shipped 2026-04-07)
- [v1.6 Toggle & Harden](milestones/v1.6-ROADMAP.md) - Phases 21-24 (shipped 2026-04-08)
- [v1.7 Formula Micro-Polish](milestones/v1.7-ROADMAP.md) - Phase 25 (shipped 2026-04-08)
- [v1.8 GIR Calculator](milestones/v1.8-ROADMAP.md) - Phases 26-28 (shipped 2026-04-09)
- [v1.9 GIR Titration Hero Swap + Polish](milestones/v1.9-ROADMAP.md) - Phases 29-31 (shipped 2026-04-09)
- [v1.10 GIR Simplification + Dock + Tech Debt](milestones/v1.10-ROADMAP.md) - Phases 32-34 (shipped 2026-04-10)
- [v1.11 Morphine Mode Removal — Single Source of Truth](milestones/v1.11-ROADMAP.md) - Phase 35 (shipped 2026-04-09)
- v1.12 Feed Advance Calculator - Phases 36-39

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0-v1.9 (Phases 1-31) — SHIPPED</summary>

See individual milestone archives under `milestones/`.

</details>

<details>
<summary>v1.10 GIR Simplification + Dock + Tech Debt (Phases 32-34) — SHIPPED 2026-04-10</summary>

- [x] **Phase 32: GIR Simplification** — Remove summary hero card, per-card secondary metrics row, reference card; preserve click/tap visual treatment; drop `aria-live` (GIR-SIMP-06 dropped mid-flight) (1/1 plan)
- [x] **Phase 33: GIR Dock Magnification** — Port morphine-wean dock magnification to `GlucoseTitrationGrid` mobile branch; mobile + reduced-motion guards; MutationObserver (1/1 plan)
- [x] **Phase 34: Tech Debt Majors + Release v1.10** — `@types/node` 22→25, `typescript` 5→6 (zero source edits); `package.json` → 1.10.0; PROJECT.md Validated list with retired strikethroughs (1/1 plan)

See [milestones/v1.10-ROADMAP.md](milestones/v1.10-ROADMAP.md) for full phase details.

</details>

<details>
<summary>v1.11 Morphine Mode Removal — Single Source of Truth (Phase 35) — SHIPPED 2026-04-09</summary>

- [x] **Phase 35: Morphine Mode Removal + Release v1.11** — Remove linear/compounding mode toggle from Morphine Wean calculator. xlsx Sheet1 is the sole authoritative formula. Delete `WeanMode`, `calculateCompoundingSchedule`, `modes` config, SegmentedToggle usage. Lock spreadsheet-parity tests row-by-row against Sheet1. Bump v1.11.0. (1/1 plan)

See [milestones/v1.11-ROADMAP.md](milestones/v1.11-ROADMAP.md) for full phase details.

</details>

### v1.12 Feed Advance Calculator

- [x] **Phase 36: Wave 0 — Scaffolding + Identity Hue** — Extend `CalculatorId` union, registry entry, NavShell ternary, AboutSheet stub, `.identity-feeds` OKLCH token pair, `/feeds` placeholder route. Must compile before anything downstream. (completed 2026-04-10)
- [x] **Phase 37: Pure Logic + Config + Parity Tests** — Types, `feeds-config.json`, `calculations.ts` with named constants, locked spreadsheet-parity fixtures for Sheet1 (full nutrition) and Sheet2 (bedside advancement), parameter-matrix tests, config shape tests. Gate: vitest green before UI. (completed 2026-04-10)
- [x] **Phase 38: UI + State + Component Tests + Route + E2E + A11y** — `FeedAdvanceCalculator.svelte` with SegmentedToggle (Bedside Advancement + Full Nutrition modes), all inputs/dropdowns/outputs, safety advisories, `state.svelte.ts`, component tests, Playwright happy-path E2E, axe-core sweeps (20/20). (completed 2026-04-10)
- [ ] **Phase 39: Release v1.12.0** — Version bump, PROJECT.md Validated list, app favicon, final gates green.

## Phase Details

### Phase 36: Wave 0 — Scaffolding + Identity Hue
**Goal**: The app compiles with a visible 4th "Feeds" tab in the nav, a placeholder route, and a pre-audited OKLCH identity hue — unblocking all downstream phases
**Depends on**: Phase 35
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, ARCH-07, HUE-01, HUE-02, HUE-03
**Success Criteria** (what must be TRUE):
  1. User sees a 4th "Feeds" tab in the bottom nav (mobile) and top nav (desktop) with a distinct icon and label
  2. Tapping/clicking the Feeds tab navigates to `/feeds` and shows a placeholder page
  3. The Feeds tab has a visually distinct identity hue (not blue, not teal, not green) on its active indicator and placeholder content
  4. `pnpm check` and `pnpm test` pass with zero errors (no regressions from type union + registry extension)
  5. Pre-PR axe-core sweep confirms the new identity hue passes 4.5:1 contrast on all 4 identity surfaces in both themes
**Plans**: TBD
**UI hint**: yes

### Phase 37: Pure Logic + Config + Parity Tests
**Goal**: All Feed Advance calculation functions are implemented, tested, and locked to `nutrition-calculator.xlsx` Sheet1 and Sheet2 — the clinical correctness gate before any UI work
**Depends on**: Phase 36
**Requirements**: CORE-09, FREQ-04, FULL-04, FULL-05, FULL-06, FULL-07, SAFE-06, TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. Bedside advancement calculations (trophic/advance/goal ml/feed, total fluids ml/hr) match `nutrition-calculator.xlsx` Sheet2 row-by-row within ~1% epsilon for the canonical fixture (weight 1.94, default frequency, default cadence)
  2. Full nutrition calculations (dextrose kcal from BOTH lines, lipid kcal, enteral kcal, total kcal/kg/d) match `nutrition-calculator.xlsx` Sheet1 row-by-row within ~1% epsilon for the canonical fixture (weight 1.74)
  3. Unit constants (3.4 kcal/g dextrose, 2 kcal/ml lipid, 30 ml/oz) are named constants with JSDoc, not magic numbers
  4. Parameter-matrix tests cover every frequency x cadence dropdown combination for internal consistency
  5. `feeds-config.json` shape tests validate input ranges, dropdown options, and advisory thresholds
**Plans:** 2/2 plans complete
Plans:
- [x] 37-01-PLAN.md — Types, config (JSON + typed wrapper), and all pure calculation functions
- [x] 37-02-PLAN.md — Parity fixtures, spreadsheet-parity tests, parameter-matrix tests, config shape tests

### Phase 38: UI + State + Component Tests + Route + E2E + A11y
**Goal**: Clinicians can use the Feed Advance Calculator at the bedside (Bedside Advancement mode) and during rounds (Full Nutrition mode) with the same trust level as existing calculators
**Depends on**: Phase 37
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, FREQ-01, FREQ-02, FREQ-03, FREQ-05, IV-01, IV-02, IV-03, FULL-01, FULL-02, FULL-03, SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, TEST-05, TEST-06, TEST-07
**Success Criteria** (what must be TRUE):
  1. User can enter weight, trophic/advance/goal ml/kg/d and see three per-feed ml outputs simultaneously, with ml/kg/d echoed back next to each
  2. User can switch trophic frequency (q2h/q3h/q4h/q6h) and advance cadence dropdowns and see outputs update live without re-entering values
  3. User can toggle between Bedside Advancement and Full Nutrition modes via SegmentedToggle, with weight persisting across modes
  4. Full Nutrition mode accepts TPN dextrose (two parallel lines), SMOF ml, enteral volume + kcal/oz and shows total kcal/kg/d as the hero value
  5. Safety advisories appear when thresholds are crossed (trophic > advance, dextrose > 12.5%, total kcal/kg/d out of range) without blocking input
  6. Playwright happy-path passes at mobile 375 + desktop 1280 for both modes; axe-core sweeps bring total suite to 20/20 green
**Plans:** 2/2 plans complete
Plans:
- [x] 38-01-PLAN.md — Config extensions + state module + FeedAdvanceCalculator component + route + about-content
- [x] 38-02-PLAN.md — Component tests + Playwright E2E + axe-core a11y sweeps
**UI hint**: yes

### Phase 39: Release v1.12.0
**Goal**: v1.12.0 is shipped with version bump, documentation, favicon, and all gates green
**Depends on**: Phase 38
**Requirements**: REL-01, REL-02, REL-03, REL-04
**Success Criteria** (what must be TRUE):
  1. `package.json` shows version 1.12.0 and AboutSheet reflects it automatically
  2. PROJECT.md Validated list includes all v1.12 entries
  3. App has a distinct, recognizable favicon at all standard sizes (16x16 through 512x512)
  4. Final gates pass: svelte-check 0/0, vitest all green, Playwright all green, axe 20/20, `pnpm build` succeeds
**Plans:** 1 plan
Plans:
- [ ] 39-01-PLAN.md — Version bump to 1.12.0, PROJECT.md validated list update, favicon generation, final gates

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-25 | v1.0-v1.7 | — | Complete | 2026-04-08 |
| 26-28 | v1.8 | 9/9 | Complete | 2026-04-09 |
| 29-31 | v1.9 | 4/4 | Complete | 2026-04-09 |
| 32-34 | v1.10 | 3/3 | Complete | 2026-04-10 |
| 35    | v1.11 | 1/1 | Complete    | 2026-04-09 |
| 36. Wave 0 | v1.12 | 2/2 | Complete    | 2026-04-10 |
| 37. Pure Logic | v1.12 | 2/2 | Complete    | 2026-04-10 |
| 38. UI + E2E | v1.12 | 2/2 | Complete    | 2026-04-10 |
| 39. Release | v1.12 | 0/1 | Not started | - |
