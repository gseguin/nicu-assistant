# Phase 4: Design Polish (`/impeccable` Critique Sweep) - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** /gsd-discuss-phase 4 --ws pert --auto (all gray areas auto-resolved with recommended defaults grounded in Phase 42.1 v1.13 precedent + DESIGN.md/DESIGN.json contract; user should review D-01..D-12 below before plan-phase locks them in)

<domain>
## Phase Boundary

**In scope:** Run the `/impeccable` critique skill against the live `/pert` UI in light + dark themes at mobile (375px) and desktop (1280px) viewports across both Oral and Tube-Feed modes (4 contexts × 2 modes = 8 critique passes). Triage findings into P1 (must-fix) / P2 (should-fix) / P3 (nice-to-fix) per the v1.13 Phase 42.2 precedent. Fix all P1 findings; fix cheap P2/P3 inline; defer expensive P2/P3 to release notes (or v1.16 backlog). Verify the DESIGN.md / DESIGN.json contract holds across all 8 contexts. Achieve **≥35/40** critique score (the v1.13 Phase 42.2 bar).

**Out of scope:**
- Adding new clinical features, calculator inputs, or output values (Phase 2 closed those).
- Modifying calc-layer math, xlsx parity (Phase 2 D-15..D-18 are user-locked).
- Changing the SelectPicker bridge architecture or Phase 3.1 derived-binding wrappers (KI-1 closed).
- Modifying any test infrastructure (Phase 3 + 3.1 closed; vitest 425/425 + e2e 12/12 must hold).
- Changing the SegmentedToggle component itself (`src/lib/shared/components/SegmentedToggle.svelte`) — Phase 4 only verifies its PERT-route usage matches the v1.6 idiom (D-09 from Phase 1 / SC-3 from ROADMAP). If a SegmentedToggle internal change is required to satisfy SC-3, that's a Rule-4 escalation and a deferred phase, not in-scope here.
- Touching the other 5 calculators (Morphine, Formula, GIR, Feeds, UAC/UVC) — Phase 4 is **PERT-only**. The Phase 42.1 universal polish (HeroResult, sticky InputDrawer, DisclaimerBanner v2) already shipped to v1.13 and applies to PERT by inheritance.
- Re-running `/impeccable document` to refresh DESIGN.md (DESIGN.md is the locked contract — Phase 4 enforces it, doesn't update it).

**Anchor scope statement:** A clinician viewing `/pert` in light + dark themes at mobile 375 + desktop 1280 in both Oral and Tube-Feed modes sees a hero-owns-viewport result, identity-purple inside-only chrome, tabular numerals throughout, no em-dashes, no design-contract violations, and a `/impeccable` critique score ≥35/40 with no P1 findings shipped to v1.15.

</domain>

<decisions>
## Implementation Decisions

### Critique sweep matrix (the work)

- **D-01 [auto-recommended]:** Run `/impeccable critique` (or the equivalent skill invocation) against `/pert` across the **8 critique contexts**: 2 themes (light + dark) × 2 viewports (mobile 375 × desktop 1280) × 2 modes (Oral + Tube-Feed). Each context produces a critique transcript captured into `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-{theme}-{viewport}-{mode}.md` (8 files). Findings normalized into a single `04-FINDINGS.md` triage spreadsheet with columns: `id | context (1-8) | severity (P1/P2/P3) | description | proposed fix | disposition (fix-now / defer / wontfix) | DESIGN.md rule violated (if any)`.
  - **Why 8 critique passes (not 4):** Oral mode and Tube-Feed mode have materially different input affordances (Oral: 2 NumericInputs; Tube-Feed: SelectPicker formula + 2 NumericInputs). The hero output also differs (capsulesPerDose vs capsulesPerDay + capsulesPerMonth secondary). A theme×viewport-only sweep would miss mode-specific issues.
  - **Tooling:** `/impeccable` is installed at `~/.claude/plugins/marketplaces/impeccable/`. The plan calls `Skill(skill="impeccable", args="critique <context-spec>")` per critique pass, OR if the skill operates on a dev-server URL it's invoked once per `(theme, viewport, mode)` triple after navigating the running dev server (`pnpm dev`).

### Triage policy (P1/P2/P3 + disposition)

- **D-02 [auto-recommended]:** Severity rubric carried verbatim from Phase 42.2 precedent:
  - **P1 (must-fix before merge):** DESIGN.md named-rule violation; clinical-trust regression (e.g. wrong identity color leaks into chrome, em-dash appears in a user-rendered string, advisory-card rendering loses the STOP-red distinction); WCAG AA contrast failure on a critical surface; broken layout at mobile 375; or a regression vs Phase 42.1's v1.13 design-polish bar.
  - **P2 (should-fix; fix inline if cheap):** Inconsistency with the other 5 calculators that doesn't violate a named rule but degrades cross-route polish (e.g. spacing, alignment, micro-typography); minor a11y issue caught by `/impeccable` but not by axe-core; theme-asymmetric polish (one theme cleaner than the other).
  - **P3 (nice-to-fix; usually defer):** Subjective improvements (micro-animations, optional embellishments); ideas that would expand scope beyond the 6 PERT-DESIGN-* requirements.
- **D-03 [auto-recommended]:** **Disposition rules:**
  - All P1 findings: `fix-now`. No exceptions. Block merge until 0 P1 remain.
  - P2 findings ≤ 5 LOC each: `fix-now` (cheap-inline rule from v1.9 POLISH-04).
  - P2 findings > 5 LOC OR touching a shared component: `defer` to v1.16 backlog with explicit triage note in `04-FINDINGS.md` (don't pollute the workstream's tight scope).
  - P3 findings: default `defer` unless the fix is < 3 LOC AND touches only PERT-route files.
  - Any `wontfix` disposition requires a one-sentence rationale (e.g. "intentional per Phase 1 D-03 Identity-Inside Rule").

### Score target + acceptance

- **D-04 [auto-recommended]:** Target **≥35/40** on the final `/impeccable` score (PERT-DESIGN-06 + ROADMAP SC-4). The score is computed by `/impeccable score` after all P1 fixes ship and the critique sweep is re-run on the post-fix UI. Phase passes when:
  1. `/impeccable score` returns ≥35/40 in at least 6 of the 8 contexts (allowing 2 contexts to be 33-34/40 with explicit triage notes — this matches the v1.13 Phase 42.2 "predominant pass" pattern).
  2. The aggregate score across all 8 contexts is ≥35/40.
  3. Zero P1 findings remain in `04-FINDINGS.md` after the fix wave.
  4. DESIGN.md named-rule audit (see D-05) passes 0 violations on the post-fix code.

### DESIGN.md named-rule audit

- **D-05 [auto-recommended]:** Independent of `/impeccable` scoring, the plan includes a **scripted named-rule audit** that grep-checks the post-fix code for the 10 DESIGN.md rules. Each rule maps to a concrete check:
  - **Identity-Inside Rule:** `grep -rE "identity-pert" src/lib/pert/ src/routes/pert/ | grep -vE "(HeroResult|hero|focus|eyebrow|nav.*active)"` returns 0 hits in chrome contexts (top tab, bottom nav neutral, AboutSheet rows).
  - **Amber-as-Semantic:** `grep -rE "bmf-(amber|gold|yellow)" src/lib/pert/ src/routes/pert/` returns 0 hits.
  - **OKLCH-Only:** `grep -rE "(rgb|hsl|#[0-9a-fA-F]{3,8})\(" src/lib/pert/` returns 0 hits (no hex/rgb/hsl colors in PERT module — all colors flow through `var(--color-*)` tokens).
  - **Red-Means-Wrong (with STOP-red carve-out):** `var(--color-error)` used only in advisory-card contexts (max-lipase cap STOP advisory + range "Outside expected range" warnings). Verified by `grep -nE "color-error" src/lib/pert/`.
  - **Tabular-Numbers:** Every rendered numeric output in `<PertCalculator>` has `class="num"`. `grep -nE "num\b" src/lib/pert/PertCalculator.svelte` shows ≥4 hits (capsulesPerDose, capsulesPerDay, capsulesPerMonth, lipasePerKg secondary).
  - **Eyebrow-Above-Numeral:** `<HeroResult>` invoked with eyebrow + display + suffix. Mirrors GIR/Feeds/UAC.
  - **11px Floor:** `grep -rE "text-(2xs|\[10px\]|\[9px\])" src/lib/pert/` returns 0 hits (or only `text-2xs` on labels per DESIGN.md exception).
  - **Tonal-Depth:** Surfaces use `var(--color-surface-*)` tokens, no inline raw OKLCH literals.
  - **Flat-Card-Default:** No `box-shadow` on cards (advisories/STOP-red allowed to use border-2). `grep -nE "shadow|elevation" src/lib/pert/`.
  - **Five-Roles-Only (typography):** `grep -nE "text-(display|title|heading|body|ui|label)" src/lib/pert/` shows usages within the 6-role taxonomy (display/title/heading/body/ui/label). Anything outside is a finding.
- **D-05a [auto-recommended]:** The named-rule audit script lives at `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-AUDIT.sh` (a small bash script) and its output goes into the SUMMARY.md verbatim. Not a permanent codebase asset — Phase 4-only deliverable.

### What's already polished (carrying forward — DO NOT re-touch)

- **D-06 [auto-recommended]:** The following Phase 42.1-level polish items are **already inherited** by `/pert` because the universal patterns shipped to v1.13. Phase 4 verifies they hold for PERT but does NOT re-implement:
  - `<HeroResult>` shared component (Phase 42.1 D-06/D-07) — PERT Phase 2 D-04 already uses `<HeroResult>` for capsulesPerDose / capsulesPerDay.
  - Sticky `<InputDrawer>` pattern (Phase 42.1 D-08) — PERT `+page.svelte` already mounts `<PertInputs />` in the sticky drawer for mobile + sticky aside for desktop.
  - Mobile bottom-nav clearance (`pb-[calc(...)]` per Phase 42.1 D-09) — applies to all routes via NavShell.
  - DisclaimerBanner v2 (Phase 42.1 D-12..D-15) — already wired in `+layout.svelte`.
  - DESIGN.md / DESIGN.json design contract (Phase 42.1 D-31).
  - Em-dash ban (`917ecf2` em-dash purge from v1.13 + Phase 2 D-19 PERT pre-purge).
  - 11px floor for advisory copy (Phase 42.1 D-30).
  - Identity-Inside Rule (Phase 42.1 D-01..D-04 + PERT Phase 1 D-03 + Phase 1 D-17).
  - Tabular numerals on hero (`class="num"` per Phase 2 component contract).
- **What this means for the plan:** Phase 4 does NOT need a "refactor PERT to use HeroResult" task — that was Phase 2 D-04. Phase 4 only catches drift / polish residue specific to PERT.

### Wave structure (recommended; planner has final say)

- **D-07 [auto-recommended]:** Recommended 3-wave structure:
  - **Wave 1 — Critique sweep (sequential, 1 plan):** `04-01-PLAN.md` runs the 8 `/impeccable` critique passes against the live dev server, captures 8 critique transcripts, normalizes findings into `04-FINDINGS.md`. No code changes. Output: triaged findings list.
  - **Wave 2 — P1 + cheap-inline P2 fixes (1-3 plans depending on finding count, parallel-eligible if findings are in disjoint files):** Apply fixes per the disposition column in `04-FINDINGS.md`. Plan count and file scope are determined AFTER Wave 1 produces findings — the planner generates these plans in a re-plan pass (Phase 4 has a "post-discovery replan" beat).
  - **Wave 3 — Score validation + clinical gate (sequential, 1 plan):** `04-LAST-PLAN.md` re-runs `/impeccable critique` + `/impeccable score` on the post-fix UI; runs the 7-gate clinical sequence (svelte-check, vitest 425/425, build, pert-a11y 4/4, pert.spec 12/12, full Playwright, negative-space audit); writes `04-VERIFICATION.md` certifying ≥35/40 + zero P1 + DESIGN.md audit clean.
- **D-07a [auto-recommended]:** **Phase 4 has a built-in replan beat.** The Wave 2 plan count is unknown until Wave 1 ships its findings. The planner should produce Wave 1 + Wave 3 in the initial pass, leaving Wave 2 as a placeholder ("post-Wave-1 fix plans authored after critique sweep ships"). After Wave 1 completes, the orchestrator (or a `/gsd-plan-phase 4 --gaps` re-invocation) generates the actual Wave 2 fix plans. This mirrors how v1.13 Phase 42.2 handled critique-then-fix.

### Negative-space audit + zero-regression contract

- **D-08 [auto-recommended]:** Phase 4 fixes are confined to **PERT-route files** (`src/lib/pert/**/*` + `src/routes/pert/**/*` + `src/lib/pert/pert-config.json`). Verifier asserts via `git diff --name-only $BASELINE..HEAD -- src/ e2e/` that touched files match the `src/lib/pert/**` or `src/routes/pert/**` glob. Any touch outside (e.g. shared components, NavShell, app.css token file, AboutSheet) is a Rule-4 escalation — STOP and replan, do not ship.
- **D-08a [auto-recommended]:** **Allowed exceptions to D-08** (each requires explicit acknowledgment in the SUMMARY.md):
  - `src/app.css` — only if a NEW `.identity-pert` token tweak is required to fix a contrast finding (PERT Phase 1 D-04 originally locked the tokens at WCAG AA; a critique-driven retune would be a P1 fix). Even then, ONLY the `.identity-pert` token block (lines ~214-263 area) — never any other token.
  - `src/lib/shell/registry.ts` — only if the PERT entry needs label/icon polish caught by critique. Never touch other calculators' entries.
  - `e2e/pert.spec.ts` and `e2e/pert-a11y.spec.ts` — if a P1 fix invalidates an e2e selector, the test gets a corresponding selector-only update (NOT a behavior change).
- **D-08b [auto-recommended]:** **Strictly forbidden:** edits to `src/lib/shared/components/*.svelte` (HeroResult, SegmentedToggle, SelectPicker, NumericInput, RangedNumericInput, InputDrawer, DisclaimerBanner, AboutSheet, NavShell), `src/lib/shell/HamburgerMenu.svelte`, `src/lib/shell/NavShell.svelte`, any other calculator's `src/lib/{morphine,formula,gir,feeds,uac-uvc}/**`, `DESIGN.md`, `DESIGN.json`. If any of these need to change, escalate to the user — do not auto-fix.

### Tooling: dev server + critique workflow

- **D-09 [auto-recommended]:** The critique sweep runs against a **live dev server** (`pnpm dev` on `localhost:5173` or whatever port Vite picks). The Wave 1 plan starts the dev server in the background, runs `/impeccable` 8 times against the running URL with appropriate viewport+theme+mode flags, captures the transcripts, then shuts down the dev server. If `/impeccable` doesn't accept a URL parameter and instead operates on a screenshot, use Playwright (already a project dependency) to capture screenshots at the 8 contexts and feed them to `/impeccable`.
  - **Researcher TODO:** Confirm `/impeccable` skill's actual invocation API by reading `~/.claude/plugins/marketplaces/impeccable/.claude/skills/impeccable/SKILL.md` (or equivalent). Document the exact command form in RESEARCH.md before the planner writes the Wave 1 plan.
- **D-10 [auto-recommended]:** Theme switching for the critique: the project's theme toggle is wired in `+layout.svelte`. Manual toggle works in browser; for automated capture, use `localStorage.setItem('theme', 'dark')` + reload. Mode switching (Oral / Tube-Feed) uses the SegmentedToggle UI; the e2e suite already does this in `e2e/pert.spec.ts`.

### Specific PERT-design things to look for (priors based on Phase 1+2 outcomes)

- **D-11 [auto-recommended]:** Researcher and critique sweep should specifically watch for:
  - **Identity-pert hue contrast in dark mode** — Phase 1 D-04 axe-passed at 4.5:1 first run, but `/impeccable` may flag a perceived-contrast issue (axe ≠ visual polish; a pass on contrast can still feel low-contrast). If this surfaces, retune is allowed per D-08a.
  - **STOP-red advisory card prominence** — Phase 2 D-04 + D-20 use `OctagonAlert` + `border-2 var(--color-error)`. Critique should verify this remains visually unmistakable in BOTH themes (the carve-out is precisely what protects clinical safety).
  - **SegmentedToggle visual integration** (PERT-DESIGN-05 + ROADMAP SC-3) — does the Oral / Tube-Feed toggle read as part of the existing identity-hue idiom (consistent with Feeds calculator's Bedside / Full Nutrition toggle), or does it look like a foreign object? The toggle component itself is shared (DON'T edit per D-08b), but its label, color, and surrounding spacing are PERT-route-local and tunable.
  - **HeroResult hero-owns-viewport on mount** (PERT-DESIGN-04 + ROADMAP SC-1) — does the result numeral fill the top 60% of the viewport at first paint in both modes? If not (e.g. if first-run empty-state copy is displayed instead, since first-run defaults are weight=3.0 only per Phase 1 D-11), the empty-state copy itself should still own the viewport.
  - **Tube-Feed mode tertiary outputs** — capsulesPerMonth and lipasePerKg are secondary lines below the hero. Phase 2 D-04 puts them in a `divide-y` list. Critique should verify the visual hierarchy makes capsulesPerDay > capsulesPerMonth > lipasePerKg clear, not visually equal.
  - **Formula picker modal in mobile portrait** — the SelectPicker uses `<dialog showModal()>` which spans full screen in mobile. Make sure scroll behavior + dismissal feel native; this is the post-Phase-3.1 picker UX in production for the first time.

### Claude's Discretion

- Whether to use `/impeccable critique` as a single-shot skill OR Playwright-screenshot-then-feed-to-LLM — depends on the skill's actual API (researcher confirms in D-09).
- Exact layout of `04-FINDINGS.md` (table vs nested list) — planner picks; the column set in D-01 is the contract.
- Whether to gate Wave 2 on a user "review findings" checkpoint OR auto-advance to fixes — recommend a brief AskUserQuestion checkpoint after Wave 1 (since the fix scope is unknown until findings ship), but the auto orchestration can default to "fix all P1 + cheap P2, defer rest" without asking.

### Gap-closure decisions (added 2026-04-26 after UAT test #4 surfaced Oral hierarchy inversion)

- **D-12 [auto-recommended]:** Amend Phase 2 LOCKED decision D-09 (`02-CONTEXT.md:94-98`) via this Phase 4 gap-closure beat. Phase 2 D-09 prescribed Oral tertiary-line treatment as `text-2xs eyebrow + text-base value`, "smaller than secondary outputs (which are text-title)". Subsequent human-visual UAT (Phase 4 04-UAT.md test #4, surfaced 2026-04-26) caught that this renders the prescribing artifact (Estimated daily total — the daily-script + parent-education number) SMALLER and LIGHTER than its derived per-dose figures (Total lipase needed, Lipase per dose) above it. **Hierarchy inversion is a clinical-trust regression** — clinicians scanning for the daily-script number find it visually de-emphasized. Phase 4 ships D-12 to supersede Phase 2 D-09 for the visual-hierarchy aspect (the calculation, label, and cardinality of the row are unchanged — only the typographic treatment is amended). New treatment mirrors Tube-Feed Capsules per month post-04-04: numeral `text-title font-extrabold` (22px / weight 800) + eyebrow `tracking-wider` (0.55px). 3-token swap on `src/lib/pert/PertCalculator.svelte:213-227`: line 216 `tracking-wide` → `tracking-wider`; line 221 `text-base` → `text-title`; line 221 `font-medium` → `font-extrabold`. Comment at line 211 (the D-09 verbatim citation) gets updated to cite D-12 instead. Identity-Inside Rule preserved (eyebrow color token unchanged). Pitfall 4 preserved (visible text "Estimated daily total (3 meals/day)" + numeral expression `oralResult.estimatedDailyTotal` byte-identical; e2e selectors at `e2e/pert.spec.ts` still match). PERT-route only; `~3 LOC`; no D-08b violation. Wave 5 plan (gap-closure) ships this; user-visual UAT re-tests by eye.

- **D-13 [auto-recommended]:** **Codify the Prescribing-Artifact-Leads Rule as a Phase 4 cross-mode design rule.** The rule: in any PERT secondary-card stack, the prescribing artifact (the value a clinician orders against — `Capsules per month` in Tube-Feed mode; `Estimated daily total` in Oral mode) MUST read visually distinct from derived siblings. Distinction is achieved via the both-vectors typographic delta (eyebrow `tracking-wider` + numeral `font-extrabold`; numeral size matches secondaries at `text-title`, not the hero `text-display`). This rule generalizes Watch Item 5 from 04-UI-SPEC.md (Tube-Feed only) to cover both modes. Originating incidents: Tube-Feed F-03 (caught Wave 1 critique → fixed Wave 2 Approach A → human-visual UAT showed Approach A insufficient → fixed Wave 4 Approach C combined-vector treatment → user-visual `approved`); Oral hierarchy inversion (caught Wave 4 human-visual UAT test #4 — missed by Wave 1 LLM-Design-Review fallback AND by Wave 4's checkpoint:human-verify which only inspected Tube-Feed). The rule's audit gate: any post-Phase-4 design-polish sweep MUST explicitly inspect the prescribing artifact in BOTH Oral and Tube-Feed modes (the 8-context critique sweep already covers this combinatorially, but human-verify checkpoints must explicitly call out both rows). DESIGN.md update is OUT-OF-SCOPE for Phase 4 (that's a v1.16 design-contract-refinement phase per the existing Deferred Ideas section). For now D-13 lives as a workstream-local rule documented here + cross-referenced in 04-VERIFICATION.md.

- **D-14 [auto-recommended]:** **Weight-in-Oral-mode UX: clarify the safety-only role via mode-conditional helper text.** Wave 5 user UAT (verbatim follow-up after `approved` on D-12 + D-13) flagged that weight is shown in Oral mode but isn't used in the dose calculation, asking whether it should be removed. Investigation against `epi-pert-calculator.xlsx` (Pediatric PERT Tool sheet) confirmed weight (B4) is used in exactly one cell — `B11 = B4 * 10000` (Max Lipase Units/Day, the safety cap) — and is NOT used in the dose-calculation cells (B9 Total Lipase Needed = B5*B6; B10 Capsules Needed = ROUND(B9/B8, 0)). Removing weight is therefore NOT applicable: it would silently disable PERT-SAFE-01 (the published 10,000 units/kg/day pediatric overdose-protection threshold) in Oral mode — a clinical-safety regression. The actual gap is UX: the weight input reads as a regular dose input but only fires the safety advisory. Three approaches surfaced (Wave 5 SUMMARY Forward Note); Wave 6 ships the lowest-disruption recommended option (Option 3): a mode-conditional helper text rendered as a sibling `<p>` element after the weight input in `src/lib/pert/PertInputs.svelte` (line ~113-124, the SHARED card), gated `{#if pertState.current.mode === 'oral'}`. Helper text reads: "Used for the 10,000 units/kg/day safety check, not the dose calculation." (or similar — the planner picks exact copy). Tube-Feed mode unchanged (weight IS used in the Tube-Feed `lipasePerKg` secondary output per xlsx Tube-Feed B13 = B12/B4, so no helper text needed there). PERT-route only; ~3 LOC; no D-08b violation (RangedNumericInput shared component NOT touched — the helper text is a sibling element added to the route-local `PertInputs.svelte` parent); Phase 3.1 invariants preserved (function-binding bridges 3 hits stay byte-identical; the helper text is added BELOW the existing weight input block, not woven into the bridge wiring); Pitfall 4 e2e selectors preserved (the weight input's label "Weight" + suffix "kg" stay verbatim; the helper text is a NEW sibling `<p>` that doesn't conflict with any existing selector). Wave 6 plan ships this. Out of scope: Option 1 (visually distinguish weight as safety-only via a separate section header — higher LOC, risks regressing function-binding wiring) and Option 2 (make weight optional in Oral mode — degrades clinical safety; not approved). Both are documented as "considered but rejected" in the Wave 6 plan's `<deviations_considered>` block.

### Folded Todos

None — no pending todos in `.planning/todos/` matched the Phase 4 design-polish scope filter.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Workstream-local (read these first)

- `.planning/workstreams/pert/ROADMAP.md` §"Phase 4: Design Polish (`/impeccable` Critique Sweep)" — Phase boundary, 4 success criteria the verifier will check.
- `.planning/workstreams/pert/REQUIREMENTS.md` PERT-DESIGN-01..06 — The 6 requirements every plan's `requirements` field must reference.
- `.planning/workstreams/pert/STATE.md` — Workstream state showing Phase 3.1 closed (PERT-TEST-05 FULL); Phase 4 is the last phase before release.
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-CONTEXT.md` D-01..D-04 (identity-pert hue tokens), D-11 (first-run defaults), D-17 (`identityClass`), D-23 (NavShell ternary).
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-CONTEXT.md` D-04 (HeroResult usage), D-19 (em-dash audit), D-20 (`OctagonAlert` STOP-red icon).
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-UI-SPEC.md` — Phase 2 component-level design contract for `<PertInputs>` + `<PertCalculator>`. Phase 4 verifies this still holds post-Phase 3.1 bridge fix.
- `.planning/workstreams/pert/phases/03.1-selectpicker-bridge-fix/03.1-04-SUMMARY.md` — Phase 3.1 closure (the SelectPicker UX is now fully working — Phase 4 critique sees it for the first time in a polish context).

### Project-level design contracts (the rules being enforced)

- `DESIGN.md` (project root) — **The design contract.** 10 named rules: Identity-Inside, Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong (with STOP-red carve-out for PERT-SAFE-01 max-lipase + GIR severe-neuro), Five-Roles-Only typography, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, Flat-Card-Default. **Every plan's must_haves must reference this file.**
- `DESIGN.json` (project root) — Machine-readable color tokens + typography roles. Used by `/impeccable` for token validation.
- `CLAUDE.md` (project root) — Tech stack constraints, GSD workflow rules, design context (clinical brand, warm restraint, OKLCH).

### Precedent (Phase 42.1 = direct analog from v1.13 main workstream)

- `.planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/42.1-CONTEXT.md` D-01..D-33 — The full Phase 42.1 design-polish playbook. Phase 4 inherits the universal patterns shipped here and ONLY re-applies them PERT-locally. Read for the rubric, the disposition rules, and the "what counts as P1" precedent.
- `.planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/42.1-VERIFICATION.md` (if it exists) — Phase 42.1's actual outcome score (the bar to clear).

### Live source files (read to understand current state)

- `src/lib/pert/PertCalculator.svelte` — The route body; uses `<HeroResult>` (Phase 2 D-04). Critique focuses here for hero-owns-viewport.
- `src/lib/pert/PertInputs.svelte` — Post-Phase-3.1 (function-binding wrappers shipped at commit `f2da16d`); 221 LOC. Critique focuses here for input affordances + SegmentedToggle integration.
- `src/lib/pert/pert-config.json` — Advisory message strings (em-dash-clean per Phase 2 D-19).
- `src/routes/pert/+page.svelte` — Mounts `<PertInputs />` twice (sticky aside desktop + InputDrawer mobile per Phase 2 D-04).
- `src/app.css` lines ~214-263 — `.identity-pert` OKLCH token block (don't edit unless D-08a contrast retune triggers).
- `src/lib/shared/components/HeroResult.svelte` — READ-ONLY. The hero shared component PERT consumes.
- `src/lib/shared/components/SegmentedToggle.svelte` — READ-ONLY. The toggle shared component (D-08b forbids edits).
- `src/lib/shared/components/SelectPicker.svelte` — READ-ONLY. Post-Phase-3.1 unchanged; Phase 4 critique sees the picker UX at production polish for the first time.

### Tooling

- `~/.claude/plugins/marketplaces/impeccable/.claude/skills/impeccable/SKILL.md` (or equivalent path) — `/impeccable` skill definition. **Researcher MUST read this** to confirm the exact invocation API for D-09 (single-shot vs screenshot-driven).
- `~/.claude/skills/impeccable*` (alternative install path; check both).

### Cross-cutting

- v1.13 commit `8fde90e` — STOP-red carve-out precedent (GIR severe-neuro). Phase 2 D-04 mirrors at PERT max-lipase. Phase 4 critique verifies the precedent still reads correctly.
- v1.13 commit `917ecf2` — em-dash purge. Critique verifies no em-dash regression in PERT route.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (already wired by Phases 1-3.1)

- **`<HeroResult>` shared component** at `src/lib/shared/components/HeroResult.svelte` — already consumed by `<PertCalculator>` per Phase 2 D-04. Phase 4 verifies; doesn't re-wire.
- **`<InputDrawer>` shared component** + sticky-aside desktop pattern — already wired in PERT `+page.svelte` per Phase 2.
- **`<SegmentedToggle>`** — already bound to `pertState.current.mode` per Phase 2 D-06. Phase 4 verifies SC-3 (visual integration with identity hue).
- **`.identity-pert` OKLCH token** at `src/app.css:214-263` area — Phase 1 D-01..D-02 locked at WCAG AA. Phase 4 critique may surface a perceived-contrast finding warranting retune (D-08a allows).
- **Phase 3.1 derived-binding wrappers** at `src/lib/pert/PertInputs.svelte:154/189/200` — the picker UX is now production-quality for the first time. Phase 4 critique sees it.
- **`/impeccable` skill** at `~/.claude/plugins/marketplaces/impeccable/` — installed; researcher confirms the invocation API.
- **DESIGN.md + DESIGN.json design contract** at project root — locked. Phase 4 enforces, doesn't update.

### Established Patterns (carried forward — Phase 4 enforces)

- **Identity-Inside Rule** (Phase 42.1 D-01 + PERT Phase 1 D-03) — `.identity-pert` only on hero / focus rings / eyebrows / active nav. Critique flags violations as P1.
- **Em-dash ban** (v1.13 `917ecf2` + Phase 2 D-19 + Phase 3.1 D-08) — every PERT-route file has 0 em-dashes. Critique flags any em-dash as P1.
- **Tabular numerals** (`class="num"` on every numeric output) — Phase 2 component-level contract. Critique flags missing `.num` as P1.
- **Disposition rules** (Phase 42.2 precedent) — P1 fix-now, cheap P2 fix-now, expensive P2/P3 defer with note. Codified in D-03.

### Integration Points

- **Dev server** (`pnpm dev` → localhost:5173) — Wave 1 critique runs against this. Wave 3 spins up again to re-validate.
- **Theme toggle** — `+layout.svelte` reads/writes `localStorage['theme']`. Manual toggle for human critique; programmatic for automated capture.
- **Playwright** (already a dependency) — fallback for screenshot capture if `/impeccable` is screenshot-driven.
- **Clinical-gate command sequence** (inherited from Phase 3 Wave 4 + Phase 3.1 Plan 04) — Wave 3 reuses verbatim: svelte-check, vitest 425/425, pnpm build, pert-a11y 4/4, pert.spec 12/12, full Playwright, negative-space audit.

### Architectural Notes

- **The phase has a discovery beat in the middle.** Wave 1 produces findings; Wave 2 fixes them; Wave 3 verifies. The Wave 2 plan count cannot be authored ahead of Wave 1 output. The planner should produce a "Wave 2 placeholder" with explicit replan instructions per D-07a.
- **No new shared components.** Phase 42.1 D-06/D-07/D-08 already produced the universal patterns. Phase 4 does NOT add new shared infrastructure.
- **The `/impeccable` skill is the source of truth for findings.** Subjective critique without `/impeccable` would be inconsistent with the v1.13 Phase 42.2 precedent. The skill's transcripts go into the artifact set.

</code_context>

<specifics>
## Specific Ideas

- **The user wants this to feel like the v1.13 Phase 42.2 sweep felt** — short, focused, P1-driven, ≥35/40, then ship. The 6 PERT-DESIGN-* requirements were authored to mirror the v1.13 PR criteria 1:1.
- **No new clinical capabilities, no scope expansion.** This is the polish-and-ship phase. Anything that smells like "while we're here, let's also..." goes into Deferred Ideas.
- **Critique honestly.** A 35/40 with explicit triage notes for the 5-point gap is fine. A 40/40 that ignored real findings is not. The triage table in `04-FINDINGS.md` is the audit record — be honest about what was deferred and why.
- **Preserve the SelectPicker UX from Phase 3.1.** The picker now works correctly (state + UI both update on click). Phase 4 critique will see the production-polish version of the picker in dialog mode for the first time. Watch for: dialog scroll behavior on mobile portrait, focus management, keyboard nav (already covered by Phase 1 a11y but visual polish is new).

</specifics>

<deferred>
## Deferred Ideas

- **Cross-calculator design audit.** A P1/P2 finding caught in PERT may also exist in Morphine/Formula/GIR/Feeds/UAC. Phase 4 fixes ONLY the PERT route per D-08. If a cross-calculator finding surfaces, file it as a v1.16 backlog item with cross-reference; do not auto-propagate fixes to other calculators in this workstream.
- **DESIGN.md updates.** If a critique surfaces a missing or fuzzy DESIGN.md rule, file as a backlog item for a future "design contract refinement" phase. Phase 4 enforces the existing contract; it doesn't refactor it.
- **`/impeccable` document refresh.** v1.13 ran `/impeccable document` to generate the initial DESIGN.md. PERT does not regenerate; it reads the locked v1.13 contract. Future milestone may regenerate.
- **Real-iPhone smoke test.** v1.13 Phase 42.1 noted this as v1.13.1 hotfix fuel. Phase 4 likewise notes it as v1.15.1 hotfix fuel — out of CI scope.
- **Animation refinements.** Phase 42.1 D-18 audited animations across all calculators. Any animation finding for PERT specifically can be P3 (defer) unless it materially regresses clinical-trust polish.
- **Reviewed Todos (not folded):** None — todo cross-reference produced no matches.

</deferred>

---

*Phase: 04-design-polish-impeccable*
*Context gathered: 2026-04-26*
*Gap-closure update: 2026-04-26 — added D-12 (Phase 2 D-09 amendment for Oral daily-total) and D-13 (Prescribing-Artifact-Leads Rule cross-mode codification) after UAT test #4 surfaced Oral hierarchy inversion*
*Gap-closure update: 2026-04-26 — added D-14 (mode-conditional helper text on weight input clarifying safety-only role in Oral mode) after Wave 5 user UAT follow-up flagged weight-in-Oral input ambiguity; xlsx audit confirmed weight is safety-only in Oral; Wave 6 ships Option 3 (lowest-disruption, preserves PERT-SAFE-01)*
