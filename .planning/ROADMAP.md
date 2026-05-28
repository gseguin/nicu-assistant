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
- [v1.17 Remove PERT Calculator](milestones/v1.17-ROADMAP.md) - Phases 52-54 (shipped 2026-05-24)
- **v1.18 Persistence Seam - Phases 55-58 (ACTIVE)**

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

<details>
<summary>v1.17 Remove PERT Calculator (Phases 52-54) — SHIPPED 2026-05-24</summary>

**Milestone goal:** Cleanly remove the PERT (Pediatric Enzyme Replacement Therapy) calculator — a pediatric tool out of NICU clinical scope. Five clinical calculators remain: formula, morphine-wean, GIR, feeds, UAC/UVC. Milestone label re-synced with package version (1.16.1 → 1.17.0; v1.16 label intentionally skipped).

- [x] **Phase 52: Code Purge + Test Suite Repair** — Atomic removal of all PERT source + test repair, suite green at phase close (PURGE-01..06 + TEST-01..08, 14 reqs) (completed 2026-05-23; 3/3 plans)
- [x] **Phase 53: Favorites Safety Net + Verification** — SAFE-02/03 regression tests proving `recover()` silently drops a stored `'pert'` favorite for v1.15+ upgraders (SAFE-01..03, 3 reqs) (completed 2026-05-23; 1/1 plan)
- [x] **Phase 54: Documentation Cleanup + Release v1.17.0** — Docs synced to 5-calculator reality, package → 1.17.0, clinical gate, milestone close (DOC-01..06 + REL-01..04, 10 reqs) (completed 2026-05-24; 2/2 plans)

Gates at close: svelte-check 0/0, vitest 410/410, build emits v1.17.0; zero PERT references in `src/`+`e2e/`. Playwright live run + SAFE-01 visual confirmation deferred to CI/human (see STATE.md Deferred Items).

See [milestones/v1.17-ROADMAP.md](milestones/v1.17-ROADMAP.md) for full phase details + Success Criteria.

</details>

### v1.18 Persistence Seam (Phases 55-58) — ACTIVE

**Milestone goal:** Hoist the hand-rolled localStorage read/write/guard pattern out of the four shared global singletons onto one deep persistence seam, so storage logic lives in one tested place instead of being re-implemented across four modules. Behavior-preserving — identical storage keys, identical persisted JSON shapes, zero user-visible change. The win is locality (storage failure handled once) and leverage (one interface, four call sites + every calculator slice), NOT new user features (architecture review candidate 1 + candidate 3 fold-in).

- [x] **Phase 55: Persistence Seam** — Extract the `PersistentValue<T>` seam: one guarded `read`/`write`/`remove` behind a single SSR/private-mode guard, JSON serialize/parse with parse-failure fallback to default, and a custom recover/migrate hook (covers disclaimer v1→v2 + favorites 6-step recovery). Co-located tests are the single test surface for persistence: SSR guard, quota/private-mode write throw, parse-failure fallback, migrate hook. (SEAM-01..04) (completed 2026-05-28)
- [x] **Phase 56: Migrate Shared Singletons** — Move the four genuinely-different adapters onto the seam as thin wrappers, behavior-preserving: `theme.svelte.ts` (plain value, key `nicu_assistant_theme`, `.dark` class + `data-theme` sync), `disclaimer.svelte.ts` (v1→v2 migration, v1 key NOT deleted), `favorites.svelte.ts` (key `nicu:favorites`, schema `{v:1, ids}`, 6-step recovery + 4-cap + stored-order via the seam's migrate hook), `lastEdited.svelte.ts` (per-key stamp + 60s stamp-debounce). Existing `favorites.test.ts` stays green through the migration. (MIG-01..04) (completed 2026-05-28)
- [ ] **Phase 57: Auto-Persist Behind CalculatorStore** — Fold candidate 3: `CalculatorStore` owns auto-persist; remove the copy-pasted `$effect(() => { JSON.stringify(state.current); state.persist() })` from all 5 `*Inputs.svelte` (gir, morphine, feeds, fortification, uac-uvc). Preserve drawer-only-mount persistence (an inputs fragment mounted alone in the mobile `InputDrawer` still persists on change) and the `lastEdited` 60s minute-debounce / no-effect-re-entry guarantee. Existing `calculator-store.test.ts` stays green. (AUTO-01..02)
- [ ] **Phase 58: Release v1.18.0** — `package.json` → 1.18.0 (AboutSheet auto via `__APP_VERSION__`); PROJECT.md Validated list + REQUIREMENTS.md traceability updated at milestone close; full clinical gate green (svelte-check 0/0, vitest fully green, `pnpm build` ✓, Playwright E2E + extended axe sweeps green in both themes). (REL-01..03)

## Phase Details

### Phase 55: Persistence Seam
**Goal**: One tested place owns guarded localStorage read/write/remove with JSON handling and a migrate hook, so no consumer touches `localStorage` directly.
**Depends on**: Nothing (first phase of milestone; builds on the existing `CalculatorStore<T>` pattern)
**Requirements**: SEAM-01, SEAM-02, SEAM-03, SEAM-04
**Success Criteria** (what must be TRUE):
  1. A `PersistentValue<T>` module exposes `read` / `write` / `remove`, each behind a single SSR/private-mode guard (`typeof localStorage === 'undefined'` + try/catch) — a grep confirms the four shared singletons are the only remaining direct `localStorage` callers (they migrate in Phase 56).
  2. Reading a key whose stored value is invalid JSON (or whose access throws a security error) returns the supplied default instead of throwing — the consumer never sees an exception.
  3. The seam accepts a custom recover/migrate hook that can transform stored data on read, expressive enough to express both the disclaimer v1→v2 migration and the favorites 6-step recovery (verified by a representative hook in the seam's own tests).
  4. Co-located tests cover the SSR guard (no `localStorage`), a write that throws (quota / private mode) handled silently, parse-failure fallback to default, and the migrate hook transforming stored data — this file is the single test surface for persistence.
**Plans**: 1 plan
Plans:
- [x] 55-01-PLAN.md — Create PersistentValue<T> seam module + co-located tests (SEAM-01..04)

### Phase 56: Migrate Shared Singletons
**Goal**: The four shared global singletons become thin adapters over the seam with byte-identical storage keys, JSON shapes, and observable behavior.
**Depends on**: Phase 55 (the adapters cannot migrate onto a seam that does not exist; SEAM-04 tests are the safety net that makes these behavior-preserving migrations verifiable)
**Requirements**: MIG-01, MIG-02, MIG-03, MIG-04
**Success Criteria** (what must be TRUE):
  1. Theme still persists under key `nicu_assistant_theme` and `get current` / `set` / `init` / `toggle` behave identically, including the `.dark` class + `data-theme` attribute sync — toggling theme and reloading restores the same theme as before the refactor.
  2. A returning user who acknowledged the disclaimer under the v1 key is still treated as acknowledged: the v1→v2 migration runs through the seam's migrate hook, the v1 key is NOT deleted (audit trail preserved), and `acknowledged` / `initialized` read the same as before.
  3. Favorites still persist under key `nicu:favorites` with schema `{v:1, ids}`; the 6-step recovery, 4-cap, and stored-order preservation run through the seam — a stored `'pert'` favorite is still silently dropped with order preserved (existing `favorites.test.ts` stays green).
  4. The per-key `lastEdited` stamp still writes under its `_ts` key, the 60s stamp-debounce that prevents effect re-entry still skips writes inside the window, and `clear` still removes the key.
  5. No storage key, persisted JSON shape, or migration/recovery edge case changes — the migration is invisible to any existing user's stored data.
**Plans**: 1 plan
Plans:
- [x] 56-01-PLAN.md — Migrate theme, disclaimer, favorites, lastEdited onto PersistentValue<T> seam (MIG-01..04)

### Phase 57: Auto-Persist Behind CalculatorStore
**Goal**: Auto-persist-on-change lives once inside `CalculatorStore`, removed from all five `*Inputs.svelte`, with drawer-only-mount persistence and the lastEdited re-entry guarantee preserved.
**Depends on**: Phase 55 (CalculatorStore already wraps the same guarded-localStorage pattern the seam formalizes; this phase folds the copy-pasted effect behind that store). Independent of Phase 56 — touches `CalculatorStore` + the calculator slices, not theme/disclaimer/favorites/lastEdited.
**Requirements**: AUTO-01, AUTO-02
**Success Criteria** (what must be TRUE):
  1. The copy-pasted `$effect(() => { JSON.stringify(state.current); state.persist() })` is gone from all 5 `*Inputs.svelte` (gir, morphine, feeds, fortification, uac-uvc) — a grep finds zero remaining copies and `CalculatorStore` owns auto-persist.
  2. Editing an input still persists across reload for every calculator, including when the inputs fragment is mounted ALONE inside the mobile `InputDrawer` (the original reason the effect was duplicated per-fragment).
  3. The `lastEdited` 60s minute-debounce still holds: rapid effect passes during a single render do not re-stamp, and Svelte 5 effect re-entry does not occur (no unbounded recursion) — `calculator-store.test.ts` stays green and a test pins the drawer-mounted-alone persist path.
**Plans**: TBD

### Phase 58: Release v1.18.0
**Goal**: Ship v1.18.0 with docs synced and the full clinical gate green.
**Depends on**: Phase 56, Phase 57 (all refactor work landed)
**Requirements**: REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. `package.json` reads `1.18.0` and the AboutSheet reflects it via the `__APP_VERSION__` build-time constant (no hardcoded version string anywhere).
  2. PROJECT.md Validated list and the REQUIREMENTS.md traceability table are updated at milestone close (all 13 v1.18 IDs flipped to ✓ / Validated).
  3. The full clinical gate is green: svelte-check 0/0, vitest fully green, `pnpm build` ✓, Playwright E2E + extended axe sweeps green in both light and dark themes.
**Plans**: TBD

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
| 54 | v1.17 | 2/2 | Complete    | 2026-05-24 |
| 55 | v1.18 | 1/1 | Complete    | 2026-05-28 |
| 56 | v1.18 | 1/1 | Complete    | 2026-05-28 |
| 57 | v1.18 | 0/? | Not started | - |
| 58 | v1.18 | 0/? | Not started | - |
