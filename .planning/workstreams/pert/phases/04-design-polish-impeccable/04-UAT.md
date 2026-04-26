---
status: diagnosed
phase: 04-design-polish-impeccable
workstream: pert
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
  - 04-03-SUMMARY.md
  - 04-04-SUMMARY.md
started: 2026-04-26T16:01:00Z
updated: 2026-04-26T17:30:00Z
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
result: resolved
resolution_commit: d82aa30
resolution_plan: 04-04-PLAN.md (Approach C escalation — eyebrow tracking-wider bump)
user_verdict_on_approach_c: "approved"
resolution_note: |
  Initial result was "issue" against HEAD e6f454a (Wave 2 commit 29306e7 with Approach A
  alone — numeral font-bold → font-extrabold). User reported the 700 → 800 weight delta
  on Plus Jakarta Sans at text-title (22px) was not visually distinguishable.

  Plan 04-04 (Wave 4 gap closure) shipped Approach C: eyebrow tracking-wide → tracking-wider
  on the Capsules per month row at PertCalculator.svelte:288 (commit d82aa30). Combined with
  the preserved Approach A numeral font-extrabold from commit 29306e7, the both-vectors
  typographic delta (eyebrow letter-spacing 0.275 px → 0.55 px AND numeral weight 700 → 800)
  was re-tested via human-eye visual UAT at the human-verify checkpoint in plan 04-04 Task 3.

  User verdict (verbatim): "approved"
  Re-tested context: light-desktop-tube-feed (the surfaced-issue context)
  Re-tested at: 2026-04-26T17:08
  Re-tested against: HEAD = 8cafd1d (Wave 4 closure tracking commit)

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

### 4. Oral mode prescribing-artifact hierarchy parity with Tube-Feed
expected: |
  In Oral mode, "Estimated daily total (3 meals/day)" is the prescribing
  artifact for daily-script + parent-education workflows (capsules/day = the
  number ordered against). It should mirror Tube-Feed's "Capsules per month"
  visual treatment so the prescribing artifact reads as the row that matters
  most regardless of mode: numeral text-title font-extrabold (not text-base
  font-medium), eyebrow tracking-wider (not tracking-wide). Currently it
  reads SMALLER and LIGHTER than the per-dose derived figures above it
  (Total lipase needed, Lipase per dose), which is a hierarchy inversion.
result: issue
reported: "User reports: 'Estimated daily total (3 meals/day) should present the same as Capsules per month'. The current rendering puts the daily prescribing artifact visually below the per-dose derived figures. Currently: numeral text-base font-medium (16px / weight 500); eyebrow tracking-wide (0.275px). Should mirror Capsules-per-month: text-title font-extrabold (22px / weight 800); eyebrow tracking-wider (0.55px)."
severity: major
locked_decision_conflict: |
  This finding contradicts Phase 2 LOCKED decision D-09 (.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-CONTEXT.md:94-98), which prescribed the tertiary text-base + font-medium treatment. D-09 was authored under the assumption that the per-dose figures are the prescribing artifact and the daily total is informational/derived.

  The user's point: clinically the daily total IS the prescribing artifact for daily-script and parent-education workflows. Even when it isn't, hierarchy INVERSION (prescribing artifact rendered SMALLER than derived figures) is worse than parity.

  Fix path requires amending D-09 — that's a discuss-phase decision change, not a plan-level polish. The proper sequence:
  1. /gsd-discuss-phase 4 --gaps --ws pert — author D-09a sub-decision: "Promote Estimated daily total to prescribing-artifact treatment (text-title font-extrabold + tracking-wider) to mirror Tube-Feed's Capsules per month and eliminate hierarchy inversion."
  2. /gsd-plan-phase 4 --gaps --ws pert — author Wave 5 plan to ship the code change (3 token swaps on lines 215-221: tracking-wide → tracking-wider; text-base → text-title; font-medium → font-extrabold).
  3. /gsd-execute-phase 4 --gaps-only --auto --ws pert — ship Wave 5.
  4. /gsd-verify-work 4 --ws pert — re-test by eye.

## Summary

total: 4
passed: 3
issues: 1
resolved: 1
pending: 0
skipped: 0

## Gaps

- truth: "Tube-Feed `Capsules per month` row reads visually distinct from the 3 derived rows (Total fat / Total lipase / Lipase per kg) so the prescribing artifact is findable faster. Approach A applied (numeral font-bold → font-extrabold) per 04-02-PLAN.md preferred recipe."
  status: resolved
  resolution: "Plan 04-04 (Wave 4) shipped Approach C escalation (eyebrow tracking-wider bump at line 288). Combined with preserved Approach A numeral font-extrabold (line 293), the both-vectors typographic delta closes the F-03 hierarchy gap. User-visual UAT at plan 04-04 Task 3 human-verify checkpoint returned verbatim verdict `approved` on 2026-04-26T17:08."
  was_failed_status:

- truth: "Oral mode `Estimated daily total (3 meals/day)` row reads with the same prescribing-artifact treatment as Tube-Feed `Capsules per month`: numeral text-title font-extrabold (22px / weight 800) + eyebrow tracking-wider (0.55px). The daily total is the prescribing artifact for daily-script and parent-education workflows; the current text-base font-medium tertiary treatment per Phase 2 D-09 inverts the hierarchy by rendering it SMALLER than the per-dose derived figures (Total lipase needed, Lipase per dose) above it."
  status: failed
  reason: "User-visual UAT (test #4) reports the Oral mode daily total renders smaller and lighter than the per-dose figures it derives from, inverting the prescribing-artifact hierarchy. The fix requires amending Phase 2 D-09 via /gsd-discuss-phase 4 --gaps --ws pert (locked decision change), then shipping the 3-token-swap code change via Wave 5 plan."
  severity: major
  test: 4
  blocked_by: "Phase 2 D-09 LOCKED decision must be amended before Wave 5 plan can author the code change. /gsd-discuss-phase 4 --gaps --ws pert is the unblocking step."
  artifacts:
    - src/lib/pert/PertCalculator.svelte (lines 213-227 — the Estimated daily total row; eyebrow at line 215-216 currently `tracking-wide`; numeral at line 221 currently `text-base font-medium`; visible text at line 218 PRESERVED per Pitfall 4 selector preservation; numeral expression `oralResult.estimatedDailyTotal` at line 222 PRESERVED)
    - .planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-CONTEXT.md (lines 94-98 — D-09 source decision)
    - .planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-04-PLAN.md (lines 33, 83-84 — D-09 enforcement in Phase 2 plan)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-UI-SPEC.md (Watch Item 5 generalization candidate — the prescribing-artifact-must-lead principle that drove F-03 should now extend to Oral mode)
  missing:
    - Amended D-09 (call it D-09a or supersede outright) authorizing the prescribing-artifact treatment for Estimated daily total
    - Wave 5 plan shipping the 3-token swap (tracking-wide → tracking-wider; text-base → text-title; font-medium → font-extrabold) on Oral row at PertCalculator.svelte:213-227
  options:
    - "Approach (canonical, mirrors Tube-Feed F-03 + 04-04 Approach C combined-vector treatment): 3-token swap on the existing Oral tertiary row in PertCalculator.svelte: line 216 `tracking-wide` → `tracking-wider`; line 221 `text-base` → `text-title`; line 221 `font-medium` → `font-extrabold`. Identity-Inside Rule preserved (eyebrow color token unchanged). Pitfall 4 preserved (visible text 'Estimated daily total (3 meals/day)' and numeral expression `oralResult.estimatedDailyTotal` unchanged). e2e/pert.spec.ts selector at line 132 (3-meals daily total assertion) still grep-matches. ~3 LOC, single file edit, PERT-route only, no D-08b violation."
    - "Process: amend D-09 first via /gsd-discuss-phase 4 --gaps --ws pert. Without that, shipping the code change directly would silently override a LOCKED decision — the same anti-pattern that surfaced this gap (Phase 2 D-09 was locked under an assumption the user is now correcting). Discuss-phase produces D-09a sub-decision with the prescribing-artifact-must-lead principle generalized from Watch Item 5 to BOTH modes."
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
