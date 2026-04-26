---
phase: 4
plan: 2
subsystem: pert/design-polish-impeccable
workstream: pert
milestone: v1.15
wave: 2
tags: [pert, design-polish, gap-closure, wave-2, f-03]
dependency_graph:
  requires:
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-01-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-FINDINGS.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CONTEXT.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-UI-SPEC.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-02-PLAN.md
  provides:
    - src/lib/pert/PertCalculator.svelte (post-F-03-fix; Tube-Feed Capsules per month numeral bumped to font-extrabold)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-02-SUMMARY.md (this file)
  affects:
    - .planning/workstreams/pert/STATE.md (orchestrator updates after worktree merge; NOT touched by Wave 2)
    - .planning/workstreams/pert/ROADMAP.md (orchestrator updates after worktree merge; NOT touched by Wave 2)
    - .planning/workstreams/pert/REQUIREMENTS.md (Wave 3 closes PERT-DESIGN-02..05; NOT touched by Wave 2)
tech_stack:
  added: []
  patterns:
    - "Approach A recipe (smallest-diff visual hierarchy bump): single token swap font-bold -> font-extrabold on a single numeral span; sibling rows untouched; Identity-Inside Rule preserved (eyebrow color token text-[var(--color-identity)] unchanged)."
key_files:
  created:
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-02-SUMMARY.md
  modified:
    - src/lib/pert/PertCalculator.svelte
decisions:
  - "Chose Approach A (numeral font-bold -> font-extrabold) per 04-02-PLAN.md preferred recipe. 1 token swap, 0 LOC delta. The font-bold -> font-extrabold step is a clear typographic weight escalation that makes Capsules per month visually distinct from the 3 sibling derived rows (Total fat / Total lipase / Lipase per kg) without requiring an eyebrow tracking change. Approach C (both numeral + eyebrow) deemed unnecessary at this stage; Wave 3 critique re-run will confirm the bump suffices and may escalate to Approach C if not."
  - "Out-of-band commit 2dc7ae2 (fix(pert): align weight slider range with other calculators (max 10 kg)) is acknowledged as in-phase scope, NOT scope creep. Single-line config change in src/lib/pert/pert-config.json: weightKg.max 80 -> 10. Aligns with feeds/gir/morphine/uac-uvc cross-calculator pattern. Calc-layer untouched (NumericInput min/max is advisory-only per v1.6; never auto-clamps). 81/81 PERT vitest preserved at the time of the commit. Phase 4 design-polish phase explicitly covers PERT-route alignment with cross-calculator UI norms; this commit fits the phase scope."
  - "D-08b forced-defer for Wave 1 cross-calculator findings F-01 (NumericInput en-dash, ~1 LOC at src/lib/shared/components/NumericInput.svelte:76) and F-02 (NavShell sticky-overlay, ~5-15 LOC in src/lib/shell/NavShell.svelte) carried forward as cross-calculator backlog. Both P2; both touch shared components per Pitfall 5 + D-08b; both forced-deferred regardless of LOC. Recommended carrier: F-01 v1.15.x hotfix; F-02 v1.16 cross-calculator polish phase. Neither blocks v1.15 PERT release-readiness."
  - "Phase 3.1 invariants regression-guard verified intact: function-binding bridges 3 hits in PertInputs.svelte (medication / strength / formula); zero string-bridge proxies; em-dash + en-dash count 0/0 on PertCalculator.svelte; tabular-numerals 9 hits on PertCalculator.svelte; STOP-red advisory carve-out untouched (border-2 border-[var(--color-error)] + OctagonAlert + role=alert at lines ~310-322 in PertCalculator.svelte byte-identical aside from Capsules per month row offset shift caused by the 1-line comment expansion at line 284)."
metrics:
  duration_minutes: 12
  completed_date: 2026-04-26
  tasks_completed: 3
  files_created: 1
  files_modified: 1
  commits: 2
  loc_changed: 4
  font_extrabold_count: 1
  font_bold_count: 6
  num_class_count: 9
  function_binding_count: 3
  string_bridge_proxies: 0
  em_dash_count: 0
  en_dash_count: 0
---

# Phase 4 Plan 02 Summary: F-03 Capsules-per-month Visual Hierarchy Bump (Wave 2)

**Phase:** 04-design-polish-impeccable
**Plan:** 04-02 (Wave 2 -- gap closure)
**Generated:** 2026-04-26

Wave 2 ships the single fix-now finding from the Wave 1 critique sweep (F-03), bumping the Tube-Feed `Capsules per month` numeral from `font-bold` to `font-extrabold` to elevate the prescribing artifact visually above the 3 derived secondary rows (Total fat / Total lipase / Lipase per kg) per UI-SPEC Watch Item 5. The edit is a single token swap on a single span (PERT-route only, ~1 LOC delta) and preserves the Identity-Inside Rule (eyebrow color token `text-[var(--color-identity)]` unchanged) and Pitfall 4 selector preservation (visible text `Capsules per month` and the numeral expression `tubeFeedResult.capsulesPerMonth.toLocaleString('en-US')` both verbatim; zero e2e selector update required). The out-of-band commit `2dc7ae2` (weight slider range alignment) is acknowledged here as in-phase scope (NOT scope creep). The two cross-calculator findings F-01 (NumericInput en-dash) and F-02 (NavShell sticky-overlay) remain D-08b forced-deferred to a v1.15.x hotfix and the v1.16 cross-calculator polish phase respectively.

## What this plan shipped

1. **F-03 fix at `src/lib/pert/PertCalculator.svelte`** (Task 1, commit `29306e7`).
   - Edit site: line 293 (Tube-Feed `Capsules per month` row, originally lines 284-299 baseline; the `Capsules per month` block now spans lines 284-299 in HEAD with the fix applied at the numeral `<span>`).
   - Recipe chosen: **Approach A** (numeral font-weight bump; smallest-diff recipe per 04-02-PLAN.md preferred form).
   - Before:
     ```svelte
     <span class="num text-title font-bold text-[var(--color-text-primary)]">
         {tubeFeedResult.capsulesPerMonth.toLocaleString('en-US')}
     </span>
     ```
   - After:
     ```svelte
     <span class="num text-title font-extrabold text-[var(--color-text-primary)]">
         {tubeFeedResult.capsulesPerMonth.toLocaleString('en-US')}
     </span>
     ```
   - Diff: `font-bold` -> `font-extrabold` on the numeral span only. The HTML comment was expanded from `<!-- Capsules per month -->` to `<!-- Capsules per month (F-03: extra-bold to elevate prescribing artifact above derived siblings; Identity-Inside preserved). -->` to record the fix-rationale inline.
   - Gross diff: 1 file changed, 2 insertions, 2 deletions (the numeral class + the comment annotation).
   - Sibling rows (Total fat / Total lipase / Lipase per kg) untouched: still `<span class="num text-title font-bold text-[var(--color-text-primary)]">`. The hierarchy bump is asymmetric BY DESIGN.
   - The eyebrow `<div class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase">` is unchanged. Identity-Inside Rule preserved (color token `text-[var(--color-identity)]` reserved for inside-the-route surfaces only; chrome untouched).

2. **04-02-SUMMARY.md** (this file, Task 3).

## Out-of-band commit acknowledgment (commit 2dc7ae2)

- **Commit SHA:** `2dc7ae2`
- **Subject:** `fix(pert): align weight slider range with other calculators (max 10 kg)`
- **Author:** Ghislain Seguin
- **Date:** 2026-04-25
- **File touched:** `src/lib/pert/pert-config.json` (1 line: `weightKg.max: 80 -> 10`)
- **In-phase rationale:** aligns the PERT weight advisory with the cross-calculator pattern (feeds/gir/morphine/uac-uvc all use `weightKg: { min: 0.3, max: 10, step: 0.1 }`); calc-layer untouched (NumericInput min/max is advisory-only per v1.6; never auto-clamps); 81/81 PERT vitest preserved at the time of the commit.
- **Phase 4 scope claim:** this commit is part of the Phase 4 design-polish phase, NOT scope creep. It is a user-directed PERT-route fix that landed mid-phase (after Wave 1 critique sweep started, before Wave 2 fix plan was authored). The Wave 3 verifier will see this commit in the phase-level negative-space audit (`git diff --name-only $BASELINE..HEAD -- src/ e2e/`) returning two files: `src/lib/pert/PertCalculator.svelte` (Wave 2, this plan) + `src/lib/pert/pert-config.json` (commit 2dc7ae2). Both files are within D-08 PERT-route allowlist; no D-08a or D-08b boundary breach.

Wave 2 does NOT re-edit `pert-config.json`. Verified Gate 6 (`git diff HEAD -- src/lib/pert/pert-config.json` returns empty); the most recent commit touching the file is `2dc7ae2`.

## Quality gates (Wave 2 plan-level)

The 7 fast-feedback gates from Task 2 (the heavy gates -- pnpm build, pert-a11y, pert.spec, full Playwright, 8-context FINAL critique sweep, AUDIT.sh -- are deferred to Wave 3 per UI-SPEC §"Pre-design-polish gates" + D-07 wave structure):

| Gate | Command | Result |
|------|---------|--------|
| 1 svelte-check | `pnpm run check` | `4586 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` (i.e. 0 errors / 0 warnings; Phase 3.1 baseline preserved) |
| 2 vitest (PERT subset) | `pnpm exec vitest run src/lib/pert/` | `Test Files 5 passed (5); Tests 81 passed (81)` (Phase 3.1 PERT baseline preserved; PertCalculator.test.ts + PertInputs.test.ts + calculations.test.ts + config.test.ts + the integration spec sum to 81) |
| 3 em-dash + en-dash sweep | `grep -cP '\x{2014}' src/lib/pert/PertCalculator.svelte` AND `grep -cP '\x{2013}' src/lib/pert/PertCalculator.svelte` | both `0` |
| 4 tabular-numerals (`.num` class hits >= 5) | `grep -cE 'class="[^"]*\bnum\b' src/lib/pert/PertCalculator.svelte` | `9` (>= 5; UI-SPEC Gate 12 satisfied) |
| 5 function-binding bridges (>= 3) + string-bridge proxies (= 0) | `grep -cE 'bind:value=\{$' src/lib/pert/PertInputs.svelte` AND `grep -cE 'let \w+(Bridge\|Proxy) = \$state' src/lib/pert/PertInputs.svelte` | bridges `3`, proxies `0` (Phase 3.1 D-01 invariants preserved) |
| 6 pert-config.json byte-identical against HEAD | `git diff HEAD -- src/lib/pert/pert-config.json` | empty (commit 2dc7ae2 already in HEAD; Wave 2 does NOT re-edit) |
| 7 plan-level negative-space audit | `git diff --name-only HEAD~1..HEAD -- src/ e2e/` | `src/lib/pert/PertCalculator.svelte` (exactly 1 line) |

All 7 gates PASS. Gate logs captured at `/tmp/04-02-gates/gate-NN-*.log` (transient; not committed).

## D-08b forced-defer for F-01 + F-02 (cross-calculator backlog seeded by Wave 1)

Both findings touch shared components and are forced-deferred per Pitfall 5 + D-08b regardless of severity or LOC. Wave 2 does NOT auto-fix these; they are tracked outside Phase 4.

1. **F-01 (NumericInput en-dash hotfix):** ~1 LOC change in `src/lib/shared/components/NumericInput.svelte:76`. The component template renders the input range as `${min}<U+2013>${max}${unit}` (en-dash separator) which violates the workstream Q1 broad ban on U+2013 in user-rendered strings. Visible as `0.3-80 kg`, `0-3000 mL`, `500-4000 units/g`, `0-200 g` in PERT inputs (and equivalently in every other calculator that uses NumericInput). Recommended carrier: v1.15.x hotfix (post-Phase-5 release) OR include in a v1.16 cross-calculator polish phase. Whichever arm, the fix touches all 6 calculators by virtue of being in a shared component. Estimated cycle: 1 plan, 1 commit (ASCII hyphen replacement + zero-regression sweep on the e2e suite, since some specs may grep for the en-dash literal).

2. **F-02 (NavShell sticky-overlay layering):** ~5-15 LOC investigation in `src/lib/shell/NavShell.svelte`. The sticky-header row renders as a translucent overlay that visually crosses the page subtitle "Capsule dosing oral & tube-feed modes" at desktop viewport on scroll-top. Z-index or sticky-offset issue; theme-agnostic; calculator-agnostic (would affect Feeds, Formula, GIR, Morphine, UAC-UVC equally). Recommended carrier: v1.16 cross-calculator polish phase (not a release-blocker for v1.15 since the issue is mild and pre-existed Phase 4).

3. **F-04, F-05 (P3 deferred per D-03 default):** documented in 04-FINDINGS.md; no Wave 2 action. F-04 is a hero-owns-viewport regression when the InputDrawer trigger pushes the hero down; addressing requires shell layout edits (D-08b boundary). F-05 is a desktop sticky-aside max-width tightening; >5 LOC layout work in `+page.svelte`.

Neither finding affects the v1.15 PERT release-readiness gate (no P1, no clinical-trust regression, no DESIGN.md named-rule violation).

## Phase 3.1 invariants regression-guard

Verified at Wave 2 close (Gate 5 + Gate 3 + Gate 4 + manual reads):

- **Function-binding bridges:** `grep -cE 'bind:value=\{$' src/lib/pert/PertInputs.svelte` returns `3` (medication / strength / formula pickers each use the Svelte 5.9+ getter+setter object-literal binding shape per Phase 3.1 D-01). >= 3 expected; passes.
- **String-bridge proxies:** `grep -cE 'let \w+(Bridge\|Proxy) = \$state' src/lib/pert/PertInputs.svelte` returns `0`. KI-1 (the click-revert race) was structurally resolved at Phase 3.1 plan 01 commit `f2da16d`; Phase 4 has not regressed it.
- **Em-dash count on PertCalculator.svelte:** `0` (workstream Q1 broad ban honored).
- **En-dash count on PertCalculator.svelte:** `0` (workstream Q1 broad ban honored).
- **Tabular-numerals on PertCalculator.svelte:** `9` hits of `class="[^"]*\bnum\b` (Phase 2 baseline preserved; the F-03 edit changed font-weight class only, not the `.num` class assignment).
- **STOP-red advisory carve-out preserved:** the `border-2 border-[var(--color-error)]` + `OctagonAlert` + `role="alert"` block at PertCalculator.svelte lines ~310-322 is byte-identical (Wave 2's plan-level negative-space audit confirms only the Capsules per month numeral span and its preceding HTML comment changed; the STOP-red block is upstream of the edit and untouched).

## Negative-space audit

Plan-level (Wave 2 only):

```
$ git diff --name-only HEAD~1..HEAD -- src/ e2e/
src/lib/pert/PertCalculator.svelte
```

Exactly 1 file in the plan's diff. Within D-08 PERT-route allowlist. No shared component, no NavShell, no HamburgerMenu, no other-calculator file, no e2e spec, no DESIGN.md, no DESIGN.json, no calc-layer (`calculations.ts` / `state.svelte.ts` / `types.ts` / `config.ts`), no `PertInputs.svelte` (Phase 3.1 frozen), no `pert-config.json` (commit 2dc7ae2 already in HEAD; not re-touched).

Phase-level forward note (for Wave 3's `git diff --name-only $BASELINE..HEAD -- src/ e2e/` audit):

```
src/lib/pert/PertCalculator.svelte    # Wave 2 (this plan, commit 29306e7)
src/lib/pert/pert-config.json         # Out-of-band commit 2dc7ae2 (acknowledged in-phase above)
```

Both within D-08 PERT-route allowlist. Wave 1's PRODUCT.md drop at the repo root is implicitly outside the `src/`+`e2e/` audit scope but explicitly recorded as the only repo-root D-08a addition in Wave 1's 04-01-SUMMARY.md.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking issue] Worktree had no `node_modules`; ran `pnpm install --frozen-lockfile` to enable Gate 1 svelte-check + Gate 2 vitest.**

- **Found during:** Task 2 STEP B (svelte-check)
- **Issue:** The first attempt at `pnpm exec svelte-check --no-tsconfig` (the plan's literal command) failed with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "svelte-check" not found`. Falling back to `pnpm run check` (the project's actual script entry point) failed with `sh: 1: svelte-kit: not found` plus `Local package.json exists, but node_modules missing, did you mean to install?`. The fresh worktree (`/mnt/data/src/nicu-assistant/.claude/worktrees/agent-a7e05d785c87b3e79`) was created without dependencies installed.
- **Fix:** Ran `pnpm install --frozen-lockfile` in the worktree. Install completed in 6s (lockfile-respecting; no version drift). Then `pnpm run check` succeeded with `4586 FILES 0 ERRORS 0 WARNINGS`. The `node_modules` directory is gitignored; the install does NOT pollute the diff.
- **Files modified:** none (process-level decision; node_modules is gitignored).
- **Commit:** none (deviation from the plan's verify command form, not from the underlying gate intent).
- **Recommendation for future plans:** Use `pnpm run check` (the project's script entry) rather than `pnpm exec svelte-check --no-tsconfig` (which assumes svelte-check is on the worktree's binary path independently of the project's npm scripts).

**2. [Rule 1 - Plan-side bug] Vitest filter syntax `pnpm test:run -- src/lib/pert/` ran the FULL suite (425 tests) instead of the PERT subset (81 tests).**

- **Found during:** Task 2 STEP C (vitest)
- **Issue:** The plan's `pnpm test:run -- src/lib/pert/` command ran all 425 tests instead of filtering to the PERT subset. This is a known pnpm `--` argument-passing quirk where extra args after `--` are not always forwarded to the underlying vitest CLI in the way the user expects.
- **Fix:** Used `pnpm exec vitest run src/lib/pert/` directly (bypassing the npm-script wrapper). This correctly invoked vitest with `src/lib/pert/` as the filter directory. Result: `Test Files 5 passed (5); Tests 81 passed (81)`. Matches the Phase 3.1 PERT subset baseline of 81.
- **Files modified:** none (deviation from the plan's verify command form, not from the underlying gate intent).
- **Recommendation for future plans:** Use `pnpm exec vitest run <path>` for filtered subsets instead of `pnpm test:run -- <path>`.

### Auth gates

None encountered. Workflow is fully agent-runnable.

## PERT-DESIGN-02..05 satisfaction mapping

| Requirement | Closure source | Status |
|------------|---------------|--------|
| **PERT-DESIGN-02** (P1 fixes ship before merge; cheap P2/P3 inline per D-03 disposition rules) | F-03 fix-now P2 shipped in Task 1 (1 token swap; PERT-route only; <=5 LOC); F-01 + F-02 + F-04 + F-05 deferred per D-03 + D-08b. 0 P1 findings. | Satisfied |
| **PERT-DESIGN-03** (DESIGN.md / DESIGN.json contract enforced -- Identity-Inside Rule, Eyebrow-Above-Numeral, Tabular-Numbers, etc.) | Identity-Inside preserved (eyebrow `text-[var(--color-identity)]` unchanged); Tabular-Numbers preserved (`.num` class hits = 9 >= 5); Eyebrow-Above-Numeral preserved (eyebrow `<div>` above numeral `<span>` in the Capsules per month block). | Satisfied (Wave 3 AUDIT.sh confirms phase-level via 10-rule grep) |
| **PERT-DESIGN-04** (HeroResult above-the-fold + sticky InputDrawer) | Phase 42.1 inheritance (universal patterns shipped to v1.13); F-04 P3 deferred per D-03 default (addressing requires `+page.svelte` / shell layout edits, D-08b boundary). | Satisfied by inheritance; F-04 deferred record in 04-FINDINGS.md |
| **PERT-DESIGN-05** (SegmentedToggle visual integration with identity hue) | Phase 1 + Phase 2 already shipped (active-pill carries `text-[var(--color-identity)]` matching the v1.6 SegmentedToggle treatment used by the Feeds calculator). Wave 1 critique surfaced no SegmentedToggle finding (no F-rows cite the toggle). | Satisfied by inheritance |

PERT-DESIGN-01 was satisfied by Wave 1 (critique-skill-run requirement; 8 transcripts captured). PERT-DESIGN-06 (>=35/40 score target) is satisfied by Wave 3 (Plan 04-03's re-run + score acceptance gate -- the Wave 1 baseline of 35.6/40 already meets the bar but Wave 3 must re-confirm post-fix).

## Self-Check: PASSED

All claimed artifacts verified to exist on disk:

- `src/lib/pert/PertCalculator.svelte` (post-F-03-fix; `font-extrabold` count = 1; `Capsules per month` text = 2; `tubeFeedResult.capsulesPerMonth.toLocaleString` count = 1)
- `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-02-SUMMARY.md` (this file)

Commits verified to exist via `git log --oneline 4fa096a..HEAD`:

- `29306e7` Task 1 + Task 2 (F-03 fix; quality gates run; logs in /tmp/04-02-gates/)
- (Task 3 commit will be the SUMMARY commit appended below)

All Wave 2 success criteria met:

- [x] F-03 fix shipped (1 token swap on Capsules per month numeral; commit 29306e7)
- [x] All 7 plan-level quality gates green
- [x] 04-02-SUMMARY.md authored at the phase directory with all 12 required sections
- [x] D-08 PERT-route allowlist honored (only `src/lib/pert/PertCalculator.svelte` modified)
- [x] D-08b strictly-forbidden boundary honored (zero shared / shell / other-calculator / DESIGN.md / DESIGN.json / calc-layer edits)
- [x] Phase 3.1 invariants preserved (function-binding 3 hits; zero string-bridge proxies; em + en-dash 0/0; STOP-red carve-out untouched)
- [x] Em-dash + en-dash sweep on this SUMMARY = 0 each (workstream Q1 broad ban honored on planning artifacts too)
- [x] Commit 2dc7ae2 acknowledged as in-phase scope (NOT scope creep)
- [x] D-08b forced-defer for F-01 + F-02 carried forward as cross-calculator backlog
- [x] PERT-DESIGN-02..05 satisfaction mapping documented

## Next step (the Wave 3 transition)

The orchestrator runs `/gsd-execute-phase 4 --wave 3 --ws pert` (or the wave-aware equivalent) to execute Plan 04-03 (Wave 3 verification + clinical gate + Phase 4 closure). Plan 04-03 will:

1. Re-run all 7 Wave-2 gates as part of the 18-gate verification sequence.
2. Run the 8-context FINAL `/impeccable critique` sweep against the post-Wave-2 UI; verify per-context >= 35/40 in >= 6/8 + aggregate >= 35/40 holds.
3. Run pnpm build + pert-a11y 4/4 + pert.spec 12/12 + full Playwright 117 + 1 baseline flake (the heavy gates Wave 2 deferred).
4. Run AUDIT.sh against the post-fix code; expect exit 0 (Identity-Inside Rule + Tabular-Numbers + Eyebrow-Above-Numeral + Five-Roles-Only + 11px-Floor + Flat-Card-Default all pass on the post-Wave-2 PERT route).
5. Compose 04-VERIFICATION.md as the phase-level audit trail; reads this 04-02-SUMMARY.md to inherit the F-03 fix record + commit 2dc7ae2 acknowledgment + D-08b forced-defer carry-forward.

Phase 4 closes when 04-VERIFICATION.md ships and STATE.md / ROADMAP.md / REQUIREMENTS.md are advanced by the Wave 3 closure (the orchestrator's responsibility, NOT this Wave-2 SUMMARY's).
