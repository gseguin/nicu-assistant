---
phase: 4
plan: 5
subsystem: pert/design-polish-impeccable
workstream: pert
milestone: v1.15
wave: 5
gap_closure: true
tags: [pert, design-polish, gap-closure, wave-5, oral-hierarchy-inversion, prescribing-artifact-leads, d-12, d-13]
dependency_graph:
  requires:
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-01-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-02-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-03-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-04-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-UAT.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-VERIFICATION.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CONTEXT.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-05-PLAN.md
  provides:
    - src/lib/pert/PertCalculator.svelte (post-D-12-Oral-promotion; Oral `Estimated daily total (3 meals/day)` row at lines 213-227 promoted to prescribing-artifact treatment via 3-token swap; eyebrow `tracking-wide` -> `tracking-wider` line 216; numeral `text-base` -> `text-title` and `font-medium` -> `font-extrabold` line 221; Wave 4 Tube-Feed eyebrow `tracking-wider` from commit `d82aa30` line 288 byte-identical; Wave 2 Tube-Feed numeral `font-extrabold` from commit `29306e7` line 293 byte-identical; cross-mode parity per D-13 Prescribing-Artifact-Leads Rule structurally complete)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-05-SUMMARY.md (this file; D-12 amendment record + D-13 codification + cross-mode parity confirmation + verbatim user-visual verdict)
  affects:
    - .planning/workstreams/pert/STATE.md (orchestrator/optional updates after this plan ships; NOT touched by Wave 5 source/test scope; the Wave 5 tracking paragraph + flip ROADMAP plan count from 4/4 to 5/5 happens via the optional STATE/ROADMAP commit)
    - .planning/workstreams/pert/ROADMAP.md (orchestrator/optional updates after this plan ships; the 04-05 row flips `[ ]` -> `[x]` with date 2026-04-26)
    - .planning/workstreams/pert/REQUIREMENTS.md (NOT touched by Wave 5; PERT-DESIGN-02..05 stay Validated; the test #4 gap row resolution flows through `/gsd-verify-work 4 --ws pert`)
tech_stack:
  added: []
  patterns:
    - "D-12 Oral hierarchy promotion (3-token swap; visual-treatment-aspect-only supersedure of Phase 2 D-09): the Oral mode tertiary `Estimated daily total (3 meals/day)` row at PertCalculator.svelte:213-227 is promoted from informational tertiary treatment (`text-base font-medium` numeral; `tracking-wide` eyebrow) to prescribing-artifact treatment matching Tube-Feed `Capsules per month` (`text-title font-extrabold` numeral; `tracking-wider` eyebrow). The calculation, visible-text label, and cardinality of the row are unchanged -- only the typographic treatment is amended. Phase 2 D-09's tertiary-line treatment was authored under the assumption that the per-dose figures are the prescribing artifact and the daily total is informational; the user's clarification (the daily total IS the prescribing artifact for daily-script + parent-education workflows) is the rationale for the visual-treatment-aspect-only supersedure."
    - "D-13 Prescribing-Artifact-Leads Rule (workstream-local for v1.15; DESIGN.md update deferred to v1.16): in any PERT secondary-card stack, the prescribing artifact (the value a clinician orders against -- `Capsules per month` in Tube-Feed mode; `Estimated daily total` in Oral mode) MUST read visually distinct from derived siblings via the both-vectors typographic delta (eyebrow `tracking-wider` + numeral `font-extrabold`; numeral size matches secondaries at `text-title`, not the hero `text-display`). The rule's audit gate: any post-Phase-4 design-polish sweep MUST explicitly inspect the prescribing artifact in BOTH Oral and Tube-Feed modes -- by name, side-by-side, in the same UAT pass."
    - "Audit-both-modes-as-corrective-process insertion: Wave 1 LLM-Design-Review fallback missed both F-03 AND the Oral hierarchy inversion at Phase 4 closure; Wave 4 `checkpoint:human-verify` caught F-03 but only inspected Tube-Feed (mode-asymmetric audit gap). D-13 codifies the audit-both-modes principle as the structural correction. Wave 5's Task 3 `checkpoint:human-verify` is the first audit gate to enforce it explicitly: the human reviews BOTH the post-D-12 Oral row AND the Wave 4 + Wave 2 Tube-Feed treatment in the same UAT pass."
key_files:
  created:
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-05-SUMMARY.md
  modified:
    - src/lib/pert/PertCalculator.svelte
decisions:
  - "D-12 amends Phase 2 LOCKED decision D-09 for the visual-treatment-aspect-only. The Oral `Estimated daily total (3 meals/day)` row gets the prescribing-artifact treatment (numeral `text-title font-extrabold` + eyebrow `tracking-wider`) mirroring Tube-Feed `Capsules per month` per Wave 4 + Wave 2. Calculation, label, cardinality unchanged. 3-token swap on PertCalculator.svelte:213-227. Identity-Inside Rule preserved. Pitfall 4 selector preservation honored."
  - "D-13 codifies the Prescribing-Artifact-Leads Rule as a workstream-local rule for v1.15. DESIGN.md update is OUT-OF-SCOPE for Phase 4 and deferred to v1.16 design-contract-refinement phase per 04-CONTEXT.md Deferred Ideas. The rule generalizes Watch Item 5 from 04-UI-SPEC.md (Tube-Feed only) to cover both modes."
  - "Cross-mode parity is structurally complete post-Wave-5. The Oral row at lines 213-227 and the Tube-Feed row at lines 284-299 share the same both-vectors typographic treatment (eyebrow `tracking-wider` + numeral `text-title font-extrabold`; Identity-purple eyebrow color preserved on both)."
  - "Human-eye visual UAT verdict (verbatim, Task 3 resume signal): `approved`. The combined D-12 Oral promotion + the preserved Wave 4 + Wave 2 Tube-Feed treatment satisfies the D-13 audit-both-modes principle. The 04-UAT.md test #4 gap row (Oral hierarchy inversion) is RESOLVED by the human verdict."
  - "REQUIREMENTS.md NOT touched by this plan. PERT-DESIGN-02..05 stay Validated; the gap row resolution flows through `/gsd-verify-work 4 --ws pert`. The verifier reads this SUMMARY as the audit trail."
metrics:
  duration_minutes: 22
  completed_date: 2026-04-26
  tasks_completed: 4
  files_created: 1
  files_modified: 1
  commits: 2
  loc_changed_source: 3
  font_extrabold_count: 2
  tracking_wider_count: 2
  tracking_wide_only_count: 6
  num_class_count: 9
  function_binding_count: 3
  string_bridge_proxies: 0
  em_dash_count: 0
  en_dash_count: 0
  human_uat_verdict: approved
  human_uat_contexts_reviewed: light-desktop-oral + light-desktop-tube-feed (cross-mode parity per D-13 audit-both-modes scope; surfaced-issue contexts both reviewed in the same UAT pass)
  cross_mode_parity_status: structurally-complete
---

# Phase 4 Plan 05 Summary: D-12 Oral Hierarchy Promotion + D-13 Prescribing-Artifact-Leads Rule Codification (Wave 5 Gap Closure)

**Phase:** 04-design-polish-impeccable
**Plan:** 04-05 (Wave 5 -- gap closure from 04-UAT.md test #4)
**Generated:** 2026-04-26
**Workstream:** pert
**Milestone:** v1.15

Wave 5 closes the Oral hierarchy inversion gap surfaced by human UAT (recorded in 04-UAT.md test #4) by shipping D-12: a 3-token swap on the Oral `Estimated daily total (3 meals/day)` row in `src/lib/pert/PertCalculator.svelte` (lines 213-227) that promotes the daily total from informational tertiary treatment (`text-base font-medium` numeral; `tracking-wide` eyebrow) to prescribing-artifact treatment matching Tube-Feed `Capsules per month` (`text-title font-extrabold` numeral; `tracking-wider` eyebrow). The Wave 4 Tube-Feed eyebrow `tracking-wider` from commit `d82aa30` (line 288) and the Wave 2 Tube-Feed numeral `font-extrabold` from commit `29306e7` (line 293) are both preserved byte-identical. Wave 5 also codifies D-13: the Prescribing-Artifact-Leads Rule (workstream-local for v1.15; DESIGN.md update deferred to v1.16) -- in any PERT secondary-card stack, the prescribing artifact MUST read visually distinct from derived siblings via the both-vectors typographic delta. Cross-mode parity is structurally complete post-fix: the Oral row and the Tube-Feed row share byte-identical eyebrow class strings (`text-2xs font-semibold tracking-wider text-[var(--color-identity)] uppercase`) and byte-identical numeral class strings (`num text-title font-extrabold text-[var(--color-text-primary)]`). The Task 3 `checkpoint:human-verify` gate (the audit-both-modes corrective process insertion replacing the LLM-Design-Review fallback verdict from Phase 4 closure AND the mode-asymmetric Wave 4 human-verify which only inspected Tube-Feed) returned the verbatim user verdict `approved`, closing the 04-UAT.md test #4 gap row. Identity-Inside Rule preserved (eyebrow color token `text-[var(--color-identity)]` unchanged; the 3-token swap is letter-spacing + size + weight only, NEVER chromatic). Pitfall 4 selector preservation honored (visible text `Estimated daily total (3 meals/day)` and numeral expression `{oralResult.estimatedDailyTotal}` byte-identical). All 9 plan-level quality gates green. PERT-route allowlist + D-08b strictly-forbidden boundary enforced; only `src/lib/pert/PertCalculator.svelte` touched in the source diff.

## What this plan shipped

1. **D-12 Oral hierarchy promotion** at `src/lib/pert/PertCalculator.svelte` (Task 1, commit `f4565b4`).
   - Edit site: lines 213-227 (the Oral `Estimated daily total (3 meals/day)` tertiary row block; eyebrow `<div>` at lines 215-217 + visible text at line 218 + numeral `<span>` at line 221 + numeral expression at line 222 + units span at line 224).
   - Recipe applied: **3-token swap**.
     - Eyebrow line 216: `tracking-wide` -> `tracking-wider` (Approach C eyebrow letter-spacing 0.275px -> 0.55px).
     - Numeral line 221: `text-base` -> `text-title` (size 16px -> 22px, matches secondaries).
     - Numeral line 221: `font-medium` -> `font-extrabold` (weight 500 -> 800, matches Tube-Feed `Capsules per month`).
   - Comment block at lines 211-212 updated to cite D-12 + D-13 inline:
     ```svelte
     <!-- Prescribing-artifact line per D-12 (supersedes Phase 2 D-09 visual treatment).
          Same shape as Tube-Feed Capsules per month per D-13 Prescribing-Artifact-Leads Rule. -->
     ```
   - Before (eyebrow + numeral, Phase 2 D-09 informational tertiary treatment):
     ```svelte
                     <div
                         class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase"
                     >
                         Estimated daily total (3 meals/day)
                     </div>
                     <div class="flex items-baseline gap-2">
                         <span class="num text-base font-medium text-[var(--color-text-primary)]">
                             {oralResult.estimatedDailyTotal}
                         </span>
                         <span class="text-ui text-[var(--color-text-secondary)]">capsules</span>
                     </div>
     ```
   - After (eyebrow + numeral, D-12 prescribing-artifact treatment):
     ```svelte
                     <div
                         class="text-2xs font-semibold tracking-wider text-[var(--color-identity)] uppercase"
                     >
                         Estimated daily total (3 meals/day)
                     </div>
                     <div class="flex items-baseline gap-2">
                         <span class="num text-title font-extrabold text-[var(--color-text-primary)]">
                             {oralResult.estimatedDailyTotal}
                         </span>
                         <span class="text-ui text-[var(--color-text-secondary)]">capsules</span>
                     </div>
     ```
   - Diff: 3 token swaps on 2 source lines (line 216 + line 221) + 2 comment lines updated to cite D-12 + D-13. Visible text byte-identical. Numeral expression byte-identical. Identity color token byte-identical.
   - Sibling Oral derived rows (Total lipase needed at lines 178-191; Lipase per dose at lines 194-208) untouched; their eyebrows still read `tracking-wide` and their numerals still read `text-title font-bold`. The hierarchy bump on the Oral tertiary is asymmetric BY DESIGN: only the prescribing artifact gets the both-vectors typographic delta so it visually leads.
   - The Wave 4 Tube-Feed eyebrow at line 288 (`tracking-wider` from commit `d82aa30`) and the Wave 2 Tube-Feed numeral at line 293 (`font-extrabold` from commit `29306e7`) are preserved byte-identical -- Wave 5's edit does NOT re-touch the Tube-Feed row.

2. **D-13 Prescribing-Artifact-Leads Rule codification** (Task 1 inline comment + this SUMMARY's "D-13 future-audit forward note" subsection).
   - The rule lives as a workstream-local rule for v1.15: in any PERT secondary-card stack, the prescribing artifact MUST read visually distinct from derived siblings via the both-vectors typographic delta (eyebrow `tracking-wider` + numeral `font-extrabold`; numeral size matches secondaries at `text-title`, not the hero `text-display`).
   - DESIGN.md / DESIGN.json update is OUT-OF-SCOPE for Phase 4 and deferred to a v1.16 design-contract-refinement phase per 04-CONTEXT.md Deferred Ideas.
   - The rule's audit gate is propagated to this SUMMARY as the future-audit forward note for the next planner pickup that touches PERT typography (or any new calculator's secondary-card stack).

3. **Cross-mode parity confirmation** (Task 1 + this SUMMARY's "Cross-mode parity confirmation" subsection).
   - Post-Wave-5 the Oral row at lines 213-227 and the Tube-Feed row at lines 284-299 share the same both-vectors typographic treatment.
   - Side-by-side class-string equality verified by manual read + the 9 plan-level gates.

4. **Human-eye visual UAT checkpoint** (Task 3, no commit; resume signal captured in this SUMMARY).
   - User verdict (verbatim): `approved`.
   - Coverage actually reviewed: light-desktop-oral + light-desktop-tube-feed (cross-mode parity per D-13 audit-both-modes scope; both surfaced-issue contexts inspected in the same UAT pass).

5. **04-05-SUMMARY.md** (this file, Task 4, separate commit per the Wave 4 2-commit pattern).

## Source decisions (verbatim from 04-CONTEXT.md, gap-closure pass 2026-04-26)

Both decisions were authored 2026-04-26 in `/gsd-discuss-phase 4 --gaps --ws pert --auto` per the 04-DISCUSSION-LOG.md "Gap-closure pass -- 2026-04-26" section.

**D-12 [auto-recommended]:** Amend Phase 2 LOCKED decision D-09 (`02-CONTEXT.md:94-98`) via this Phase 4 gap-closure beat. Phase 2 D-09 prescribed Oral tertiary-line treatment as `text-2xs eyebrow + text-base value`, "smaller than secondary outputs (which are text-title)". Subsequent human-visual UAT (Phase 4 04-UAT.md test #4, surfaced 2026-04-26) caught that this renders the prescribing artifact (Estimated daily total -- the daily-script + parent-education number) SMALLER and LIGHTER than its derived per-dose figures (Total lipase needed, Lipase per dose) above it. **Hierarchy inversion is a clinical-trust regression** -- clinicians scanning for the daily-script number find it visually de-emphasized. Phase 4 ships D-12 to supersede Phase 2 D-09 for the visual-hierarchy aspect (the calculation, label, and cardinality of the row are unchanged -- only the typographic treatment is amended). New treatment mirrors Tube-Feed Capsules per month post-04-04: numeral `text-title font-extrabold` (22px / weight 800) + eyebrow `tracking-wider` (0.55px). 3-token swap on `src/lib/pert/PertCalculator.svelte:213-227`: line 216 `tracking-wide` -> `tracking-wider`; line 221 `text-base` -> `text-title`; line 221 `font-medium` -> `font-extrabold`. Comment at line 211 (the D-09 verbatim citation) gets updated to cite D-12 instead. Identity-Inside Rule preserved (eyebrow color token unchanged). Pitfall 4 preserved (visible text "Estimated daily total (3 meals/day)" + numeral expression `oralResult.estimatedDailyTotal` byte-identical; e2e selectors at `e2e/pert.spec.ts` still match). PERT-route only; `~3 LOC`; no D-08b violation. Wave 5 plan (gap-closure) ships this; user-visual UAT re-tests by eye.

**D-13 [auto-recommended]:** **Codify the Prescribing-Artifact-Leads Rule as a Phase 4 cross-mode design rule.** The rule: in any PERT secondary-card stack, the prescribing artifact (the value a clinician orders against -- `Capsules per month` in Tube-Feed mode; `Estimated daily total` in Oral mode) MUST read visually distinct from derived siblings. Distinction is achieved via the both-vectors typographic delta (eyebrow `tracking-wider` + numeral `font-extrabold`; numeral size matches secondaries at `text-title`, not the hero `text-display`). This rule generalizes Watch Item 5 from 04-UI-SPEC.md (Tube-Feed only) to cover both modes. Originating incidents: Tube-Feed F-03 (caught Wave 1 critique -> fixed Wave 2 Approach A -> human-visual UAT showed Approach A insufficient -> fixed Wave 4 Approach C combined-vector treatment -> user-visual `approved`); Oral hierarchy inversion (caught Wave 4 human-visual UAT test #4 -- missed by Wave 1 LLM-Design-Review fallback AND by Wave 4's checkpoint:human-verify which only inspected Tube-Feed). The rule's audit gate: any post-Phase-4 design-polish sweep MUST explicitly inspect the prescribing artifact in BOTH Oral and Tube-Feed modes (the 8-context critique sweep already covers this combinatorially, but human-verify checkpoints must explicitly call out both rows). DESIGN.md update is OUT-OF-SCOPE for Phase 4 (that's a v1.16 design-contract-refinement phase per the existing Deferred Ideas section). For now D-13 lives as a workstream-local rule documented here + cross-referenced in 04-VERIFICATION.md.

## Why this plan exists (the gap-closure rationale)

**Phase 4 closure context.** Wave 3 plan 04-03 (commits `95e31b0`, `3001c2a`, `33695e1`, `a6d9469`) certified PERT-DESIGN-01..06 as Validated at the >=35/40 score bar based on 8 LLM-Design-Review FINAL critique transcripts (aggregate 36.25/40; 8/8 contexts at >=35/40; AUDIT.sh exit 0; 18-gate verification all PASS). The closure record in 04-VERIFICATION.md acknowledged the LLM-Design-Review fallback path explicitly (since the `/impeccable` skill was not available in the agent runtime, the fallback driven by Playwright snapshot capture stood in for the deterministic skill).

**Wave 4 closure context.** Plan 04-04 (commits `d82aa30` Task 1 + `78686f9` Task 4) shipped F-03 Approach C eyebrow `tracking-wider` on Tube-Feed `Capsules per month` after human UAT test #1; user resume signal `approved` for that gap. The combined two-commit delta `29306e7` (Wave 2 numeral `font-extrabold`) + `d82aa30` (Wave 4 eyebrow `tracking-wider`) IS the full Approach C COMBINED RECIPE per 04-02-PLAN.md `<interfaces>` lines 147-150.

**The 04-UAT.md test #4 gap.** Human UAT recorded that the Oral mode `Estimated daily total (3 meals/day)` row reads SMALLER and LIGHTER than the per-dose derived figures above it (Total lipase needed at lines 178-191; Lipase per dose at lines 194-208) -- a hierarchy INVERSION where the prescribing artifact is visually de-emphasized below its own derived per-dose figures. Severity: major. Locked-decision conflict: the finding contradicts Phase 2 LOCKED decision D-09 (`02-CONTEXT.md:94-98`) which prescribed the tertiary `text-base font-medium` treatment under the assumption that the per-dose figures are the prescribing artifact and the daily total is informational/derived.

**The audit-both-modes-as-corrective-process insertion.** The Wave 1 LLM-Design-Review fallback's 8-context critique sweep at Phase 4 closure scored both modes at >=35/40 without surfacing either F-03 OR the Oral hierarchy inversion. Wave 4's `checkpoint:human-verify` caught F-03 but only inspected Tube-Feed (mode-asymmetric audit gap). D-13 codifies the audit-both-modes principle as the structural correction; this Wave 5 `checkpoint:human-verify` is the first audit gate to enforce it explicitly. The verification loop is now: ship plan -> human UAT in checkpoint with BOTH Oral AND Tube-Feed inspected in the same pass -> commit SUMMARY with verbatim outcome -> user runs `/gsd-verify-work 4 --ws pert` -> verifier re-checks the 04-UAT.md gap row.

**The D-12 amendment as deliberate locked-decision change.** D-12 amends Phase 2 LOCKED decision D-09 for the visual-treatment-aspect-only (the calculation, label, and cardinality of the row are unchanged). The user's clarification (the daily total IS the prescribing artifact for daily-script + parent-education workflows) is the rationale. Phase 2 D-09 was authored under a different assumption; the amendment is recorded transparently in the inline comment + here, NOT silently overridden.

**Why a gap-closure plan inside Phase 4 (not a Phase 4.1 / Phase 6).** The fix scope is identical to Wave 4 (single PertCalculator.svelte edit; PERT-route only; ~3 LOC; D-08 allowlist honored; no e2e selector change; Phase 3.1 invariants preserved; Wave 4 + Wave 2 Tube-Feed treatment byte-identical). It is the literal next step in the plan-anticipated D-13 cross-mode parity that 04-CONTEXT.md authored at the same gap-closure pass. Phase 5 release-readiness is unblocked by this fix landing.

## Quality gates (Wave 5 plan-level; all 9 PASS)

The 9 fast-feedback gates from Task 2 (the heavy gates -- pnpm build, pert-a11y, pert.spec, full Playwright, AUDIT.sh, 8-context FINAL critique sweep -- are NOT re-run in Wave 5 since the D-12 edit is a Tailwind class-string change with no behavioral or layout impact; Wave 3 closure already captured those baselines and the user's `/gsd-verify-work 4 --ws pert` re-run will include them as part of the standard verification command sequence):

| Gate | Command | Result |
|------|---------|--------|
| 1 svelte-check | `pnpm run check` | `0 errors, 0 warnings` (Phase 3.1 + Phase 4 baseline preserved; ~4586 files) |
| 2 vitest src/lib/pert/ | `pnpm exec vitest run src/lib/pert/` | `Test Files 5 passed (5); Tests 81 passed (81)` (matches Phase 3.1 + Phase 4 + Wave 4 PERT-subset baseline of PertCalculator.test.ts 10 + PertInputs.test.ts 9 + calculations.test.ts 45 + config.test.ts 17 = 81) |
| 3 em-dash + en-dash sweep on PertCalculator.svelte | `grep -cP '\x{2014}' src/lib/pert/PertCalculator.svelte` AND `grep -cP '\x{2013}' src/lib/pert/PertCalculator.svelte` | both `0` (workstream Q1 broad ban honored) |
| 4 tabular-numerals (`.num` class hits >=5) | `grep -cE 'class="[^"]*\bnum\b' src/lib/pert/PertCalculator.svelte` | `9` (>= 5; UI-SPEC Gate 12 satisfied; Phase 2 baseline preserved; UNCHANGED from Wave 4 -- the D-12 swap changed size + weight tokens within the same `class="num"` slot) |
| 5 Wave 4 + Wave 2 Tube-Feed treatment preserved (`tracking-wider` count = 2; `font-extrabold` count = 2; Tube-Feed line 288 + line 293 byte-identical) | `grep -c 'tracking-wider' src/lib/pert/PertCalculator.svelte` AND `grep -c 'font-extrabold' src/lib/pert/PertCalculator.svelte` | `2` and `2` (was `1` and `1` pre-Wave-5 from Wave 4 + Wave 2; Wave 5 adds the Oral row -> count reaches 2; the Wave 4 + Wave 2 Tube-Feed hits remain byte-identical -- regression guard PASS) |
| 6 D-12 landed on the correct Oral row | `grep -n 'tracking-wider' src/lib/pert/PertCalculator.svelte` AND `grep -n 'font-extrabold' src/lib/pert/PertCalculator.svelte` AND `grep -n 'D-12' src/lib/pert/PertCalculator.svelte` | `tracking-wider` hits at lines 216 (Oral, new) + 288 (Tube-Feed, Wave 4); `font-extrabold` hits at lines 221 (Oral, new) + 293 (Tube-Feed, Wave 2); D-12 + D-13 cited in comment block at lines 211-212 -- D-12 landed on the Oral `Estimated daily total` row exactly per the recipe |
| 7 function-binding bridges + string-bridge proxies | `grep -cE 'bind:value=\{$' src/lib/pert/PertInputs.svelte` AND `grep -cE 'let \w+(Bridge\|Proxy) = \$state' src/lib/pert/PertInputs.svelte` | bridges `3`, proxies `0` (Phase 3.1 D-01 invariants preserved; PertInputs.svelte byte-identical) |
| 8 pert-config.json byte-identical against HEAD | `git diff HEAD -- src/lib/pert/pert-config.json` | empty (Phase 4 commit `2dc7ae2` frozen; Wave 5 does NOT re-edit) |
| 9 plan-level negative-space audit | `git diff --name-only HEAD~1..HEAD -- src/ e2e/` | `src/lib/pert/PertCalculator.svelte` (exactly 1 file) |

All 9 gates PASS. Disambiguation note for `tracking-wide` vs `tracking-wider`: bare `grep -c 'tracking-wide'` over-counts because `tracking-wider` is a superstring. Disambiguated count for `tracking-wide`-only sites: `grep -oE 'tracking-wide(r|[^a-z]|"|$)' src/lib/pert/PertCalculator.svelte | grep -v 'tracking-wider' | wc -l` = `6` (was `7` pre-Wave-5; Oral eyebrow flipped one of the 7 to `tracking-wider`; the 6 remaining `tracking-wide`-only sites are page subtitle line 149 + Oral derived rows lines 181 + 198 + Tube-Feed sibling rows lines 237 + 254 + 271 -- siblings untouched per Pitfall 4 + asymmetric-by-design).

## Cross-mode parity confirmation

Post-Wave-5 the Oral row at PertCalculator.svelte:213-227 and the Tube-Feed row at PertCalculator.svelte:284-299 share the same both-vectors typographic treatment. Side-by-side class-string comparison:

| Slot | Oral (Wave 5, line) | Tube-Feed (Wave 4 + Wave 2, line) | Equality |
|------|---------------------|------------------------------------|----------|
| Eyebrow `<div>` class | `text-2xs font-semibold tracking-wider text-[var(--color-identity)] uppercase` (line 216) | `text-2xs font-semibold tracking-wider text-[var(--color-identity)] uppercase` (line 288) | byte-identical |
| Numeral `<span>` class | `num text-title font-extrabold text-[var(--color-text-primary)]` (line 221) | `num text-title font-extrabold text-[var(--color-text-primary)]` (line 293) | byte-identical |
| Identity color token | `text-[var(--color-identity)]` | `text-[var(--color-identity)]` | byte-identical (Identity-Inside Rule preserved on both) |

Asymmetric-by-design siblings (untouched by Wave 5):

- The 6 derived-row eyebrows keep `tracking-wide`: page subtitle line 149 + Oral derived rows lines 181 + 198 + Tube-Feed sibling rows lines 237 + 254 + 271. The bump is asymmetric BY DESIGN -- only the prescribing artifact in each mode gets the eyebrow `tracking-wider`.
- The 5 derived-row numerals keep `text-title font-bold`: Oral derived rows lines 186 + 203 + Tube-Feed sibling rows lines 242 + 259 + 276. The bump is asymmetric BY DESIGN -- only the prescribing artifact in each mode gets the numeral `font-extrabold`.

D-13 cross-mode parity per the Prescribing-Artifact-Leads Rule: structurally complete.

## Human-visual UAT outcome (D-13 audit-trail requirement)

**User verdict (verbatim resume signal):** `approved`.

**Interpretation:** the D-12 Oral promotion (3-token swap on `Estimated daily total` row) combined with the preserved Wave 4 + Wave 2 Tube-Feed treatment satisfies the D-13 Prescribing-Artifact-Leads Rule. The Oral `Estimated daily total (3 meals/day)` row reads visually distinct from the 2 derived sibling rows above it (Total lipase needed; Lipase per dose) in the rendered Oral mode at `/pert`. The prescribing artifact is findable faster than the per-dose derived figures. Cross-mode parity confirmed: the user inspected BOTH Oral AND Tube-Feed in the same UAT pass per the D-13 audit-both-modes principle.

**Coverage actually reviewed:** light-desktop-oral + light-desktop-tube-feed (the surfaced-issue context from 04-UAT.md test #4 + the Wave 4 reference context). Recommended additional coverage (light + dark x mobile + desktop x oral + tube-feed = 8 contexts) was offered in the checkpoint's `<how-to-verify>` instructions; the user's `approved` verdict closes the gap row at the surfaced-issue contexts. If a future regression surfaces in dark or mobile, the planner pickup runs `/gsd-plan-phase 4 --gaps --ws pert` for a follow-up gap-closure plan.

**Closure status:** the 04-UAT.md test #4 gap row (severity major; status failed; truth "Oral mode `Estimated daily total (3 meals/day)` row reads with the same prescribing-artifact treatment as Tube-Feed `Capsules per month`") is RESOLVED by the human verdict. The orchestrator's `/gsd-verify-work 4 --ws pert` re-run is the mechanism that flips the gap row to resolved + records the audit trail; this plan's SUMMARY captures the human-eye outcome verbatim for the verifier to read.

## Escalation ladder forward note (for any future regression's gap-closure pickup)

Even though D-12 + D-13 were approved this iteration, the escalation ladder is preserved here as permanent forward-context for any future regression on the Oral or Tube-Feed prescribing-artifact surface (or for any analogous typographic hierarchy bump in a different calculator's secondaries section). The lesson encoded by the audit-both-modes-as-corrective-process insertion is durable: ship one approach at a time per Wave-N gap-closure plan; re-test by human eye in BOTH modes; do NOT chain multiple typographic vectors in a single plan and over-shoot the hierarchy.

If a future iteration records that the D-12 + D-13 combined delta has degraded (CSS framework upgrade alters Plus Jakarta Sans rendering; Tailwind utility semantics shift; user reports residual issue), the next planner pickup should author a Wave 6 plan applying:

- **Numeral size escalation:** bump the prescribing-artifact numeral from `text-title` (22px) to a custom `text-[28px]` (less invasive; ~27% larger; preserves divide-y row alignment in most cases) OR `text-display` (44px; matches the hero numeral; potentially too loud for a SECONDARY in the divide-y stack). Mirror the change cross-mode if the D-13 cross-mode parity must hold. May require a row-padding adjustment (e.g. bump `py-4` to `py-5` on the row container) to maintain visual rhythm. Recommended over visual-isolation if typographic deltas are exhausted.
- **Visual isolation:** add a row-level treatment to the prescribing-artifact `<div class="flex items-baseline justify-between px-5 py-4">` -- e.g. `bg-[var(--color-identity-hero)]/30` background tint, OR `border-t-2 border-[var(--color-identity)]` top divider, OR icon prefix (e.g. lucide `Pill` glyph as a leading element of the row). Mirror cross-mode per D-13. Restores hierarchy via container-level cue rather than typographic delta. Recommended over numeral size escalation if typographic deltas feel too loud or break row alignment.
- **Cross-mode rendering drift investigation:** if a future numeral-size or visual-isolation escalation passes on Tube-Feed but fails on Oral (or vice versa), investigate glyph-metric differences between `(3 meals/day)` parenthetical text in the Oral row label and the plain `Capsules per month` label in the Tube-Feed row; the parenthetical may visually push down the eyebrow's left-aligned weight despite identical class strings.

Recommendation: typographic deltas before container-level cues; one approach at a time per Wave-N gap-closure plan; do NOT chain. Replan command if needed: `/gsd-plan-phase 4 --gaps --ws pert` after re-running UAT.

## D-13 future-audit forward note

The Prescribing-Artifact-Leads Rule lives as a workstream-local rule for v1.15. Three items propagate forward:

1. **Audit-both-modes principle.** Any post-Phase-4 design-polish sweep MUST explicitly inspect the prescribing artifact in BOTH Oral and Tube-Feed modes -- by name, side-by-side, in the same UAT pass. The 8-context critique sweep already covers this combinatorially, but human-verify checkpoints must explicitly call out both rows.

2. **DESIGN.md update deferred to v1.16.** The Prescribing-Artifact-Leads Rule belongs in DESIGN.md alongside the existing 10 named rules (Identity-Inside, Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong with STOP-red carve-out, Five-Roles-Only typography, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, Flat-Card-Default). The update is OUT-OF-SCOPE for Phase 4 per 04-CONTEXT.md Deferred Ideas; v1.16 design-contract-refinement phase will fold it into the project-wide contract.

3. **Generalization to other calculators.** When a new calculator authors a secondary-card stack (or an existing calculator's secondaries are re-designed in a future polish phase), the Prescribing-Artifact-Leads Rule applies -- the value a clinician orders against MUST read visually distinct from derived siblings via the both-vectors typographic delta. The next planner pickup that touches PERT typography (or any new calculator's secondary-card stack) MUST consult this rule and its audit gate.

## REQUIREMENTS.md re-validation note

This plan does NOT touch `.planning/workstreams/pert/REQUIREMENTS.md`. PERT-DESIGN-02..05 stay Validated mid-plan -- the Validated state was Phase 4's own LLM-driven verdict at Wave 3 plan 04-03 closure, and re-opening would require a deliberate flip and is outside this plan's scope. The 04-UAT.md test #4 gap row provided the audit trail for the question; the human-UAT verdict closes it.

After this plan ships, the user runs `/gsd-verify-work 4 --ws pert`. The verifier re-checks the existing 04-UAT.md test #4 gap row against the post-D-12 UI:

- The Task 3 resume signal in this SUMMARY is `approved`. The verifier reads this SUMMARY, marks the gap row resolved, and confirms PERT-DESIGN-02..05 stay Validated; D-13 cross-mode parity is structurally complete; Phase 4 closure is re-confirmed; the workstream is unblocked for Phase 5 (Release).
- If the user had typed escalation-required (e.g. "still inverted; recommend numeral size escalation"), the gap row would have stayed open and the user would have run `/gsd-plan-phase 4 --gaps --ws pert` for the next escalation rung. PERT-DESIGN-02..05 would still have stayed Validated (the Validated state was Phase 4's own LLM-driven verdict; re-opening requires a deliberate flip), but the gap row would have provided the audit trail.

The verification loop is: ship plan -> human UAT in checkpoint with both modes inspected -> commit SUMMARY with verbatim outcome -> user runs `/gsd-verify-work 4 --ws pert` -> verifier re-checks gap row -> orchestrator updates STATE.md / ROADMAP.md / REQUIREMENTS.md as needed (ALL outside this plan's scope).

## Phase 3.1 + Phase 4 invariants regression-guard

Verified at Wave 5 close (Gates 4, 5, 7, plus manual reads at the line ranges):

- **Wave 4 + Wave 2 Tube-Feed treatment preserved (regression guard for prior gap closures):** `grep -c 'tracking-wider' src/lib/pert/PertCalculator.svelte` returns `2` (1 from Wave 4 line 288 + 1 from new Wave 5 line 216); `grep -c 'font-extrabold' src/lib/pert/PertCalculator.svelte` returns `2` (1 from Wave 2 line 293 + 1 from new Wave 5 line 221). The Tube-Feed eyebrow class string at line 288 and the Tube-Feed numeral class string at line 293 are byte-identical with their respective commits (`d82aa30` for the eyebrow; `29306e7` for the numeral) per Gate 9's plan-level negative-space audit (only PertCalculator.svelte modified, and the Wave 5 diff is contained to the Oral row at lines 211-227).
- **Function-binding bridges (Phase 3.1 D-01 invariant):** `grep -cE 'bind:value=\{$' src/lib/pert/PertInputs.svelte` returns `3` (medication / strength / formula pickers each use the Svelte 5.9+ getter+setter object-literal binding shape per Phase 3.1 D-01).
- **String-bridge proxies (Phase 3.1 D-01 invariant):** `grep -cE 'let \w+(Bridge|Proxy) = \$state' src/lib/pert/PertInputs.svelte` returns `0`. KI-1 (the click-revert race) was structurally resolved at Phase 3.1 plan 01 commit `f2da16d`; Phase 4 + Wave 4 + Wave 5 have not regressed it. PertInputs.svelte byte-identical against HEAD per Gate 9.
- **Em-dash count on PertCalculator.svelte:** `0` (workstream Q1 broad ban honored).
- **En-dash count on PertCalculator.svelte:** `0` (workstream Q1 broad ban honored).
- **Tabular-numerals on PertCalculator.svelte:** `9` hits of `class="[^"]*\bnum\b` (Phase 2 baseline preserved; UNCHANGED from Wave 4 -- the D-12 swap changed size + weight tokens within the existing `class="num"` slot on the Oral tertiary numeral, not the `.num` class assignment itself).
- **STOP-red advisory carve-out preserved:** the `border-2 border-[var(--color-error)]` + `OctagonAlert` + `role="alert"` block downstream of both Oral and Tube-Feed secondary stacks is byte-identical (Wave 5's plan-level negative-space audit confirms only the Oral row block at lines 211-227 changed; the STOP-red block is downstream of the edit and untouched).
- **Identity-Inside Rule preserved:** the Oral eyebrow color token `text-[var(--color-identity)]` on line 216 and the Tube-Feed eyebrow color token on line 288 are both byte-identical pre and post; the D-12 3-token swap is letter-spacing + size + weight only, NOT a color change. DESIGN.md line 186 (Identity-Inside Rule reserves the identity color token for inside-the-route surfaces) holds.
- **Pitfall 4 selector preservation honored:** the visible text `Estimated daily total (3 meals/day)` on line 218 is byte-identical pre and post; the numeral expression `{oralResult.estimatedDailyTotal}` on line 222 is byte-identical pre and post; the Tube-Feed visible text `Capsules per month` on line 290 + numeral expression `{tubeFeedResult.capsulesPerMonth.toLocaleString('en-US')}` on line 294 are byte-identical (untouched by Wave 5). The component test selectors at `src/lib/pert/PertCalculator.test.ts:65` + `:77` (Oral tertiary daily-total assertion) and the e2e selectors at `e2e/pert.spec.ts` (Oral happy-path + Tube-Feed happy-path) all continue to match. ZERO test or e2e selector update required.
- **D-08 PERT-route allowlist + D-08b strictly-forbidden boundary:** only `src/lib/pert/PertCalculator.svelte` modified in the source diff (Gate 9). PertInputs.svelte (Phase 3.1 frozen) byte-identical; pert-config.json (Phase 4 commit `2dc7ae2` frozen) byte-identical; calc-layer files (calculations.ts, state.svelte.ts, types.ts, config.ts) byte-identical; shared components, NavShell, HamburgerMenu, other calculators, DESIGN.md, DESIGN.json, e2e specs all untouched.

## Negative-space audit

Plan-level (Wave 5 only):

```
$ git diff --name-only HEAD~1..HEAD -- src/ e2e/
src/lib/pert/PertCalculator.svelte
```

Exactly 1 file in the plan's diff (Task 1's commit `f4565b4`). Within D-08 PERT-route allowlist. No shared component, no NavShell, no HamburgerMenu, no other-calculator file, no e2e spec, no DESIGN.md, no DESIGN.json, no calc-layer (`calculations.ts` / `state.svelte.ts` / `types.ts` / `config.ts`), no `PertInputs.svelte` (Phase 3.1 frozen), no `pert-config.json` (Phase 4 commit `2dc7ae2` already in HEAD; not re-touched), no test files.

Phase-level forward note (for any subsequent verifier or planner running the cumulative audit `git diff --name-only $PHASE_BASELINE..HEAD -- src/ e2e/` where `$PHASE_BASELINE` is the parent of Wave 1 commit `eec18c2`):

```
src/lib/pert/PertCalculator.svelte    # Wave 2 F-03 (commit 29306e7) + Wave 4 Approach C eyebrow (commit d82aa30) + Wave 5 D-12 Oral 3-token swap (commit f4565b4); all font-weight/tracking/size only; all within prescribing-artifact rows for their respective modes
src/lib/pert/pert-config.json         # Out-of-band commit 2dc7ae2 (acknowledged in-phase by 04-02-SUMMARY.md)
src/lib/shared/about-content.ts       # Out-of-band commit 5cd3386 (D-08a-style amendment per 04-VERIFICATION.md acknowledgment; only the pert: { ... } entry edited, other 5 entries byte-identical)
```

All within D-08 allowlist or pre-acknowledged D-08a-style amendments. Wave 1's PRODUCT.md drop at the repo root is implicitly outside the `src/`+`e2e/` audit scope but explicitly recorded as the only repo-root D-08a addition in Wave 1's 04-01-SUMMARY.md.

## Deviations from Plan

### Auto-fixed issues

None during Task 1 + Task 2 + Task 4. The plan's recipe was applied verbatim:

- Task 1: the plan-cited line range (Oral tertiary row at lines 213-227) was confirmed by manual read before editing; the 3-token swap landed on the eyebrow `<div>` at line 216 + the numeral `<span>` at line 221 exactly per the recipe; the comment block at lines 211-212 was updated to cite D-12 + D-13 inline. Wave 4 line 288 + Wave 2 line 293 byte-identical preservation verified post-edit.
- Task 2: all 9 gates passed first run. No `node_modules` install was needed (the working tree carries the pre-existing install from the user's running dev server at port 5173).
- Task 4: this SUMMARY composed per the plan's 17-section structure; em-dash + en-dash sweep on the SUMMARY itself returns 0/0.

### Auth gates

None encountered. The workflow was fully agent-runnable except for the deliberate `checkpoint:human-verify` gate on Task 3, which is the audit-both-modes corrective process insertion (not an auth gate); the user's resume signal `approved` was captured per the plan's spec.

### Notes for future plans

- The `tracking-wide` vs `tracking-wider` substring overlap means a bare `grep -c 'tracking-wide'` over-counts (it matches both tokens). The plan correctly uses `grep -oE 'tracking-wide(r|[^a-z]|"|$)' src/lib/pert/PertCalculator.svelte | grep -v 'tracking-wider' | wc -l` to disambiguate. Future Tailwind-utility-bump plans on tokens with this kind of substring relationship should adopt the same disambiguating grep pattern.
- The audit-both-modes principle is now the structural correction encoded by D-13. Future design-polish plans where a typographic bump or hierarchy assertion is the entire fix MUST default to a `checkpoint:human-verify` gate that explicitly inspects BOTH modes (or BOTH analogous surfaces in any cross-mode calculator) in the same UAT pass; the LLM-Design-Review fallback is non-substitutable for typographic hierarchy assertions where the LLM may report DOM-level structural correctness without registering the perceptual gap or the mode-asymmetric audit gap.

## PERT-DESIGN-02..05 satisfaction mapping

| Requirement | Closure source | Status |
|------------|---------------|--------|
| **PERT-DESIGN-02** (P1 fixes ship before merge; cheap P2/P3 inline per D-03 disposition rules) | F-03 P2 fix-now shipped at Wave 2 commit `29306e7` (Approach A: numeral `font-bold` -> `font-extrabold`); Approach C eyebrow escalation shipped at Wave 4 commit `d82aa30` (eyebrow `tracking-wide` -> `tracking-wider`); D-12 Oral hierarchy promotion shipped at Wave 5 commit `f4565b4` (3-token swap on Oral tertiary row); F-01 + F-02 + F-04 + F-05 deferred per D-03 + D-08b. 0 P1 findings across the phase. The Oral hierarchy inversion caught at human UAT test #4 was a cheap-inline P2 follow-up satisfied by Task 1 + the human-UAT confirmation. | Stays Validated (Wave 3 verdict + Wave 4 + Wave 5 human-UAT confirmations) |
| **PERT-DESIGN-03** (DESIGN.md / DESIGN.json contract enforced -- Identity-Inside Rule, Eyebrow-Above-Numeral, Tabular-Numbers, Five-Roles-Only, etc.) | Identity-Inside preserved (Oral eyebrow `text-[var(--color-identity)]` at line 216 + Tube-Feed eyebrow at line 288 byte-identical pre and post; D-12 is letter-spacing + size + weight only, NOT a color change); Tabular-Numbers preserved (`.num` class hits = 9 >= 5; Gate 4; UNCHANGED from Wave 4); Eyebrow-Above-Numeral preserved (eyebrow `<div>` above numeral `<span>` in both Oral row at lines 215-225 and Tube-Feed row at lines 287-297); Five-Roles-Only preserved (no new typographic role introduced; `tracking-wider`, `text-title`, `font-extrabold` are existing Tailwind utilities reused within the existing role taxonomy; D-13 codifies the Prescribing-Artifact-Leads Rule WITHIN the existing role taxonomy, not as a new role). | Stays Validated |
| **PERT-DESIGN-04** (HeroResult above-the-fold + sticky InputDrawer) | Phase 42.1 inheritance (universal patterns shipped to v1.13); F-04 P3 deferred per D-03 default. Wave 5 does NOT touch the hero or InputDrawer. | Stays Validated by inheritance |
| **PERT-DESIGN-05** (SegmentedToggle visual integration with identity hue) | Phase 1 + Phase 2 already shipped; Wave 1 + Wave 3 critique surfaced no SegmentedToggle finding; Wave 4 + Wave 5 do NOT touch the SegmentedToggle. | Stays Validated by inheritance |

Note: PERT-DESIGN-01 was satisfied by Wave 1 (8 critique transcripts captured) + Wave 3 (8 FINAL transcripts captured). PERT-DESIGN-06 (>=35/40 score target) was satisfied by Wave 3 (aggregate 36.25/40 at LLM-Design-Review fallback); the human-UAT gap closures on F-03 (Wave 4) and the Oral hierarchy inversion (Wave 5) may incrementally improve the score on a future LLM-Design-Review re-run if needed but are NOT required for the score bar (the >=35/40 target was met at Wave 3; these gap closures are quality-bar follow-ups to the human-UAT verdict, not score-target re-validations).

## Forward note: weight-in-oral-mode UX concern (Wave 6 hand-off)

The user surfaced a follow-up UX concern alongside the D-13 `approved` verdict: weight appears as an input in Oral mode but at first glance does not appear to drive the Oral dose calculation. This was investigated against `epi-pert-calculator.xlsx` (Pediatric PERT Tool sheet) and against the calc-layer at `src/lib/pert/calculations.ts`. The audit confirmed that weight IS used in Oral mode but ONLY for the PERT-SAFE-01 max-lipase-cap safety advisory (xlsx Pediatric PERT Tool cell `B11 = B4 * 10000`; calc-side: `getTriggeredAdvisories` reads weight to fire PERT-SAFE-01 when daily lipase exceeds `weightKg * 10000`). Weight is NOT a parameter in the Oral dose formula itself (xlsx `B9 = B5*B6` for Total Lipase Needed; `B10 = ROUND(B9/B8, 0)` for Capsules Needed). Therefore "remove weight" is NOT applicable -- removing weight would silently disable PERT-SAFE-01 in Oral mode, which is a clinical-safety regression. The actual UX gap is that weight reads as a primary dose-driving input when it is in fact a safety-only input; the user has no visual cue that it gates the safety advisory rather than the dose. This is OUT-OF-SCOPE for plan 04-05 (it is not the Oral hierarchy inversion D-12 + D-13 closed) and will be authored as a Wave 6 gap-closure cycle: `/gsd-discuss-phase 4 --gaps --ws pert` to lock the visual-distinction approach (e.g. weight-as-safety-input affordance + amend Phase 2 D-09's safety-input handling), then `/gsd-plan-phase 4 --gaps --ws pert` to author the plan, then `/gsd-execute-phase 4 --gaps-only --auto --ws pert` to ship. This Wave 5 SUMMARY records the finding for the orchestrator's `/gsd-verify-work 4 --ws pert` re-run to surface as a new 04-UAT.md row before the Wave 6 cycle begins.

## Self-Check: PASSED

All claimed artifacts verified to exist on disk:

- `src/lib/pert/PertCalculator.svelte` (post-D-12-Oral-promotion; `tracking-wider` count = 2; `font-extrabold` count = 2; `text-title` count = 8; `tracking-wide`-only count = 6 disambiguated; em + en-dash 0/0; tabular-numerals `.num` = 9; D-12 + D-13 cited in comment block at lines 211-212; visible text + numeral expression byte-identical pre and post on both Oral and Tube-Feed rows).
- `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-05-SUMMARY.md` (this file).

Commits verified to exist via `git log --oneline 8cafd1d..HEAD`:

- `f4565b4` Task 1 (D-12 Oral hierarchy promotion -- 3-token swap on `Estimated daily total` row at lines 213-227; Task 2 quality gates run inline in same context; logs in `/tmp/04-05-gates/`).
- (Task 4 commit landing immediately after this SUMMARY write; will appear with subject `docs(pert/04-05): summary -- D-12 Oral hierarchy + D-13 cross-mode parity approved (Wave 5 gap closure)` per the plan's commit message form.)

All Wave 5 success criteria met:

- [x] D-12 Oral hierarchy promotion shipped (3-token swap on Oral tertiary row; commit `f4565b4`).
- [x] D-13 Prescribing-Artifact-Leads Rule codified (workstream-local for v1.15; DESIGN.md update deferred to v1.16; audit-both-modes principle propagated as the future-audit forward note).
- [x] Cross-mode parity structurally complete (Oral and Tube-Feed prescribing-artifact rows share byte-identical eyebrow + numeral class strings).
- [x] All 9 plan-level quality gates green (svelte-check 0/0; vitest src/lib/pert/ 81/81; em + en-dash 0/0; tabular-numerals 9 unchanged; Wave 4 + Wave 2 Tube-Feed treatment preserved at `tracking-wider` = 2 + `font-extrabold` = 2; D-12 landed on the correct Oral row; function-binding bridges 3+; pert-config.json byte-identical; negative-space audit clean).
- [x] Human-eye visual UAT checkpoint completed (Task 3); user resume signal `approved` captured verbatim above; D-13 audit-both-modes principle followed (user inspected BOTH Oral AND Tube-Feed in the same UAT pass).
- [x] 04-05-SUMMARY.md authored at the phase directory with all 17 required sections.
- [x] D-08 PERT-route allowlist honored (only `src/lib/pert/PertCalculator.svelte` modified).
- [x] D-08b strictly-forbidden boundary honored (zero shared / shell / other-calculator / DESIGN.md / DESIGN.json / calc-layer / e2e / test edits).
- [x] Phase 3.1 invariants preserved (function-binding 3 hits; zero string-bridge proxies; em + en-dash 0/0; STOP-red carve-out untouched).
- [x] Phase 4 invariants preserved (Wave 2 F-03 numeral `font-extrabold` + Wave 4 Approach C eyebrow `tracking-wider` byte-identical from their respective commits).
- [x] Em-dash + en-dash sweep on this SUMMARY = 0 each (workstream Q1 broad ban honored on planning artifacts too).
- [x] Identity-Inside Rule preserved (eyebrow color token unchanged on both Oral and Tube-Feed rows; the bump is letter-spacing + size + weight only).
- [x] Pitfall 4 selector preservation honored (visible text + numeral expression byte-identical on both Oral and Tube-Feed rows; component test + e2e selectors unchanged).
- [x] Escalation ladder forward note (numeral size escalation + visual isolation + cross-mode rendering drift) preserved for any future regression's gap-closure pickup.
- [x] D-13 future-audit forward note documented (audit-both-modes principle + DESIGN.md v1.16 deferral + generalization to other calculators).
- [x] REQUIREMENTS.md re-validation note (deferral to `/gsd-verify-work 4 --ws pert`) documented.
- [x] PERT-DESIGN-02..05 stay Validated; not re-flipped mid-plan.
- [x] Forward note: weight-in-oral-mode UX concern documented as Wave 6 hand-off (xlsx + calc-layer audit confirms weight gates PERT-SAFE-01 only, not the dose; remove weight is NOT applicable; visual-distinction approach to be authored in next gap-closure cycle).

## Next step (the verification re-run + Phase 5 transition)

The user (or the orchestrator) runs:

1. `/gsd-verify-work 4 --ws pert` -- verifier re-checks the 04-UAT.md test #4 gap row against the post-D-12 UI by reading this SUMMARY's "Human-visual UAT outcome" section. The human verdict is `approved`, so the verifier marks the gap row resolved; D-13 cross-mode parity is structurally complete; PERT-DESIGN-02..05 stay Validated; Phase 4 closure is re-confirmed; the workstream is unblocked for Phase 5 (Release). The verifier may at its discretion re-run the heavy gates (pnpm build + pert-a11y + pert.spec + full Playwright + AUDIT.sh) as part of the standard verification command sequence; Wave 5 did NOT re-run them in-scope to conserve context (the D-12 edit is a class-string change with no behavioral or layout impact). The verifier is also expected to surface the weight-in-oral-mode UX concern from this SUMMARY's Wave 6 hand-off as a new 04-UAT.md row before the next gap-closure cycle begins.

2. `/gsd-discuss-phase 4 --gaps --ws pert` (if the weight-in-oral-mode UX concern is to be addressed before Phase 5) -- author the visual-distinction approach for weight-as-safety-only-input. Then `/gsd-plan-phase 4 --gaps --ws pert` to author the Wave 6 plan; then `/gsd-execute-phase 4 --gaps-only --auto --ws pert` to ship.

3. `/gsd-plan-phase 5 --ws pert` -- author the Phase 5 release plans (version bump, AboutSheet `__APP_VERSION__` reflect, full clinical gate, ROADMAP / PROJECT.md fold-back). The Wave 6 weight-in-oral-mode cycle may run in parallel or before Phase 5 depending on user priority.

Workstream `pert` advances from Phases Complete 4 / 6 (Phase 4 closure record post-Wave-4 + post-Wave-5) with the test #4 gap row resolved; Phase 5 (release) is the only remaining phase before workstream completion (with the optional Wave 6 weight-in-oral-mode UX cycle as a possible interlude).
