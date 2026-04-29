---
phase: 260429-lyq-quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/shell/calculator-store.svelte.ts
  - src/lib/shell/calculator-store.test.ts
autonomous: true
requirements:
  - QUICK-CALCSTORE-01
---

<objective>
Add a single new generic class `CalculatorStore<T>` at `src/lib/shell/calculator-store.svelte.ts` plus exhaustive co-located tests at `src/lib/shell/calculator-store.test.ts`.

Purpose: Commit 1 of a 5-commit architectural deepening that will collapse the 6 hand-written state singletons under `src/lib/{pert,feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts` (~451 LOC total) into one shared, generic store class. This commit is a **pure addition** — no existing files are modified. Subsequent commits (2–5) will migrate each slice to use the new store.

Output:
- `src/lib/shell/calculator-store.svelte.ts` — generic class with `current`, `lastEdited`, `init()`, `persist()`, `reset()`.
- `src/lib/shell/calculator-store.test.ts` — co-located test suite covering the 10 behaviors enumerated below.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md

<!-- Reference singletons that CalculatorStore<T> will eventually replace. -->
<!-- Mirror these patterns exactly: header comment style, eager-init-in-constructor, -->
<!-- silent try/catch, SSR guard, LastEdited interaction. -->
@src/lib/pert/state.svelte.ts
@src/lib/uac-uvc/state.svelte.ts
@src/lib/feeds/state.svelte.ts
@src/lib/shared/lastEdited.svelte.ts

<!-- Reference test pattern: vi.resetModules() + dynamic import for fresh module -->
<!-- simulation. The test file for CalculatorStore<T> must use this same pattern, -->
<!-- but instantiate the class directly in each test (no module-scope singleton). -->
@src/lib/pert/state.test.ts

<interfaces>
<!-- Locked public interface for CalculatorStore<T>. Do not deviate. -->

```ts
import { LastEdited } from '$lib/shared/lastEdited.svelte.js';

export interface CalculatorStoreOptions<T> {
  storageKey: string;
  defaults: () => T;
  /** Optional custom merge for nested sub-objects. Default: shallow `{ ...defaults, ...parsed }`. */
  merge?: (defaults: T, parsed: Partial<T>) => T;
}

export class CalculatorStore<T> {
  current: T;                  // initialized via $state<T>(...) — .svelte.ts required
  lastEdited: LastEdited;      // instantiated with key = `${storageKey}_ts`

  constructor(options: CalculatorStoreOptions<T>);
  init(): void;
  persist(): void;
  reset(): void;
}
```

<!-- LastEdited public surface (already exists, do not modify): -->
<!--   new LastEdited(key: string)                                 -->
<!--   .current: number | null                                     -->
<!--   .stamp(): void   — debounced 60s, writes `${key}` value     -->
<!--   .clear(): void   — sets current=null, removes localStorage  -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create CalculatorStore&lt;T&gt; generic class</name>
  <files>src/lib/shell/calculator-store.svelte.ts</files>
  <behavior>
    Public interface matches the locked design in &lt;interfaces&gt; above. Behavioral contract:
    - Constructor stores options, instantiates `lastEdited = new LastEdited(${storageKey}_ts)`,
      initializes `current = $state<T>(options.defaults())`, then calls `this.init()` eagerly
      (last statement in constructor — see PERT header comment for the rationale).
    - `init()`: short-circuits if `typeof localStorage === 'undefined'` (SSR guard); otherwise
      reads `localStorage.getItem(storageKey)`, JSON.parses, applies merge function (custom if
      provided, else shallow `{ ...options.defaults(), ...parsed }`), assigns to `this.current`.
      All inside try/catch — silent on any throw (invalid JSON, security errors, quota).
    - `persist()`: writes `JSON.stringify(this.current)` to localStorage under `storageKey`
      inside try/catch (silent on throw); ALWAYS calls `this.lastEdited.stamp()` afterward —
      stamp() runs even if setItem throws (matches existing PERT pattern: stamp is outside the
      try/catch). Also guarded by SSR check before the setItem call.
    - `reset()`: assigns `this.current = options.defaults()`, removes localStorage entry inside
      try/catch (silent on throw, SSR-guarded), calls `this.lastEdited.clear()`.
  </behavior>
  <action>
    Create `src/lib/shell/calculator-store.svelte.ts` with:

    1. File header comment matching the style of `src/lib/pert/state.svelte.ts` lines 1–5. Cover:
       - Purpose: generic, reusable LocalStorage-backed singleton class
       - Note that `.svelte.ts` is required for `$state` rune compilation
       - Persistence contract: no localStorage calls outside `init`/`persist`/`reset`
       - SSR safety: every localStorage access is guarded by `typeof localStorage === 'undefined'`
       - Mention this is the consolidated replacement for the per-slice state singletons under
         `src/lib/{pert,feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts` (commits 2–5
         will migrate each slice).
       - Inline comment near `this.init()` in the constructor explaining the eager-init
         rationale (child `$effect`s mounted before route `onMount` can fire `persist()` with
         default values and clobber restored state). Mirror the wording from PERT lines 31–34.

    2. Imports:
       ```ts
       import { LastEdited } from '$lib/shared/lastEdited.svelte.js';
       ```
       (Use the `.js` specifier to match the rest of the codebase.)

    3. Export `interface CalculatorStoreOptions<T>` exactly as shown in &lt;interfaces&gt;.

    4. Export `class CalculatorStore<T>` with:
       - `current = $state<T>(...)` — initialized in the constructor body, NOT as a class
         field initializer that calls `options.defaults()` before `options` exists. Pattern:
         declare with `current: T;` then assign `this.current = $state<T>(this.options.defaults())`
         in the constructor. (Or hold `options` on a private field and reference it.)
         **Verify the chosen pattern compiles under `pnpm exec svelte-check` before finalizing.**
       - `lastEdited: LastEdited` — instantiated in the constructor with `${storageKey}_ts`.
       - Private/readonly storage of constructor options (or destructured copies of
         `storageKey`, `defaults`, `merge`) for use in `init`/`persist`/`reset`.
       - `init()`, `persist()`, `reset()` matching the behavioral contract in &lt;behavior&gt;.

    5. Default merge: when `options.merge` is undefined, use shallow merge:
       ```ts
       this.current = { ...this.defaults(), ...(parsed as T) };
       ```
       When defined, call `options.merge(this.defaults(), parsed)` and assign the return value.

    6. Do NOT export a singleton instance. Migration commits 2–5 will instantiate per-slice
       singletons in the existing `state.svelte.ts` files. This module exports only the class
       and the options interface.

    7. No new dependencies. No edits to any other file.

    Style: TypeScript strict, 2-space indent, single quotes (match the existing files).
  </action>
  <verify>
    <automated>pnpm exec svelte-check --tsconfig ./tsconfig.json 2>&amp;1 | tee /tmp/svelte-check.log; grep -E 'errors|Error' /tmp/svelte-check.log | grep -v '0 errors'; test "$(grep -c '^0 errors' /tmp/svelte-check.log)" -ge 1</automated>
  </verify>
  <done>
    - `src/lib/shell/calculator-store.svelte.ts` exists.
    - Exports `CalculatorStore` class and `CalculatorStoreOptions<T>` interface; no singleton export.
    - Header comment + eager-init constructor comment present and mirror PERT style.
    - `pnpm exec svelte-check` reports zero errors.
    - File touches no other source files.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Co-locate exhaustive CalculatorStore tests</name>
  <files>src/lib/shell/calculator-store.test.ts</files>
  <behavior>
    Each test below maps 1:1 to the requirements. Use `vi.resetModules()` + dynamic import in
    every test that needs a "fresh" store reading from localStorage, and `localStorage.clear()`
    in `beforeEach` + `afterEach`. Since `CalculatorStore` is a class (not a module-scope
    singleton), tests instantiate `new CalculatorStore({...})` directly per test — but tests
    that simulate "reload" still use the dynamic-import pattern for the LastEdited side-effects
    to be exercised cleanly.

    Test cases (10 total, exhaustive):

    1. **Defaults**: Constructing a store with `defaults: () => ({ a: 1, b: 'x' })` and an
       empty localStorage produces `store.current` deep-equal to `{ a: 1, b: 'x' }`.

    2. **Persist + restore round-trip** (uses freshModule pattern):
       - Construct store, mutate `current.a = 42`, call `persist()`.
       - Construct a NEW store with the same `storageKey` and `defaults`. Assert
         `current.a === 42`. (No `vi.resetModules()` needed since the class itself is stateless
         — but include the dynamic-import variant for at least one test to mirror PERT's
         "simulate reload" pattern.)

    3. **Partial JSON merges with shallow defaults**: Pre-seed
       `localStorage.setItem(key, JSON.stringify({ a: 99 }))`. Construct store with defaults
       `{ a: 1, b: 'x' }` and no custom merge. Assert `current.a === 99 && current.b === 'x'`.

    4. **Custom merge invoked with `(defaults, parsed)`**: Provide a `vi.fn()` merge that
       returns a sentinel object. Pre-seed localStorage with partial JSON. Construct store.
       Assert: merge fn called once, called with the exact `(defaults(), parsed)` arguments
       (`expect(merge).toHaveBeenCalledWith({ a: 1, b: 'x' }, { a: 99 })`), and
       `store.current` deep-equals the sentinel.

    5. **Invalid JSON falls back silently**: `localStorage.setItem(key, '{not json')`.
       Construct store. Assert: no throw, `current` deep-equals defaults.

    6. **localStorage.getItem throwing falls back silently**:
       Use `vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); })`.
       Construct store. Assert: no throw, `current` deep-equals defaults.
       Restore the spy in afterEach.

    7. **localStorage.setItem throwing during persist() is silent**:
       `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); })`.
       Construct store, mutate `current`, call `persist()`. Assert: no throw is observed
       (test passes by not throwing). Also assert `lastEdited.stamp()` still ran by checking
       `store.lastEdited.current` is a finite number (stamp is outside the setItem try/catch
       in the PERT reference; the new class must match).

    8. **reset() clears storage AND clears lastEdited**:
       Mutate, persist, then `reset()`. Assert:
       - `localStorage.getItem(storageKey) === null`
       - `localStorage.getItem(`${storageKey}_ts`) === null`
       - `store.current` deep-equals defaults
       - `store.lastEdited.current === null`

    9. **persist() updates lastEdited.stamp()**:
       Construct store, capture `store.lastEdited.current` (initially null). Call `persist()`.
       Assert `store.lastEdited.current` is now a number close to `Date.now()` (within 5s).
       Note the LastEdited 60s debounce — for this test, the initial stamp from null always
       writes, so no debounce concern.

    10. **SSR safety — init() does not throw when localStorage is undefined**:
        `vi.stubGlobal('localStorage', undefined)`. Construct a store and explicitly call
        `init()`. Assert: neither throws. `current` equals defaults. `unstubAllGlobals()` in
        afterEach to restore.
  </behavior>
  <action>
    Create `src/lib/shell/calculator-store.test.ts` with:

    1. Imports:
       ```ts
       import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
       import { CalculatorStore } from './calculator-store.svelte.js';
       ```

    2. Top-of-file `beforeEach(() => { localStorage.clear(); })` and
       `afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); })`.

    3. Define a small reusable shape and defaults factory at module scope:
       ```ts
       type Shape = { a: number; b: string };
       const makeDefaults = (): Shape => ({ a: 1, b: 'x' });
       const KEY = 'test_calc_store';
       ```

    4. Implement all 10 tests under descriptive `describe` blocks, e.g.
       `describe('CalculatorStore — defaults', ...)`,
       `describe('CalculatorStore — persist + restore', ...)`,
       `describe('CalculatorStore — merge', ...)`,
       `describe('CalculatorStore — error resilience', ...)`,
       `describe('CalculatorStore — reset', ...)`,
       `describe('CalculatorStore — lastEdited integration', ...)`,
       `describe('CalculatorStore — SSR safety', ...)`.

    5. For test #2, include one variant that uses `vi.resetModules()` + dynamic `import('./calculator-store.svelte.js')` to mirror the PERT pattern (so future readers see the precedent), and one variant that simply constructs a second instance with the same key (the more common case for a class-based store).

    6. For test #4, capture the merge `vi.fn()` return value as a sentinel object that
       includes a discriminator field (e.g. `{ a: 99, b: 'merged', __sentinel: true }`) so
       the assertion is unambiguous.

    7. Co-located in `src/lib/shell/`, NOT under `__tests__/` — per memory
       feedback_test_colocation.md and the existing pattern (see `src/lib/pert/state.test.ts`,
       `src/lib/shell/HamburgerMenu.test.ts`, etc.).

    Style: TypeScript strict, 2-space indent, single quotes (match `src/lib/pert/state.test.ts`).
    Do not import or modify any other test or source file.
  </action>
  <verify>
    <automated>pnpm exec vitest run src/lib/shell/calculator-store.test.ts --reporter=verbose 2>&amp;1 | tail -40 | tee /tmp/vitest-store.log; grep -E 'Tests +([0-9]+) passed' /tmp/vitest-store.log | grep -v 'failed'; pnpm exec vitest run 2>&amp;1 | tail -10 | tee /tmp/vitest-full.log; grep -E 'Tests +.+ passed' /tmp/vitest-full.log | grep -v 'failed'</automated>
  </verify>
  <done>
    - `src/lib/shell/calculator-store.test.ts` exists, co-located (NOT under `__tests__/`).
    - All 10 tests implemented and passing.
    - `pnpm exec vitest run src/lib/shell/calculator-store.test.ts` — 10/10 pass.
    - `pnpm exec vitest run` — full suite still green (was 469 tests passing; new total ≈ 479).
    - `pnpm exec svelte-check` — zero errors.
    - No other files modified.
  </done>
</task>

</tasks>

<verification>
End-of-plan checks (run all):

1. `pnpm exec svelte-check --tsconfig ./tsconfig.json` — zero errors.
2. `pnpm exec vitest run src/lib/shell/calculator-store.test.ts` — all 10 tests pass.
3. `pnpm exec vitest run` — full suite green; total count grew by exactly the new tests.
4. `git status --short` — only two new files staged: `src/lib/shell/calculator-store.svelte.ts`
   and `src/lib/shell/calculator-store.test.ts`. No modifications to any existing file.
5. `git diff src/lib/pert/ src/lib/uac-uvc/ src/lib/feeds/ src/lib/gir/ src/lib/morphine/ src/lib/fortification/` — empty diff. (This commit is a pure addition.)
</verification>

<success_criteria>
- Pure addition: only the two new files exist; no existing file is modified.
- `CalculatorStore<T>` class exposes the locked public interface (`current`, `lastEdited`,
  `init()`, `persist()`, `reset()`) and accepts `{ storageKey, defaults, merge? }`.
- All localStorage access is wrapped in try/catch and SSR-guarded.
- Eager init runs in the constructor — ready for migration commits 2–5 to drop the new store
  into each per-slice `state.svelte.ts` without behavior change.
- 10 exhaustive tests pass, full suite remains green, `svelte-check` clean.

**Commit message** (use exactly this for the resulting commit):
```
feat(shell): add CalculatorStore<T> for state-singleton collapse

Generic class consolidating the 6 per-slice state singletons under
src/lib/{pert,feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts.
Pure addition — no existing files modified. Commits 2–5 of this
deepening will migrate each slice to use the new store.
```
</success_criteria>

<output>
After completion, create `.planning/quick/260429-lyq-add-calculatorstore-t-generic-class-for-/260429-lyq-01-SUMMARY.md` summarizing:
- Files created (with line counts)
- Public surface of `CalculatorStore<T>`
- Test counts (per describe block + total)
- Confirmation that no other files were touched
- Pointer to the next commit (commit 2 of 5: migrate `uac-uvc` slice — simplest case first)
</output>
