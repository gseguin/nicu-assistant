# NICU Assistant — Notes & Deferred Ideas

Lightweight capture of ideas that aren't ready to become requirements.

---

## 2026-04-09 — GIR Δ rate direction color coding

**Context:** v1.9 Phase 29 discussion.

**Idea:** Visually differentiate ▲ increase vs ▼ decrease on the GIR titration Δ rate hero beyond glyph + word — e.g., a warmer hue for increase, cooler for decrease.

**Potential value:** Faster bedside glance recognition of action direction; pre-attentive color processing beats reading text.

**Why deferred:**
- Requires a new OKLCH token (or two) — breaks v1.9's "no new identity hues" out-of-scope guardrail
- Direction hues must both clear WCAG 2.1 AA contrast in light + dark — axe tuning work per v1.8 Morphine Phase 20 lesson
- v1.9 safe default is identity-green for both directions; glyph + "(increase)"/"(decrease)" word carry the semantic

**Next step if promoted:** Future polish milestone after v1.9 ships; needs field feedback on whether monochrome hero is actually a bedside confusion source before adding complexity.

---

## 2026-04-09 — GIR severe-neuro card clinical action copy

**Context:** v1.9 Phase 30 critique pass. GIR-CRITIQUE.md flagged this as P1.

**Problem:** The "IF SEVERE NEURO SIGNS" bucket currently renders the same titration treatment as every other bucket — `▲ 2.8 ml/hr (increase)` with a GIR target of 7.1 mg/kg/min in the secondary row. Clinically this is misleading: "severe neurologic signs" from hypoglycemia is a crash-cart moment, and the bedside action is **D10 IV bolus push**, not "increase the drip by 2.8 ml/hr to a new target GIR."

**What we considered in Phase 30-01:**
- Option 1: Force the STOP treatment unconditionally for severe-neuro. **Rejected** — "STOP dextrose infusion" is the copy used for the hyperglycemia `GIR ≤ 0` case, and stopping the drip is the *opposite* of the correct action for severe hypoglycemia.
- Option 2: Create a new distinct "BOLUS" treatment for severe-neuro with copy like "D10 2 mL/kg IV push, continue drip at calculated rate." **Deferred** — the exact clinical copy needs clinician review (bolus dose, route, follow-up action), and the existing `deltaRateMlHr` calculation for this bucket may or may not still be the right "continue drip" value after a bolus.

**Decision:** Defer. Phase 30-01 ships without touching the severe-neuro card — it continues to render like any other bucket until Daisy confirms the correct clinical copy and action.

**What to ask Daisy:**
1. What is the exact bedside action for severe neurologic signs? (D10 bolus dose + volume + route + follow-up?)
2. Should the "continue drip at calculated rate" use the current `deltaRateMlHr` math, or should it compute a different target (e.g., a higher floor rate to prevent recurrence)?
3. Should this card be **unconditional** (always shown) or **glucose-gated** (only shown when current glucose is in a dangerous range)?
4. Any institutional protocol reference to cite in the card or the AboutSheet?

**Next step if promoted:** A small dedicated phase in v1.9 or v1.10 with clinical content approval + a new `kind: 'bolus'` branch in the `deltaHero` helper (already scaffolded in `GirCalculator.svelte`) and mirrored in `GlucoseTitrationGrid.svelte`.

**Scope guardrail:** Until this is resolved, the severe-neuro card still functions — it just doesn't communicate the urgency it should. Not a safety regression, but a known clinical-content gap.
