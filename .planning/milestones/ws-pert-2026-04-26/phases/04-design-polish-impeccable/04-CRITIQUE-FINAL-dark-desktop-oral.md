# /impeccable critique transcript: FINAL dark-desktop-oral

**Context (CONTEXT D-01 row 7, Wave 3 re-run):** theme=dark, viewport=desktop (1280x800), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-25T22:55Z
**Codebase HEAD:** e6f454a (post-Wave-2 with F-03 + commit 2dc7ae2)
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(80% 0.10 285) (dark theme)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at `/tmp/04-wave3/snapshot-dark-desktop-oral.png` + JSON at `/tmp/04-wave3/snapshot-dark-desktop-oral.json`. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.
>
> **Wave 3 vs Wave 1 delta:** Wave 1 captured this same context at 35/40 (the lower of the two desktop-oral contexts). F-03 fix targets Tube-Feed only; Oral hero unaffected. NavShell sticky-overlay finding (Wave 1 F-02) carries forward to v1.16. Score: **35/40 (parity with Wave 1)**.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero updates live; sticky aside exposes inputs persistently. |
| 2 | Match between system and the real world | 4 | Clinical vocabulary intact. |
| 3 | User control and freedom | 4 | Sticky aside reduces drawer-toggle overhead. |
| 4 | Consistency and standards | 4 | Identity-Inside applied. Eyebrows in identity-purple at oklch 80% 0.10 285. |
| 5 | Error prevention | 3 | Range hints + blur-error border. Weight slider capped at 10 kg. |
| 6 | Recognition rather than recall | 4 | Pickers display selected names. |
| 7 | Flexibility and efficiency of use | 3 | NavShell sticky-overlay (Wave 1 F-02) crosses the page subtitle on scroll-top in dark mode too. Same translucency / z-index issue as in light. |
| 8 | Aesthetic and minimalist design | 4 | text-display 900 hero numeral renders crisp. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | STOP-red carve-out exists but not exercised in this benign view. |
| 10 | Help and documentation | 3 | AboutSheet entry. |
| **Total** | | **35/40** | **Good** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Translucent overlay (NavShell): present (this is the F-02 finding being scored at H7). NOT a glassmorphism aesthetic; it is a layering problem.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | NavShell sticky-header overlays page subtitle on scroll-top (Wave 1 F-02; theme-agnostic, calculator-agnostic). **Forced defer per D-08b**. | n/a | v1.16 cross-calculator polish phase. |
| 2 | **P2** | NumericInput en-dash (Wave 1 F-01 carry-over; forced-deferred per D-08b). | n/a (Q1 content rule) | v1.15.x hotfix carrier. |
| 3 | **P3** | Sticky aside fills column even when longest field is shorter (Wave 1 F-05 carry-over). | n/a | Defer. |

## Persona Red Flags

A NICU GI physician on a desktop in dark mode reviewing PERT dose:
- Hero "2 capsules/dose" reads instantly.
- The NavShell sticky-overlay translucency on scroll-top is a subtle distraction; the brain registers a layering anomaly even though the underlying numerical data remains correct.
- Tertiary "ESTIMATED DAILY TOTAL (3 MEALS/DAY)" reads in a clearly subordinate type-style.

## Minor Observations

- Dark theme preserves identity-purple legibility on eyebrows.
- The aside width (22rem) reads slightly wide vs. its content; not a release blocker.
- Tabular numerals preserved.
