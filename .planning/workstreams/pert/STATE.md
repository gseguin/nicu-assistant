---
workstream: pert
created: 2026-04-25
---

# Project State — Workstream `pert`

## Current Position

Phase: Phase 3.1 — KI-1 Resolution (SelectPicker bridge fix) — **INSERTED 2026-04-25, NOT YET STARTED**
Plan: Phase 3 PARTIAL-WITH-KI-1 (5/5 plans across 4 waves; 6/6 reqs claimed = 5 FULL + 1 PARTIAL-VIA-KI-1); Phase 3.1 inserted into ROADMAP between Phase 3 and Phase 4 to close PERT-TEST-05 partial gap before v1.15 release
Status: Phase 3.1 ROADMAP entry + directory created; CONTEXT/RESEARCH/PLAN not yet written
Last activity: 2026-04-25 — Inserted Phase 3.1 (URGENT — KI-1 resolution: SelectPicker click-revert bug fix via $derived-backed binding wrapper); Phase 4 dependency updated from "Phase 3" to "Phase 3.1"

## Progress

**Phases Complete:** 2.5 / 6 (Phase 3 PARTIAL; Phase 3.1 inserted but not started)
**Current Plan:** Phase 3.1 — needs `/gsd-discuss-phase 3.1 --ws pert` to capture resolution approach (recommended: $derived-backed binding wrapper per KI-1 option 2)

## Session Continuity

**Stopped At:** Phase 3.1 inserted into ROADMAP (HEAD = pending Phase 3.1 commit)
**Resume File:** `.planning/workstreams/pert/ROADMAP.md` (Phase 3.1 entry) + `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/known-issues.md` (KI-1 root-cause + 3 candidate resolution paths)
**Next Action:** `/gsd-discuss-phase 3.1 --ws pert` (capture KI-1 resolution decisions: bridge architecture choice, scope of SelectPicker contract change, regression test strategy), then `/gsd-plan-phase 3.1 --ws pert`, then `/gsd-execute-phase 3.1 --ws pert`. After Phase 3.1 closes, resume normal flow with `/gsd-plan-phase 4 --ws pert`.

## Phase 3 outcomes (HEAD 27dc39c, baseline e14f425 → 7 commits)

- **Wave 1 (parallel-eligible) — fixtures (`5d1356f`):** NEW `src/lib/pert/pert-parity.fixtures.json` (152 lines, 28 hand-derived rows: 9 oral + 18 tube + 1 stopRedTrigger). Each row has `input` + `expected` + `_derivation`. Cell mapping cited explicitly: B10 (oral capsules), B11 (cap), B14 (tube capsules), B15 (capsules/month), B13 (lipase/kg display). Independent JS re-derivation cross-check passed for all 28 rows.
- **Wave 1 (parallel-eligible) — component tests (`3d45c7e`):** NEW `src/lib/pert/PertCalculator.test.ts` (139 lines, 10 cases — empty-state, hero numerals, tertiary daily-total only-in-oral, STOP-red `role="alert"`, warning `role="note"`, secondaries hidden in empty state, hero `class="num"`) + NEW `src/lib/pert/PertInputs.test.ts` (96 lines, 7 cases — SegmentedToggle binding, D-11 strength reset on medication change, mode-switch state preservation, strength picker filtered, formula picker 17 options, UI labels "Lipase per gram of fat", inputmode="decimal").
- **Wave 2 — calc parity matrix (`ad3bf36`):** NEW `src/lib/pert/calculations.test.ts` (347 lines, 45 tests). closeEnough helper inline (EPSILON=0.01 + ABS_FLOOR=0.5, copied verbatim from feeds analog). Oral parity 9 rows × 4 closeEnough = 36 assertions; Tube parity 18 rows × 5 = 90 assertions; defensive zero-return 8 tests; advisory engine 8 tests including STOP-red trigger; PERT-TEST-04 D-09 integration delta 2 tests with docstring citing Phase-1 coverage. **All 45 parity tests passed first run** — confirms Phase 2's user-locked xlsx-canonical math (D-15/D-16) was correct.
- **Wave 3 — e2e PARTIAL (`c56abf7`):** NEW `e2e/pert.spec.ts` (197 lines, 4 unique tests × 2 viewports = 8/8 green). Covers mode-switch state preservation, inputmode="decimal" regression guard, localStorage round-trip (D-09 reinterpretation: `nicu_pert_state` NOT sessionStorage), favorites round-trip (D-13: `nicu:favorites` colon key, mirrors FAV-TEST-03-2 pattern). **2 picker-driven happy-path tests deferred per KI-1 SelectPicker click-revert bug** — 4 of 12 originally planned tests dropped, commented in-file with cross-ref.
- **Wave 4 — clinical gate (`b83c0ea`):** verification-only, no code changes. All 7 gates green: svelte-check 0/0 (4586 files); vitest 423/423 (41 files; +62 new from Phase 3 vs Phase 2 baseline 361); pnpm build OK (PWA 49 entries / 576.48 KiB); CI=1 pert-a11y 4/4; CI=1 pert.spec 8/8; CI=1 full Playwright 113/114 (1 baseline flake on `disclaimer-banner.spec.ts:28`, same as Phase 1+2; +8 new from Phase 3 vs Phase 2 baseline 105 with zero new failures).
- **KI-1 (NEW known-issue, Phase-2-origin):** SelectPicker click-revert bug in PertInputs.svelte discovered during Plan 03-04 e2e execution. Three SelectPicker proxies have a bidirectional `bind:value` race where the read-from-state `$effect` (registered first) overwrites the user's click before the write-to-state `$effect` propagates. Two hotfix attempts during Plan 03-04 (mechanical effect-order swap; folding D-11 into the strength write-effect) each broke either the D-11 unit test or external-write propagation — root cause is architectural, not effect-order. Documented at `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/known-issues.md` with 3 candidate resolution paths (recommended: $derived-backed binding wrapper). Bug is clinically benign — fails LOUD (empty-state copy on click) rather than producing a wrong dose — but breaks calculator usability at point of care. Verifier recommends inserting a KI-1-resolution phase before Phase 4 design polish.

## Phase 3 deviations applied (all auto, none Rule-4)

- 03-01: none. RESEARCH §C fixture rows + plan must_haves agreed verbatim; independent JS cross-check passed.
- 03-02: cast widening for fixture-row TypeScript (`{_derivation: string; input: any; expected: any}` per plan's CRITICAL rule); no production-code or fixture changes.
- 03-03: comment em-dashes replaced with ASCII; double `Promise.resolve` flush in D-11 test as defensive guard against rune-batching variance across jsdom + node versions.
- 03-04: PARTIAL closure on PERT-TEST-05; 2 picker-driven happy-path tests deferred to follow-up phase per KI-1; 8 of 12 planned tests ship green. Two in-flight hotfix attempts during execution were correctly reverted before commit (orchestrator-stopped per Rule 4 protection).
- 03-05: 2 em-dash hits in `e2e/pert.spec.ts` DEFERRED comment block (lines 65, 70) flagged by 03-05 verifier; in-code comments (NOT user-rendered strings); precedent-carved-out per Phase 2 verifier reading. Marked as documentation-style hit, not a content violation.

## Phase 2 outcomes (HEAD 055a1f1, baseline 3f72dd0 → 7 commits)

- **xlsx-canonical math (USER-LOCKED 2026-04-25):** During Phase 2 research the gsd-phase-researcher opened `epi-pert-calculator.xlsx` via openpyxl and discovered REQUIREMENTS PERT-ORAL-06 / PERT-TUBE-06 wording was inconsistent with the actual xlsx formulas. User resolved via AskUserQuestion: adopt xlsx-canonical fat-based dosing (Q-02), Math.round NOT Math.ceil (Q-01), copy reference-clone xlsx into workstream root as `epi-pert-calculator.xlsx` (Q-03). Locked into CONTEXT D-15..D-18.
- **Wave 0 — em-dash audit (`3a9b18f`):** 4 advisory message strings in `pert-config.json` had em-dashes violating DESIGN.md ban; mechanically replaced with `". "` per D-19. Phase-1 frozen tests stayed green.
- **Wave 1 — calc layer (`6f05cfc`):** NEW `src/lib/pert/calculations.ts` (284 lines) with pure-function xlsx-canonical math: oral `round((fat × lipasePerG) / strength)`, tube `round((totalFatG × lipasePerG) / strength)`, max-lipase cap as hard-coded literal `weightKg × 10000`, defensive zero-return on null/NaN/≤0 inputs. Additive `TriggeredAdvisory` interface in `types.ts` (purely additive — Phase-1 tests untouched).
- **Wave 1 — PertInputs.svelte (`3171b06`):** NEW `src/lib/pert/PertInputs.svelte` (248 lines) — SegmentedToggle bound to `pertState.current.mode`, three string-bridge `$state` proxies for SelectPicker `bind:value` (medicationIdStr / strengthStr / formulaIdStr) mirroring `feeds/FeedAdvanceInputs.svelte:55-74`, D-11 strength-reset on medication change, UI labels "Lipase per gram of fat" per D-17 (JSON keys stay frozen), `inputmode="decimal"`, no calc-layer imports.
- **Wave 2 — calculator body + route (`b2e8e2b`):** PertCalculator.svelte body replaced (51 → 340 lines) — hero (capsulesPerDose / capsulesPerDay with tabular numerals + identity-purple), secondaries via `divide-y`, "Estimated daily total (3 meals/day)" tertiary in oral mode (D-09), STOP-red advisory card BELOW hero (`border-2 border-[var(--color-error)]` + `OctagonAlert` per D-20 + bold red message + `role="alert"` + `aria-live="assertive"`), warning advisory neutral card with `AlertTriangle`. `+page.svelte` mounts `<PertInputs />` twice (desktop sticky aside + mobile InputDrawer), both binding to the same module-scope `pertState` singleton.
- **Quality gates:** svelte-check 0/0 (4582 files), vitest 361/361 (38 files; same as Phase 1 baseline — Phase 3 ships the new tests), `pnpm build` ✓, `CI=1 pnpm exec playwright test pert-a11y` 4/4, full Playwright 105/106 (same `disclaimer-banner.spec.ts:28` Phase-1 baseline flake; no new regressions).
- **Negative-space audit:** All 14 Phase-1-frozen files (state.svelte.ts, config.ts, state.test.ts, config.test.ts, app.css, registry.ts, favorites.svelte.ts, about-content.ts, NavShell.svelte, vite.config.ts, the 3 e2e specs, fortification/) verified UNCHANGED in `git diff 3f72dd0..HEAD`. One unauthorized `vite.config.ts` watch-ignored expansion was caught and reverted by the orchestrator during Wave 1.

## Phase 2 deviations applied (all auto, none Rule-4)

- 02-01: none.
- 02-02: none. Initial false-alarm grep (`Math.ceil` matched docstring header documenting *non*-use rules); plan's exact verify commands (with `grep -v Math.round`) returned the expected 0/empty.
- 02-03: comment em-dashes replaced with ASCII (acceptance gate is comment-blind grep). One agent attempted to expand `vite.config.ts` watch.ignored list mid-run; orchestrator reverted before next wave.
- 02-04: comment em-dashes replaced with ASCII; combined-import line split to satisfy plan's grep gate; comment phrases adjusted to avoid double-counting markup tokens in exact-count grep gates.

## Phase 1 outcomes (HEAD 017963a, baseline fcf3e4d → 9 commits)

- **Architecture:** `CalculatorId = 'pert'`, `CALCULATOR_REGISTRY` alphabetized (feeds, formula, gir, morphine-wean, pert, uac-uvc), `Pill` icon registered, favorites `defaultIds()` naturally returns `['feeds','formula','gir','morphine-wean']` and `recover()` preserves stored order verbatim (D-21).
- **Identity hue:** `.identity-pert` OKLCH tokens at hue 285 — light `oklch(42% 0.12 285)` / dark `oklch(80% 0.10 285)` — pass axe 4.5:1 first run, no retuning, no `disableRules`.
- **Clinical data:** `src/lib/pert/{types.ts, pert-config.json, config.ts, config.test.ts}` — 5 medications × 25 FDA-allowlisted strengths, 17 pediatric formulas with xlsx-sourced `fatGPerL`, 4 advisories including STOP-red max-lipase carve-out. Hostile-injection test verified (Pertzye=2.0 fails CI).
- **Route shell:** `/pert` renders heading + placeholder hero + Pill icon + AboutSheet entry citing xlsx pediatric tabs + DailyMed + 10,000 units/kg/day cap. State singleton with mode-specific sub-objects + most-recent-mode persistence.
- **Quality gates:** svelte-check 0/0 (4580 files), vitest 361/361 (38 files), pnpm build OK (PWA 50 entries / 563 KiB), Playwright CI 105/106 (1 unrelated baseline-flake on `disclaimer-banner.spec.ts:28` pre-existing).

## Phase 1 deviations applied (all auto, none Rule-4)

- 01-01: placeholder `pert` AboutSheet entry added (replaced fully in 01-04); NavShell + HamburgerMenu test specs updated for alphabetical order.
- 01-02: created `e2e/pert-a11y.spec.ts` (project topology) instead of plan-named `tests/playwright/extended-axe.spec.ts`; gated literal `/pert` axe sweeps behind `pertRouteReady` flag for 01-04 to flip.
- 01-03: **clinical-data corrections against xlsx parity authority** — Zenpep 60000 + Pancreaze 37000 strengths added; 11 of 17 formula `fatGPerL` values corrected. Phase 2 spreadsheet-parity tests will lock these against xlsx Pediatric Oral / Tube-Feed tabs.
- 01-04: re-baselined 3 pre-existing Playwright e2e specs (favorites-nav × 2 + navigation × 1) for alphabetical registry order; flipped `pertRouteReady = true`.

## Accumulated Context

- **Source of truth:** `epi-pert-calculator.xlsx` (workstream root — copied 2026-04-25 from `/home/ghislain/src/pert-calculator/pert-calculator-pediatric-updated.xlsx` per D-18). Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`).
- **Reference codebase:** `/home/ghislain/src/pert-calculator` (SvelteKit 2 + Svelte 5, same family) — mined `dosing.ts`, `clinical-config.json` step-config pattern; xlsx-canonical formulas confirmed against this codebase + xlsx live read.
- **Workstream scope:** parallel to main `v1.14` (Kendamil + desktop nav) — Phase 1 + Phase 2 verified no edits to `src/lib/fortification/` or `src/lib/shell/NavShell.svelte` desktop branch.
- **Reuse first:** Phase 2 honored — no new shared components added; consumed `<HeroResult>`, `<SegmentedToggle>`, `<NumericInput>`, `<SelectPicker>`, `<RangedNumericInput>`, sticky `<InputDrawer>`. Two NEW per-calculator files added: `calculations.ts` (pure functions) + `PertInputs.svelte` (mode-conditional inputs); both mirror feeds/uac-uvc/gir analog patterns.
- **Phase shape:** 5 phases (Architecture+Hue+Data → Core+Modes+Safety → Tests → Design Polish → Release). Phase 1 + Phase 2 complete; Phase 3 (tests) is next.
- **Quality bar inherited from v1.13:** svelte-check 0/0, vitest all green (361/361), `pnpm build` ✓, Playwright extended axe suite — Phase 1 added 4 PERT axe sweeps (synthetic + literal × light + dark) green first run; Phase 2 preserved 4/4 with no `disableRules`. Phase 3 will grow extended-axe from current 33/33 + 4 PERT sweeps to 35/35 after PERT-TEST-06 lands the spreadsheet-parity vitest fixtures.

## Doc-drift items deferred to Phase 5 (release cleanup)

Phase 2 verifier surfaced 4 pre-authorized doc-drift items (NOT defects — all pre-cleared by user-locked CONTEXT decisions):

1. **REQUIREMENTS.md PERT-ORAL-06 + PERT-TUBE-06 wording** is out of date per D-15+D-16 (xlsx-canonical fat-based formulas overrode the original `weight × lipasePerKg` + `CEILING/ROUNDUP` wording). Phase 5 release rewrites them.
2. **ROADMAP.md Phase 2 success criterion text** uses em-dashes in advisory string examples — superseded by D-19 mechanical fix. Phase 5 mechanical update.
3. **ROADMAP.md cell-label drift** — references `B11`/`B13`/`B14` in some places where xlsx live read shows `B10`/`B14` are the actual capsule cells. Phase 5 mechanical update.
4. **ROADMAP.md storage-key spec** mentions `nicu:pert:mode` (sessionStorage); Phase 1 D-09 reinterpreted to single localStorage blob `nicu_pert_state`. Phase 5 mechanical update.
