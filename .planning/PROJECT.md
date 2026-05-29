# NICU Assistant

## What This Is

A PWA that unifies clinical calculators into a single tool for NICU staff. Includes four calculators: infant formula recipe, morphine weaning schedule, glucose infusion rate (GIR) with titration grid, and feed advance (bedside advancement + full nutrition modes). Built with a shared component library, responsive navigation, and a plugin-like architecture that makes adding new calculators straightforward.

## Current State

**Shipped:** v1.18 Persistence Seam — Phases 55–58 complete (2026-05-28..2026-05-29). Storage failure is now handled once: a single `PersistentValue<T>` seam owns guarded read/write/remove with JSON-or-raw codec and a recover/migrate hook. The four shared global singletons (theme, disclaimer, favorites, lastEdited) are now thin adapters over the seam — byte-identical storage keys and persisted JSON shapes throughout (behavior-preserving). Nine hand-rolled duplicate `$effect` persist blocks and four hand-rolled localStorage adapters collapsed to one seam + one in-class `$effect.root()` in CalculatorStore. Gates: svelte-check 0/0 (4592 files), vitest 451/451, pnpm build OK. Playwright + extended axe sweeps deferred to CI.

**Shipped:** v1.15.1 iOS Polish & Drawer Hardening (2026-04-30, package shipped under v1.16.0/1.16.1) — Three iOS bedside regressions fixed across two waves: (1) NavShell title bar respects `env(safe-area-inset-top/left/right)` so hamburger + wordmark + theme/info buttons clear the Dynamic Island / camera notch in portrait + landscape on iPhone 14 Pro+ in standalone PWA mode; (2) InputDrawer open never programmatically focuses an input/select/slider — `queueMicrotask` block removed, native `<dialog>` autofocus lands on the close button so iOS soft keyboard waits for an explicit clinician tap; (3) New `visualViewport.svelte.ts` `$state` singleton (subscribes to `resize` + `pageshow.persisted` + `visibilitychange.visible`, NOT `scroll`) exposes `--ivv-bottom` + `--ivv-max-height` CSS custom properties via `$derived ivvStyle` on `.input-drawer-sheet` — drawer anchors above iOS soft keyboard with ≥ 8 px clearance and shrinks to fit `visualViewport.height − 16px` when keyboard is up. Test scaffolding (Wave-0): jsdom `window.visualViewport` polyfill in `src/test-setup.ts` with throw-on-regression self-test; reusable `simulateKeyboardOpen/Down/_reset` helpers in `src/lib/test/visual-viewport-mock.ts`; new `webkit-iphone` Playwright project using `devices['iPhone 14 Pro']` runs alongside `chromium`. Zero per-calculator divergence — single source of truth across all six calculators. Gates: svelte-check 0/0 across 4571+ files, vitest 454/454, Playwright chromium + webkit-iphone green, extended axe 16/16 in both themes. **Real-iPhone smoke gate (SMOKE-01..10) deferred** — closes the v1.13 D-12 deferral when run; carries forward into v1.16+ as deferred item.

## Core Value

Clinicians can switch between NICU calculation tools instantly from a single app without losing context, using the same trusted interfaces they already know.

## Requirements

### Validated

- ✓ Responsive navigation: bottom tab bar on mobile, top nav bar on desktop — v1.0
- ✓ Formula recipe calculator (modified + BMF modes) — v1.0
- ✓ Shared component library: SelectPicker, NumericInput, DisclaimerModal, AboutSheet, ResultsDisplay — v1.0
- ✓ Single shared medical disclaimer shown on first load — v1.0
- ✓ Dark/light theme toggle — v1.0
- ✓ PWA: offline-capable with service worker, installable, standalone display — v1.0
- ✓ Plugin-like calculator registration — v1.0
- ✓ Design system unification: shared color tokens, typography, spacing — v1.0
- ✓ Accessible: WCAG 2.1 AA, keyboard nav, screen reader support, 48px touch targets — v1.0
- ✓ Morphine wean calculator with linear and compounding modes — v1.1
- ✓ PERT calculator replaced by morphine wean calculator — v1.1
- ✓ Clinical data stored in JSON config for maintainability — v1.1
- ✓ Unit tests with spreadsheet parity validation — v1.1
- ✓ Automated a11y auditing via axe-core — v1.1
- ✓ Nav restructure: title bar with info/theme, full-width calculator tabs — v1.2
- ✓ Impeccable critique: all P1/P2/P3 findings fixed — v1.2
- ✓ Dock-style scroll magnification on step cards — v1.2
- ✓ Comprehensive E2E tests (Playwright) — v1.2
- ✓ App version from package.json in about dialog — v1.2
- ✓ Disclaimer flash fix for returning users — v1.2
- ✓ Unified fortification calculator matching the recipe-calculator.xlsx Calculator tab — v1.3
- ✓ 30 infant formulas embedded as clinician-editable JSON config (Abbott, Mead Johnson, Nestlé, Nutricia) — v1.3
- ✓ Spreadsheet-parity tests for fortification (documented Neocate case + per-unit + per-special-case coverage) — v1.3
- ✓ Packets unit hidden from picker for non-HMF formulas (auto-reset on formula switch) — v1.3
- ✓ WCAG 2.1 AA axe-core a11y audit for fortification (light + dark) — v1.3
- ✓ Legacy Modified Formula + BMF code removed — v1.3
- ✓ SelectPicker label association via aria-labelledby (improves a11y across all calculators) — v1.3
- ✓ Shared SelectPicker rewritten as native `<dialog>`-based modal picker (drop-in, no consumer edits) — v1.4
- ✓ Fortification mobile layout — Target Calorie + Unit on same row — v1.4
- ✓ Fortification "Amount to Add" hero restyled to match morphine wean result theming — v1.4
- ✓ Visual refinement sweep across both calculators (spacing, typography, eyebrow parity) — v1.4
- ✓ Shell polish — min-h-14 title bar, tracking-tight app name, visible focus outlines on desktop + mobile nav — v1.4
- ✓ `prefers-reduced-motion: reduce` honored across every motion surface — v1.4
- ✓ WCAG 2.1 AA dark-mode contrast fix — `--color-text-secondary` and `--color-accent` bumped; axe-core color-contrast rule now enabled in both themes — v1.4
- ✓ New `--color-scrim` OKLCH token + jsdom HTMLDialogElement polyfill with setup-time self-test — v1.4
- ✓ Searchable Formula picker — opt-in `searchable` prop on shared SelectPicker, ArrowDown/ArrowUp traversal, Enter-to-select-single-match, "No matches" state — v1.5
- ✓ Per-tab visual identity via new `--color-identity` token (Clinical Blue 220 / new Teal ~195) wired to exactly 4 surfaces: result hero, focus rings, eyebrows, active nav indicator — v1.5
- ✓ NavShell per-tab identity via `identityClass` field on registry — v1.5
- ✓ Morphine identity hero tuned to literal `oklch(95% 0.04 220)` to clear 4.5:1 (caught by Phase 20 axe sweep) — v1.5
- ✓ Playwright a11y suite extended with focus-ring + dark-visible variants; 8/8 axe sweeps green — v1.5
- ✓ `package.json` version bumped to 1.5.0 (about dialog reflects shipped state) — v1.5
- ✓ Shared `SegmentedToggle` component extracted from Morphine's tablist — identity-aware, keyboard nav (←/→/Home/End), `role="tablist"` ARIA — v1.6
- ✓ Morphine refactored + Formula `Base` SelectPicker replaced with the shared toggle — v1.6
- ✓ `NumericInput` hardened: visible range hint, blur-gated "Outside expected range — verify" advisory (no auto-clamp), `showRangeHint` opt-out prop — v1.6
- ✓ Clinical input ranges moved from magic numbers to `inputs` block in `morphine-config.json` / `fortification-config.json` with typed TS wrappers — v1.6
- ✓ Shared `.animate-result-pulse` class in `src/app.css` (200ms scale-from-95%, reduced-motion gated) applied to both calculator heroes — v1.6
- ✓ `aria-live="polite"` + `aria-atomic="true"` on both result heroes (Morphine summary + Formula "Amount to Add") — v1.6
- ✓ Playwright a11y suite extended with 4 advisory-message variants; 12/12 axe sweeps green with zero OKLCH tuning — v1.6
- ✓ `package.json` version bumped to 1.6.0 — v1.6
- ✓ Formula field labels cleaned — `"Starting Volume"` / `"Target Calorie"` drop unit parentheticals — v1.7
- ✓ Formula picker + Starting Volume share a single row at all breakpoints; Target Calorie + Unit get their own `grid-cols-2` row — v1.7
- ✓ Auto-select packets when picking a packets-capable formula; data-driven via new `packetsSupported?: boolean` field + `formulaSupportsPackets(id)` helper — v1.7
- ✓ `showRangeError` opt-out prop on NumericInput (complement to v1.6 `showRangeHint`); Formula Starting Volume opts out of both — v1.7
- ✓ `package.json` version bumped to 1.7.0 — v1.7
- ✓ Third clinical calculator: Glucose Infusion Rate (GIR) with Weight/Dextrose%/Fluid-order inputs, Current GIR + Initial rate hero outputs (CORE-01..05) — v1.8
- ✓ Interactive 6-bucket glucose-driven titration grid with keyboard nav, roving tabindex, radiogroup semantics, identity highlighting, ▲/▼ Δ-rate glyphs, institutional-protocol disclaimer (TITR-01..08) — v1.8
- ✓ GIR safety advisories: Dex>12.5% central-access, GIR>12 hyperinsulinism, GIR<4 below-basal, config-driven NumericInput ranges, EPIC paste normalization (SAFE-01..05) — v1.8
- ~~✓ GIR population reference card: IDM/LGA, IUGR, Preterm/NPO starting ranges (REF-01) — v1.8~~ — retired in v1.10 (population reference card removed; Phase 32 GIR-SIMP-03)
- ✓ GIR architecture: registry entry, `.identity-gir` OKLCH tokens, `src/lib/gir/` module, `/gir` route, zero shared-component modifications (ARCH-01..06) — v1.8
- ✓ Spreadsheet-parity unit tests for GIR (all 6 buckets × all formula columns) and config shape tests (TEST-01, TEST-03) — v1.8
- ✓ Component tests for GirCalculator + GlucoseTitrationGrid: empty-state, valid-flow, bucket selection, full keyboard matrix, advisory rendering (TEST-02) — v1.8
- ✓ Playwright E2E happy-path at mobile 375 + desktop 1280, with `inputmode="decimal"` regression (TEST-04, TEST-06) — v1.8
- ✓ Playwright a11y suite extended with 6 GIR axe sweeps (light/dark/focus/advisory/selected-bucket); 16/16 axe sweeps green (morphine 6 + fortification 4 + gir 6) with zero OKLCH tuning (TEST-05) — v1.8
- ✓ AboutSheet updated with GIR entry citing `GIR-Wean-Calculator.xlsx` + MDCalc/Hawkes *J Perinatol* 2020 (PMC7286731), institutional-protocol disclaimer (DOC-01) — v1.8
- ✓ `package.json` version bumped to 1.8.0 (DOC-02) — v1.8
- ✓ PROJECT.md Validated list updated with v1.8 entries at milestone completion (DOC-03) — v1.8
- ✓ GIR titration hero swap: Δ rate (ml/hr ▲/▼ with increase/decrease label) is the bedside hero on every bucket card; GIR mg/kg/min demoted to the secondary row; neutral STOP-card treatment for the Δ=0 "current state" bucket (GIR-SWAP-01..03) — v1.9 — ~~Target GIR summary hero card portion~~ retired in v1.10 (summary hero card removed; grid-level Δ rate hero retained — Phase 32 GIR-SIMP-01)
- ✓ v1.8 GIR a11y guarantees preserved through the swap: radiogroup semantics, roving tabindex, aria-live, prefers-reduced-motion, focus rings; component + E2E + 16/16 axe sweeps updated for the new layout and remain green (GIR-SWAP-04..07) — v1.9
- ✓ Impeccable critique pass across Morphine, Formula, and GIR in both themes at mobile 375 + desktop 1280 with all P1 and addressable P2/P3 findings fixed; dark identity-hero retuned to `oklch(22% 0.045 145)` to preserve 4.5:1 against new tertiary ml/hr text; SegmentedToggle inactive text lifted to primary token; bucket labels normalized to en-dash typography (POLISH-01..04) — v1.9
- ✓ Dependency sweep within current majors — Svelte 5.55.2, SvelteKit 2.57.0, Vite 8.0.8, Vitest 4.1.4, Playwright 1.59.1, @lucide/svelte 1.8.0, bits-ui 2.17.3 — full test suite re-verified after each group (DEBT-01) — v1.9
- ✓ Dead code removal: `ResultsDisplay.svelte` + `$lib/shared` barrel deleted (zero src/ importers confirmed) (DEBT-02) — v1.9
- ✓ svelte-check cleaned to 0 errors / 0 warnings across 4493 files; ESLint explicitly dropped in favor of svelte-check + Prettier (DEBT-03) — v1.9
- ✓ Prior-milestone deferred cleanups closed: Phase 29 deferred items (6) + 8 pre-existing e2e assertion drifts from v1.5–v1.8 (DEBT-04) — v1.9
- ✓ `package.json` version bumped to 1.9.0; AboutSheet reflects v1.9.0 via the `__APP_VERSION__` build-time constant sourced from `package.json` (REL-01, REL-02) — v1.9
- ✓ PROJECT.md Validated list updated with v1.9 entries at milestone completion (REL-03) — v1.9
- ✓ GIR Simplification: Target GIR summary hero card removed; per-card Fluids|Rate|GIR secondary row removed; "Starting GIR by population" reference card removed; `aria-live` selection announcements dropped (redundant with visible Δ rate); click/tap visual treatment + radiogroup a11y preserved (GIR-SIMP-01..05, 07; GIR-SIMP-06 dropped mid-flight — severe-neuro card unchanged) — v1.10
- ✓ GIR Dock Magnification: morphine-wean-style scroll-driven dock magnification ported to `GlucoseTitrationGrid.svelte` (MAX_SCALE 1.06, radius 2.5, rAF-throttled); mobile-only (`innerWidth < 768`) + `prefers-reduced-motion` guards; `MutationObserver` re-run on row changes; 16/16 axe sweeps remain green (GIR-DOCK-01..04) — v1.10
- ✓ Tech debt majors closed: `@types/node` 22 → 25, `typescript` 5 → 6 — full gate green (svelte-check 0/0, vitest 203/203, `pnpm build` ✓, Playwright 48 passed / 3 skipped + 16/16 axe green) (DEBT-MAJ-01, DEBT-MAJ-02) — v1.10
- ✓ `package.json` version bumped to 1.10.0; AboutSheet reflects v1.10.0 via the `__APP_VERSION__` build-time constant sourced from `package.json`; PROJECT.md Validated list updated with v1.10 entries and retired entries struck through (REL-01, REL-02, REL-03) — v1.10
- ✓ Morphine Wean linear/compounding mode toggle removed; `morphine-wean-calculator.xlsx` Sheet1 is the single source of truth; `calculateCompoundingSchedule` function, `WeanMode` type, `modes` config block, and SegmentedToggle usage in `MorphineWeanCalculator.svelte` all deleted; `activeMode` dropped from `MorphineStateData` (stale sessionStorage keys silently ignored); spreadsheet-parity tests locked row-by-row against Sheet1 for weight 3.1, maxDose 0.04, decreasePct 0.10 (10 steps × 3 fields); Sheet2 compounding parity block removed (MORPH-01..07) — v1.11
- ✓ AboutSheet Morphine copy rewritten to describe a single fixed-reduction formula and cite `morphine-wean-calculator.xlsx` Sheet1 (MORPH-08) — v1.11
- ✓ `package.json` version bumped to 1.11.0; AboutSheet reflects v1.11.0 via the `__APP_VERSION__` build-time constant; PROJECT.md Validated list updated with v1.11 entries (MORPH-09) — v1.11
- ✓ Feed Advance Calculator: `CalculatorId` union extended with `'feeds'`, registry entry with `identityClass: 'identity-feeds'` and Baby icon, NavShell ternary extended for `/feeds`, AboutSheet `feeds` entry citing `nutrition-calculator.xlsx` Sheet1 + Sheet2, new `src/lib/feeds/` module, `/feeds` route, zero new dependencies (ARCH-01..07) — v1.12
- ✓ Feed Advance Calculator identity hue: `.identity-feeds` OKLCH token pair (hue ~30 terracotta), hand-computed for 4.5:1 contrast on all 4 identity surfaces in both themes, pre-PR axe-core sweep passed (HUE-01..03) — v1.12
- ✓ Feed Advance calculations: bedside advancement (Sheet2 parity within ~1% epsilon, weight 1.94 fixture) and full nutrition (Sheet1 parity within ~1% epsilon, weight 1.74 fixture); named constants (3.4 kcal/g dextrose, 2 kcal/ml lipid, 30 ml/oz); `feeds-config.json` with typed wrapper; parameter-matrix tests covering every frequency x cadence combination (CORE-09, FREQ-04, FULL-04..07, SAFE-06, TEST-01..04) — v1.12
- ✓ Feed Advance Calculator UI: `FeedAdvanceCalculator.svelte` with SegmentedToggle (Bedside Advancement / Full Nutrition modes), shared weight input, bedside mode with three per-feed outputs (trophic/advance/goal) + IV backfill, full nutrition mode with dual TPN dextrose lines + total kcal/kg/d hero, 9 advisory banners, sessionStorage persistence; trophic frequency (q2h/q3h/q4h/q6h) and advance cadence dropdowns; component tests + Playwright E2E + axe-core sweeps (CORE-01..08, FREQ-01..03/05, IV-01..03, FULL-01..03, SAFE-01..05, TEST-05..07) — v1.12
- ✓ `package.json` version bumped to 1.12.0; AboutSheet reflects v1.12.0 via the `__APP_VERSION__` build-time constant; PROJECT.md Validated list updated with v1.12 entries; app favicon generated at all standard sizes (REL-01..04) — v1.12
- ✓ Favorites store + hamburger menu: reactive `$state` singleton at `src/lib/shared/favorites.svelte.ts` with localStorage persistence (key `nicu:favorites`, schema `{v:1, ids: CalculatorId[]}`), 4-cap enforcement, schema-safe 6-step recovery (D-08), first-run defaults `['morphine-wean', 'formula', 'gir', 'feeds']`, registry-order stable sort; native `<dialog>`-based HamburgerMenu component listing every registered calculator with sibling link+star rows, focus restore on close, `prefers-reduced-motion` honored, `--color-scrim` backdrop; hamburger button in NavShell title bar (leftmost, 48×48, aria-haspopup=dialog); 19 + 14 = 33 co-located vitest cases (FAV-01..07, NAV-HAM-01..05, FAV-TEST-01, FAV-TEST-02) — v1.13 (Phase 40)
- ✓ Favorites-driven navigation: NavShell mobile bottom bar and desktop top nav rewritten to iterate `visibleCalculators` ($derived from `favorites.current` mapped through registry) preserving `min-h-14`, safe-area padding, focus outlines, identity color indicators (`identityClass`, border-b-2 on desktop active tab); non-favorited active routes do NOT add temporary tabs (`aria-current="page"` semantics preserved on hamburger drawer About row instead); favorites store seeded at module scope (D-07) so SSR and pre-init hydration render with default 4 favorites; T-20 regression guard for module-scope seed; Playwright E2E (`e2e/favorites-nav.spec.ts` — 4 tests × 2 viewports) covering open hamburger → unfavorite → favorite → reload → persist; Playwright axe (`e2e/favorites-nav-a11y.spec.ts` — light + dark on open hamburger) (NAV-FAV-01..04, FAV-TEST-03, FAV-TEST-04) — v1.13 (Phase 41)
- ✓ UAC/UVC Calculator architecture + identity hue: `CalculatorId` union extended with `'uac-uvc'`, registry entry with `.identity-uac` OKLCH token pair (hue researched pre-PR per v1.8 decision, 4.5:1 contrast on all identity surfaces in both themes on first axe sweep), `src/lib/uac-uvc/` module (types, config, state, calculations, parity fixtures + tests), `/uac-uvc` route shell, NavShell `activeCalculatorId` ternary extended, AboutSheet `uac-uvc` entry citing `uac-uvc-calculator.xlsx` and noting the rule-of-thumb formula must be confirmed by imaging per institutional protocol (UAC-ARCH-01..05, UAC-09) — v1.13 (Phase 42)
- ✓ UAC/UVC Calculator UI + calculations: `UacUvcCalculator.svelte` with weight input (textbox + slider, bidirectional sync, range 0.3–10 kg, `inputmode="decimal"`); two visually distinct hero result cards — UAC depth (`weight × 3 + 9` cm, parity with `uac-uvc-calculator.xlsx` cell B3) and UVC depth (`(weight × 3 + 9) / 2` cm, parity with cell B7) — using D-05 three-cue distinction (color accent + icon + layout) so a clinician cannot confuse UAC for UVC at a glance; tabular numerals + large bold values + `aria-live="polite"` + reduced-motion-gated pulse; blur-gated "Outside expected range — verify" advisory (no auto-clamp, consistent with v1.6 NumericInput); sessionStorage persistence; spreadsheet-parity tests within 1% epsilon for weights 0.3, 1.0, 2.5, 5.0, 10.0 kg; component test covering empty / valid / sync / out-of-range; Playwright E2E at mobile 375 + desktop 1280 with `inputmode="decimal"` regression guard, favorites round-trip, cap-full, reload, slider drag; Playwright axe sweeps in light + dark (UAC-01..09, UAC-TEST-01..04) — v1.13 (Phase 42)
- ✓ Phase 42.1 Design Polish + Redesign Sweep: closed the /impeccable critique residual after Phase 42 — DESIGN.md / DESIGN.json design contract landed (Identity-Inside Rule, Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong, Five-Roles-Only, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, Flat-Card-Default); shared `<HeroResult>` component owning above-the-fold viewport on mount across all 5 calculators; inputs collapsed to sticky drawer above bottom nav; mobile bottom nav clears content at 375 + 414 viewports with single-line tab labels and backdrop-blur; identity hue restricted to inside-the-route surfaces only (chrome carries Clinical Blue or neutral); disclaimer rewritten as dismissable banner (no first-paint-blocking modal, full text re-readable from AboutSheet, existing acknowledgments auto-migrate); morphine schedule shows 3-decimal mg precision; dock-style scroll magnification removed; CSS transitions scoped to specific selectors; root `/` ships static-HTML meta refresh redirect; D-05 third cue restored on UAC/UVC (directional arrows); 42-UI-SPEC.md amended retrospectively for post-em-dash-purge eyebrow + bits-ui Slider substitution (6 plans, closed at commit 1826069) — v1.13 (Phase 42.1)
- ✓ Phase 42.1 follow-up + 42.2 critique sweep: post-critique polish wave — em-dash purge, Amber rescope (`b548ce4`), HeroResult display-numeral rule, RangedNumericInput unification (`0558253`), drawer + nav clearance polish, mobile-nav icon centering, PWA meta refresh; 42.2 impeccable critique sweep across 6 tasks — harden / clarify / distill / shape / layout / polish (29 → 35/40, commit `1ce4493`); STOP-red clinical-safety carve-out as the single authorized exception to the Red-as-Error rule on severe-neuro GIR (commit `8fde90e`); InputsRecap desktop-hide refinement (redundant with sticky sidebar, commit `390aba6`) — v1.13 (Phase 42.1 follow-up + 42.2 critique sweep)
- ✓ `package.json` version bumped to 1.13.0; AboutSheet reflects v1.13.0 via the `__APP_VERSION__` build-time constant; PROJECT.md Validated list updated with v1.13 entries (per-ID for Phases 40/41/42, narrative for 42.1 + follow-up); REQUIREMENTS.md traceability table all 41 v1.13 IDs flipped to ✓ Validated; ROADMAP.md Phase 43 Progress row marked Complete; orphan planning artifacts (`.planning/HANDOFF.json`, Phase 42.1 `.continue-here.md`) deleted; 40-VERIFICATION.md and 41-VERIFICATION.md triaged with per-item D-07 / D-08 status; two pre-existing Playwright failures fixed pre-bump (uac-uvc mobile beforeEach hook, morphine-wean light-mode advisory axe) per D-15 (no known-issue deferrals); full clinical gate green — svelte-check 0/0 across 4571+ files, vitest 340/340, `pnpm build` ✓, Playwright E2E (99 passed / 3 skipped) + extended axe suite (33/33) green in both themes (REL-01..03) — v1.13 (Phase 43)
- ✓ Kendamil formulas (organic infant + Kendamil Organic 1st Infant + Toddler 1) added to formula registry with parity tests against `recipe-calculator.xlsx`; manufacturer-grouped picker updated with Kendamil section — v1.14 (Phases 44)
- ✓ Desktop full-nav top toolbar renders every registered calculator (replaces favorites-driven 4-tab limit on `md:` breakpoints only — mobile bottom bar unchanged); identityClass-aware active indicator preserved — v1.14 (Phase 45)
- ✓ Release v1.14.0; AboutSheet + version constant updated; clinical gate green (svelte-check 0/0, vitest fully green, Playwright + axe green) — v1.14 (Phase 46)
- ✓ Wave-0 Test Scaffolding: `window.visualViewport` polyfill added to `src/test-setup.ts` mirroring `ResizeObserver`/`matchMedia`/`HTMLDialogElement` polyfills with throw-on-regression self-test (TEST-01); reusable `simulateKeyboardOpen` / `simulateKeyboardDown` / `_resetVisualViewportMock` helpers in `src/lib/test/visual-viewport-mock.ts` (TEST-02); new `webkit-iphone` Playwright project added to `playwright.config.ts` using `devices['iPhone 14 Pro']` (393×660 viewport + WebKit engine), preserves existing `chromium` project unchanged, CI installs WebKit binary (TEST-03) — v1.15.1 (Phase 47)
- ✓ Wave-1 NOTCH (Notch-Safe Title Bar): `NavShell.svelte` `<header>` consumes `pt-[env(safe-area-inset-top,0px)]` so hamburger / wordmark / theme + info buttons clear the Dynamic Island in portrait on iPhone 14 Pro+ in standalone PWA mode (NOTCH-01); landscape inset via `px-[max(env(safe-area-inset-left,0px),1rem)]` + right counterpart so chrome content does not sit under rounded corners (NOTCH-02); `bg-[var(--color-surface)]` paints into the safe-area-inset region (no transparent show-through, both themes) (NOTCH-03); existing sticky-top consumers audited (NOTCH-04); T-13 source-grep regression sentinel (NOTCH-TEST-01) — v1.15.1 (Phase 48 Plan 48-02)
- ✓ Wave-1 FOCUS (Auto-Focus Suppression): `InputDrawer.svelte` lines 51–57 `queueMicrotask(() => firstInput?.focus())` block deleted in full — no boolean opt-out, no narrowed selector (FOCUS-01); close button gains `autofocus` attribute via hybrid declarative + imperative workaround for Svelte 5's `autofocus` directive (which does NOT set the HTML content attribute that `<dialog>.showModal()` autofocus resolution reads) so iOS soft keyboard never appears on drawer open and VoiceOver still announces the drawer (FOCUS-02); drawer-open behavior consistent across all six existing calculators via single source of truth in `InputDrawer.svelte` (FOCUS-03); T-07 + T-08 + cross-calculator Playwright spec assert `document.activeElement` is not an input/select/slider after `showModal()` (FOCUS-TEST-01..03) — v1.15.1 (Phase 48 Plan 48-01)
- ✓ Wave-2 visualViewport Drawer Anchoring: new module-scope singleton `src/lib/shared/visualViewport.svelte.ts` exposes `$state` runes for `{ offsetTop, height, keyboardOpen }`, subscribes to `visualViewport.resize` only (NOT `scroll` — Phase 42.1 D-16 explicitly removed scroll-driven transforms), re-reads `vv.width/height/offsetTop` on every event to survive iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125), `pageshow.persisted === true` + `visibilitychange` bindings for bfcache resume (DRAWER-01..04, DRAWER-09); singleton initialized from `src/routes/+layout.svelte:onMount` alongside `theme` / `disclaimer` / `favorites` / `pwa`; `InputDrawer.svelte` `.input-drawer-sheet` consumes `--ivv-bottom` + `--ivv-max-height` CSS custom properties via `$derived ivvStyle` inline binding on the inner sheet `<div>` (NEVER outer `<dialog>` — preserves SelectPicker dialog-inside-drawer pattern); `max-height: calc(var(--ivv-max-height, 80dvh))` shrinks sheet to `visualViewport.height − 16px` when keyboard up; `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))` lifts sheet flush above iOS keyboard with ≥ 8 px clearance; `prefers-reduced-motion: reduce` honored, `md:hidden` rule preserved, `<dialog>` `showModal()` + Esc-to-close + focus-trap + focus-restore preserved verbatim (DRAWER-05..08, DRAWER-10..12); T-09 (component keyboard-up) + T-10 (component keyboard-down) + T-11 (source-grep: no `style=` on `<dialog>`) + T-12 (source-grep: no `transition:` in always-on sheet rule) (DRAWER-TEST-01..02); Playwright `e2e/drawer-visual-viewport.spec.ts` synthesizes `visualViewport.resize` via `page.evaluate(...)` under both `chromium` + `webkit-iphone` projects (DRAWER-TEST-03..04) — v1.15.1 (Phase 49)
- ✓ Release v1.15.1 (shipped under v1.16.x — `package.json` was bumped 1.15.0 → 1.15.1 → 1.16.0 → 1.16.1 via quick tasks before milestone close; AboutSheet reflects shipped version via `__APP_VERSION__` build-time constant); PROJECT.md Validated list updated with v1.15.1 entries; REQUIREMENTS.md traceability table all 44 v1.15.1 IDs resolved (Phases 47–49 + REL Complete, SMOKE-01..10 deferred as Pending — see STATE.md Deferred Items); ROADMAP.md Progress rows for Phases 47–49 marked Complete; v1.15.1 archived to `.planning/milestones/v1.15.1-{REQUIREMENTS,ROADMAP,phases}/`; automated clinical gate green — svelte-check 0/0, vitest 454/454, Playwright `chromium` + `webkit-iphone` projects green, extended axe 16/16 in both themes; **SMOKE-01..10 carry forward as deferred items** — real-iPhone smoke gate (closes v1.13 D-12 deferral) not yet executed (REL-01..03 + REL-04 partial) — v1.15.1 (Phase 51)

### Invalidated / Removed

- ✗ Pediatric EPI PERT Calculator (sixth clinical calculator) shipped as self-contained workstream (`milestones/ws-pert-2026-04-26/`, internal phase numbering 01-05, did NOT consume main-roadmap phase numbers): `CalculatorId` extended with `'pert'`, `.identity-pert` OKLCH hue, `src/lib/pert/` module with config + state + parity fixtures + tests, `/pert` route, AboutSheet entry, registry entry — v1.15 — v1.17: out of clinical scope (pediatric, not neonatal)

- ✓ v1.17 Remove PERT Calculator — Phases 52–54: full purge of `src/lib/pert/` + `/pert` route + e2e specs, `pertModule` dropped from registry (5 calculators remain), `CalculatorId` narrowed to 5 members, `.identity-pert` + `pert` about-content removed, favorites upgrade-safety regression locked (`recover()` silently drops stored `'pert'`); released v1.17.0 — v1.17
- ✓ PersistentValue<T> persistence seam: guarded read/write/remove + JSON-or-raw codec + recover hook (single test surface SEAM-01..04) — v1.18 (Phase 55)
- ✓ Theme / disclaimer / favorites / lastEdited adapters migrated onto the seam as thin wrappers — byte-identical keys + shapes (MIG-01..04); 3 regression suites green with zero edits — v1.18 (Phase 56)
- ✓ Auto-persist consolidated behind CalculatorStore via single $effect.root() in constructor; 9 duplicate per-fragment effects deleted (5 *Inputs.svelte + 4 *Calculator.svelte parents); 60s lastEdited debounce + no Svelte-5 effect re-entry (AUTO-01..02) — v1.18 (Phase 57)
- ✓ Release v1.18.0 — package.json bumped; AboutSheet reflects via __APP_VERSION__; clinical gate green (svelte-check 0/0 across 4592 files, vitest 451+/451+, pnpm build OK); Playwright + extended axe sweeps deferred to CI (REL-01..03) — v1.18 (Phase 58)

### Active

## Previously Shipped

- v1.18 Persistence Seam — Phases 55–58
- v1.17 Remove PERT Calculator — Phases 52–54 (released v1.17.0; PERT out of clinical scope)
- v1.15.1 iOS Polish & Drawer Hardening — Phases 47–49 + 51 (shipped under v1.16.x; SMOKE-01..10 deferred)
- v1.15 Pediatric EPI PERT Calculator (sixth calculator) — workstream `pert`, archived to `.planning/milestones/ws-pert-2026-04-26/`
- v1.14 Kendamil Formulas + Desktop Full Nav — Phases 44–46
- v1.13 UAC/UVC Calculator + Favorites Nav — Phases 40–43

### Out of Scope

- Native app builds (Capacitor/iOS/Android) — deferred, PWA-only
- User accounts or authentication — anonymous clinical tool
- Backend/API — all data embedded at build time, no server calls
- Analytics or telemetry — clinical privacy concerns

## Context

**Shipped v1.15.1** under package v1.16.x. Five clinical calculators, all with the v1.13 `<HeroResult>` above-the-fold pattern + sticky `InputDrawer` for inputs + DESIGN.md / DESIGN.json contract enforced (Identity-Inside, Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, Flat-Card-Default). v1.15.1 hardened the iOS bedside experience: NavShell respects `env(safe-area-inset-top/left/right)` so the title bar clears the Dynamic Island; InputDrawer no longer programmatically focuses an input on open (close button gets `autofocus` instead); new `visualViewport.svelte.ts` `$state` singleton anchors the drawer above the iOS soft keyboard via `--ivv-bottom` + `--ivv-max-height` CSS custom properties. Test scaffolding added a jsdom `visualViewport` polyfill + reusable mock helper + new `webkit-iphone` Playwright project. svelte-check 0/0 across 4571+ files, vitest 454/454, Playwright `chromium` + `webkit-iphone` projects green, extended axe 16/16 in both themes. **Real-iPhone smoke gate (SMOKE-01..10) carries forward as a deferred item** — re-opens the v1.13 D-12 deferral; closure requires a clinician at the bedside.

**Five clinical calculators:**
- Morphine Wean: single linear formula (`morphine-wean-calculator.xlsx` Sheet1 parity), config-driven defaults, dock magnification, summary card
- Formula: modified/BMF modes, 40+ brands with manufacturer grouping (incl. Kendamil section as of v1.14), redesigned empty state
- GIR: Weight/Dextrose%/Fluid-order inputs, interactive 6-bucket glucose titration, dextrose-green identity, clinical safety advisories (dextrose >12.5%, GIR >12, GIR <4), STOP-red clinical-safety carve-out on severe-neuro card
- Feed Advance: bedside advancement (Sheet2) + full nutrition (Sheet1) modes, trophic frequency + advance cadence dropdowns, IV backfill, dual TPN dextrose lines, total kcal/kg/d hero, 9 advisory banners
- UAC/UVC: weight-driven umbilical-catheter depth (`weight × 3 + 9` cm and half-depth UVC) with three-cue distinction so UAC cannot be confused for UVC at a glance (v1.13)

Tech stack: SvelteKit 2.57 + Svelte 5.55 (runes) + Tailwind CSS 4 + Vite 8.0 + TypeScript 6.0 + pnpm 10.33.

**Architecture:**
- Calculator registry in `src/lib/shell/registry.ts` — add new calculators with one entry + one route
- Shared `<CalculatorPage>` shell + `CalculatorModule` contract collapses all 5 calculator route shells (`/morphine-wean`, `/formula`, `/gir`, `/feeds`, `/uac-uvc`) into single-line route imports (refactor `0ec8f98`)
- Shared `CalculatorStore<T>` generic class (`src/lib/shell/calculator-store.svelte.ts`) standardizes state-singleton pattern across all calculators (`$state` rune + sessionStorage backup + custom-merge support); all 5 calculator state singletons migrated to it
- Shared components in `src/lib/shared/components/` — NumericInput, SelectPicker, DisclaimerModal, AboutSheet, HeroResult, InputDrawer, RangedNumericInput, SegmentedToggle
- Shared global singletons (`src/lib/shared/`): `theme`, `disclaimer`, `favorites`, `pwa`, `visualViewport` (new in v1.15.1) — all initialized from `+layout.svelte:onMount`, browser-guarded for SSG
- PWA with Workbox precaching and non-blocking update banner
- App version injected from package.json via Vite define

**Users:** NICU clinicians (dietitians, nurses, GI physicians) at point of care. Primarily mobile, one-handed bedside use. Also desktop workstations.

## Constraints

- **Tech stack**: SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite 8 + pnpm
- **No native**: PWA only, no Capacitor
- **Offline-first**: All clinical data embedded at build time, service worker for caching
- **Accessibility**: WCAG 2.1 AA minimum, 48px touch targets, always-visible nav labels
- **Clinical data in JSON**: Store calculation parameters in .json files for easier maintainability

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Responsive nav (bottom mobile / top desktop) | Standard PWA pattern; thumb zone for bedside use | ✓ Good |
| Both dark and light theme | NICU environment needs both | ✓ Good |
| Single shared disclaimer | One acceptance covers all tools | ✓ Good |
| Plus Jakarta Sans typeface | Polished, already in formula-calculator | ✓ Good |
| Plugin-like calculator architecture | Easy to add/swap calculators | ✓ Good — proved by PERT→morphine swap |
| bits-ui for headless components | Accessible primitives for Svelte 5 | ✓ Good |
| JSON config for clinical data | Easier maintainability/updates | ✓ Good |
| Co-located test files | Svelte community standard | ✓ Good |
| Title bar for info/theme buttons | Frees bottom nav for full-width tabs | ✓ Good — v1.2 |
| Dock magnification on mobile | Scroll-driven card scaling, distinctive UX | ✓ Good — v1.2 |
| Version from package.json | Single source of truth via Vite define | ✓ Good — v1.2 |
| Research before PR for new identity hues | Axe-core tuning costs more than upfront OKLCH audit (v1.5 Phase 20 Morphine pain) | ✓ Good — v1.8 GIR hue 145 passed on first sweep |
| Wave 0 latent-bug fixes before feature work | Type unions and route branches must extend cleanly before downstream phases can compile | ✓ Good — v1.8 caught `CalculatorId` + `NavShell.activeCalculatorId` gaps before DOC-01 |
| Spreadsheet-parity tests with ~1% epsilon | Clinical calculators must match source authority, with tolerance for truncated spreadsheet constants | ✓ Good — v1.8 GIR all 6 buckets pass |
| Drop ESLint from DEBT-03 in favor of `svelte-check` + Prettier only | eslint was never installed (Phase 29 noted `pnpm lint` fails with "eslint not installed"). `svelte-check` already covers TS + Svelte semantic errors, accessibility warnings, and untyped-prop lint. Prettier covers formatting. Adding ESLint + a plugin stack (typescript-eslint + svelte-eslint-parser + eslint-plugin-svelte) would introduce ~6 devDeps and a second overlapping rule source for zero additional signal on a 3-calculator PWA. The stale `"lint": "eslint ."` script will be removed. (2026-04-09 / Phase 30-02) | ✓ Good — zero-dep decision |
| Ship PERT as self-contained workstream (not main-roadmap phase) | PERT was a sixth calculator that needed its own architecture/identity/UI/tests cycle independent of the v1.15.1 iOS hotfix work proceeding in parallel; workstream model lets it ship without consuming main-roadmap phase numbers | ❌ Removed in v1.17 — out of clinical scope (pediatric, not neonatal) |
| Wave structure non-negotiable for v1.15.1 (Wave-0 test scaffolding → Wave-1 trivial fixes → Wave-2 visualViewport → Wave-3 real-iPhone smoke) | HIGH-confidence research convergence: jsdom does not implement `window.visualViewport` (P-18) and Playwright is chromium-only (P-19); without Wave-0 the new feature tests give green-by-accident | ✓ Good — Phase 47 polyfill caught the regression at suite startup; Phase 48 + 49 tests genuinely covered the new behavior |
| Combine NOTCH + FOCUS into a single Wave-1 phase (Phase 48) | Both fixes touch different files (NavShell vs InputDrawer), no shared state, parallel-safe; splitting into 48a/48b would force two phase-transition checkpoints for ~10 LOC each | ✓ Good — landed in 2 sibling plans |
| Empty-string `$derived` short-circuit for CSS variable inline binding (Phase 49 D-09) | When `vv.keyboardOpen=false`, return `''` from `$derived` so CSS `var(..., default)` fallbacks govern; defensive `--ivv-bottom: 0px` would compose fragile against future edits | ✓ Good — preserves Phase-48 behavior bit-for-bit at the var-fallback boundary |
| Drawer transform/max-height on inner `.input-drawer-sheet` only, NEVER outer `<dialog>` (Phase 49 D-11) | Top-layer positioning rules + `<dialog>` a11y semantics + the existing SelectPicker dialog-inside-drawer pattern must be preserved; T-11 source-grep sentinel guards future regression | ✓ Good |
| Real-iPhone smoke gate is a phase gate, not optional, for iOS work (v1.15.1 Phase 50) | CI cannot paint the Dynamic Island, emulate iOS soft keyboard, or trigger bfcache — Playwright WebKit on Linux is a CI proxy at best | ⚠️ Revisit — gate deferred at v1.15.1 close; needs to run before next iOS-affecting phase |
| Collapse 6 calculator route shells into `<CalculatorPage>` + `CalculatorModule` (refactor `0ec8f98`) | Six identical route shells were drift-prone; shared shell + module contract reduces each route to a single-line import | ✓ Good |
| Standardize state singletons via generic `CalculatorStore<T>` class (commit `45d86cf`) | Six calculator state singletons had drifted in subtle ways (custom merge logic, schema-recovery handling); generic class with custom-merge support unifies the pattern without losing per-calculator behavior | ✓ Good — all 6 migrated in 4 quick tasks (lyq, m79, mkz, mr1) |
| PersistentValue<T> seam with per-instance codec + recover hook (v1.18 Phase 55, D-01/D-02) | rawStringCodec is non-negotiable for theme/disclaimer/lastEdited because `app.html` FOUC reads `nicu_assistant_theme` as a raw string (jsonCodec would write `"dark"` quoted and break the no-flash boot); recover hook signature `(raw: string \| null) => T` was designed around favorites' existing 6-step pipeline so MIG-03 passes it through verbatim | ✓ Good — 26-test single persistence surface; four adapters migrated in Phase 56 with zero test edits |
| Auto-persist behind CalculatorStore via `$effect.root()` in constructor (v1.18 Phase 57, D-01) | Class can't host bare `$effect`; root effect runs at module-import time (singleton lives the app lifetime); subscribes to `this.current` but NOT `this.lastEdited.current` → re-entry impossible by construction; existing 60s `STAMP_DEBOUNCE_MS` is defense-in-depth | ✓ Good — 9 duplicate per-fragment effects deleted (5 *Inputs + 4 *Calculator parents; the parents were caught by code review WR-01 closing a plan scope gap); 451/451 tests green |
| CalculatorStore NOT migrated onto the seam in v1.18 (deferred per Phase 57 CONTEXT D-01) | ROADMAP wording "CalculatorStore already wraps the same pattern the seam formalizes" implies the class stays a tenant of the same pattern, parallel to the seam. AUTO-* requirements only name CalculatorStore + 5 *Inputs.svelte, not CalculatorStore's storage I/O. Migrating it would be a fifth adapter — future milestone candidate | — Pending; tracked as architecture-review follow-up |
| Playwright + axe sweeps deferred to CI for v1.17 + v1.18 release phases (Phase 54 + Phase 58 precedent) | Local environment has no Playwright browser binaries; svelte-check + vitest + pnpm build are green locally; Playwright/axe pieces of REL-03 captured in `*-HUMAN-UAT.md` with `status: partial` → visible in /gsd:audit-uat | ✓ Good — clean release without local browser dependency; CI is the authoritative gate |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-29 after v1.18 milestone — Persistence Seam shipped (PersistentValue<T> seam + 4 adapter migrations + auto-persist consolidation; released v1.18.0; tagged v1.18.0; milestone archived to .planning/milestones/v1.18-ROADMAP.md).*
