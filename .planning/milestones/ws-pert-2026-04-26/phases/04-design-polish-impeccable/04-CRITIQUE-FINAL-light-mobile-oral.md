# /impeccable critique transcript: FINAL light-mobile-oral

**Context (CONTEXT D-01 row 1, Wave 3 re-run):** theme=light, viewport=mobile (375x667), mode=Oral
**URL:** http://localhost:5173/pert
**Captured:** 2026-04-25T22:55Z
**Codebase HEAD:** e6f454a (post-Wave-2 with F-03 + commit 2dc7ae2 weight-slider align)
**Inputs:** weight 9.98 kg, fat 25 g, lipase 1000 units/g, Creon 12,000 units
**Hero result:** capsulesPerDose = 2 (rendered)
**Identity color:** oklch(42% 0.12 285)

> **LLM Design Review fallback note (per orchestrator setup note #9 + RESEARCH Pitfall 1 mitigation Option A):**
> The `/impeccable critique` slash command and the Skill tool are not available in this subagent environment, and `chrome-devtools-mcp` is not configured. This transcript is a **manual Nielsen-10 critique** authored by the executing agent against the live dev-server snapshot captured via Playwright (script at `/mnt/data/src/gsd-workspaces/pert/nicu-assistant/__capture.mjs`; screenshot at `/tmp/04-wave3/snapshot-light-mobile-oral.png`; structured JSON at `/tmp/04-wave3/snapshot-light-mobile-oral.json`). PRODUCT.md is in place at the repo root, so the critique is project-aware (NICU clinicians, warm-clinical brand, OKLCH, Plus Jakarta Sans, hero-owns-viewport). The format mirrors what `/impeccable critique` would emit: Design Health Score table, Anti-Patterns Verdict, Priority Issues, Persona Red Flags, Minor Observations.
>
> **Wave 3 vs Wave 1 delta:** Wave 1 captured this same context at 36/40. Wave 2 shipped F-03 (Tube-Feed Capsules-per-month font-extrabold bump) and out-of-band commit 2dc7ae2 (weight slider max alignment 80 kg -> 10 kg). Neither change alters the Oral mode hero or secondaries on this view; the Wave 3 score is therefore expected to match Wave 1 unless re-evaluation surfaces something the Wave 1 critique missed.

## Design Health Score (Nielsen 10 heuristics, 0-4 each, /40)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 4 | Hero updates live; eyebrow + numeral + unit announce dose state. aria-live="polite" present. SegmentedToggle reflects active mode (Oral). |
| 2 | Match between system and the real world | 4 | Clinical vocabulary preserved: capsulesPerDose, units/dose, Lipase per dose. No jargon mismatch. |
| 3 | User control and freedom | 4 | InputDrawer bottom sheet on mobile; Escape closes it; SegmentedToggle Oral/Tube-Feed reversible without state loss. |
| 4 | Consistency and standards | 4 | Identity-Inside applied: identity-purple on hero eyebrow + secondary eyebrows only; chrome stays neutral. F-03 fix did not regress Oral hierarchy (Tube-Feed only). |
| 5 | Error prevention | 3 | Range hints on numeric inputs; weight slider now correctly capped at 10 kg (commit 2dc7ae2 cross-calculator alignment). NumericInput blur-error border inherited from shared component. Clinical advisory engine triggers STOP-red on max-lipase cap. Could surface a per-input pre-blur live hint when value approaches max-lipase boundary. |
| 6 | Recognition rather than recall | 4 | Medication and Strength pickers display selected names persistently in the trigger; no memory burden. Phase 3.1 click-persist holds. |
| 7 | Flexibility and efficiency of use | 3 | Mobile is the primary surface; numeric inputs use inputmode="decimal" (verified). One-handed reach acceptable; the InputDrawer trigger card at top of viewport is ~150px tall and pushes the hero below the visual fold on first paint with a populated state, though the hero itself remains within scroll-free reach. F-04 P3 deferred per D-03. |
| 8 | Aesthetic and minimalist design | 4 | Warm-clinical palette holds. Typographic hierarchy honored (text-display hero numeral fontWeight 900, text-title secondaries font-bold/700, text-2xs eyebrows). No decoration; restraint earned. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Empty-state copy is appropriately quiet (text-ui body) rather than shouty. STOP-red advisory uses border-2 + OctagonAlert + bold red text for the FDA cap (PERT-SAFE-01); not exercised in this benign view. Inputs do not block invalid entry; rely on calc-layer defensive zero-return. |
| 10 | Help and documentation | 3 | AboutSheet entry exists (verified in registry); no inline help links per route. Subtitle "Capsule dosing oral & tube-feed modes" present and informative. |
| **Total** | | **36/40** | **Excellent** |

## Anti-Patterns Verdict

- AI slop: NONE. Layout is intentional, restraint is principled, no consumer-health decoration.
- Gradient fatigue: NONE. The hero card uses --color-identity-hero as a single tonal lift, not a gradient.
- Side-stripe borders, glassmorphism, hero-metric template-fillers: NONE detected.
- Identical card grids: NOT applicable (single primary card + single secondaries card).

## Priority Issues

| # | Severity | Issue | DESIGN.md rule | Suggested fix |
|---|----------|-------|----------------|---------------|
| 1 | **P2** | Range hints under NumericInput render with en-dash from shared component (Wave 1 F-01 carry-over). Workstream Q1 ban prohibits en-dash. **Forced defer per D-08b** (cross-calculator backlog). | n/a (Q1 content rule, not DESIGN.md named rule) | Replace U+2013 with ASCII hyphen at `src/lib/shared/components/NumericInput.svelte:76`. v1.15.x hotfix carrier recommended. |
| 2 | **P3** | Mobile InputDrawer trigger card sits between page subtitle and hero card; with Weight + Fat + Lipase populated the trigger is ~150px tall, pushing hero numeral toward viewport mid (Wave 1 F-04 carry-over). | PERT-DESIGN-04 (post-input mobile state) | Phase 2 D-04 layout decision; addressing requires shared-component edit. **Defer.** |

## Persona Red Flags

A clinician on a 6 a.m. NICU shift opening this on a phone:
- Identifies the route immediately ("PERT" eyebrow, "ORAL DOSE" qualifier, dose numeral "2 capsules/dose").
- Trusts the number: tabular numerals (5 .num spans on this view), restraint, no marketing tone.
- Knows where to edit: tap-to-edit-inputs button is clearly the way to change values.
- No second-guessing flagged.

## Minor Observations

- The middle-dot in the subtitle "Capsule dosing oral & tube-feed modes" reads as a typographic choice. Acceptable.
- "ESTIMATED DAILY TOTAL (3 MEALS/DAY)" tertiary line is correctly text-base (smaller than text-title secondaries) per Phase 2 D-09. Good visual hierarchy.
- Top nav (NICU Assist + 4 favorite tabs) sits above the disclaimer banner; clean separation.
- Weight slider max value rendered at 10 kg per commit 2dc7ae2 (cross-calculator alignment). No regression on Oral hero.
