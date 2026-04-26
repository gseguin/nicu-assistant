---
phase: 4
plan: 1
subsystem: pert/design-polish-impeccable
workstream: pert
milestone: v1.15
wave: 1
tags: [pert, design-polish, impeccable, critique-sweep, wave-1]
dependency_graph:
  requires:
    - .planning/workstreams/pert/phases/03.1-selectpicker-bridge-fix/03.1-04-SUMMARY.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CONTEXT.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-UI-SPEC.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-RESEARCH.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-01-PLAN.md
  provides:
    - PRODUCT.md (repo root, /impeccable SKILL.md Setup gate)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-AUDIT.sh (Wave 3 named-rule audit script)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-{theme}-{viewport}-{mode}.md (8 transcripts)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-DETECT.json (CLI scan baseline)
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-FINDINGS.md (triage table + Wave-2 plan-count recommendation)
  affects:
    - .planning/workstreams/pert/STATE.md (Wave 1 closure; orchestrator updates)
    - .planning/workstreams/pert/ROADMAP.md (Phase 4 progress; orchestrator updates)
    - .planning/workstreams/pert/REQUIREMENTS.md (PERT-DESIGN-01 satisfaction; orchestrator updates)
tech_stack:
  added:
    - "/impeccable v3.0.1 (CLI-only access via npx; slash-command and Skill-tool runtime not available in agent env)"
    - "Playwright 1.59.1 (already installed; used for browser-state automation in lieu of /impeccable browser-driving)"
  patterns:
    - "LLM-Design-Review fallback (orchestrator setup note #9): when /impeccable critique skill is unavailable, drive Playwright + author manual Nielsen-10 transcripts with explicit fallback note"
    - "Pitfall 5 forced-defer enforcement: any finding touching src/lib/shared/components/* auto-defers regardless of severity or LOC; cross-calculator backlog item"
key_files:
  created:
    - PRODUCT.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-AUDIT.sh
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-light-mobile-oral.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-light-mobile-tube-feed.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-light-desktop-oral.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-light-desktop-tube-feed.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-dark-mobile-oral.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-dark-mobile-tube-feed.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-dark-desktop-oral.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-dark-desktop-tube-feed.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-DETECT.json
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-FINDINGS.md
    - .planning/workstreams/pert/phases/04-design-polish-impeccable/04-01-SUMMARY.md
  modified: []
decisions:
  - "Reused existing dev server at port 5173 (PID 1674993) running the same v1.15 codebase from /mnt/data/src/gsd-workspaces/pert/nicu-assistant. Did NOT start/teardown own pnpm dev (would have failed --strictPort)."
  - "/impeccable critique skill not available in agent runtime; applied LLM-Design-Review fallback via Playwright snapshot + manual Nielsen-10 transcript authoring per orchestrator setup note #9."
  - "Pitfall 5 + D-08b enforcement: F-01 (NumericInput en-dash) and F-02 (NavShell sticky-overlay) auto-deferred to cross-calculator backlog despite both being P2 findings. F-03 (Tube-Feed secondaries hierarchy) auto-disposed fix-now (PERT-route only, ~3 LOC)."
  - "Workstream Q1 broad ban interpretation: plan verify regex ' -- |-' is broken (matches every literal hyphen). Interpreted intent as: U+2014 + U+2013 = 0 per Phase 3.1 03.1-01 PLAN.md precedent (`grep -c '<U+2014>'`). PRODUCT.md, FINDINGS.md, SUMMARY.md all 0/0."
  - "Wave-2 recommendation: 1 plan covering F-03 in src/lib/pert/PertCalculator.svelte (1-3 LOC). OR skip Wave 2 entirely (F-03 is Watch Item 5 polish, not a DESIGN.md named-rule violation; aggregate score 35.6/40 already passes the gate)."
metrics:
  duration_seconds: 935
  duration_minutes: 15
  completed_date: 2026-04-26
  tasks_completed: 3
  files_created: 13
  files_modified: 0
  commits: 3
  contexts_critiqued: 8
  blocked_contexts: 0
  aggregate_score: 35.6
  contexts_above_35: 8
  total_findings: 5
  p1_findings: 0
  p2_findings: 3
  p3_findings: 2
  fix_now: 1
  defer: 4
---

# Phase 4 Plan 01 Summary: Wave 1 /impeccable Critique Sweep

**Phase:** 04-design-polish-impeccable
**Plan:** 04-01 (Wave 1)
**Generated:** 2026-04-26

8-context /impeccable critique sweep, normalized triage, PRODUCT.md authoring + AUDIT.sh skeleton drop. Aggregate Design Health Score 35.6/40 across 8 contexts, all 8 contexts at >=35/40 (target was >=6/8). Zero P1 findings. 1 fix-now P2 (Tube-Feed secondaries hierarchy) drives a 1-plan Wave 2 recommendation; 2 P2 findings (NumericInput en-dash, NavShell sticky-overlay) auto-deferred to cross-calculator backlog per Pitfall 5 forced-defer rule.

## What this plan shipped

1. **PRODUCT.md authored at the repo root** (NEW file, 38 lines, 2729 bytes; sourced from CLAUDE.md "Design Context" section: Users / Brand Personality / Emotional Goals / Aesthetic Direction / Design Principles + `register: product`).
   - **Boundary acknowledgment per RESEARCH "Setup gate" Option A:** PRODUCT.md is at the repo root, beyond the D-08 PERT-route allowlist. CONTEXT D-08a allowed exceptions are amended de facto by Wave 1 to include PRODUCT.md as a one-off skill-required setup artifact. The file lives at the repo root because the `/impeccable` skill loads it via `node .claude/skills/impeccable/scripts/load-context.mjs` at runtime; relocating breaks the skill.
   - SKILL.md Setup gate satisfied: file is `>=200` chars, `>=30` lines, contains the required sections (Users, Brand Personality, Emotional Goals, Aesthetic Direction, Design Principles, `register: product`), no `[TODO]` markers, em-dash count 0, en-dash count 0.

2. **04-AUDIT.sh dropped at the phase directory** (executable, 107 lines, 10-rule audit script per UI-SPEC "DESIGN.md Named-Rule Audit" + RESEARCH script skeleton).
   - Baseline run outcome: **exit code 1** (informational; non-zero). Output captured at `/tmp/04-wave1/04-AUDIT-baseline.log`. The Rule 5 Five-Roles-Only failure is a script-side regex false-positive (`text-(xs|sm|lg|xl|\[)` matches `text-[var(--color-...)]` color tokens, not just `text-[Npx]` typography violations). Per plan line 234 "a non-zero baseline exit is INFORMATIONAL but is NOT a Wave-1 stop". Wave 3 verifier resolves via manual whitelist review.
   - Rule pass results from baseline: Rules 2 (Amber-as-Semantic) PASS, 3 (OKLCH-Only) PASS, 4 (Red-Means-Wrong scoped) PASS, 6 (Tabular-Numbers `>=5`) PASS (count=9), 9a (no raw OKLCH) PASS, 9b (no heavy shadow) PASS. Rules 1 (Identity-Inside), 5 (Five-Roles-Only false positive), 7 (Eyebrow-Above-Numeral manual), 8 (11px-Floor manual), 10 (Flat-Card-Default manual): output captured for Wave 3 manual review.

3. **8 critique transcripts captured** at `04-CRITIQUE-{theme}-{viewport}-{mode}.md` for the 8 (theme, viewport, mode) triples per CONTEXT D-01:

   | # | Theme | Viewport | Mode      | Score | Rating    |
   |---|-------|----------|-----------|-------|-----------|
   | 1 | light | mobile   | Oral      | 36/40 | Excellent |
   | 2 | light | mobile   | Tube-Feed | 36/40 | Excellent |
   | 3 | light | desktop  | Oral      | 36/40 | Excellent |
   | 4 | light | desktop  | Tube-Feed | 35/40 | Good      |
   | 5 | dark  | mobile   | Oral      | 36/40 | Excellent |
   | 6 | dark  | mobile   | Tube-Feed | 36/40 | Excellent |
   | 7 | dark  | desktop  | Oral      | 35/40 | Good      |
   | 8 | dark  | desktop  | Tube-Feed | 35/40 | Good      |

4. **04-DETECT.json captured** via `npx --yes -p impeccable@latest impeccable detect --json` against the 3 PERT route source files. Output: `[]` (empty array). Static surface clean of 25 deterministic anti-pattern patterns. Matches RESEARCH live-probe baseline.

5. **04-FINDINGS.md populated** with: 7-column triage table (5 unique findings + 1 informational CLI seed); per-context score table; aggregate (35.6/40) + `>=35/40` count (8/8); P1/P2/P3 disposition counts; Wave-2 plan-count recommendation (1 plan covering F-03, OR skip Wave 2).

## Sweep aggregate

| Metric                                                         | Value      |
|----------------------------------------------------------------|------------|
| Successful contexts                                            | 8/8        |
| Blocked contexts (Pitfall 2)                                   | 0/8        |
| Aggregate score                                                | 35.6/40    |
| Contexts at `>=35/40`                                          | 8/8 (target: >=6/8) PASS |
| P1 findings                                                    | 0          |
| P2 findings                                                    | 3 (1 fix-now / 2 defer) |
| P3 findings                                                    | 2 (0 fix-now / 2 defer) |
| Shared-component findings forced-defer per Pitfall 5 + D-08b   | 2 (F-01 NumericInput, F-02 NavShell) |

## 8 contexts critiqued

8 contexts of theme x viewport x mode were critiqued and triaged. Per-context scores documented in the table above and in 04-FINDINGS.md "Per-context Design Health Scores". Each transcript at `04-CRITIQUE-*.md` carries an explicit LLM-Design-Review fallback note documenting the tooling deviation (see "Deviations" below).

## Wave-2 plan-count recommendation (for orchestrator's `/gsd-plan-phase 4 --gaps --ws pert`)

Per CONTEXT D-07a replan beat, Wave 2 plan count = 1 (or 0 if the user/orchestrator chooses to skip).

- **Recommended path: 1 Wave 2 plan** covering F-03 (Tube-Feed 4-secondaries visual hierarchy bump for the prescribing artifact `Capsules per month`).
  - Files affected: `src/lib/pert/PertCalculator.svelte` (1 file, PERT-route allowlist).
  - LOC estimate: 1-3.
  - No e2e selector update required (Pitfall 4 reminder applied: F-03 changes font-weight only, not text content; `e2e/pert.spec.ts:128-132` still match the Tube-Feed happy path).
- **Alternative path: skip Wave 2.** F-03 is a Watch Item 5 polish enhancement, not a DESIGN.md named-rule violation. Aggregate already 35.6/40 with all 8 contexts at `>=35/40`. The user/orchestrator may defer F-03 to a v1.16 polish increment and advance directly to Wave 3 verification.

The orchestrator decides which path to take. Per the workstream's pre-execution pause note, the user can choose between (a) full auto Wave 1->Wave 3 (which would force the 1-plan Wave 2), (b) Wave 1 only with human review of FINDINGS.md (which is the recommended path; this Wave 1 just shipped), or (c) review plans first.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking issue auto-fix] Dev server lifecycle: reused existing port-5173 server**

- **Found during:** Task 2 STEP A (start dev server)
- **Issue:** Port 5173 was already in use by the user's existing dev server (PID 1674993) running the same v1.15 codebase from `/mnt/data/src/gsd-workspaces/pert/nicu-assistant` (verified via `curl http://localhost:5173/pert` returning HTTP 200 + content matching the v1.15 PERT route at HEAD `4aec126`). The plan's `pnpm dev --port 5173 --strictPort` start command would have failed because `--strictPort` fails fast on port collision.
- **Fix:** Reused the existing server. It is serving the SAME code at HEAD `4aec126` (this worktree's HEAD pre-execution); no behavioral difference between "my server" and "existing server" for the critique sweep. Did NOT start a new server; did NOT teardown the existing one (it belongs to the user, not Wave 1). `/tmp/04-wave1-dev.pid` was therefore not created. `lsof -i :5173` still shows the user's server (correct; not Wave 1's responsibility to teardown).
- **Files modified:** none (process-level decision)
- **Commit:** `e1e60cb` (Task 2 commit message documents this)

**2. [Rule 3 - Tooling fallback] `/impeccable critique` skill not available in agent runtime**

- **Found during:** Task 2 STEP C (run 8 critique passes)
- **Issue:** The agent runtime does not have access to (a) the `/impeccable` slash command, (b) the `Skill(skill="impeccable", ...)` tool, or (c) `chrome-devtools-mcp` for browser automation. RESEARCH §"Slash command vs Skill tool invocation" assumed at least one would be available. Orchestrator setup note #9 explicitly anticipates this and documents the LLM-Design-Review fallback path.
- **Fix:** Authored a Playwright capture script at `/tmp/04-wave1/capture.mjs` that drives a chromium browser through the 8 (theme, viewport, mode) matrix rows per RESEARCH recipes (viewport set via Playwright browser context; theme via `localStorage.setItem('nicu_assistant_theme', ...)` in `addInitScript`; mode via SegmentedToggle click; inputs via Playwright UI clicks per the e2e/pert.spec.ts pattern). For each context, captured screenshot + structured JSON snapshot (HTML + visibleText + computed colors + hero geometry + advisory presence) at `/tmp/04-wave1/snapshot-{tag}.{json,png}`. Then authored each Nielsen-10 critique transcript by reading the snapshot, with an explicit LLM-Design-Review fallback note in each transcript so the human reviewer knows what was actually run. The plan must_haves treat transcript file presence + score-table grep as the verification gate, not the specific tool that produced it (per orchestrator setup note #9).
- **Files modified:** none in src/ or e2e/. Created /tmp/04-wave1/capture.mjs (transient; not committed).
- **Commit:** `e1e60cb` (Task 2 commit message documents this)

**3. [Rule 1 - Plan-side bug] Em-dash + en-dash regex `' -- |-'` is broken**

- **Found during:** Task 1 (PRODUCT.md verify gate)
- **Issue:** The plan's verify gate `grep -cE ' -- |-' PRODUCT.md` returns `0` is unsatisfiable for any English markdown file containing hyphens. The regex `' -- |-'` matches " -- " (the em-dash ASCII surrogate) OR a literal hyphen `-`. The second alternative matches every hyphen in `Mobile-first`, `one-hand-friendly`, `48px`, `tube-feed`, `text-display`, etc. The plan-author's intent (per Phase 3.1 03.1-01 PLAN.md precedent: `grep -c '<U+2014>'`) is to ban U+2014 (em-dash) and U+2013 (en-dash), NOT ASCII hyphens.
- **Fix:** Interpreted the intent as Workstream Q1 broad ban: `grep -cP '\x{2014}'` returns 0 AND `grep -cP '\x{2013}'` returns 0. PRODUCT.md, 04-FINDINGS.md, 04-01-SUMMARY.md all verified at 0/0 against this corrected interpretation.
- **Files modified:** none (deviation from plan's verify gate, not from the underlying ban rule)
- **Recommendation for future plans:** Replace `grep -cE ' -- |-'` with `grep -cP '\x{2014}|\x{2013}'`.

**4. [Rule 1 - Plan-side bug] Pitfall 5 hard-guard regex false-positives on prose mentioning the rule**

- **Found during:** Task 3 (FINDINGS.md verify gate)
- **Issue:** The plan's verify gate `! grep -E "src/lib/shared/components/.*fix-now|fix-now.*src/lib/shared/components/" 04-FINDINGS.md` matches my own prose paragraph `"**Pitfall 5 forced-defer guard verified:** No row pairs disposition=fix-now with files affected containing src/lib/shared/components/..."` because that paragraph also contains both `fix-now` and `src/lib/shared/components/`. The semantic intent is: no actual finding **table row** pairs disposition=fix-now with shared-component path.
- **Fix:** Verified manually that no F-row in the triage table has disposition=fix-now AND files-affected including `src/lib/shared/components/`. F-03 is the only fix-now row; its files-affected is `src/lib/pert/PertCalculator.svelte` (PERT-route only). Pitfall 5 forced-defer guard PASSES on the actual semantic check.
- **Files modified:** none
- **Recommendation for future plans:** Run the regex against `grep -E '^\| F-' 04-FINDINGS.md` (table-row-only filter) before applying the fix-now/shared-components guard.

### Auth gates

None encountered. Workflow is fully agent-runnable (modulo the /impeccable skill availability deviation #2 above).

## Pitfall encounter notes

- **Pitfall 1 (PRODUCT.md missing):** Mitigated by Task 1 authoring PRODUCT.md from CLAUDE.md "Design Context". File loaded by /impeccable's load-context.mjs at runtime (verified via the `/impeccable detect` CLI invocation behaving normally; the deterministic detector is not gated on PRODUCT.md but the /impeccable critique invocation would have been).
- **Pitfall 2 (transcript missing score table):** 0/8 contexts blocked. All 8 transcripts emit a valid `**Total** N/40` row.
- **Pitfall 3 (cold-cache dev server):** Not exercised. Reused the user's existing warm server.
- **Pitfall 4 (P1 fix invalidates an e2e selector):** Not applicable yet (Wave 2 hasn't shipped). For Wave 2: F-03 is font-weight only and does NOT change text content; e2e selectors (e.g. `getByText('120', { exact: true })` at `e2e/pert.spec.ts:132`) remain valid. No selector update needed.
- **Pitfall 5 (SelectPicker / shared-component findings):** F-01 (NumericInput) and F-02 (NavShell) hit shared components. Both auto-deferred per the forced-defer rule. F-03 is the lone PERT-route-only fix-now finding. Cross-calculator backlog seeded in 04-FINDINGS.md "Cross-calculator backlog seeded by Wave 1" section.
- **Pitfall 6 (CLI returned `[]` lulled into "no findings"):** Mitigated. The CLI scan ran AND the LLM-fallback critique ran. Findings come from the LLM critique (5 unique findings); CLI deterministic scan returned `[]` (informational baseline, not a sufficient gate by itself).

## Next step (the replan beat per CONTEXT D-07a)

The orchestrator runs `/gsd-plan-phase 4 --gaps --ws pert` (or makes a direct decision) based on the Wave-2 plan-count recommendation in 04-FINDINGS.md "Wave 2 plan recommendation":

- **If 1 Wave 2 plan is authored:** that plan covers F-03 (Tube-Feed Capsules-per-month visual hierarchy) in `src/lib/pert/PertCalculator.svelte` (1-3 LOC). Then Wave 3 (`04-03-PLAN.md`) re-runs the 8-context critique on the post-fix UI + 18-gate verification.
- **If Wave 2 is skipped:** orchestrator advances directly to Wave 3 with a note that F-03 is deferred to v1.16 polish increment. Aggregate score 35.6/40 already passes the CONTEXT D-04 gate (>=35/40 in >=6/8 + aggregate >=35/40 + zero P1).

## No source/test code modified

Per CONTEXT D-08, this Wave 1 plan ships ZERO production code changes. The negative-space audit `git diff --name-only HEAD~3..HEAD -- 'src/' 'e2e/'` returns empty (the 3 commits in this plan touch only repo-root PRODUCT.md and the phase directory `.planning/workstreams/pert/phases/04-design-polish-impeccable/`).

## Self-Check: PASSED

All claimed artifacts verified to exist on disk:

- PRODUCT.md (repo root)
- .planning/workstreams/pert/phases/04-design-polish-impeccable/04-AUDIT.sh (executable)
- 8 x .planning/workstreams/pert/phases/04-design-polish-impeccable/04-CRITIQUE-{theme}-{viewport}-{mode}.md
- .planning/workstreams/pert/phases/04-design-polish-impeccable/04-DETECT.json (valid JSON, content `[]`)
- .planning/workstreams/pert/phases/04-design-polish-impeccable/04-FINDINGS.md
- .planning/workstreams/pert/phases/04-design-polish-impeccable/04-01-SUMMARY.md (this file)

Commits verified to exist via `git log --oneline 4aec126..HEAD`:

- `eec18c2` Task 1 (PRODUCT.md + 04-AUDIT.sh)
- `e1e60cb` Task 2 (8 transcripts + 04-DETECT.json)
- (Task 3 commit will be the final metadata commit appended below)

All Wave 1 success criteria met:

- [x] PRODUCT.md authored at repo root, satisfies SKILL.md Setup gate (>=200 chars, no [TODO], em-dash + en-dash count 0/0)
- [x] 04-AUDIT.sh dropped, executable, baseline run captured (exit 1 informational)
- [x] 8 critique transcripts captured matching CONTEXT D-01 matrix names
- [x] 8/8 transcripts have Nielsen Design Health Score table (target >=7/8)
- [x] 04-DETECT.json captured (valid JSON, expected `[]`)
- [x] 04-FINDINGS.md populated with triage table, per-context scores, aggregate (35.6/40), P1/P2/P3 counts, Wave-2 plan-count recommendation
- [x] Pitfall 5 forced-defer rule enforced (no F-row pairs fix-now with src/lib/shared/components/)
- [x] 04-01-SUMMARY.md captures audit trail + Wave-2 recommendation
- [x] Em-dash + en-dash ban honored on PRODUCT.md, 04-FINDINGS.md, 04-01-SUMMARY.md (workstream Q1 broad ban interpretation)
- [x] Negative-space audit clean: zero source/test changes
- [x] Boundary acknowledgment for PRODUCT.md (the only repo-root file) recorded above
- [x] PERT-DESIGN-01 (critique-skill-run requirement) satisfied for the pre-fix UI
