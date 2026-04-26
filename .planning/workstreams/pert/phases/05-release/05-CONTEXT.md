# Phase 5: Release - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** Discuss-phase --auto (4 gray areas auto-resolved with recommended defaults)
**Workstream:** pert
**Milestone:** v1.15

<domain>

## Phase Boundary

Workstream `pert` v1.15 ships with a clean clinical gate, the AboutSheet displays the new version automatically via the existing `__APP_VERSION__` Vite-define wiring, and validated requirements + decisions fold back into the workstream-local PROJECT.md so `pert` is ready for `/gsd-workstreams complete pert` to merge back into main and archive the workstream.

This is a **release / ship** phase, not a feature phase. The work is mostly mechanical:
1. Bump `package.json` version
2. Run the full clinical gate
3. Update workstream-local PROJECT.md / ROADMAP.md to record the closure
4. Clean orphan planning artifacts
5. Hand off to `/gsd-workstreams complete pert` for the main-repo merge

No new code surfaces, no new tests, no design changes. Phase 4 closed the visual + functional polish; Phase 3 + 3.1 closed the test surface; Phase 1 + 2 closed the architecture + calc layer. Phase 5 is the bookend.

</domain>

<decisions>

## Implementation Decisions

### Versioning

- **D-01 [auto-recommended]:** Target version is **v1.15.0**. Rationale: the workstream was scoped as v1.15 from creation (see `.planning/workstreams/WORKSPACE.md`, the roadmap header `## Phase Details` heading "Workstream `pert` / Milestone v1.15", REQUIREMENTS.md line 89's fallback case "else v1.15.0", and every Phase 4 SUMMARY's "Phase 4 vs Phase 3.1 baseline deltas" section citing v1.15). Main is currently in v1.14 (Kendamil + desktop nav, in progress); `pert` ships AFTER Kendamil per D-02. The version bump touches exactly one file: `package.json` `version: "1.13.0"` -> `version: "1.15.0"` (jumping from 1.13 directly to 1.15 because the v1.14 number is reserved for the in-flight main Kendamil milestone).

- **D-02 [auto-recommended]:** Workstream completion order is **`pert` merges to main AFTER Kendamil v1.14 ships**. Main is currently in v1.14 (workspace/pert worktree branched off main `7fee0b9`). Merging `pert` first would force main to bump to v1.15 mid-Kendamil, making the Kendamil milestone closure messy. Waiting until Kendamil ships keeps the timeline cleaner: Kendamil ships v1.14 -> main is at v1.14 -> we merge `workspace/pert` -> bump to v1.15 -> ship. The Phase 5 source-edit step (D-04) only bumps the version in the worktree; the actual main-repo merge is handled by `/gsd-workstreams complete pert` (or manual `git merge workspace/pert` from the main repo, see D-09).

### Clinical gate

- **D-03 [auto-recommended]:** **Full clinical gate WITHOUT visual `/impeccable` re-run.** Phase 4 closed the visual sweep at aggregate 36.25/40, 8/8 contexts at >=35/40, with three approved human-eye UAT verdicts on the F-03 Approach C + D-12 + D-14 fixes. Re-running the 8-context `/impeccable` sweep would add ~15-20 minutes of runtime without producing new evidence (the post-Wave-6 source diff vs Wave 4's audited state is +5 LOC of helper text, well within the noise floor of the design-polish score). Phase 5 instead runs the **functional + a11y clinical gate inherited from the v1.13 Phase 43 release-readiness pattern** plus the post-Phase-4 invariants check:
  - svelte-check 0 errors / 0 warnings (unchanged baseline; ~4586 files)
  - full vitest run: 425/425 passing (Phase 4 baseline preserved across all 6 plan-level commits)
  - pnpm build succeeds; production bundle within +/- 5 KiB of the post-Wave-6 baseline (currently ~575.99 KiB per Phase 4 closure record; verify exact number at execute time)
  - CI=1 pnpm exec playwright test pert-a11y -> 4/4 passing
  - CI=1 pnpm exec playwright test pert.spec -> 12/12 passing
  - CI=1 pnpm exec playwright test (full suite) -> 117/118 passing + 1 baseline flake on `disclaimer-banner.spec.ts:28` (matches Phase 1/2/3/3.1/4 precedent)
  - extended axe suite count at the post-Phase-4 sweep count (verify exact number at execute time; the roadmap target is "35/35 sweeps after adding 2 PERT axe sweeps", which assumes the pre-PERT count was 33; if the actual baseline differs, the planner records the actual numbers in the plan)
  - PERT-route-specific invariants: `tracking-wider` count = 2 (Wave 4 + Wave 5); `font-extrabold` count = 2 (Wave 2 + Wave 5); helper text "Used for the 10,000 units/kg/day safety check, not the dose calculation." present in `PertInputs.svelte` exactly once; Phase 3.1 D-01 function-binding bridges = 3 hits in PertInputs.svelte; zero string-bridge proxies; em-dash + en-dash count 0/0 across the 4 PERT-route source files
  - PERT-SAFE-01 max-lipase-cap byte-identical: `pert-config.json` advisories array unchanged from Wave 1 commit `2dc7ae2`; calculations.ts unchanged from Phase 2; PertInputs.svelte's helper text references the cap but does not change the cap behavior

If any gate fails, Phase 5 STOPS and the failure is logged as a gap-closure cycle (`/gsd-discuss-phase 5 --gaps --ws pert`). The version bump only happens after ALL gates pass.

### Source-edit scope

- **D-04 [auto-recommended]:** **Single-file source edit:** `package.json` only. `version: "1.13.0"` -> `version: "1.15.0"`. The AboutSheet wiring is already complete: `vite.config.ts` defines `__APP_VERSION__` from `pkg.version` (line ~10-12); `src/lib/shared/about-content.ts` consumes `__APP_VERSION__` via `appVersion = ...` (line 13) and applies it to all 6 calculator entries (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT — line 22, 34, 47, 60, 72, 83). No code change is needed in `about-content.ts` or the AboutSheet components; the version flows automatically. **Verification at execute time:** `grep version package.json` returns `"version": "1.15.0"`; the AboutSheet renders `v1.15.0` for the PERT entry (and all 5 others). Run `pnpm dev` and visually confirm before the bump commits.

- **D-04a [auto-recommended]:** **Strict allowlist for the version bump commit.** Only `package.json` is in the diff. NO other source/test/config edits in the bump commit. `pnpm-lock.yaml` may NEED an update if pnpm rewrites it on the bump (typically not, since the version field doesn't drive lockfile regeneration); if pnpm DOES rewrite the lockfile, the resulting diff is allowed in the bump commit because it's a direct mechanical consequence (not a manual edit). The planner verifies pnpm's behavior at execute time and records what landed in the SUMMARY.

### PROJECT.md fold-back

- **D-05 [auto-recommended]:** **Workstream-local PROJECT.md / MILESTONES.md update only in this phase.** The workstream lives at `.planning/workstreams/pert/`; check what canonical-record file exists (`PROJECT.md` OR `MILESTONES.md` -- the planner verifies at execute time). Append the v1.15 closure entries:
  - All 6 PERT-DESIGN-XX requirements (01..06) flipped Active -> Validated (already done in Wave 4 commit `a6d9469`; Phase 5 verifies still in that state)
  - All 5 PERT-REL-XX requirements (01..05) flipped Active -> Validated as part of Phase 5's own closure
  - Cross-reference to PERT-ARCH/HUE/DATA/ORAL/TUBE/MODE/SAFE/TEST IDs (already Validated post-Phase-3.1; Phase 5 confirms still Validated)
  - List of all phase closures (Phase 1, 2, 3, 3.1, 4) with completion dates + commit refs
  - Workstream-completion handoff note pointing at `/gsd-workstreams complete pert` for the main-repo merge

- **D-06 [auto-recommended]:** **Main project `.planning/PROJECT.md` fold-back deferred to `/gsd-workstreams complete pert`.** Main is in v1.14 mid-Kendamil; editing main's PROJECT.md from the workstream worktree risks merge conflicts. The workstream-completion handler is designed exactly for this: it runs from the main repo AFTER the merge lands, reads the workstream-local closure record, and applies the v1.15 entries to main's PROJECT.md as a single atomic update. Phase 5 records all the data the completion handler will need (in the workstream-local PROJECT.md / MILESTONES.md update from D-05) but does NOT edit main's `.planning/PROJECT.md`.

### Workstream-local ROADMAP.md update

- **D-07 [auto-recommended]:** **Flip all `## Progress` rows to Complete with completion dates.** The workstream-local `.planning/workstreams/pert/ROADMAP.md` has a Progress table at lines ~111-120 (the user manually edited Phase 1/2/3 markers to `[ ]` in the Phases section header but the Progress table is the canonical state). Phase 5 flips every Phase row in the Progress table to Complete. The Phase 5 row itself is flipped at the end of Phase 5's own execution (Wave 4 SUMMARY commit pattern). Plan list field for Phase 5 gets enumerated with the actual plan filenames once the planner authors them (Phase 5 is small enough to fit in 1-2 plans; planner picks).

### Orphan planning artifact cleanup

- **D-08 [auto-recommended]:** **Light cleanup, conservative scope.** The phase 4 directory has accumulated 8 + 8 = 16 critique transcripts (`04-CRITIQUE-*.md` Wave 1 + `04-CRITIQUE-FINAL-*.md` Wave 3) plus FINDINGS, DETECT, AUDIT.sh, UI-SPEC, RESEARCH, CONTEXT, DISCUSSION-LOG, 6 PLAN.md, 6 SUMMARY.md, VERIFICATION, UAT, plus the just-added .continue-here.md (which is now stale post-Wave-6 closure). Phase 5 cleanup:
  - DELETE `.continue-here.md` in phase 4 directory (stale; Phase 4 is closed; the file was the pre-Wave-2 paused-pre-execution handoff)
  - DELETE `__capture.mjs` at the workstream root (Wave 1 ad-hoc Playwright capture script; not part of the persisted source tree)
  - DELETE the `.playwright-mcp/` directory at the workstream root (cache from the orchestrator's Playwright MCP UAT screenshots; not part of persisted source)
  - DELETE the orchestrator's UAT-screenshot PNGs at the workstream root (`pert-after-f03-verify.png`, `04-uat-tube-feed-f03.png`, `04-uat-oral-unchanged.png`, `04-04-uat-light-desktop-tube-feed.png`, `04-05-uat-oral-d12.png`, `04-05-uat-tube-feed-d13.png`, `04-06-uat-oral-helper.png`, `04-06-uat-tube-feed-no-helper.png`) — these are debug artifacts, not part of the source tree
  - KEEP all 04-CRITIQUE-* and 04-CRITIQUE-FINAL-* transcripts (audit trail; cheap to keep; useful for future PERT-pattern phases as reference)
  - KEEP all phase 1/2/3/3.1/4 PLAN + SUMMARY files (the workstream's persistent decision history)
  - KEEP CONTEXT, RESEARCH, DISCUSSION-LOG, UAT, VERIFICATION (canonical phase artifacts)
  - The cleanup runs in a single git-rm + commit step early in the Phase 5 plan, BEFORE the version bump, so the bump commit has a clean diff.

### Plan structure

- **D-09 [auto-recommended]:** **Single Phase 5 plan, 4-5 tasks, autonomous.** Phase 5 is small enough that 1 plan suffices. Suggested task structure:
  - Task 1: Cleanup orphan planning artifacts (D-08; git-rm + commit)
  - Task 2: Run the full clinical gate (D-03; capture evidence at /tmp/05-gate-NN.log; STOP on any failure)
  - Task 3: Bump version in package.json (D-04; visually verify AboutSheet shows v1.15.0; commit `chore: bump version to v1.15.0`)
  - Task 4: Update workstream-local PROJECT.md / MILESTONES.md + ROADMAP.md Progress table + REQUIREMENTS.md PERT-REL-01..05 Active->Validated (D-05 + D-07; commit `docs(pert/05): close workstream — v1.15.0 release readiness`)
  - Task 5: Compose 05-01-SUMMARY.md with the Phase 5 closure record + handoff to `/gsd-workstreams complete pert` for the main-repo merge (D-06)
  - All tasks are `type: auto`. No `checkpoint:human-verify` because there's nothing visual to UAT — the version bump is mechanical and the clinical gate is automated.

### Out-of-scope (deferred to workstream-completion or future phases)

- **D-10 [auto-recommended]:** Out of scope for Phase 5:
  - Main repo merge (`/gsd-workstreams complete pert` handles)
  - Main `.planning/PROJECT.md` update (workstream-completion handler)
  - GitHub release / changelog publication (manual step after merge; not GSD-orchestrated unless the main repo has a release skill registered)
  - Branch deletion / worktree removal (also workstream-completion handler's job)
  - Cross-calculator backlog (F-01 NumericInput en-dash, F-02 NavShell sticky-overlay, pert-config.json en-dash; flagged for v1.15.x or v1.16 per Wave 4 SUMMARY's "Cross-calculator backlog seeded by Wave 1" section)
  - Weight-in-Oral UX evolution past Option 3 helper text (Wave 6 shipped Option 3; if future user feedback wants Option 1 or another rung, that's a v1.15.x or v1.16 cycle)

### Claude's Discretion

- Exact wording of the `chore: bump version to v1.15.0` commit body and the `docs(pert/05): close workstream` commit body — the planner picks but mirrors the v1.13 Phase 43 release commit pattern from main if accessible (`git log --oneline | grep -i 'release\|version' | head -5` to find precedent).
- Whether the cleanup task (Task 1) and clinical gate (Task 2) commit separately or share a single commit — recommend separate (the clinical gate is verification-only with no diff; cleanup has a diff). Planner picks.
- Whether the SUMMARY commit (Task 5) is separate from Task 4's tracking commit, or folded into it — recommend separate (mirrors the Phase 4 SUMMARY-commit pattern from Waves 4/5/6); planner picks.

### Folded Todos

None — no pending todos in `.planning/todos/` matched the Phase 5 release scope filter.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Workstream-local (read first)

- `.planning/workstreams/pert/ROADMAP.md` — Phase 5 goal + 4 success criteria + Progress table
- `.planning/workstreams/pert/REQUIREMENTS.md` — PERT-REL-01..05 (Phase 5 requirements) + traceability table
- `.planning/workstreams/pert/STATE.md` — workstream state (Phase 4 closed; Wave 6 closure paragraph at most-recent entry; current focus on Phase 5)
- `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-03-SUMMARY.md` — Phase 4 Wave 3 closure record (the bookend reference for Phase 5's "release-readiness" claim)
- `.planning/workstreams/pert/phases/04-design-polish-impeccable/04-06-SUMMARY.md` — Wave 6 closure (most recent state — D-14 helper text, post-fix counts, all approved)

### Main project precedent (release patterns)

- `.planning/phases/43-release-v1-13-0/` — v1.13 release phase (the direct analog from main; read its SUMMARY for the version-bump + clinical-gate + PROJECT.md fold-back pattern)
- `.planning/STATE.md` — main project state (currently in v1.14 Kendamil; Phase 5 needs to know main is in v1.14, not v1.13, to confirm D-01 v1.15.0 target)

### Project-level files Phase 5 reads (but only `package.json` writes)

- `package.json` — version bump target (D-04)
- `vite.config.ts` (or `vite.config.js`) — `__APP_VERSION__` define wiring (D-04 verification only; not edited)
- `src/lib/shared/about-content.ts` — consumes `__APP_VERSION__`; verify the PERT entry at line ~83 renders with the new version (D-04 verification only; not edited)

</canonical_refs>

<existing_code_insights>

## Existing Code Insights

### Version-flow wiring (already complete; Phase 5 only bumps the source value)

- `package.json:3`: `"version": "1.13.0"` -> bump to `"1.15.0"` (D-04)
- `vite.config.ts:10-12` (verified line numbers at execute time): `define: { __APP_VERSION__: JSON.stringify(pkg.version) }` — the Vite-define constant feeds the runtime
- `src/lib/shared/about-content.ts:3`: `declare const __APP_VERSION__: string;` — TypeScript ambient declaration
- `src/lib/shared/about-content.ts:13`: `const appVersion = ...; v${...} : '0.0.0'`;` — the rendered string at runtime
- `src/lib/shared/about-content.ts:22, 34, 47, 60, 72, 83`: 6 calculator entries (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) all use `version: appVersion` — all 6 reflect the version automatically

### What's NOT in scope (D-08 cleanup target list)

Files at the workstream root (orchestrator UAT debug artifacts; not part of source tree):
- `__capture.mjs` (~4 KB; Wave 1 ad-hoc Playwright capture)
- `.playwright-mcp/` (directory; Playwright MCP cache from orchestrator UAT)
- `pert-after-f03-verify.png`, `04-uat-tube-feed-f03.png`, `04-uat-oral-unchanged.png`, `04-04-uat-light-desktop-tube-feed.png`, `04-05-uat-oral-d12.png`, `04-05-uat-tube-feed-d13.png`, `04-06-uat-oral-helper.png`, `04-06-uat-tube-feed-no-helper.png` (debug PNGs; ~50-200 KB each)

Files in `.planning/workstreams/pert/phases/04-design-polish-impeccable/`:
- `.continue-here.md` (stale; Phase 4 is closed; the file was the pre-Wave-2 paused-pre-execution handoff)

</existing_code_insights>

<specifics>

## Specific Ideas

- The `chore: bump version to v1.15.0` commit message follows the precedent in main's Phase 43 release (v1.13.0 commit; check `git log --oneline | grep 'bump\|release' | head` for the actual main commit message form).
- The workstream-local PROJECT.md / MILESTONES.md fold-back records v1.15 entries at the same depth as the existing v1.13 / v1.12 / earlier entries (use main's `.planning/PROJECT.md` as the format reference for what Validated entries look like).
- The `/gsd-workstreams complete pert` handoff at the end of Phase 5's SUMMARY tells the user the exact command sequence to run from the main repo: `cd /mnt/data/src/nicu-assistant && git merge workspace/pert && git worktree remove /home/ghislain/gsd-workspaces/pert/nicu-assistant && /gsd-workstreams complete pert` (verify exact paths against `.planning/workstreams/WORKSPACE.md`).

</specifics>

<deferred>

## Deferred Ideas

- **Cross-calculator backlog (F-01 + F-02 + pert-config.json en-dash).** Phase 4's Wave 4 SUMMARY documented these as v1.15.x or v1.16 hotfix candidates. Phase 5 does NOT close them; they're tracked in the workstream-local PROJECT.md / MILESTONES.md fold-back's "Open backlog at workstream completion" section.
- **Real-iPhone smoke test.** v1.15.x hotfix fuel per CONTEXT D-02 (Deferred Ideas) of Phase 4. Out of CI scope.
- **Animation refinements.** P3 default unless materially regressing clinical-trust polish. Out of scope.
- **GitHub release publication / changelog.** Not GSD-orchestrated unless a release skill is registered in main. The user does this manually after the merge lands.
- **Main `.planning/PROJECT.md` update.** Deferred to `/gsd-workstreams complete pert` (D-06).

</deferred>

---

*Phase: 05-release*
*Context gathered: 2026-04-26 via /gsd-discuss-phase --auto*
*Workstream: pert / Milestone: v1.15*
