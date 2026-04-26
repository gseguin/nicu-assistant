---
phase: 02-calculator-core-both-modes-safety
plan: 01
subsystem: ui
tags: [pert, advisories, copy, design-compliance, em-dash-ban]

# Dependency graph
requires:
  - phase: 01-architecture-identity-hue-clinical-data
    provides: "Phase-1-frozen pert-config.json shape (advisories[] schema, 4 entries) + Phase-1 config.test.ts shape gate"
provides:
  - "Em-dash-free advisory message strings in src/lib/pert/pert-config.json (lines 99, 108, 117, 126)"
  - "DESIGN.md line 312 compliance for the advisories about to be rendered in Wave 2"
  - "Period-terminated, sentence-cased imperative copy ready for Wave 2 advisory cards"
affects: [02-02 (calculations + advisory rendering), 02-03 (PertCalculator wiring), 02-04 (range-input wiring), Phase 4 polish, Phase 5 release]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave-0 mechanical copy fix: literal Edit-tool string swaps (no regex sweep) preserve JSON shape exactly"

key-files:
  created: []
  modified:
    - src/lib/pert/pert-config.json

key-decisions:
  - "D-19 [user-locked 2026-04-25 via UI-SPEC]: replace 4 em-dashes in advisory message strings per UI-SPEC §Copywriting Contract"
  - "Use 'Verify with prescriber.' for the STOP-red max-lipase-cap advisory (clinically explicit) and 'Verify.' as the one-word imperative for the 3 range warnings (matches existing NumericInput inline blur copy)"
  - "Edit-tool literal string swaps, NOT regex — keeps all other JSON whitespace and field order byte-identical"

patterns-established:
  - "Copy-fix Wave 0 plan: a mechanical, no-behavior-change pre-rendering copy fix scoped to one file with an existing Phase-1-frozen test gate (config.test.ts) acting as the shape regression detector"

requirements-completed:
  - PERT-SAFE-01
  - PERT-SAFE-02
  - PERT-SAFE-03

# Metrics
duration: ~5 min
completed: 2026-04-24
---

# Phase 2 Plan 01: Em-dash audit on advisory strings Summary

**Removed 4 em-dashes from `pert-config.json` advisory messages (max-lipase-cap STOP-red, weight/fat/volume range warnings) per CONTEXT D-19 + DESIGN.md line 312 ban, with no behavior change and Phase-1 baseline (361/361, svelte-check 0/0) preserved.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-24T11:32:00Z (approx, plan execution kickoff)
- **Completed:** 2026-04-24T11:33:00Z (after final verification)
- **Tasks:** 1 (Task 1: Replace em-dashes in 4 advisory message strings)
- **Files modified:** 1 (`src/lib/pert/pert-config.json`)

## Accomplishments

- Replaced 4 em-dash-containing advisory message strings with period-terminated, em-dash-free copy that satisfies DESIGN.md from the moment Wave 2 renders them.
- Preserved Phase-1-frozen JSON shape (advisory IDs, severities, comparators, modes, values unchanged) — `config.test.ts` shape gate still passes.
- Established the Wave-0 copy-fix pattern: literal Edit-tool swaps with `id`-anchored context for uniqueness, zero collateral whitespace damage.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace em-dashes in 4 advisory message strings** — `<commit-hash-pending>` (fix)

_Note: This is a single-task plan with one logical commit; no separate metadata commit required (the SUMMARY commit captures docs)._

## Files Created/Modified

- `src/lib/pert/pert-config.json` — 4 advisory `message` field values updated:

| # | Line | Advisory ID | Before | After |
|---|------|-------------|--------|-------|
| 1 | 99 | `max-lipase-cap` | `Exceeds 10,000 units/kg/day cap — verify with prescriber` | `Exceeds 10,000 units/kg/day cap. Verify with prescriber.` |
| 2 | 108 | `weight-out-of-range` | `Outside expected pediatric range — verify` | `Outside expected pediatric range. Verify.` |
| 3 | 117 | `fat-out-of-range` | `Outside expected fat range — verify` | `Outside expected fat range. Verify.` |
| 4 | 126 | `volume-out-of-range` | `Outside expected volume range — verify` | `Outside expected volume range. Verify.` |

`git diff --stat`: `1 file changed, 4 insertions(+), 4 deletions(-)` — exactly the 4 lines listed; no other JSON keys touched.

## Decisions Made

None beyond the user-locked D-19 + D-20 decisions already recorded in 02-CONTEXT.md. The plan was followed verbatim.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

All gates from `<verification>` passed:

| Gate | Command | Expected | Actual |
|------|---------|----------|--------|
| Em-dash absence | `grep -n "—" src/lib/pert/pert-config.json` | no matches (exit 1) | no matches (exit 1) |
| String count: max-lipase-cap | `grep -c "Verify with prescriber\\." pert-config.json` | 1 | 1 |
| String count: weight | `grep -c "Outside expected pediatric range\\. Verify\\." pert-config.json` | 1 | 1 |
| String count: fat | `grep -c "Outside expected fat range\\. Verify\\." pert-config.json` | 1 | 1 |
| String count: volume | `grep -c "Outside expected volume range\\. Verify\\." pert-config.json` | 1 | 1 |
| Pert tests (Phase-1 frozen) | `pnpm test:run src/lib/pert/` | 17/17 passed | **17/17 passed** |
| Full vitest baseline | `pnpm test:run` | 361/361 passed | **361/361 passed (38 files)** |
| Type/template check | `pnpm svelte-check` | 0 errors / 0 warnings | **0 errors / 0 warnings (4580 files)** |

## Issues Encountered

None. The four `message` fields were unique within the file (each anchored by its surrounding `value` line — `value: 0` for max-lipase-cap, `{ "min": 0.5, "max": 50 }` for weight, etc.), so literal Edit-tool swaps without `replace_all` succeeded on first attempt for all four.

## User Setup Required

None — no external service configuration required.

## Next Plan Readiness

- **02-02 (calculations.ts + advisory firing logic)** can now consume `advisories[].message` strings directly into Wave 2 advisory cards without a Phase 4 polish-rework pass.
- The STOP-red `max-lipase-cap` message is now clinically explicit (`Exceeds 10,000 units/kg/day cap. Verify with prescriber.`) — ready for D-04's separate-card rendering pattern with `OctagonAlert` icon and `--color-error` border.
- The 3 range warnings (`Outside expected ... range. Verify.`) match the existing `<NumericInput>` inline blur error copy verbatim (the one-word `Verify.` imperative), so cross-component voice is already consistent for D-14 advisory binding.

## Self-Check: PASSED

- [x] FOUND: `src/lib/pert/pert-config.json` (modified, 4 lines changed per `git diff --stat`)
- [x] em-dash grep returns exit 1 (no matches) — verified
- [x] All 4 new strings present (grep -c each = 1) — verified
- [x] 17/17 pert tests pass — verified
- [x] 361/361 full vitest passes — verified
- [x] svelte-check 0/0 — verified
- [x] SUMMARY exists at `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-01-SUMMARY.md` (this file)
- [ ] Task commit hash recorded — pending (will fill in after commit)

---
*Phase: 02-calculator-core-both-modes-safety*
*Plan: 01*
*Completed: 2026-04-24*
