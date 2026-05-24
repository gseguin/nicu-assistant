# Phase 54: Documentation Cleanup + Release v1.17.0 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 54-documentation-cleanup-release-v1-17-0
**Areas discussed:** Clinical-gate pass criterion, Milestone-archive timing, Doc-edit precision, Version-bump mechanics
**Mode:** `--auto` (autonomous single-pass; recommended option auto-selected per area, no interactive prompts)

---

## Clinical gate pass criterion (REL-03)

| Option | Description | Selected |
|--------|-------------|----------|
| No-increase from D-21 baseline (Playwright); svelte-check 0/0 + vitest green are hard gates | Playwright/axe is a no-regression gate; pre-existing ~32 failures are owned backlog, not v1.17 | ✓ |
| All Playwright tests green | Require the full 230-test matrix to pass | |

**User's choice (auto):** No-increase from baseline (recommended default)
**Notes:** Phase 52 D-21 established the baseline as not-this-milestone's-problem. All-green would block release on pre-existing red. If Playwright can't run locally (browser binaries), defer the live run to CI; svelte-check + vitest stay blocking.

---

## Milestone archive timing (REL-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Phase completes docs+version+gate+STATE groundwork; operator runs /gsd:complete-milestone after | Archive is a separate top-level ship gesture | ✓ |
| Phase 54 executor invokes /gsd:complete-milestone | Run the archive inside the final executor task | |

**User's choice (auto):** Operator runs complete-milestone after verification (recommended default)
**Notes:** Matches how v1.13/v1.14/v1.15.1 archived. Don't shell out to complete-milestone from inside an executor.

---

## Documentation edits (DOC-01..06)

| Option | Description | Selected |
|--------|-------------|----------|
| Treat as locked pre-pinned edits, execute verbatim | Each DOC req names exact file/section/string | ✓ |
| Reinterpret/expand the doc changes | Editorial latitude | |

**User's choice (auto):** Locked, execute verbatim (recommended default)
**Notes:** .planning PERT refs stay (D-16/D-05); only the named DOC edits change. No blanket scrub.

---

## Version bump mechanics (REL-01, REL-02)

| Option | Description | Selected |
|--------|-------------|----------|
| package.json only; __APP_VERSION__ auto-propagates; REL-02 verify-only | Single source of truth via vite define | ✓ |
| Manual AboutSheet version edit too | Edit the displayed version string by hand | |

**User's choice (auto):** package.json only (recommended default)
**Notes:** vite.config.ts:11 defines __APP_VERSION__ from pkg.version; about-content.ts:13 consumes it. Regenerate pnpm-lock only if needed.

## Claude's Discretion

- Plan granularity (single plan vs DOC/REL split) and task ordering — planner decides.
- Exact wording of MILESTONES v1.17 "Key accomplishments" bullets — drafted from Phase 52/53 SUMMARYs.

## Deferred Ideas

- SMOKE-01..10 + REL-04 smoke-sign-off — v1.15.1 carry-forward, out of v1.17 scope; recorded in v1.17 MILESTONES deferred section (SMOKE-10 re-scope 6→5).
- 53-HUMAN-UAT.md SAFE-01 browser check — pairs with deferred smoke, not a release blocker.
- WR-01 favorites dedup — favorites-hardening backlog candidate.
