---
phase: 52-code-purge-test-suite-repair
reviewed: 2026-05-23T17:05:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - e2e/desktop-full-nav.spec.ts
  - e2e/drawer-no-autofocus.spec.ts
  - src/app.css
  - src/lib/fortification/calculator.ts
  - src/lib/shared/about-content.ts
  - src/lib/shared/favorites.svelte.ts
  - src/lib/shared/favorites.test.ts
  - src/lib/shared/types.ts
  - src/lib/shell/CalculatorPage.test.ts
  - src/lib/shell/HamburgerMenu.test.ts
  - src/lib/shell/NavShell.test.ts
  - src/lib/shell/__tests__/registry.test.ts
  - src/lib/shell/calculator-module.ts
  - src/lib/shell/calculator-store.svelte.ts
  - src/lib/shell/calculator-store.test.ts
  - src/lib/shell/registry.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 52: Code Review Report

**Reviewed:** 2026-05-23T17:05:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 52 removed the PERT calculator: deleted `src/lib/pert/`, narrowed the
`CalculatorId` union from 6 to 5 members, dropped the `pert` `aboutContent`
entry, removed `.identity-pert` CSS blocks, and repaired the test suite (count
bumps 6→5, index renumbering, scaffold-value substitutions, new T-21 favorites
regression test).

**The PERT-removal surgery is correct and complete.** I verified the four
items the phase brief flagged as highest-risk and found no defects in any:

- **No lingering dead references.** A repo-wide grep for `pertModule`,
  `identity-pert`, `'pert'`, `/pert`, and `src/lib/pert` returns zero matches
  (excluding substring false positives like "property"/"viewport"). The
  `src/lib/pert/` directory is gone; `src/routes/` contains exactly the 5
  surviving calculator routes.
- **No off-by-one in renumbered indices.** In `registry.test.ts`, PERT was at
  index 4 and UAC/UVC at index 5; after removal UAC/UVC moved to index 4 and
  the "fifth entry" wording correctly matches the 0-based index 4. The same
  holds for `NavShell.test.ts` (tabs[5]→tabs[4]) and
  `desktop-full-nav.spec.ts` (nth(5)→nth(4), counts 6→5). Alphabetical order
  is preserved because `pert` sorted between `morphine-wean` and `uac-uvc`.
- **Type-union exhaustiveness holds.** `CalculatorId` now has 5 members and
  `aboutContent` is typed `Record<CalculatorId, AboutContent>` with exactly
  those 5 keys (no `pert`, none missing). `svelte-check` reports
  **0 errors / 0 warnings across 4588 files**, confirming the compiler accepts
  the exhaustive mapping.
- **T-21 regression test is correct.** It seeds a stored favorites list
  containing a generic `unknown-calculator-id`, calls `init()`, and asserts the
  unknown id is filtered while surviving ids keep their stored order
  (`['morphine-wean', 'formula', 'gir']`). This correctly exercises the
  `recover()` filter path and uses a feature-agnostic literal (not `pert`) so it
  survives future removals.

**Test evidence:** All reviewed unit/component suites pass — favorites (21),
registry (12), calculator-store (10), HamburgerMenu (14), NavShell (16),
CalculatorPage (8). Total 84 tests green; `svelte-check` clean.

The findings below are minor quality observations. Two of them (WR-01, IN-01)
are pre-existing behavior in files that happen to be in the review scope, not
defects introduced by Phase 52 — they are noted because the files were
reviewed, with their provenance called out so the fixer can scope correctly.

## Warnings

### WR-01: `recover()` does not de-duplicate favorite ids

**File:** `src/lib/shared/favorites.svelte.ts:52-58`
**Issue:** The recovery pipeline filters ids to registry-known strings and caps
at `FAVORITES_MAX`, but never removes duplicates. A localStorage payload such as
`{ v: 1, ids: ['morphine-wean', 'morphine-wean', 'gir'] }` survives recovery as
`['morphine-wean', 'morphine-wean', 'gir']`. Downstream that produces a
duplicate nav tab and inflates `count`/`isFull` (`_ids.length` counts the dup),
so `isFull` can report `true` with only 2 distinct calculators. `toggle()`'s
add path de-dups via `registryOrder.filter(...)`, but the remove path
(`_ids.filter((x) => x !== id)`) would strip *all* copies, and `recover()`
itself never cleans incoming data. This is **pre-existing** behavior, not
introduced by Phase 52, but it is directly relevant to the phase's theme:
the same forward-compatibility concern that motivated T-21 (a removed id in
stored favorites) also covers a *duplicated* id in stored favorites, and that
case is currently unguarded.

Note: the existing T-08 ("over-cap ids are truncated to MAX") seeds a duplicate
`morphine-wean` at index 4, but because it is the 5th element it is sliced off
by the cap — so the duplicate is never actually retained, and the test only
asserts `length <= MAX`. T-08 therefore does **not** exercise the dedup gap.

**Fix:** De-duplicate during recovery while preserving first-seen order, e.g.:
```ts
const valid = validIds();
const seen = new Set<string>();
const filtered = (parsed as StoredShape).ids
  .filter((id): id is string => typeof id === 'string' && valid.has(id))
  .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))
  .slice(0, FAVORITES_MAX);
```

## Info

### IN-01: e2e specs clear a disclaimer key that does not exist

**File:** `e2e/desktop-full-nav.spec.ts:12`
**Issue:** `beforeEach` runs
`localStorage.removeItem('nicu:disclaimer-accepted')`, but the disclaimer
singleton (`src/lib/shared/disclaimer.svelte.ts`) only reads/writes
`nicu_assistant_disclaimer_v1` and `nicu_assistant_disclaimer_v2`. The
`nicu:disclaimer-accepted` key is never used in source, so this `removeItem` is
a no-op. The tests still function because each one dismisses the disclaimer at
runtime via `.getByRole('button', { name: /understand/i }).click(...).catch(...)`.
This is a **pre-existing** pattern shared across several e2e specs
(`favorites-nav.spec.ts`, `uac-uvc.spec.ts`, `desktop-full-nav-a11y.spec.ts`,
`favorites-nav-a11y.spec.ts`) — not a Phase 52 regression. Note the sibling
file `drawer-no-autofocus.spec.ts:32` uses the *correct* key
(`nicu_assistant_disclaimer_v2`), so the inconsistency is visible within this
phase's reviewed set.
**Fix:** Replace the dead key with the real one (and pre-seed acceptance to
make the suite robust if the "understand" button copy ever changes):
```ts
localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
```

### IN-02: T-21 calls `vi.resetModules()` redundantly

**File:** `src/lib/shared/favorites.test.ts:221`
**Issue:** T-21 lives in its own top-level `describe` block that has no
`beforeEach`, so the inline `vi.resetModules()` is needed there — but it then
also relies on the `STORAGE_KEY` constant and a clean `localStorage`. Because
T-21 sits outside the main `describe('favorites store')` block, it does **not**
inherit that block's `beforeEach` (`localStorage.clear()` + `vi.resetModules()`).
The test works only because it seeds its own `localStorage` entry and resets
modules itself. This is correct but fragile: if a prior test leaves an unrelated
`localStorage` key set, T-21 is unaffected (it overwrites its own key), but the
asymmetry with T-20 (also outside the main block, but with no localStorage
seeding) makes the isolation contract easy to misread.
**Fix:** No behavior change required. Optionally add a one-line
`localStorage.clear()` before the `setItem` in T-21 to make its isolation
self-evident rather than implicit.

### IN-03: T-08 assertion is weaker than its name implies

**File:** `src/lib/shared/favorites.test.ts:76-87`
**Issue:** T-08 is titled "over-cap ids are truncated to MAX" but only asserts
`favorites.current.length <= FAVORITES_MAX`. It does not assert *which* ids
survive, so it would pass even if `recover()` truncated from the wrong end or
silently reordered. Given Phase 52's emphasis on stored-order preservation
(D-21) and forward compatibility, this test under-specifies the contract.
**Fix:** Tighten the assertion to pin the surviving ids and their order:
```ts
expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
```

---

_Reviewed: 2026-05-23T17:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
