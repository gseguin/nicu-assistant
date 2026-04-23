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
- **v1.13 UAC/UVC Calculator + Favorites Nav** - Phases 40-43 (in progress, started 2026-04-23)

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

### v1.13 UAC/UVC Calculator + Favorites Nav (Phases 40-43) — IN PROGRESS

- [ ] **Phase 40: Favorites Store + Hamburger Menu** — `favoritesStore` with localStorage persistence, 4-cap enforcement, schema-safe recovery, first-run defaults `['morphine', 'formula', 'gir', 'feeds']`; hamburger button in title bar; full-screen/side-sheet menu listing every registered calculator with star toggles; keyboard nav + reduced-motion honored. Store unit tests + hamburger component tests.
- [ ] **Phase 41: Favorites-Driven Navigation** — NavShell rewritten so mobile bottom bar and desktop top nav render favorites only (in favorite order); non-favorited active routes do NOT add temporary tabs; `aria-current="page"` semantics preserved. Playwright E2E for full add/remove/persist flow + axe sweep of open hamburger.
- [ ] **Phase 42: UAC/UVC Calculator** — Wave-0 architecture (`CalculatorId` union + registry + NavShell ternary + `/uac-uvc` route); identity hue research + OKLCH token pair passing 4.5:1 on first sweep; pure calculation logic in `src/lib/uac-uvc/` matching `uac-uvc-calculator.xlsx`; weight input with textbox↔slider bidirectional sync; two visually distinct hero cards (UAC + UVC); out-of-range advisory; sessionStorage persistence; AboutSheet entry. Parity tests + component tests + Playwright E2E + axe sweeps in both themes.
- [ ] **Phase 43: Release v1.13.0** — `package.json` → 1.13.0; PROJECT.md Validated list updated; final gate sweep (svelte-check 0/0, vitest green, `pnpm build` ✓, Playwright E2E + extended axe suite green).

## Phase Details

### Phase 40: Favorites Store + Hamburger Menu
**Goal**: Clinicians can open a hamburger menu, see every calculator, and star/unstar calculators to control what appears in their nav — with the cap enforced and their choices surviving across sessions.
**Depends on**: Nothing (first phase of v1.13; builds on shipped v1.12 registry)
**Requirements**: FAV-01, FAV-02, FAV-03, FAV-04, FAV-05, FAV-06, FAV-07, NAV-HAM-01, NAV-HAM-02, NAV-HAM-03, NAV-HAM-04, NAV-HAM-05, FAV-TEST-01, FAV-TEST-02
**Success Criteria** (what must be TRUE):
  1. User can tap the hamburger button in the title bar and see every registered calculator listed with its icon and name
  2. User can tap a star on any calculator row to add/remove it from favorites, and removing a favorite updates the nav immediately
  3. When 4 calculators are already favorited, non-favorite star buttons become disabled with an accessible reason explaining the cap
  4. A clinician reloading the app (or reopening it days later) sees the same favorites they last chose, and a brand-new install opens with Morphine / Formula / GIR / Feeds favorited
  5. User can open, navigate, star, and close the hamburger entirely by keyboard, with focus returning to the hamburger button on close
**Plans**: TBD
**UI hint**: yes

### Phase 41: Favorites-Driven Navigation
**Goal**: Clinicians see only their favorited calculators in the mobile bottom bar and desktop top nav, with the hamburger remaining the way to reach anything they haven't favorited.
**Depends on**: Phase 40
**Requirements**: NAV-FAV-01, NAV-FAV-02, NAV-FAV-03, NAV-FAV-04, FAV-TEST-03, FAV-TEST-04
**Success Criteria** (what must be TRUE):
  1. User sees exactly their favorited calculators in the mobile bottom bar (in favorite order), preserving shell styling (`min-h-14`, safe-area padding, focus outlines)
  2. User sees the same favorites in the desktop top nav with each tab's identity indicator intact
  3. When user navigates to a non-favorited calculator via the hamburger, the bottom bar and top nav do NOT grow a temporary tab — the current route is indicated by the title/header instead
  4. User can complete the end-to-end flow (open hamburger → unfavorite one tab → favorite another → reload) and see favorites persisted and nav updated, with the open hamburger passing axe sweeps in both themes
**Plans**: TBD
**UI hint**: yes

### Phase 42: UAC/UVC Calculator
**Goal**: Clinicians can open the UAC/UVC calculator from the hamburger, enter a weight, and get two distinct trustworthy depth values (UAC and UVC) that match the source spreadsheet.
**Depends on**: Phase 40, Phase 41
**Requirements**: UAC-01, UAC-02, UAC-03, UAC-04, UAC-05, UAC-06, UAC-07, UAC-08, UAC-09, UAC-ARCH-01, UAC-ARCH-02, UAC-ARCH-03, UAC-ARCH-04, UAC-ARCH-05, UAC-TEST-01, UAC-TEST-02, UAC-TEST-03, UAC-TEST-04
**Success Criteria** (what must be TRUE):
  1. User can find UAC/UVC in the hamburger list (it is a registered, non-favorited calculator by default), star it, and see it join the bottom bar — exercising the Phase 40/41 end-to-end flow
  2. User can enter a weight (0.3–10 kg) via the textbox OR the slider and both stay in sync, with the value persisting across sessionStorage reloads
  3. User sees UAC depth (`weight × 3 + 9` cm) and UVC depth (`(weight × 3 + 9) / 2` cm) in two visually distinct hero cards — a clinician cannot confuse them at a glance
  4. User entering an out-of-range weight sees a blur-gated advisory (no auto-clamp), and the AboutSheet entry cites `uac-uvc-calculator.xlsx` with the imaging-confirmation caveat
  5. `/uac-uvc` passes axe sweeps in light + dark on first run (identity hue researched before PR) and all parity tests match the spreadsheet within 1% epsilon
**Plans**: TBD
**UI hint**: yes

### Phase 43: Release v1.13.0
**Goal**: v1.13 is shipped: version reflected in the AboutSheet, PROJECT.md tells the story of what landed, and the full clinical quality gate is green.
**Depends on**: Phase 40, Phase 41, Phase 42
**Requirements**: REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. User opening the About dialog sees version `1.13.0` (sourced via the existing `__APP_VERSION__` build-time constant)
  2. A reader of PROJECT.md can see every v1.13 accomplishment captured in the Validated list with the milestone tag
  3. The full quality gate is green: svelte-check 0/0, vitest fully green, `pnpm build` succeeds, Playwright E2E passes, and the axe suite (extended with UAC/UVC + hamburger variants) passes in both themes
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
| 40. Favorites Store + Hamburger | v1.13 | 0/? | Not started | — |
| 41. Favorites-Driven Nav | v1.13 | 0/? | Not started | — |
| 42. UAC/UVC Calculator | v1.13 | 0/? | Not started | — |
| 43. Release v1.13.0 | v1.13 | 0/? | Not started | — |

## Order Rationale

**Why favorites-nav first, UAC/UVC second:** Shipping UAC/UVC as the 5th bottom-bar tab would overflow the mobile bar at 375px (48px touch targets × 5 tabs + safe-area = cramped labels) and create throwaway navigation code that Phase 41 would then rip out. Shipping favorites-nav into the existing 4 calculators first (with first-run defaults `['morphine', 'formula', 'gir', 'feeds']` preserving the current v1.12 bottom bar) means existing users see zero visible change at the Phase 41 cut, and UAC/UVC then lands in Phase 42 as a non-favorited 5th calculator. This exercises the end-to-end flow naturally (star to add to bottom bar, disabled-at-cap when the user tries to favorite without removing another) rather than inventing that workflow only after shipping a bar overflow.

**Why store + hamburger before favorites-driven nav:** The store is the contract the NavShell depends on. Phase 40 delivers a visible, testable hamburger menu that writes favorites — but NavShell still renders all registered calculators unchanged (preserving current behavior). Phase 41 flips NavShell over to read from the store. This split keeps each phase independently verifiable and lets us gate the nav flip on a passing favorites store.

**Why UAC/UVC architecture + hue + logic + UI in one phase:** UAC/UVC is a small calculator (single weight input, two closed-form formulas, ~1% parity). Splitting it into ARCH / LOGIC / UI / TESTS would over-fragment (v1.12 used 3 phases for Feed Advance, which has 2 modes, 9 advisories, dual TPN lines, frequency/cadence matrices — not comparable). Instead we follow the v1.8 Wave-0 pattern within the phase: `CalculatorId` / registry / `NavShell.activeCalculatorId` / identity hue tokens land first-commit, then logic, then UI, then tests.
