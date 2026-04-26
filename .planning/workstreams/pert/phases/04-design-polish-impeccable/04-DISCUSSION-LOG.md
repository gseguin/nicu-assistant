# Phase 4: Design Polish (`/impeccable` Critique Sweep) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 04-design-polish-impeccable
**Mode:** /gsd-discuss-phase 4 --ws pert --auto
**Areas discussed:** Critique sweep matrix; Triage policy; Score target + acceptance; DESIGN.md named-rule audit; Carry-forward (what's already polished); Wave structure + replan beat; Negative-space audit; Tooling (dev server + critique workflow); PERT-specific watch items

---

## Critique sweep matrix (the work)

| Option | Description | Selected |
|--------|-------------|----------|
| 8 critique passes (theme×viewport×mode) | Full coverage: Oral mode AND Tube-Feed mode each across 2 themes × 2 viewports. Catches mode-specific issues. | ✓ |
| 4 passes (theme×viewport, mode-agnostic) | Faster but misses input-affordance differences (Oral 2 NumericInputs vs Tube-Feed SelectPicker + 2 NumericInputs). | |
| 2 passes (themes only, default viewport+mode) | Too thin — misses mobile-specific issues v1.13 surfaced. | |

**Auto-mode choice:** 8 critique passes.
**Rationale:** Oral and Tube-Feed have materially different affordances; production polish needs both. Mirrors how Phase 42.1 ran the v1.13 sweep across all 5 calculators (10+ contexts).
**Locked as:** D-01

---

## Triage policy (P1/P2/P3 + disposition)

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 42.2 precedent (P1 fix-now, cheap P2 fix-now, expensive P2/P3 defer) | Direct port of the v1.13 rubric. P1 = DESIGN.md violation OR clinical-trust regression OR WCAG fail OR mobile-375 break. | ✓ |
| Stricter (all P1+P2 must fix) | Higher quality bar but expands phase scope unpredictably. | |
| Looser (only true clinical-safety blockers) | Risks shipping polish residue to v1.15 release. | |

**Auto-mode choice:** Phase 42.2 precedent.
**Rationale:** Established workflow with proven outcomes (v1.13 shipped at the 35+/40 bar). Disposition rules codified at D-03 (P2 ≤5 LOC = fix-now; >5 LOC or shared-component = defer).
**Locked as:** D-02 + D-03

---

## Score target + acceptance

| Option | Description | Selected |
|--------|-------------|----------|
| ≥35/40 in ≥6/8 contexts + aggregate ≥35/40 + zero P1 + DESIGN.md audit clean | The "predominant pass" pattern from v1.13 Phase 42.2. Allows 2 contexts at 33-34 with explicit triage. | ✓ |
| ≥35/40 in ALL 8 contexts | Strict; would force fixing edge cases that may not be high-value. | |
| ≥38/40 aggregate (raise the bar) | Out of scope — REQUIREMENTS pin the target at 35/40 (PERT-DESIGN-06). | |

**Auto-mode choice:** Predominant pass + zero P1 + audit clean.
**Rationale:** Matches PERT-DESIGN-06 contract + Phase 42.2 precedent.
**Locked as:** D-04

---

## DESIGN.md named-rule audit

| Option | Description | Selected |
|--------|-------------|----------|
| Scripted grep audit for all 10 rules + check output in SUMMARY | Independent of `/impeccable` LLM judgment; deterministic; reproducible. Per-rule grep mappings codified. | ✓ |
| `/impeccable` LLM judgment only | Risks LLM missing a violation a grep would catch. | |
| Manual visual audit | Subjective; not reproducible across reviewers. | |

**Auto-mode choice:** Scripted grep audit + `/impeccable` (defense in depth).
**Rationale:** Each named rule has a concrete grep target (D-05). Bash script lives in phase dir as a one-time deliverable (D-05a).
**Locked as:** D-05 + D-05a

---

## Carry-forward (what's already polished — DO NOT re-touch)

| Option | Description | Selected |
|--------|-------------|----------|
| Inherit Phase 42.1 universal patterns; verify only | HeroResult, sticky InputDrawer, DisclaimerBanner v2, em-dash purge, 11px floor, Identity-Inside Rule are ALREADY shipped. PERT inherits them. Phase 4 only catches PERT-specific drift. | ✓ |
| Re-implement universal patterns for PERT | Wasted work; would duplicate Phase 42.1. | |
| Audit Phase 42.1 patterns for PERT regression | This IS what Wave 1 critique does. Same as the chosen option. | (subsumed) |

**Auto-mode choice:** Inherit + verify; don't re-implement.
**Rationale:** Phase 2 D-04 already wired PERT into HeroResult + sticky drawer. Phase 4 doesn't re-do that work; it catches drift specific to PERT.
**Locked as:** D-06

---

## Wave structure + replan beat

| Option | Description | Selected |
|--------|-------------|----------|
| 3 waves with replan beat (Wave 1 critique → replan to author Wave 2 fixes → Wave 3 verify) | Matches Phase 42.2 pattern. Wave 2 plan count is unknown until Wave 1 ships findings. | ✓ |
| Single mega-plan (critique + fixes + verify in one) | Too much in one plan; loses GSD's atomic-commit benefits. | |
| 4-wave (critique / triage / fix / verify) | Splits triage from critique unnecessarily; triage IS critique output. | |

**Auto-mode choice:** 3 waves with explicit replan beat.
**Rationale:** Critique-then-fix is inherently 2-step. Wave 2 is a placeholder until Wave 1 produces findings; planner re-runs after Wave 1 to author the actual fix plans.
**Locked as:** D-07 + D-07a

---

## Negative-space audit + zero-regression contract

| Option | Description | Selected |
|--------|-------------|----------|
| PERT-route files only + named exceptions for `app.css` (.identity-pert block) and `registry.ts` (PERT entry only) | Strict scope; preserves zero-regression promise on the other 5 calculators. | ✓ |
| Allow any file change a critique finding justifies | Unbounded scope; risks regressions in shipped calculators. | |
| Phase-2-style "no shared-component changes" only | Too permissive (would allow editing other calculators). | |

**Auto-mode choice:** PERT-route only + 2 named exceptions for design-relevant files.
**Rationale:** Mirrors Phase 3.1 D-07 negative-space contract. Verifier asserts via `git diff --name-only`.
**Locked as:** D-08 + D-08a + D-08b

---

## Tooling (dev server + critique workflow)

| Option | Description | Selected |
|--------|-------------|----------|
| Live dev server (`pnpm dev`) + `/impeccable` against URL OR Playwright screenshot if needed | Realistic critique against actual rendered UI. Researcher confirms `/impeccable` API. | ✓ |
| Static HTML mock | Wouldn't catch reactive UI issues (mode switches, state updates). | |
| Production build (`pnpm build && pnpm preview`) | Heavier; dev mode + HMR is fine for critique. | |

**Auto-mode choice:** Dev server + `/impeccable` (researcher confirms exact API in D-09).
**Rationale:** Most realistic; matches how Phase 42.1 ran the v1.13 critique.
**Locked as:** D-09 + D-10

---

## PERT-specific watch items

| Option | Description | Selected |
|--------|-------------|----------|
| Codify the priors: identity-pert dark contrast, STOP-red prominence, SegmentedToggle integration, hero-owns-viewport, tertiary visual hierarchy, picker dialog mobile UX | Each is an explicit risk known from Phase 1+2+3.1 outcomes. Watch list helps researcher + critique focus. | ✓ |
| Generic "look at everything" critique | Loses the prior knowledge from prior phases; risks missing known risks. | |

**Auto-mode choice:** Codify the priors.
**Rationale:** Each watch item ties to a specific prior decision (D-04 hue tuning; D-04 STOP-red render; D-06 SegmentedToggle binding; D-04 HeroResult; D-04 secondaries; D-09 dialog polyfill).
**Locked as:** D-11

---

## Claude's Discretion

- `/impeccable` invocation form (single-shot URL vs Playwright-screenshot pipeline) — depends on skill API; researcher confirms.
- `04-FINDINGS.md` table layout — planner picks; column set is the contract.
- Wave 2 user-checkpoint — recommended brief AskUserQuestion after findings ship; auto-mode defaults to "fix all P1 + cheap P2, defer rest" without asking.

## Deferred Ideas

- Cross-calculator design audit — defer to v1.16 backlog if PERT findings reveal cross-cutting issues.
- DESIGN.md updates — Phase 4 enforces, doesn't refactor; updates go to a future "design contract refinement" phase.
- `/impeccable document` regeneration — out of scope; v1.13 contract is locked.
- Real-iPhone smoke test — v1.15.1 hotfix fuel, not CI.
- Animation refinements — P3 default unless materially regressing clinical-trust polish.
