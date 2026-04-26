# Requirements — Workstream `pert` / Milestone v1.15

**Pediatric EPI PERT Calculator** — sixth clinical calculator added to the NICU Assistant PWA, sourced from `epi-pert-calculator.xlsx` Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`).

REQ-ID format: `PERT-[CATEGORY]-[NN]`. Numbering is workstream-local; integration with main `.planning/REQUIREMENTS.md` happens at workstream completion.

---

## v1.15 Requirements

### Architecture (`PERT-ARCH-*`)

- [ ] **PERT-ARCH-01**: `CalculatorId` union extended with `'pert'`; type-check passes across all consumers
- [ ] **PERT-ARCH-02**: `CALCULATOR_REGISTRY` entry added (`id: 'pert'`, label, icon from `@lucide/svelte`, description, `identityClass: 'identity-pert'`)
- [ ] **PERT-ARCH-03**: `/pert` route shell created at `src/routes/pert/+page.svelte` rendering `<PertCalculator />`
- [ ] **PERT-ARCH-04**: `src/lib/pert/` module created (types, config wrapper, state singleton, calculations, parity fixtures + tests, component)
- [ ] **PERT-ARCH-05**: `NavShell.activeCalculatorId` ternary extended for `/pert` (preserves favorites + identity color logic)
- [ ] **PERT-ARCH-06**: AboutSheet `pert` entry citing `epi-pert-calculator.xlsx` Pediatric tabs and DailyMed for medication strengths; institutional-protocol disclaimer matching GIR/UAC pattern
- [ ] **PERT-ARCH-07**: First-run favorites defaults are the first 4 alphabetical registry entries (`['feeds', 'formula', 'gir', 'morphine-wean']`) — change from v1.13/v1.14 historical order, accepted in Phase 1 D-20 as a side-effect of alphabetizing `CALCULATOR_REGISTRY`. User can favorite `pert` via hamburger to bring it into the bottom-nav 4-cap.

### Identity Hue (`PERT-HUE-*`)

- [ ] **PERT-HUE-01**: `.identity-pert` OKLCH token pair (light + dark) added to `app.css`, hand-computed for 4.5:1 contrast on all 4 identity surfaces (result hero, focus rings, eyebrows, active nav indicator) in both themes — researched pre-PR per v1.8 decision
- [ ] **PERT-HUE-02**: Hue distinct from Morphine (220 blue), Formula (~60 amber), GIR (145 green), Feeds (~30 terracotta), UAC/UVC (current hue) — visually identifiable at a glance
- [ ] **PERT-HUE-03**: Pre-PR axe-core sweep confirms 4.5:1 contrast on first run, no post-merge OKLCH retuning

### Oral Mode Core (`PERT-ORAL-*`)

- [ ] **PERT-ORAL-01**: Weight input in kg via shared `<RangedNumericInput>` (same component as Morphine/Feeds/UAC/UVC); range advisory; `inputmode="decimal"` regression-guarded
- [ ] **PERT-ORAL-02**: Fat-grams-per-meal input via `<NumericInput>` with config-driven range advisory
- [ ] **PERT-ORAL-03**: Lipase-units/kg/meal input with default 1000 (matches xlsx `B7`) and config-driven range
- [ ] **PERT-ORAL-04**: Medication picker (Creon, Zenpep, Pancreaze, Pertzye, Viokace) via shared `<SelectPicker>`
- [ ] **PERT-ORAL-05**: Strength picker filtered by selected medication (matches xlsx `FILTER(E2:E28, D2:D28 = B8)` semantics)
- [ ] **PERT-ORAL-06**: Hero output — capsules per dose computed as `ROUNDUP((weight × lipasePerKg) / strength, 0)`, parity within 1% of xlsx `B11` for fixture rows
- [ ] **PERT-ORAL-07**: Secondary outputs — total lipase needed (`weight × lipasePerKg`), lipase per dose (display of capsules × strength)
- [ ] **PERT-ORAL-08**: Capsules-per-day estimate (× 3 meals/day) shown as a tertiary output below the hero, labeled "Estimated daily total (3 meals/day)" — flagged as estimate, not a clinical instruction

### Tube-Feed Mode Core (`PERT-TUBE-*`)

- [ ] **PERT-TUBE-01**: Weight input shared with Oral mode (single `<RangedNumericInput>` state singleton across modes)
- [ ] **PERT-TUBE-02**: Pediatric enteral formula picker via shared `<SelectPicker>` with all 17 formulas from xlsx columns H/I (PediaSure Grow & Gain, PediaSure Enteral, PediaSure Peptide 1.0, Compleat Pediatric, Compleat Pediatric Organic Blends, Kate Farms Pediatric Standard 1.2, Kate Farms Pediatric Peptide 1.5, Nutren Junior, Nutren Junior Fiber, Peptamen Junior, Peptamen Junior 1.5, Peptamen Junior Fiber, EleCare Jr, Neocate Junior, PurAmino Jr, Alfamino Junior, Equacare Jr) with their fat g/L values
- [ ] **PERT-TUBE-03**: Volume-per-day (mL) input via `<NumericInput>` with range advisory
- [ ] **PERT-TUBE-04**: Lipase-units/kg/day input with default 1000 (matches xlsx `B8`) and config-driven range
- [ ] **PERT-TUBE-05**: Medication + strength pickers shared with Oral mode (same component instances, same state)
- [ ] **PERT-TUBE-06**: Hero output — capsules per day computed as `CEILING(totalLipase / strength, 1)` where `totalLipase = (formulaFatGPerL × volumePerDay/1000) × lipasePerKgPerDay × weight` — parity within 1% of xlsx `B13` for fixture rows
- [ ] **PERT-TUBE-07**: Secondary outputs — total fat (g), total lipase needed, lipase per kg (B12), capsules per month (capsules/day × 30, matches xlsx `B14`)

### Mode Switching (`PERT-MODE-*`)

- [ ] **PERT-MODE-01**: SegmentedToggle (Oral / Tube-Feed) at the top of the calculator following v1.6 pattern (`role="tablist"`, ←/→/Home/End keyboard nav)
- [ ] **PERT-MODE-02**: Mode persists to sessionStorage (key `nicu:pert:mode`, schema `{v:1, mode: 'oral' | 'tube-feed'}`); first-run defaults to Oral
- [ ] **PERT-MODE-03**: Shared state across modes — weight, medication, strength persist when switching modes (mode-specific inputs — fat g, formula, volume, lipasePerKg — persist independently per mode)
- [ ] **PERT-MODE-04**: Hero result region updates `aria-live="polite"` on mode switch and on input change (consistent with v1.6)

### Clinical Data (`PERT-DATA-*`)

- [ ] **PERT-DATA-01**: `src/lib/pert/pert-config.json` with 5 medications and their strength arrays (Creon, Zenpep, Pancreaze, Pertzye, Viokace — strengths from xlsx columns E and L), pediatric formula fat-g/L table (17 formulas), lipase-units/kg defaults (1000 for both modes), validation messages, range bounds for weight/fat/volume/lipasePerKg
- [ ] **PERT-DATA-02**: Typed TS wrapper `src/lib/pert/config.ts` exposing `PERT_CONFIG`, `PEDIATRIC_FORMULAS`, `PERT_MEDICATIONS` with shape tests
- [ ] **PERT-DATA-03**: xlsx data-entry artifacts excluded — `Pertzye=2.0` row and any sub-1000 strength values not in the FDA strength set are filtered out at config load
- [ ] **PERT-DATA-04**: AboutSheet copy block describes both modes, cites `epi-pert-calculator.xlsx` Pediatric tabs and DailyMed, includes institutional-protocol disclaimer

### Safety Advisories (`PERT-SAFE-*`)

- [ ] **PERT-SAFE-01**: Max-lipase-units/day cap advisory — when computed daily lipase (oral × 3 meals OR tube-feed total) exceeds `weight × 10000` (xlsx `B12`), surface a STOP-style red advisory matching v1.13 STOP-red carve-out semantics ("Exceeds 10,000 units/kg/day cap — verify with prescriber")
- [ ] **PERT-SAFE-02**: Weight range advisory — blur-gated "Outside expected pediatric range — verify" message via `<NumericInput showRangeHint>` (no auto-clamp, consistent with v1.6)
- [ ] **PERT-SAFE-03**: Fat/volume range advisories — same pattern, config-driven bounds
- [ ] **PERT-SAFE-04**: Empty-state messaging — when required inputs missing, hero shows neutral "Enter weight and fat grams" copy (consistent with v1.13 empty-state copy unification)

### Tests (`PERT-TEST-*`)

- [ ] **PERT-TEST-01**: Spreadsheet-parity vitest within 1% epsilon for Oral mode — at least 3 weight × 3 fat fixtures including the xlsx default (weight 22 lbs → ~9.98 kg, fat 25 g, lipase 1000/kg, Creon strength 12000 → expected capsules per `B11`); we re-derive in kg directly since the toggle is dropped
- [ ] **PERT-TEST-02**: Spreadsheet-parity vitest within 1% epsilon for Tube-Feed mode — at least 3 weight × 3 formula × 2 volume fixtures including the xlsx default (weight 15 lbs → ~6.80 kg, Kate Farms Pediatric Standard 1.2 at 40 g/L, volume 1000 mL → expected capsules per `B13` and capsules/month per `B14`)
- [ ] **PERT-TEST-03**: Component tests for `PertCalculator.svelte` covering empty / valid Oral flow / valid Tube-Feed flow / mode-switch / SegmentedToggle keyboard nav / formula picker search / advisory rendering / max-lipase advisory firing
- [ ] **PERT-TEST-04**: Config shape tests — every medication has `brand` + `strengths[]`, every formula has `name` + `fatGPerL`, no entries fall outside FDA strength sets
- [x] **PERT-TEST-05**: Playwright E2E happy-path at mobile 375 + desktop 1280, both modes, with `inputmode="decimal"` regression guard, favorites round-trip (favorite from hamburger → reload → persists), sessionStorage round-trip — **FULL closure 2026-04-26 (Phase 3.1 plan 04 clinical gate, commit pending)**: pert.spec at 12/12 (Phase 3 PARTIAL was 8/8; +4 picker-driven runner cases shipped by Plan 03.1-03 `0d9636f`). KI-1 RESOLVED at Plan 03.1-01 `f2da16d` (Svelte 5.9+ function-binding wrappers).
- [ ] **PERT-TEST-06**: Playwright axe sweeps in light + dark for the `/pert` route, added to the existing extended axe suite — must pass on first run (research-before-PR contract)

### Visual Design Polish (`PERT-DESIGN-*`)

- [x] **PERT-DESIGN-01**: `/impeccable` critique skill run on live `/pert` UI in **light + dark** themes at **mobile 375 + desktop 1280** before release; findings triaged into P1 (must-fix) / P2 (should-fix) / P3 (nice-to-fix) per Phase 42.1 / 42.2 precedent -- **FULL closure 2026-04-26 (Phase 4 plan 04-01 + Gate 14)**: 8 critique transcripts captured (Wave 1 baseline + Wave 3 FINAL re-run); LLM-Design-Review fallback per orchestrator setup note #9; PRODUCT.md authored at repo root; auto-disposition rubric per CONTEXT D-03 applied.
- [x] **PERT-DESIGN-02**: All P1 critique findings fixed before merge; addressable P2/P3 fixed inline if cheap, deferred with explicit triage notes if expensive (consistent with v1.9 POLISH-04 pattern) -- **FULL closure 2026-04-26 (Phase 4 plan 04-02 + Gate 15)**: 0 P1 findings; 1 P2 fix-now F-03 shipped (Tube-Feed Capsules-per-month visual hierarchy bump); 4 P2/P3 deferred per D-08b + D-03 (F-01, F-02 cross-calculator backlog; F-04, F-05 layout polish).
- [x] **PERT-DESIGN-03**: DESIGN.md / DESIGN.json contract enforced -- Identity-Inside Rule (`.identity-pert` only on inside-the-route surfaces), Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong (with the v1.13 STOP-red carve-out for PERT-SAFE-01 max-lipase cap), Tabular-Numbers on all numerical outputs, Eyebrow-Above-Numeral hero pattern, 11px font-size floor -- **FULL closure 2026-04-26 (Phase 4 plans 04-02 + 04-03 + Gates 8, 9, 10, 11, 12)**: AUDIT.sh exit 0; Identity-pert reservation 11 hits all whitelisted; STOP-red carve-out 3 hits all in PertCalculator.svelte stopAdvisories block; em-dash 0 across PERT-route; tabular-numerals 9 (>= 5).
- [x] **PERT-DESIGN-04**: `<HeroResult>` shared component owns above-the-fold viewport on mount in both modes; sticky `<InputDrawer>` pattern for input collapsibility consistent with v1.13 cross-route adoption -- **FULL closure 2026-04-26 (Phase 4 plans 04-02 + 04-03 + Gates 16, 17)**: per-context Aesthetic + Recognition heuristic scores 4/4 in 8/8 contexts; F-04 P3 deferred per D-03 default (D-08b boundary).
- [x] **PERT-DESIGN-05**: SegmentedToggle (Oral / Tube-Feed) visually integrated with the existing identity-hue treatment -- does not introduce a new visual idiom -- **FULL closure 2026-04-26 (Phase 4 plans 04-02 + 04-03 + Gates 16, 17)**: Consistency heuristic = 4/4 in 8/8 contexts; Phase 1 + Phase 2 inheritance (active-pill carries `text-[var(--color-identity)]` matching v1.6 SegmentedToggle treatment); zero F-row finding cited the toggle.
- [x] **PERT-DESIGN-06**: 16/40 -> >= 35/40 critique score target (or document why a lower score is acceptable for this calculator), matching v1.13 Phase 42.2 sweep delta -- **FULL closure 2026-04-26 (Phase 4 plan 04-03 + Gates 16, 17)**: Wave 3 aggregate 36.25/40 (Wave 1 baseline 35.6/40, delta +0.65); 8/8 contexts at >= 35/40 (target was >= 6/8); zero unhandled P1; AUDIT.sh exit 0; all 4 sub-conditions of CONTEXT D-04 score acceptance gate met.

### Release (`PERT-REL-*`)

- [x] **PERT-REL-01**: `package.json` version bump (target version determined at completion based on whether v1.14 has shipped -- likely v1.14.0 if pert ships first, else v1.15.0) -- **FULL closure 2026-04-26 (Phase 5 plan 05-01, commit `92e4a1c` for the bump)**: package.json bumped 1.13.0 -> 1.15.0 single-line edit on line 4; AboutSheet auto-flows via __APP_VERSION__ Vite-define; no edit to about-content.ts.
- [x] **PERT-REL-02**: AboutSheet reflects new version via `__APP_VERSION__` Vite-define constant -- **FULL closure 2026-04-26 (Phase 5 plan 05-01, commit `92e4a1c`)**: AboutSheet reflects v1.15.0 for all 6 calculator entries; verified at execute time via programmatic-fallback DOM probe (production bundle baked with the literal `1.15.0` at `build/_app/immutable/nodes/0.BbEh0vra.js:28`; see 05-01-SUMMARY.md).
- [x] **PERT-REL-03**: Workstream `pert` PROJECT.md Validated list updated with all v1.15 entries; main `.planning/PROJECT.md` updated at workstream completion -- **FULL closure 2026-04-26 (Phase 5 plan 05-01, commit for the closure-record)**: Workstream PROJECT.md v1.15 Closure section appended; main .planning/PROJECT.md fold-back deferred to /gsd-workstreams complete pert per 05-CONTEXT.md D-06.
- [x] **PERT-REL-04**: ROADMAP.md (workstream-local) Progress rows flipped to Complete; orphan planning artifacts cleaned -- **FULL closure 2026-04-26 (Phase 5 plan 05-01, commit `0024855` for the cleanup)**: Workstream ROADMAP.md Progress rows all flipped to Complete; orphan UAT debug artifacts cleaned in commit `0024855` (11 targets including .planning/workstreams/pert/phases/04-design-polish-impeccable/.continue-here.md, __capture.mjs, .playwright-mcp/, 8 UAT debug PNGs).
- [x] **PERT-REL-05**: Full clinical gate green pre-bump -- `pnpm svelte-check` 0/0, `pnpm test` all green, `pnpm build` ✓, Playwright E2E + extended axe suite green in both themes (35/35 axe sweeps after adding 2) -- **FULL closure 2026-04-26 (Phase 5 plan 05-01, Task 2 verification-only)**: 7-gate clinical gate green pre-bump: svelte-check 0/0; vitest 425/425; pnpm build 576.21 KiB; pert-a11y 4/4; pert.spec 12/12; disclaimer-banner targeted 6 passed + 1 baseline flake on disclaimer-banner.spec.ts:28 per established Phase 1/2/3/3.1/4 precedent; PERT-route invariants all 9 assertions PASS.

---

## Future Requirements (deferred from v1.15)

- **Adult Oral PERT mode** — `Adult Oral PERT Tool` xlsx tab (different fat-load assumptions, larger test surface)
- **Adult Tube Feed PERT mode** — `Adult Tube Feed PERT` xlsx tab
- **Per-meal logging history** — stateful tracking across meals (significant scope expansion)
- **Custom formula entry** — user adds a non-listed formula with manual fat-g/L (likely deferred indefinitely; clinical-data-as-code is a project principle)

---

## Out of Scope

- **Adult dosing modes** — pediatric only for v1.15; adult tabs in xlsx are deferred (see Future Requirements)
- **Capacitor / native iOS / Android** — PWA only, consistent with main project Out of Scope
- **lbs/kg unit toggle** — explicitly dropped per workstream decision; weight is kg-only matching the existing 5 calculators (Morphine, Feeds, UAC/UVC, GIR all kg-only)
- **`Pertzye=2.0` xlsx artifact** — treated as data-entry noise; filtered at config load
- **Backend / API** — all data embedded at build time
- **Analytics / telemetry** — clinical privacy
- **Per-meal historical logging** — stateless calculator like the other five

---

## Traceability

Phase mapping for milestone v1.15. Workstream-local phase numbering (1..5). All 54 v1.15 REQ-IDs map to exactly one phase.

| REQ-ID | Phase | Status |
|--------|-------|--------|
| PERT-ARCH-01 | Phase 1 | Active |
| PERT-ARCH-02 | Phase 1 | Active |
| PERT-ARCH-03 | Phase 1 | Active |
| PERT-ARCH-04 | Phase 1 | Active |
| PERT-ARCH-05 | Phase 1 | Active |
| PERT-ARCH-06 | Phase 1 | Active |
| PERT-ARCH-07 | Phase 1 | Active |
| PERT-HUE-01 | Phase 1 | Active |
| PERT-HUE-02 | Phase 1 | Active |
| PERT-HUE-03 | Phase 1 | Active |
| PERT-DATA-01 | Phase 1 | Active |
| PERT-DATA-02 | Phase 1 | Active |
| PERT-DATA-03 | Phase 1 | Active |
| PERT-DATA-04 | Phase 1 | Active |
| PERT-ORAL-01 | Phase 2 | Active |
| PERT-ORAL-02 | Phase 2 | Active |
| PERT-ORAL-03 | Phase 2 | Active |
| PERT-ORAL-04 | Phase 2 | Active |
| PERT-ORAL-05 | Phase 2 | Active |
| PERT-ORAL-06 | Phase 2 | Active |
| PERT-ORAL-07 | Phase 2 | Active |
| PERT-ORAL-08 | Phase 2 | Active |
| PERT-TUBE-01 | Phase 2 | Active |
| PERT-TUBE-02 | Phase 2 | Active |
| PERT-TUBE-03 | Phase 2 | Active |
| PERT-TUBE-04 | Phase 2 | Active |
| PERT-TUBE-05 | Phase 2 | Active |
| PERT-TUBE-06 | Phase 2 | Active |
| PERT-TUBE-07 | Phase 2 | Active |
| PERT-MODE-01 | Phase 2 | Active |
| PERT-MODE-02 | Phase 2 | Active |
| PERT-MODE-03 | Phase 2 | Active |
| PERT-MODE-04 | Phase 2 | Active |
| PERT-SAFE-01 | Phase 2 | Active |
| PERT-SAFE-02 | Phase 2 | Active |
| PERT-SAFE-03 | Phase 2 | Active |
| PERT-SAFE-04 | Phase 2 | Active |
| PERT-TEST-01 | Phase 3 | Active |
| PERT-TEST-02 | Phase 3 | Active |
| PERT-TEST-03 | Phase 3 | Active |
| PERT-TEST-04 | Phase 3 | Active |
| PERT-TEST-05 | Phase 3 + Phase 3.1 (FULL closure) | Validated |
| PERT-TEST-06 | Phase 3 | Active |
| PERT-DESIGN-01 | Phase 4 (FULL closure) | Validated |
| PERT-DESIGN-02 | Phase 4 (FULL closure) | Validated |
| PERT-DESIGN-03 | Phase 4 (FULL closure) | Validated |
| PERT-DESIGN-04 | Phase 4 (FULL closure) | Validated |
| PERT-DESIGN-05 | Phase 4 (FULL closure) | Validated |
| PERT-DESIGN-06 | Phase 4 (FULL closure) | Validated |
| PERT-REL-01 | Phase 5 | Validated |
| PERT-REL-02 | Phase 5 | Validated |
| PERT-REL-03 | Phase 5 | Validated |
| PERT-REL-04 | Phase 5 | Validated |
| PERT-REL-05 | Phase 5 | Validated |

**Total:** 54 requirements across 10 categories. Coverage: 54 / 54 mapped, 0 orphans, 0 duplicates.
