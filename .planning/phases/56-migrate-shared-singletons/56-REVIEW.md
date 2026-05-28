---
phase: 56-migrate-shared-singletons
reviewed: 2026-05-28T18:47:04Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/shared/theme.svelte.ts
  - src/lib/shared/disclaimer.svelte.ts
  - src/lib/shared/favorites.svelte.ts
  - src/lib/shared/lastEdited.svelte.ts
  - src/lib/shared/migration-56-01.test.ts
  - src/lib/shared/migration-56-02.test.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 56: Code Review Report

**Reviewed:** 2026-05-28T18:47:04Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

This is a focused, behavior-preserving migration of four shared `.svelte.ts`
adapters (theme, disclaimer, favorites, lastEdited) onto the
`PersistentValue<T>` seam, plus two new byte-identity test files. I compared
each adapter against its exact pre-migration source at commit `6e6e6fb` (the
last commit before this phase's two commits `c2befce` and `c24b118`).

**Overall the migration is sound and the runtime behavior is preserved.** I
traced every prior code path:
- `theme.set`/`init`/`toggle` + DOM sync — preserved (FOUC `rawStringCodec`
  contract honored; verified against `src/app.html` inline script which reads
  the key as a raw string).
- `disclaimer` v1→v2 OR logic, v1-not-deleted, read-only v1 instance — preserved.
- `favorites` 6-step `recover`, first-run write-back, registry-ordered toggle,
  module-scope `$state` seed — preserved; custom codec `serialize` reproduces
  the old `persist()` `{v:1,ids}` shape exactly.
- `lastEdited` 60s debounce, stamp-before-write ordering, `clear()`, and the
  `Number('') === 0` guard via the `recover` hook — preserved.

The 11 new tests pass (`npx vitest run` confirmed). No correctness regression,
no security issue, and no data-loss risk was found. All findings are WARNING or
INFO — they concern test-isolation fragility, latent type-safety holes in the
seam wiring, and coverage gaps in the new byte-identity tests. None block ship,
but several should be fixed because they are exactly the kind of holes a
*future* edit to these adapters could fall through undetected, which matters for
a clinical tool where the test suite is the regression gate.

## Warnings

### WR-01: MIG-01 theme tests reuse cached module `$state` across cases (no `vi.resetModules()`)

**File:** `src/lib/shared/migration-56-01.test.ts:14-45`
**Issue:** The `MIG-01: theme` describe block's `beforeEach` calls
`localStorage.clear()` and `vi.restoreAllMocks()` but — unlike the `MIG-02`
disclaimer block (line 52) and the existing `favorites.test.ts` (line 14) —
does **not** call `vi.resetModules()`. `theme.svelte.ts` holds module-scope
`let _theme = $state(...)`. All three theme tests therefore share one module
instance and one accumulated `_theme` value. The tests pass today only because
each test calls `theme.set(...)` explicitly before asserting, so the carried-
over `_theme` happens to be overwritten. This is fragile: a future test that
asserts `theme.current` *without* first calling `set()` (e.g. a first-run
`init()` test) would silently read leaked state from a prior test and could
pass for the wrong reason. The established project convention (documented in
`favorites.test.ts:5-7`) is explicitly to reset modules between tests for any
module with top-level `$state`. This block diverges from that convention.
**Fix:** Add module reset to the theme block's `beforeEach` and use dynamic
import (the file already imports `theme` dynamically inside each test, so only
the reset call is missing):
```ts
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules(); // fresh module-scope _theme per test (matches favorites.test.ts convention)
  vi.stubGlobal('document', { /* ...unchanged... */ });
});
```

### WR-02: favorites custom codec `deserialize` is an unguarded `as` cast that lies about its type

**File:** `src/lib/shared/favorites.svelte.ts:72`
**Issue:** The codec declares
`deserialize: (raw) => JSON.parse(raw) as CalculatorId[]`. This is a double
unsoundness: (1) `JSON.parse(raw)` returns `any`/`unknown` and the stored shape
is actually `{v:1,ids:[...]}` — an **object**, not an array — so the runtime
value of `JSON.parse(raw)` is never a `CalculatorId[]`; the `as CalculatorId[]`
assertion is factually false. (2) It performs zero validation. The comment
correctly states "never called — recover owns read," and that is true *for this
adapter today* because `recover` is always passed, so `read()` in the seam
(`persistent-value.ts:93-98`) takes the `recover` branch and never reaches
`codec.deserialize`. But the placeholder is a live landmine: if a future edit
ever removes or conditionally drops the `recover` hook, the seam falls through
to `codec.deserialize`, which would return the raw `{v:1,ids}` object cast as an
array, and downstream code (`_ids.includes`, `.filter`, `.slice`) would behave
incorrectly with no type error and no recovery — defeating the entire 6-step
safety pipeline that protects against corrupt favorites. For a clinical nav
feature this is a real robustness gap masked by a green test suite.
**Fix:** Make the placeholder fail loudly (or delegate to `recover`) so the
invariant "recover owns read" is enforced rather than assumed:
```ts
codec: {
  serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids }),
  // recover owns the read path; this must never run. Fail loudly if it does
  // so a future regression that drops the recover hook is caught immediately.
  deserialize: (): CalculatorId[] => {
    throw new Error('favorites: deserialize must not run — recover owns the read path');
  }
},
```

### WR-03: MIG-02 disclaimer tests omit `vi.restoreAllMocks()` and one test depends on cross-test stub leakage assumptions

**File:** `src/lib/shared/migration-56-01.test.ts:49-84`
**Issue:** The `MIG-02` block's `beforeEach` calls `vi.resetModules()` and
`localStorage.clear()` but does not call `vi.restoreAllMocks()`. The preceding
`MIG-01` block (same file) installs a `vi.stubGlobal('document', ...)`. Because
`MIG-01`'s `beforeEach` runs `vi.restoreAllMocks()` (which does not undo
`stubGlobal`) and `MIG-02` never calls `vi.unstubAllGlobals()`, the stubbed
`document` global leaks into the `MIG-02` block. It is harmless today only
because `disclaimer.*` never touches `document`. This is order-dependent test
hygiene: the suite is one refactor away (e.g. disclaimer gaining a DOM side
effect, or block reordering) from confusing failures. Compare the disciplined
teardown in `calculator-store.test.ts:19-25` which explicitly unstubs globals
before clearing storage.
**Fix:** Add symmetric teardown so global stubs do not bleed between describe
blocks:
```ts
import { afterEach } from 'vitest';
// ...
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
```

### WR-04: MIG-04 stamp byte-shape tests never assert the *value* round-trips — a `String`-vs-`JSON.stringify` regression in the seam would pass

**File:** `src/lib/shared/migration-56-02.test.ts:26-42`
**Issue:** The two "bare number string" tests assert only that the stored raw is
(a) a string, (b) `Number.isFinite(Number(raw))`, and (c) does not start with a
`"`. `lastEdited` uses the **default `jsonCodec`** (no `codec` option is passed
in `lastEdited.svelte.ts:36-44`), so `write(this.current)` serializes via
`JSON.stringify(number)`, which yields a bare number string like
`"1748443200000"` — correct. But the assertions are too weak to detect the
exact regression class this test is meant to guard. `JSON.stringify(1748443200000)`
and `String(1748443200000)` produce *identical* bytes, so the test cannot
distinguish the migrated `jsonCodec` path from the old `String(...)` path — it
only proves "not JSON-quoted," not "byte-identical to the pre-migration
`String(this.current)` output." More importantly, none of the three stamp tests
assert that the stored value equals `String(le.current)` (the actual stamped
number). A future seam change that, say, wrote `JSON.stringify({ts: n})` and
still produced a finite-parseable leading-non-quote string could slip through.
The phase's stated goal is *byte-identity*; the assertion should be byte-exact.
**Fix:** Assert the exact byte string against the in-memory value:
```ts
it('after stamp(), stored raw === String(le.current) (byte-identical to pre-migration)', () => {
  const le = new LastEdited(TEST_TS_KEY);
  le.stamp();
  expect(localStorage.getItem(TEST_TS_KEY)).toBe(String(le.current));
});
```

## Info

### IN-01: Favorites `{v:1,ids}` byte-shape has no test in the phase's own migration file — it is delegated to a deferred assertion

**File:** `src/lib/shared/migration-56-02.test.ts:12-16`
**Issue:** MIG-03 (favorites stored shape) contributes **zero** executable
assertions to this phase's test files; it is a comment that points at
`favorites.test.ts` T-01 (`favorites.test.ts:25`,
`expect(stored).toEqual({ v: 1, ids: [...] })`). That deferral is defensible —
T-01 is a genuine `toEqual` on the parsed shape and does exercise the new custom
`serialize`. However, it means the "byte-identity test file" for Task 2 has no
direct guard that the custom codec wrapper (`favorites.svelte.ts:71`) keeps
producing `{v:1,...}` rather than, e.g., a bare array. If T-01's intent ever
drifts, MIG-03 has no independent backstop. Given how cheap it is, a one-line
direct assertion in this file would close the gap and make the phase's coverage
self-contained.
**Fix:** Add a direct byte-shape assertion (uses `vi.resetModules()` +
dynamic import like the favorites suite):
```ts
it('MIG-03: favorites write stores {v:1,ids} wrapper, not a bare array', async () => {
  vi.resetModules();
  const { favorites } = await import('./favorites.svelte.js');
  favorites.init(); // first-run write-back persists defaults
  expect(localStorage.getItem('nicu:favorites')).toBe(
    JSON.stringify({ v: 1, ids: ['feeds', 'formula', 'gir', 'morphine-wean'] })
  );
});
```

### IN-02: `disclaimer.init` read-order swap (v2-then-v1 → v1-then-v2) is benign but undocumented

**File:** `src/lib/shared/disclaimer.svelte.ts:34-36`
**Issue:** Pre-migration (`6e6e6fb`) read `v2` first then `v1`; the migrated
code reads `v1` first then `v2`. The OR result `_acknowledged = v2 === 'true' ||
v1 === 'true'` is order-independent, and the seam reads have no observable
side effects, so this is genuinely behavior-equivalent — not a bug. Flagging it
only as an INFO because an order swap in a migration commit billed as
"byte-identical" can read as an accidental change during future archaeology.
**Fix:** No code change required. Optionally add a one-line comment noting the
read order is intentional and immaterial, or restore the original order to keep
the diff minimal and the "behavior-preserving" claim maximally literal.

### IN-03: lastEdited `recover` hook duplicates seam logic that the default JSON path would also handle — minor over-specification

**File:** `src/lib/shared/lastEdited.svelte.ts:39-43`
**Issue:** The `recover` hook is correctly required for the `Number('') === 0`
edge case (confirmed: `jsonCodec.deserialize('')` would throw on empty string
and the seam's outer catch would return `defaultValue` = `null`, which is
actually *also* correct — but `JSON.parse('')` throwing is incidental, not a
designed guard, so the explicit hook is the safer choice and the locked design
note endorses it). No defect. Noted only because the inline comment at
`lastEdited.svelte.ts:46` still describes the *old* try/catch shape
(`if (typeof localStorage === 'undefined') return; try {...}`), which no longer
exists in this method — it is now historical narration that could mislead a
future reader into thinking that code is present.
**Fix:** Trim the stale "Replaces:" comment block (lines 45-46) to a short note,
since the SSR guard now lives entirely in the seam and the in-method code no
longer resembles the quoted snippet.

---

_Reviewed: 2026-05-28T18:47:04Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
