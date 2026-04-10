# Feature Landscape — Feed Advance Calculator (v1.12)

**Domain:** Neonatal enteral feeding advancement + TPN/enteral total-kcal bedside calculator
**Researched:** 2026-04-09
**Source authority:** `nutrition-calculator.xlsx` (Sheet1 = full nutrition / TPN+enteral kcal; Sheet2 = bedside feeding advancement) — spreadsheet is the sole parity target, just like Morphine Sheet1 in v1.11.
**Overall confidence:** HIGH for bedside advancement (Sheet2), MEDIUM-HIGH for TPN total-kcal (Sheet1)

---

## Executive framing

Two distinct clinical workflows live inside one xlsx and should live inside one calculator as two modes of a `SegmentedToggle`:

1. **Feed Advance mode (Sheet2) — bedside nurse tool.** Answers "what ml per feed do I hang right now, and what's the next step?" One-handed, mobile, inside a patient room, under a four-hour clock. This is the dominant use case.
2. **Full Nutrition mode (Sheet1) — dietitian/rounds tool.** Answers "is this baby hitting target kcal/kg/d once you add TPN dextrose + SMOF + enteral together?" Two-handed, desktop or tablet, during rounds or consult notes. Lower frequency, higher cognitive load.

Both are backed by the same identity hue, the same shell, and the same `NumericInput`/`SegmentedToggle`/`SelectPicker` primitives that already ship. No new shared components are needed.

**Key recommendation:** ship both modes in v1.12 as the milestone PROJECT.md already commits, but design Feed Advance mode as the default landing mode (it's the bedside workflow) and Full Nutrition as the secondary mode. Opposite of Morphine's single-mode stripped form — this calculator legitimately has two audiences.

---

## Table Stakes

Features clinicians expect the moment they open a bedside feeding advancement calculator. Missing any of these = "I'll just use the spreadsheet."

| # | Feature | Why expected | Complexity | Shared component |
|---|---------|--------------|------------|------------------|
| TS-01 | Weight input in kg, decimal keyboard, clinical range 0.4 – 6.0 kg | Every neonatal calc is weight-driven. Lower bound covers 400 g ELBW micropreemies; upper bound covers chunky late-preterm / term infants on the unit. | Low | `NumericInput` |
| TS-02 | Trophic ml/kg/d input, range 10 – 30, default 20 | Trophic definition in the literature is 10–25 ml/kg/d (UCSF Intensive Care Nursery manual; PMC4303848 VLBW guidelines). Spreadsheet default 20 is squarely in-range. Allow up to 30 to match EFCNI/CHOP "nutritional feeds start at 30" convention. | Low | `NumericInput` |
| TS-03 | Advance ml/kg/d input, range 10 – 40, default 30 | Classic teaching was 10–20 ml/kg/d, but recent meta-analyses (Frontiers Pediatrics 2025; ScienceDirect systematic review 2022) show 30–40 ml/kg/d does not increase NEC and shortens time to full feeds. xlsx default 30 matches Hopkins / CHOP fast-advance protocols. Range must accept both slow (10) and fast (40). | Low | `NumericInput` |
| TS-04 | Goal ml/kg/d input, range 120 – 180, default 160 | Universal target is 150–160 ml/kg/d across every guideline surveyed (UC Davis 2024, Brigham & Women's enteral CPG, Hopkins All Children's 2023). 120 lower bound covers fluid-restricted CLD/BPD babies; 180 upper bound covers high-volume growth-failure rescue. | Low | `NumericInput` |
| TS-05 | Trophic frequency dropdown: **q2h / q3h / q4h / q6h**, default **q3h** (÷8) | xlsx hardcodes a denominator → user-selectable per milestone scope. q3h is the dominant NICU bolus interval for preterms on the unit (UCSF manual). q2h is used post-feed-intolerance at ≥100 ml/kg/d; q4h/q6h are for larger/stable infants and step-down nurseries. **Default q3h** matches the xlsx `/8` advance-step denominator and is the most common preterm bolus cadence — confirm with user in `/gsd-discuss-phase`. | Low | `SelectPicker` |
| TS-06 | Advance cadence dropdown: **every feed / every other feed / every 3rd feed / twice daily / once daily**, default **twice daily** | xlsx hardcodes `/8/2` (÷8 feeds = q3h, ÷2 = twice-daily advances). Generalize to `weight × advance_ml_kg_d / feeds_per_day / advance_events_per_day`. "Twice daily" = advance volume at 2 of the day's feeds; "every feed" = ramp every feed (aggressive). Default twice daily preserves xlsx parity and matches the most common bedside cadence. | Low | `SelectPicker` |
| TS-07 | Three output values per feed (ml/feed), clearly labelled: **Trophic**, **Advance step**, **Goal** | Direct port of xlsx Sheet2 column outputs. These three numbers are what the nurse copies into the MAR. Bold tabular numerals, all three visible at once, no hero/secondary split — all three matter simultaneously. | Low | New presentational block (no shared component needed, pattern similar to Morphine schedule card) |
| TS-08 | Total fluids rate in ml/hr echoed back (`weight × goal_ml_kg_d / 24`) | Standard bedside cross-check. Total Fluid Intake (TFI) is calculated every shift (RCH Melbourne IV fluid guideline; Ashford St Peters neonatal fluid guideline). Showing ml/hr alongside ml/feed lets the nurse sanity-check the pump rate without a second calculator. | Low | Part of results block |
| TS-09 | Spreadsheet-parity tests locked to Sheet2 row-by-row | Same contract as Morphine v1.11 and GIR v1.8. Every default combination (weight × trophic × advance × goal × q3h × twice daily) must equal xlsx Sheet2 within ~1% epsilon. | Low (existing vitest pattern) | — |
| TS-10 | Empty-state messaging when weight is blank | Every shipped calculator does this. "Enter a weight to see per-feed volumes." No ghost zeros. | Low | — |

---

## Differentiators

Features that elevate this above the xlsx and above other bedside calculators. Not expected, but valued.

| # | Feature | Value proposition | Complexity | Shared component |
|---|---------|-------------------|------------|------------------|
| DIFF-01 | **ml/kg/d echoed back next to each ml/feed output** | The xlsx only shows ml/feed. Echoing ml/kg/d back ("24 ml at q3h = 30 ml/kg/d for 3.2 kg") closes the mental-math loop and lets the nurse sanity-check *before* the baby drinks the wrong volume. This is the single highest-trust feature available. | Low — just `(ml_per_feed × feeds_per_day) / weight` | — |
| DIFF-02 | **IV backfill block** — "Target TFI ml/hr − enteral ml/hr = IV rate ml/hr" | xlsx does `total_fluids − (enteral/3)` which implies enteral bolused over some interval. Frame it as: at goal enteral volume and chosen frequency, how much IV is still running? Collapsed by default, expandable. Covers mixed enteral+IV phase which is the dominant "advancing" state for the first 1–2 weeks. Confidence: MEDIUM — backfill framing is institution-specific (no single national standard found), but the underlying TFI math is universal. Label it "Estimated IV rate to meet TFI" with a neutral disclaimer. | Low-Medium | `NumericInput` for TFI override |
| DIFF-03 | **"Next feed" step preview** — one card showing "current volume → next volume → when" | The spreadsheet gives you the advance step but not the destination. Showing "34 ml now → 40 ml at next advance" directly maps to what the nurse writes in the MAR and what they tell the next shift at handoff. Derived from current ml/feed + advance step. Requires a "current volume ml/feed" input (optional, defaults to trophic). | Medium | `NumericInput` |
| DIFF-04 | **Identity-hued warm rose or plum** for the 4th calculator tab, OKLCH-verified for 4.5:1 light + dark before PR | Follows the v1.8 GIR precedent: upfront hue audit beats post-hoc axe-core tuning. Morphine is blue-220, Formula is amber-60, GIR is green-145 — an unused warm hue around 20–40 (rose) or 340 (plum) keeps all four calculators visually distinct at the nav level. Decide in `/gsd-discuss-phase`. | Medium (OKLCH math) | `--color-identity` token |
| DIFF-05 | **Full Nutrition mode (Sheet1) as the "rounds" second tab** with total kcal/kg/d hero | Dietitian/physician workflow. TPN line 1 (dex%, ml), TPN line 2 (dex%, ml), SMOF ml, enteral kcal/oz, enteral volume, weight → dextrose kcal + IL kcal + enteral kcal → total kcal/kg/d hero + ml/kg/d secondary. Different audience, different mode, same calculator. The mode toggle is the differentiator — no other bedside tool unifies both views. | Medium-High | `SegmentedToggle` (mode), `NumericInput` × 7, `SelectPicker` for kcal/oz |
| DIFF-06 | **"Verify" advisory (not auto-clamp) on values outside expected ranges** — leverages existing `NumericInput` showRangeHint blur-gated advisory from v1.6 | e.g. advance 50 ml/kg/d → "Outside expected range — verify." Nurses can still enter it (policy varies), but the calculator flags it. Zero new component work. | Low | `NumericInput` (existing) |
| DIFF-07 | **Frequency changes trophic denominator live** — q3h → ÷8, q4h → ÷6, q2h → ÷12, q6h → ÷4 | Generalizing the xlsx hardcode pays off: dropdown changes flow through instantly, no re-entry. This is the single UX win from making the dropdown exist at all. | Low | `SelectPicker` |

---

## Safety advisories (candidate trigger conditions)

All advisories use the existing `NumericInput` blur-gated "verify" pattern from v1.6 or a dedicated `role="status"` line in the results block. None should auto-clamp or block entry — clinical policy varies and the calculator is advisory only.

| # | Trigger | Severity | Message | Confidence |
|---|---------|----------|---------|------------|
| SAFE-01 | `trophic_ml_kg_d > advance_ml_kg_d` | Warn | "Trophic volume exceeds advance step — verify inputs." | HIGH (logical invariant) |
| SAFE-02 | `trophic_ml_kg_d >= goal_ml_kg_d` | Warn | "Trophic volume meets or exceeds goal — verify inputs." | HIGH (logical invariant) |
| SAFE-03 | `advance_ml_kg_d > 40` | Info | "Advance rate above 40 ml/kg/d — verify per unit protocol." | MEDIUM (30–40 is the published fast-advance ceiling per Frontiers 2025 + ScienceDirect 2022 systematic review) |
| SAFE-04 | `goal_ml_kg_d > 180` | Info | "Goal volume above 180 ml/kg/d — confirm per unit protocol." | MEDIUM (most guidelines top out at 160–180) |
| SAFE-05 | `goal_ml_kg_d < 120` | Info | "Goal volume below 120 ml/kg/d — fluid-restricted protocol?" | MEDIUM (CLD/BPD fluid restriction is a legitimate use case; this is a sanity nudge, not an error) |
| SAFE-06 | `weight < 0.5` kg | Info | "Weight below 500 g — confirm ELBW protocol." | HIGH (micropreemie boundary) |
| SAFE-07 | Advance step ml/feed > 20% of goal ml/feed | Info | "Advance step is a large fraction of goal volume — verify cadence." | LOW (heuristic; surfaces "once daily" cadence on a tiny baby) |
| SAFE-08 | Full Nutrition mode: `total_kcal_per_kg > 140` | Info | "Total kcal/kg/d above 140 — verify." | MEDIUM (typical growth target is 110–130; 140+ is high but not impossible) |
| SAFE-09 | Full Nutrition mode: `total_kcal_per_kg < 90` | Info | "Total kcal/kg/d below 90 — below growth target." | MEDIUM |
| SAFE-10 | Full Nutrition mode: TPN dextrose % > 12.5 | Info | "Dextrose >12.5% typically requires central access." | HIGH — reuse GIR v1.8 advisory copy verbatim |

All thresholds belong in `feed-advance-config.json` under an `inputs` / `advisories` block, matching the v1.6 config-driven pattern.

---

## Anti-Features

Features that bedside calculators commonly add and that would be **noise** here. Keep the scope clinical, tight, and boring.

| Anti-feature | Why avoid | What to do instead |
|--------------|-----------|-------------------|
| Growth curves / Fenton / Olsen plotting | Wrong tool. Growth tracking is an EHR/flowsheet concern, not a 15-second bedside calc. Adding a curve introduces reference-data liability (which curve, which version, which sex). | Out of scope. Document in AboutSheet. |
| Length-based or BSA-based calculations | Neonatal feeding advancement is weight-based, period. Length and BSA belong to oncology chemo dosing, not feeds. | Out of scope. |
| Protein (g/kg/d) targets or protein-kcal ratio | Legitimate nutrition concern, but belongs to a dedicated TPN builder, not a feed advancement bedside tool. Sheet1 doesn't even compute protein — only dextrose kcal, IL kcal, enteral kcal. | Out of scope for v1.12. Candidate for a future dedicated TPN calculator if demand emerges. |
| Fortification cross-links ("click here to fortify") | The Formula calculator already exists at `/formula`. Don't duplicate or entangle. Nav handles this. | Cross-reference in AboutSheet only. |
| Feed intolerance / residual volume tracking | Requires state over time (last 4 feeds, trending residuals). Out of scope for a stateless bedside calculator. | Out of scope. Flowsheets do this. |
| NPO/hold countdown timer | Time-aware features break offline determinism and add wall-clock dependency. | Out of scope. |
| Multiple babies / patient list / twins | Single-calculation tool. No patient identity, no list, no save-for-later. Matches current PWA privacy posture. | Out of scope. Matches Out of Scope list in PROJECT.md. |
| Printable handoff card / PDF export | Nice-to-have, but blows up the a11y and print-stylesheet surface for marginal value when the nurse has the screen in their hand. | Out of scope for v1.12. Reconsider if user feedback demands. |
| Unit conversion (ounces, drams) | NICU is metric globally. Ounces are a formula-calculator concern only (kcal/oz input already exists on Sheet1). | Out of scope. |
| Editable schedule / step-by-step 24h plan | Morphine wean has a daily schedule because weaning is inherently stepwise over days. Feed advancement is a continuous curve — the nurse wants *current volume + next step*, not a 7-day plan. | Out of scope. The xlsx doesn't show one either. |
| Growth velocity predictions (g/day from kcal/kg) | Inference the calculator shouldn't make. Too many confounders (illness, losses, metabolism). | Out of scope. |
| Voice input / barcode scan / EHR integration | Native/integration territory, violates PWA-only + offline-first constraints. | Out of scope per PROJECT.md constraints. |

---

## Dropdown option lists (lock these in)

### Trophic frequency (SelectPicker, TS-05)
| Label | feeds_per_day divisor | Default? |
|-------|-----------------------|----------|
| Every 2 hours (q2h) | 12 | |
| Every 3 hours (q3h) | 8 | ✓ default |
| Every 4 hours (q4h) | 6 | |
| Every 6 hours (q6h) | 4 | |

### Advance cadence (SelectPicker, TS-06)
| Label | advance_events_per_day | Default? |
|-------|------------------------|----------|
| Every feed | = feeds_per_day | |
| Every other feed | = feeds_per_day / 2 | |
| Every 3rd feed | = feeds_per_day / 3 | |
| Twice daily | = 2 | ✓ default |
| Once daily | = 1 | |

Formal generalization:
```
feeds_per_day      = 24 / freq_hours
advance_step_ml    = (weight × advance_ml_kg_d) / feeds_per_day × (advance_events_per_day / feeds_per_day_for_step)
```

Simplest form matching xlsx: `advance_step_ml_per_feed = (weight × advance_ml_kg_d) / feeds_per_day / (feeds_per_day / advance_events_per_day)`.

At xlsx defaults (weight 3.0, advance 30, q3h = feeds_per_day 8, twice daily = 2 events/day):
`3.0 × 30 / 8 / (8/2) = 3.0 × 30 / 8 / 4 = 2.8125 ml` — **does not match** xlsx `÷8/÷2 = 5.625`.

xlsx formula is actually `weight × advance_ml_kg_d / 8 / 2` = "per-feed step when you split one day's advance across 2 events." So the correct generalization is:
```
advance_step_ml_per_feed = (weight × advance_ml_kg_d) / feeds_per_day / advance_events_per_day
```
At defaults: `3.0 × 30 / 8 / 2 = 5.625 ml` ✓ matches xlsx. **Lock this formula.** Advance cadence dropdown sets `advance_events_per_day` directly.

### Full Nutrition mode — Enteral caloric density (SelectPicker, Sheet1)
| Label | kcal/oz |
|-------|---------|
| 20 kcal/oz (standard term) | 20 |
| 22 kcal/oz | 22 |
| 24 kcal/oz (preterm standard) | 24 |
| 26 kcal/oz | 26 |
| 27 kcal/oz | 27 |
| 28 kcal/oz | 28 |
| 30 kcal/oz (max fortification) | 30 |

---

## Clinical default ranges (single source of truth for `feed-advance-config.json`)

| Input | Min | Max | Default | Step | Source |
|-------|-----|-----|---------|------|--------|
| Weight (kg) | 0.4 | 6.0 | — | 0.01 | Clinical boundaries: 400 g ELBW floor, 6 kg late-preterm/term ceiling |
| Trophic ml/kg/d | 10 | 30 | 20 | 1 | UCSF, PMC4303848, xlsx |
| Advance ml/kg/d | 10 | 40 | 30 | 1 | Frontiers 2025, ScienceDirect 2022, xlsx |
| Goal ml/kg/d | 120 | 180 | 160 | 5 | UC Davis 2024, Brigham CPG, Hopkins 2023, xlsx |
| TFI ml/kg/d (optional override for backfill block) | 80 | 200 | 160 | 5 | RCH Melbourne, Ashford St Peters |
| TPN dextrose % | 5 | 25 | 10 | 0.5 | GIR calc precedent (>12.5% central access warning already exists — reuse) |
| TPN line 1/2 volume (ml) | 0 | 500 | — | 1 | Sheet1 |
| SMOF (ml) | 0 | 100 | — | 0.5 | Sheet1 |
| Enteral kcal/oz | 20 | 30 | 24 | 1 | SelectPicker above |
| Enteral volume (ml) | 0 | 1000 | — | 1 | Sheet1 |

---

## Output unit expectations (answer to question 4)

Clinicians expect **all three representations** echoed back, not just ml/feed:

1. **ml/feed** — what they hang. Primary bedside output. Bold, tabular.
2. **ml/kg/d** — what the order is written in. Secondary, smaller, under each ml/feed number. Closes the loop between orders and execution.
3. **ml/hr** — what the pump displays when feeds run as a continuous infusion or as a TFI cross-check. Shown once in the results block as "Total fluid rate" next to the goal value.

Do NOT hide any of these behind a toggle. All three are expected simultaneously; screen real estate on mobile supports it (the Morphine result card demonstrates the pattern).

---

## MVP recommendation (what ships in v1.12)

Ship in order:
1. **Feed Advance mode (Sheet2)** — TS-01..TS-10, SAFE-01..SAFE-07, DIFF-01, DIFF-06, DIFF-07
2. **Full Nutrition mode (Sheet1)** — DIFF-05, SAFE-08, SAFE-09, SAFE-10
3. **IV backfill block** — DIFF-02 (collapsed-by-default so it doesn't dominate the bedside view)
4. **Next feed preview** — DIFF-03 (only if scope allows; otherwise defer to v1.13)

Defer:
- DIFF-03 (Next feed preview) — nice-to-have, not required for parity
- Any cross-linking to Formula calculator beyond AboutSheet copy

**Parity floor:** spreadsheet-parity tests must lock Sheet2 row-by-row for at least weight 3.0 kg × (trophic 20, advance 30, goal 160) × q3h × twice-daily, AND Sheet1 row-by-row for at least one canonical TPN+SMOF+enteral combination. Same pattern, same ~1% epsilon as Morphine v1.11 and GIR v1.8.

---

## Dependencies on existing shared components (confirmed, zero new components required)

| Need | Existing component | Status |
|------|--------------------|--------|
| Numeric input with range hint + blur advisory + decimal keyboard | `NumericInput` (v1.6 hardened, v1.7 showRangeError opt-out) | ✓ ready |
| Trophic frequency + advance cadence + kcal/oz dropdowns | `SelectPicker` (v1.4 dialog-based, v1.5 searchable) | ✓ ready |
| Feed Advance / Full Nutrition mode switch | `SegmentedToggle` (v1.6 extracted, keyboard nav, ARIA tablist) | ✓ ready |
| Empty state / disclaimer / about entry | `DisclaimerModal` + `AboutSheet` | ✓ ready (append new entry) |
| Calculator registration + nav tab + route | `src/lib/shell/registry.ts` + new `/feeds` route | ✓ pattern ready |
| Identity hue token | `--color-identity` per-tab | ✓ pattern ready, new hue needed |
| Config-driven clinical ranges | `inputs` block pattern from Morphine / Fortification / GIR configs | ✓ ready |
| Spreadsheet-parity test harness | vitest co-located pattern from Morphine Sheet1 + GIR all-buckets | ✓ ready |
| axe-core sweeps light + dark | Playwright a11y suite (16/16 green) | ✓ extend with +2 sweeps (feed-advance light + dark) targeting 18/18 |

**Net new components: zero.** Every single v1.12 UI need is already satisfied by the shared library. This mirrors the GIR v1.8 "zero shared-component modifications" discipline.

---

## Open questions for `/gsd-discuss-phase`

1. **Default trophic frequency: q3h or q4h?** q3h gives byte-for-byte xlsx Sheet2 parity (the xlsx `/8` divisor on the advance step implies q3h feeds). q4h matches a different xlsx label (`/6`). Research recommends **q3h** as default because q3h is the dominant preterm bolus interval clinically AND matches the xlsx advance-step denominator. Confirm with user.
2. **Identity hue choice:** warm rose (~20–40) vs deep plum (~340) vs something else? Needs OKLCH 4.5:1 audit before PR.
3. **IV backfill framing:** call it "Estimated IV rate" or "IV backfill to TFI"? Institution-specific language — MEDIUM confidence on the label.
4. **Sheet1 mode: default landing or secondary?** Recommendation: **secondary** (Feed Advance is the bedside workflow and should land first).
5. **Next-feed preview (DIFF-03):** v1.12 or v1.13?
6. **Dual TPN lines in Full Nutrition mode:** Sheet1 has two parallel dextrose lines. Always show both? Or show line 2 only when user taps "Add second TPN line"? Bedside-facing dietitians sometimes have only one line; defaulting to one line with an "add" affordance reduces visual weight.

---

## Sources

- [UC Davis NICU Nutrition Guidelines 2024](https://health.ucdavis.edu/media-resources/pediatrics/documents/pdfs/clinical-guidelines/NICU-Nutrition-Guideline-PCG-2025.pdf) — goal 150–160 ml/kg/d, advancement rates
- [UC Davis FEN NICU feeding guideline v2 2024](https://health.ucdavis.edu/media-resources/pediatrics/documents/pdfs/clinical-guidelines/fen-nicu-feeding-guideline-pcg-v2.pdf)
- [Hopkins All Children's — Early Standardized Enteral Nutrition (2023)](https://www.hopkinsmedicine.org/-/media/files/allchildrens/clinical-pathways/early-enteral-nutrition-6_14_23.pdf) — fast-advance protocol, start 30 ml/kg/d for ≥1 kg infants
- [CHOP Preterm Nutrition Consensus (2024)](https://www.chop.edu/sites/default/files/2025-01/5-Preterm-Nutrition-Consensus-Enteral-Feeds_Rev12-13-24.pdf)
- [Brigham & Women's Enteral Feeding CPG](https://www.brighamandwomens.org/assets/BWH/pediatric-newborn-medicine/pdfs/feeding-enteral-cpg.pdf)
- [Guidelines for Feeding Very Low Birth Weight Infants — PMC4303848](https://pmc.ncbi.nlm.nih.gov/articles/PMC4303848/) — trophic definition 10–15 ml/kg/d
- [Frontiers Pediatrics 2025 — fast advancement + early fortification](https://www.frontiersin.org/journals/pediatrics/articles/10.3389/fped.2025.1544381/full) — 30–40 ml/kg/d does not increase NEC
- [ScienceDirect 2022 systematic review — fast vs slow feed advancement](https://www.sciencedirect.com/science/article/abs/pii/S1355184122001454)
- [UCSF Benioff Intensive Care Nursery House Staff Manual — feeding preterm infants](https://www.ucsfbenioffchildrens.org/-/media/project/ucsf/ucsf-bch/pdf/manuals/15_feedingpreterminfants.pdf) — q3h first-line, q2h post-intolerance
- [RCH Melbourne Neonatal IV Fluid Management](https://www.rch.org.au/rchcpg/hospital_clinical_guideline_index/Neonatal_and_Infant_Intravenous_Fluid_Management/) — TFI calculation pattern
- [Ashford St Peters Neonatal Fluid Balance 2021](https://ashfordstpeters.net/Guidelines_Neonatal/Fluid%20Balance%20Oct%202021.pdf)
- [EoE Neonatal ODN — Enteral Feeding guideline](https://www.eoeneonatalpccsicnetwork.nhs.uk/wp-content/uploads/2021/10/Enteral-Feeding-guideline.pdf)
- `nutrition-calculator.xlsx` — Sheet1 (full nutrition / TPN+enteral kcal) and Sheet2 (bedside feeding advancement) — sole spreadsheet-parity target for v1.12

**Confidence summary:**
- Clinical ranges (TS-01..TS-04, SAFE-01..SAFE-06): **HIGH** — multiple authoritative NICU guidelines agree, xlsx defaults sit inside published ranges.
- Feeding frequency (TS-05): **HIGH** — q3h dominant, q2h/q4h/q6h well-attested.
- Advance cadence generalization (TS-06): **MEDIUM-HIGH** — "twice daily" is a clear institutional pattern from the xlsx; other cadences are logical generalizations and should be reviewed by the clinician stakeholder.
- IV backfill framing (DIFF-02): **MEDIUM** — underlying TFI math is universal; specific "backfill" language is institution-specific.
- Full Nutrition mode audience split (DIFF-05): **MEDIUM** — derived from workflow analysis + PROJECT.md user segmentation (dietitians vs nurses), not a published source.
- Anti-features list: **HIGH** — scoped tightly against PROJECT.md constraints and existing calculator precedents.
