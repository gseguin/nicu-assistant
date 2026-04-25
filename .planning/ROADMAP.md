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
- [v1.12 Feed Advance Calculator](milestones/v1.12-ROADMAP.md) - Phases 36-39 (shipped 2026-04-10)
- [v1.13 UAC/UVC Calculator + Favorites Nav](milestones/v1.13-ROADMAP.md) - Phases 40-43 (shipped 2026-04-24)
- **v1.14 Kendamil Formulas + Desktop Full Nav** - Phases 44-46 (in progress, started 2026-04-25)

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

<details>
<summary>v1.12 Feed Advance Calculator (Phases 36-39) — SHIPPED 2026-04-10</summary>

- [x] **Phase 36: Wave 0 — Scaffolding + Identity Hue** — CalculatorId union, registry, NavShell, identity-feeds OKLCH tokens, /feeds placeholder (2/2 plans)
- [x] **Phase 37: Pure Logic + Config + Parity Tests** — Types, config, calculations locked to xlsx Sheet1+Sheet2, parity tests (2/2 plans)
- [x] **Phase 38: UI + State + Component Tests + Route + E2E + A11y** — FeedAdvanceCalculator.svelte, state, component tests, Playwright E2E, 20/20 axe sweeps (2/2 plans)
- [x] **Phase 39: Release v1.12.0** — Version bump, PROJECT.md, favicon, final gates (1/1 plan)

See [milestones/v1.12-ROADMAP.md](milestones/v1.12-ROADMAP.md) for full phase details.

</details>

<details>
<summary>v1.13 UAC/UVC Calculator + Favorites Nav (Phases 40-43) — SHIPPED 2026-04-24</summary>

- [x] **Phase 40: Favorites Store + Hamburger Menu** — `favoritesStore` with localStorage persistence, 4-cap enforcement, schema-safe recovery, first-run defaults `['morphine-wean', 'formula', 'gir', 'feeds']`; hamburger button in title bar; full-screen/side-sheet menu listing every registered calculator with star toggles. (3/3 plans)
- [x] **Phase 41: Favorites-Driven Navigation** — NavShell rewritten so mobile bottom bar and desktop top nav render favorites only; Playwright E2E + axe sweep. (2/2 plans)
- [x] **Phase 42: UAC/UVC Calculator** — Wave-0 architecture, identity hue, pure calculation logic, weight input + slider sync, two distinct hero cards, AboutSheet entry, parity + component + E2E + axe tests. (3/3 plans)
- [x] **Phase 42.1: Design Polish + Redesign Sweep (INSERTED)** — DESIGN.md / DESIGN.json contract, shared `<HeroResult>`, mobile-nav clearance, Identity-Inside Rule, DisclaimerBanner v2, dock removal, root `/` redirect, em-dash purge, RangedNumericInput, 42.2 critique sweep, STOP-red carve-out. (6/6 plans)
- [x] **Phase 43: Release v1.13.0** — Version bump, PROJECT.md, REQUIREMENTS traceability (41 IDs), full clinical gate (svelte-check 0/0, vitest 340/340, Playwright 99/3 skipped, axe 33/33). (1/1 plan)

See [milestones/v1.13-ROADMAP.md](milestones/v1.13-ROADMAP.md) for full phase details.

</details>

### v1.14 Kendamil Formulas + Desktop Full Nav (Phases 44-46) — IN PROGRESS

- [ ] **Phase 44: Kendamil Formula Family** — Add three Kendamil infant-formula entries (Organic, Classic, Goat) to `fortification-config.json` under a "Kendamil" manufacturer grouping with `packetsSupported: false`; spec sourced from hcp.kendamil.com per variant; spreadsheet-parity unit tests for each variant within 1% epsilon; SelectPicker grouping test extended; existing fortification axe sweeps re-run with a Kendamil variant selected.
- [ ] **Phase 45: Desktop Full-Nav Divergence** — Split `visibleCalculators` in `NavShell.svelte` into `mobileVisibleCalculators` (favorites-driven, 4-cap, unchanged from v1.13) and `desktopVisibleCalculators` (registry-driven, all calculators); preserve every v1.13 visual contract on desktop (identity color indicators, focus rings, `aria-current` semantics, 48px touch targets); hamburger remains visible on desktop for AboutSheet routing; Vitest covers the new derived computation; Playwright E2E at 1280 verifies every registered calculator is visible regardless of favorites state; axe sweep extended to cover the desktop full toolbar in both themes.
- [ ] **Phase 46: Release v1.14.0** — `package.json` → 1.14.0; PROJECT.md Validated list updated with v1.14 entries; REQUIREMENTS.md traceability flipped to ✓ Validated for all v1.14 IDs; full clinical gate green (svelte-check 0/0, vitest green, `pnpm build` ✓, Playwright E2E + extended axe suite green in both themes).

## Phase Details

### Phase 44: Kendamil Formula Family
**Goal**: Clinicians can pick a Kendamil Organic, Classic, or Goat formula in the fortification calculator and get a spreadsheet-parity result, with the new manufacturer grouped naturally alongside Abbott / Mead Johnson / Nestlé / Nutricia.
**Depends on**: Nothing (first phase of v1.14; touches `src/lib/fortification/` only, no NavShell coupling)
**Requirements**: KEND-01, KEND-02, KEND-03, KEND-04, KEND-05, KEND-TEST-01, KEND-TEST-02, KEND-TEST-03
**Success Criteria** (what must be TRUE):
  1. User opening the formula picker on `/formula` sees a "Kendamil" manufacturer group containing all three variants (Organic, Classic, Goat) rendered alongside the existing manufacturer groups
  2. User selecting any Kendamil variant, entering a starting volume, and choosing a target calorie sees an "Amount to Add" hero result that matches a hand-computed expected value within the ~1% epsilon used by every other formula in `fortification.test.ts`
  3. User selecting a Kendamil variant sees the Packets unit hidden from the unit picker (consistent with v1.3 non-HMF behavior — `packetsSupported: false`)
  4. The fortification page passes axe sweeps in light + dark with a Kendamil variant selected (no contrast regression from the new manufacturer label)
  5. Each Kendamil variant's `calorie_concentration`, `displacement_factor`, and `grams_per_scoop` values are documented in the plan with the source URL from hcp.kendamil.com captured for clinical audit
**Plans**: TBD (run `/gsd-plan-phase 44` to break down)

### Phase 45: Desktop Full-Nav Divergence
**Goal**: Clinicians on a desktop workstation see every registered calculator in the top toolbar — never hidden behind the hamburger — while mobile clinicians keep the unchanged favorites-driven 4-cap bottom bar.
**Depends on**: Nothing structural (Phase 45 only touches `NavShell.svelte` + new tests; can run before, after, or in parallel with Phase 44)
**Requirements**: NAV-ALL-01, NAV-ALL-02, NAV-ALL-03, NAV-ALL-04, NAV-ALL-05, NAV-ALL-TEST-01, NAV-ALL-TEST-02, NAV-ALL-TEST-03
**Success Criteria** (what must be TRUE):
  1. User on desktop (md+) sees every registered calculator (currently 5: Morphine, Formula, GIR, Feeds, UAC/UVC) in the top toolbar regardless of which calculators they have favorited — toggling a calculator off via the hamburger removes it from the mobile bottom bar but leaves it in the desktop top bar
  2. User on mobile (< md) sees identical favorites-driven behavior as v1.13 — same 4-cap, same hamburger management, same `['morphine-wean', 'formula', 'gir', 'feeds']` first-run defaults; zero behavioral regressions to Phase 41 NAV-FAV-01..04
  3. User on desktop sees each calculator tab carry its identity color indicator (`identityClass`, `border-b-2` on active), focus-visible outlines, `aria-current="page"` on the active route, and a 48px touch target — every v1.13 visual contract preserved
  4. User on desktop sees the hamburger button remain in the title bar so they can re-read the disclaimer / open AboutSheet via the v1.13 NAV-FAV-04 routing
  5. User resizing the browser at 768px / 1024px / 1280px sees the desktop top toolbar reflow gracefully with all 5 calculators — no horizontal overflow, no truncated labels, no layout shift on hydration
**Plans**: 3 plans
- [ ] 45-01-PLAN.md — NavShell.svelte 9 verbatim edits (mobileVisibleCalculators rename + desktopVisibleCalculators const + 2 iteration updates + scroll-container restructure + ref/state + 2 $effects + scoped <style>) + NavShell.test.ts T-07..T-12 (NAV-ALL-01..05 + NAV-ALL-TEST-02)
- [ ] 45-02-PLAN.md — Create e2e/desktop-full-nav.spec.ts with 4 tests (NAV-ALL-TEST-01a..d)
- [ ] 45-03-PLAN.md — Create e2e/desktop-full-nav-a11y.spec.ts with 4 axe tests (NAV-ALL-TEST-03 — light/dark × 1280/768)
**UI hint**: yes

### Phase 46: Release v1.14.0
**Goal**: v1.14 is shipped: the Kendamil family is selectable, desktop renders the full registry, the AboutSheet shows v1.14.0, PROJECT.md tells the story of what landed, and the full clinical quality gate is green.
**Depends on**: Phase 44, Phase 45
**Requirements**: REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. User opening the About dialog sees version `1.14.0` (sourced via the existing `__APP_VERSION__` build-time constant — zero hardcoded version strings)
  2. A reader of PROJECT.md can see every v1.14 accomplishment captured in the Validated list with the milestone tag (Kendamil entries per ID, NAV-ALL entries per ID, REL entries)
  3. The full quality gate is green: svelte-check 0/0, vitest fully green (including the new Kendamil parity tests, the SelectPicker grouping test, and the NavShell `desktopVisibleCalculators` derived test), `pnpm build` succeeds, Playwright E2E passes (including the new desktop-full-nav E2E spec), and the axe suite passes in both themes (extended with the desktop full toolbar + Kendamil variant fortification sweeps)
**Plans**: TBD (run `/gsd-plan-phase 46` to break down)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-25 | v1.0-v1.7 | — | Complete | 2026-04-08 |
| 26-28 | v1.8 | 9/9 | Complete | 2026-04-09 |
| 29-31 | v1.9 | 4/4 | Complete | 2026-04-09 |
| 32-34 | v1.10 | 3/3 | Complete | 2026-04-10 |
| 35 | v1.11 | 1/1 | Complete | 2026-04-09 |
| 36-39 | v1.12 | 7/7 | Complete | 2026-04-10 |
| 40-43 | v1.13 | 15/15 | Complete | 2026-04-24 |
| 44. Kendamil Formula Family | v1.14 | 0/TBD | Not started | — |
| 45. Desktop Full-Nav Divergence | v1.14 | 0/3 | Not started | — |
| 46. Release v1.14.0 | v1.14 | 0/TBD | Not started | — |

## Order Rationale

**Why Kendamil and Desktop Full-Nav as two independent phases (not combined):** The two scopes touch entirely separate files — Kendamil is JSON-only (`fortification-config.json`) plus colocated parity tests inside `src/lib/fortification/`, while Desktop Full-Nav is `NavShell.svelte` plus colocated component tests plus Playwright specs. Zero shared code paths, zero shared test surfaces, zero ordering dependency. Splitting keeps each phase independently verifiable, lets failures in one not block the other, and matches the project's established "one feature area per phase" pattern (v1.3 fortification-only, v1.8 GIR-only, v1.12 feeds-only). At granularity `coarse` (3-5 phase target), 3 phases is the right floor — combining feature work into one phase would risk a sprawling commit and lose the clean phase-transition checkpoint between them.

**Why Phase 44 before Phase 45 (or parallel):** Either order works — they are structurally independent. The roadmap orders Kendamil first because it is the smaller, more contained change (add 3 entries to a JSON + tests) and lands faster, leaving a clear plate for the more design-sensitive NavShell refactor. If a contributor wants to flip the order or run them in parallel, nothing blocks that — `/gsd-plan-phase 45` can run before Phase 44 ships.

**Why Phase 46 (release) gates on both:** REL-01 bumps the package version to 1.14.0 — that bump should only land once both feature phases are green so the AboutSheet version reflects the full v1.14 surface. REL-03's clinical gate (svelte-check, vitest, build, Playwright + axe) by definition requires all v1.14 code in place. Standard release-phase pattern from v1.8 / v1.10 / v1.11 / v1.12 / v1.13.

**Why no urgent decimal-phase risk anticipated:** v1.13's Phase 42.1 was inserted because /impeccable critique surfaced cross-cutting design-contract gaps. v1.14 is a tightly scoped milestone (a JSON addition + a NavShell branch split) with no new identity hues, no new design tokens, no new components, no DESIGN.md changes (explicitly Out of Scope per REQUIREMENTS.md). Decimal-phase insertions remain available if a critique sweep surfaces something unexpected, but the scope is small enough that the most likely path is a clean 44 → 45 → 46 sequence.
