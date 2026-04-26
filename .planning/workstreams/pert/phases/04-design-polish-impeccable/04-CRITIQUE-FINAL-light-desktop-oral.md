# /impeccable critique transcript: FINAL light-desktop-oral

**Context (CONTEXT D-01 row 3, Wave 3 re-run):** theme=light, viewport=desktop (1280x800), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-25T22:55Z
**Codebase HEAD:** e6f454a (post-Wave-2 with F-03 + commit 2dc7ae2)
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(42% 0.12 285)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at `/tmp/04-wave3/snapshot-light-desktop-oral.png` + JSON at `/tmp/04-wave3/snapshot-light-desktop-oral.json`. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.
>
> **Wave 3 vs Wave 1 delta:** Wave 1 captured this same context at 36/40. F-03 fix targets Tube-Feed only; Oral hero unaffected. NavShell sticky-overlay finding (Wave 1 F-02) carries forward to v1.16. Score: **36/40 (parity with Wave 1)**.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero updates live; sticky aside exposes inputs persistently. SegmentedToggle reflects active mode. |
| 2 | Match between system and the real world | 4 | Clinical vocabulary intact. Oral mode renders capsulesPerDose, total lipase needed, lipase per dose, plus the "Estimated daily total (3 meals/day)" tertiary. |
| 3 | User control and freedom | 4 | Sticky aside on desktop keeps inputs reachable without nav round-trip. Mode toggle reversible. |
| 4 | Consistency and standards | 4 | Identity-Inside applied. Same eyebrow + numeral pattern as the Feeds and GIR calculators. F-03 fix preserved Oral patterns (Tube-Feed-only edit). |
| 5 | Error prevention | 3 | Range hints + blur-error border. Weight slider correctly capped at 10 kg per commit 2dc7ae2 (cross-calculator alignment). |
| 6 | Recognition rather than recall | 4 | Pickers display selected names persistently. |
| 7 | Flexibility and efficiency of use | 4 | Desktop sticky-aside path is fastest at this viewport; no drawer interaction required. |
| 8 | Aesthetic and minimalist design | 4 | Quiet hierarchy. text-display hero numeral fontWeight 900 dominates; secondaries fontWeight 700. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Empty-state copy quiet. STOP-red carve-out exists but not exercised in this benign view. |
| 10 | Help and documentation | 3 | AboutSheet entry; no inline help. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Side-stripe borders, glassmorphism, hero-metric template-fillers: NONE detected.
- Identical card grids: NOT applicable.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | NavShell sticky-header row renders as translucent overlay across page subtitle on scroll-top (Wave 1 F-02 carry-over). Theme-agnostic, calculator-agnostic. **Forced defer per D-08b** (cross-calculator backlog; v1.16 polish phase). | n/a | ~5-15 LOC investigation in src/lib/shell/NavShell.svelte. |
| 2 | **P2** | NumericInput en-dash (Wave 1 F-01 carry-over; forced-deferred per D-08b). | n/a (Q1 content rule) | Replace U+2013 with ASCII hyphen in shared NumericInput. |
| 3 | **P3** | Sticky aside fills column even when longest field is shorter (Wave 1 F-05 carry-over). | n/a | >5 LOC layout work in +page.svelte. Defer. |

## Persona Red Flags

A NICU GI physician on a desktop reviewing PERT dose:
- Hero "2 capsules/dose" reads instantly.
- Sticky aside keeps inputs in reach for follow-up "what if" exploration.
- Tertiary "ESTIMATED DAILY TOTAL (3 MEALS/DAY)" appropriately flagged as estimate.

## Minor Observations

- Desktop layout uses `md:grid-cols-[minmax(0,1fr)_22rem]` for the body + aside split. Aside width 22rem reads slightly wide for the 6 input controls but does not violate the design contract.
- Hero card + secondaries card share the same primary column; consistent visual rhythm.
