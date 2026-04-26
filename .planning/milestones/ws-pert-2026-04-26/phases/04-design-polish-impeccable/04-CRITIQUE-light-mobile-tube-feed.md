# /impeccable critique transcript: light-mobile-tube-feed

**Context (CONTEXT D-01 row 2):** theme=light, viewport=mobile (375x667), mode=Tube-Feed
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-26T03:48Z
**Inputs:** weight 6.80 kg, formula Kate Farms Pediatric Standard 1.2, volume 1000 mL, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDay = 4 (rendered)
**Identity color:** oklch(42% 0.12 285)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at /tmp/04-wave1/snapshot-light-mobile-tube-feed.png + JSON at /tmp/04-wave1/snapshot-light-mobile-tube-feed.json. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Mode qualifier "TUBE-FEED DOSE" reads correctly. Hero updates live. SegmentedToggle reflects current mode in InputDrawer. |
| 2 | Match between system and the real world | 4 | "Total fat", "Total lipase needed", "Lipase per kg", "Capsules per month" - clinical-correct vocabulary throughout. capsulesPerDay is the prescribing artifact, capsulesPerMonth derives. |
| 3 | User control and freedom | 4 | Mode toggle reversible; Formula picker searchable (combobox); Escape closes drawer. |
| 4 | Consistency and standards | 4 | All 4 secondary rows follow eyebrow-above-numeral convention. Identity-Inside Rule held: identity-purple on eyebrows, neutral chrome. |
| 5 | Error prevention | 3 | Range hints present. Defensive zero-return on bad inputs. The Tube-Feed empty-state gate hides secondaries until ALL required inputs are valid (weight, formula, volume, lipase, medication, strength) - good prevention against half-baked dose readouts. |
| 6 | Recognition rather than recall | 4 | All 4 secondary outputs are spelled out (no abbreviations); medication + strength + formula stay visible in their picker triggers. |
| 7 | Flexibility and efficiency of use | 3 | Searchable formula picker (17 options) is necessary; non-searchable medication (5 options) is correct. Tube-Feed entry takes more taps than Oral but the workflow is unavoidable for the clinical question. |
| 8 | Aesthetic and minimalist design | 4 | Quiet hierarchy: hero numeral 4 capsules/day dominates; 4 secondaries flow below in even spacing; warning advisory not triggered in this benign-input view. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Empty-state copy is restrained. Calculation does not surface advisories at this dose level. STOP-red carve-out exists but is not exercised here. |
| 10 | Help and documentation | 3 | Inline help is intentionally absent; AboutSheet provides depth. Subtitle is contextual. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Hero-metric template-filler: NOT detected. Hero is a real calculation, not decoration.
- Visual equality of secondaries (Pitfall 5 / Watch Item 5): the 4 tube-feed secondaries (Total fat / Total lipase / Lipase per kg / Capsules per month) all use text-title font-bold equally. Capsules per month is the prescribing artifact and is visually equal to the other 3. **Watch Item 5** explicitly notes this as a finding-priors candidate.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Range hints render with en-dash (`0-3000 mL`, `500-4000 units/g`) from shared `NumericInput.svelte:76`. Workstream Q1 ban (U+2013). | n/a (Q1 content rule) | Replace U+2013 with `-` in NumericInput. **Forced defer per D-08b.** Cross-calculator backlog. |
| 2 | **P2** | Tube-Feed mode renders 4 secondary rows (Total fat / Total lipase / Lipase per kg / Capsules per month) at visually equal weight. Per UI-SPEC Watch Item 5, the prescribing artifact (Capsules per month - what gets ordered from pharmacy) should be findable faster than the other 3 derived figures. | n/a (cross-calculator polish, not a DESIGN.md named rule) | Per Watch Item 5: a font-weight bump on Capsules per month is allowed (eyebrow color change is forbidden per Identity-Inside). 5 LOC change in PertCalculator.svelte. **fix-now P2** if accepted (PERT-route only, ≤5 LOC). |
| 3 | **P3** | Mobile InputDrawer trigger pushes hero below 50% viewport height post-input. Same observation as light-mobile-oral. | PERT-DESIGN-04 (post-input state, Phase 2 D-04 layout decision) | Defer. Shared layout pattern. |

## Persona Red Flags

A NICU dietitian determining tube-feed PERT dose for a 6.80 kg infant on 1000 mL/day Kate Farms Pediatric Standard 1.2:
- Hero "4 capsules/day" reads instantly.
- Capsules-per-month "120" is reachable in scroll but not visually distinguished from sibling rows.
- No second-guessing of which number to trust; tabular numerals + identity-purple eyebrows make the clinical numbers feel authoritative.

## Minor Observations

- The Tube-Feed mode-qualifier formatting "TUBE-FEED DOSE" uses ASCII hyphen, not en-dash, per Phase 2 D-04 explicit. Good.
- The InputDrawer expands to show Formula picker + numeric inputs without overflow at 375x667.
