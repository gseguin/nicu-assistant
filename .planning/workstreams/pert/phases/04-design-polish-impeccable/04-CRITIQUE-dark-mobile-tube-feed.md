# /impeccable critique transcript: dark-mobile-tube-feed

**Context (CONTEXT D-01 row 6):** theme=dark, viewport=mobile (375x667), mode=Tube-Feed
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-26T03:48Z
**Inputs:** weight 6.80 kg, formula Kate Farms Pediatric Standard 1.2, volume 1000 mL, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDay = 4 (rendered)
**Identity color:** oklch(80% 0.10 285) (dark-theme variant)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at /tmp/04-wave1/snapshot-dark-mobile-tube-feed.png + JSON at /tmp/04-wave1/snapshot-dark-mobile-tube-feed.json. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero "4 capsules/day" clearly readable on dark surface; mode qualifier "TUBE-FEED DOSE" present. |
| 2 | Match between system and the real world | 4 | Same vocabulary; capsulesPerDay is the answer; capsulesPerMonth is the prescribing artifact. |
| 3 | User control and freedom | 4 | Mode toggle reversible; Escape closes drawer. |
| 4 | Consistency and standards | 4 | Identity-Inside Rule held in dark mode. |
| 5 | Error prevention | 3 | Same gates. |
| 6 | Recognition rather than recall | 4 | All inputs visible in InputDrawer when expanded. |
| 7 | Flexibility and efficiency of use | 3 | Tube-Feed is multi-step; pattern unavoidable. |
| 8 | Aesthetic and minimalist design | 4 | Dark mode reads intentionally; the 4 secondaries below the hero flow in even rhythm with adequate vertical breathing room. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Empty-state copy quiet; STOP-red carve-out not exercised. |
| 10 | Help and documentation | 3 | Same. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Visual equality of secondaries: same observation as light tube-feed contexts. The 4 secondaries (Total fat / Total lipase / Lipase per kg / Capsules per month) all use the same text-title font-bold treatment.
- Dark-mode-as-afterthought: NOT applicable.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Range-hint en-dashes (recurring across all 8 contexts). | n/a (Q1 content rule) | **Forced defer per D-08b** (NumericInput shared). |
| 2 | **P2** | Tube-Feed 4-secondaries visual equality (Watch Item 5; recurring across light + dark tube-feed). | n/a | Allowed: font-weight bump on Capsules per month row in PertCalculator.svelte. PERT-route only, ≤5 LOC. **fix-now P2** if accepted. |

## Persona Red Flags

A clinician dosing tube-feed PERT in dark mode at night-shift:
- Hero numeral "4 capsules/day" reads quickly even in low ambient light.
- Capsules per month "120" is reachable but visually equal to the 3 derived figures above it.
- Identity-purple holds in dark mode; chrome stays neutral; no flicker, no FOUC observed.

## Minor Observations

- Bottom nav favorites tab row (Feeds / Formula / GIR / Morphine) is at the bottom edge with safe-area-inset clearance on mobile portrait. Verified in screenshot.
- Theme transition (light->dark) was set via localStorage before initial paint per app.html FOUC-prevention inline script; no FOUC visible.
