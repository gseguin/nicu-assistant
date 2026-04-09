# Morphine Wean Calculator — Impeccable Critique

**Target:** http://localhost:5173/morphine-wean
**Viewports:** mobile 375, desktop 1280
**Themes:** light, dark
**Modes captured:** Linear + Compounding
**Captured:** 2026-04-09

Screenshots in `critique/morphine-*.png` (transient — not committed).

---

## Anti-Patterns Verdict

**Not AI slop.** This is the most typographically mature surface in the app — the one that went through v1.4 (.impeccable.md establishment), v1.5 (tab identity scoping), and v1.6 (SegmentedToggle extraction). It shows. Clean type hierarchy, restrained color, tabular numerics, no decoration. Passes.

## Overall Impression

Morphine Wean is in near-final shape. Both modes (Linear, Compounding) work cleanly, both themes feel intentional, and the hierarchy (summary card → step cards) reads correctly at a glance. Findings here are small — mostly dark-mode contrast tuning and one segmented-toggle state clarity issue in light mode. No correctness issues. No P1 findings.

**Biggest opportunity:** the segmented toggle's unselected state in **light mode** reads as "disabled" rather than "unselected alternative" because the gray fill is too close to neutral background with low text contrast. That's a 5-minute token fix.

## What's Working

1. **Summary card does a lot with very little** — three columns (Start | Step 10 | Total reduction), tiny arrow between the first two, identity-blue tint on the background, tabular numerics keep everything aligned. This is the best compact summary in the app.
2. **Step cards' secondary delta (`-0.0124 mg (10.0%)` top-right)** is correctly placed and correctly de-emphasized. Eye goes to the big dose number, not the delta — which is right because the dose is the action, the delta is confirmation.
3. **Identity color scoping is textbook** — Clinical Blue 220 appears only on: summary card fill, segmented toggle active indicator, step eyebrow labels, tab active underline, nav icon. Zero decoration leak.

## Heuristics Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Segment switch + dose updates are instant and visible. |
| 2 | Match System / Real World | 4 | Linear vs Compounding labels match clinical language; `-X.XXXX mg (Y%)` delta reads naturally. |
| 3 | User Control and Freedom | 4 | Clear inputs link at bottom; segmented toggle keyboard-nav compliant (v1.6 SegmentedToggle). |
| 4 | Consistency and Standards | 3 | Segmented toggle unselected state in light mode looks disabled, not alternative (P2). |
| 5 | Error Prevention | 3 | NumericInput range hints + advisory messages (v1.6). Solid. |
| 6 | Recognition Rather Than Recall | 4 | Step eyebrow + big dose + subdose + delta is self-explanatory. |
| 7 | Flexibility and Efficiency | 3 | sessionStorage persistence; no keyboard shortcut for mode switching yet (low severity). |
| 8 | Aesthetic and Minimalist Design | 4 | Very clean. Dark mode feels intentional, light mode feels alive. |
| 9 | Error Recovery | 3 | Advisory text on out-of-range inputs. |
| 10 | Help and Documentation | 3 | AboutSheet covers it. |
| **Total** | | **35/40** | **Excellent — this is the reference surface for the rest of the app** |

## Priority Issues

### [P2] Segmented toggle unselected state reads as disabled in light mode

**What:** The `Linear | Compounding` toggle in light mode: the active tab is white with crisp blue text, the inactive tab is a medium-gray fill with slightly darker gray text. At a glance the inactive tab reads as "disabled" rather than "unselected alternative."

**Why it matters:** Clinicians need to perceive Linear and Compounding as **equal choices, one currently selected**. If the unselected option looks disabled, it subtly discourages switching modes — which is actively bad for a clinical tool where mode choice is a decision the clinician makes every time.

**Fix:** Lift the inactive tab's text to the primary text color (or at most a small step down) and lighten the inactive fill so it reads as "not selected" rather than "cannot be selected." Alternatively, lean into a different active-state mechanism (e.g., border-bottom underline indicator on active tab, no fill change) that keeps both tabs visually equal.

Dark mode is fine — the inactive tab uses a subtle lift from background with full text color, which reads as "unselected alternative."

**File:** `src/lib/shared/components/SegmentedToggle.svelte` (or wherever the unselected state is styled). Light mode specifically.

**Suggested command:** /quieter or direct token adjustment

---

### [P2] Dark-mode summary card "Start / Step 10 / Total reduction" labels feel thin

**What:** In the dark-mode summary card at desktop, the top-row labels `Start`, `Step 10`, `Total reduction` sit above their values in a small uppercase-ish weight that reads a bit ghostly against the identity-blue tinted background.

**Why it matters:** These labels anchor the three columns — they should feel grounded, not whispered. The values below them read fine (tabular numerics, strong weight), but the labels feel like an afterthought.

**Fix:** Bump the label color from whatever tertiary-on-identity token is used to the equivalent of `--color-text-secondary` on identity background. Alternatively, add a hair more weight (from 400 → 500 or 600). This is a per-context contrast tune, not a general token bump.

**File:** Find the summary card component (likely in `src/lib/morphine/`). The labels are the three span elements above the `Start / Step 10 / Total reduction` values.

**Suggested command:** /typeset or direct edit

---

### [P3] Step card delta label alignment

**What:** The top-right delta `-0.0124 mg (10.0%)` on each step card is aligned to the right edge with a small margin. On narrower mobile viewports (375) it gets pretty close to the card's right padding, and on Step 10 (which has `(50.0%)`) it visually "leans" against the edge.

**Why it matters:** Minor breathing room issue, not a correctness issue.

**Fix:** Add 2-4px more right padding on the delta span, or reduce the container's right padding by the same amount. Micro-polish.

**File:** Morphine step card component.

**Suggested command:** /polish

---

## Minor Observations

- **Step 1 eyebrow `STEP 1 — STARTING DOSE`** uses an em-dash and adds useful context. Good detail.
- **"Clear inputs" link at the bottom** is a quiet link, not a button — correct treatment for a low-frequency destructive-ish action.
- **Arrow glyph `→` between Start and Step 10 in the summary card** is functional. Could potentially be a more typographically distinctive arrow, but this is fine. Not worth a fix.
- **Dock magnification** (v1.2 feature) is scroll-driven and desktop doesn't activate it. Mobile behavior not captured in this pass but was validated in v1.2 and not touched since. Out of scope.

## Deferred to NOTES.md

- None. Morphine is close to done; the P2 and P3 items are worth doing in this phase but don't warrant deferral.

---
*Critique by Claude Opus 4.6 via impeccable:critique skill — 2026-04-09*
