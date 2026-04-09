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
