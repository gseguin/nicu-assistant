---
phase: 53-favorites-safety-net-verification
reviewed: 2026-05-23T17:40:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/lib/shared/favorites.test.ts
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
status: clean
---

# Phase 53: Code Review Report

**Reviewed:** 2026-05-23T17:40:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** clean

## Summary

Reviewed `src/lib/shared/favorites.test.ts` at standard depth, focused on the two
new regression blocks added in Phase 53: **SAFE-02** (pert upgrade path) and
**SAFE-03** (first-run defaults never contain pert). The change is test-only — no
production source was modified (confirmed via `git diff e13767d..HEAD`: +50 lines, 1 file).

Both new blocks are **correct, meaningful, and well-isolated**. Every adversarial
concern raised in the review brief was checked and verified — several empirically via
mutation testing rather than analysis alone:

1. **Assertions are correct against actual `recover()` behavior.** I read the production
   `favorites.svelte.ts` and `registry.ts`. Registry id order is
   `['feeds','formula','gir','morphine-wean','uac-uvc']`, so `defaultIds()` (first 4) =
   `['feeds','formula','gir','morphine-wean']`. `'pert'` is not in `CalculatorId` nor the
   registry (`grep` confirmed), so `recover()` step-4 `valid.has(id)` filter genuinely drops it.
   - SAFE-02: stored `['morphine-wean','formula','pert','gir']` → filter drops `pert`,
     order preserved verbatim (D-21, no re-sort) → `['morphine-wean','formula','gir']`. Matches assertion. ✓
   - SAFE-03: `localStorage.clear()` → `recover(null)` → `defaultIds()` =
     `['feeds','formula','gir','morphine-wean']`. Matches assertion. ✓

2. **SAFE-02 is non-tautological — it actually fails if the filter is removed.** Mutation test:
   I deleted `&& valid.has(id)` from `recover()`. SAFE-02 failed with exactly the
   predicted output (`'pert'` leaked into the received array). Source restored. This is
   genuine regression coverage, not a vacuous assertion.

3. **SAFE-03's `localStorage.clear()` is load-bearing and correct.** Mutation test: I removed
   the `localStorage.clear()` line from SAFE-03 and ran the full file in declaration order.
   SAFE-03 then failed — SAFE-02's seeded `{v:1, ids:[...'pert'...]}` bled through and
   `recover()` returned `['morphine-wean','formula','gir']` instead of the first-run defaults.
   Confirmed SAFE-02 runs immediately before SAFE-03 (verbose reporter), so the clear is
   genuinely required. Test file restored.

4. **No cross-block / module state leakage.** SAFE-02 and SAFE-03 are separate top-level
   `describe` blocks and do NOT inherit the `beforeEach(localStorage.clear + vi.resetModules)`
   from the first `describe('favorites store')` block. Each self-manages its preconditions:
   SAFE-02 calls `vi.resetModules()` + `setItem` (overwrites the key); SAFE-03 calls
   `localStorage.clear()` + `vi.resetModules()`. `src/test-setup.ts` has no global
   localStorage cleanup, so this explicit self-management is necessary and correct. Each
   block's `vi.resetModules()` + dynamic `import()` yields fresh module-scope `$state`
   (`_ids`/`_initialized`), preventing in-memory state bleed.

5. **No async/await mistakes.** Both new tests are `async` and correctly `await import(...)`
   before calling `favorites.init()`. No missing awaits, no floating promises.

6. **Expected orderings match documented behavior.** SAFE-02 asserts stored-order-preserved
   (`['morphine-wean','formula','gir']`, NOT alphabetical) — distinguishable from the
   alphabetical re-sort that `toggle()` would produce. SAFE-03 asserts alphabetical defaults.
   Both consistent with D-19/D-21.

Verification commands run: full file passes 23/23 tests; `tsc --noEmit` reports no type
errors in the test file. (ESLint has no v9 flat config in the repo — pre-existing repo
state, unrelated to this change.)

## Info

### IN-01: SAFE-03's `not.toContain('pert')` assertion is the weaker of its two guards

**File:** `src/lib/shared/favorites.test.ts:273`
**Issue:** SAFE-03 makes two assertions: `not.toContain('pert')` (line 273) and the full
`toEqual([...])` (line 274). During the isolation mutation test (removing the
`localStorage.clear()`), the leaked SAFE-02 data was `['morphine-wean','formula','gir']` —
which, because `recover()` had already filtered `pert`, still satisfied `not.toContain('pert')`.
Only the `toEqual` assertion caught the isolation regression. So `not.toContain('pert')`
provides no incremental safety against state bleed and is fully subsumed by the `toEqual`
on line 274 (which is exact). It does add documentary/intent value (mirrors the D-05 brief)
and is harmless, but it is not independently load-bearing.
**Fix:** No change required — keep both for documentary clarity. If trimming, the `toEqual`
on line 274 alone is sufficient coverage. This is an observation, not a defect.

---

_Reviewed: 2026-05-23T17:40:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
