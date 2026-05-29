---
phase: 57-auto-persist-behind-calculatorstore
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/lib/shell/calculator-store.svelte.ts
  - src/lib/shell/calculator-store.test.ts
  - src/lib/gir/GirInputs.svelte
  - src/lib/morphine/MorphineWeanInputs.svelte
  - src/lib/fortification/FortificationInputs.svelte
  - src/lib/feeds/FeedAdvanceInputs.svelte
  - src/lib/uac-uvc/UacUvcInputs.svelte
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 57: Code Review Report

**Reviewed:** 2026-05-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

The auto-persist refactor itself is mechanically sound: the constructor's `$effect.root(() => $effect(() => { JSON.stringify(this.current); this.persist(); }))` block correctly subscribes to deep mutations of `this.current` via the locked Svelte 5 pattern, the SSR guard is correctly placed (after `this.init()`, which has its own internal guard), and the 5 `*Inputs.svelte` deletions are clean (no orphaned imports, no orphaned state, no broken references).

The genuine concerns are around **scope omissions** and **test rigor**, not the core change:

1. **The parent `*Calculator.svelte` files (4 of 5) still carry character-identical `$effect`+`JSON.stringify`+`state.persist()` blocks** that the auto-persist effect now duplicates. These were not in the file scope passed to the reviewer, but they are now obvious dead duplicates of the new constructor effect, with the same "defensive — drawer-only mount" comment that was deleted from the Inputs siblings. This produces 3x writes per keystroke (auto-persist + parent-calculator effect + any string-bridge mirror writes), and the "defensive when mounted without Inputs" rationale is also no longer true — `CalculatorPage.svelte` always mounts both `<Calculator />` and `<Inputs />` together (lines 76 and 81/94).
2. **Test (c) does not exercise the 60s debounce as claimed.** It relies on the initial benign-write stamp at construction to set `lastEdited.current`, and then both subsequent mutations are suppressed by the same debounce. The test would pass identically even if the inner `$effect` never re-ran for the mutations — it does not distinguish "debounce fired and suppressed re-stamp" from "no re-stamp attempt occurred". A real debounce test must either use `vi.useFakeTimers()` + `vi.advanceTimersByTime(60_001)` to cross the window, or directly call `stamp()` twice and verify only the first wrote.
3. **Test (b)'s "without any component mounted — proves drawer-only-mount path" claim overstates what is verified.** No test in this file ever mounts a component, so test (b) is not actually distinguishing the drawer-only path from the calculator-mounted path. It is the same proof as test (a) with a different field.

No security issues. No SSR breakage. No TypeScript concerns with `$effect.root()` in a generic class.

## Warnings

### WR-01: Parent `*Calculator.svelte` files still call `state.persist()` from their own `$effect` — out-of-scope-but-now-dead duplicates

**Files:**
- `src/lib/uac-uvc/UacUvcCalculator.svelte:14-19`
- `src/lib/gir/GirCalculator.svelte:39-44`
- `src/lib/fortification/FortificationCalculator.svelte:51-56`
- `src/lib/feeds/FeedAdvanceCalculator.svelte:98-106`

**Issue:** The refactor deleted the `JSON.stringify(state.current); state.persist();` `$effect` from the 5 `*Inputs.svelte` files (good — the constructor auto-persist subsumes them). But the IDENTICAL `$effect` block still exists in 4 of the 5 parent `*Calculator.svelte` files. The carry-forward comment in each says "Kept here so the calculator also persists when mounted without the inputs fragment — defensive."

This is now a triple writer per keystroke:
1. Auto-persist effect in `CalculatorStore` constructor — fires on every `this.current` deep mutation
2. The parent calculator's `$effect` — fires on the same mutation
3. Any explicit `state.persist()` callers (none in production today, but `morphineState.reset()` in `MorphineWeanInputs.svelte:26` indirectly triggers another auto-persist via `current = defaults()`)

Each keystroke now writes to `localStorage` 2x and runs `JSON.stringify(state.current)` 2x where Phase 57 intended 1x. The "defensive" justification is also incorrect post-Phase-42.1: `src/lib/shell/CalculatorPage.svelte` (lines 76 and 81/94) ALWAYS mounts both `<Calculator />` and `<Inputs />` together — never one without the other. So even the original "Inputs-only drawer mount" defensiveness was vestigial.

`MorphineWeanCalculator.svelte` correctly has NO such effect (it was already removed in a prior phase). That asymmetry is now the canonical pattern; the other 4 are now the outliers.

Out of declared file scope, but listed here because it is the direct semantic consequence of the in-scope change and the explicit Phase 57 goal was "fold auto-persist behind the existing class so duplicated `$effect`s can be deleted everywhere."

**Fix:** In a follow-up commit (or pulled into this phase if scope can be widened), delete the `$effect(() => { JSON.stringify(...); ...persist(); });` block from each of the 4 calculator files above. Each is a 6-line removal mirroring the 5 already done in the Inputs files.

---

### WR-02: Test (c) does not actually exercise the 60s debounce — it passes via the construction-time stamp

**File:** `src/lib/shell/calculator-store.test.ts:221-240`

**Issue:** The test's stated purpose is "(c) 60s debounce: rapid mutations do not re-stamp lastEdited within the window". The actual test flow:

```
const store = new CalculatorStore<Shape>(...);  // constructor's $effect.root schedules an effect
await tick();                                    // initial benign write fires; lastEdited stamped at T0
store.current.a = 10;                            // mutation triggers effect
await tick();                                    // persist() runs; stamp() sees (T1 - T0) < 60s -> NO-OP
const stamp1 = store.lastEdited.current;         // stamp1 === T0
store.current.a = 11;
await tick();                                    // persist() runs; stamp() sees (T2 - T0) < 60s -> NO-OP
const stamp2 = store.lastEdited.current;         // stamp2 === T0
expect(stamp2).toBe(stamp1);                     // T0 === T0 — passes
```

Because the initial construction-time benign write already stamps `lastEdited`, ALL subsequent mutations in the same test (within milliseconds) are inside the 60s debounce window. The test would pass identically if:
- The mutations failed to fire the auto-persist at all (stamp would never change from T0)
- `STAMP_DEBOUNCE_MS` were `Infinity` (same outcome)
- `STAMP_DEBOUNCE_MS` were `1ms` and the test happened to run fast enough (likely outcome)

The test cannot distinguish "debounce is working" from "the effect never re-ran" from "the debounce window is wrong". It is a tautology under the current `Date.now()` clock.

`expect(typeof stamp1).toBe('number')` on line 231 only proves a stamp happened at SOME point — it could be the construction stamp.

**Fix:** Use fake timers so the debounce window can actually be crossed and observed:

```ts
it('(c) 60s debounce: stamping within the window is suppressed; after the window, it re-stamps', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  try {
    const store = new CalculatorStore<Shape>({ storageKey: KEY, defaults: makeDefaults });
    await tick();                              // initial stamp at T0 = 2026-01-01T00:00:00Z
    const stamp0 = store.lastEdited.current as number;

    vi.advanceTimersByTime(1_000);             // T0 + 1s — inside window
    store.current.a = 10;
    await tick();
    expect(store.lastEdited.current).toBe(stamp0);  // suppressed

    vi.advanceTimersByTime(60_000);            // T0 + 61s — crossed window
    store.current.a = 11;
    await tick();
    expect(store.lastEdited.current).toBeGreaterThan(stamp0);  // re-stamped
  } finally {
    vi.useRealTimers();
  }
});
```

---

### WR-03: Test (b)'s "without any component mounted — proves drawer-only-mount path" claim is misleading

**File:** `src/lib/shell/calculator-store.test.ts:206-219`

**Issue:** The test title and rationale assert that test (b) proves the drawer-only-mount path works. But:

1. **No test in this file ever mounts a component** (no `render()` import, no `mount()` call). Test (a) on line 192-204 also runs "without any component mounted" — they are mechanically identical proofs that differ only in field choice (`.a` vs `.b`).
2. The original "drawer-only-mount path" concern was: when the route renders `<InputDrawer>{#snippet children()}<Inputs />{/snippet}</InputDrawer>`, the drawer's `<Inputs />` is mounted while `<Calculator />` may or may not be — but BOTH always exist in `CalculatorPage.svelte`. The real failure mode being guarded against is "the inputs in the drawer mutate state, but no `$effect` exists in the drawer subtree to call `persist()`." The fix-under-test is the constructor's `$effect.root` — but the constructor runs at module-eval time (when the state singleton is imported), regardless of which components mount. So the proof shape required is "import the state singleton, mutate `.current`, observe a persist write." That is exactly what test (a) already proves.

Test (b) is not wrong, but its commentary creates the impression that it tests a separate path. It does not. It is a near-duplicate of test (a).

**Fix:** Either:
- Delete test (b) (it duplicates (a) with negligible additional coverage), OR
- Reword the assertion to a coverage statement that actually differs — e.g., "(b) mutating a string-typed field also triggers auto-persist (proves JSON.stringify subscribes to all nested fields, not just numbers)". Then keep it.

OR — if the intent really is to prove the drawer-only path — add a third test that imports `*Inputs.svelte`, mounts it via `render()` without mounting the calculator, mutates a `bind:value` target, and asserts a write. That would be a genuine drawer-only proof.

---

### WR-04: Test (a) spy installation depends on undocumented ordering between `new CalculatorStore()` and `tick()`

**File:** `src/lib/shell/calculator-store.test.ts:193-203`

**Issue:** The test installs the `setItem` spy on line 197 (after construction) "to exclude the initial benign write (D-02)". This works IF the initial benign write's `setItem` call has already drained from the microtask queue by line 197. But the constructor schedules the inner `$effect` synchronously (via `$effect.root`) and the inner effect runs on the NEXT microtask. Line 196-197 is synchronous, then line 200 mutates, then line 201 awaits a tick.

The actual flush ordering:
- Line 193-196: constructor runs; `$effect.root` registers a pending effect; no `setItem` yet
- Line 197: spy installed BEFORE the initial effect runs (the microtask has not yet fired)
- Line 200: `store.current.a = 99` — mutates; schedules effect re-run
- Line 201: `await tick()` — flushes; the inner `$effect` runs ONCE, with the latest value, calling `setItem` ONCE

Net effect: the spy DOES capture only one call, but for the wrong reason. The "exclude the initial benign write" rationale on line 198 is incorrect — there was never a separate "initial benign write" in this test because the effect first runs AFTER the mutation, by which time the field is already `99`. The spy works by accident: Svelte 5's scheduler coalesces both the initial schedule and the mutation-triggered schedule into a single effect invocation when both are pending at the same microtask.

This is fragile. If a future Svelte upgrade makes the initial effect fire synchronously inside the constructor (e.g., on `$effect.root` registration), the spy on line 197 will MISS the initial write and the test will continue to pass for the wrong reason — but the next mutation that should be coalesced won't be, and the assertion `toHaveBeenCalledWith(KEY, JSON.stringify({ a: 99, b: 'x' }))` could see an earlier `{ a: 1, b: 'x' }` call instead.

The comment on line 198 should also be updated — D-02 referred to a prior phase's "initial benign write" concern in a different context (early-mount before localStorage hydrate). Here the benign-write concern is purely about effect ordering.

**Fix:** Make the test deterministic by waiting for the initial effect to drain BEFORE installing the spy:

```ts
const store = new CalculatorStore<Shape>({ storageKey: KEY, defaults: makeDefaults });
await tick();  // drain the initial $effect.root() scheduled effect
const spy = vi.spyOn(Storage.prototype, 'setItem');

store.current.a = 99;
await tick();

expect(spy).toHaveBeenCalledTimes(1);
expect(spy).toHaveBeenCalledWith(KEY, JSON.stringify({ a: 99, b: 'x' }));
```

This makes the "spy excludes the initial write" claim mechanically true rather than accidentally true. Also update the comment to reference the actual phase artifact (D-05, not D-02).

## Info

### IN-01: SSR test does not validate that the auto-persist effect was NOT installed under SSR

**File:** `src/lib/shell/calculator-store.test.ts:176-189`

**Issue:** The SSR safety test on line 177 only proves that the constructor doesn't throw and `current` stays at defaults. It does NOT prove the new behavior added in this phase: that the `$effect.root()` block on lines 42-49 of `calculator-store.svelte.ts` is correctly conditionally installed (the SSR-guard wrap). If someone refactored the guard incorrectly (e.g., moved it inside the `$effect.root` call so the root effect was created but the inner effect was a no-op), the existing SSR test would still pass — but a phantom root effect with no cleanup would now leak in SSR (the locked design fact states cleanup is discarded only because the singleton lives the app lifetime; an SSR-context root effect violates that contract).

**Fix:** Add an assertion that no `$effect.root` was scheduled under SSR. Since direct introspection of Svelte internals is not exposed, this can be proxied by stubbing `$effect.root` via the `svelte` module mock and asserting it was not called when `localStorage` is undefined. Or, more pragmatically, add a test that under SSR, mutating `store.current.a = 99` does NOT throw and does NOT attempt to write (since localStorage is undefined, any write attempt would throw — but only because of the inner persist's own guard; the test would prove the effect itself is not running).

This is informational because the current production code visibly wraps the `$effect.root` block in the guard at line 42, so the bug is unlikely. But a regression test would lock the contract.

---

### IN-02: Comment on `calculator-store.svelte.ts:34-37` is outdated post-Phase 57

**File:** `src/lib/shell/calculator-store.svelte.ts:34-37`

**Issue:** The comment block on lines 34-37 explains why `this.init()` runs eagerly in the constructor:
> "Eager init: child $effects mounted before the route's onMount can fire persist() with default values and clobber the restored state."

In Phase 57 the "child $effects" referenced here have been deleted from the 5 `*Inputs.svelte` files. The justification still holds because the new constructor auto-persist effect on lines 43-48 would itself clobber localStorage with defaults if it ran before `init()` — but the comment now points to a no-longer-existing code path. Update it to reference the NEW reason (the constructor's own auto-persist effect, which fires synchronously on the next microtask after construction and would write defaults if init hadn't already restored).

**Fix:** Update lines 34-37 to:

```ts
// Eager init: the auto-persist $effect.root below schedules an effect that fires on
// the next microtask and would write the defaults factory output to localStorage,
// clobbering any restored value, if init() hadn't already populated this.current.
// Running init() first means the effect's first read sees the restored value.
```

---

### IN-03: Trailing blank-script-line in `UacUvcInputs.svelte` and `FortificationInputs.svelte`

**Files:**
- `src/lib/uac-uvc/UacUvcInputs.svelte:26`
- `src/lib/fortification/FortificationInputs.svelte:131`

**Issue:** Both files have a stray blank line just before `</script>` left over from the `$effect` deletion:

`UacUvcInputs.svelte`:
```
24		const inputs = config.inputs as UacUvcInputRanges;
25
26	</script>      <!-- extra blank line at 25 -->
```

`FortificationInputs.svelte`:
```
130		});
131
132	</script>     <!-- extra blank line at 131 -->
```

Cosmetic, not functional. Prettier may or may not flag depending on config.

**Fix:** Delete the trailing blank line in each. Or run `pnpm format` to let prettier normalize.

---

### IN-04: `comment in calculator-store.svelte.ts:6-9` references a phase plan that has shipped — consider trimming

**File:** `src/lib/shell/calculator-store.svelte.ts:6-9`

**Issue:** Lines 6-9:
> "Consolidated replacement for the per-slice state singletons under src/lib/{feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts — commits 2–5 of this deepening will migrate each slice to instantiate CalculatorStore<T> from its own state.svelte.ts."

This migration completed in earlier phases (verified: all 5 state.svelte.ts files now do `new CalculatorStore<T>(...)`). The "will migrate" tense is now historically incorrect. Future readers will be confused about whether this is still planned work.

**Fix:** Replace with present-tense:

```ts
// Used by each slice's state.svelte.ts to instantiate a per-calculator singleton:
//   src/lib/{feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts.
```

---

_Reviewed: 2026-05-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
