# Phase 54: Documentation Cleanup + Release v1.17.0 - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

The release-and-cleanup phase for v1.17 (Remove PERT Calculator). It delivers:
1. **Documentation sync (DOC-01..06):** bring `PROJECT.md` and `MILESTONES.md` in line with the 5-calculator reality — move the v1.15 PERT entry to an Invalidated/Removed subsection, drop/annotate PERT from Context + Architecture + Glossary + Key Decisions, and add the v1.17 MILESTONES entry.
2. **Version bump + verify (REL-01, REL-02):** bump `package.json` 1.16.1 → 1.17.0; verify the AboutSheet shows `v1.17.0` (auto via `__APP_VERSION__`, no manual edit).
3. **Full clinical gate (REL-03):** svelte-check 0/0, vitest fully green, Playwright + axe at-or-below the documented baseline.
4. **Milestone close groundwork (REL-04):** flip STATE.md status to `complete`, update PROJECT.md footer; the actual archive runs via the operator's top-level `/gsd:complete-milestone` after this phase verifies.

This is procedural documentation + release work. No application/runtime feature code changes. The DOC requirements are pre-pinned to exact files, sections, and string targets — there is essentially no implementation ambiguity; the planner executes them verbatim.

</domain>

<decisions>
## Implementation Decisions

### Clinical gate pass criterion (REL-03)
- **D-01:** REL-03's Playwright/axe portion is **"no increase from the documented baseline"**, NOT "all tests green". Phase 52 D-21 established ~32 pre-existing Playwright failures (28 axe `dlitem` + 2 disclaimer-banner + 2 calc-UI from the v1.15.1 era) as the owned baseline, assigned to the Phase-47 follow-up backlog — they are explicitly out of v1.17 scope. The gate asserts the failure count did NOT increase and that the 4 retired PERT a11y sweeps (and 2 PERT e2e specs) dropped out cleanly. **Hard green gates (must be 0 failures):** `pnpm check` (svelte-check 0/0) and `pnpm test:run` (vitest, currently 410/410). Playwright is a no-regression gate, not all-green.
- **D-02:** If running the full Playwright matrix locally is environment-blocked (browser binaries / dev server), record the structural test-count check (specs enumerate correctly, PERT specs absent) and defer the live run to CI — do NOT block the milestone on a local Playwright execution that the harness can't run. svelte-check + vitest remain the blocking local gates.

### Milestone archive timing (REL-04)
- **D-03:** Phase 54's plan completes DOC-01..06 + REL-01/02/03 and prepares REL-04 (PROJECT.md footer date, STATE.md status groundwork). The actual archive — moving REQUIREMENTS/ROADMAP/phases into `.planning/milestones/v1.17-*/` — is performed by the operator's explicit top-level `/gsd:complete-milestone` command AFTER Phase 54 verification passes. Rationale: `/gsd:complete-milestone` is a file-moving "ship" gesture and a separate skill; prior milestones (v1.13, v1.14, v1.15.1) all archived as a distinct operator action, not inside the final phase's executor. The plan should NOT shell out to `/gsd:complete-milestone` from inside an executor task. The phase verifier confirms the repo is archive-ready; the human runs the archive.

### Documentation edits (DOC-01..06)
- **D-04:** DOC-01..06 are locked, pre-pinned edits — each requirement names the exact file, section, current text, and target text. The planner produces tasks that execute these verbatim with no reinterpretation. Specifically: DOC-01 (PROJECT.md Validated → new `### Invalidated / Removed` subsection), DOC-02 (Context: six→five, drop PERT bullet, fix "all six calculators" phrasing), DOC-03 (Architecture: `<CalculatorPage>` route enumeration drops `/pert`, lists 5), DOC-04 (Glossary: PERT acronym removed or marked historical), DOC-05 (MILESTONES.md: new v1.17 top entry in standard format + annotate v1.15 PERT entry `[REMOVED in v1.17 — out of clinical scope]`), DOC-06 (Key Decisions table: "Ship PERT as self-contained workstream" Outcome → `❌ Removed in v1.17 — out of clinical scope (pediatric, not neonatal)`; the historical row stays for traceability).
- **D-05:** `.planning/` PERT references are HISTORICAL RECORD and stay intact except where a DOC requirement explicitly changes them (carries forward 52-CONTEXT D-16). The D-19 word-boundary grep gate excludes `.planning/`. Do NOT scrub PERT from MILESTONES/PROJECT beyond the specific DOC-01..06 edits — historical traceability is intentional.

### Version bump mechanics (REL-01, REL-02)
- **D-06:** Edit `package.json` `version` 1.16.1 → 1.17.0 only. `__APP_VERSION__` flows to the AboutSheet automatically via `vite.config.ts:11` (`define: __APP_VERSION__ = JSON.stringify(pkg.version)`), consumed in `src/lib/shared/about-content.ts:13`. REL-02 is **verify-only** — no manual AboutSheet edit; confirm `v1.17.0` renders via a build or the about-content version derivation. Regenerate `pnpm-lock.yaml` only if the version change requires it (a plain version field bump usually does not).

### MILESTONES.md v1.17 entry shape (DOC-05)
- **D-07:** The v1.17 entry follows the existing MILESTONES.md format observed at the top of the file: `## v1.17 Remove PERT Calculator (Shipped: <date>)`, then **Phases completed** (Phases 52–54; 52: 3 plans, 53: 1 plan, 54: N plans), **Known deferred items at close** (the SMOKE-01..10 + REL-04-smoke carry-forward already tracked in STATE.md; note SMOKE-10 re-scopes 6→5 calculators), **Notes** (label v1.16 skipped; package re-aligned to 1.17.0), and **Key accomplishments** (full PERT purge, favorites upgrade-safety regression). Insert ABOVE the v1.15.1 entry.

### Claude's Discretion
- Plan granularity (single plan vs. 2 plans splitting DOC from REL) and exact task ordering within the phase — planner decides. A sensible split: Wave 1 = doc edits (DOC-01..06) + version bump (REL-01), Wave 2 = verify gate (REL-02/03) + REL-04 groundwork; or a single sequential plan since there are no parallelizable conflicts. No strong preference.
- Exact wording of the v1.17 MILESTONES "Key accomplishments" bullets — planner drafts from Phase 52/53 SUMMARYs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & roadmap
- `.planning/ROADMAP.md` §"Phase 54: Documentation Cleanup + Release v1.17.0" — goal + 5 Success Criteria (the de-facto spec; each criterion maps to DOC/REL IDs)
- `.planning/REQUIREMENTS.md` — DOC-01..06, REL-01..04 acceptance text with exact file/section/string targets

### Documents to edit (DOC requirements)
- `.planning/PROJECT.md` — Validated list (DOC-01), Context (DOC-02), Architecture (DOC-03), Glossary (DOC-04), Key Decisions table (DOC-06), Last-updated footer (REL-04)
- `.planning/MILESTONES.md` — new v1.17 top entry + annotate v1.15 PERT entry (DOC-05); existing format template is the v1.15.1 entry at the top of the file
- `.planning/STATE.md` — status → `complete` groundwork (REL-04)

### Version & gate surface (REL requirements)
- `package.json` — `version` 1.16.1 → 1.17.0 (REL-01)
- `vite.config.ts:11` — `__APP_VERSION__` define (REL-02 wiring, verify-only)
- `src/lib/shared/about-content.ts:13` — AboutSheet version consumer (REL-02 verify-only)

### Prior-phase carry-forward
- `.planning/phases/52-code-purge-test-suite-repair/52-CONTEXT.md` — D-16 (.planning is historical record), D-19 (word-boundary grep gate, excludes .planning), D-21 (Playwright baseline = no-increase, not all-green)
- `.planning/phases/52-code-purge-test-suite-repair/52-SUMMARY*.md` and `.planning/phases/53-favorites-safety-net-verification/53-01-SUMMARY.md` — source material for the MILESTONES v1.17 "Key accomplishments" bullets
- STATE.md "Deferred Items" table — the SMOKE-01..10 + REL-04-smoke carry-forward to record in the v1.17 MILESTONES "deferred" section

### Milestone close mechanism
- `/gsd:complete-milestone` (skill) — operator runs this as a top-level command AFTER Phase 54 verifies; it performs the archive to `.planning/milestones/v1.17-*/`. NOT invoked from inside an executor (D-03).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `__APP_VERSION__` build-time constant (vite.config.ts → about-content.ts): bumping package.json auto-propagates the version to the AboutSheet. No UI code edit needed for REL-02.
- MILESTONES.md format is self-templating — the v1.15.1 entry at the top is the exact shape to mirror for the v1.17 entry (Phases completed / Known deferred / Notes / Key accomplishments).

### Established Patterns
- Milestone close is a two-step ritual: (1) the final release phase syncs docs + version + gate, (2) `/gsd:complete-milestone` archives. Phases 43, 46, 51 followed this. Keep it.
- `.planning/` historical PERT references are intentional (D-16/D-05) — the grep gate excludes `.planning/`, so doc cleanup is surgical (only the named DOC edits), not a blanket scrub.

### Integration Points
- No runtime/app code changes. The only non-doc edit is `package.json` version. The clinical gate (svelte-check, vitest, Playwright, axe) is a verification surface, not a code surface.

</code_context>

<specifics>
## Specific Ideas

- v1.16 label was intentionally SKIPPED (package drifted to 1.16.x during v1.15.1 quick-task patches); v1.17 re-aligns the milestone label with the package version. The MILESTONES Notes section should state this explicitly so future readers don't hunt for a missing v1.16 entry.
- Exact DOC-06 target string: Outcome column → `❌ Removed in v1.17 — out of clinical scope (pediatric, not neonatal)` (the historical decision row is retained).
- Five surviving calculators (for DOC-02/03 phrasing): morphine-wean, formula, GIR, feeds, UAC/UVC.

</specifics>

<deferred>
## Deferred Ideas

- **SMOKE-01..10 + REL-04 smoke-sign-off** — the v1.15.1 real-iPhone smoke gate carries forward independently and is explicitly OUT OF SCOPE for v1.17 (STATE.md Deferred Items). v1.17 ships with automated gates green; the smoke checklist is recorded in the v1.17 MILESTONES "deferred" section, not executed here. SMOKE-10 should be re-scoped 6→5 calculators when eventually run.
- **53-HUMAN-UAT.md SAFE-01 browser-level check** — the favorites visual confirmation carried from Phase 53; pairs with the deferred smoke checklist, not a v1.17 release blocker.
- **WR-01 (favorites.recover() valid-duplicate dedup)** — favorites-hardening candidate surfaced in Phase 52 code review; future phase/backlog, not v1.17.

None of these block the v1.17 release.

</deferred>

---

*Phase: 54-documentation-cleanup-release-v1-17-0*
*Context gathered: 2026-05-23*
