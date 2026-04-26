# /impeccable critique transcript: light-desktop-oral

**Context (CONTEXT D-01 row 3):** theme=light, viewport=desktop (1280x800), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-26T03:48Z
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(42% 0.12 285)

> **LLM Design Review fallback note (per orchestrator setup note #9):** Manual Nielsen-10 critique authored against Playwright snapshot at /tmp/04-wave1/snapshot-light-desktop-oral.png + JSON at /tmp/04-wave1/snapshot-light-desktop-oral.json. PRODUCT.md was loaded; project-aware critique. Format mirrors `/impeccable critique` v3.0.1 emit.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Sticky aside on desktop keeps inputs visible alongside the hero; eyebrow + numeral updates as inputs change. |
| 2 | Match between system and the real world | 4 | Same clinical vocabulary; identity-purple on PERT-specific labels distinguishes domain from chrome. |
| 3 | User control and freedom | 4 | Sticky aside means input edits do not require navigation; SegmentedToggle inside the aside card stays accessible. |
| 4 | Consistency and standards | 3 | The top nav header (NICU Assist + favorite tabs row + theme toggle) appears as a translucent overlay above the hero card; in the captured frame the nav row visually crosses the page subtitle "Capsule dosing · oral & tube-feed modes" near the top. This may be a sticky-header z-index layering effect that is more visible at desktop than at mobile. Worth investigating in Wave 2. |
| 5 | Error prevention | 3 | Same range-hint pattern; same calc-layer defensive returns. |
| 6 | Recognition rather than recall | 4 | All current state visible: Oral tab selected, Weight 9.98 kg with slider, Fat 25 g, Lipase 1000 units/g, Medication Creon, Strength 12,000 units. No recall burden. |
| 7 | Flexibility and efficiency of use | 4 | Desktop sticky aside is the right pattern for a clinician at a workstation: result and inputs both stable on screen. |
| 8 | Aesthetic and minimalist design | 4 | Hero card occupies upper-left primary region; secondaries below; sticky aside on the right. Restraint holds across the wider viewport. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Same as mobile-oral. |
| 10 | Help and documentation | 3 | Same. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE.
- Gradient fatigue: NONE.
- Side-stripe borders: NOT detected.
- Hero-metric template-filler: NOT applicable.
- Header/nav layering: see Priority Issue 1 (top-nav overlap with subtitle).

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Top nav (NavShell sticky header) renders as a translucent overlay that visually crosses the page subtitle "Capsule dosing · oral & tube-feed modes" at desktop viewport. The subtitle is partially occluded by the nav row at scroll-top. | n/a (NavShell layering / sticky-header offset) | NavShell is a SHARED component (`src/lib/shell/NavShell.svelte`). D-08b explicitly forbids edits. **Forced defer** per Watch Item 6 + D-08b. Cross-calculator backlog. (Note: this is a cross-calculator finding; same overlay would happen on Feeds, Formula, GIR, etc. at desktop.) |
| 2 | **P2** | Range-hint en-dashes (same as mobile contexts). | n/a (Q1 content rule) | Forced defer per D-08b (NumericInput shared). |
| 3 | **P3** | Sticky aside is wider than the inputs themselves on a 1280-px viewport (the aside fills its column even when the longest field is shorter). Could tighten the aside max-width to reduce visual weight. | PERT-DESIGN-04 (hero-owns-viewport, secondary concern) | Layout in `+page.svelte` (allowed-with-restriction per D-08a). **Defer** for Wave 2 (>5 LOC layout work; not a P1). |

## Persona Red Flags

A clinician at a workstation:
- Two-pane layout (hero+secondaries left, inputs right) matches expectation.
- Inputs are stable; updating fat or lipase shows result update inline (Watch Item 4 hero-owns-viewport for desktop is met by primary column placement).
- Top-nav layering issue could feel a touch unpolished but does not block the calculation.

## Minor Observations

- Identity-purple on PERT eyebrow + secondaries reads slightly stronger at desktop because of the larger surface. Still WCAG AA per Phase 1 D-04 axe lock.
- The Oral/Tube-Feed segmented toggle inside the aside card uses identity-purple text on the active pill - consistent with the Identity-Inside Rule (active pill = inside, track = chrome).
