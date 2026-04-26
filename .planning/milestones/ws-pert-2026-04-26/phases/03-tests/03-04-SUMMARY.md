# Plan 03-04 — Playwright E2E for /pert (PARTIAL closure)

**Status:** PARTIAL — ships 8 of 12 originally planned tests. The 2 picker-driven happy-path tests (Oral mode + Tube-Feed mode, each × 2 viewports = 4 tests) are deferred to a follow-up phase due to a SelectPicker click-revert bug discovered during execution.

## Outcome

| Gate | Result |
|------|--------|
| `pnpm check` (svelte-check) | 0 errors / 0 warnings (4586 files) |
| `pnpm test:run` (vitest) | 423/423 (Phase 2 baseline 361 + Phase 3 Wave 1+2 = 62 new; same as 03-02 SUMMARY) |
| `CI=1 pnpm exec playwright test pert.spec --reporter=line` | **8/8 passed (35.5s)** |
| `CI=1 pnpm exec playwright test pert-a11y --reporter=line` | 4/4 passed (Phase 1 axe sweeps stay green) |
| `CI=1 pnpm exec playwright test --reporter=line` (full regression) | 113/114 — 1 baseline flake on `disclaimer-banner.spec.ts:28` (same as Phase 1 + Phase 2 baseline). 8 NEW tests (105 → 113) with zero new failures. |

## Locked Playwright count for plan 03-05

Plan 03-04 ships **8 new e2e tests** in `e2e/pert.spec.ts` (4 unique tests × 2 viewports = mobile 375 + desktop 1280). Plan 03-05's verification gate asserts the full-suite total of `113 passed + 1 baseline-flake = 114 total` (was 105+1=106 at Phase 2 baseline; +8 new = 113+1).

## Tests shipped (8 total, 4 unique × 2 viewports)

1. `mode-switch state preservation` — fills oral inputs (weight/fat/lipasePerG via direct text input), switches to Tube-Feed, asserts weight preserved AND fat input gone, switches back, asserts fat + lipasePerG restored. Exercises PERT-MODE-03 + CONTEXT D-07 mode-switch contract.
2. `every numeric input has inputmode="decimal"` — PERT-TEST-05 + D-14 regression guard. Asserts `inputmode="decimal"` on all numeric inputs (Weight + Fat per meal + Lipase per gram of fat).
3. `reload restores form values from nicu_pert_state` (in separate `test.describe` block per Q2) — fills oral inputs, asserts `localStorage.getItem('nicu_pert_state')` is non-empty + JSON contains entered values, reloads, asserts form re-renders with same values. Exercises PERT-MODE-02 D-09 reinterpretation (localStorage NOT sessionStorage).
4. `favorite PERT -> nav shows PERT tab + 4 tabs total` (in separate `test.describe` block) — opens hamburger, clicks "Add PERT to favorites", asserts pert tab present in mobile bottom-nav OR desktop top-nav. Mirrors `e2e/favorites-nav.spec.ts:69` FAV-TEST-03-2 pattern. Uses `nicu:favorites` localStorage key (D-13 colon, NOT underscore).

## Tests deferred (4 total, 2 unique × 2 viewports)

The Oral mode + Tube-Feed mode picker-driven happy-path tests are commented in-file at line ~56 of `e2e/pert.spec.ts` with a `DEFERRED` block citing the known-issue note. They cannot pass against the current PertInputs implementation because of an architectural collision in the SelectPicker bridge (clicks revert silently). Two hotfix attempts during this plan's execution (mechanical effect-order swap; folding D-11 into the strength write-effect) each broke the D-11 strength-reset unit test or external-write propagation.

Full reproduction + root cause + 3 candidate resolution paths are documented at:
`.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/known-issues.md` (KI-1)

## PERT-TEST-05 disposition

PERT-TEST-05 closes PARTIALLY:
- ✅ Playwright E2E happy-path passes at mobile 375 + desktop 1280 — for the **input-typing path** (mode-switch + inputmode regression guard + localStorage round-trip).
- ❌ The **picker-click happy paths** (fixture row 0 → expected hero capsules count) are deferred per KI-1.
- ✅ `inputmode="decimal"` regression guard ships (D-14).
- ✅ Favorites round-trip ships (D-13 — nicu:favorites colon key).
- ✅ localStorage round-trip ships (D-11 — nicu_pert_state, NOT sessionStorage).

The picker-driven coverage gap will be closed by the follow-up phase that resolves KI-1.

## Hotfix attempts during this plan (both reverted; documented in KI-1)

1. **Mechanical effect-order swap (all three SelectPicker bridges).** Click-revert resolved for medication + formula. Strength click-revert resolved. Broke D-11 — `PertInputs.test.ts:75-86` D-11 test failed (strengthValue=12000 expected null).
2. **Fold D-11 into the strength write-effect.** Same D-11 failure; the medication write-effect (now first-registered) races against external mutations to `pertState.current.medicationId` and silently reverts them.

Both attempts STOPPED at the first failing test per the executor's hard constraint (do not layer fixes). Working tree was reset to `ad3bf36` between attempts.

## Files

- `e2e/pert.spec.ts` (NEW, 197 lines, 8 tests — was 255 lines / 12 tests pre-trim).
- `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/known-issues.md` (NEW, KI-1).
- `.planning/workstreams/pert/phases/03-tests/03-04-SUMMARY.md` (this file).

## Hard-constraint compliance

- No production code modified (PertInputs.svelte, PertCalculator.svelte, calculations.ts, etc. unchanged).
- No Phase-1-frozen tests modified (config.test.ts, state.test.ts, pert-a11y.spec.ts unchanged).
- No Phase-3 prior-wave tests modified (03-01 fixtures, 03-02 calc tests, 03-03 component tests unchanged).
- STATE.md not updated (the Phase 3 verifier owns that).
- vite.config.ts not modified.
- ROADMAP.md not modified.
- No worktree isolation used.
- Em-dash + en-dash count in `e2e/pert.spec.ts`: 0.
