# /impeccable critique transcript: dark-desktop-oral

**Context (CONTEXT D-01 row 7):** theme=dark, viewport=desktop (1280x800), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-26T03:48Z
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(80% 0.10 285) (dark-theme variant)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at /tmp/04-wave1/snapshot-dark-desktop-oral.png + JSON at /tmp/04-wave1/snapshot-dark-desktop-oral.json. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero "2 capsules/dose" reads cleanly; sticky aside displays current input state. |
| 2 | Match between system and the real world | 4 | Same vocabulary. |
| 3 | User control and freedom | 4 | Same. |
| 4 | Consistency and standards | 3 | NavShell sticky-overlay layering observation persists in dark mode (top nav row crosses the page subtitle). Same finding as light-desktop-oral; cross-calculator. |
| 5 | Error prevention | 3 | Same. |
| 6 | Recognition rather than recall | 4 | All inputs visible at right; no recall burden. |
| 7 | Flexibility and efficiency of use | 4 | Sticky aside + primary column = workstation-ergonomic. |
| 8 | Aesthetic and minimalist design | 4 | Dark + desktop reads intentionally; warm-slate body, subtle purple-tint hero card, neutral secondaries card. Tonal-Depth honored without shadows. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Same. |
| 10 | Help and documentation | 3 | Same. |
| **Total** | | **35/40** | **Good** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Glassmorphism: NOT detected.
- Sticky-header overlap is a layering finding, not an anti-pattern (the issue is z-index ordering, not visual decoration).

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | NavShell sticky-overlay z-index issue (recurring across light + dark desktop). | n/a (NavShell shared) | **Forced defer per D-08b.** Cross-calculator backlog. |
| 2 | **P2** | Range-hint en-dashes (NumericInput shared). | n/a (Q1 content rule) | **Forced defer per D-08b.** |

## Persona Red Flags

A clinician at a workstation in dark mode (e.g. NICU station with dim ambient light):
- Hero numeral "2 capsules/dose" reads quickly; identity-purple PERT eyebrow is visible without being loud.
- The sticky-aside inputs hold the workflow in place.
- Top-nav layering issue is mild; doesn't block the calculation.

## Minor Observations

- The "Pediatric EPI PERT Calculator" h1 + subtitle "Capsule dosing · oral & tube-feed modes" is partially occluded by the NavShell row at scroll-top. This was visible in the light-desktop-oral capture too; the issue is theme-agnostic.
- The slider `<input type="range">` for Weight kg renders with a track + thumb in the dark-theme styling; thumb position correctly reflects 9.98 within 0.3-80 range.
