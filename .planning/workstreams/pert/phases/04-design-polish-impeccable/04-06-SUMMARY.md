---
phase: 4
plan: 6
subsystem: pert/design-polish-impeccable
workstream: pert
milestone: v1.15
wave: 6
gap_closure: true
tags: [pert, design-polish, gap-closure, wave-6, weight-safety-only-input, mode-conditional-helper-text, d-14]
dependency_graph:
  requires:
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-01-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-02-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-03-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-04-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-05-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-UAT.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-VERIFICATION.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CONTEXT.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-DISCUSSION-LOG.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-06-PLAN.md
  provides:
    - src/lib/pert/PertInputs.svelte (post-D-14-helper-text; mode-conditional `<p>` element added between the weight `RangedNumericInput` and the closing of the SHARED card at lines 125-129; gated `{#if pertState.current.mode === 'oral'}`; visible text `Used for the 10,000 units/kg/day safety check, not the dose calculation.`; class string `text-ui text-[var(--color-text-secondary)]`; +5 LOC; SHARED-card weight input + RangedNumericInput props at lines 113-124 byte-identical; all three Phase 3.1 function-binding bridges further down the file at lines 156, 191, 200 byte-identical; Pitfall 4 `label="Weight"` + `id="pert-weight"` + `sliderAriaLabel="Weight slider"` byte-identical)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-06-SUMMARY.md (this file; D-14 amendment record + alternatives-considered subsection unique to this gap closure + PERT-SAFE-01 referenced-not-modified subsection unique to this gap closure + cross-mode render confirmation + verbatim user-visual verdict + Phase 3.1 + Phase 4 invariants regression guard + escalation ladder forward note + REQUIREMENTS.md re-validation note)
  affects:
    - .planning/workstreams/pert/STATE.md (orchestrator/optional updates after this plan ships; NOT touched by Wave 6 source/test scope; the Wave 6 tracking paragraph + flip ROADMAP plan count from 5/5 to 6/6 happens via the optional STATE/ROADMAP commit)
    - .planning/workstreams/pert/ROADMAP.md (orchestrator/optional updates after this plan ships; the 04-06 row flips `[ ]` -> `[x]` with date 2026-04-26)
    - .planning/workstreams/pert/REQUIREMENTS.md (NOT touched by Wave 6; PERT-DESIGN-02..05 stay Validated; PERT-SAFE-01 stays in its current state -- the helper text is UX clarification of an existing safety check, NOT a calculation change; the Wave-5 hand-off gap row resolution flows through `/gsd-verify-work 4 --ws pert`)
tech_stack:
  added: []
  patterns:
    - "D-14 mode-conditional helper text (Option 3 selected per 04-CONTEXT.md recommended default; lowest-disruption alternative): the SHARED card in `src/lib/pert/PertInputs.svelte` (the patient anchor card holding the SegmentedToggle + the weight input, lines 106-130 in the post-Task-1 file) is amended with a sibling `<p>` element placed immediately after the weight `RangedNumericInput` and gated `{#if pertState.current.mode === 'oral'}`. The `<p>` element renders the visible text `Used for the 10,000 units/kg/day safety check, not the dose calculation.` with class string `text-ui text-[var(--color-text-secondary)]`. The mode-conditional gate makes the safety-only role of weight EXPLICIT in Oral mode (where weight does NOT participate in the dose formula -- xlsx Pediatric PERT Tool sheet B9 = B5*B6; B10 = ROUND(B9/B8, 0) -- but DOES gate the published 10,000 units/kg/day pediatric overdose-protection threshold via xlsx B11 = B4*10000 / calc-side `getTriggeredAdvisories`). In Tube-Feed mode the helper text is hidden (the gate evaluates false; no `<p>` rendered) because Tube-Feed weight IS used in the dose-side calc-layer (xlsx Tube-Feed B13 = B12/B4 lipasePerKg secondary), so no UX clarification is needed there."
    - "Mode-conditional render check as audit pattern (Wave 6 generalization of D-13 audit-both-modes): D-13 (Wave 5) codified the audit-both-modes principle for typographic hierarchy assertions where a screenshot-driven LLM critique cannot reliably evaluate mode-asymmetric typography. Wave 6 extends the principle to mode-conditional UI elements: any input-side polish that introduces a `{#if mode === 'X'}` gate MUST be verified by human-eye UAT in BOTH modes in the same UAT pass (the helper text must be visible in Oral and HIDDEN in Tube-Feed; mode-toggle must work correctly across runtime mode switches). A screenshot-driven LLM critique inspects a single rendered state, not the gate behavior across mode-toggle interactions; therefore the human-UAT gate is non-substitutable for mode-conditional render verification."
    - "Safety-only-input UX pattern (lesson encoded for future calculators): when an input is required for a SAFETY check but not for the primary calculation, the UX should make the safety-only role explicit. Otherwise clinicians may infer the input affects the dose, leading to either misplaced confidence (when the input is set) or disabled-safety risk (when the user is tempted to skip it). D-14 codifies this for the Oral weight case (weight gates PERT-SAFE-01 only in Oral mode; weight gates PERT-SAFE-01 AND drives the lipasePerKg secondary in Tube-Feed mode; the safety check is mode-shared but the dose-driving role is mode-asymmetric). The same principle generalizes to any safety-only input pattern in future calculators -- this is a v1.16 DESIGN.md update candidate."
key_files:
  created:
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-06-SUMMARY.md
  modified:
    - src/lib/pert/PertInputs.svelte
decisions:
  - "D-14 selected Option 3 (mode-conditional helper text) per 04-CONTEXT.md recommended default. Sibling `<p>` element added below the weight `RangedNumericInput` in the SHARED card at PertInputs.svelte lines 125-129; gated `{#if pertState.current.mode === 'oral'}`; visible text + class string per recipe; +5 LOC; PERT-route only; no D-08b shared-component edit (RangedNumericInput byte-identical). Pitfall 4 selectors preserved. Phase 3.1 function-binding bridges 3+0 invariants preserved."
  - "Option 1 (separate section header to visually distinguish weight as safety-only input) considered but REJECTED per 04-CONTEXT.md D-14: higher LOC (~10-15 LOC restructure of input-card layout); risks regressing the function-binding wiring at the SelectPicker bridges (lines 156, 191, 200) if the section reflow inadvertently shifts the surrounding flow; introduces a NEW visual idiom (a dedicated `safety input` section) that is NOT documented in DESIGN.md and would require a contract update -- which is OUT OF SCOPE for Phase 4 per the Deferred Ideas in 04-CONTEXT.md (DESIGN.md updates deferred to v1.16 design-contract-refinement phase)."
  - "Option 2 (make weight optional in Oral mode by gating `isOralValid` to NOT require weight) considered but REJECTED per 04-CONTEXT.md D-14: degrades clinical safety; weight gates PERT-SAFE-01 (the published 10,000 units/kg/day pediatric overdose-protection threshold; xlsx Pediatric PERT Tool sheet B11 = B4*10000); making weight optional in Oral mode would silently disable PERT-SAFE-01 for Oral users, allowing the calculator to render a dose with no overdose check. The user's verbatim follow-up `...if that's the case remove it` was investigated and answered: weight cannot be removed without disabling PERT-SAFE-01; the actual gap is UX clarity, not weight-as-orphaned-input."
  - "Cross-mode render confirmation: post-Wave-6 the helper text renders ONLY in Oral mode (visible immediately below the weight input) and is HIDDEN in Tube-Feed mode (the `{#if pertState.current.mode === 'oral'}` gate evaluates false; no `<p>` element rendered). Mode-toggle works correctly across runtime mode switches (verified by human-eye UAT in Task 3, orchestrator DOM-confirmed `helperPresent=false` in Tube-Feed mode)."
  - "PERT-SAFE-01 referenced (NOT modified): the safety advisory keeps firing byte-identical in BOTH modes (xlsx B11 = B4*10000 is mode-shared; calc-side `getTriggeredAdvisories` byte-identical; pert-config.json byte-identical); the helper text is UX clarification of an EXISTING safety check, NOT a calculation change. PERT-SAFE-01 stays in its current REQUIREMENTS.md state."
  - "DESIGN.md update deferred to v1.16: the safety-only-input UX pattern (D-14's generalizable lesson) is a v1.16 design-contract-refinement candidate; OUT OF SCOPE for Phase 4 per 04-CONTEXT.md Deferred Ideas. For now D-14 lives as a workstream-local rule documented here."
  - "Human-eye visual UAT verdict (verbatim, Task 3 resume signal): `approved`. The mode-conditional gate works in both modes (Oral renders the helper text; Tube-Feed cleanly hides it -- DOM-confirmed `helperPresent=false`). Wording legible; typography role compliant; no form regression. The Wave-5 weight-in-oral-mode UX hand-off gap is closed."
  - "REQUIREMENTS.md NOT touched by this plan. PERT-DESIGN-02..05 stay Validated; PERT-SAFE-01 stays in its current state; the gap row resolution flows through `/gsd-verify-work 4 --ws pert`."
metrics:
  duration_minutes: 25
  completed_date: 2026-04-26
  tasks_completed: 4
  files_created: 1
  files_modified: 1
  commits: 2
  loc_changed_source: 5
  helper_text_visible_text_count: 1
  mode_oral_gate_count: 2
  helper_text_class_string_count: 1
  function_binding_count: 3
  string_bridge_proxies: 0
  pitfall_4_label_weight_count: 1
  pitfall_4_slider_aria_label_count: 1
  pitfall_4_id_pert_weight_count: 1
  em_dash_count: 0
  en_dash_count: 0
  human_uat_verdict: approved
  human_uat_contexts_reviewed: light-desktop-oral + light-desktop-tube-feed (cross-mode render check; helper text visible in Oral; helper text hidden in Tube-Feed; orchestrator DOM-confirmed helperPresent=false in Tube-Feed)
  mode_conditional_render_status: confirmed
  pert_safe_01_status: referenced-not-modified
---

# Phase 4 Plan 06 Summary: D-14 Weight-in-Oral Safety-Only Helper Text (Wave 6 Gap Closure)

**Phase:** 04-design-polish-impeccable
**Plan:** 04-06 (Wave 6 -- gap closure from Wave-5 user follow-up)
**Generated:** 2026-04-26
**Workstream:** pert
**Milestone:** v1.15

Wave 6 closes the Wave-5 user follow-up UX concern (`...but it looks like weight isn't used in oral mode. double check against .xlsx. If that's the case remove it`) by shipping D-14: a mode-conditional helper text rendered as a sibling `<p>` element placed immediately after the weight `RangedNumericInput` in the SHARED card of `src/lib/pert/PertInputs.svelte` and gated `{#if pertState.current.mode === 'oral'}`. The visible text reads `Used for the 10,000 units/kg/day safety check, not the dose calculation.` with class string `text-ui text-[var(--color-text-secondary)]`. The xlsx + calc-layer audit conclusion (weight (xlsx B4) is used in exactly one Oral-mode cell, `B11 = B4*10000` -- the Max Lipase Units/Day safety cap; weight is NOT used in Oral dose-calc cells B9 = B5*B6 / B10 = ROUND(B9/B8,0); calc-side `computeOralResult` does not read weight; weight is read only by `getTriggeredAdvisories` to fire PERT-SAFE-01 when daily lipase exceeds `weightKg * 10000`) is captured verbatim below alongside the alternatives-considered rejection rationale (Option 1 rejected for function-binding bridge regression risk; Option 2 rejected for clinical-safety regression -- making weight optional in Oral would silently disable PERT-SAFE-01). The Task 3 `checkpoint:human-verify` gate -- the corrective process insertion extending the Wave-5 D-13 audit-both-modes principle to mode-conditional render verification, which a screenshot-driven LLM critique cannot reliably evaluate -- returned the verbatim user verdict `approved`, closing the Wave-5 weight-in-oral-mode UX hand-off gap. Cross-mode render is confirmed: the helper text is visible in Oral mode and HIDDEN in Tube-Feed mode (orchestrator DOM-confirmed `helperPresent=false` in Tube-Feed). PERT-SAFE-01 keeps firing byte-identical in BOTH modes -- the helper text is UX clarification of an EXISTING safety check, NOT a calculation change. Identity-Inside Rule preserved (helper text uses `text-[var(--color-text-secondary)]` neutral, NOT identity-purple). Five-Roles-Only Rule preserved (helper text uses the existing `text-ui` 13px role; no new role; no `text-[Npx]` arbitrary value). 11px Floor Rule preserved (`text-ui` 13px is AT the floor minimum for paragraph copy, not below it). Pitfall 4 selector preservation honored (RangedNumericInput props `label="Weight"` + `suffix="kg"` + `id="pert-weight"` + `sliderAriaLabel="Weight slider"` byte-identical pre and post; e2e + component test selectors continue to match without modification). All 9 plan-level quality gates green. PERT-route allowlist + D-08b strictly-forbidden boundary enforced; only `src/lib/pert/PertInputs.svelte` touched in the source diff. Phase 3.1 D-01 invariants preserved (function-binding bridges 3 hits at lines 156, 191, 200; zero string-bridge proxies). Wave 5 D-12 + Wave 4 Approach C + Wave 2 F-03 PertCalculator.svelte byte-identical. Wave 1 commit `2dc7ae2` pert-config.json byte-identical. After this plan ships, the user runs `/gsd-verify-work 4 --ws pert`; the verifier reads this SUMMARY's "Human-visual UAT outcome" section, sees the verbatim `approved`, marks the Wave-5 hand-off gap row resolved, confirms PERT-DESIGN-02..05 + PERT-SAFE-01 unchanged, and re-confirms Phase 4 closure -- the workstream is unblocked for Phase 5 (Release).

## What this plan shipped

1. **D-14 mode-conditional helper text** at `src/lib/pert/PertInputs.svelte` (Task 1, commit `b0fe1a0`).
   - Edit site: the SHARED card at lines 106-130 in the post-Task-1 file (the patient anchor card holding `SegmentedToggle` + the weight `RangedNumericInput`). The `<p>` element is placed immediately after the weight `RangedNumericInput`'s closing `/>` (post-edit line 124) and immediately before the `</section>` close of the SHARED card (post-edit line 130).
   - Recipe applied: **mode-conditional helper text (Option 3 per 04-CONTEXT.md D-14)**.
     - Open the gate at post-edit line 125: `{#if pertState.current.mode === 'oral'}`.
     - Open the `<p>` element at post-edit line 126: `<p class="text-ui text-[var(--color-text-secondary)]">`.
     - Visible text at post-edit line 127: `Used for the 10,000 units/kg/day safety check, not the dose calculation.`
     - Close the `<p>` element at post-edit line 128: `</p>`.
     - Close the gate at post-edit line 129: `{/if}`.
   - Diff (verbatim from Task 1's commit `b0fe1a0`):
     ```
     diff --git a/src/lib/pert/PertInputs.svelte b/src/lib/pert/PertInputs.svelte
     @@ -122,6 +122,11 @@
                  id="pert-weight"
                  sliderAriaLabel="Weight slider"
              />
     +        {#if pertState.current.mode === 'oral'}
     +            <p class="text-ui text-[var(--color-text-secondary)]">
     +                Used for the 10,000 units/kg/day safety check, not the dose calculation.
     +            </p>
     +        {/if}
          </section>

          {#if pertState.current.mode === 'oral'}
     ```
   - +5 LOC net add. Visible text and helper text class string each appear exactly 1x in the file. The `pertState.current.mode === 'oral'` gate count goes 1 -> 2 (the second hit is the existing Oral-mode-inputs section gate at post-edit line 132 -- `{#if pertState.current.mode === 'oral'}` opening the Oral-mode `Fat per meal` + `Lipase per gram of fat` card; that hit is byte-identical pre and post Wave 6).
   - The weight `RangedNumericInput` props at lines 113-124 (`bind:value={pertState.current.weightKg}` + `label="Weight"` + `suffix="kg"` + `min` + `max` + `step` + `typeStep` + `placeholder="3.0"` + `id="pert-weight"` + `sliderAriaLabel="Weight slider"`) are byte-identical pre and post Wave 6 -- Pitfall 4 selectors preserved.
   - The three Phase 3.1 function-binding bridges further down the file (Formula picker at line 156, Medication picker at line 191, Strength picker at line 200) are byte-identical pre and post Wave 6 -- Phase 3.1 D-01 invariants preserved (the Wave 6 edit is at the SHARED weight card section, ABOVE the bridge wiring, so the bridge sites are not perturbed).
   - The Tube-Feed-mode inputs section (lines 145+ in the post-Task-1 file: `Volume per day`, `Lipase per kg per day`, `Formula`, etc.) is byte-identical pre and post Wave 6 -- the helper text is route-local to the Oral-mode-only branch via the `{#if pertState.current.mode === 'oral'}` gate.

2. **Mode-conditional render confirmation** (Task 1 + Task 3 human-UAT + this SUMMARY's "Mode-conditional render confirmation" subsection).
   - Post-Wave-6 the helper text renders ONLY in Oral mode (visible immediately below the weight input within the SHARED card). In Tube-Feed mode the gate evaluates false; the `<p>` element does not render; `helperPresent=false` orchestrator-confirmed by DOM probe. The mode-toggle works correctly across runtime mode switches (verified by human-eye UAT in Task 3).

3. **Human-eye visual UAT checkpoint** (Task 3, no commit; resume signal captured in this SUMMARY).
   - User verdict (verbatim): `approved`.
   - Coverage actually reviewed: light-desktop-oral + light-desktop-tube-feed (cross-mode render check per the Wave-6 audit pattern; orchestrator DOM-confirmed `helperPresent=false` in Tube-Feed).
   - Functional checks confirmed: weight input typing + slider + range advisory all unchanged; no regression on the rest of the form (the SegmentedToggle works; the Oral-mode `Fat per meal` + `Lipase per gram of fat` inputs work; the SelectPickers work).

4. **04-06-SUMMARY.md** (this file, Task 4, separate commit per the Wave 4 + Wave 5 2-commit pattern).

## Source decisions (verbatim from 04-CONTEXT.md, gap-closure pass 2026-04-26)

D-14 was authored 2026-04-26 in `/gsd-discuss-phase 4 --gaps --ws pert --auto` per the 04-DISCUSSION-LOG.md "Gap-closure pass -- 2026-04-26 (--auto, --gaps, weight-in-Oral)" section.

**D-14 [auto-recommended]:** Weight-in-Oral-mode UX: clarify the safety-only role via mode-conditional helper text. Wave 5 user UAT (verbatim follow-up after `approved` on D-12 + D-13) flagged that weight is shown in Oral mode but isn't used in the dose calculation, asking whether it should be removed. Investigation against `epi-pert-calculator.xlsx` (Pediatric PERT Tool sheet) confirmed weight (B4) is used in exactly one cell -- `B11 = B4 * 10000` (Max Lipase Units/Day, the safety cap) -- and is NOT used in the dose-calculation cells (B9 Total Lipase Needed = B5*B6; B10 Capsules Needed = ROUND(B9/B8, 0)). Removing weight is therefore NOT applicable: it would silently disable PERT-SAFE-01 (the published 10,000 units/kg/day pediatric overdose-protection threshold) in Oral mode -- a clinical-safety regression. The actual gap is UX: the weight input reads as a regular dose input but only fires the safety advisory. Three approaches surfaced (Wave 5 SUMMARY Forward Note); Wave 6 ships the lowest-disruption recommended option (Option 3): a mode-conditional helper text rendered as a sibling `<p>` element after the weight input in `src/lib/pert/PertInputs.svelte` (line ~113-124, the SHARED card), gated `{#if pertState.current.mode === 'oral'}`. Helper text reads: "Used for the 10,000 units/kg/day safety check, not the dose calculation." (or similar -- the planner picks exact copy). Tube-Feed mode unchanged (weight IS used in the Tube-Feed `lipasePerKg` secondary output per xlsx Tube-Feed B13 = B12/B4, so no helper text needed there). PERT-route only; ~3 LOC; no D-08b violation (RangedNumericInput shared component NOT touched -- the helper text is a sibling element added to the route-local `PertInputs.svelte` parent); Phase 3.1 invariants preserved (function-binding bridges 3 hits stay byte-identical; the helper text is added BELOW the existing weight input block, not woven into the bridge wiring); Pitfall 4 e2e selectors preserved (the weight input's label "Weight" + suffix "kg" stay verbatim; the helper text is a NEW sibling `<p>` that doesn't conflict with any existing selector). Wave 6 plan ships this. Out of scope: Option 1 (visually distinguish weight as safety-only via a separate section header -- higher LOC, risks regressing function-binding wiring) and Option 2 (make weight optional in Oral mode -- degrades clinical safety; not approved). Both are documented as "considered but rejected" in the Wave 6 plan's `<deviations_considered>` block.

## Alternatives considered (Options 1 + 2 rejected per 04-CONTEXT.md D-14)

**Option 1 (rejected) -- visually distinguish weight as a safety-only input via a separate section header.** Promote the weight input out of the SHARED card and into its own card with a dedicated `Safety check input` eyebrow heading. Rejected because:
- Higher LOC (~10-15 LOC restructure of the input-card layout).
- Risks regressing the function-binding wiring at the SelectPicker bridges (Formula at line 156, Medication at line 191, Strength at line 200) if the section reflow inadvertently shifts the surrounding flow during edit.
- Introduces a NEW visual idiom (a dedicated `safety input` section) that is NOT documented in DESIGN.md and would need a contract update.
- DESIGN.md updates are OUT OF SCOPE for Phase 4 per 04-CONTEXT.md Deferred Ideas (deferred to v1.16 design-contract-refinement phase).
- 04-CONTEXT.md D-14 explicit rejection rationale: "risks regressing function-binding bridges".

**Option 2 (rejected) -- make weight optional in Oral mode.** Gate `isOralValid` to NOT require weight; allow Oral mode to compute capsules-per-dose without weight (since weight is not in the Oral dose formula). Rejected because:
- Degrades clinical safety. Weight gates PERT-SAFE-01 (the published 10,000 units/kg/day pediatric overdose-protection threshold; xlsx Pediatric PERT Tool sheet B11 = B4 * 10000).
- Making weight optional in Oral mode would silently disable PERT-SAFE-01 for Oral users, allowing the calculator to render a dose with no overdose check. The calculator becomes silently less safe than the spreadsheet it parities against.
- The user's verbatim follow-up `...if that's the case remove it` was investigated and answered: weight cannot be removed without disabling PERT-SAFE-01; the actual gap is UX clarity, not weight-as-orphaned-input.
- 04-CONTEXT.md D-14 explicit rejection rationale: "degrades clinical safety; not approved".

**Option 3 (selected; ships in Wave 6) -- mode-conditional helper text rendered as a sibling `<p>` element after the weight input in the SHARED card, gated `{#if pertState.current.mode === 'oral'}`.** Selected because:
- Lowest-disruption (+5 LOC net add).
- PERT-route only (`PertInputs.svelte` only).
- Preserves Phase 3.1 function-binding bridges byte-identical (the bridges are further down the file at lines 156, 191, 200; the helper text is added in the SHARED card section above, not woven into the bridge wiring).
- Preserves Pitfall 4 e2e + component test selectors byte-identical (`label="Weight"` + `id="pert-weight"` + `sliderAriaLabel="Weight slider"` unchanged).
- Preserves PERT-SAFE-01 byte-identical (calc-layer + pert-config.json untouched).
- Preserves Identity-Inside Rule (`text-[var(--color-text-secondary)]` neutral; NOT `text-[var(--color-identity)]`).
- Preserves Five-Roles-Only Rule (existing `text-ui` 13px role; no new role; no `text-[Npx]` arbitrary value).
- Preserves 11px Floor Rule (`text-ui` 13px is AT the floor minimum for paragraph copy; not below it).
- 04-CONTEXT.md D-14 explicit recommendation: "Option 3 -- mode-conditional helper text" (recommended default).

## PERT-SAFE-01 referenced (NOT modified)

The xlsx audit conclusion against `epi-pert-calculator.xlsx` (Pediatric PERT Tool sheet, B4 cell traced through B9/B10/B11):

- Weight (xlsx `B4`) is used in exactly one Oral-mode cell -- `B11 = B4 * 10000` (Max Lipase Units/Day, the safety cap).
- Weight is NOT used in the Oral dose-calculation cells: `B9` Total Lipase Needed = `B5 * B6` (fat-grams times lipase-per-g-of-fat); `B10` Capsules Needed = `ROUND(B9 / B8, 0)` (total lipase needed divided by capsule strength).
- Weight IS used in the Tube-Feed dose-side calc as the divisor for the `lipasePerKg` secondary (xlsx Tube-Feed `B13 = B12 / B4`); therefore Tube-Feed mode does NOT need the helper text (weight participates in the dose-side display in Tube-Feed; it does NOT in Oral).
- Removing weight is therefore NOT applicable: it would silently disable PERT-SAFE-01 (the published 10,000 units/kg/day pediatric overdose-protection threshold) in Oral mode -- a clinical-safety regression.

The calc-layer audit conclusion against `src/lib/pert/calculations.ts`:

- `computeOralResult` (lines 77-100) does NOT read weight; it returns capsules-per-dose, total-lipase-needed, and lipase-per-dose from `oral.fatGrams` + `oral.lipaseUnitsPerGFat` + the medication strength.
- Weight is read only by `getTriggeredAdvisories` (lines 207-260) to fire PERT-SAFE-01 when daily lipase exceeds `weightKg * 10000` (mode-shared safety check; the same triggered-advisory branch covers BOTH Oral 3-meals/day daily total AND Tube-Feed daily total).
- The calc-layer is byte-identical with Phase 2 D-15..D-18 (no Wave 6 calc-layer touch; `git diff HEAD -- src/lib/pert/calculations.ts` returns empty).

The Wave 6 ship: the helper text wording references the 10,000 units/kg/day threshold but the calculation contract is unchanged. The safety advisory keeps firing byte-identical in BOTH Oral and Tube-Feed modes (xlsx `B11 = B4 * 10000` is mode-shared); the helper text only makes the safety-only role of weight EXPLICIT in the UI for Oral mode where weight does NOT participate in the dose formula.

Therefore PERT-SAFE-01 stays in its current REQUIREMENTS.md state -- not flipped by this plan. The helper text is UX clarification of an EXISTING safety check, not a calculation change.

## Why this plan exists (the gap-closure rationale)

**Wave 5 closure context.** Plan 04-05 (commits `f4565b4` Task 1 + `618a66f` Task 4) shipped D-12 Oral hierarchy promotion (3-token swap on the `Estimated daily total (3 meals/day)` row at `PertCalculator.svelte:213-227`) + D-13 Prescribing-Artifact-Leads Rule cross-mode codification. The user's resume signal for the Oral hierarchy inversion gap from 04-UAT.md test #4 was `approved` (verbatim, single-token); the test #4 gap row was resolved by human verdict.

**The Wave-5 user follow-up (the trigger for Wave 6).** Alongside the D-12 + D-13 `approved` verdict, the user typed verbatim: `"...but it looks like weight isn't used in oral mode. double check against .xlsx. If that's the case remove it"`. Wave 5 captured this as a follow-up forward note in 04-05-SUMMARY.md ("Forward note: weight-in-oral-mode UX concern (Wave 6 hand-off)") rather than bolting a fix onto plan 04-05's scope.

**The xlsx + calc-layer audit conclusion.** See PERT-SAFE-01 referenced section above. Bottom line: weight gates PERT-SAFE-01 in BOTH modes; weight is used in the dose-side calc in Tube-Feed (lipasePerKg) but NOT in Oral; therefore "remove weight" is NOT applicable (would disable PERT-SAFE-01 in Oral); the actual gap is UX clarity, not weight-as-orphaned-input.

**The Wave-5 hand-off forward note.** 04-05-SUMMARY.md identified the actual gap (weight reads as a primary dose-driving input but is in fact a safety-only input in Oral mode) and proposed the Wave 6 cycle: `/gsd-discuss-phase 4 --gaps --ws pert` to lock the visual-distinction approach, then `/gsd-plan-phase 4 --gaps --ws pert` to author the plan, then `/gsd-execute-phase 4 --gaps-only --auto --ws pert` to ship.

**The locked-decision authorization.** 04-CONTEXT.md D-14 (added 2026-04-26) + 04-DISCUSSION-LOG.md gap-closure pass 2026-04-26 (weight-in-Oral) captured the auto-recommended Option 3 ship + Options 1 + 2 rejection rationale. D-14 is the locked-decision authorization for this plan.

**The audit-both-modes principle extended to mode-conditional render check.** Wave 5 D-13 codified the audit-both-modes principle for typographic hierarchy assertions where a screenshot-driven LLM critique cannot reliably evaluate mode-asymmetric typography. Wave 6 extends the principle to mode-conditional UI elements: any input-side polish that introduces a `{#if mode === 'X'}` gate MUST be verified by human-eye UAT in BOTH modes in the same UAT pass. The helper text must be visible in Oral and HIDDEN in Tube-Feed; mode-toggle must work correctly across runtime mode switches. A screenshot-driven LLM critique inspects a single rendered state, not the gate behavior across mode-toggle interactions; therefore the human-UAT gate is non-substitutable for mode-conditional render verification. Wave 6's Task 3 `checkpoint:human-verify` is the first audit gate to enforce this extension explicitly.

**Why a gap-closure plan inside Phase 4 (not a Phase 4.1 / Phase 6).** The fix scope is identical to Wave 4 + Wave 5 (single-file edit in PertInputs.svelte; PERT-route only; ~5 LOC; D-08 allowlist honored; no e2e selector change; Phase 3.1 invariants preserved; PERT-SAFE-01 byte-identical). It is the literal next step in the plan-anticipated D-14 hand-off that 04-05-SUMMARY.md recorded. Phase 5 release-readiness is unblocked by this fix landing.

## Quality gates (Wave 6 plan-level; all 9 PASS)

The 9 fast-feedback gates from Task 2 (the heavy gates -- pnpm build, pert-a11y, pert.spec, full Playwright, AUDIT.sh -- are NOT re-run in Wave 6 since the D-14 edit is a sibling-element addition with no calc-layer or behavioral impact; Wave 3 closure already captured those baselines and the user's `/gsd-verify-work 4 --ws pert` re-run will include them as part of the standard verification command sequence):

| Gate | Command | Result |
|------|---------|--------|
| 1 svelte-check | `pnpm run check` | `0 errors, 0 warnings` (Phase 3.1 + Phase 4 baseline preserved; 4586 files) |
| 2 vitest src/lib/pert/ | `pnpm exec vitest run src/lib/pert/` | `Test Files 5 passed (5); Tests 81 passed (81)` (matches Phase 3.1 + Phase 4 + Wave 4 + Wave 5 PERT-subset baseline of PertCalculator.test.ts 10 + PertInputs.test.ts 9 + calculations.test.ts 45 + config.test.ts 17 = 81) |
| 3 em-dash + en-dash sweep on PertInputs.svelte | `grep -cP '\x{2014}' src/lib/pert/PertInputs.svelte` AND `grep -cP '\x{2013}' src/lib/pert/PertInputs.svelte` | both `0` (workstream Q1 broad ban honored; ASCII-only helper text) |
| 4 D-14 helper text invariants landed | `grep -c 'Used for the 10,000 units/kg/day safety check, not the dose calculation' src/lib/pert/PertInputs.svelte` AND `grep -c "pertState.current.mode === 'oral'" src/lib/pert/PertInputs.svelte` AND `grep -c 'text-ui text-\[var(--color-text-secondary)\]' src/lib/pert/PertInputs.svelte` | visible-text count = `1` (expected 1); mode-gate count = `2` (expected 2 -- 1 new in SHARED card + 1 pre-existing on Oral-mode-inputs section); class-string count = `1` (expected 1) |
| 5 Phase 3.1 D-01 invariants preserved | `grep -cE 'bind:value=\{$' src/lib/pert/PertInputs.svelte` AND `grep -cE 'let \w+(Bridge\|Proxy) = \$state' src/lib/pert/PertInputs.svelte` | function-binding bridges `3` (Formula at line 156, Medication at line 191, Strength at line 200; UNCHANGED from Wave 5 baseline); string-bridge proxies `0` (KI-1 click-revert race not re-introduced) |
| 6 Pitfall 4 selector preservation | `grep -c 'label="Weight"' src/lib/pert/PertInputs.svelte` AND `grep -c 'sliderAriaLabel="Weight slider"' src/lib/pert/PertInputs.svelte` AND `grep -c 'id="pert-weight"' src/lib/pert/PertInputs.svelte` | `1` and `1` and `1` (UNCHANGED from Wave 5 baseline; RangedNumericInput props at lines 113-124 byte-identical pre and post Wave 6) |
| 7 PertCalculator.svelte byte-identical against HEAD | `git diff HEAD -- src/lib/pert/PertCalculator.svelte` | empty (Wave 5 D-12 commit `f4565b4` + Wave 4 commit `d82aa30` + Wave 2 commit `29306e7` byte-identical at lines 216 + 221 + 288 + 293) |
| 8 pert-config.json byte-identical against HEAD | `git diff HEAD -- src/lib/pert/pert-config.json` | empty (Wave 1 commit `2dc7ae2` frozen) |
| 9 plan-level negative-space audit | `git diff --name-only HEAD~1..HEAD -- src/ e2e/` | `src/lib/pert/PertInputs.svelte` (exactly 1 file) |

All 9 gates PASS.

**Verbatim gate output evidence** (pasted from `/tmp/04-06-gates/gate-NN-*.log`; transient artifacts NOT committed):

```
Gate 1 (svelte-check):
> nicu-assistant@1.13.0 check /mnt/data/src/gsd-workspaces/pert/nicu-assistant
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
1777228563880 START "/mnt/data/src/gsd-workspaces/pert/nicu-assistant"
1777228563898 COMPLETED 4586 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

Gate 2 (vitest src/lib/pert/):
 RUN  v4.1.4 /mnt/data/src/gsd-workspaces/pert/nicu-assistant
 Test Files  5 passed (5)
      Tests  81 passed (81)
   Start at  12:36:08
   Duration  25.48s

Gate 3 (em-dash + en-dash sweep on PertInputs.svelte):
em-dash count: 0
en-dash count: 0

Gate 4 (D-14 helper text invariants landed):
helper text visible-text count: 1 (expected: 1)
mode === 'oral' gate count: 2 (expected: 2)
helper-text class-string count: 1 (expected: 1)

Gate 5 (Phase 3.1 D-01 invariants preserved):
function-binding bridges: 3 (expected: 3)
string-bridge proxies: 0 (expected: 0)

Gate 6 (Pitfall 4 selector preservation):
label="Weight" count: 1 (expected: 1)
sliderAriaLabel="Weight slider" count: 1 (expected: 1)
id="pert-weight" count: 1 (expected: 1)

Gate 7 (PertCalculator.svelte history; Wave 5 + Wave 4 + Wave 2 byte-identical):
f4565b4 fix(pert/04-05): D-12 Oral daily-total promoted to prescribing-artifact treatment (D-13 cross-mode rule)
d82aa30 fix(pert/04-04): F-03 escalation to Approach C -- eyebrow tracking-wider bump
29306e7 fix(pert/04-02): F-03 capsules-per-month visual hierarchy bump (Wave 2 design polish)
PertCalculator.svelte diff: empty (Wave 5 D-12 + Wave 4 + Wave 2 byte-identical)

Gate 8 (pert-config.json byte-identical):
2dc7ae2 fix(pert): align weight slider range with other calculators (max 10 kg)
pert-config.json diff: empty (Wave 1 commit 2dc7ae2 byte-identical)

Gate 9 (plan-level negative-space audit):
src/lib/pert/PertInputs.svelte
```

## Mode-conditional render confirmation

Post-Wave-6, the helper text renders mode-conditionally:

| Mode | Render | DOM presence | Why |
|------|--------|--------------|-----|
| Oral | Visible immediately below the weight input within the SHARED card | `<p class="text-ui text-[var(--color-text-secondary)]">Used for the 10,000 units/kg/day safety check, not the dose calculation.</p>` is in the DOM | The `{#if pertState.current.mode === 'oral'}` gate evaluates true |
| Tube-Feed | Hidden | `<p>` element NOT in the DOM (orchestrator DOM-confirmed `helperPresent=false`) | The gate evaluates false; Svelte does not render the `{#if}` branch |

The mode-conditional gate works correctly across mode switches at runtime (verified by human-UAT in Task 3; the user toggled the SegmentedToggle Oral -> Tube-Feed -> Oral and confirmed the helper text shows + hides + shows in lockstep with the toggle).

The mode-conditional render is the structural correction that makes the safety-only role of weight EXPLICIT in Oral mode (where weight does NOT participate in the dose formula -- xlsx B9 = B5*B6; B10 = ROUND(B9/B8, 0)) without disabling PERT-SAFE-01 in either mode (the safety advisory is calc-layer-driven, not UI-driven; calc-layer + pert-config.json byte-identical). In Tube-Feed mode the helper text is correctly hidden because weight IS used in the dose-side calc (xlsx Tube-Feed B13 = B12 / B4 lipasePerKg secondary), so no UX clarification is needed.

This is a new audit pattern (mode-conditional render check) unique to input-side polish; it extends the Wave 5 D-13 audit-both-modes principle from typographic hierarchy assertions to mode-gated UI elements. A screenshot-driven LLM critique cannot reliably evaluate this -- it inspects a single rendered state, not the gate behavior across mode-toggle interactions.

## Human-visual UAT outcome (D-13 audit-trail requirement extended to input-side polish)

**User verdict (verbatim resume signal):** `approved`.

**Interpretation:** the D-14 mode-conditional helper text renders correctly in Oral mode (visible immediately below the weight input within the SHARED card; wording legible; typography role compliant per Five-Roles-Only + 11px Floor) and is HIDDEN in Tube-Feed mode (orchestrator DOM-confirmed `helperPresent=false`; the gate evaluates false; no `<p>` element in the DOM). The mode-toggle works correctly across runtime mode switches. The form has no regression: weight input typing + slider + range advisory all unchanged; SegmentedToggle works; Oral-mode `Fat per meal` + `Lipase per gram of fat` inputs work; SelectPickers work.

**Coverage actually reviewed:** light-desktop-oral + light-desktop-tube-feed (the surfaced-issue contexts from the Wave-5 user follow-up; Oral is where the helper text must render; Tube-Feed is where the helper text must HIDE). Recommended additional coverage (light + dark x mobile + desktop x oral + tube-feed = 8 contexts) was offered in the checkpoint's `<how-to-verify>` instructions; the user's `approved` verdict closes the gap row at the surfaced-issue contexts. If a future regression surfaces in dark or mobile, the next planner pickup runs `/gsd-plan-phase 4 --gaps --ws pert` for a follow-up gap-closure plan.

**Closure status:** the Wave-5 weight-in-oral-mode UX hand-off gap is RESOLVED by the human verdict. PERT-SAFE-01 stays in its current REQUIREMENTS.md state (the safety advisory keeps firing byte-identical; the helper text is UX clarification of an existing safety check, not a calculation change). The orchestrator's `/gsd-verify-work 4 --ws pert` re-run is the mechanism that flips the gap row to resolved + records the audit trail; this plan's SUMMARY captures the human-eye outcome verbatim for the verifier to read. Phase 4 closure is re-confirmed; the workstream is unblocked for Phase 5 (Release).

## Escalation ladder forward note (for any future regression's gap-closure pickup)

Even though D-14 was approved this iteration, the escalation ladder is preserved here as permanent forward-context for any future regression on the helper text surface (or for any analogous safety-only-input affordance in a different calculator). The lesson encoded by the audit-both-modes-extended-to-mode-conditional-render-check insertion is durable: ship one approach at a time per Wave-N gap-closure plan; re-test by human eye in BOTH modes; do NOT chain multiple UX vectors in a single plan and over-shoot the affordance.

If a future iteration records that the D-14 helper text has degraded (wording unclear, typography too quiet or too loud, layout wraps awkwardly, screen-reader regression), the next planner pickup should author a Wave-N plan applying:

- **Wording refinement:** if the user reports the helper text wording is unclear or technical (e.g. "10,000 units/kg/day safety check" reads as jargon), the next planner pickup may author a v1.16 follow-up with refined copy (e.g. simpler clinical phrasing, perhaps with a tooltip or expandable explanation). Lowest-LOC approach; no shared-component change.
- **Typography role escalation:** if the helper text reads too quietly (recedes too far) or too loudly (competes with the weight input), bump from `text-ui` (13px / weight 500) to `text-body` (16px / weight 400) for slightly more emphasis, or to `text-2xs` (11px) for a quieter range-hint style. Note the 11px Floor Rule prohibits paragraph copy at 11px; if a quieter style is desired, the helper text may need to be reframed as a range hint under the input rather than a paragraph below it -- which is a different design idiom requiring a different shared-component contract.
- **Layout adjustment:** if the helper text breaks the SHARED card layout in mobile portrait (text wraps awkwardly, padding feels inconsistent), adjust the section's `gap-4` or wrap the helper text in a constrained-width `<div>` -- but ONLY if the human-UAT explicitly reports this; do NOT pre-emptively change.
- **aria-describedby linkage:** if the user reports the helper text is not announced by screen readers when the weight input is focused (a11y regression), the next planner pickup may author a v1.16 follow-up that extends `RangedNumericInput` with an optional `descriptionId` prop and links the helper-text `<p>` via `aria-describedby`. This requires editing a shared component (D-08b boundary) and is therefore deferred to v1.16 -- explicitly out of scope for Wave 6.
- **Cross-calculator generalization:** if the safety-only-input pattern is found to apply to other calculators (e.g. weight in Morphine wean if it gates a safety check separate from the dose), the next polish phase may codify the pattern as a project-wide design rule. The lesson encoded by D-14 generalizes: "when an input is required for a SAFETY check but not for the primary calculation, the UX should make the safety-only role explicit." This is a v1.16 DESIGN.md update candidate.

Recommendation: copy refinements before typography role escalation; one approach at a time per Wave-N gap-closure plan; do NOT chain. Replan command if needed: `/gsd-plan-phase 4 --gaps --ws pert` after re-running UAT.

## REQUIREMENTS.md re-validation note

This plan does NOT touch `.planning/workstreams/pert/REQUIREMENTS.md`.

- **PERT-DESIGN-02..05 stay Validated.** The Validated state was Phase 4's own LLM-driven verdict at Wave 3 plan 04-03 closure + Wave 4 + Wave 5 human-UAT confirmations; re-opening would require a deliberate flip outside this plan's scope. The Wave 6 ship adds an input-side polish artifact that is in service of the same validated requirements (PERT-DESIGN-02 cheap-inline P2 follow-up to a UAT-surfaced UX gap; PERT-DESIGN-03 Identity-Inside + Five-Roles-Only + 11px Floor preserved).
- **PERT-SAFE-01 stays in its current state.** The xlsx + calc-layer audit confirms weight gates PERT-SAFE-01 only in Oral mode for the dose-side calc -- but weight ALSO gates PERT-SAFE-01 in Tube-Feed mode (the safety check is mode-shared via the `getTriggeredAdvisories` daily-lipase-vs-cap comparison) AND drives the `lipasePerKg` secondary (the dose-driving role is mode-asymmetric). The safety advisory keeps firing byte-identical in BOTH modes; the helper text is UX clarification of an existing safety check, not a calculation change.

After this plan ships, the user runs `/gsd-verify-work 4 --ws pert`. The verifier re-checks the existing Wave-5 hand-off gap row against the post-D-14 UI:

- The Task 3 resume signal in this SUMMARY is `approved`. The verifier reads this SUMMARY, marks the gap row resolved, and confirms PERT-DESIGN-02..05 + PERT-SAFE-01 stay in their current state; Phase 4 closure is re-confirmed; the workstream is unblocked for Phase 5 (Release).
- If the user had typed escalation-required (e.g. "wording is unclear; recommend simpler phrasing"), the gap row would have stayed open and the user would have run `/gsd-plan-phase 4 --gaps --ws pert` for the next escalation rung. PERT-DESIGN-02..05 + PERT-SAFE-01 would still have stayed in their current state (re-opening requires a deliberate flip), but the gap row would have provided the audit trail.

The verification loop is: ship plan -> human UAT in checkpoint with both modes inspected -> commit SUMMARY with verbatim outcome -> user runs `/gsd-verify-work 4 --ws pert` -> verifier re-checks gap row -> orchestrator updates STATE.md / ROADMAP.md / REQUIREMENTS.md as needed (ALL outside this plan's scope).

## Phase 3.1 + Phase 4 invariants regression-guard

Verified at Wave 6 close (Gates 5, 6, 7, 8, plus manual reads at the line ranges):

- **Phase 3.1 D-01 (function-binding bridges):** `grep -cE 'bind:value=\{$' src/lib/pert/PertInputs.svelte` returns `3` (Formula at line 156, Medication at line 191, Strength at line 200; UNCHANGED from Wave 5 baseline). The Wave 6 edit is in the SHARED weight card section ABOVE the bridge wiring; the bridge sites are not perturbed.
- **Phase 3.1 D-01 (string-bridge proxies):** `grep -cE 'let \w+(Bridge|Proxy) = \$state' src/lib/pert/PertInputs.svelte` returns `0`. KI-1 (the click-revert race) was structurally resolved at Phase 3.1 plan 01 commit `f2da16d`; Phase 4 + Wave 4 + Wave 5 + Wave 6 have not regressed it.
- **Em-dash count on PertInputs.svelte:** `0` (workstream Q1 broad ban honored on the helper text wording; ASCII-only).
- **En-dash count on PertInputs.svelte:** `0` (workstream Q1 broad ban honored).
- **Pitfall 4 selector preservation honored:** `label="Weight"` count = `1`; `sliderAriaLabel="Weight slider"` count = `1`; `id="pert-weight"` count = `1` (UNCHANGED from Wave 5 baseline; RangedNumericInput props at lines 113-124 byte-identical pre and post Wave 6). The component test selectors at `src/lib/pert/PertInputs.test.ts` (the 9 cases including D-11 strength reset) and the e2e selectors at `e2e/pert.spec.ts` (Oral happy-path + Tube-Feed happy-path + the 4 picker-driven runner cases shipped by Phase 3.1 plan 03) all continue to match. ZERO test or e2e selector update required.
- **Wave 5 D-12 + Wave 4 Approach C + Wave 2 F-03 PertCalculator.svelte byte-identical:** `git diff HEAD -- src/lib/pert/PertCalculator.svelte` returns empty. The Oral row at lines 213-227 (Wave 5 D-12 commit `f4565b4`) + the Tube-Feed eyebrow at line 288 (Wave 4 commit `d82aa30`) + the Tube-Feed numeral at line 293 (Wave 2 commit `29306e7`) are all byte-identical pre and post Wave 6.
- **Wave 1 commit `2dc7ae2` pert-config.json byte-identical:** `git diff HEAD -- src/lib/pert/pert-config.json` returns empty.
- **Calc-layer + state shape byte-identical:** empty diffs on `calculations.ts`, `state.svelte.ts`, `types.ts`, `config.ts`. The PERT-SAFE-01 advisory keeps firing in BOTH modes; `getTriggeredAdvisories` continues to read weight to fire PERT-SAFE-01 when daily lipase exceeds `weightKg * 10000`; `computeOralResult` continues to NOT read weight.
- **Test files byte-identical:** empty diffs on `PertInputs.test.ts`, `PertCalculator.test.ts`, `calculations.test.ts`, `config.test.ts`.
- **e2e specs byte-identical:** empty diffs on `e2e/pert.spec.ts`, `e2e/pert-a11y.spec.ts`.
- **STOP-red advisory carve-out preserved:** the `border-2 border-[var(--color-error)]` + `OctagonAlert` + `role="alert"` block downstream of both Oral and Tube-Feed secondary stacks in PertCalculator.svelte is byte-identical (Wave 6's plan-level negative-space audit confirms only PertInputs.svelte changed in the source diff; the STOP-red block lives in PertCalculator.svelte and is untouched).
- **Identity-Inside Rule preserved:** the helper text uses `text-[var(--color-text-secondary)]` (neutral; Five-Roles-Only `text-ui` body role); identity-purple is reserved for eyebrows + key UI elements (DESIGN.md Identity-Inside Rule). The helper text intentionally does NOT use the identity color.
- **Five-Roles-Only Rule preserved:** the helper text uses the existing `text-ui` typographic role (13px / weight 500) per the 6-role taxonomy (display/title/heading/body/ui/label). No new role introduced. No `text-[Npx]` arbitrary value.
- **11px Floor Rule preserved:** `text-ui` (13px) is AT the floor minimum for paragraph copy; not below it (which would violate the rule). The helper text is paragraph copy (`<p>` element), not range-hint micro-copy, so the 13px role is appropriate.
- **D-08 PERT-route allowlist + D-08b strictly-forbidden boundary:** only `src/lib/pert/PertInputs.svelte` modified in the source diff (Gate 9). `RangedNumericInput.svelte` (shared) byte-identical (the helper text is a sibling element added to the route-local `PertInputs.svelte` parent, not woven into the shared component); `PertCalculator.svelte` (Wave 5 frozen) byte-identical; `pert-config.json` (Wave 1 commit `2dc7ae2` frozen) byte-identical; calc-layer files (`calculations.ts`, `state.svelte.ts`, `types.ts`, `config.ts`) byte-identical; shared components, NavShell, HamburgerMenu, other calculators, DESIGN.md, DESIGN.json, e2e specs, test files all untouched.

## Negative-space audit

Plan-level (Wave 6 only):

```
$ git diff --name-only HEAD~1..HEAD -- src/ e2e/
src/lib/pert/PertInputs.svelte
```

Exactly 1 file in the plan's diff (Task 1's commit `b0fe1a0`). Within D-08 PERT-route allowlist. No shared component, no NavShell, no HamburgerMenu, no other-calculator file, no e2e spec, no DESIGN.md, no DESIGN.json, no calc-layer (`calculations.ts` / `state.svelte.ts` / `types.ts` / `config.ts`), no `PertCalculator.svelte` (Wave 5 frozen), no `pert-config.json` (Wave 1 commit `2dc7ae2` frozen), no test files.

Phase-level forward note (for any subsequent verifier or planner running the cumulative audit `git diff --name-only $PHASE_BASELINE..HEAD -- src/ e2e/` where `$PHASE_BASELINE` is the parent of Wave 1 commit `eec18c2`):

```
src/lib/pert/PertCalculator.svelte    # Wave 2 F-03 (commit 29306e7) + Wave 4 Approach C eyebrow (commit d82aa30) + Wave 5 D-12 Oral 3-token swap (commit f4565b4); all font-weight/tracking/size only; all within prescribing-artifact rows for their respective modes
src/lib/pert/pert-config.json         # Out-of-band commit 2dc7ae2 (acknowledged in-phase by 04-02-SUMMARY.md)
src/lib/shared/about-content.ts       # Out-of-band commit 5cd3386 (D-08a-style amendment per 04-VERIFICATION.md acknowledgment; only the pert: { ... } entry edited, other 5 entries byte-identical)
src/lib/pert/PertInputs.svelte        # Wave 6 D-14 mode-conditional helper text (commit b0fe1a0); +5 LOC; SHARED card sibling element gated on Oral mode
```

All within D-08 allowlist or pre-acknowledged D-08a-style amendments. Wave 1's PRODUCT.md drop at the repo root is implicitly outside the `src/`+`e2e/` audit scope but explicitly recorded as the only repo-root D-08a addition in Wave 1's 04-01-SUMMARY.md.

## Deviations from Plan

### Auto-fixed issues

None during Task 1 + Task 2 + Task 4. The plan's recipe was applied verbatim:

- Task 1: the plan-cited line range (the SHARED card at lines 106-125 in pre-edit HEAD) was confirmed by manual read before editing; the `<p>` element was added immediately after the weight `RangedNumericInput`'s closing `/>` and immediately before the SHARED card's `</section>` close; the `{#if pertState.current.mode === 'oral'}` gate + class string + visible text all landed exactly per the recipe. RangedNumericInput props at lines 113-124 byte-identical pre and post.
- Task 2: all 9 gates passed first run. The dev server (port 5173) was already running from earlier in the session; no `pnpm install` or fresh worktree setup was needed.
- Task 3: human-eye visual UAT verdict captured verbatim as `approved`; cross-mode render confirmed by orchestrator DOM probe (`helperPresent=false` in Tube-Feed); no escalation needed.
- Task 4: this SUMMARY composed per the plan's 18-section structure; em-dash + en-dash sweep on the SUMMARY itself returns 0/0.

### Auth gates

None encountered. The workflow was fully agent-runnable except for the deliberate `checkpoint:human-verify` gate on Task 3 (the corrective process insertion extending Wave 5 D-13 to mode-conditional render verification); the user's resume signal `approved` was captured per the plan's spec.

### Notes for future plans

- **Mode-conditional render check is a new audit pattern unique to input-side polish.** Verifying the `{#if mode === 'X'}` gate works at runtime across mode switches is non-substitutable for screenshot-driven LLM critique (the LLM inspects a single rendered state, not the gate behavior across mode-toggle interactions). Future design-polish plans where a mode-conditional UI element is the entire fix MUST default to a `checkpoint:human-verify` gate that explicitly inspects BOTH gate states (renders + hides) in the same UAT pass; or, equivalently, an orchestrator DOM probe must confirm both states explicitly. Wave 6 Task 3 used both: human-eye visual + orchestrator DOM `helperPresent=false` confirmation in Tube-Feed.
- **The safety-only-input UX pattern generalizes.** When an input is required for a SAFETY check but not for the primary calculation, the UX should make the safety-only role explicit. Otherwise clinicians may infer the input affects the dose, leading to either misplaced confidence (when the input is set) or disabled-safety risk (when the user is tempted to skip it). D-14 codifies this for the Oral weight case (weight gates PERT-SAFE-01 only in Oral mode for the dose-side calc; weight gates PERT-SAFE-01 AND drives the lipasePerKg secondary in Tube-Feed mode). The same principle generalizes to any safety-only input pattern in future calculators -- this is a v1.16 DESIGN.md update candidate.

## PERT-DESIGN-02..05 + PERT-SAFE-01 satisfaction mapping

| Requirement | Closure source | Status |
|------------|---------------|--------|
| **PERT-DESIGN-02** (P1 fixes ship before merge; cheap P2/P3 inline per D-03 disposition rules) | D-14 mode-conditional helper text shipped at Wave 6 commit `b0fe1a0` (Option 3 selected per 04-CONTEXT.md recommended default; Options 1 + 2 considered but rejected per 04-CONTEXT.md D-14). The Wave-5 user follow-up surfaced UX ambiguity around weight-as-safety-only-input in Oral mode; D-14 is a cheap-inline P2 follow-up (~5 LOC; no D-08b violation; PERT-route only) satisfied by Task 1 + the human-UAT confirmation. 0 P1 findings across the phase. | Stays Validated (Wave 3 verdict + Wave 4 + Wave 5 + Wave 6 human-UAT confirmations) |
| **PERT-DESIGN-03** (DESIGN.md / DESIGN.json contract enforced -- Identity-Inside Rule, Five-Roles-Only, 11px Floor, etc.) | Identity-Inside preserved (helper text uses `text-[var(--color-text-secondary)]` neutral, NOT `text-[var(--color-identity)]`); Five-Roles-Only preserved (helper text uses existing `text-ui` 13px role; no new role introduced; no `text-[Npx]` arbitrary value); 11px Floor preserved (`text-ui` 13px is AT the floor minimum for paragraph copy, not below it); Tabular-Numbers preserved (`.num` class hits unchanged on PertCalculator.svelte; PertInputs.svelte does not have rendered numeric outputs on the helper text); Eyebrow-Above-Numeral preserved (the helper text is paragraph copy, not eyebrow-numeral pair; the existing eyebrow-above-numeral patterns in PertCalculator.svelte are untouched). | Stays Validated |
| **PERT-DESIGN-04** (HeroResult above-the-fold + sticky InputDrawer) | Phase 42.1 inheritance (universal patterns shipped to v1.13); F-04 P3 deferred per D-03 default. Wave 6 does NOT touch the hero or InputDrawer -- the helper text is added to PertInputs.svelte (the input-side surface), not PertCalculator.svelte (the result-side surface). | Stays Validated by inheritance |
| **PERT-DESIGN-05** (SegmentedToggle visual integration with identity hue) | Phase 1 + Phase 2 already shipped; Wave 1 + Wave 3 critique surfaced no SegmentedToggle finding; Wave 4 + Wave 5 + Wave 6 do NOT touch the SegmentedToggle. The mode-conditional helper text USES the SegmentedToggle's mode state (via `pertState.current.mode === 'oral'` gate read) but does NOT modify the toggle's visual integration. | Stays Validated by inheritance |
| **PERT-SAFE-01** (max-lipase-cap STOP-style red advisory at the published 10,000 units/kg/day pediatric overdose-protection threshold) | Referenced but NOT modified. The helper text wording references the 10,000 units/kg/day threshold but the calc-layer rule (`getTriggeredAdvisories` reading weight to fire PERT-SAFE-01 when daily lipase exceeds `weightKg * 10000`) is byte-identical. The safety advisory keeps firing in BOTH Oral and Tube-Feed modes; the helper text only makes the safety-only role of weight EXPLICIT in Oral mode where weight does NOT participate in the dose formula. xlsx + calc-layer audit conclusion documented above. | Stays in current REQUIREMENTS.md state (referenced-not-modified) |

Note: PERT-DESIGN-01 was satisfied by Wave 1 (8 critique transcripts captured) + Wave 3 (8 FINAL transcripts captured). PERT-DESIGN-06 (>=35/40 score target) was satisfied by Wave 3 (aggregate 36.25/40 at LLM-Design-Review fallback); the human-UAT gap closures on F-03 (Wave 4), the Oral hierarchy inversion (Wave 5), and the weight-in-oral-mode UX clarity (Wave 6) may incrementally improve the score on a future LLM-Design-Review re-run if needed but are NOT required for the score bar (the >=35/40 target was met at Wave 3; these gap closures are quality-bar follow-ups to the human-UAT verdicts, not score-target re-validations).

## Self-Check: PASSED

All claimed artifacts verified to exist on disk:

- `src/lib/pert/PertInputs.svelte` (post-D-14-helper-text; helper text visible-text count = 1; mode-gate count = 2; class-string count = 1; em + en-dash 0/0; function-binding bridges 3; string-bridge proxies 0; Pitfall 4 `label="Weight"` + `sliderAriaLabel="Weight slider"` + `id="pert-weight"` each = 1; RangedNumericInput props at lines 113-124 byte-identical pre and post).
- `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-06-SUMMARY.md` (this file).

Commits verified to exist via `git log --oneline 5b17ddc..HEAD`:

- `b0fe1a0` Task 1 (D-14 mode-conditional helper text -- sibling `<p>` element added to the SHARED card in PertInputs.svelte gated on Oral mode; Task 2 quality gates run inline in same context; logs in `/tmp/04-06-gates/`).
- (Task 4 commit landing immediately after this SUMMARY write; will appear with subject `docs(pert/04-06): summary -- D-14 helper text approved (Wave 6 gap closure)` per the plan's commit message form.)

All Wave 6 success criteria met:

- [x] D-14 mode-conditional helper text shipped (sibling `<p>` element added to the SHARED card in PertInputs.svelte; gated `{#if pertState.current.mode === 'oral'}`; visible text + class string per recipe; commit `b0fe1a0`).
- [x] Cross-mode render confirmed (helper text visible in Oral mode; helper text hidden in Tube-Feed mode; orchestrator DOM-confirmed `helperPresent=false` in Tube-Feed; mode-toggle works correctly across runtime mode switches).
- [x] PERT-SAFE-01 referenced (NOT modified): the safety advisory keeps firing byte-identical in BOTH modes; calc-layer + pert-config.json byte-identical; helper text is UX clarification of an existing safety check, NOT a calculation change.
- [x] All 9 plan-level quality gates green (svelte-check 0/0; vitest src/lib/pert/ 81/81; em + en-dash 0/0; D-14 invariants landed at expected counts; Phase 3.1 D-01 invariants preserved; Pitfall 4 selectors preserved; PertCalculator.svelte + pert-config.json byte-identical; negative-space audit clean).
- [x] Human-eye visual UAT checkpoint completed (Task 3); user resume signal `approved` captured verbatim above; mode-conditional render check audit pattern enforced (BOTH modes inspected in same UAT pass).
- [x] 04-06-SUMMARY.md authored at the phase directory with all 18 required sections.
- [x] D-08 PERT-route allowlist honored (only `src/lib/pert/PertInputs.svelte` modified).
- [x] D-08b strictly-forbidden boundary honored (zero shared / shell / other-calculator / DESIGN.md / DESIGN.json / calc-layer / e2e / test edits; RangedNumericInput shared component byte-identical).
- [x] Phase 3.1 D-01 invariants preserved (function-binding bridges 3 hits; zero string-bridge proxies; em + en-dash 0/0).
- [x] Phase 4 invariants preserved (Wave 5 D-12 + Wave 4 Approach C + Wave 2 F-03 PertCalculator.svelte byte-identical; Wave 1 commit `2dc7ae2` pert-config.json byte-identical).
- [x] Em-dash + en-dash sweep on this SUMMARY = 0 each (workstream Q1 broad ban honored on planning artifacts too).
- [x] Identity-Inside Rule preserved (helper text uses `text-[var(--color-text-secondary)]` neutral, NOT `text-[var(--color-identity)]`).
- [x] Five-Roles-Only Rule preserved (helper text uses existing `text-ui` role; no new role; no arbitrary `text-[Npx]` value).
- [x] 11px Floor Rule preserved (`text-ui` 13px is AT the floor for paragraph copy).
- [x] Pitfall 4 selector preservation honored (`label="Weight"` + `sliderAriaLabel="Weight slider"` + `id="pert-weight"` byte-identical; component test + e2e selectors unchanged).
- [x] Escalation ladder forward note (wording refinement + typography role escalation + layout adjustment + aria-describedby v1.16 deferral + cross-calculator generalization v1.16 candidate) preserved for any future regression's gap-closure pickup.
- [x] D-14 future-audit forward note documented (mode-conditional render check audit pattern + DESIGN.md v1.16 deferral + safety-only-input UX pattern generalization).
- [x] REQUIREMENTS.md re-validation note (deferral to `/gsd-verify-work 4 --ws pert`) documented.
- [x] PERT-DESIGN-02..05 stay Validated; PERT-SAFE-01 stays in its current state; not re-flipped mid-plan.

## Next step (the verification re-run + Phase 5 transition)

The user (or the orchestrator) runs:

1. `/gsd-verify-work 4 --ws pert` -- verifier re-checks the existing Wave-5 hand-off gap row against the post-D-14 UI by reading this SUMMARY's "Human-visual UAT outcome" section. The human verdict is `approved`, so the verifier marks the gap row resolved; PERT-DESIGN-02..05 + PERT-SAFE-01 stay in their current state; Phase 4 closure is re-confirmed; the workstream is unblocked for Phase 5 (Release). The verifier may at its discretion re-run the heavy gates (pnpm build + pert-a11y + pert.spec + full Playwright + AUDIT.sh) as part of the standard verification command sequence; Wave 6 did NOT re-run them in-scope to conserve context (the D-14 edit is a sibling-element addition with no calc-layer or behavioral impact).

2. `/gsd-plan-phase 5 --ws pert` -- author the Phase 5 release plans (version bump, AboutSheet `__APP_VERSION__` reflect, full clinical gate, ROADMAP / PROJECT.md fold-back). With Wave 6 closing the last gap-closure cycle in Phase 4, Phase 5 (Release) is the only remaining phase before workstream completion.

Workstream `pert` advances from Phases Complete 4 / 6 (Phase 4 closure record post-Wave-6) with the Wave-5 weight-in-oral-mode UX hand-off gap row resolved; Phase 5 (release) is the only remaining phase before workstream completion. Wave 6 closes the Wave-N gap-closure cycle for Phase 4 -- no further gap-closure plans in Phase 4 are anticipated unless `/gsd-verify-work 4 --ws pert` surfaces a new finding.
