# Formula Recipe Calculator — Impeccable Critique

**Target:** http://localhost:5173/formula
**Viewports:** mobile 375, desktop 1280
**Themes:** light, dark
**Captured:** 2026-04-09

Screenshots in `critique/formula-*.png` (transient — not committed).

---

## Anti-Patterns Verdict

**Not AI slop.** This is the surface that went through the v1.3 unification (fortification calculator merge), v1.4 shared-component polish, and v1.5 searchable picker. It reads as an intentional clinical tool. No gradients, no glass, no decoration. Passes.

## Overall Impression

Formula is the most visually settled surface in the app. Both themes work, both viewports read confidently, the hero `AMOUNT TO ADD → 2 Teaspoons` sits exactly where a stressed clinician wants it, and the VERIFICATION card below serves as quiet proof of work without competing for attention. Only finding worth flagging here is the shared SegmentedToggle light-mode state (same as Morphine — one fix lands on both). No P1 findings. Nothing clinically wrong. Genuine reference surface.

## What's Working

1. **Hero card `AMOUNT TO ADD → 2 Teaspoons`** is the platonic "result is the interface" example. Eyebrow, huge number, unit recedes, nothing else competes. This is what every other hero in the app should look up to.
2. **VERIFICATION card as proof-of-work footer** — three rows (`Yield | Exact | Suggested start`) with tabular numerics right-aligned. It's not a hero, it's reassurance. Subtle teal eyebrow, no visual weight competition. Exactly right.
3. **Mobile layout at 375** is spacious enough to breathe, compact enough that the hero is in thumb-reach without scrolling. The form (Formula + Starting Volume + Target Calorie + Unit) fits in one visual block above the hero.

## Heuristics Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Hero updates instantly as inputs change; VERIFICATION card confirms. |
| 2 | Match System / Real World | 4 | "Amount to add" + unit is exactly how clinicians phrase it verbally. |
| 3 | User Control and Freedom | 4 | Searchable formula picker (v1.5), clear inputs, quick unit switching. |
| 4 | Consistency and Standards | 3 | Shared SegmentedToggle inherits the light-mode "looks disabled" issue (P2, shared with Morphine). |
| 5 | Error Prevention | 4 | NumericInput range hints, packets unit auto-hidden for non-HMF formulas (v1.3). |
| 6 | Recognition Rather Than Recall | 4 | Eyebrow labels + hero + verification is self-explanatory. |
| 7 | Flexibility and Efficiency | 4 | sessionStorage, searchable picker, keyboard-friendly pickers. |
| 8 | Aesthetic and Minimalist Design | 4 | Very clean. Best surface in the app. |
| 9 | Error Recovery | 3 | Advisory messages; range hints on out-of-range inputs. |
| 10 | Help and Documentation | 3 | AboutSheet covers it. |
| **Total** | | **37/40** | **Excellent — reference surface** |

## Priority Issues

### [P2] Shared SegmentedToggle unselected state (Breast milk / Water) reads as disabled in light mode

**What:** Same issue as Morphine Wean — the `Breast milk | Water` toggle at the top of the form in **light mode** has a white active tab with crisp teal text and a gray inactive tab that reads as "disabled" rather than "unselected alternative."

**Why it matters:** Same as Morphine — clinicians need to perceive the two options as equal choices. The inactive state currently telegraphs "you can't click this" when the intent is "you could switch to this."

**Fix:** This is the **same fix** as the Morphine finding. Update `src/lib/shared/components/SegmentedToggle.svelte` light-mode inactive state so it reads as unselected, not disabled. One component change, benefits both calculators at once.

**Suggested command:** /quieter or direct token adjustment (same fix as Morphine P2)

---

### [P3] Desktop light — large horizontal whitespace on either side of content

**What:** At desktop 1280 in light mode, the content block (form + hero + verification) is constrained to about 900px wide and sits centered with a lot of empty bluish-gray on the left and right sides.

**Why it matters:** Not really a problem — clinical tools shouldn't stretch full-bleed at desktop, and the restraint reads as "calm" rather than "empty." But if there's a question about whether the content could breathe a little wider to make the hero more prominent, it's worth testing a 960 or 1024 max-width constraint.

**Fix (optional):** Try bumping the max-width of the calculator content container from its current value (~900px) to 960 or 1024 and compare. If the hero feels more grounded at the wider size, ship it. If not, leave as is — restraint is intentional.

**File:** Probably `src/routes/formula/+page.svelte` or the calculator shell container.

**Suggested command:** /arrange (optional — safe to leave as is)

---

## Minor Observations

- **Formula picker searchability** (v1.5) — not tested in this pass beyond confirming "Neocate Infant" is displayed. Was validated extensively in v1.5 and not touched since. Out of scope.
- **`Starting Volume` label** drops the unit parenthetical (just "Starting Volume") and the unit appears inside the input on the right. This was a v1.7 change. Clean.
- **VERIFICATION `Suggested start 180 (6.1 oz)`** — the parenthetical dual-unit is helpful; shows the clinician both mL and oz without cluttering the label.
- **Hero unit `Teaspoons` capitalization** — capitalized as a proper unit label. Consistent with `Packets`, `mL`, etc. Good.

## Deferred to NOTES.md

- None. Formula is the cleanest surface in the app. The P2 is shared with Morphine (one fix). P3 is optional.

---
*Critique by Claude Opus 4.6 via impeccable:critique skill — 2026-04-09*
