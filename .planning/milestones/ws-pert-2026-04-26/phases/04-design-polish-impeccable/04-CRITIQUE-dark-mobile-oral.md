# /impeccable critique transcript: dark-mobile-oral

**Context (CONTEXT D-01 row 5):** theme=dark, viewport=mobile (375x667), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-26T03:48Z
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(80% 0.10 285) (dark-theme variant)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at /tmp/04-wave1/snapshot-dark-mobile-oral.png + JSON at /tmp/04-wave1/snapshot-dark-mobile-oral.json. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero, eyebrow, mode qualifier all readable on dark surface. aria-live polite preserved. |
| 2 | Match between system and the real world | 4 | Same clinical vocabulary. |
| 3 | User control and freedom | 4 | Same as light-mobile-oral. |
| 4 | Consistency and standards | 4 | Identity-Inside Rule held in dark mode: identity-purple (oklch(80% 0.10 285)) on hero/secondary eyebrows; chrome (top header, bottom nav, disclaimer banner) stays neutral. |
| 5 | Error prevention | 3 | Same as light. |
| 6 | Recognition rather than recall | 4 | Same. |
| 7 | Flexibility and efficiency of use | 3 | Same; mobile InputDrawer pattern. |
| 8 | Aesthetic and minimalist design | 4 | Dark mode reads "intentional" not "switched": warm-slate dark surface (`oklch(0.18 0.012 230)` body color verified), purple-tinted hero card, neutral secondaries card. Each tonal step is honored. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Same. |
| 10 | Help and documentation | 3 | Same. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Glassmorphism: NOT detected (the slight purple lift on hero is a token-driven background, not blur+transparency).
- Dark-mode "afterthought" (light tokens inverted naively): NOT applicable. The dark theme has its own intentional `--color-identity` retune (lightness up to 80%, chroma down to 0.10) per Phase 1 D-04. Verified live.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Range-hint en-dashes (same as light contexts). | n/a (Q1 content rule) | **Forced defer per D-08b.** |
| 2 | **Watch Item 1 evaluation:** the dark-theme identity-purple at oklch(80% 0.10 285) on the hero card background `--color-identity-hero` is readable and clearly identity-distinct. Phase 1 D-04 axe lock at 4.5:1 is not visually undermined; the perceived contrast issue Watch Item 1 anticipated does NOT manifest in this view. **No retune needed.** | n/a | n/a | n/a |

## Persona Red Flags

A clinician on a dim NICU with the device in dark mode:
- Identity-purple is still distinguishable from the warm-slate body and the neutral chrome - the dark-theme retune holds.
- Hero numeral "2 capsules/dose" reads cleanly against the slightly purple-tinted dark hero card.
- No second-guessing flagged.

## Minor Observations

- The theme toggle icon top-right correctly shows the sun (i.e. tap to go light) when current state is dark.
- Disclaimer banner background is darker than the surrounding body - intentional separation per DesignPolish v2.
- Dark identity-purple on the hero PERT eyebrow feels slightly less weighted than the light-mode equivalent; this is acceptable per the dark-mode retune intent (identity should be present, not loud).
