# v1.8 GIR Calculator — Research Synthesis

**Date:** 2026-04-09
**Overall confidence:** HIGH
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Verdict

**Ship GIR as a structural sibling of Morphine Wean with zero new runtime dependencies.** The v1.5 identity pattern, v1.6 `NumericInput` advisory contract, and v1.1/v1.3 JSON-config + spreadsheet-parity discipline cover every requirement. The only additive surface is a new `src/lib/gir/` module, a new route, one registry entry, one `.identity-gir` CSS block, and one dedicated `GlucoseTitrationGrid.svelte` radiogroup subcomponent (calculator-local, not shared).

**Milestone shape: 3 phases, advisory-only input rails consistent with v1.6.**
- **Phase A — Foundation:** types, `gir-config.json`, pure `calculations.ts` with frozen JSON parity fixture, `state.svelte.ts`. Headless, Vitest-green gate.
- **Phase B — UI + identity + registration:** `GlucoseTitrationGrid.svelte` (radiogroup), `GirCalculator.svelte`, `/gir` route, registry entry + `identityClass` union extension, provisional `.identity-gir` OKLCH block.
- **Phase C — A11y + E2E + version bump:** Playwright flows + axe sweeps (light + dark + focus + advisory variants), OKLCH tuning if axe flags, 1.8.0 bump, PROJECT.md validated list.

---

## Clinical Formula (verified)

```
GIR (mg/kg/min) = (Dex% × Rate_mL/hr × 10) / (Weight_kg × 60)
Initial Rate (mL/hr) = Weight_kg × mL/kg/day / 24
```

**Confirmed against** MDCalc (Guenst & Nelson, Chest 1994), Hawkes & Hwang *J Perinatol* (PMC7286731), Pediatric Oncall, Cornell PICU, Ashford St Peters neonatal fluids guideline. Confidence HIGH.

**Implementation rule:** use exact `10/60` and `1/144` in code — never the spreadsheet's truncated `0.167` / `0.0069` (the latter introduces ~0.85% error). Parity tests allow ~1% epsilon and document the reason.

**Unit decisions (locked):**
- **Glucose:** mg/dL only. mmol/L toggle deferred. Every threshold label includes `mg/dL` inline; footnote *"Multiply mmol/L by 18 to convert."*
- **Dextrose:** entered as percent literal (`12.5`, not `0.125`), `%` suffix, placeholder `e.g. 12.5`.
- **Weight:** kg only.
- **Fluid order:** mL/kg/day input; mL/hr is a derived output, never an input.

## Titration Protocol (framing matters)

The spreadsheet's 6-bucket +1.5 / +1.0 / +0.5 / −0.5 / −1.0 / −1.5 protocol (severe-neuro / <40 / 40–50 / 50–60 / 60–70 / >70) is **institutional, not a published guideline**. Published guidelines (BAPM, AAP, Stanford/JH, PES) commonly prescribe 2 mg/kg/min steps; the spreadsheet's finer conservative steps suit gentle weaning.

**UI framing is safety-critical:**
- Label: *"GIR titration helper — institutional adjustment protocol. Verify against your institutional standard before acting."*
- Column header: *"If current glucose is…"* — **not** *"Recommended for…"*
- **No default row selection.** Hero shows empty-state *"Select a glucose range to see target rate"* until clinician picks.
- AboutSheet cites spreadsheet + published sources and explicitly notes the protocol is institutional.

---

## Features

**Table stakes:** Weight/Dex%/mL/kg/day inputs → Current GIR hero + Initial mL/hr; Dex% chip picker (5/7.5/10/12.5); peripheral-access warning when Dex% > 12.5; max-GIR > 12 and min-GIR < 4 advisories; 6×4 titration helper with clinician-selected bucket highlight; spreadsheet-parity tests.

**Differentiators:** total glucose load g/kg/day (`GIR × 1.44`); total daily fluid mL/day; population reference card (IDM/LGA, IUGR, Preterm/NPO); EPIC dot-phrase copy-to-clipboard (`.hypoglywean`).

**Anti-features:** calculation history (PHI risk), IV compounding (pharmacy scope), EHR auto-ordering, patient identifiers, TPN macronutrients, alarms.

**Canonical naming:** nav tab `GIR`, full name `Glucose Infusion Rate`, eyebrow `mg/kg/min · titration helper`.

---

## Architecture

**New files under `src/lib/gir/`:** `types.ts`, `gir-config.json`, `gir-config.ts` + test, `calculations.ts` + test, `state.svelte.ts`, `GirCalculator.svelte` + test, `GlucoseTitrationGrid.svelte`. Plus `src/routes/gir/+page.svelte`, `tests/e2e/gir.spec.ts`, `tests/e2e/gir-a11y.spec.ts`.

**Modified files:** `src/lib/shell/registry.ts` (append entry, extend `identityClass` union), `src/app.css` (add `.identity-gir` light + dark blocks), `package.json` → 1.8.0.

**Shared components reuse with ZERO modifications:** `NumericInput` (v1.6 `showRangeHint` + v1.7 `showRangeError`), `ResultsDisplay`, `DisclaimerModal`, `AboutSheet`, `NavShell`, `.animate-result-pulse`. `SegmentedToggle` is intentionally **not** used for the titration grid — tablist semantics conflict with a 6-row clinical radiogroup. Instead, a new dedicated `GlucoseTitrationGrid.svelte` with `role="radiogroup"` + `role="radio"` rows, roving tabindex, ↑/↓/Home/End keyboard nav lives under `src/lib/gir/` (extract to shared only if v1.9+ needs it).

**State:** `$state` rune singleton with `init/persist/reset`, sessionStorage key `nicu_gir_state`. Raw inputs only in state module; component computes `$derived(calculateGir(state.current, buckets))`.

**Config:** clinical data lives in `gir-config.json` (defaults, input ranges, glucose buckets). Same JSON drives UI and parity tests. Frozen JSON fixture for parity tests (don't re-read xlsx).

---

## Identity Hue

**Recommendation: hue ~145 "Dextrose Green"**, with violet ~295 as the fallback if green reads too close to Formula teal in practice. Perceptual gap: Morphine 220 → Formula 195 → GIR 145 (25° and 50° — safely distinguishable). Green maps to "metabolic/glucose" semantically without colliding with error (red 25), BMF amber (55–65), or Formula teal (195).

**Literal OKLCH values (mandatory starting point, per Phase 20 Morphine precedent — never eyeball):**
```css
.identity-gir {
  --color-identity:      oklch(46% 0.12 145);
  --color-identity-hero: oklch(94% 0.045 145);
}
.dark .identity-gir,
[data-theme="dark"] .identity-gir {
  --color-identity:      oklch(82% 0.10 145);
  --color-identity-hero: oklch(30% 0.09 145);
}
```

**Rule:** axe-test in both themes before merge. If AA fails, darken light-mode accent to `oklch(44% 0.12 145)` (same one-step fix the v1.5 Morphine hero needed).

---

## Top Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | Dextrose entered as fraction (0.125 vs 12.5) → GIR off 100× | `%` suffix, placeholder `e.g. 12.5`, advisory 2.5–25, parity tests at 5/10/12.5/25 |
| 2 | mg/dL vs mmol/L ambiguity on glucose thresholds | mg/dL only v1.8; every threshold labeled inline; conversion footnote |
| 3 | Titration table read as clinical recommendation | *"If current glucose is…"* framing; no default selection; institutional-helper label |
| 4 | 6×4 table cramped on 375px mobile | Card layout <480px (6 full-width cards, ≥88px min height); `role="grid"` table ≥480px; never horizontal-scroll, never collapse a row |
| 5 | Third identity hue fails dark-mode AA (Phase 20 repeat) | Start from literal OKLCH above; axe sweep both themes before PR |
| 6 | Peripheral extravasation harm from Dex% > 12.5 | Elevated amber advisory (not standard grey hint) — the only rail tied to a concrete harm pathway |
| 7 | Spreadsheet constant truncation drift | Use exact `10/60` + `1/144`; parity tests with 1% epsilon, documented |
| 8 | iOS keyboard missing decimal key | `inputmode="decimal"` on all 3 numeric inputs; Playwright assertion |
| 9 | EPIC paste with locale comma (`12,5`) → NaN | Normalize `trim().replace(',', '.')` at input layer |
| 10 | Negative Δ rate sign confusion (decrease vs new rate) | ▲/▼ glyph + text (never color alone — WCAG 1.4.1); column helper `(decrease)` / `(increase)` |

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | Zero new deps; pattern is a direct sibling of Morphine Wean |
| Formula | HIGH | Verified against 5 independent authoritative sources |
| Titration protocol | MEDIUM | Institutional, not a guideline — framed accordingly |
| Architecture | HIGH | Exact 3-phase pattern proven in v1.1/v1.3/v1.5/v1.6 |
| Identity hue | MEDIUM-HIGH | Math and precedent are solid; axe confirmation mandatory |
| Safety rails | HIGH | Peripheral-access threshold backed by ASPEN + UCSF + PMC8372860 |

**Open questions for requirements step:**
1. Confirm with source clinician whether the 6-bucket protocol is local-institutional (shapes AboutSheet citation).
2. Lock mmol/L toggle as deferred (recommendation: yes, defer).
3. Population reference card inline or behind info affordance?

---

## Next Steps

Research phase is complete and ready for requirements definition. Roadmapper should produce exactly 3 phases (A Foundation / B UI+identity / C A11y+E2E). Phase B is the only phase that likely benefits from a `/gsd-research-phase` pass (titration grid interaction design + mobile card layout); Phase A and Phase C follow well-established patterns from v1.1/v1.3/v1.5/v1.6 and do not need additional research.
