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
- v1.14 Kendamil Formulas + Desktop Full Nav - Phases 44-46 (shipped 2026-04-25)
- v1.15 Pediatric EPI PERT Calculator - workstream archive `milestones/ws-pert-2026-04-26/` (shipped 2026-04-26; workstream-internal phases 01-05, no main-roadmap phase numbers consumed)
- [v1.15.1 iOS Polish & Drawer Hardening](milestones/v1.15.1-ROADMAP.md) - Phases 47-49 + 51 (shipped 2026-05-17; SMOKE-01..10 deferred)
- **v1.17 Remove PERT Calculator** - Phases 52-54 (opened 2026-05-17; active)

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

<details>
<summary>v1.14 Kendamil Formulas + Desktop Full Nav (Phases 44-46) — SHIPPED 2026-04-25</summary>

- [x] **Phase 44: Kendamil Formula Family** — Three Kendamil infant-formula entries (Organic, Classic, Goat) added to `fortification-config.json` under a "Kendamil" manufacturer grouping with `packetsSupported: false`; spreadsheet-parity unit tests for each variant within 1% epsilon; SelectPicker grouping test extended; existing fortification axe sweeps re-run with a Kendamil variant selected.
- [x] **Phase 45: Desktop Full-Nav Divergence** — `visibleCalculators` in `NavShell.svelte` split into `mobileVisibleCalculators` (favorites-driven, 4-cap, unchanged from v1.13) and `desktopVisibleCalculators` (registry-driven, all calculators); v1.13 visual contracts preserved on desktop; auto-scroll active tab + ResizeObserver mask-fade affordances; Vitest + Playwright E2E + extended axe sweep at 1280. (3/3 plans)
- [x] **Phase 46: Release v1.14.0** — `package.json` → 1.14.0; PROJECT.md Validated list updated; REQUIREMENTS.md traceability flipped; full clinical gate green.

See [milestones/v1.14-ROADMAP.md](milestones/v1.14-ROADMAP.md) for full phase details (or git log if archive not yet written).

</details>

<details>
<summary>v1.15 Pediatric EPI PERT Calculator — SHIPPED 2026-04-26 (workstream archive)</summary>

The PERT calculator (sixth clinical calculator) shipped as a self-contained workstream rather than as main-roadmap-numbered phases. Workstream-internal phase numbering 01-05 (Architecture + Identity Hue + Clinical Data; Calculator Core + Both Modes + Safety; Tests; SelectPicker Bridge Fix [3.1]; Design Polish; Release). No main-roadmap phase numbers consumed — v1.14 ended at Phase 46 and v1.15.1 picks up at Phase 47.

**Note (2026-05-17):** PERT calculator scheduled for removal in v1.17 — out of clinical scope (pediatric, not neonatal). Workstream archive preserved as historical record.

See [milestones/ws-pert-2026-04-26/ROADMAP.md](milestones/ws-pert-2026-04-26/ROADMAP.md) for full workstream archive.

</details>

<details>
<summary>v1.15.1 iOS Polish & Drawer Hardening (Phases 47-49 + 51) — SHIPPED 2026-05-17 (SMOKE deferred)</summary>

- [x] **Phase 47: Wave-0 — Test Scaffolding** — `window.visualViewport` polyfill in `src/test-setup.ts`; reusable `simulateKeyboardOpen/Down/_reset` helpers at `src/lib/test/visual-viewport-mock.ts`; new `webkit-iphone` Playwright project in `playwright.config.ts` (preserves existing `chromium` project). Closes blockers P-18 + P-19. (3/3 plans)
- [x] **Phase 48: Wave-1 — Trivial Fixes (NOTCH + FOCUS)** — NOTCH on `NavShell.svelte` (`pt-[env(safe-area-inset-top,0px)]` + `px-[max(env(safe-area-inset-left,0px),1rem)]` + `bg-[var(--color-surface)]` paints into the inset). FOCUS on `InputDrawer.svelte` (delete `queueMicrotask` block + add `autofocus` to close button via hybrid declarative+imperative workaround for Svelte 5; explicit no-input-focused vitest assertion + source-grep regression guard + cross-calculator Playwright spec). (2/2 plans)
- [x] **Phase 49: Wave-2 — visualViewport Drawer Anchoring** — New `$state` singleton `src/lib/shared/visualViewport.svelte.ts` (subscribes to `vv.resize` only; rebinds on `pageshow.persisted` + `visibilitychange` for bfcache; initialized from `+layout.svelte:onMount`). `InputDrawer.svelte` `.input-drawer-sheet` consumes `--ivv-bottom` + `--ivv-max-height` CSS custom properties via `$derived ivvStyle` (NEVER applied to outer `<dialog>` — preserves SelectPicker dialog-inside-drawer). Unit + component + Playwright `webkit-iphone` tests + 16/16 axe re-run. (3/3 plans)
- [~] **Phase 50: Wave-3 — Real-iPhone Smoke Gate** — DEFERRED at milestone close. `.planning/v1.15.1-IPHONE-SMOKE.md` blocking checklist (SMOKE-01..10) requires clinician with iPhone 14 Pro+ in standalone PWA mode. Re-opens v1.13 D-12 deferral; carries forward into v1.16+. See STATE.md Deferred Items.
- [x] **Phase 51: Release v1.15.1** — `package.json` 1.15.0 → 1.15.1 → 1.16.0 → 1.16.1 (shipped under v1.16.x via quick tasks before milestone close); AboutSheet auto via `__APP_VERSION__`; PROJECT.md Validated list updated; REQUIREMENTS.md traceability flipped (44 IDs, SMOKE-01..10 marked Pending/deferred); ROADMAP.md collapsed; archived to `.planning/milestones/v1.15.1-{REQUIREMENTS,ROADMAP,phases}/`; automated clinical gate green (svelte-check 0/0, vitest 454/454, Playwright `chromium` + `webkit-iphone`, extended axe 16/16); SMOKE sign-off (REL-04 portion) deferred.

See [milestones/v1.15.1-ROADMAP.md](milestones/v1.15.1-ROADMAP.md) for full phase details + Order Rationale.

</details>

### v1.17 Remove PERT Calculator (Phases 52-54) — ACTIVE (opened 2026-05-17)

**Milestone goal:** Cleanly remove the PERT (Pediatric Enzyme Replacement Therapy) calculator from NICU Assistant. PERT is a pediatric tool, not a neonatal one — it does not belong in this product's clinical scope. Five clinical calculators remain after removal: formula, morphine-wean, GIR, feeds, UAC/UVC. Milestone label re-syncs with package version (1.16.1 → 1.17.0).

**Phase numbering:** v1.15.1 closed at Phase 51; v1.17 picks up at Phase 52. (v1.16 label skipped — package version drifted to 1.16.x during v1.15.1 quick-task patches; this milestone re-aligns label with package.)

- [x] **Phase 52: Code Purge + Test Suite Repair** — Atomic removal of all PERT source + immediate test repair so the suite is green again at phase close (PURGE-01..06 + TEST-01..08, 14 reqs) (completed 2026-05-23)
- [x] **Phase 53: Favorites Safety Net + Verification** — Verify (and add if missing) graceful filtering of unknown calculator IDs in `favoritesStore` so v1.15+ users with PERT favorited load cleanly; regression test (SAFE-01..03, 3 reqs) (completed 2026-05-23)
- [x] **Phase 54: Documentation Cleanup + Release v1.17.0** — PROJECT.md / MILESTONES.md / Key Decisions updates, version bump, AboutSheet verification, full clinical gate, milestone archive (DOC-01..06 + REL-01..04, 10 reqs) (completed 2026-05-24)

### Phase Details

#### Phase 52: Code Purge + Test Suite Repair
**Goal:** Remove every byte of PERT source code and bring the test suite back to green in a single atomic phase, leaving the repo buildable + testable at the phase boundary.
**Depends on:** Nothing (first phase of milestone)
**Requirements:** PURGE-01, PURGE-02, PURGE-03, PURGE-04, PURGE-05, PURGE-06, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08
**Success Criteria** (what must be TRUE):
  1. `src/lib/pert/` directory does not exist; `src/routes/pert/+page.svelte` does not exist; navigating to `/pert` in dev/preview returns the SvelteKit not-found fallback.
  2. `CalculatorId` type union is exactly `'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc'`; `CALCULATOR_REGISTRY` has 5 alphabetically-ordered entries; AboutSheet content map has 5 keys; `.identity-pert` no longer appears in `src/app.css` for either theme.
  3. No source file under `src/`, `e2e/`, or `playwright.config.ts` contains the string `pert` or `PERT` outside of historical comments documenting the removal (verifiable by `git grep -i 'pert' src/ e2e/`).
  4. `pnpm test` (vitest) exits 0 with all suites green; `pnpm exec playwright test` runs both `chromium` and `webkit-iphone` projects with zero PERT-related failures (any pre-existing unrelated failures unchanged from v1.15.1 close).
  5. `pnpm svelte-check` reports 0 errors / 0 warnings across the post-purge codebase.
**Plans:** 3/3 plans complete
- [x] 52-01-PLAN.md — Source purge: delete src/lib/pert/, src/routes/pert/, e2e/pert*.spec.ts, registry edit, NavShell.test.ts surgery (PURGE-01, 02, 03, 06; TEST-01, 08)
- [x] 52-02-PLAN.md — Source-side integration: CalculatorId union, about-content.ts, app.css identity-pert, shell-layer comment generalization (PURGE-03, 04, 05, 06)
- [x] 52-03-PLAN.md — Test-file surgery: registry.test.ts, HamburgerMenu.test.ts, CalculatorPage.test.ts, calculator-store.test.ts, favorites.test.ts +T-21, desktop-full-nav.spec.ts, drawer-no-autofocus.spec.ts (TEST-02..08)

#### Phase 53: Favorites Safety Net + Verification
**Goal:** Ensure a user who upgraded from v1.15+ with `'pert'` in their `localStorage` favorites array experiences zero disruption — the unknown ID is silently filtered, the app loads cleanly, no console errors, no missing-icon placeholders.
**Depends on:** Phase 52 (the `CalculatorId` union must already exclude `'pert'` for the filter to treat it as unknown)
**Requirements:** SAFE-01, SAFE-02, SAFE-03
**Success Criteria** (what must be TRUE):
  1. Loading the app with `localStorage` containing `nicu:favorites = {v:1, ids:['morphine-wean','formula','pert','gir']}` renders the bottom bar / hamburger menu / desktop nav with exactly the three valid IDs in their original order and no console errors, warnings, or missing-icon placeholders.
  2. A vitest case (`favorites.test.ts`) explicitly asserts that `['morphine-wean', 'formula', 'pert', 'gir']` from `localStorage` resolves to `favorites.current === ['morphine-wean', 'formula', 'gir']` (PERT silently dropped, order preserved); the test fails meaningfully if the filter is removed.
  3. A vitest case verifies the first-run defaults array does not contain `'pert'` — regression guard documenting that defaults stay the v1.13 baseline `['morphine-wean', 'formula', 'gir', 'feeds']`.
**Plans:** 1/1 plans complete
- [x] 53-01-PLAN.md — SAFE-02 + SAFE-03 regression tests + full suite verification (SAFE-01, SAFE-02, SAFE-03)

#### Phase 54: Documentation Cleanup + Release v1.17.0
**Goal:** Bring all project documentation in sync with the 5-calculator reality, bump the package to 1.17.0, run the full clinical gate, and archive the milestone.
**Depends on:** Phase 53
**Requirements:** DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, REL-01, REL-02, REL-03, REL-04
**Success Criteria** (what must be TRUE):
  1. `PROJECT.md` Validated list moves the v1.15 PERT entry to an `Invalidated / Removed` subsection (DOC-01); Context section + Architecture section + Glossary describe five calculators with no PERT references except explicit historical-record annotations (DOC-02..04); Key Decisions table updates the "Ship PERT as self-contained workstream" outcome to a final removed state (DOC-06).
  2. `MILESTONES.md` has a v1.17 entry at the top following the standard format (phases, plans, key accomplishments, deferred items); v1.15 PERT entry annotated `[REMOVED in v1.17 — out of clinical scope]` (DOC-05).
  3. `package.json` reports `"version": "1.17.0"` and the running app's AboutSheet displays `v1.17.0` via the existing `__APP_VERSION__` build-time constant (REL-01, REL-02).
  4. Full clinical gate green: `pnpm svelte-check` 0/0 across all files; `pnpm test` all suites green; `pnpm exec playwright test` `chromium` + `webkit-iphone` projects green; extended axe sweeps green in both light + dark themes (count drops by the 4 retired PERT a11y sweeps) (REL-03).
  5. STATE.md frontmatter status flipped to `complete`; v1.17 archived under `.planning/milestones/v1.17-{REQUIREMENTS,ROADMAP,phases}/` via `/gsd:complete-milestone`; `PROJECT.md` Last-updated footer reflects release date (REL-04).
**Plans:** 2/2 plans complete
- [x] 54-01-PLAN.md — DOC-01..06 edits (PROJECT.md + MILESTONES.md) + REL-01 version bump to 1.17.0
- [x] 54-02-PLAN.md — REL-02/03 clinical gate verification + REL-04 STATE.md/footer groundwork

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
| 44-46 | v1.14 | — | Complete | 2026-04-25 |
| ws-pert | v1.15 | — | Complete | 2026-04-26 |
| 47-49 + 51 | v1.15.1 | 9/9 (Phase 50 deferred) | Complete (SMOKE deferred) | 2026-05-17 |
| 52 | v1.17 | 3/3 | Complete    | 2026-05-23 |
| 53 | v1.17 | 1/1 | Complete    | 2026-05-23 |
| 54 | v1.17 | 2/2 | Complete   | 2026-05-24 |
