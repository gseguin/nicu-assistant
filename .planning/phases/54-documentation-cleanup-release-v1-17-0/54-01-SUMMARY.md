---
phase: 54-documentation-cleanup-release-v1-17-0
plan: 01
subsystem: documentation
tags: [documentation, release, pert-removal, version-bump]
dependency_graph:
  requires: []
  provides: [PROJECT.md-5-calculator-truth, MILESTONES.md-v1.17-entry, package-version-1.17.0]
  affects: [.planning/PROJECT.md, .planning/MILESTONES.md, package.json]
tech_stack:
  added: []
  patterns: []
key_files:
  modified:
    - .planning/PROJECT.md
    - .planning/MILESTONES.md
    - package.json
decisions:
  - "D-04: Verbatim edits only — each DOC requirement executed exactly as specified in 54-RESEARCH.md"
  - "D-05: Historical PERT references in Current State (v1.15.1 shipped facts) left intact"
  - "D-06: Only package.json version field bumped; about-content.ts not edited (REL-02 is verify-only)"
  - "D-07: MILESTONES v1.17 entry follows v1.15.1 template shape exactly"
metrics:
  duration: "4m 1s"
  completed: "2026-05-24"
  tasks_completed: 4
  files_modified: 3
---

# Phase 54 Plan 01: Documentation Sync and Version Bump Summary

Six DOC edits applied to PROJECT.md and MILESTONES.md to align with 5-calculator reality; package.json bumped to 1.17.0.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | DOC-01: Move PERT Validated entry to Invalidated/Removed | fe1fb3a | .planning/PROJECT.md |
| 2 | DOC-02/03: Fix six-calculator references in Context and Architecture | c8ef6fd | .planning/PROJECT.md |
| 3 | DOC-04 verify absent + DOC-06 Key Decisions PERT outcome | 3b79995 | .planning/PROJECT.md |
| 4 | DOC-05 MILESTONES v1.17 entry + REL-01 package.json bump | 2033469 | .planning/MILESTONES.md, package.json |

## What Was Built

- **DOC-01**: Created new `### Invalidated / Removed` subsection in PROJECT.md after the last Validated entry. Moved PERT entry (✓ prefix) from `### Validated` to this new subsection (✗ prefix) with "— v1.17: out of clinical scope (pediatric, not neonatal)" annotation. Section order: `### Validated` → `### Invalidated / Removed` → `### Active`.

- **DOC-02/03**: Five edits to PROJECT.md `## Context` section: paragraph opener changed from "Six clinical calculators" to "Five clinical calculators"; bold heading updated; PERT calculator bullet removed from the list; route enumeration drops `/pert` (now lists 5); CalculatorStore singleton count updated from 6 to 5. Historical "all six calculators" reference in `## Current State` (v1.15.1 shipped fact) left untouched per D-05.

- **DOC-04**: Confirmed PROJECT.md has no `## Glossary` or `## Acronyms` section. Requirement satisfied vacuously — no edit required.

- **DOC-06**: Key Decisions table "Ship PERT" row Outcome cell updated from "⚠️ Revisit — v1.15 PERT later removed in v1.16 (out of clinical scope)" to "❌ Removed in v1.17 — out of clinical scope (pediatric, not neonatal)". Decision and Rationale columns unchanged; historical row preserved for traceability.

- **DOC-05**: Inserted v1.17 milestone entry at top of MILESTONES.md (above v1.15.1 entry). Entry includes: Phases completed (52, 53, 54 — 6 plans total), Known deferred items at close (11: SMOKE-01..10 + REL-04), Notes (v1.16 label skipped, PERT removal rationale), Key accomplishments (atomic PERT purge, test suite repair, favorites upgrade-safety regression).

- **REL-01**: Bumped `package.json` version field from `1.16.1` to `1.17.0`. `__APP_VERSION__` auto-propagates via `vite.config.ts:11` → `about-content.ts:13` — no manual AboutSheet edit needed (REL-02 is verify-only).

## Deviations from Plan

None — plan executed exactly as written. All DOC-01..06 and REL-01 edits applied verbatim per D-04.

## Verification Results

All six final verification checks pass:

1. `grep -c "### Invalidated / Removed" .planning/PROJECT.md` → 1
2. `grep -c "✓ Pediatric EPI PERT" .planning/PROJECT.md` → 0
3. `grep -c "Five clinical calculators" .planning/PROJECT.md` → 3 (2 in Context section + 1 pre-existing in Current Milestone)
4. `grep -c "PERT: Pediatric Enzyme" .planning/PROJECT.md` → 0
5. `grep -c "all 5 calculator route shells" .planning/PROJECT.md` → 1
6. `grep -c "Removed in v1.17.*out of clinical scope" .planning/PROJECT.md` → 1
7. MILESTONES.md v1.17 entry at line 3, v1.15.1 entry at line 21 (v1.17 is above v1.15.1)
8. `node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf-8')).version)"` → `1.17.0`

## Known Stubs

None.

## Threat Flags

None — all edits are to static planning/documentation files with no network surface, no secrets, no PII, no runtime code change.

## Self-Check: PASSED

Files exist:
- .planning/PROJECT.md — FOUND, contains "### Invalidated / Removed"
- .planning/MILESTONES.md — FOUND, contains "## v1.17 Remove PERT Calculator"
- package.json — FOUND, version field reads "1.17.0"

Commits exist:
- fe1fb3a — FOUND (DOC-01)
- c8ef6fd — FOUND (DOC-02/03)
- 3b79995 — FOUND (DOC-04 + DOC-06)
- 2033469 — FOUND (DOC-05 + REL-01)
