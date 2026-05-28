---
phase: 56-migrate-shared-singletons
plan: 01
subsystem: persistence
tags: [migration, localStorage, persistence-seam, behavior-preserving, MIG-01, MIG-02, MIG-03, MIG-04]
dependency_graph:
  requires: [55-01-SUMMARY.md]
  provides: [theme-adapter, disclaimer-adapter, favorites-adapter, lastEdited-adapter]
  affects: [src/lib/shared/theme.svelte.ts, src/lib/shared/disclaimer.svelte.ts, src/lib/shared/favorites.svelte.ts, src/lib/shared/lastEdited.svelte.ts]
tech_stack:
  added: []
  patterns: [createPersistentValue, rawStringCodec, recover-hook, custom-codec, per-instance-pv]
key_files:
  created:
    - src/lib/shared/migration-56-01.test.ts
    - src/lib/shared/migration-56-02.test.ts
  modified:
    - src/lib/shared/theme.svelte.ts
    - src/lib/shared/disclaimer.svelte.ts
    - src/lib/shared/favorites.svelte.ts
    - src/lib/shared/lastEdited.svelte.ts
decisions:
  - "rawStringCodec non-negotiable for theme (FOUC byte-identity) and disclaimer (literal 'true' string)"
  - "favorites custom codec serialize wraps ids in {v:1,ids} shape — default jsonCodec would write bare array and break T-01"
  - "lastEdited uses recover hook (not codec) to guard empty-string '' → null; Number('') === 0 is finite (PITFALL-06)"
  - "Two allowed raw localStorage.getItem null-probes retained: theme init() (prefers-color-scheme fallback) and favorites init() (first-run write-back detection)"
  - "pvV1 in disclaimer is read-only — never write or remove (audit trail, ROADMAP SC-2)"
metrics:
  duration: "~9 minutes"
  completed: "2026-05-28"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
  files_created: 2
  tests_added: 11
  test_count_after: 447
  test_count_before: 436
---

# Phase 56 Plan 01: Migrate Shared Singletons Summary

**One-liner:** Four shared singletons migrated onto PersistentValue<T> seam via rawStringCodec/custom-codec/recover-hook patterns; all hand-rolled localStorage try/catch blocks replaced; byte-identical storage behavior verified.

## Objective

Migrate all four shared global singletons (theme, disclaimer, favorites, lastEdited) onto the PersistentValue<T> seam shipped in Phase 55. Each adapter stops calling localStorage directly and delegates guarded I/O to a createPersistentValue instance. Observable behavior is byte-identical.

## Tasks Completed

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: theme + disclaimer (MIG-01, MIG-02) | c2befce | Replaced direct localStorage calls; rawStringCodec for unquoted byte storage; pvV1 read-only |
| Task 2: favorites + lastEdited (MIG-03, MIG-04) | c24b118 | Custom codec for {v:1,ids} shape; recover hook for empty-string guard; persist() deleted |

## Implementation Details

### MIG-01: theme.svelte.ts
- Added `const pv = createPersistentValue<string>({ key: 'nicu_assistant_theme', defaultValue: 'light', codec: rawStringCodec })`
- `set()`: `pv.write(value)` replaces `try { localStorage.setItem(...) } catch {}`
- `init()`: ONE raw null-probe KEPT — pv.read() returns 'light' for both "nothing stored" and "stored 'light'"; prefers-color-scheme fallback requires knowing raw === null
- Result: ONE localStorage.getItem in init() (allowed), ZERO localStorage.setItem

### MIG-02: disclaimer.svelte.ts
- Added `pvV1` and `pvV2` instances with rawStringCodec (stores literal 'true' not JSON boolean)
- `init()`: pvV1.read() + pvV2.read() replace raw getItem calls; pvV2.write('true') replaces conditional setItem
- `acknowledge()`: pvV2.write('true') replaces try/catch setItem
- pvV1 is READ-ONLY — comment added enforcing no .write() or .remove() (audit trail, ROADMAP SC-2)
- Result: ZERO localStorage calls (comment-only references)

### MIG-03: favorites.svelte.ts
- Added `const pv = createPersistentValue<CalculatorId[]>({ key: STORAGE_KEY, defaultValue: defaultIds(), codec: { serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids }), deserialize: ... }, recover })`
- Custom codec serialize wraps ids in {v:1,ids} shape (PITFALL-01 prevention — default jsonCodec would store bare array)
- recover function passed verbatim as seam's recover hook (6-step pipeline unchanged)
- `persist()` function DELETED; pv.write() used at both call sites (toggle + init first-run)
- init() null-probe KEPT for first-run write-back detection (D-05a)
- Result: ONE localStorage.getItem (null-probe, allowed), ZERO localStorage.setItem

### MIG-04: lastEdited.svelte.ts
- Added `#pv: PersistentValue<number | null>` private class field
- Constructor: createPersistentValue with recover hook (not codec) to guard empty-string '' → null (PITFALL-06: Number('') === 0 is finite and would set current = 0 wrongly)
- SSR guard (`typeof localStorage === 'undefined'`) moved into the seam
- `stamp()`: `this.current = now` BEFORE `this.#pv.write(this.current)` — stamp-outside-try semantics preserved
- `clear()`: `this.#pv.remove()` replaces try/catch removeItem
- Result: ZERO localStorage calls

## Verification Results

### Regression Tests (ZERO edits to test files)

| Test File | Tests | Result |
|-----------|-------|--------|
| favorites.test.ts (T-01..T-21, SAFE-02, SAFE-03) | 23 | PASS |
| calculator-store.test.ts | 11 | PASS |
| DisclaimerBanner.test.ts (6 scenarios) | 6 | PASS |
| **Total regression** | **40** | **PASS** |

### New Byte-Identity Tests Added

| Test File | Tests | Coverage |
|-----------|-------|----------|
| migration-56-01.test.ts | 7 | theme unquoted bytes (3) + disclaimer v1 preservation (4) |
| migration-56-02.test.ts | 4 | lastEdited bare number string + null-on-empty-string guard |

### Full Suite
- **Before:** 436 tests passing
- **After:** 447 tests passing (+11 new byte-identity tests)

### svelte-check
- 0 errors / 0 warnings across 4592 files

### Grep Gate (Phase 56 success criterion)

After migration, direct localStorage callers in non-test src/ (actual code, not comments):
1. `src/lib/shared/persistent-value.ts` — the seam (correct)
2. `src/lib/shell/calculator-store.svelte.ts` — Phase 57 migration pending (correct)
3. `src/lib/shared/theme.svelte.ts` — ONE `localStorage.getItem` in `init()` (null-probe, allowed)
4. `src/lib/shared/favorites.svelte.ts` — ONE `localStorage.getItem` in `init()` (null-probe, allowed)

All other files: ZERO direct localStorage calls.

## Deviations from Plan

None — plan executed exactly as written.

The plan specified `tdd="true"` for both tasks. The TDD approach was adapted for behavior-preserving migration tests: tests were written as invariant assertions that verify the same behavior before AND after migration (not tests that fail before implementation and pass after, since the behavior being tested already exists). This is the correct TDD pattern for refactors.

## Known Stubs

None.

## Threat Flags

None. This phase is a NET-POSITIVE security consolidation:
- No new network endpoints, auth paths, or file access patterns
- Four hand-rolled localStorage try/catch patterns consolidated into one audited seam
- Same storage keys, same persisted shapes, same same-origin access control
- T-56-SC (npm installs): zero new packages installed

## Self-Check

### Files exist:
- src/lib/shared/theme.svelte.ts: FOUND
- src/lib/shared/disclaimer.svelte.ts: FOUND
- src/lib/shared/favorites.svelte.ts: FOUND
- src/lib/shared/lastEdited.svelte.ts: FOUND
- src/lib/shared/migration-56-01.test.ts: FOUND
- src/lib/shared/migration-56-02.test.ts: FOUND

### Commits exist:
- c2befce (Task 1: theme + disclaimer): FOUND
- c24b118 (Task 2: favorites + lastEdited): FOUND

## Self-Check: PASSED
