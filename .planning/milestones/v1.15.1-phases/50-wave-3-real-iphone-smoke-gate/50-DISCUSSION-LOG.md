# Phase 50: Wave-3 — Real-iPhone Smoke Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 50-wave-3-real-iphone-smoke-gate
**Areas discussed:** Artifact location, Checklist format, Pass/fail rubric, Failure routing, Tester profile, Cross-calculator parity, Status-bar legibility verification, Hardware keyboard verification, Bfcache reproduction recipe, Outcome recording, Plan structure, Verification scope
**Mode:** `--auto` — Claude picked recommended defaults from REQUIREMENTS.md SMOKE-01..10 verbatim, ROADMAP.md Phase 50 success criteria, PROJECT.md v1.13 D-12 deferral closure, and Phase 49 D-24/D-25 cross-references. No interactive AskUserQuestion turns.

---

## Artifact location and naming

| Option | Description | Selected |
|--------|-------------|----------|
| **`.planning/v1.15.1-IPHONE-SMOKE.md`** | Verbatim from REQUIREMENTS.md SMOKE-01 + ROADMAP.md Phase 50 success criterion 10. Single-source-of-truth path; archived under `.planning/milestones/v1.15.1-…/` per the v1.13/v1.14 archive convention. | ✓ |
| `.planning/phases/50-…/50-IPHONE-SMOKE.md` | Phase-internal location. Lifetime extends past Phase 50 (Phase 51 release reads it; archived alongside milestone evidence) — phase-internal location forces a relocate for the milestone artifact. | |
| Project-root `IPHONE-SMOKE.md` | Bare-root location. Diverges from the `.planning/` convention used by all other planning artifacts. | |

**Selected:** `.planning/v1.15.1-IPHONE-SMOKE.md` per D-01 + D-02.
**Notes:** REQUIREMENTS.md SMOKE-01 and ROADMAP.md Phase 50 success criterion 10 both name this exact path. Diverging would force a follow-up rename.

---

## Checklist format

| Option | Description | Selected |
|--------|-------------|----------|
| **Markdown task-list (`- [ ]`) with structured 6-field block per SMOKE-XX** (title / closes / setup / action / expected / pass+notes) | Mirrors regulated-medical-device IFU pattern; clinical reviewers recognize it; works in GitHub PR view + raw markdown. | ✓ |
| Free-form prose checklist | Looser; harder to audit; ambiguity in pass/fail criteria. | |
| Spreadsheet (`.xlsx` or CSV) | Rejected — `.planning/` convention is markdown-only; binary files complicate diff review. | |
| YAML schema with parsable structure | Over-engineered for a 10-line checklist with one tester. | |

**Selected:** Markdown task-list with 6-field block schema per D-03 + D-04.
**Notes:** GitHub task-list checkboxes render natively in PR view, raw markdown, and on iPhone in Working Copy / GitHub mobile.

---

## Pass / fail rubric

| Option | Description | Selected |
|--------|-------------|----------|
| **Binary pass/fail; Expected text IS the rubric; verbatim observation required** | Clinical sign-off discipline; no fuzzy "good enough" sign-offs corroding the audit trail. | ✓ |
| Three-tier (pass / partial / fail) | Partial credit invites debate over "how partial is partial enough"; weakens the gate. | |
| Numeric score 0-10 per item | Over-quantifies a binary observation. | |

**Selected:** Binary pass/fail per D-06.
**Notes:** D-12 from v1.13 was deferred for organizational reasons (no team member with bedside iPhone access). The smoke gate's value comes from binary discipline; partial credit re-introduces the slippage that caused the deferral in the first place.

---

## Failure routing

| Option | Description | Selected |
|--------|-------------|----------|
| **Three options chosen at fail-time:** hotfix in v1.15.1 (decimal phase 50.X), defer to v1.15.2/v1.16 (backlog item), re-test on different iPhone/iOS | Matches GSD's existing decimal-phase + backlog patterns; tester picks the right route given the failure's nature. | ✓ |
| Single route: always hotfix in current milestone | Inflates v1.15.1 unboundedly; some failures (P-12 black-translucent) need v1.15.2 work that's out of scope here. | |
| Single route: always defer | Violates the gate's purpose — clinical-blocking failures should hotfix, not defer. | |

**Selected:** Three-option routing chosen at fail-time per D-08.
**Notes:** D-16 pre-routes SMOKE-09 (status-bar legibility) failure → v1.15.2 because the mitigation (FOUC theme-color) is non-trivial and out of v1.15.1 scope.

---

## Tester profile

| Option | Description | Selected |
|--------|-------------|----------|
| **Project owner (Claude's user) on a real iPhone 14 Pro+ at iOS 17+ in standalone PWA mode** | Owner has bedside discipline; ~15 min focused session; no clinical sign-off chain to coordinate at this regulatory phase. | ✓ |
| Wait for a clinical RD/RN/MD tester | v1.15.1 is pre-regulated; no formal clinical sign-off needed yet; would block indefinitely on tester scheduling — exactly the trap that produced D-12. | |
| Multiple iPhone models / iOS versions in a coverage matrix | Inflates effort; v1.15.1 targets iPhone 14 Pro+ specifically (Dynamic Island devices). Older iPhones / iPad / Android out of scope. | |

**Selected:** Owner-as-tester per D-09 + D-10.
**Notes:** Future v2.0+ regulated path may require formal sign-off; v1.15.1 is still pre-regulated.

---

## Cross-calculator parity (SMOKE-10)

| Option | Description | Selected |
|--------|-------------|----------|
| **6 sub-bullets in one SMOKE-10 entry — drawer-only behavior across all 6 calculators** | Single source of truth in `InputDrawer.svelte` means most SMOKE steps are inherently route-agnostic; only drawer behavior + focus order can diverge per calculator. | ✓ |
| 60-cell matrix (10 SMOKE steps × 6 calculators) | Rejected — 95% of cells are guaranteed-identical (inherent to single-source-of-truth `InputDrawer.svelte`); 60 sign-offs for ~6 informative cells is test inflation. | |
| One SMOKE-XX entry per calculator | Inflates checklist; per-calculator entries duplicate the verification steps. | |

**Selected:** 6 sub-bullets, drawer-only, in SMOKE-10 entry per D-12 + D-13.

---

## SMOKE-09 status-bar legibility

| Option | Description | Selected |
|--------|-------------|----------|
| **Verify only; if fail, route to v1.15.2 hotfix per D-08 option 2** | Mitigation (FOUC-script-toggled `<meta name="theme-color">`) is non-trivial; out of v1.15.1 scope. Phase 50 verifies, doesn't fix. | ✓ |
| Pre-fix the FOUC script in Phase 50 | Out of phase scope — Phase 50 is the smoke gate, not a code phase. Adding a code change inflates the phase + risks introducing regressions to Phases 47–49 surface. | |
| Skip SMOKE-09 if it always fails on iOS 17+ | Closes the audit trail; clinical reviewers expect every documented gap to be tested even if mitigation is deferred. | |

**Selected:** Verify-only per D-15 + D-16.

---

## SMOKE-07 hardware keyboard verification

| Option | Description | Selected |
|--------|-------------|----------|
| **If hardware keyboard available — test; if not — annotate DEFERRED with re-test target** | Pragmatic for owner-tester scenario; doesn't block 9/10 sign-off when hardware is unavailable; preserves the audit trail. | ✓ |
| Block sign-off until hardware keyboard available | Re-creates the D-12 deferral trap (waiting for resource that may not arrive). | |
| Drop SMOKE-07 entirely | Closes the audit trail; PITFALLS.md P-05 hardware-keyboard pitfall warrants a verification step even if deferred. | |

**Selected:** Test-if-available, annotate-DEFERRED-otherwise per D-17 + D-18.

---

## SMOKE-06 bfcache reproduction recipe

| Option | Description | Selected |
|--------|-------------|----------|
| **Phone-app + back-to-NICU-Assist OR lock + 30 sec + unlock + Home-Screen-icon** | Two equivalent reproduction paths; tester picks based on what's faster bedside; matches PITFALLS.md P-04 worst-case (app suspension during background task). | ✓ |
| Single mandated reproduction recipe | Brittle; if the chosen recipe doesn't trigger bfcache on the tester's device, the gate is unverifiable. | |
| Multiple recipes, all required | Test inflation — one successful bfcache restore proves the rebind path. | |

**Selected:** Two equivalent recipes per D-19 + D-20.

---

## Outcome recording

| Option | Description | Selected |
|--------|-------------|----------|
| **Tester edits the markdown checklist inline; ticks boxes, fills Notes, signs bottom; git commit IS the audit log** | Single artifact, single commit — minimal coordination overhead. | ✓ |
| Separate "smoke run report" markdown alongside the checklist | Two-artifact split inflates the audit chain; the checklist's signed state is itself the report. | |
| External tooling (Linear, Notion, etc.) | Out of project conventions; `.planning/` is the audit trail. | |

**Selected:** In-file recording per D-21 + D-22 + D-23.

---

## Plan structure

| Option | Description | Selected |
|--------|-------------|----------|
| **Single Plan 50-01 with two atomic commits — generate-checklist, sign-checklist** | Atomic-commit cadence matches the natural workflow boundary (artifact creation → human run → recorded outcome). | ✓ |
| Two plans (50-01 generate, 50-02 record) | Splits a single ~15-min bedside session across two plan boundaries — overhead with no atomic-commit benefit. | |
| Single plan, single commit | Conflates pre-test artifact creation with post-test signed outcome — harder to audit if a sign-off needs to be re-done. | |

**Selected:** Single plan, two atomic commits per D-24 + D-25.

---

## Verification scope

| Option | Description | Selected |
|--------|-------------|----------|
| **Phase 50 verifier checks file existence + box ticks + signature block + closure mapping; NO `pnpm` CI gate** | Phase 50's gate IS the human signature, not a CI assertion. Phase 49 already covered the CI surface verbatim (DRAWER-TEST-03/04). | ✓ |
| Add a CI step that lints the checklist for completeness | Marginal value at this scale (one human, one file); adds friction. | |
| Re-run all `pnpm` gates as part of Phase 50 | Re-tests Phase 49's surface; no new behavior under test in Phase 50. | |

**Selected:** Verifier reads the file; no CI gate for Phase 50 itself per D-26 + D-27.

---

## Claude's Discretion

The following decisions were left to Claude under `--auto` mode:

- Exact 6-field block schema per SMOKE-XX entry (title / closes / setup / action / expected / pass+notes).
- Bfcache reproduction recipe specifics (Phone-app vs lock-then-wake — both documented as equivalent).
- DEFERRED-with-route annotation format for unverifiable steps (e.g., SMOKE-07 without hardware keyboard).
- Two-commit atomic split (pre-test generate / post-test sign).
- Tester signature block shape (name + iPhone model + iOS version + date + calculator(s) tested).
- No-screenshot-in-checklist policy (D-05 — failure-routing follow-up issue is the place for screenshots, not the checklist file).
- Single-plan structure for Phase 50 (vs splitting into pre-test + post-test plans).

## Deferred Ideas

(See CONTEXT.md `<deferred>` section for full list.)

- PITFALLS.md P-12 mitigation (FOUC-script-toggled `<meta name="theme-color">`) — v1.15.2 if SMOKE-09 fails.
- Keyboard-open threshold tuning (100 px → 80/120 px) — v1.15.2 if bedside data forces a tweak.
- iPad split-keyboard / floating-keyboard verification — out of v1.15.1 scope.
- Formal clinician sign-off — v2.0+ regulated path.
- Performance instrumentation on the visualViewport singleton — v1.15.2 if SMOKE-04..06 reveal regressions.
- Non-iPhone-14-Pro-class device coverage — out of v1.15.1 scope.
- 60-cell parity sweep (10 SMOKE × 6 calculators) — defer indefinitely; cost > value.
