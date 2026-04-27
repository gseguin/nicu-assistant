---
phase: 44-kendamil-formula-family
plan: 02
subsystem: fortification
tags:
  - tests
  - kendamil
  - data-shape-tests
  - manufacturer-grouping
requirements:
  - KEND-TEST-02
dependencies:
  requires:
    - kendamil-formula-entries
  provides:
    - kendamil-grouping-data-shape-tests
    - kendamil-count-assertion-bump
  affects: []
tech-stack:
  added: []
  patterns:
    - per-formula-required-keys-loop
    - manufacturer-localecompare-grouping-assertion
    - default-false-via-toBeUndefined-assertion
    - sibling-describe-block-append
key-files:
  created: []
  modified:
    - src/lib/fortification/fortification-config.test.ts
decisions:
  - Asserted `expect(f.packetsSupported).toBeUndefined()` rather than `.toBe(false)` so future contributors who add `packetsSupported: false` explicitly trip the test (T-44-04 pattern-divergence mitigation per D-12)
  - Asserted Abbott → Kendamil → Mead Johnson adjacency (idxKendamil === idxAbbott + 1, idxMeadJohnson === idxKendamil + 1) — verifiable shape of D-07 (`Kendamil` lands cleanly between `Abbott` and `Mead Johnson` under localeCompare with no intervening manufacturer in the existing 30 entries)
  - New describe block is a **sibling** of `describe('getFormulaById', ...)`, not nested — keeps the file's two-level-deep structure consistent
  - Title `'Kendamil grouping (KEND-04 / KEND-TEST-02)'` carries explicit requirement-ID traceability for verifier grep
metrics:
  duration: 7 minutes
  tasks-completed: 2
  files-modified: 1
  completed-date: 2026-04-25
commits:
  - 9ffb150: test(44-02) bump fortification count assertion 30 → 33 (Kendamil)
  - 53cbd06: test(44-02) add Kendamil grouping describe block (KEND-TEST-02)
---

# Phase 44 Plan 02: Kendamil Grouping Tests + Count-Assertion Bump Summary

Bumped the fortification-config formula-count assertion from 30 → 33 with an HCP-divergence rationale comment, and appended a 5-assertion `Kendamil grouping (KEND-04 / KEND-TEST-02)` describe block that pins the data shape the SelectPicker auto-grouping consumes.

## Outcome

- Line 16-21 of `src/lib/fortification/fortification-config.test.ts`: count assertion title and literal updated to 33, with the 3-line xlsx-rationale comment naming the Kendamil HCP-sourced divergence per D-11.
- Lines 86-128: new sibling `describe('Kendamil grouping (KEND-04 / KEND-TEST-02)', ...)` block with five `it(...)` assertions in the planned order:
  1. `exposes exactly 3 Kendamil entries` — count via `manufacturer === 'Kendamil'` filter
  2. `Kendamil entries appear in alphabetical order by name (Classic, Goat, Organic) after the picker sort` — `[Kendamil Classic, Kendamil Goat, Kendamil Organic]` after `localeCompare(name)`
  3. `each Kendamil variant resolvable by id (KEND-01/02/03)` — three `getFormulaById` lookups
  4. `no Kendamil variant supports packets — default-false via omitted field (KEND-05)` — uses `toBeUndefined()` (not `.toBe(false)`) to catch pattern divergence per T-44-04
  5. `Kendamil group sorts between Abbott and Mead Johnson (alphabetical localeCompare)` — asserts manufacturer-list adjacency `idxKendamil === idxAbbott + 1` and `idxMeadJohnson === idxKendamil + 1`
- File grew 80 → 128 lines; structure unchanged elsewhere (REQUIRED_KEYS loop, type assertions, inputs assertions, getFormulaById describe block all untouched).

## Per-Assertion Coverage Matrix

| Requirement | Assertion # | Mechanism |
|-------------|-------------|-----------|
| KEND-TEST-02 (3-entry Kendamil group exists) | 1 | `kendamils.toHaveLength(3)` |
| KEND-04 (alphabetical-by-name within group) | 2 | `localeCompare(name)` → `['Classic','Goat','Organic']` |
| KEND-01/02/03 (id resolution) | 3 | `getFormulaById('kendamil-organic'/'kendamil-classic'/'kendamil-goat')` |
| KEND-05 (packets default-false via omission, D-12) | 4 | `toBeUndefined()` for all three Kendamil entries |
| D-07 (Kendamil sorts between Abbott and Mead Johnson) | 5 | manufacturer-list adjacency under `localeCompare` |

## Verification Results

| Check | Outcome |
|-------|---------|
| `pnpm exec vitest run src/lib/fortification/fortification-config.test.ts -t "contains exactly 33 formulas"` | Pass (Task 1) |
| `pnpm exec vitest run src/lib/fortification/fortification-config.test.ts` | 14/14 pass (9 existing + 5 new) |
| `pnpm exec svelte-check --threshold error` | 0 errors, 0 warnings, 4571 files |
| Task 1 grep: `expect(formulas).toHaveLength(33)` | Matches 1 |
| Task 1 grep: `expect(formulas).toHaveLength(30)` | Matches 0 (old assertion gone) |
| Task 1 grep: `contains exactly 33 formulas (30 from xlsx Calculator A3:D35 + 3 Kendamil HCP)` | Matches 1 |
| Task 1 grep: `3 Kendamil entries (Organic, Classic, Goat) extend beyond xlsx` | Matches 1 |
| Task 1 grep: `sourced from hcp.kendamil.com per Phase 44 PLAN.md audit trail` | Matches 1 |
| Task 2 grep: `describe('Kendamil grouping (KEND-04 / KEND-TEST-02)'` | Matches 1 |
| Task 2 grep: each of the 5 it-titles | Each matches 1 |
| Task 2 grep: `expect(f.packetsSupported).toBeUndefined()` | Matches 1 |
| Task 2 grep: `expect(idxKendamil).toBe(idxAbbott + 1)` | Matches 1 |
| Task 2 grep: `expect(idxMeadJohnson).toBe(idxKendamil + 1)` | Matches 1 |

## Threat-Model Coverage Realized

- **T-44-04 (pattern divergence — future contributor adds `packetsSupported: false` explicitly)** — Mitigated by the `toBeUndefined()` assertion in Task 2 (the field is OMITTED by Plan 44-01; an explicit `false` would now fail the test loudly).
- **T-44-05 (transcription drift — accidental add/remove of formulas)** — Mitigated by the bumped 33-formula assertion in Task 1, with the rationale comment naming the xlsx 30 + Kendamil HCP 3 breakdown so a future reader understands why the literal isn't 30.

## Deviations from Plan

None for the test-file work itself — both tasks executed exactly as the plan's verbatim text specified.

**Worktree-bootstrap note (Rule 3, mechanical):** The agent's worktree was created from a base older than Wave 1 (HEAD `9a2b740` instead of `92f13fc`). Brought the worktree branch up to date with `git merge --ff-only 92f13fc` (fast-forward only — no merge commit, no conflict surface) before editing, then ran `pnpm install --frozen-lockfile` to populate `node_modules` so vitest could run. Both are environment-setup steps, not plan deviations — the resulting file edits and commits are exactly the two specified by 44-02-PLAN.md.

## Authentication Gates

None.

## Known Stubs

None. The new describe block is fully wired against the live `getFortificationFormulas()` and `getFormulaById()` exports; the assertions read real data from `fortification-config.json` (now 33 formulas including the 3 Kendamil entries Plan 44-01 added).

## Threat Flags

None. Test-file work — no new network endpoints, auth paths, file-access patterns, or schema changes at trust boundaries beyond what the threat model already captures.

## Self-Check: PASSED

- FOUND: src/lib/fortification/fortification-config.test.ts (128 lines, all 14 tests green)
- FOUND: 9ffb150 (test 44-02 bump count assertion)
- FOUND: 53cbd06 (test 44-02 add Kendamil grouping describe)

## Hand-Off Notes for Wave 2 Peers

Plans 44-03 (calculations parity tests) and 44-04 (Playwright axe sweep) run in parallel with this plan and touch different files (`calculations.test.ts` and `e2e/fortification-a11y.spec.ts` respectively) — no merge conflicts expected. The 33-formula data shape this plan now asserts is the same shape Plan 44-03 will exercise via `getFormulaById('kendamil-organic'|'kendamil-classic'|'kendamil-goat')` and Plan 44-04 will select via the SelectPicker.

## Next Plan

Plan 44-04 will be the natural next-up after Wave 2 merges — extends the existing fortification axe sweep with a Kendamil-Organic-selected variant in both light and dark themes (KEND-TEST-03). Plan 44-03 (parity tests) is also Wave 2 and merges alongside this plan.
