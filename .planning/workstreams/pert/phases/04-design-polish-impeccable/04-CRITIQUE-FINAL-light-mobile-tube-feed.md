# /impeccable critique transcript: FINAL light-mobile-tube-feed

**Context (CONTEXT D-01 row 2, Wave 3 re-run):** theme=light, viewport=mobile (375x667), mode=Tube-Feed
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-25T22:55Z
**Codebase HEAD:** e6f454a (post-Wave-2 with F-03 + commit 2dc7ae2)
**Inputs:** weight 6.80 kg, formula Kate Farms Pediatric Standard 1.2, volume 1000 mL, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDay = 4 (rendered)
**Identity color:** oklch(42% 0.12 285)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at `/tmp/04-wave3/snapshot-light-mobile-tube-feed.png` + JSON at `/tmp/04-wave3/snapshot-light-mobile-tube-feed.json`. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.
>
> **Wave 3 vs Wave 1 delta:** Wave 1 captured this same context at 36/40 with explicit P2 finding (F-03) on Tube-Feed 4-secondaries equal weight. Wave 2 shipped F-03 fix (Capsules-per-month numeral font-bold -> font-extrabold per UI-SPEC Watch Item 5 disposition). Snapshot confirms `capsulesPerMonth fontWeight = 800` while sibling rows (Total fat / Total lipase / Lipase per kg) remain at fontWeight 700. The hierarchy bump is now visually present. Heuristic 4 (Consistency and standards) regains its full 4/4 because the hierarchy now matches clinical-priority semantics. Score: **37/40 (+1 from Wave 1)**.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Mode qualifier "TUBE-FEED DOSE" reads correctly. Hero updates live. SegmentedToggle reflects current mode in InputDrawer + body. |
| 2 | Match between system and the real world | 4 | "Total fat", "Total lipase needed", "Lipase per kg", "Capsules per month" - clinical-correct vocabulary. capsulesPerDay is the prescribing artifact for daily ordering; capsulesPerMonth is the supply-projection artifact (now visually elevated per F-03 fix). |
| 3 | User control and freedom | 4 | Mode toggle reversible; Formula picker searchable (combobox); Escape closes drawer. Phase 3.1 click-persist holds across all 3 SelectPickers. |
| 4 | Consistency and standards | 4 | All 4 secondary rows follow eyebrow-above-numeral convention. Identity-Inside Rule held: identity-purple on eyebrows, neutral chrome. F-03 fix introduces principled asymmetry (capsulesPerMonth font-extrabold for prescribing-priority, sibling derived rows font-bold) without violating eyebrow-color reservation. |
| 5 | Error prevention | 3 | Range hints present. Defensive zero-return on bad inputs. The Tube-Feed empty-state gate hides secondaries until ALL required inputs are valid. Weight slider now correctly capped at 10 kg per commit 2dc7ae2. |
| 6 | Recognition rather than recall | 4 | All 4 secondary outputs spelled out (no abbreviations); medication + strength + formula stay visible in their picker triggers. |
| 7 | Flexibility and efficiency of use | 3 | Searchable formula picker (17 options) is necessary; non-searchable medication (5 options) correct. Tube-Feed entry takes more taps than Oral but workflow is unavoidable. |
| 8 | Aesthetic and minimalist design | 4 | Quiet hierarchy: hero numeral 4 capsules/day (fontWeight 900) dominates; capsules-per-month 120 (fontWeight 800) reads as the supply-projection artifact; 3 derived rows (fontWeight 700) flow below. Asymmetric bold escalation matches semantic priority cleanly. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Empty-state copy is restrained. Calculation does not surface advisories at this dose level. STOP-red carve-out exists but not exercised here. |
| 10 | Help and documentation | 3 | Inline help is intentionally absent; AboutSheet provides depth. Subtitle is contextual. |
| **Total** | | **37/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Hero-metric template-filler: NOT detected. Hero is a real calculation.
- Visual equality of secondaries (Wave 1 Watch Item 5): RESOLVED. Wave 2 F-03 fix elevates capsulesPerMonth to font-extrabold while siblings remain font-bold. The asymmetric bold step is a clear typographic-weight escalation honoring Identity-Inside (eyebrow color unchanged).

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Range hints render with en-dash from shared NumericInput (Wave 1 F-01 carry-over; forced-deferred per D-08b). | n/a (Q1 content rule) | Replace U+2013 with ASCII hyphen in shared NumericInput. v1.15.x hotfix carrier recommended. |
| 2 | **P3** | Mobile InputDrawer trigger pushes hero below 50% viewport height post-input. Same observation as light-mobile-oral. | PERT-DESIGN-04 (post-input mobile state) | Defer. Shared layout pattern. |

## Persona Red Flags

A NICU dietitian determining tube-feed PERT dose for a 6.80 kg infant on 1000 mL/day Kate Farms Pediatric Standard 1.2:
- Hero "4 capsules/day" reads instantly.
- Capsules-per-month "120" is now visually distinct from sibling rows (font-extrabold; the F-03 fix landed). Supply-planning artifact reaches the eye faster.
- No second-guessing of which number to trust.

## Minor Observations

- Mode-qualifier formatting "TUBE-FEED DOSE" uses ASCII hyphen, not en-dash, per Phase 2 D-04 explicit. Good.
- The InputDrawer expands to show Formula picker + numeric inputs without overflow at 375x667.
- The font-extrabold step on capsulesPerMonth is supported by the Plus Jakarta Sans variable axis; no fallback subtitle weight wobble.
