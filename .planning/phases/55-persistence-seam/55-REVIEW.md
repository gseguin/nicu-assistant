---
phase: 55-persistence-seam
reviewed: 2026-05-28T12:02:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/lib/shared/persistent-value.ts
  - src/lib/shared/persistent-value.test.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 55: Code Review Report

**Reviewed:** 2026-05-28T12:02:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

`PersistentValue<T>` is a small, clean, well-scoped persistence seam. The implementation
faithfully reproduces the locked decisions in `55-CONTEXT.md` (D-01..D-07): per-instance
codec defaulting to JSON, a raw-string codec for the FOUC theme path, a recover hook that
owns the read path, the SSR `typeof localStorage === 'undefined'` guard on every method, and
the intentional silent try/catch. All 22 tests pass against vitest 4.1.4.

I verified the two type-soundness claims that this review was asked to stress:

1. **`rawStringCodec` / non-string `T`** — confirmed sound. `Codec<string>` is NOT assignable
   to `Codec<T>` for any non-string `T` under `strict: true`; I reproduced the compile error
   (`TS2322`) for `createPersistentValue<number>({ codec: rawStringCodec })` and confirmed the
   `<string>` case compiles. The code comment at line 67 ("TypeScript enforces this at the call
   site") is accurate. **Not a finding.**
2. **D-07 silent-catch** — confirmed it matches the established `calculator-store.svelte.ts`
   convention and is explicitly in-scope as intentional. **Not flagged**, per review brief.

The implementation is correct. The findings below are concentrated in **test coverage**: three
behaviors that the production code documents as contracts have **zero test coverage**, including
one defense-in-depth path that is currently dead-untested and could silently regress. Plus one
genuine type-safety boundary hole (by-design, but worth recording) and one minor consistency note.

## Warnings

### WR-01: `recover`-throws fallback path is documented but completely untested

**File:** `src/lib/shared/persistent-value.ts:93-98, 102-105`
**Issue:** The doc comment (lines 28-29 and 94-96) asserts a specific contract: "the outer
try/catch in read() is last-resort defense-in-depth … if recover itself throws unexpectedly,"
in which case `read()` returns `defaultValue`. Tracing the code, this is correct — `opts.recover(raw)`
is invoked inside the `try` block, so a throw is caught and falls through to
`return opts.defaultValue`. **But there is no test exercising a throwing recover hook.** This is
the single most consequential untested path in the file: a future refactor that hoists the
`recover` call above the `try` (e.g. to "read raw outside, transform inside") would break the
documented total-recover guarantee and no test would catch it. For a clinical PWA where a
throwing recover would otherwise crash the read path, this guarantee deserves an explicit lock.
**Fix:** Add a test in the SEAM-03 block:
```ts
it('read() returns defaultValue when recover hook throws', () => {
	localStorage.setItem('k', 'anything');
	const pv = createPersistentValue<number>({
		key: 'k',
		defaultValue: -1,
		recover: () => { throw new Error('boom'); }
	});
	expect(() => pv.read()).not.toThrow();
	expect(pv.read()).toBe(-1);
});
```

### WR-02: `JSON.parse('null')` returning `null` instead of `defaultValue` is documented but untested

**File:** `src/lib/shared/persistent-value.ts:49-51, 100`
**Issue:** Two comments (jsonCodec at lines 49-51, and `read()` at line 100) call out a sharp
edge: a stored literal `"null"` deserializes to JavaScript `null`, NOT `defaultValue`, because
`raw === null` is a reference check against the *absence* of a key, not against the string
`"null"`. I confirmed `JSON.parse('null') === null` at runtime. This is a deliberate,
load-bearing behavior (the comment warns future nullable adapters to use `recover` instead) — yet
no test pins it. A behavior this surprising and explicitly documented should be locked so the
warning in the comment remains true.
**Fix:** Add to the JSON default codec describe block:
```ts
it('read() returns null (NOT defaultValue) when stored value is the JSON literal "null"', () => {
	const pv = createPersistentValue<number | null>({ key: 'n', defaultValue: 42 });
	localStorage.setItem('n', 'null');
	expect(pv.read()).toBeNull();
});
```

### WR-03: Empty-string stored value untested for both codecs (divergent behavior)

**File:** `src/lib/shared/persistent-value.ts:99-101`
**Issue:** A stored empty string `''` is a real localStorage state (e.g. a prior `write('')`
through `rawStringCodec`, or external/legacy data) and it behaves **differently per codec**, yet
neither path is tested:
- With `jsonCodec` (default): `raw === null` is false (it's `''`), so `JSON.parse('')` runs and
  **throws** `SyntaxError` → caught → returns `defaultValue`. I confirmed the throw at runtime.
- With `rawStringCodec`: `''` is returned verbatim as a valid value (NOT defaultValue), since the
  `raw === null` guard does not treat empty string as absence.

This divergence is correct and intentional (empty string is a legitimate raw value but not
legitimate JSON), but it is exactly the kind of boundary that silently regresses. `lastEdited`
and `theme` are raw-string consumers in Phase 56; the empty-string-is-a-real-value semantics
should be locked before they migrate.
**Fix:** Add two assertions:
```ts
it('jsonCodec: stored empty string falls back to defaultValue (parse throws)', () => {
	const pv = createPersistentValue({ key: 'k', defaultValue: 7 });
	localStorage.setItem('k', '');
	expect(pv.read()).toBe(7);
});
it('rawStringCodec: stored empty string round-trips as "" (not defaultValue)', () => {
	const pv = createPersistentValue({ key: 'k', defaultValue: 'x', codec: rawStringCodec });
	localStorage.setItem('k', '');
	expect(pv.read()).toBe('');
});
```

## Info

### IN-01: `jsonCodec<T>` deserialize is an unchecked type assertion (boundary unsoundness)

**File:** `src/lib/shared/persistent-value.ts:53-58`
**Issue:** `deserialize: JSON.parse as (s: string) => T` is an unsound cast — `JSON.parse`
returns `any` and the seam asserts it is `T` with no runtime validation. A key holding `"123"`
read through `createPersistentValue<string[]>` returns the number `123` typed as `string[]` with
no error (confirmed at runtime). This is **by design** per D-01 (the default JSON codec is
convenience for trusted self-written data; the `recover` hook is the documented escape hatch for
validation, e.g. favorites' 6-step pipeline). Recording it only so the boundary is on the record:
the seam provides no runtime type guarantee on the JSON read path. No change required for Phase 55;
Phase 56 adapters that read externally-influenced or schema-versioned data must use `recover`
(favorites already does), not the bare default codec.
**Fix:** None required — keep as documented limitation. Optionally tighten the comment at lines
49-51 to also state "the default codec performs no runtime shape validation; use `recover` for
any value that needs it."

### IN-02: SSR-guard tests all pin `rawStringCodec`; default-codec SSR path is inferred, not exercised

**File:** `src/lib/shared/persistent-value.test.ts:82-101`
**Issue:** All three SEAM-01 SSR tests construct the `PersistentValue` with
`codec: rawStringCodec`. The SSR early-return (`typeof localStorage === 'undefined'`) happens
before any codec is touched, so behavior is codec-independent and the coverage is logically
adequate. Noting only that the default-JSON-codec instance is never run through the SSR guard in
a test; a reader scanning the suite might assume the guard was only validated for the raw-string
adapter. Low value, purely a readability/completeness note.
**Fix:** Optionally drop the explicit `codec: rawStringCodec` from one of the three SSR tests (or
add a fourth) so the default codec path is also visibly covered under the SSR guard. Not required.

---

_Reviewed: 2026-05-28T12:02:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
