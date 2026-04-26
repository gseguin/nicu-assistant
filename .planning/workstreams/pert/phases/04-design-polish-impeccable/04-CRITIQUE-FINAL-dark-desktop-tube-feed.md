# /impeccable critique transcript: FINAL dark-desktop-tube-feed

**Context (CONTEXT D-01 row 8, Wave 3 re-run):** theme=dark, viewport=desktop (1280x800), mode=Tube-Feed
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-25T22:55Z
**Codebase HEAD:** e6f454a (post-Wave-2 with F-03 + commit 2dc7ae2)
**Inputs:** weight 6.80 kg, formula Kate Farms Pediatric Standard 1.2, volume 1000 mL, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDay = 4 (rendered)
**Identity color:** oklch(80% 0.10 285) (dark theme)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at `/tmp/04-wave3/snapshot-dark-desktop-tube-feed.png` + JSON at `/tmp/04-wave3/snapshot-dark-desktop-tube-feed.json`. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.
>
> **Wave 3 vs Wave 1 delta:** Wave 1 captured this same context at 35/40 (lower because of both the Wave 1 F-03 finding AND the Wave 1 F-02 NavShell sticky-overlay in desktop). Wave 2 shipped F-03 fix (snapshot confirms `capsulesPerMonth fontWeight = 800` while siblings at 700). F-02 carries forward to v1.16. Heuristic 4 + Heuristic 8 regain; Heuristic 7 still scores 3 because of F-02. Score: **36/40 (+1 from Wave 1)**.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Mode qualifier renders correctly. Hero updates live. |
| 2 | Match between system and the real world | 4 | Tube-feed clinical labels intact. capsulesPerMonth visually elevated for supply ordering. |
| 3 | User control and freedom | 4 | Mode toggle reversible; sticky aside accessible. |
| 4 | Consistency and standards | 4 | Three-tier weight escalation reads as principled. Identity-Inside Rule honored. |
| 5 | Error prevention | 3 | Range hints + tube-feed empty-state gate. Weight slider capped at 10 kg. |
| 6 | Recognition rather than recall | 4 | Spelled-out labels; pickers display selected names. |
| 7 | Flexibility and efficiency of use | 3 | NavShell sticky-overlay (Wave 1 F-02) carries forward in dark desktop too. |
| 8 | Aesthetic and minimalist design | 4 | Hero 4 (900) -> capsulesPerMonth 120 (800) -> 3 derived rows (700). Asymmetric escalation reads cleanly in dark mode. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | STOP-red carve-out present but not exercised. Empty-state copy quiet. |
| 10 | Help and documentation | 3 | AboutSheet entry; subtitle informative. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Visual equality of secondaries (Wave 1 F-03): RESOLVED.
- Translucent overlay (NavShell F-02): present; layering problem, not glassmorphism aesthetic.

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | NavShell sticky-header overlays page subtitle on scroll-top (Wave 1 F-02 carry-over). **Forced defer per D-08b**. | n/a | v1.16 cross-calculator polish phase. |
| 2 | **P2** | NumericInput en-dash (Wave 1 F-01 carry-over; forced-deferred per D-08b). | n/a (Q1 content rule) | v1.15.x hotfix carrier. |
| 3 | **P3** | Sticky aside fills column even when longest field is shorter (Wave 1 F-05 carry-over). | n/a | Defer. |

## Persona Red Flags

A NICU dietitian on a desktop in dark mode preparing a tube-feed monthly supply order:
- Hero "4 capsules/day" reads instantly.
- "120 capsules per month" reads at appropriate visual priority. The 3 derived rows recede as background.
- The NavShell sticky-overlay layering remains the only friction point on this view.

## Minor Observations

- Dark theme preserves the asymmetric weight escalation faithfully.
- Identity-purple eyebrows at oklch 80% 0.10 285 reach the same perceived contrast as the light-theme 42% counterpart.
- Plus Jakarta Sans variable axis renders 800 weight without artifacts at desktop DPR.
