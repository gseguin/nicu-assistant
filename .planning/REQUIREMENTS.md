# Requirements — v1.12 Feed Advance Calculator

**Milestone:** v1.12 Feed Advance Calculator
**Source authority:** `nutrition-calculator.xlsx` (Sheet1 = TPN + enteral full nutrition / Sheet2 = bedside feeding advancement)
**Research:** `.planning/research/SUMMARY.md`

---

## v1.12 Requirements

### Core Bedside Advancement (Sheet2)

- [ ] **CORE-01**: User can enter weight (kg, decimal keyboard, clinical range 0.4 – 6.0 kg) as the shared input across both modes
- [ ] **CORE-02**: User can enter trophic ml/kg/d (range 10 – 30, default 20 matching xlsx Sheet2)
- [ ] **CORE-03**: User can enter advance ml/kg/d (range 10 – 40, default 30 matching xlsx Sheet2)
- [ ] **CORE-04**: User can enter goal ml/kg/d (range 120 – 180, default 160 matching xlsx Sheet2)
- [ ] **CORE-05**: User sees trophic ml/feed, advance-step ml/feed, and goal ml/feed as three simultaneously-visible outputs (no hero/secondary split — all three matter)
- [ ] **CORE-06**: User sees ml/kg/d echoed back next to each ml/feed output to close the mental-math loop
- [ ] **CORE-07**: User sees total fluids rate (ml/hr) computed from `weight × goal_ml_kg_d / 24`
- [ ] **CORE-08**: Empty state when weight is blank: "Enter a weight to see per-feed volumes." (no ghost zeros)
- [ ] **CORE-09**: All bedside calculations match `nutrition-calculator.xlsx` Sheet2 row-by-row within ~1% epsilon (fixture: weight 1.94, default ranges, default frequency, default cadence)

### Frequency & Cadence Dropdowns

- [ ] **FREQ-01**: User can select trophic/feed frequency from dropdown with options q2h / q3h / q4h / q6h (default to match xlsx parity — final choice locked in `/gsd-discuss-phase`, recommendation q3h per FEATURES.md)
- [ ] **FREQ-02**: Trophic frequency dropdown drives feeds-per-day divisor live (q2h=12, q3h=8, q4h=6, q6h=4) — no re-entry needed when frequency changes
- [ ] **FREQ-03**: User can select advance cadence from dropdown: every feed / every other feed / every 3rd feed / twice daily / once daily (default twice daily matching xlsx `/2`)
- [ ] **FREQ-04**: Advance-step formula generalizes to `weight × advance_ml_kg_d / feeds_per_day / advance_events_per_day`, parameterized by both dropdowns
- [ ] **FREQ-05**: Non-integer advances-per-day combinations (e.g., "every 3rd feed" at q3h = 2.67 advances/day) are handled with a documented rounding convention (floor recommended — confirm in `/gsd-discuss-phase`)

### IV Backfill Block (Sheet2 bottom section)

- [ ] **IV-01**: User can enter total fluids rate (ml/hr) and see IV backfill rate computed as `total_fluids − (enteral_ml_per_feed / feed_hours)`, where `feed_hours` derives from the selected frequency (q3h → 3, q4h → 4, etc.)
- [ ] **IV-02**: IV backfill section is framed neutrally as "Estimated IV rate to meet TFI" with a disclaimer noting institution-specific framing
- [ ] **IV-03**: IV backfill calculation matches xlsx Sheet2 `B9 = B7 − (B8/3)` for the default q3h frequency (row-by-row parity)

### Full Nutrition Mode (Sheet1)

- [ ] **FULL-01**: User can toggle between Bedside Advancement and Full Nutrition modes via a `SegmentedToggle` at the top of the calculator, with shared weight persisting across modes
- [ ] **FULL-02**: Full Nutrition mode exposes inputs for TPN dextrose % and TPN volume ml, supporting **two parallel dextrose lines** (modeled as an array, not two scalars, to prevent the second line being silently omitted)
- [ ] **FULL-03**: Full Nutrition mode exposes inputs for SMOF ml, enteral volume ml, and enteral kcal/oz (with standard picker options 20/22/24/27/30 kcal/oz)
- [ ] **FULL-04**: Full Nutrition mode outputs: dextrose kcal = `Σ((dex_i%/100 × ml_i) × 3.4)`, IL kcal = `SMOF × 2`, enteral kcal = `vol × kcal_oz / 30`
- [ ] **FULL-05**: Full Nutrition mode outputs: ml/kg total, **total kcal/kg/d** (hero value), auto-advance ml/feed
- [ ] **FULL-06**: Unit constants (3.4 kcal/g dextrose, 2 kcal/ml lipid, 30 ml/oz enteral) are named constants in code, not magic numbers
- [ ] **FULL-07**: All full-nutrition calculations match `nutrition-calculator.xlsx` Sheet1 row-by-row within ~1% epsilon (fixture: weight 1.74, defaults from xlsx)

### Safety Advisories (Advisory Only — Never Auto-Clamp)

- [ ] **SAFE-01**: Warn when `trophic_ml_kg_d > advance_ml_kg_d` or `trophic_ml_kg_d >= goal_ml_kg_d` ("Trophic volume exceeds advance/goal — verify inputs")
- [ ] **SAFE-02**: Info advisory when advance > 40 or goal > 180 or goal < 120 ml/kg/d ("verify per unit protocol")
- [ ] **SAFE-03**: Info advisory when weight < 0.5 kg ("Weight below 500 g — confirm ELBW protocol")
- [ ] **SAFE-04**: Full Nutrition: info advisory when total kcal/kg/d > 140 or < 90 ("verify", "below growth target")
- [ ] **SAFE-05**: Full Nutrition: info advisory when TPN dextrose % > 12.5 ("Dextrose >12.5% typically requires central access" — reuse GIR v1.8 copy)
- [ ] **SAFE-06**: All advisory thresholds live in `feeds-config.json` under an `advisories` block; `NumericInput` uses its existing blur-gated `showRangeHint` pattern from v1.6 — no auto-clamp, no blocking

### Architecture & Integration (Wave 0)

- [ ] **ARCH-01**: `CalculatorId` type union in `src/lib/shared/types.ts` extended with `'feeds'`
- [ ] **ARCH-02**: `NavShell.svelte` `activeCalculatorId` ternary chain extended with `/feeds` branch
- [ ] **ARCH-03**: Calculator registry in `src/lib/shell/registry.ts` gets a `feeds` entry with `identityClass: 'identity-feeds'` and a distinct lucide icon (candidate: `Baby` per STACK.md, to confirm)
- [ ] **ARCH-04**: `src/lib/shared/about-content.ts` gets a `feeds` entry (required for `Record<CalculatorId, ...>` exhaustiveness) citing `nutrition-calculator.xlsx` Sheet1 + Sheet2 as source of truth
- [ ] **ARCH-05**: New `src/lib/feeds/` module with `types.ts`, `feeds-config.json`, `feeds-config.ts`, `calculations.ts`, `state.svelte.ts`, `FeedAdvanceCalculator.svelte` + co-located tests
- [ ] **ARCH-06**: New `/feeds` route (`src/routes/feeds/+page.svelte`) as thin wrapper importing `FeedAdvanceCalculator.svelte`
- [ ] **ARCH-07**: Zero new runtime dependencies (verified by STACK.md); zero new devDependencies

### Identity Hue (4th OKLCH Token)

- [ ] **HUE-01**: New `.identity-feeds` light + dark OKLCH token pair in `src/app.css`, distinct from Morphine 220 / Formula 195 / GIR 145 (candidate hue ~30 terracotta or ~300 magenta — locked in `/gsd-discuss-phase`)
- [ ] **HUE-02**: OKLCH values hand-computed for 4.5:1 contrast against all 4 identity surfaces (hero bg, focus ring, eyebrow, active nav indicator) in both themes BEFORE PR
- [ ] **HUE-03**: Pre-PR axe-core sweep passes on all 4 identity surfaces in light + dark modes (hard gate — v1.5 Phase 20 Morphine precedent)

### Testing

- [ ] **TEST-01**: Spreadsheet-parity unit tests for Sheet1 (full nutrition) row-by-row, named fixture for the xlsx canonical weight (1.74)
- [ ] **TEST-02**: Spreadsheet-parity unit tests for Sheet2 (bedside advancement) row-by-row, named fixture for the xlsx canonical weight (1.94) with default frequency + cadence
- [ ] **TEST-03**: Parameter-matrix unit tests covering every frequency × cadence dropdown combination for internal consistency (not xlsx-locked, but locked to the generalized formula)
- [ ] **TEST-04**: Config shape tests for `feeds-config.json` (input ranges, dropdown options, advisory thresholds)
- [ ] **TEST-05**: Component tests: empty state, bedside flow, full-nutrition flow, mode toggle preserves weight, dropdown switching, advisory rendering
- [ ] **TEST-06**: Playwright happy-path E2E at mobile 375 + desktop 1280 for both modes, with `inputmode="decimal"` regression assertion
- [ ] **TEST-07**: Playwright axe-core sweeps light + dark × bedside + full-nutrition × focus state (brings total suite to 20/20)

### Release

- [ ] **REL-01**: `package.json` version bumped to 1.12.0 (AboutSheet reflects automatically via `__APP_VERSION__` build-time constant)
- [ ] **REL-02**: PROJECT.md Validated list updated with v1.12 entries
- [ ] **REL-03**: App favicon generated — distinct, recognizable icon that renders correctly at all standard sizes (16×16, 32×32, 180×180 apple-touch-icon, 192×192/512×512 PWA manifest icons); replaces the current blank/white-square favicon
- [ ] **REL-04**: Final gates green: svelte-check 0/0, vitest all green (including new Feeds tests), Playwright all green, axe 20/20, `pnpm build` ✓

---

## Future Requirements (Deferred from v1.12)

- **FEED-FUT-01**: "Next feed step preview" card — shows current ml/feed → next ml/feed → when advance fires next. Requires an optional "current ml/feed" input. Deferred unless scope permits. (FEATURES.md DIFF-03)
- **FEED-FUT-02**: Growth-curve integration (length, HC percentiles) — out of scope for a feeding calculator but requested by some workflows
- **FEED-FUT-03**: Protein / fat / CHO macro targets in Full Nutrition mode (beyond total kcal/kg/d)
- **FEED-FUT-04**: Historical feed log / trend across shifts — would require persistence beyond sessionStorage

## Out of Scope

- **Growth curves, length/HC percentiles** — different tool class, out of scope per NICU Assistant constraints
- **Protein / macronutrient breakdown** — Sheet1 tracks total kcal only; macro targets are a separate workflow
- **Multi-patient context** — anonymous clinical tool, single patient per session (PROJECT.md constraint)
- **Feed history persistence beyond sessionStorage** — no backend
- **Auto-advance scheduling / timers** — calculator is advisory, not an active care plan
- **Bolus vs continuous feed distinction** — all feeds treated as discrete boluses at the selected frequency; continuous feeds are a separate workflow

## Traceability

_Phase mapping populated by roadmap step._

---

*Generated: 2026-04-09 — v1.12 Feed Advance Calculator milestone*
