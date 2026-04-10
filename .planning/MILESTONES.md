# Milestones

## v1.10 GIR Simplification + Dock + Tech Debt (Shipped: 2026-04-10)

**Phases completed:** 3 phases (32, 33, 34), 3 plans

**Tag:** `v1.10.0`

**Key accomplishments:**

- **GIR calculator stripped to its essentials** — Target GIR summary hero card removed; per-card Fluids|Rate|GIR secondary metrics row removed; "Starting GIR by population" reference card removed. The bucket grid is now the sole focal point below the inputs + current GIR hero. Cards display only the bucket range label and the Δ rate hero (▲/▼ ml/hr increase/decrease, or STOP for hyperglycemia, or em-dash for no-change). `GirCalculator.svelte` shrunk from 249 → 166 lines (GIR-SIMP-01..03).
- **Click/tap visual treatment preserved with all a11y intact** — `border-l-4` + `--color-identity-hero` fill on selection, `role="radiogroup"` / `role="radio"` / roving tabindex / keyboard nav / focus rings retained. `selectedBucketId` state retained for visual continuity across navigation, even though nothing downstream consumes it. `aria-live` selection announcements dropped (redundant — Δ rate is already visible on every card) (GIR-SIMP-04, GIR-SIMP-05).
- **Stale GIR test assertions cleaned up** — all e2e and component test assertions referencing the removed chrome (ADJUST RATE / HYPERGLYCEMIA / TARGET REACHED eyebrow, per-card secondary row, population reference card) deleted (GIR-SIMP-07).
- **Morphine-style dock magnification ported to GIR mobile bucket list** — inline clone of `MorphineWeanCalculator.svelte`'s scroll-driven dock pattern: floating index `scrollY/scrollMax*(n-1)`, `MAX_SCALE = 1.06`, `MAX_SHADOW_BOOST = 4`, radius 2.5 (3 cards visibly magnified at once), rAF-throttled scroll handler, `MutationObserver` on grid container, full cleanup teardown. Mobile-only (`window.innerWidth < 768`) AND `!prefers-reduced-motion` guards. `transition-transform` added alongside existing `transition-colors` so scale animates smoothly. Click/tap selection coexists cleanly with inline transform on the same wrapper (GIR-DOCK-01..04).
- **Tech debt majors closed** — `@types/node` 22 → 25 and `typescript` 5 → 6. Both deferred from v1.9. TS 6 sailed through with **zero source edits, zero tsconfig edits, zero NOTES.md deferrals** — the explicit Pause Criteria never fired. svelte-check 0/0 across **4521 files** under TS 6 (DEBT-MAJ-01, DEBT-MAJ-02).
- **Release v1.10.0** — `package.json` bumped 1.9.0 → 1.10.0. AboutSheet automatically reflects v1.10.0 via the `__APP_VERSION__` build-time constant (Phase 31's Vite `define` chain — no source change to `about-content.ts`). PROJECT.md Validated list updated with 4 new v1.10 entries; retired entries struck through with "retired in v1.10" notes: REF-01 (v1.8 population reference card) and the Target GIR summary hero portion of GIR-SWAP-01..03 (grid-level Δ rate hero retained) (REL-01..03).
- **GIR-SIMP-06 dropped mid-flight** — User decided after the plan was drafted to leave the severe-neuro card unchanged. The deferred clinical bolus copy question from v1.9 NOTES.md remains deferred. The intermediate severe-neuro work + revert is preserved on `main` as honest audit trail (commits `6d59b9e`, `7d6da92`, `e5b1f72`).
- **Final gates** — vitest 203/203, svelte-check 0/0 (4521 files, TS 6), Playwright axe 16/16 (GIR-6 + Fortification-4 + Morphine-6, light + dark), Playwright e2e 48 passed / 3 skipped / 0 failed, `pnpm build` ✓ (PWA v1.2.0, 35 precache entries, 1.10.0). Phase 32 verification 6/6, Phase 33 verification 4/4, Phase 34 verification 5/5, milestone audit 15/15.

---

## v1.9 GIR Titration Hero Swap + Polish (Shipped: 2026-04-09)

**Phases completed:** 3 phases (29, 30, 31), 4 plans

**Tag:** `v1.9.0`

**Key accomplishments:**

- **GIR titration hero swap** — Δ rate (ml/hr ▲/▼ with increase/decrease label) is now the bedside hero on every bucket card; GIR mg/kg/min demoted to the secondary row; neutral STOP-card treatment for the Δ=0 "current state" bucket. All v1.8 a11y guarantees preserved (radiogroup, roving tabindex, aria-live, reduced-motion, focus rings); 16/16 axe sweeps green in both themes (GIR-SWAP-01..07).
- **Impeccable polish pass** — Critique-driven fixes across Morphine, Formula, GIR in both themes at mobile 375 + desktop 1280. Dark identity-hero retuned to `oklch(22% 0.045 145)` to preserve 4.5:1 against new tertiary ml/hr text; SegmentedToggle inactive text lifted to primary token (reads "unselected" not "disabled"); summary-card label weight + delta padding refined; bucket range labels normalized to en-dash typography. Zero WCAG regressions (POLISH-01..04).
- **Dependency + dead code sweep** — 4 dep groups bumped within current majors (Svelte 5.55.2, SvelteKit 2.57.0, Vite 8.0.8, Vitest 4.1.4, Playwright 1.59.1, @lucide/svelte 1.8.0, bits-ui 2.17.3), full test suite re-verified after each group. `ResultsDisplay.svelte` + `$lib/shared` barrel removed (confirmed zero importers) (DEBT-01, -02).
- **Lint + TS hygiene** — svelte-check cleaned to 0 errors / 0 warnings across 4493 files. ESLint explicitly dropped in favor of svelte-check + Prettier per PROJECT.md Key Decisions. 8 stale e2e assertions from v1.5–v1.8 drift closed; Phase 29 deferred items cleared (DEBT-03, -04).
- **Release v1.9.0** — `package.json` bumped 1.8.0 → 1.9.0. AboutSheet automatically reflects v1.9.0 via the `__APP_VERSION__` build-time constant (`vite.config.ts` → `pkg.version` → `about-content.ts`, zero hardcoded version strings in any of the 3 AboutSheet entries). PROJECT.md Validated list updated with 9 v1.9 entries covering all 18 milestone requirements (REL-01..03).
- **Code review pass** — 0 critical, 3 warnings — all fixed (fragile non-null assertions removed from `GirCalculator.svelte`, `data-testid="morphine-summary"` replaces Tailwind arbitrary-value class coupling in e2e selectors, dead `triggerMagnification` removed from `MorphineWeanCalculator.svelte`).
- **Final gates** — vitest 205/205, svelte-check 0/0, `pnpm build` ✓ (PWA v1.2.0, 35 precache entries, 325.23 KiB), Playwright axe 16/16, e2e 48p/3s/0f. Phase 29 verification 7/7, Phase 30 verification 12/12, Phase 31 verification 3/3, milestone audit 18/18.

---

## v1.8 GIR Calculator (Shipped: 2026-04-09)

**Phases completed:** 3 phases (26, 27, 28), 9 plans, 13 commits

**Tag:** `v1.8.0`

**Key accomplishments:**

- **Headless GIR engine with spreadsheet parity** — `calculateGir` + `girState` singleton match the `GIR-Wean-Calculator.xlsx` CALC tab within ~1% epsilon across all 6 glucose buckets, using exact `10/60` and `1/144` constants (not the spreadsheet's truncated `0.167`).
- **Accessible 6-row titration grid** — `GlucoseTitrationGrid` with `role="radiogroup"`, full keyboard nav (↑/↓/Home/End/Space/Enter), roving tabindex, ▲/▼ Δ-rate glyphs with explicit labels (never color-alone), and a responsive stack-vs-table layout that keeps all 6 rows visible without horizontal scroll.
- **Third identity hue landed cleanly** — `.identity-gir` dextrose-green (OKLCH hue 145) passed axe-core in both light and dark on first run, pre-empting the v1.5 Phase 20 Morphine contrast repeat. No OKLCH tuning needed.
- **16/16 axe sweeps green** — project-wide a11y coverage: morphine (6) + fortification (4) + new GIR (6) across focus-ring-visible, advisory-message, and selected-bucket variants.
- **Clinical safety advisories wired** — dextrose >12.5% surfaces the "requires central venous access" warning; Current GIR >12 and <4 each surface range advisories sourced from `gir-config.json` (advisory-only, never clamped); ≤0 Target GIR shows "consider stopping infusion."
- **Two latent bugs caught before ship** — Phase 28 Wave 0 fixed `CalculatorId` union (missing `'gir'`) and `NavShell.activeCalculatorId` `/gir` branch (was falling through to Morphine) before they could poison AboutSheet content routing.
- **AboutSheet cites authoritative sources** — GIR entry references `GIR-Wean-Calculator.xlsx` + MDCalc + Hawkes *J Perinatol* PMC7286731, with explicit institutional-protocol disclaimer and central-venous access note.

See [milestones/v1.8-ROADMAP.md](milestones/v1.8-ROADMAP.md) and [milestones/v1.8-REQUIREMENTS.md](milestones/v1.8-REQUIREMENTS.md) for full archive.

---

## v1.7 Formula Micro-Polish (Shipped: 2026-04-08)

**Phases completed:** 1 phase (25), 8 commits, +313/-95 diff across 13 files

**Tag:** `v1.7.0`

**Key accomplishments:**

- Formula field labels cleaned — `"Starting Volume"` / `"Target Calorie"` drop the redundant unit parentheticals (suffix already shows the unit).
- Formula picker + Starting Volume input share a single row on all screen sizes; Target Calorie + Unit get their own `grid-cols-2` row beneath.
- Auto-select packets when the user picks a packets-capable formula — data-driven via new `packetsSupported?: boolean` field on `FortificationFormula` + `formulaSupportsPackets(id)` helper. Preserves v1.3 auto-reset when switching away.
- `showRangeError` prop added to NumericInput (complement to v1.6's `showRangeHint`). Formula Starting Volume now passes both opt-outs for a calm surface while still enforcing the range in the scroll-wheel clamp.
- Version bumped to `1.7.0`.

See [milestones/v1.7-ROADMAP.md](milestones/v1.7-ROADMAP.md) and [milestones/v1.7-REQUIREMENTS.md](milestones/v1.7-REQUIREMENTS.md) for full archive.

---

## v1.6 Toggle & Harden (Shipped: 2026-04-08)

**Phases completed:** 4 phases (21, 22, 23, 24), 5 plans, 20 commits, +3000/-174 diff across 36 files

**Tag:** `v1.6.0`

**Key accomplishments:**

- Shared `SegmentedToggle` component extracted from Morphine's Linear/Compounding tablist — identity-aware (active segment picks up Clinical Blue / Teal via v1.5 route wrappers), keyboard nav (←/→/Home/End), `role="tablist"` ARIA. Morphine refactored to consume it with zero behavior change; Formula `Base` SelectPicker replaced.
- `NumericInput` hardened: visible range hint (`0.1–200 kg` en-dash), blur-gated "Outside expected range — verify" advisory (em dash), no auto-clamp, opt-out `showRangeHint` prop for cases where the hint is redundant.
- Clinical input ranges moved from magic numbers at call sites into JSON config (`inputs` top-level key in both `morphine-config.json` and `fortification-config.json`) with typed TS wrappers.
- Result feedback parity — shared `.animate-result-pulse` class in `src/app.css` (200ms scale-from-95% entrance, reduced-motion gated); `aria-live="polite"` + `aria-atomic="true"` on both calculator result heroes; no auto-scroll, no focus theft.
- Zero WCAG regressions — every v1.6 surface passed AA on first axe sweep. Playwright a11y green 12/12 (added 4 new advisory-message variants covering both calculators × both themes).
- Phase 22 bonus infra fix — jsdom stubs for `matchMedia` + `Element.animate` in `src/test-setup.ts` unblocked blur-triggered transition tests and benefited Phase 23's result-pulse tests.
- Version bumped to `1.6.0`.

See [milestones/v1.6-ROADMAP.md](milestones/v1.6-ROADMAP.md) and [milestones/v1.6-REQUIREMENTS.md](milestones/v1.6-REQUIREMENTS.md) for full archive.

---

## v1.5 Tab Identity & Search (Shipped: 2026-04-07)

**Phases completed:** 3 phases (18, 19, 20), 5 plans, 18 commits, +3030/-47 diff across 28 files

**Tag:** `v1.5.0`

**Key accomplishments:**

- Searchable Formula picker — case-insensitive label+manufacturer filter, ArrowDown/ArrowUp traversal between input and listbox, Enter-to-select-single-match, "No matches" state, query reset on reopen. Wired via opt-in `searchable` prop on the shared SelectPicker; Morphine pickers untouched (existing T-01..T-11 still pass).
- Per-tab visual identity via new `--color-identity` CSS token — Morphine reuses Clinical Blue 220, Formula gets a new Teal ~195 (light + dark, OKLCH). Wired to exactly 4 surfaces: result hero card, focus-visible outlines, section eyebrow labels, and the active calculator tab indicator in both mobile and desktop nav. Shell chrome and BMF tokens untouched.
- NavShell per-tab identity via new `identityClass` field on `CalculatorEntry` — applied directly to each tab `<a>` element, solving the "nav lives above the route" cascade trap.
- Real WCAG failure caught and fixed by Phase 20's axe sweep: Phase 19's Morphine schedule eyebrow on the new identity-hero card was 3.61:1 (re-used `--color-accent-light`). Tuned `.identity-morphine` light hero to literal `oklch(95% 0.04 220)`, restoring 4.5:1 without touching `--color-accent*`.
- Playwright a11y suite extended — focus-ring rendered + dark-mode results-visible variants now covered for both calculators. 8/8 axe sweeps green, no `disableRules` escape hatches.
- App version finally bumped from `1.2.0` (stuck since v1.2) to `1.5.0` so the about dialog reflects shipped state.

See [milestones/v1.5-ROADMAP.md](milestones/v1.5-ROADMAP.md) and [milestones/v1.5-REQUIREMENTS.md](milestones/v1.5-REQUIREMENTS.md) for full archive.

---

## v1.4 UI Polish (Shipped: 2026-04-07)

**Phases completed:** 6 phases (12, 13, 14, 15, 16, 17), 6 plans, 8 commits

**Key accomplishments:**

- Shared SelectPicker rewritten from bits-ui Select to a hand-rolled Svelte 5 component on native `HTMLDialogElement.showModal()` — drop-in compatible, 11 new colocated unit tests, jsdom polyfill with setup-time self-test, BLOCKER fix for dialog aria-labelledby collision with the trigger
- Fortification visual polish — mobile row pairing for Target Calorie + Unit, "Amount to Add" hero restyled with `bg-[var(--color-accent-light)]` + `text-5xl` tabular numeric matching morphine wean result theming, spacing/typography sweep with `text-2xs` eyebrow unification
- Morphine Wean polish — step card eyebrows and meta typography aligned to Phase 13 rhythm; dock-style scroll magnification untouched
- Shell & navigation polish — `min-h-14` title bar, `tracking-tight` app name, visible accent focus outlines on desktop tabs and mobile tab bar, active-state weight bump
- Animation & reduced-motion audit — full motion table documented; NumericInput `transition:slide` guarded via `matchMedia('(prefers-reduced-motion: reduce)')` at module load; no layout-shift animations anywhere
- Accessibility deep-dive — 5 dark-mode color-contrast violations traced to two under-bright OKLCH tokens and fixed (`--color-text-secondary` 70%→80%, `--color-accent` 72%→82%); `disableRules(['color-contrast'])` escape hatch removed from both a11y specs; Playwright axe suite 6/6 green with color-contrast enabled in both themes
- New `--color-scrim` OKLCH token added for `<dialog>::backdrop` styling; all shell and calculator surfaces use only `var(--color-*)` tokens

---

## v1.3 Fortification Calculator Refactor (Shipped: 2026-04-07)

**Phases completed:** 3 phases (9, 10, 11) + 1 inserted/reverted (10.1), 5 plans

**Key accomplishments:**

- Unified Fortification calculator matching the recipe-calculator.xlsx Calculator tab exactly, replacing legacy Modified Formula + BMF modes
- 30 infant formulas (Abbott, Mead Johnson, Nestlé, Nutricia) embedded as clinician-editable JSON config with displacement_factor, calorie_concentration, grams_per_scoop
- Spreadsheet-parity unit tests verifying the documented Neocate case to 13 decimals, plus per-unit and per-special-case coverage (BM+Tsp HMF shortcut, Packets HMF protocol)
- Packets unit hidden from picker for non-HMF formulas with auto-reset on formula switch
- WCAG 2.1 AA axe-core a11y audit for fortification calculator in light + dark modes
- Carryover wins: SelectPicker label association via aria-labelledby (a11y improvement across all calculators), legacy Modified Formula + BMF code fully removed
- Phase 10.1 (all-units display refactor) explored and reverted via clean git revert after customer feedback preferred the unit selector matching the spreadsheet

---

## v1.2 UI Polish (Shipped: 2026-04-03)

**Phases completed:** 4 phases, 14 plans, 27 tasks

**Key accomplishments:**

- SvelteKit 2.55 + Vite 8 + Tailwind CSS 4 scaffold with adapter-static SPA output and TypeScript strict mode
- OKLCH Clinical Blue + BMF Amber token scales with FOUC-safe dark mode via inline script and @custom-variant dark
- Responsive nav shell with theme singleton, calculator registry, and skeleton placeholder routes at /pert and /formula
- bits-ui installed, shared types/context/disclaimer singleton created as foundation for Plans 02-04 parallel component work
- Unified SelectPicker with bits-ui Select primitives supporting grouped and flat option rendering, scroll lock, and keyboard navigation
- 1. [Rule 3 - Blocking] Fixed Svelte 5 test environment resolution
- AboutSheet side sheet with per-calculator content, plus integration tests for disclaimer singleton and NumericInput validation
- PERT dosing logic (7 files) and formula recipe logic (3 files) ported with adapted imports, plus sessionStorage-backed state singletons for both calculators
- Reason:
- Three formula calculator components (mode switcher, modified mode, BMF mode) ported with dark mode tokens, Phase 2 shared components, 40+ brand picker with manufacturer grouping, and dispensing measures
- 17 unit tests covering all PERT and formula pure calculation functions with real clinical config data, zero mocks
- SvelteKitPWA with Workbox precaching (28 assets), web app manifest, placeholder icons, and pwa.svelte.ts reactive update singleton
- Non-blocking UpdateBanner.svelte with idle-detection auto-reload wired through +layout.svelte SW registration lifecycle

---

## v1.1 Morphine Wean Calculator (Shipped: 2026-04-02)

**Phases completed:** 6 phases, 18 plans, 35 tasks

**Key accomplishments:**

- SvelteKit 2.55 + Vite 8 + Tailwind CSS 4 scaffold with adapter-static SPA output and TypeScript strict mode
- OKLCH Clinical Blue + BMF Amber token scales with FOUC-safe dark mode via inline script and @custom-variant dark
- Responsive nav shell with theme singleton, calculator registry, and skeleton placeholder routes at /pert and /formula
- bits-ui installed, shared types/context/disclaimer singleton created as foundation for Plans 02-04 parallel component work
- Unified SelectPicker with bits-ui Select primitives supporting grouped and flat option rendering, scroll lock, and keyboard navigation
- 1. [Rule 3 - Blocking] Fixed Svelte 5 test environment resolution
- AboutSheet side sheet with per-calculator content, plus integration tests for disclaimer singleton and NumericInput validation
- PERT dosing logic (7 files) and formula recipe logic (3 files) ported with adapted imports, plus sessionStorage-backed state singletons for both calculators
- Reason:
- Three formula calculator components (mode switcher, modified mode, BMF mode) ported with dark mode tokens, Phase 2 shared components, 40+ brand picker with manufacturer grouping, and dispensing measures
- 17 unit tests covering all PERT and formula pure calculation functions with real clinical config data, zero mocks
- SvelteKitPWA with Workbox precaching (28 assets), web app manifest, placeholder icons, and pwa.svelte.ts reactive update singleton
- Non-blocking UpdateBanner.svelte with idle-detection auto-reload wired through +layout.svelte SW registration lifecycle
- Linear and compounding morphine wean calculations with TDD, config-driven defaults, and complete PERT removal from registry/nav/routes
- Morphine wean calculator with three NumericInput fields, Linear/Compounding mode tabs, and mobile-optimized 10-step stacked card schedule
- 38 total tests passing: 20 spreadsheet parity tests verifying row-by-row clinical accuracy plus 6 component tests for MorphineWeanCalculator UI behavior
- Playwright axe-core e2e tests validating WCAG 2.1 AA compliance for morphine wean calculator in light mode, dark mode, and with schedule visible

---
