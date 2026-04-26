---
phase: 1
plan: 01
title: "Wave 0 — Architecture foundations: CalculatorId, alphabetized registry, favorites changes"
workstream: pert
wave: 0
requirements:
  - PERT-ARCH-01
  - PERT-ARCH-02
  - PERT-ARCH-05
  - PERT-ARCH-07
files_modified:
  - src/lib/shared/types.ts
  - src/lib/shell/registry.ts
  - src/lib/shell/__tests__/registry.test.ts
  - src/lib/shared/favorites.svelte.ts
  - src/lib/shared/favorites.test.ts
  - .planning/PROJECT.md
  - .planning/workstreams/pert/REQUIREMENTS.md
files_modified_deviations:
  - src/lib/shared/about-content.ts        # Rule 3 — TS Record-completeness placeholder; Plan 01-04 replaces with real content
  - src/lib/shell/NavShell.test.ts          # Rule 1 — fix downstream tests broken by registry alphabetization
  - src/lib/shell/HamburgerMenu.test.ts     # Rule 1 — fix downstream tests broken by registry alphabetization
verification:
  svelte-check: "0 errors / 0 warnings (4571 files)"
  vitest: "344 / 344 passed (36 test files)"
status: complete
---

# Phase 1 Plan 01-01: Wave-0 Architecture Foundations — Summary

## One-Liner

Extends `CalculatorId` with `'pert'`, alphabetizes `CALCULATOR_REGISTRY` (feeds, formula, gir, morphine-wean, pert, uac-uvc), drops the registry-order re-sort in `favorites.recover()` so stored user order is preserved verbatim (D-21), updates registry + favorites tests, and reflects the first-run favorites default change in PROJECT.md and the pert workstream's REQUIREMENTS.md.

## Objective Recap

Land the single Wave-0 architectural commit so downstream Phase 1 plans (identity hue, clinical config, route shell, AboutSheet) can compile against `CalculatorId = 'pert'` and `'identity-pert'` without modifying any existing calculator. This plan does NOT yet wire the `/pert` route, identity hue tokens, config, or AboutSheet — those land in plans 01-02 through 01-05.

## Tasks Executed

| Task | Title | Status |
|------|-------|--------|
| 01-01-01 | Extend CalculatorId union with 'pert' | Complete |
| 01-01-02 | Add 'identity-pert' to identityClass union and append pert registry entry, alphabetize | Complete |
| 01-01-03 | Update registry.test.ts for alphabetical order + add pert row coverage | Complete |
| 01-01-04 | Update favorites.svelte.ts: alphabetical defaults + drop registry-order re-sort in recover() | Complete |
| 01-01-05 | Update favorites tests: alphabetical first-run default + recover preserves stored order | Complete |
| 01-01-06 | Reflect alphabetical first-run default in PROJECT.md + REQUIREMENTS.md | Complete |

All per-task `<acceptance_criteria>` PASSED before moving to the next task.

## Files Created/Modified

### Plan-listed files (all in `files_modified`):

- `src/lib/shared/types.ts` — `CalculatorId` union extended with `'pert'`.
- `src/lib/shell/registry.ts` — `Pill` lucide icon imported; `identityClass` union extended with `'identity-pert'`; `CALCULATOR_REGISTRY` re-sorted alphabetically (`feeds, formula, gir, morphine-wean, pert, uac-uvc`); `pert` entry appended (label "PERT", icon `Pill`, href `/pert`, description "Pediatric EPI PERT calculator").
- `src/lib/shell/__tests__/registry.test.ts` — Position-locked assertions rewritten to alphabetical order; per-position assertion added for the new `pert` row at index 4 (id, label, href, description, identityClass); new alphabetical-invariant test (`expect(ids).toEqual([...ids].slice().sort())`) guards against future non-alphabetical inserts; expected-set assertion updated to include `'pert'`. 12 tests, all passing.
- `src/lib/shared/favorites.svelte.ts` — `recover()` step 6 no longer re-sorts by registry order; the `registryOrder` const inside `recover()` was removed; the docstring step (6) updated to `"empty filtered → defaults; otherwise return filtered (preserving user's order — D-21)"`. The `defaultIds()` body is unchanged (per D-20, naturally returns `['feeds', 'formula', 'gir', 'morphine-wean']` once the registry is alphabetized — no hardcoded `FIRST_RUN_DEFAULTS` constant per plan instruction). The toggle()'s registry-order sort on add was intentionally left in place (separate concern from D-21 — toggle insertion is FAV-06 / D-07 territory).
- `src/lib/shared/favorites.test.ts` — All 8 tests asserting first-run defaults (T-01, T-03, T-04, T-05, T-06, T-09, T-18, T-20) updated from `['morphine-wean','formula','gir','feeds']` to `['feeds','formula','gir','morphine-wean']`. T-07 docstring clarified to note stored-order preservation. T-10 inverted from "re-sorts to registry order" to "preserves stored order verbatim (D-21 regression guard)" with the exact stored array `['morphine-wean', 'gir', 'feeds', 'formula']` round-tripping identically. T-11, T-12, T-14 expected-value updates because `toggle()` still re-sorts in registry order on add and registry order is now alphabetical. T-08, T-13, T-15..T-19 unchanged (testing logic that was unaffected). 20 tests, all passing.
- `.planning/PROJECT.md` — New "In Flight: v1.15 Pediatric EPI PERT Calculator (workstream `pert`)" section added after the v1.14 Active block, recording the first-run favorites default reorder as a side-effect of `CALCULATOR_REGISTRY` alphabetization. v1.13 historical record (`['morphine-wean', 'formula', 'gir', 'feeds']`) preserved verbatim.
- `.planning/workstreams/pert/REQUIREMENTS.md` — `PERT-ARCH-07` rewritten from "First-run favorites defaults unchanged (`['morphine-wean', 'formula', 'gir', 'feeds']`)" to "First-run favorites defaults are the first 4 alphabetical registry entries (`['feeds', 'formula', 'gir', 'morphine-wean']`) — change from v1.13/v1.14 historical order, accepted in Phase 1 D-20 as a side-effect of alphabetizing `CALCULATOR_REGISTRY`. User can favorite `pert` via hamburger to bring it into the bottom-nav 4-cap."

### Files modified outside the plan's `files_modified` list (deviations — see below):

- `src/lib/shared/about-content.ts` — Placeholder `pert` AboutContent entry added.
- `src/lib/shell/NavShell.test.ts` — Default-favorites order assertions updated; T-06 inverted to assert stored-order preservation.
- `src/lib/shell/HamburgerMenu.test.ts` — T-02 link count updated from 5 to 6 with a `/PERT/i` link assertion added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] AboutContent Record-completeness**

- **Found during:** Task 01-01-01 acceptance verification (`pnpm check`).
- **Issue:** Extending `CalculatorId` to include `'pert'` triggered a TS error in `src/lib/shared/about-content.ts:19`:
  > Property 'pert' is missing in type '...' but required in type 'Record<CalculatorId, AboutContent>'.
- **Why this is a blocking issue:** The plan's `<must_haves>` and `<verification>` blocks both require `pnpm svelte-check` to report 0 errors / 0 warnings. The plan's `files_modified` list does not include `about-content.ts`, but the plan author appears to have overlooked that the `Record<CalculatorId, AboutContent>` constraint forces the `pert` key to exist as soon as `CalculatorId` is widened. Without a `pert` entry, the verification gate cannot pass.
- **Fix:** Added a minimal placeholder `pert` AboutContent entry referencing `DISCLAIMER` and explicitly noting in a code comment that Plan 01-04 (D-24) will replace it with full content. The placeholder copy ("Placeholder — full content lands in Phase 1 plan 01-04 (D-24).") is intentionally non-clinical so it cannot be mistaken for shipped content if the UI happened to render it.
- **Files modified:** `src/lib/shared/about-content.ts`.
- **Stub status:** Tracked under "Known Stubs" below — Plan 01-04 will replace.

**2. [Rule 1 — Bug] Downstream NavShell + HamburgerMenu tests broke on alphabetization**

- **Found during:** Plan-level `pnpm test` verification (after task 01-01-06).
- **Issue:** Three tests in `src/lib/shell/NavShell.test.ts` (T-01 default favorites, T-06 stored-order test) and one in `src/lib/shell/HamburgerMenu.test.ts` (T-02 list every registered calculator) were position-locked to the v1.13 registry order. Task 01-01-02 alphabetizing `CALCULATOR_REGISTRY` and task 01-01-04 changing first-run defaults caused them to fail.
- **Why this counts as a bug fix not new-scope work:** The plan's `<verification>` block requires `pnpm test MUST pass overall (no regressions in other suites)`. The tests are the most direct downstream consumer of the registry-order invariant — equivalent in spirit to the `registry.test.ts` updates the plan explicitly schedules. Plan 01-01 is the architectural Wave-0 plan; pinning these tests to the new alphabetical order is the natural completion of that wave.
- **Fix:**
  - `NavShell.test.ts` `beforeEach` comment updated; T-01 expected order changed to feeds/formula/gir/morphine-wean; T-06 inverted from "registry order preserved" to "stored order preserved verbatim (D-21)" with stored input `['feeds', 'gir', 'formula', 'morphine-wean']` and matching expected order — this also serves as a downstream regression guard for D-21.
  - `HamburgerMenu.test.ts` T-02 expected link count raised from 5 to 6 and a `/PERT/i` link assertion added; the docstring updated to reference D-19/D-20 alphabetization. UAC/UVC cap-disabled assertion (T-09) was already correct (PERT and UAC/UVC are both non-favorited at first run; cap=4 still holds).
- **Hard constraint check:** The workstream-specific constraint forbids touching `src/lib/fortification/` and the desktop branch of `src/lib/shell/NavShell.svelte`. These are test files (`.test.ts`), not the `NavShell.svelte` component itself; the change is correctness-only and applies equally to mobile and desktop renders.
- **Files modified:** `src/lib/shell/NavShell.test.ts`, `src/lib/shell/HamburgerMenu.test.ts`.

### Architectural Decisions Surfaced

None — no Rule 4 stops were triggered. All deviations were within Rules 1–3 and resolved automatically.

### Authentication Gates

None.

## Verification Results

| Gate | Result |
|------|--------|
| `pnpm check` (svelte-check + svelte-kit sync) | 0 errors / 0 warnings across 4571 files |
| `pnpm test src/lib/shell/__tests__/registry.test.ts` | 12 / 12 passed |
| `pnpm test favorites` | 20 / 20 passed |
| `pnpm test` (full suite) | 344 / 344 passed (36 test files) |
| `grep -F "| 'pert'" src/lib/shared/types.ts` | match found |
| `grep -F "icon: Pill" src/lib/shell/registry.ts` | match found |
| `grep -F "'identity-pert'" src/lib/shell/registry.ts` | 2 matches (union + entry) |
| `grep -F "preserving user's order" src/lib/shared/favorites.svelte.ts` | match found |
| `grep -F "alphabetical" .planning/workstreams/pert/REQUIREMENTS.md` | match found |

All five plan-level manual greps return at least one match.

## Key Decisions Made (Plan-Level)

These are not new decisions — all are pre-decided in `01-CONTEXT.md` D-14..D-22 and codified by this plan's execution:

| Decision | Source | Codified by |
|----------|--------|-------------|
| Lucide `Pill` icon for PERT | D-14 | `registry.ts` import + entry |
| Label "PERT" | D-15 | `registry.ts` entry |
| Description "Pediatric EPI PERT calculator" | D-16 | `registry.ts` entry |
| `identityClass = 'identity-pert'` | D-17 | `registry.ts` union + entry |
| `href = '/pert'` | D-18 | `registry.ts` entry |
| Alphabetical `CALCULATOR_REGISTRY` (feeds, formula, gir, morphine-wean, pert, uac-uvc) | D-19 | `registry.ts` array re-order |
| First-run favorites default = first 4 alphabetical registry entries | D-20 | `defaultIds()` unchanged but registry-driven; no hardcoded `FIRST_RUN_DEFAULTS` |
| `recover()` drops registry-order re-sort; stored order preserved verbatim | D-21 | `favorites.svelte.ts:recover()` |
| `registry.test.ts` rewritten to alphabetical position-locked assertions + alphabetical invariant | D-22 | `__tests__/registry.test.ts` |

## Known Stubs

- **`src/lib/shared/about-content.ts:pert`** — Minimal placeholder Record entry. Title = "Pediatric EPI PERT Calculator", description = "Placeholder — full content lands in Phase 1 plan 01-04 (D-24).", notes = `["Placeholder entry. See plan 01-04 for the final copy."]`, disclaimer = `DISCLAIMER`. Plan 01-04 task 01-04-05 explicitly owns replacing this with the real D-24 content (citing `epi-pert-calculator.xlsx`, DailyMed, the 10,000 units/kg/day cap). The placeholder is hidden from the UI surface in Phase 1 because the `/pert` route does not yet exist (Plan 01-04 lands the route shell + AboutSheet entry together).

## Threat Flags

None — Wave-0 architecture only modifies type unions, a registry array, a favorites recovery pipeline, and tests. No new network endpoints, auth paths, file I/O, or trust-boundary surface introduced.

## Next-Phase Readiness

Phase 1 plans 02–04 are now unblocked and can run in parallel against this baseline:

- **01-02 (Identity hue)** — `.identity-pert` token pair in `app.css`. Compiles against `'identity-pert'` already in the union.
- **01-03 (Clinical data)** — `pert-config.json` + `config.ts` wrapper in `src/lib/pert/`. Independent of registry.
- **01-04 (Route shell + AboutSheet)** — `src/routes/pert/+page.svelte` + `src/lib/pert/PertCalculator.svelte` placeholder + AboutSheet `pert` entry replacing the placeholder. The route href `/pert` is already advertised by the registry; activeCalculatorId NavShell ternary extension is part of this plan.

Plan 01-05 (clinical-gate) closes the phase.

## Self-Check: PASSED

- `src/lib/shared/types.ts` — FOUND
- `src/lib/shell/registry.ts` — FOUND with `id: 'pert'` entry
- `src/lib/shell/__tests__/registry.test.ts` — FOUND with PERT row coverage + alphabetical invariant
- `src/lib/shared/favorites.svelte.ts` — FOUND with `D-21` comment + no `registryOrder.filter` in `recover()`
- `src/lib/shared/favorites.test.ts` — FOUND with alphabetical defaults + D-21 regression guard
- `src/lib/shared/about-content.ts` — FOUND with `pert` placeholder entry (deviation)
- `src/lib/shell/NavShell.test.ts` — FOUND with alphabetical-order assertions + D-21 stored-order guard (deviation)
- `src/lib/shell/HamburgerMenu.test.ts` — FOUND with PERT link assertion + 6-entry count (deviation)
- `.planning/PROJECT.md` — FOUND with v1.15 in-flight section + alphabetical default note
- `.planning/workstreams/pert/REQUIREMENTS.md` — FOUND with PERT-ARCH-07 alphabetical rewrite

All claims verified. Self-check passed.
