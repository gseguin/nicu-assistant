# Phase 4 /impeccable Critique Findings (Wave 1)

**Generated:** 2026-04-26
**Source:** 8 /impeccable critique transcripts (04-CRITIQUE-*.md) + 04-DETECT.json deterministic CLI scan
**Triage policy:** CONTEXT D-02 (severity rubric) + D-03 (disposition rules); UI-SPEC "Triage + Score Acceptance"
**Tooling note:** Per Wave 1 deviation, the 8 critique transcripts were authored as manual Nielsen-10 LLM-Design-Review fallback (orchestrator setup note #9) against Playwright snapshots; the `/impeccable` skill was not available in the agent runtime. Each transcript carries an explicit fallback note. The CLI deterministic scan (Assessment B) ran natively via `npx -p impeccable@latest impeccable detect --json` and returned `[]` (clean).

## Per-context Design Health Scores (Nielsen 10 x 0-4 = /40)

| # | Theme | Viewport | Mode      | Score | Rating    | Status |
|---|-------|----------|-----------|-------|-----------|--------|
| 1 | light | mobile   | Oral      | 36/40 | Excellent | OK     |
| 2 | light | mobile   | Tube-Feed | 36/40 | Excellent | OK     |
| 3 | light | desktop  | Oral      | 36/40 | Excellent | OK     |
| 4 | light | desktop  | Tube-Feed | 35/40 | Good      | OK     |
| 5 | dark  | mobile   | Oral      | 36/40 | Excellent | OK     |
| 6 | dark  | mobile   | Tube-Feed | 36/40 | Excellent | OK     |
| 7 | dark  | desktop  | Oral      | 35/40 | Good      | OK     |
| 8 | dark  | desktop  | Tube-Feed | 35/40 | Good      | OK     |
| **Aggregate (mean of 8 successful)** | n/a | n/a | n/a | **35.6/40** | Good | n/a |
| **>=35/40 contexts**                  | n/a | n/a | n/a | **8/8**     | (target: >=6/8) | PASS |

Blocked contexts (Pitfall 2): 0/8. All 8 transcripts emit a valid Design Health Score table.

## Findings Triage Table

| id   | context           | severity | description                                                                                                                                                                                                                                                                                                                                                                            | proposed fix                                                                                                                                          | disposition | DESIGN.md rule | LOC est. | files affected                                  |
|------|-------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|----------------|----------|-------------------------------------------------|
| F-01 | 1, 2, 3, 4, 5, 6, 7, 8 | P2       | Range hints under NumericInput render a literal en-dash (U+2013) in the template `${min}<U+2013>${max}${unit}`. Visible as `0.3-80 kg`, `0-3000 mL`, `500-4000 units/g`, `0-200 g` in PERT inputs (and equivalently in every other calculator). Workstream Q1 broad ban prohibits en-dashes in user-rendered strings.                                                                       | Replace U+2013 with ASCII hyphen at `src/lib/shared/components/NumericInput.svelte:76`. ~1 LOC.                                                       | defer       | n/a (workstream Q1 content rule, not a DESIGN.md named rule) | 1        | src/lib/shared/components/NumericInput.svelte   |
| F-02 | 3, 4, 7, 8        | P2       | NavShell sticky-header row renders as a translucent overlay that visually crosses the page subtitle "Capsule dosing oral & tube-feed modes" at desktop viewport on scroll-top. Z-index/layering or sticky-offset issue. Theme-agnostic (light + dark both affected); calculator-agnostic (would affect Feeds, Formula, GIR, Morphine, UAC-UVC equally).                                  | Investigate NavShell sticky-header z-index + page-content top-padding offset. Likely shared CSS in NavShell.                                          | defer       | n/a            | 5-15     | src/lib/shell/NavShell.svelte                   |
| F-03 | 2, 4, 6, 8        | P2       | Tube-Feed mode renders 4 secondary outputs (Total fat / Total lipase / Lipase per kg / Capsules per month) at visually equal weight (text-title font-bold). Per UI-SPEC Watch Item 5, the prescribing artifact (Capsules per month) should be findable faster than the 3 derived figures. Eyebrow color change is forbidden per Identity-Inside; a font-weight bump is allowed.            | In `src/lib/pert/PertCalculator.svelte` Tube-Feed branch line ~285-299: bump the Capsules-per-month numeral or eyebrow weight (font-extrabold or +tracking). | fix-now     | n/a            | 1-3      | src/lib/pert/PertCalculator.svelte              |
| F-04 | 1, 2              | P3       | Mobile (375x667) InputDrawer trigger card sits between page subtitle and hero card; with Weight + Fat + Lipase populated the trigger card is ~150 px tall, pushing the hero card top to ~y=389 (~58% of viewport height). The result numeral occupies less than the top 60% of viewport above-the-fold post-input.                                                                       | Phase 2 D-04 layout decision; addressing would require shared-component edit (InputDrawer or +page.svelte shell layout).                              | defer       | PERT-DESIGN-04 | n/a      | src/routes/pert/+page.svelte (allowed-with-restriction); src/lib/shared/components/InputDrawer.svelte (forbidden) |
| F-05 | 3                 | P3       | Sticky aside on desktop fills its column even when the longest field is shorter; could tighten the aside max-width to reduce visual weight.                                                                                                                                                                                                                                              | Layout in src/routes/pert/+page.svelte. Greater than 5 LOC layout work.                                                                                | defer       | n/a            | >5       | src/routes/pert/+page.svelte                    |
| F-00 | n/a (deterministic CLI scan) | n/a   | npx impeccable detect --json against 3 PERT route source files returned `[]` (empty array). Static surface clean of 25 deterministic anti-pattern patterns (gradient text, side-stripe borders, glassmorphism, hero-metric template-fillers, identical card grids, etc.).                                                                                                                | n/a (no findings to fix).                                                                                                                              | n/a         | n/a            | 0        | n/a                                             |

## Auto-disposition rationale (per CONTEXT D-03 + UI-SPEC "Triage + Score Acceptance")

- **F-01:** P2; 1 LOC; touches `src/lib/shared/components/NumericInput.svelte` (D-08b strictly forbids edits to shared components per Watch Item 6 + Pitfall 5 forced-defer). Auto-defer with rationale: "cross-calculator backlog per CONTEXT D-08b + UI-SPEC Watch Item 6". This is the ONE finding most worth flagging cross-calculator: it is a workstream-Q1-ban violation rendered live in every calculator that uses NumericInput. Recommended: file as a separate cross-calculator hotfix issue for the v1.15.x window.
- **F-02:** P2; touches `src/lib/shell/NavShell.svelte` (D-08b forbidden). Auto-defer with rationale: "cross-calculator NavShell layering; shared component edit forbidden". Cross-calculator backlog.
- **F-03:** P2; 1-3 LOC; touches `src/lib/pert/PertCalculator.svelte` (PERT-route allowlist per D-08; cheap-inline rule per D-03 satisfied: `<=5 LOC` + PERT-route only). Auto-disposition: **fix-now**.
- **F-04:** P3; touches shared components or +page.svelte shell layout in non-trivial way. Auto-defer per D-03 default for P3.
- **F-05:** P3; 5+ LOC layout work. Auto-defer.
- **F-00:** Informational; CLI scan baseline. Not a fix candidate.

**Pitfall 5 forced-defer guard verified:** No row pairs `disposition=fix-now` with `files affected` containing `src/lib/shared/components/`. F-03 is fix-now and touches PERT-route only (PertCalculator.svelte). F-01 and F-02 are correctly auto-deferred for shared-component touch.

## Aggregate disposition counts

| Severity | fix-now | defer | wontfix | total |
|----------|---------|-------|---------|-------|
| P1       | 0       | 0     | 0       | 0     |
| P2       | 1 (F-03)| 2 (F-01, F-02) | 0 | 3     |
| P3       | 0       | 2 (F-04, F-05) | 0 | 2     |
| **Total** | **1**   | **4** | **0**   | **5** |

Plus 1 informational row (F-00).

## Wave 2 plan recommendation

Per CONTEXT D-07a replan beat, Wave 2 plan count is determined by the fix-now P1 + cheap-P2 finding distribution:

- **fix-now findings to ship in Wave 2:** 0 P1 + 1 cheap-P2 = 1 total (F-03 only).
- **Files affected by fix-now findings:** `src/lib/pert/PertCalculator.svelte` (1 file).
- **Recommended Wave 2 plan count:** **1 plan** covering F-03 (Tube-Feed 4-secondaries hierarchy bump). Per CONTEXT D-07 / D-07a: 1-3 fix-now findings in 1-2 files = 1 Wave 2 plan.
- **Plan scope sketch for the orchestrator's `/gsd-plan-phase 4 --gaps --ws pert` invocation:**
  - Edit `src/lib/pert/PertCalculator.svelte` Tube-Feed branch lines ~285-299 (Capsules per month row). Apply font-weight or tracking bump on the numeral OR the eyebrow text to make capsulesPerMonth visually distinct from sibling rows. Eyebrow color change is forbidden per Identity-Inside Rule.
  - Optionally also bump the eyebrow tracking (already `tracking-wide`; could increase to `tracking-wider` for additional visual weight without color change).
  - 1-3 LOC. PERT-route only.
  - **Pitfall 4 selector update reminder:** F-03 does NOT change a string that `e2e/pert.spec.ts` queries via getByRole/getByText. The numeral text "120" and the eyebrow "Capsules per month" remain unchanged. No e2e selector update required.
  - **Acceptance:** post-fix, the Capsules-per-month row reads visually distinct from the 3 derived rows in all 4 tube-feed contexts (Wave 3 re-runs the 8-context sweep and verifies).
- **Alternative: SKIP Wave 2.** F-03 is a Watch Item 5 polish enhancement, not a DESIGN.md named-rule violation. The aggregate score is already 35.6/40 with all 8 contexts at >=35/40. The user/orchestrator may choose to defer F-03 to a v1.16 polish increment and advance directly to Wave 3 (verification). This decision belongs to the user.

## Cross-calculator backlog seeded by Wave 1

Two cross-calculator findings were forced-deferred by Pitfall 5 + D-08b. They should be tracked outside Phase 4:

1. **NumericInput en-dash hotfix (F-01):** ~1 LOC change in `src/lib/shared/components/NumericInput.svelte:76`. Workstream Q1 broad ban violation. Recommended: file as v1.15.x hotfix (post-Phase-5 release) OR include in a v1.16 cross-calculator polish phase. Whichever arm, the fix touches all 6 calculators by virtue of being in a shared component. Estimated cycle: 1 plan, 1 commit (ASCII hyphen replacement + zero-regression sweep on the e2e suite, since some specs may grep for the en-dash literal).
2. **NavShell sticky-overlay layering (F-02):** ~5-15 LOC investigation in `src/lib/shell/NavShell.svelte`. Z-index or sticky-offset issue; affects all 6 calculators at desktop viewport. Recommended: v1.16 cross-calculator polish phase (not a release-blocker for v1.15 since the issue is mild and pre-existed Phase 4).

Neither finding affects the v1.15 PERT release-readiness gate (no P1, no clinical-trust regression, no DESIGN.md named-rule violation).
