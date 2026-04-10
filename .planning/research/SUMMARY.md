# Project Research Summary — v1.12 Feed Advance Calculator

**Project:** NICU Assistant
**Milestone:** v1.12 Feed Advance Calculator
**Domain:** Neonatal enteral feeding advancement + TPN / enteral total-kcal bedside tool
**Researched:** 2026-04-09
**Confidence:** HIGH

## Executive Summary

v1.12 adds a fourth clinical calculator to the NICU Assistant PWA covering **two distinct workflows from a single spreadsheet** (`nutrition-calculator.xlsx`): Sheet2 bedside feeding advancement (nurse, one-handed, mobile, dominant use case) and Sheet1 full nutrition / TPN + enteral total kcal (dietitian/rounds, desktop/tablet, secondary). Research strongly recommends shipping both as **two modes of a single calculator** gated by the existing `SegmentedToggle`, with Feed Advance as the default landing mode and Full Nutrition as the secondary.

The engineering posture is **zero new runtime and devDependencies**. Every UI, state, test, and a11y pattern needed is already proven across Morphine (v1.11), Formula, and GIR (v1.8): `NumericInput`, `SelectPicker`, `SegmentedToggle`, `--color-identity` tokens, config-driven clinical ranges, hand-transcribed xlsx parity fixtures with ~1% epsilon, and the Playwright + axe-core gate (16/16 → 20/20). The only net-new assets are one `src/lib/feeds/` module, one route, one registry entry, one `.identity-feeds` OKLCH token pair, and one lucide `Baby` icon (already in `@lucide/svelte` 1.8).

Principal risks are all **clinical-correctness** rather than delivery: (1) parameterizing xlsx-hardcoded divisors (`/6`, `/2`, `/3`) as dropdowns without drifting from the locked parity fixture, (2) porting Sheet1's **two parallel dextrose lines** without silently under-reporting kcal, (3) pinning unit constants (`3.4` kcal/g dextrose, `2` kcal/ml SMOF, `30` ml/oz) correctly, (4) replicating the v1.8 Wave-0 latent-bug discipline for `CalculatorId` + `NavShell.activeCalculatorId`, and (5) pre-auditing the 4th identity hue in OKLCH before axe-core discovers the failure at PR time. All five are addressable with discipline already shipped in prior milestones.

## Key Findings

### Recommended Stack

**Zero new dependencies.** Base stack (SvelteKit 2.57 / Svelte 5.55 / Tailwind 4 / Vite 8 / TS 6 / Vitest 4 / Playwright 1.58 / @vite-pwa/sveltekit / adapter-static / @lucide/svelte 1.8 / bits-ui 2.17) is frozen.

**Additions:**
- **Nav icon:** `Baby` from the already-installed `@lucide/svelte` (distinct from `Syringe`/`Milk`/`Droplet`, unambiguous infant signal, label-always-visible so icon carries recognition not meaning).
- **xlsx parity:** continue hand-transcribed fixtures (Sheet1 + Sheet2) — consistent with Morphine v1.11 and GIR v1.8. No `xlsx`/`exceljs` devDep; hand transcription has already caught a truncated-constant class of bug on Morphine that a parser would have propagated silently.
- **Number formatting:** inline `.toFixed(1)` at render site, matching all three existing calculators. Zero-dep posture (DEBT-03) preserved.
- **Identity hue:** one OKLCH token pair in `src/app.css` (`.identity-feeds` light + dark). No Tailwind plugin.

Full detail: `.planning/research/STACK.md`

### Expected Features

The Feed Advance Calculator is a **two-mode tool** inside a single registry entry.

**Must have (table stakes — TS-01..TS-10):**
- Weight kg (0.4–6.0, decimal keyboard)
- Trophic / Advance / Goal ml/kg/d inputs with config-driven clinical ranges
- Trophic frequency dropdown (q2h/q3h/q4h/q6h)
- Advance cadence dropdown (every feed / every other / every 3rd / twice daily / once daily)
- Three per-feed ml outputs (Trophic, Advance step, Goal) bold & tabular, all visible simultaneously
- Total fluids rate ml/hr echoed back as cross-check
- Sheet2 spreadsheet-parity tests locked row-by-row (~1% epsilon)
- Empty-state messaging when weight is blank

**Should have (differentiators — DIFF-01..DIFF-07):**
- ml/kg/d echoed back next to each ml/feed output ("closes the mental-math loop" — highest-trust feature)
- IV backfill block (TFI − enteral → IV rate), collapsed by default
- Full Nutrition mode (Sheet1) as "rounds" tab with total kcal/kg/d hero (TPN dex × 2 lines + SMOF + enteral)
- 4th identity hue, OKLCH-audited pre-PR
- "Verify" advisories (reusing NumericInput v1.6 blur-gated advisory contract)
- Frequency dropdown drives trophic divisor live (single source of truth)

**Defer (v1.13+):**
- Next-feed preview card (DIFF-03) — nice-to-have, not parity-required
- Printable handoff / PDF export
- Cross-linking to Formula calculator beyond AboutSheet copy

**Explicitly anti-features:** growth curves, BSA/length-based calcs, protein targets, feed intolerance tracking, NPO timers, patient lists, unit conversion, editable 24h schedules, growth velocity prediction, voice/barcode/EHR integration. All out of scope per PROJECT.md constraints.

Full detail: `.planning/research/FEATURES.md`

### Architecture Approach

**Single component, single registry entry, shared weight, `SegmentedToggle` at top selects mode.** Flat state shape in `src/lib/feeds/state.svelte.ts` mirrors `GirStateData` — mode toggle changes which fields render, not which exist; stale cross-mode values are harmless. Two-tab-entries approach rejected (5 tabs cramp mobile 375, duplicates weight, requires two identity hues).

**Files to CREATE (14):** `src/lib/feeds/{calculations.ts, calculations.test.ts, feeds-parity.fixtures.json, feeds-config.json, feeds-config.ts, feeds-config.test.ts, types.ts, state.svelte.ts, FeedAdvanceCalculator.svelte, FeedAdvanceCalculator.test.ts}`, `src/routes/feeds/+page.svelte`, `e2e/feeds.spec.ts`, `e2e/feeds-a11y.spec.ts`.

**Files to MODIFY (6) — all Wave-0 latent-bug territory:** `src/lib/shared/types.ts` (`CalculatorId` union), `src/lib/shell/registry.ts` (entry + `identityClass` union), `src/lib/shell/NavShell.svelte` (`activeCalculatorId` ternary), `src/app.css` (`.identity-feeds`), `src/lib/shared/about-content.ts` (exhaustive Record requires new key — TS compile gate), `package.json` (version).

**Identity hue:** hue 30 terracotta recommended (pitfalls doc also floats ~25 or ~285/~340). Maximal hue separation from existing 220/195/145. Final pick deferred to `/gsd-discuss-phase`; OKLCH math and 4 axe sweeps mandatory **before** PR.

Full detail: `.planning/research/ARCHITECTURE.md`

### Critical Pitfalls

1. **P1 — Spreadsheet parity drift when xlsx constants become dropdowns.** xlsx hardcodes `/6`/`/2`/`/3`; we expose them as user-selectable. Mitigation: `feeds-parity.fixtures.json` with two sections — `xlsxLocked` (exact xlsx divisors, row-by-row Sheet1+Sheet2) and `parameterMatrix` (internal consistency only). Guard comment in `calculations.ts` forbidding edits to the locked block. [CRITICAL]

2. **P2 — Sheet1 dual dextrose lines.** Two parallel dextrose inputs (B3/B4 + B5/B6) both feed dextrose-kcal total; a one-line port silently under-reports. Mitigation: model as `dextroseLines: Array<{pct, volumeMl}>` (structural, not two scalars), parity fixture with **both** lines non-zero, explicit unit test `"dextrose kcal sums BOTH lines"`. [CRITICAL]

3. **P3 — Sheet1 unit constant pairing.** `3.4` (kcal/g dextrose), `2` (kcal/ml SMOF 20%), `30` (ml/oz) must pair with correct variable. Mitigation: named constants in `constants.ts` with JSDoc citing derivation; three isolated pure functions (`dextroseKcal`, `lipidKcal`, `enteralKcal`) each unit-tested in isolation; aggregate test asserts sum = parts. [CRITICAL]

4. **P4 — Wave-0 `CalculatorId` + NavShell latent bugs** (v1.8 Phase 28 pattern). Mitigation: Wave-0 grep checklist + stub tasks (types union, NavShell ternary, registry entry, AboutSheet stub, `.identity-feeds` placeholder, `/feeds` placeholder route) landing in a single commit with `pnpm check` + `pnpm test` green **before** calculator logic. [HIGH — build blocker]

5. **P5 — 4th identity hue axe-core failure** (v1.5 Phase 20 rerun risk). Mitigation: pre-research hue avoiding 220/195/145 and the reserved-red band; hand-compute OKLCH contrast against text tokens in the phase plan; target 20/20 axe sweeps (4 new: feeds-light, feeds-dark, feeds-light-selected, feeds-dark-selected) as a hard pre-PR gate. [HIGH]

**Moderate pitfalls (P6–P12):** mode state preservation ambiguity (preserve both per-mode in sessionStorage); trophic-frequency × advance-cadence coherence (single feed-frequency dropdown drives both trophic divisor **and** IV backfill divisor); IV backfill `/3` vs `/4` stale constant (parameterize on feed frequency, not a literal); Sheet1 vs Sheet2 divisor consistency (single `calculateAdvance` used by both); non-integer advances-per-day rounding (**floor** recommended, safer); NumericInput advisory-only contract (no `Math.min/max` near inputs); Playwright `inputmode="decimal"` regression.

**Minor (P13–P14):** AboutSheet copy drift (make it a Wave-0 stub + phase-exit final copy); parity epsilon tuning (reuse GIR `closeEnough()` — 1% relative + absolute floor).

Full detail: `.planning/research/PITFALLS.md`

## Implications for Roadmap

Research points to **one primary calculator phase** bracketed by **Wave 0 hygiene** and **Polish / pre-PR a11y gate**, following the v1.8 GIR shape almost exactly.

### Phase 1: Wave 0 — Latent Bug Fixes + Identity Hue Pre-Research
**Rationale:** v1.8 GIR proved that `CalculatorId` union + `NavShell.activeCalculatorId` ternary + `about-content.ts` Record + `identityClass` union all must extend cleanly before any downstream phase can compile. v1.5 Morphine proved that OKLCH hue tuning costs more post-hoc than pre-hoc.
**Delivers:** compiling placeholder `/feeds` tab with `identity-feeds` stub token, AboutSheet stub entry, green `pnpm check` + `pnpm test`, hand-computed OKLCH contrast sheet for the chosen hue.
**Addresses:** scaffolding for TS-01..TS-10 to land without type churn.
**Avoids:** P4, P5.

### Phase 2: Feed Advance Calculator — pure logic + parity (Sheet1 + Sheet2)
**Rationale:** Clinical correctness gate. No UI until `feeds-parity.fixtures.json` locks both Sheet1 (canonical TPN + SMOF + enteral with **both** dextrose lines non-zero) and Sheet2 (canonical bedside row at xlsx defaults) row-by-row. Config + types + state precede logic only because the logic module imports them.
**Delivers:** `feeds-config.json/.ts`, `types.ts`, `state.svelte.ts`, `calculations.ts` with `dextroseKcal`/`lipidKcal`/`enteralKcal`/`calculateBedsideAdvance`/`calculateFullNutrition`/`calculateIvBackfill`, locked parity tests green (vitest), named unit constants in `constants.ts`.
**Uses:** hand-written fixtures, existing `closeEnough()` epsilon pattern, zero new devDeps.
**Implements:** calculations module (`src/lib/feeds/`).
**Avoids:** P1, P2, P3, P8, P9, P14.

### Phase 3: Feed Advance Calculator — UI (both modes) + component tests
**Rationale:** Logic is frozen; UI is the translation layer. `SegmentedToggle` + `NumericInput` + `SelectPicker` + new identity-hued result block. Single feed-frequency dropdown drives trophic + IV-backfill divisors (prevents P7/P8 coupling bugs). Dual dextrose lines modeled as an array of rows in the Full Nutrition mode (prevents P2).
**Delivers:** `FeedAdvanceCalculator.svelte` with both modes, empty-state, advisory messages (SAFE-01..SAFE-10), component tests (mode toggle preserves weight, bedside flow, full-nutrition flow, dual-dextrose render, advisory blur, NumericInput advisory-only invariant).
**Addresses:** TS-01..TS-10, DIFF-01, DIFF-02, DIFF-05, DIFF-06, DIFF-07.
**Avoids:** P6, P7, P10, P11.

### Phase 4: Route wiring, AboutSheet final copy, E2E + a11y gate (20/20)
**Rationale:** v1.11 and v1.8 showed AboutSheet drift always becomes a fixup commit if it's not a hard phase-exit criterion. E2E + axe sweeps gate release.
**Delivers:** `/feeds` route wired, AboutSheet copy citing `nutrition-calculator.xlsx` Sheet1 + Sheet2 and noting divisor parameterization, Playwright happy-path (mobile 375 + desktop 1280), `inputmode="decimal"` regression, 4 new axe sweeps (feeds light/dark × bedside/full-nutrition or × base/advisory), 20/20 green.
**Avoids:** P5 (pre-PR), P12, P13.

### Phase 5: Release v1.12.0
**Rationale:** Standard release checklist per v1.11.
**Delivers:** `package.json` 1.12.0, AboutSheet version reflection, PROJECT.md Validated list updated, milestone archive.

### Phase Ordering Rationale

- **Wave 0 first** — proven by v1.8 Phase 28; without it the calculator phase cannot compile.
- **Pure logic before UI** — parity fixtures are the clinical correctness gate; the UI is cheap by comparison.
- **UI before routing/AboutSheet** — the AboutSheet copy needs accurate descriptions of what the UI does, and E2E needs the UI to exist.
- **Release last, as always** — single-file version bump + doc update.

### Research Flags

**Phases likely needing `/gsd-research-phase`:** none. Every pattern is proven across 3 prior calculators; all domain and architectural questions are answered in STACK/FEATURES/ARCHITECTURE/PITFALLS.

**Phases with standard patterns (skip research-phase):** Wave 0 (directly mirrors v1.8 Phase 28), Route wiring / E2E / a11y (directly mirrors v1.8 TEST-04..TEST-06 + DOC-01), Release (v1.11 checklist).

**Open questions for `/gsd-discuss-phase`** (user decisions, not research gaps):
1. **Default trophic frequency: q3h vs q4h?** Research recommends **q3h** (default in FEATURES.md — dominant preterm bolus interval + matches xlsx `/8` advance-step denominator). PROJECT.md currently says "default q4h" in the milestone brief. One of these two must win before Phase 2 locks the parity fixture.
2. **Final identity hue pick.** Research nominates terracotta ~30, with ~285 violet, ~25, ~300 magenta, and ~340 plum as alternates. Decide + hand-compute OKLCH 4.5:1 in discuss-phase, not after axe fails.
3. **Sheet1 vs Sheet2 landing mode + SegmentedToggle labels.** Research recommends **Feed Advance (Sheet2) as default landing**, Full Nutrition (Sheet1) as secondary. Confirm.
4. **IV backfill derivation: `/3` (q3h) vs `/4` (q4h).** Must parameterize on the single feed-frequency dropdown (P8); discuss-phase locks the formula derivation comment that goes above `calculateIvBackfill`.
5. **Sheet1 dual dextrose UI: always show both lines vs. "Add second TPN line" affordance.** Data model is array-of-rows regardless (P2). UX affordance is the open question — defaulting to one line reduces visual weight; always-both matches xlsx literal layout.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new deps; every addition already in `@lucide/svelte` 1.8 or `src/app.css` token pattern. In-repo authority. |
| Features | HIGH | Clinical ranges cross-verified against UC Davis 2024, Hopkins 2023, CHOP 2024, Brigham CPG, PMC4303848, UCSF manual, Frontiers 2025, ScienceDirect 2022. xlsx is sole parity target. |
| Architecture | HIGH | All file paths, line numbers, type unions, token names verified against the current repo. Pattern replicates v1.8 GIR 1:1. |
| Pitfalls | HIGH | All 14 pitfalls are either literal reruns of v1.5/v1.6/v1.8/v1.11 pain already paid, or direct consequences of the xlsx cell formulas documented in STACK.md and FEATURES.md. |

**Overall confidence:** HIGH.

### Gaps to Address

- **Default trophic frequency (q3h vs q4h):** PROJECT.md milestone brief and FEATURES.md research disagree. Must be resolved in `/gsd-discuss-phase` before Phase 2. The choice flips which xlsx row is the "locked" parity canonical.
- **IV backfill framing language:** "Estimated IV rate to meet TFI" vs "IV backfill" — institution-specific. Not a blocker; discuss-phase UX decision.
- **Sheet1 auto-advance `/2` hardcode reuse:** P9 requires a deliberate decision to share one `calculateAdvance(divisor)` function between modes. Architecture research recommends this; calculator phase must enforce with a cross-mode consistency test.
- **Non-integer advances-per-day rounding (P10):** research recommends floor; requires explicit user sign-off on the clinical convention before Phase 3 writes the SAFE-07 advisory copy.

## Sources

### Primary (HIGH confidence)
- `nutrition-calculator.xlsx` — Sheet1 + Sheet2 (sole clinical authority)
- `.planning/PROJECT.md` — milestone brief, Validated list (v1.0–v1.11), Key Decisions
- `.planning/MILESTONES.md` — v1.5 Phase 20, v1.8 Phase 28 Wave 0, v1.11 xlsx-as-sole-source-of-truth
- `src/lib/gir/`, `src/lib/morphine/`, `src/lib/shell/`, `src/lib/shared/` — direct code read for types, file paths, token names, advisory contracts
- UC Davis NICU Nutrition Guidelines 2024, Hopkins All Children's 2023, CHOP Preterm Nutrition Consensus 2024, Brigham & Women's Enteral Feeding CPG, UCSF Benioff ICN House Staff Manual, PMC4303848 (VLBW feeding guidelines)
- Frontiers Pediatrics 2025 (fast vs slow advancement), ScienceDirect 2022 systematic review
- RCH Melbourne Neonatal IV Fluid Management, Ashford St Peters Neonatal Fluid Balance 2021

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 `@theme` + CSS custom property docs (consistent with existing `src/app.css` usage)
- `@lucide/svelte` 1.8.0 icon inventory (`Baby` export verified as long-standing)
- EoE Neonatal ODN Enteral Feeding guideline
- IV backfill framing language — institution-specific, no single national standard

### Tertiary (LOW confidence)
- SAFE-07 heuristic (advance step > 20% of goal per feed) — reasoning inference, not a published threshold

---
*Research completed: 2026-04-09*
*Ready for roadmap: yes*
