# /impeccable critique transcript: light-mobile-oral

**Context (CONTEXT D-01 row 1):** theme=light, viewport=mobile (375x667), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-26T03:48Z
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(42% 0.12 285)

> **LLM Design Review fallback note (per orchestrator setup note #9 + RESEARCH Pitfall 1 mitigation Option A):**
> The `/impeccable critique` slash command and the Skill tool are not available in this subagent environment, and `chrome-devtools-mcp` is not configured. This transcript is a **manual Nielsen-10 critique** authored by the executing agent against the live dev-server snapshot captured via Playwright (script at /tmp/04-wave1/capture.mjs; screenshot at /tmp/04-wave1/snapshot-light-mobile-oral.png; structured JSON at /tmp/04-wave1/snapshot-light-mobile-oral.json). PRODUCT.md is in place at the repo root, so the critique is project-aware (NICU clinicians, warm-clinical brand, OKLCH, Plus Jakarta Sans, hero-owns-viewport). The format mirrors what `/impeccable critique` would emit: Design Health Score table, Anti-Patterns Verdict, Priority Issues, Persona Red Flags, Minor Observations.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero updates live; eyebrow + numeral + unit announce dose state. aria-live="polite" present. |
| 2 | Match between system and the real world | 4 | Clinical vocabulary: capsulesPerDose, units/dose, Lipase per dose. No jargon mismatch. |
| 3 | User control and freedom | 4 | InputDrawer bottom sheet on mobile; Escape closes it; SegmentedToggle Oral/Tube-Feed reversible. |
| 4 | Consistency and standards | 4 | Identity-Inside applied: identity-purple on hero eyebrow + secondary eyebrows only; chrome stays neutral. |
| 5 | Error prevention | 3 | Range hints on numeric inputs (0-200 g; 500-4000 units/g). NumericInput blur-error border inherited from shared component. Clinical advisory engine triggers STOP-red on max-lipase cap. Could surface a per-input pre-blur live hint when value approaches max-lipase boundary. |
| 6 | Recognition rather than recall | 4 | Medication and Strength pickers display selected names persistently in the trigger; no memory burden. |
| 7 | Flexibility and efficiency of use | 3 | Mobile is the primary surface; numeric inputs use inputmode="decimal" (verified). One-handed reach acceptable; the InputDrawer trigger card at top of viewport is ~150px tall and pushes the hero below the visual fold on first paint with a populated state, though the hero itself remains within scroll-free reach. |
| 8 | Aesthetic and minimalist design | 4 | Warm-clinical palette holds. Typographic hierarchy is honored (text-display hero numeral, text-title secondaries, text-2xs eyebrows). No decoration; restraint earned. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Empty-state copy is appropriately quiet (text-ui body) rather than shouty. STOP-red advisory uses border-2 + OctagonAlert + bold red text for the FDA cap (PERT-SAFE-01) - this view does not surface advisories so the gate is not exercised. Inputs do not block invalid entry; rely on calc-layer defensive zero-return. |
| 10 | Help and documentation | 3 | AboutSheet entry exists (verified in registry); no inline help links per route. Subtitle "Capsule dosing · oral & tube-feed modes" is present and informative. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE. Layout is intentional, restraint is principled, no "consumer health" decoration.
- Gradient fatigue: NONE. The hero card uses `--color-identity-hero` as a single tonal lift, not a gradient.
- Side-stripe borders, glassmorphism, hero-metric template-fillers: NONE detected.
- Identical card grids: NOT applicable (single primary card + single secondaries card).

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Range hints under NumericInput render with en-dash (`0-200 g`, `500-4000 units/g`). The shared component `src/lib/shared/components/NumericInput.svelte:76` template-literal-builds `${min}–${max}${unit}` with a literal U+2013. Workstream Q1 ban prohibits en-dashes. | n/a (workstream Q1 content rule, not a DESIGN.md named rule) | Replace U+2013 with ASCII `-` (`${min}-${max}${unit}`). **Forced defer per Watch Item 6 + D-08b: SHARED COMPONENT EDIT FORBIDDEN.** Cross-calculator backlog item. |
| 2 | **P3** | The InputDrawer trigger card on mobile (Weight 9.98 kg / Fat 25 g compact recap, ~150 px tall) sits between the page subtitle and the hero card, pushing the hero numeral down to ~y=389 in the 667-px viewport. The hero's top-edge sits at ~58% of viewport height; the result numeral fills less than 60% of viewport above-the-fold. | PERT-DESIGN-04 / ROADMAP SC-1 (hero-owns-viewport on mount, post-input mobile state) | This is a Phase 2 D-04 layout decision (recap-on-top per the InputDrawer pattern from Phase 42.1 D-08, shared across calculators). Addressing would require shared-component edit. **Defer.** |

## Persona Red Flags

A clinician on a 6 a.m. NICU shift opening this on a phone:
- Identifies the route immediately ("PERT" eyebrow, "ORAL DOSE" qualifier, dose numeral "2 capsules/dose").
- Trusts the number: tabular numerals, restraint, no marketing tone.
- Knows where to edit: tap-to-edit-inputs button is clearly the way to change values.
- No second-guessing flagged in this view.

## Minor Observations

- The middle-dot in the subtitle "Capsule dosing · oral & tube-feed modes" reads as a typographic choice. Acceptable.
- "ESTIMATED DAILY TOTAL (3 MEALS/DAY)" tertiary line is correctly text-base (smaller than text-title secondaries) per Phase 2 D-09. Good visual hierarchy.
- Top nav (NICU Assist + 4 favorite tabs) sits above the disclaimer banner; clean separation.
