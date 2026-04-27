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
- **v1.15.1 iOS Polish & Drawer Hardening** - Phases 47-51 (in progress, started 2026-04-27) — see [milestones/v1.15.1-ROADMAP.md](milestones/v1.15.1-ROADMAP.md)

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

See [milestones/ws-pert-2026-04-26/ROADMAP.md](milestones/ws-pert-2026-04-26/ROADMAP.md) for full workstream archive.

</details>

### v1.15.1 iOS Polish & Drawer Hardening (Phases 47-51) — IN PROGRESS

- [x] **Phase 47: Wave-0 — Test Scaffolding** — `window.visualViewport` polyfill in `src/test-setup.ts` (with self-test pattern mirroring lines 122–149); reusable `dispatchVisualViewportResize(height, offsetTop)` helper at `src/lib/test/visual-viewport-mock.ts`; new `webkit-iphone` Playwright project in `playwright.config.ts` (existing `chromium` project preserved). Closes blockers P-18 + P-19 before any feature code lands. (3/3 plans, completed 2026-04-27)
- [ ] **Phase 48: Wave-1 — Trivial Fixes (NOTCH + FOCUS)** — NOTCH on `NavShell.svelte`: `pt-[env(safe-area-inset-top,0px)]` + `px-[max(env(safe-area-inset-left,0px),1rem)]` (and right) on `<header>`; `bg-[var(--color-surface)]` paints into the inset; sticky-top consumers audited. FOCUS on `InputDrawer.svelte`: delete `queueMicrotask(() => firstInput?.focus())` block in full + add `autofocus` to close button; explicit no-input-focused vitest assertion + source-grep regression guard + cross-calculator Playwright spec across all six calculators.
- [ ] **Phase 49: Wave-2 — visualViewport Drawer Anchoring** — New singleton `src/lib/shared/visualViewport.svelte.ts` (~40 lines, mirrors `theme.svelte.ts`); subscribes to `vv.resize` only (NOT `vv.scroll`); rebinds on `pageshow`/`visibilitychange` for bfcache; initialized from `+layout.svelte:onMount`. `InputDrawer.svelte` `.input-drawer-sheet` exposes `--ivv-bottom` + `--ivv-max-height` CSS custom properties; `max-height: calc(var(--ivv-max-height, 80dvh))`; `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))`; transforms apply to inner sheet only (preserves `<dialog>` top-layer + SelectPicker-inside-drawer). Unit + component + Playwright `webkit-iphone` tests + 16/16 axe re-run.
- [ ] **Phase 50: Wave-3 — Real-iPhone Smoke Gate** — `.planning/v1.15.1-IPHONE-SMOKE.md` blocking checklist used as a phase gate before milestone close. Tester signs off each step on a real iPhone 14 Pro+ in standalone PWA mode: notch-safe chrome (portrait + landscape), drawer-open-no-keyboard with VoiceOver, drawer-above-keyboard ≥ 8 px, keyboard-dismiss-returns-flush (iOS 26 #800125), bfcache-restore-renders-flush, hardware-keyboard-does-not-lift, light-mode `black-translucent` legibility, all six calculators parity. Explicitly closes the v1.13 D-12 deferral.
- [ ] **Phase 51: Release v1.15.1** — `package.json` 1.15.0 → 1.15.1 (AboutSheet auto via `__APP_VERSION__`); PROJECT.md Validated list updated; REQUIREMENTS.md traceability flipped (44 IDs) with D-12 closure noted; ROADMAP.md Progress rows complete; archived to `.planning/milestones/v1.15.1-{REQUIREMENTS,ROADMAP,phases}/`; full clinical gate green (svelte-check 0/0, vitest, `pnpm build`, Playwright `chromium` + `webkit-iphone`, extended axe 16/16); SMOKE-01..10 all signed off.

## Phase Details

### Phase 47: Wave-0 — Test Scaffolding
**Goal**: Vitest can mount `InputDrawer` + visualViewport-aware components without throwing, and Playwright can run specs under WebKit + iPhone viewport. Both gates must be green BEFORE any feature code lands so the new tests in Phases 48–49 actually prove behavior instead of giving green-by-accident.
**Depends on**: Nothing (first phase of v1.15.1)
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. Running `pnpm vitest` against any test that touches `window.visualViewport` (a new visualViewport unit test for the polyfill itself, plus the existing 439+ tests for non-regression) does not throw `TypeError: Cannot read properties of undefined`; the polyfill includes a setup-time self-test mirroring the lines 122–149 `HTMLDialogElement` pattern that fails loudly if the polyfill regresses
  2. A new test that imports `dispatchVisualViewportResize(height, offsetTop)` from `src/lib/test/visual-viewport-mock.ts`, calls it, and asserts `window.visualViewport.height` and `offsetTop` updated synchronously and a `resize` event fired against `visualViewport` listeners passes deterministically (no flake, no timing dependence)
  3. Running `pnpm exec playwright test --list` shows two projects (`chromium` and `webkit-iphone`); a smoke spec under `webkit-iphone` (e.g. opening `/`) executes and `window.visualViewport` is defined inside `page.evaluate`
  4. The existing 99-passing chromium Playwright suite remains green unchanged (no spec regressions from project-level config refactor)
**Plans**: 3 plans
  - [x] 47-01-PLAN.md — TEST-01: visualViewport polyfill in src/test-setup.ts + co-located unit test
  - [x] 47-02-PLAN.md — TEST-02: visual-viewport-mock helper module + co-located unit test
  - [ ] 47-03-PLAN.md — TEST-03: webkit-iphone Playwright project + smoke spec + CI workflow update

### Phase 48: Wave-1 — Trivial Fixes (NOTCH + FOCUS)
**Goal**: On iPhone 14 Pro+ in standalone PWA mode, the title bar chrome (hamburger + wordmark + theme/info buttons) sits below the Dynamic Island / camera notch in both orientations; opening the input drawer never summons the iOS soft keyboard before a clinician chooses a field.
**Depends on**: Phase 47 (Wave-0 polyfill so the FOCUS-TEST-01..02 vitest assertions can mount `InputDrawer`)
**Requirements**: NOTCH-01, NOTCH-02, NOTCH-03, NOTCH-04, NOTCH-TEST-01, FOCUS-01, FOCUS-02, FOCUS-03, FOCUS-TEST-01, FOCUS-TEST-02, FOCUS-TEST-03
**Success Criteria** (what must be TRUE):
  1. User installs the PWA on an iPhone 14 Pro+ in portrait, opens it in standalone mode, and sees the hamburger button, "NICU Assist" wordmark, and theme/info buttons fully below the Dynamic Island — no chrome content sits under the inset, the title-bar background paints opaquely into the inset region in both light and dark themes (never transparent show-through to scrolled content)
  2. User rotates the same iPhone to landscape and the title-bar chrome respects `safe-area-inset-left` / `safe-area-inset-right` insets — wordmark and buttons clear the rounded corners and the notch on the leading edge, with at least the existing `1rem` gutter when the inset is `0` (browser-tab fallback)
  3. User opens the input drawer (manually, or for the first time on a calculator route) and the iOS soft keyboard does NOT appear; focus lands on the close button (not on any `<input>`, `<select>`, `<textarea>`, or `[role="slider"]`); VoiceOver announces "Close inputs, button" — keyboard users get a deterministic Tab origin and the clinician must tap a field to summon the OSK
  4. The same drawer-open-no-keyboard behavior holds on every one of the six existing calculators (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) — single source of truth in `InputDrawer.svelte` with no per-calculator divergence
  5. Existing 16/16 axe sweeps re-run in light + dark and remain green; no contrast regression introduced by the inset-fill behavior; component + source-grep tests guard against the deleted `queueMicrotask` block reappearing or the `pt-[env(safe-area-inset-top` Tailwind class being accidentally removed
**Plans**: TBD (run `/gsd-plan-phase 48` to break down)
**UI hint**: yes

### Phase 49: Wave-2 — visualViewport Drawer Anchoring
**Goal**: On iOS in standalone PWA mode, the input-drawer sheet anchors to the **visible** viewport (above the soft keyboard when one is present, above the bottom nav otherwise) — sized to fit the available space without being obscured by, or floating over, the iOS keyboard. On every other surface (Android Chrome, desktop Chrome/Safari/Firefox) the drawer behaves unchanged.
**Depends on**: Phase 47 (Wave-0 — singleton unit test + Playwright `webkit-iphone` spec require the polyfill + project to exist), Phase 48 (Wave-1 — Fix A removes the auto-focus confound so "drawer position when keyboard is up" is observable as a deliberate clinician tap rather than every drawer-open spuriously summoning the keyboard)
**Requirements**: DRAWER-01, DRAWER-02, DRAWER-03, DRAWER-04, DRAWER-05, DRAWER-06, DRAWER-07, DRAWER-08, DRAWER-09, DRAWER-10, DRAWER-11, DRAWER-12, DRAWER-TEST-01, DRAWER-TEST-02, DRAWER-TEST-03, DRAWER-TEST-04
**Success Criteria** (what must be TRUE):
  1. User on an iPhone in standalone PWA mode opens the drawer and taps a weight field — the soft keyboard appears AND the drawer sheet's bottom edge sits flush above the keyboard top with ≥ 8 px clearance; the eyebrow + the first input remain visible at the minimum keyboard-up height (sheet `max-height` shrinks to `min(80dvh, visualViewport.height − 16px)` when the keyboard is up)
  2. User dismisses the keyboard (Done button) and the drawer returns smoothly to its bottom-nav-top position with `env(safe-area-inset-bottom)` clearance — no flicker, no stale offset (the singleton survives the iOS 26 `visualViewport.height` post-dismiss regression by re-reading on every resize event with no caching, per Apple Developer Forums #800125)
  3. User backgrounds the app (call yourself, switch apps) and returns — the bfcache-restored session renders the drawer flush without requiring a user gesture (singleton's `pageshow` `event.persisted === true` branch + `visibilitychange` listener synchronously re-read `visualViewport` properties on resume)
  4. User on an iPhone paired with a Bluetooth hardware keyboard does NOT see the drawer lift (the `keyboardOpen` heuristic uses `window.innerHeight − vv.height > 100` to filter URL-bar collapse and admit only the OSK; hardware keyboards leave `vv.height` unchanged so no false positive)
  5. The `<dialog>` `showModal()` + Esc-to-close + focus-trap + focus-restore behaviors are preserved verbatim; the existing SelectPicker dialog inside the drawer is unaffected (transforms apply ONLY to the inner `.input-drawer-sheet`, never the outer `<dialog>`); Android Chrome, desktop Chrome/Safari/Firefox behavior is unchanged; existing 16/16 axe sweeps re-run with the visualViewport-aware layout in light + dark and remain green
**Plans**: TBD (run `/gsd-plan-phase 49` to break down)
**UI hint**: yes

### Phase 50: Wave-3 — Real-iPhone Smoke Gate
**Goal**: A clinician using NICU Assist on a real iPhone 14 Pro+ in standalone PWA mode at the bedside has every v1.15.1 fix verified end-to-end on actual hardware — closing the v1.13 D-12 deferral by elevating real-iPhone testing to **primary verification surface** (CI cannot paint the Dynamic Island, emulate the soft keyboard, or trigger bfcache).
**Depends on**: Phase 48, Phase 49 (smoke verifies what those phases shipped)
**Requirements**: SMOKE-01, SMOKE-02, SMOKE-03, SMOKE-04, SMOKE-05, SMOKE-06, SMOKE-07, SMOKE-08, SMOKE-09, SMOKE-10
**Success Criteria** (what must be TRUE — each item below is a checklist line in `.planning/v1.15.1-IPHONE-SMOKE.md` that the tester signs off on a real iPhone 14 Pro+ in standalone PWA mode, not Safari browser tab):
  1. **Notch-safe chrome (portrait):** Hamburger / wordmark / theme button visible below the Dynamic Island in portrait orientation — closes NOTCH-01
  2. **Drawer open without keyboard:** Drawer opens with no keyboard appearing, focus on close button, VoiceOver announces the drawer — closes FOCUS-01 + FOCUS-02
  3. **Drawer above keyboard:** Tapping a weight field summons the keyboard AND the drawer is anchored above the keyboard top with ≥ 8 px clearance; first input + eyebrow remain visible — closes DRAWER-06 + DRAWER-07
  4. **Keyboard dismiss returns flush:** Dismissing the keyboard (Done button) returns the drawer smoothly to bottom-nav-top with `env(safe-area-inset-bottom)` clearance; no flicker, no stale offset — closes DRAWER-02 (iOS 26 #800125 regression survival)
  5. **bfcache restore renders flush:** Calling yourself / switching apps and returning renders the drawer flush without requiring a user gesture — closes DRAWER-03
  6. **Hardware keyboard does not lift drawer:** Hardware-keyboard-paired iPhone does NOT lift the drawer — closes DRAWER-09
  7. **Landscape inset respected:** Landscape rotation respects `safe-area-inset-left/right`; portrait re-rotation preserves notch-safe top — closes NOTCH-02
  8. **Light-mode status-bar legibility:** Light mode + Dynamic Island shows status-bar text legible against `var(--color-surface)` light value (if poor, mitigation is light/dark `<meta name="theme-color">` toggled by the FOUC script) — closes the PITFALLS.md `black-translucent` legibility gap
  9. **Cross-calculator parity:** All six calculators (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) smoke-tested for drawer + notch behavior — no per-calculator divergence found, or any divergence captured as a follow-up todo
  10. **Smoke checklist artifact created:** `.planning/v1.15.1-IPHONE-SMOKE.md` checklist exists, was used as the blocking gate, and is committed alongside the milestone for clinical audit trail
**Plans**: TBD (run `/gsd-plan-phase 50` to break down)

### Phase 51: Release v1.15.1
**Goal**: v1.15.1 is shipped: the AboutSheet shows v1.15.1, PROJECT.md tells the story of the iOS polish hotfix that landed, REQUIREMENTS.md traceability is fully ✓-Validated, the v1.13 D-12 deferral is officially closed, and the full clinical quality gate is green across both Playwright projects.
**Depends on**: Phase 47, Phase 48, Phase 49, Phase 50 (release gates on smoke sign-off)
**Requirements**: REL-01, REL-02, REL-03, REL-04
**Success Criteria** (what must be TRUE):
  1. User opening the About dialog sees version `1.15.1` (sourced via the existing `__APP_VERSION__` build-time constant — zero hardcoded version strings; `package.json` is the single source of truth)
  2. A reader of PROJECT.md can see every v1.15.1 accomplishment captured in the Validated list (TEST entries per ID, NOTCH entries per ID, FOCUS entries per ID, DRAWER entries per ID or summary, SMOKE-01..10 narrative noting D-12 closure, REL entries); the Active section is cleared; the Last updated footer is bumped
  3. REQUIREMENTS.md traceability table has all 44 v1.15.1 IDs flipped to ✓ Validated; ROADMAP.md Progress rows for Phases 47–51 are marked Complete; v1.15.1 is archived to `.planning/milestones/v1.15.1-{REQUIREMENTS,ROADMAP,phases}/` per the v1.13 / v1.14 / v1.12 archive pattern
  4. The full quality gate is green: svelte-check 0/0 across all files, vitest fully green (existing 439+ baseline plus the new TEST polyfill / FOCUS / DRAWER tests), `pnpm build` succeeds, Playwright `chromium` + new `webkit-iphone` projects pass, the extended axe suite (16/16 minimum across the six calculator routes in light + dark) is green
  5. SMOKE-01..10 are all signed off in `.planning/v1.15.1-IPHONE-SMOKE.md` as the precondition for tag-and-ship; the v1.13 D-12 real-iPhone deferral is explicitly closed with a note in PROJECT.md Key Decisions or the Validated entry text
**Plans**: TBD (run `/gsd-plan-phase 51` to break down)

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
| 47. Wave-0 — Test Scaffolding | v1.15.1 | 2/3 | In Progress|  |
| 48. Wave-1 — Trivial Fixes (NOTCH + FOCUS) | v1.15.1 | 0/TBD | Not started | — |
| 49. Wave-2 — visualViewport Drawer Anchoring | v1.15.1 | 0/TBD | Not started | — |
| 50. Wave-3 — Real-iPhone Smoke Gate | v1.15.1 | 0/TBD | Not started | — |
| 51. Release v1.15.1 | v1.15.1 | 0/TBD | Not started | — |

## Order Rationale

**Why Wave-0 (Phase 47) must land first:** Both blockers P-18 (jsdom does not implement `window.visualViewport`) and P-19 (Playwright is chromium-only) prevent any visualViewport-aware test from running. Without the polyfill, Phase 49's vitest unit + component tests for the singleton would throw `TypeError: Cannot read properties of undefined` at import time — and worse, if only the new util throws, the existing 439+ vitest gate stays green by accident and the new feature is untested. Without the `webkit-iphone` Playwright project, DRAWER-TEST-03 cannot exercise visualViewport at all (chromium does not emulate the iOS keyboard or Dynamic Island). Phase 47 unlocks Phases 48 + 49 — non-negotiable per PITFALLS.md and STACK.md §4.

**Why combine NOTCH + FOCUS into a single Wave-1 phase (Phase 48):** Per SUMMARY.md "Implications for Roadmap" §Phase 2 and the §Phase Ordering Rationale closing notes, NOTCH (Fix C) and FOCUS (Fix A) are independent — different files (`NavShell.svelte` vs `InputDrawer.svelte`), no shared state, parallel-safe in either order. At granularity `coarse` (3-5 phase target) and given each fix is small (NOTCH = one Tailwind utility on `<header>`; FOCUS = a deletion + one `autofocus` attribute), splitting them into Phases 48a/48b would force two phase-transition checkpoints for ~10 lines of net diff each. Combining them is consistent with the project's "atomic, verifiable phase" pattern (cf. v1.13 Phase 42 which combined arch + identity + UI + tests for UAC/UVC). The two waves can still be authored in either order or in parallel branches inside the phase — the plans (`/gsd-plan-phase 48`) will reflect that as two separate plan files.

**Why Wave-2 (Phase 49) is its own phase:** DRAWER is the largest surface in the milestone — new singleton, six call-site CSS-variable wirings, four blocker-grade pitfalls (P-03 100dvh-vs-keyboard, P-04 bfcache rebind, P-08 don't-listen-to-vv.scroll, P-15 transform-inner-not-outer-dialog). It needs the most testing time and benefits from Phase 48's auto-focus removal already being in place (clinician's deliberate tap-to-focus is now distinguishable from the previous spurious auto-focus, making manual verification of "drawer position when keyboard is up" tractable). Slip-friendly: if v1.15.1 ships before Phase 49 is verified, Phases 47 + 48 still close two of the three bedside complaints and Phase 49 becomes v1.15.2.

**Why Wave-3 (Phase 50) is a phase gate, not optional:** CI cannot prove the visualViewport drawer fix works — Playwright WebKit emulates viewport size and user agent but does NOT emulate the iOS soft keyboard (no `visualViewport.resize` on focus), does NOT paint Dynamic Island safe-area insets, and does NOT trigger bfcache. Without a real-iPhone smoke gate the milestone goal is *technically* met (code shipped, axe green, vitest green) but the bedside experience is unverified. v1.13's D-12 explicitly deferred this gate; v1.15.1 is the milestone where that deferral is closed.

**Why Phase 51 (release) gates on Phases 48 + 49 + 50:** REL-01 bumps `package.json` 1.15.0 → 1.15.1 — that bump should only land once both feature phases AND the smoke gate are green so the AboutSheet version reflects a verified shipped surface. REL-04's clinical gate (svelte-check, vitest with both projects, build, Playwright + axe across both projects) by definition requires Phases 47–49 in place; REL-03's traceability flip + archive requires SMOKE-01..10 sign-off from Phase 50. Standard release-phase pattern from v1.8 / v1.10 / v1.11 / v1.12 / v1.13 / v1.14.

**Why no decimal-phase risk anticipated:** The scope is tightly bounded — no new clinical features, no new identity hues, no new design tokens, no DESIGN.md / DESIGN.json changes, no per-calculator behavioral changes (all explicitly Out of Scope). The research is HIGH confidence with three independent researcher outputs converging on the same wave structure. Decimal-phase insertions remain available if real-iPhone smoke surfaces an unexpected gap (e.g. iOS 26 regression or a new Dynamic Island variant) but the most likely path is a clean 47 → 48 → 49 → 50 → 51 sequence.
