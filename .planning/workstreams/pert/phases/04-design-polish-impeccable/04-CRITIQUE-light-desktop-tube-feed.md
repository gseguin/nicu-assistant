# /impeccable critique transcript: light-desktop-tube-feed

**Context (CONTEXT D-01 row 4):** theme=light, viewport=desktop (1280x800), mode=Tube-Feed
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-26T03:48Z
**Inputs:** weight 6.80 kg, formula Kate Farms Pediatric Standard 1.2, volume 1000 mL, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDay = 4 (rendered)
**Identity color:** oklch(42% 0.12 285)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at /tmp/04-wave1/snapshot-light-desktop-tube-feed.png + JSON at /tmp/04-wave1/snapshot-light-desktop-tube-feed.json. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero "4 capsules/day", mode qualifier "TUBE-FEED DOSE", live update on input change. |
| 2 | Match between system and the real world | 4 | Same clinical vocabulary as light-mobile-tube-feed. Capsules per month 120 is the clinically-relevant prescribing artifact. |
| 3 | User control and freedom | 4 | Inputs visible at right; mode toggle at top of aside; mode switch reversible. |
| 4 | Consistency and standards | 3 | Same NavShell sticky-overlay layering observation as light-desktop-oral. |
| 5 | Error prevention | 3 | Range hints + calc-layer defensive returns. Empty-state gate hides secondaries until all 6 required inputs valid. |
| 6 | Recognition rather than recall | 4 | All inputs visible in aside (Tube-Feed selected, Weight 6.8 kg, Formula Kate Farms, Volume 1000 mL, Lipase 1000 units/g, Medication Creon, Strength 12,000 units). |
| 7 | Flexibility and efficiency of use | 3 | More inputs than Oral mode (formula picker + volume); pattern is unavoidable for the clinical question. |
| 8 | Aesthetic and minimalist design | 4 | 4 secondaries flow in even rhythm; hero owns the upper-left primary region. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Empty-state copy is restrained; the calc here renders a clean result so STOP-red is not exercised. |
| 10 | Help and documentation | 3 | Same. |
| **Total** | | **35/40** | **Good** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Hero-metric template-filler: NOT detected.
- Visual equality of secondaries (Watch Item 5): same as light-mobile-tube-feed. The 4 secondaries (Total fat / Total lipase / Lipase per kg / Capsules per month) all render at text-title font-bold; the prescribing artifact is not visually distinguished.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Same NavShell sticky-overlay observation as light-desktop-oral. Top nav crosses page subtitle. | n/a (NavShell shared component) | **Forced defer per D-08b.** |
| 2 | **P2** | Range-hint en-dashes from shared NumericInput. | n/a (Q1 content rule) | **Forced defer per D-08b.** |
| 3 | **P2** | Tube-Feed 4-secondaries visual equality (Watch Item 5). The prescribing artifact (Capsules per month) deserves a visual hierarchy bump. | n/a (cross-calculator polish) | Allowed: a font-weight bump on Capsules per month row in PertCalculator.svelte. PERT-route only, ≤5 LOC. **fix-now P2** if accepted. |

## Persona Red Flags

NICU dietitian at workstation:
- Hero "4 capsules/day" reads as the operative answer.
- Capsules per month "120" is the prescribing artifact and is reachable but not visually emphasized over Total fat or Total lipase.
- The clinical workflow runs to completion: pick formula → enter volume → enter lipase → pick medication → pick strength → read hero. No interrupts.

## Minor Observations

- The hero card top edge sits very close to the disclaimer banner bottom edge; vertical rhythm could breathe a touch more at desktop.
- Capsules per month value 120 fits cleanly within the row gutter; not a width concern at 1280 px.
