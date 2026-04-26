---
status: diagnosed
phase: 04-design-polish-impeccable
workstream: pert
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
  - 04-03-SUMMARY.md
started: 2026-04-26T16:01:00Z
updated: 2026-04-26T16:38:00Z
---

## Current Test

[testing complete]

## Tests

### 1. F-03 visual hierarchy on Tube-Feed Capsules per month
expected: |
  Tube-Feed secondaries card: Capsules per month numeral renders heavier
  (font-extrabold) than the 3 sibling rows above it. Identity-purple eyebrow
  preserved. No text/numeral string changes.
auto_verified: dom-inspection-pass
result: issue
reported: "User reports: at the rendered text-title scale (22px Plus Jakarta Sans) the font-bold (700) → font-extrabold (800) bump is not visually distinguishable. All 4 numerals read at equivalent weight. Approach A (numeral-only) is insufficient."
severity: major

### 2. Oral mode unaffected
expected: |
  Oral mode secondaries card (Total lipase needed / Lipase per dose / Estimated
  daily total) renders with the same uniform font-bold weights as before
  Phase 4. F-03 is asymmetric to Tube-Feed only.
auto_verified: dom-inspection-pass (zero font-extrabold in Oral mode; secondaries 700/700; tertiary 500/16px per D-09)
result: pass

### 3. PERT route renders cleanly across the F-03 fix
expected: |
  Navigating to /pert and switching modes renders without JS errors, layout
  shifts, or hydration warnings. Mode toggle works. Inputs persist via
  localStorage round-trip.
auto_verified: |
  - 0 console errors across navigate + mode-switch click + reload
  - Mode toggle: aria-selected flip + state.mode persisted (oral → tube-feed)
  - Reload restored: mode=tube-feed, weight=7.86 (input + state), formula=nutren-junior, medication=pertzye
  - 1 unrelated console warning: apple-mobile-web-app-capable deprecation (pre-existing baseline, not introduced by F-03)
result: pass

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Tube-Feed `Capsules per month` row reads visually distinct from the 3 derived rows (Total fat / Total lipase / Lipase per kg) so the prescribing artifact is findable faster. Approach A applied (numeral font-bold → font-extrabold) per 04-02-PLAN.md preferred recipe."
  status: failed
  reason: "User reports the font-weight 700 → 800 delta on Plus Jakarta Sans at text-title (22px) does not produce a perceptible hierarchy bump. All 4 numerals read at equivalent weight by eye. The plan anticipated this and offered Approach C (also bump eyebrow tracking-wide → tracking-wider) as the fallback. Need to apply Approach C, or escalate the typographic delta further (e.g. text-title → text-display on Capsules per month, OR add an isolating visual treatment such as a subtle background tint, top divider, or eyebrow size bump)."
  severity: major
  test: 1
  artifacts:
    - src/lib/pert/PertCalculator.svelte (the F-03 edit site at line 293; the eyebrow above it on the same row is the Approach C target at lines 286-289)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-UI-SPEC.md (Watch Item 5 — F-03 source rule)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-FINDINGS.md (F-03 row — proposed-fix column documents Approaches A/B/C)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-02-PLAN.md (the recipe definitions including Approach C)
  missing:
    - Sufficient visual differentiation between Capsules per month and the 3 derived sibling rows
  options:
    - "Approach C (plan-anticipated fallback): bump eyebrow `tracking-wide` → `tracking-wider` on the Capsules per month row, in addition to the existing numeral `font-extrabold`. 1 token swap on the eyebrow `<div class=\"text-2xs font-semibold tracking-wide ...\">`. PERT-route only; ~1 LOC; no D-08 violation; e2e selectors unchanged."
    - "Approach D (escalation if Approach C is still insufficient): bump the Capsules per month numeral from `text-title` (22px) to `text-display` (44px) — or to a custom `text-[28px]` if `text-display` is too loud. Larger size + extrabold weight together creates a clear hero-secondary that visually leads. Slightly more invasive (changes line-height + row spacing) but unambiguous."
    - "Approach E (visual isolation, no typographic change): add a subtle row treatment to Capsules per month — e.g. bg-[var(--color-identity-hero)]/30 background tint, or border-t-2 border-[var(--color-identity)] divider, or icon prefix. Restores hierarchy via container-level cue rather than typographic delta."
