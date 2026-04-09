# GIR Calculator — Impeccable Critique

**Target:** http://localhost:5173/gir
**Viewports:** mobile 375, desktop 1280
**Themes:** light, dark
**Captured:** 2026-04-09
**Context:** Post–Phase 29. Δ rate is now the hero on titration buckets; GIR mg/kg/min demoted to secondary row; em-dash for Δ=0; STOP treatment scaffolded for `targetGirMgKgMin ≤ 0`.

Screenshots in `critique/gir-*.png` (transient — not committed).

---

## Anti-Patterns Verdict

**Not AI slop.** Clean. No gradients, no glassmorphism, no dark-mode glow, no generic card grid, no hero metric sprinkled with emoji. Typography is Plus Jakarta Sans with tabular numerics. Identity color is scoped (dextrose green, not used as general accent). Passes the "would someone believe AI made this?" test — no.

## Overall Impression

Phase 29 shipped the titration grid hero swap. It reads correctly in isolation: Δ rate is unambiguously the biggest number on each bucket, direction glyph + parenthetical word carry the semantic, column order matches mobile semantics. **But the swap is half-landed at the page level** — the `Target GIR` summary hero card directly below the grid still leads with `5.1 mg/kg/min` as the big number, which directly contradicts the Phase 29 thesis. A clinician scanning this page sees "Δ rate is hero in the grid, then GIR is hero in the summary below it" and gets mixed signals. Biggest opportunity: finish Phase 29 by swapping the summary hero too.

**Second opportunity:** the severe-neuro card never renders its STOP treatment because the data never hits `GIR ≤ 0`. The clinical intent of that card (“severe neurologic signs → stop/bolus”) is not expressed — it just shows a titration like any other bucket. This is a correctness issue, not a polish issue.

## What's Working

1. **Titration grid Δ rate hero swap reads correctly in isolation** — the `▲ 0.9 ml/hr (increase)` shape is dominant, glyph-left, unit recedes, parenthetical is small. Mobile card layout reads naturally; desktop table puts Δ rate as the second column after Range and it's clearly the biggest text in the row.
2. **Population reference card at the bottom is well-restrained** — eyebrow + three rows + disclaimer, nothing more. Exactly the right weight for a reference footnote.
3. **Identity color (dextrose green) is correctly scoped** — appears only on the Current GIR hero, the Target GIR summary, the selected bucket row, the eyebrow labels, the nav active indicator. Nothing else. This matches the v1.5 "identity scoped to 4 surfaces" decision.

## Heuristics Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Selected bucket state propagates clearly to the summary hero — good. No loading/working states needed (pure calc). |
| 2 | Match System / Real World | 2 | Severe neuro bucket shows a titration action instead of STOP — mismatched to clinical meaning (P1). |
| 3 | User Control and Freedom | 3 | Keyboard nav works, selecting/deselecting buckets is obvious. |
| 4 | Consistency and Standards | 2 | Hero swap inconsistent: grid buckets swapped, summary below not swapped (P1). Range labels use mixed hyphen/en-dash typography (P3). |
| 5 | Error Prevention | 3 | Input ranges, advisories for out-of-range dextrose and GIR. Solid. |
| 6 | Recognition Rather Than Recall | 3 | Eyebrow labels + hero + secondary row is self-explanatory per bucket. |
| 7 | Flexibility and Efficiency | 3 | sessionStorage persists inputs; keyboard-navigable buckets. |
| 8 | Aesthetic and Minimalist Design | 2 | Two hero cards (Current GIR top, Target GIR bottom) bookend a long bucket list — feels heavy on mobile. Dark mode selected-bucket fill is too saturated (P2). |
| 9 | Error Recovery | 3 | Advisories are non-blocking and clear. |
| 10 | Help and Documentation | 3 | AboutSheet + disclaimer + eyebrow copy covers it. |
| **Total** | | **27/40** | **Solid — one P1 correctness issue, one P1 consistency issue, a couple of P2 polish items** |

## Priority Issues

### [P1] Target GIR summary hero contradicts the Phase 29 swap

**What:** The "TARGET GIR" card that appears below the bucket grid when a bucket is selected uses `5.1 mg/kg/min` as its hero number, with the rate/fluid/Δ-rate info as small secondary text below (`59 ml/kg/day · 9.7 ml/hr · ▼ 0.9 ml/hr (decrease)`).

**Why it matters:** The entire thesis of Phase 29 was that clinicians act on Δ rate, not GIR mg/kg/min. The bucket grid correctly reflects this. But immediately below, the summary card presents the same row with **GIR as the hero again** — directly contradicting the client feedback that drove v1.9 ("put the highlighted text at the top / then put the GIR where the highlighted text is"). A clinician reading top-to-bottom sees "action is big (in grid)" then "action is small and GIR is big again (in summary)."

**Fix:** Swap the Target GIR summary card hero the same way the grid was swapped. The big number becomes the Δ rate (with glyph + unit + parenthetical). GIR mg/kg/min moves into the secondary metrics line alongside ml/kg/day and ml/hr. Mirror the exact pattern from the grid cards — same `text-display font-black` + `flex items-baseline gap-2` shape, same token treatment.

**File:** `src/lib/gir/GirCalculator.svelte` — find the Target GIR card rendering and apply the same hero swap as `GlucoseTitrationGrid.svelte:128–134`.

**Suggested command:** /normalize or direct edit (this is a consistency fix, not a design exploration)

---

### [P1] Severe neurologic signs card shows a titration action, not STOP

**What:** The bucket labeled "IF SEVERE NEURO SIGNS" / "Severe neurologic signs" currently renders the same hero shape as every other bucket: `▲ 2.8 ml/hr (increase)` with GIR 7.1 mg/kg/min in the secondary row. The STOP treatment code path in `GlucoseTitrationGrid.svelte` only triggers when `targetGirMgKgMin ≤ 0`, but with valid inputs the severe-neuro bucket's calculated `targetGirMgKgMin` is 7.1 (never ≤ 0).

**Why it matters:** Clinically, "severe neurologic signs" is the crashing-baby card: the action is bolus glucose and stop/reassess the drip — NOT "increase rate by 2.8 ml/hr to reach a new GIR target." Showing a titration number here is misleading at best, dangerous at worst. Phase 29 shipped scaffolding for STOP but the trigger condition is wrong.

**Fix:** The severe-neuro bucket should render the STOP treatment **unconditionally**, regardless of whether the math produces a positive GIR target. The STOP branch should be gated on `row.bucketId === 'severe-neuro'`, not `row.targetGirMgKgMin ≤ 0`. Keep the GIR ≤ 0 branch as a defensive fallback for the general case.

**File:** `src/lib/gir/GlucoseTitrationGrid.svelte` — change the `stopInfusion` condition from `row.targetGirMgKgMin <= 0` to `row.bucketId === 'severe-neuro' || row.targetGirMgKgMin <= 0` in both mobile and desktop branches.

**Also update:** `src/lib/gir/calculations.test.ts` + parity fixtures if the severe-neuro row's `deltaRateMlHr` needs to be suppressed when the card shows STOP. Component tests in `GlucoseTitrationGrid.test.ts` need a new assertion: severe-neuro card always shows STOP treatment.

**Suggested command:** direct edit (correctness fix, not design)

---

### [P2] Dark mode selected-bucket fill is too saturated

**What:** In dark mode, the selected bucket row (mobile card and desktop table row) fills with a vivid, nearly full-opacity dextrose green. In light mode the same state uses a soft tint that reads calm and intentional; dark mode looks like an aggressive highlight by comparison.

**Why it matters:** Violates "warm restraint" and "dark and light must both feel intentional" from `.impeccable.md`. Dark mode feels louder than it needs to — an anxiety spike on the card that should feel calmly confirmed.

**Fix:** Soften the `--color-identity-hero` token's dark-mode value. Specifically target the L (lightness) and C (chroma) values: current is likely something like `oklch(25% 0.09 145)` or similar; aim for `oklch(22% 0.05 145)` range — still clearly identity-tinted, but restrained. Verify axe contrast after the bump (4.5:1 for the secondary word text on that background). This is **existing-token refinement**, not a new token, and it aligns with CONTEXT.md Decision 6 fallback policy.

**File:** `src/app.css` — `.dark` scope, `--color-identity-hero` token for the GIR identity.

**Suggested command:** /quieter

---

### [P2] Two hero cards bookending the bucket list = too much weight on mobile

**What:** On mobile, the page flow is: title → inputs → **Current GIR hero card** → "If current glucose is…" intro → six bucket cards → **Target GIR summary hero card** → population reference. That's two large identity-green hero cards plus six identity-eyebrow bucket cards in a single scroll column.

**Why it matters:** Violates "the result is the interface" (there are three competing results). Violates "earn trust through restraint." A clinician's eye is pulled to the first big green card, then scrolls past six cards, then hits another big green card — it feels repetitive rather than confident.

**Fix:** Two options, either acceptable:
- **Option A (minimal):** Collapse the bottom Target GIR summary into a sticky subtitle-style footer when a bucket is selected, rather than a full hero card. Same info, smaller shape. Preserves the click → feedback loop without the visual weight.
- **Option B (stronger):** Delete the bottom Target GIR summary entirely — the selected bucket row is already visually marked, and the grid itself is the feedback. The card is redundant.

Option B is cleaner but may lose the "confirmed selection" affordance for screen readers; option A preserves it. Prefer B if the aria-live announcement on selection already covers the feedback, otherwise A.

**File:** `src/lib/gir/GirCalculator.svelte`

**Suggested command:** /distill

---

### [P3] Range label typography inconsistency: hyphen vs en-dash

**What:** The bucket range labels mix hyphens and en-dashes across the grid:
- Desktop: `<40 mg/dL`, `40-50 mg/dL` (hyphen), `50–60 mg/dL` (en-dash), `60-70 mg/dL` (hyphen), `>70 mg/dL`
- Mobile cards: `IF GLUCOSE 40-50 MG/DL` (hyphen in all-caps eyebrow)

**Why it matters:** Typographic consistency is a clinical-trust signal. Mixing dashes within one column reads as carelessness. Proper typography uses en-dash for numeric ranges.

**Fix:** Normalize all numeric range labels to en-dash (`–`, U+2013) in the config JSON. One-character swap in `src/lib/gir/gir-config.json`. No code logic change.

**Suggested command:** /normalize

---

## Minor Observations

- **"Institutional titration helper — verify against your protocol before acting."** is well-placed between the grid header and the rows. Good placement, good tone. Keep.
- **"If current glucose is…" intro** uses an ellipsis character — correct. Good detail.
- **Eyebrow color** on mobile cards is a slightly lighter identity-green than I'd expect — crosses light mode OK but in dark mode the eyebrow-to-background contrast feels thin. Likely fine for axe (large text 3:1 floor) but worth an eye during the fix loop.
- **Current GIR hero** has "mg/kg/min" unit in light tertiary — correct, matches the v1.8 pattern. Good.

## Deferred to NOTES.md

- None. All findings here are either fixable in this phase (P1, P2) or cheap P3 (range dashes).

---
*Critique by Claude Opus 4.6 via impeccable:critique skill — 2026-04-09*
