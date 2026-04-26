# /impeccable critique transcript: FINAL dark-mobile-oral

**Context (CONTEXT D-01 row 5, Wave 3 re-run):** theme=dark, viewport=mobile (375x667), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-25T22:55Z
**Codebase HEAD:** e6f454a (post-Wave-2 with F-03 + commit 2dc7ae2)
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(80% 0.10 285) (dark theme)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at `/tmp/04-wave3/snapshot-dark-mobile-oral.png` + JSON at `/tmp/04-wave3/snapshot-dark-mobile-oral.json`. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.
>
> **Wave 3 vs Wave 1 delta:** Wave 1 captured this same context at 36/40. F-03 fix targets Tube-Feed only; Oral hero unaffected. Score: **36/40 (parity with Wave 1)**.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero updates live; dark-theme identity-purple lifts the hero numeral cleanly off the dark surface. |
| 2 | Match between system and the real world | 4 | Clinical vocabulary preserved across themes. |
| 3 | User control and freedom | 4 | InputDrawer + SegmentedToggle as in light mode. |
| 4 | Consistency and standards | 4 | Identity-Inside applied. Eyebrows in identity-purple (oklch 80% 0.10 285) sit cleanly against the dark surface. |
| 5 | Error prevention | 3 | Range hints inherit. Weight slider correctly capped at 10 kg per commit 2dc7ae2. |
| 6 | Recognition rather than recall | 4 | Pickers display selected names persistently. |
| 7 | Flexibility and efficiency of use | 3 | Same mobile drawer pattern. F-04 P3 carry-over (drawer recap pushes hero post-input). |
| 8 | Aesthetic and minimalist design | 4 | Dark mode preserves typographic hierarchy. text-display 900 hero numeral renders crisp against the dark surface. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | STOP-red carve-out exists but not exercised. Empty-state copy is restrained. |
| 10 | Help and documentation | 3 | AboutSheet entry exists. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Side-stripe borders, glassmorphism: NONE detected (the dark-mode hero card relies on tonal lift, not glassmorphism).
- Identical card grids: NOT applicable.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | NumericInput en-dash (Wave 1 F-01 carry-over; forced-deferred per D-08b). | n/a (Q1 content rule) | v1.15.x hotfix carrier. |
| 2 | **P3** | Mobile InputDrawer trigger pushes hero below ideal viewport position post-input (Wave 1 F-04 carry-over). | PERT-DESIGN-04 | Defer. Shared layout pattern. |

## Persona Red Flags

A NICU clinician on a phone in low-light conditions (charting at the bedside in a dimmed unit):
- Dark theme reduces eye strain. Identity-purple eyebrows remain readable without competing with the white hero numeral.
- Hero "2 capsules/dose" reads instantly.
- The hero card border remains subtly visible against the dark surface (no border-loss in dark mode).

## Minor Observations

- Dark theme pre-applied via inline FOUC script in `app.html`; no flash on first paint.
- The identity-purple in dark mode is intentionally lighter (80% lightness vs 42% in light) per Phase 1 D-04. Reads at the same perceived contrast.
- Tabular numerals (`.num`) preserved in dark mode via `font-variant-numeric: tabular-nums`.
