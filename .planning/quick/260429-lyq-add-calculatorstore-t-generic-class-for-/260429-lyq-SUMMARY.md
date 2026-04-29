---
phase: 260429-lyq-quick
plan: 01
subsystem: shell
tags: [refactor-prep, state, generic, svelte-5, runes, addition-only]
requires:
  - $lib/shared/lastEdited.svelte.js (LastEdited class — read-only consumer)
provides:
  - CalculatorStore<T> generic class
  - CalculatorStoreOptions<T> interface
  - Foundation for commits 2–5 (per-slice migration)
affects: []
tech-stack:
  added: []
  patterns:
    - Generic class with private # fields for options closure
    - $state<T>() rune assignment in constructor body (not class field initializer)
    - Eager init() call as last constructor statement
    - SSR-guarded localStorage access (typeof localStorage === 'undefined')
    - Silent try/catch on every storage operation
    - lastEdited.stamp() outside try/catch — fires even when setItem throws
key-files:
  created:
    - src/lib/shell/calculator-store.svelte.ts (85 LOC)
    - src/lib/shell/calculator-store.test.ts (188 LOC)
  modified: []
decisions:
  - Used private # fields (#storageKey, #defaults, #merge) instead of holding the
    full options object, so behavior is independent of post-construction option
    mutation by callers.
  - $state<T>() assignment lives in the constructor body (not a class field
    initializer) because field initializers run before the constructor body and
    cannot reference `this.options`. The Svelte 5 compiler accepts this form.
  - lastEdited.stamp() runs outside the persist() try/catch — matches PERT
    reference and is asserted by test #7 (setItem-throws-during-persist).
  - Tests use direct `new CalculatorStore({...})` per case (the class is stateless
    by design); ONE variant uses `vi.resetModules()` + dynamic import to mirror
    the PERT pattern and document the precedent for future readers.
  - afterEach restores stubbed globals BEFORE clearing localStorage, because the
    SSR test stubs localStorage with undefined.
  - Custom-merge equality test uses `toEqual` + an `__sentinel: true` discriminator
    instead of `toBe` because $state(...) wraps assignments in a Proxy, breaking
    referential identity.
metrics:
  duration: ~10 minutes
  completed: 2026-04-29
  commits: 1
  tests-added: 11
  tests-passing-total: 481
---

# Quick Task 260429-lyq: CalculatorStore<T> Generic — Summary

Add a single generic `CalculatorStore<T>` class plus exhaustive co-located tests
as commit 1 of 5 in an architectural deepening that will collapse the 6 hand-
written state singletons under `src/lib/{pert,feeds,gir,morphine,fortification,
uac-uvc}/state.svelte.ts` into one shared store. **Pure addition — zero existing
files modified.**

## What was delivered

### `src/lib/shell/calculator-store.svelte.ts` (85 LOC)

Generic class plus options interface:

```ts
export interface CalculatorStoreOptions<T> {
  storageKey: string;
  defaults: () => T;
  merge?: (defaults: T, parsed: Partial<T>) => T;
}

export class CalculatorStore<T> {
  current: T;                  // initialized via $state<T>(...)
  lastEdited: LastEdited;      // keyed `${storageKey}_ts`
  constructor(options: CalculatorStoreOptions<T>);
  init(): void;
  persist(): void;
  reset(): void;
}
```

Behavioral contract (mirrors `src/lib/pert/state.svelte.ts` exactly):

- **Constructor**: stores options on private `#` fields, instantiates `lastEdited`,
  assigns `this.current = $state<T>(options.defaults())`, then calls `this.init()`
  as the last statement (eager init — see comment in source for the rationale).
- **`init()`**: SSR-short-circuits, then reads + JSON.parses + merges + assigns
  inside a single silent try/catch.
- **`persist()`**: SSR-guards the setItem call inside try/catch, then ALWAYS
  calls `lastEdited.stamp()` (stamp is outside the try/catch — fires even if
  setItem throws).
- **`reset()`**: assigns `current = defaults()`, removes the storage entry inside
  a SSR-guarded silent try/catch, calls `lastEdited.clear()`.

Default merge is shallow `{ ...defaults(), ...(parsed as T) }`. Custom merge is
called as `merge(defaults(), parsed)` and its return value is assigned verbatim.

No singleton is exported — migration commits 2–5 will instantiate one per slice
inside the existing `state.svelte.ts` files.

### `src/lib/shell/calculator-store.test.ts` (188 LOC, 11 `it()` blocks across 7 `describe` groups)

| describe                                | tests | covers |
|-----------------------------------------|-------|--------|
| CalculatorStore — defaults              | 1     | first-run state equals factory output |
| CalculatorStore — persist + restore     | 2     | new-instance round-trip + dynamic-import variant |
| CalculatorStore — merge                 | 2     | shallow default + custom merge invocation |
| CalculatorStore — error resilience      | 3     | invalid JSON / getItem throws / setItem throws |
| CalculatorStore — reset                 | 1     | clears storage + ts + lastEdited + current |
| CalculatorStore — lastEdited integration| 1     | persist() stamps within ±5s of Date.now() |
| CalculatorStore — SSR safety            | 1     | localStorage stubbed undefined — no throw |

The 11 `it()` blocks correspond to the 10 logical behaviors enumerated in the
plan; behavior #2 (persist+restore) intentionally has two variants (direct +
dynamic-import) per plan instruction.

## Verification (all green)

| Command                                                          | Result |
|------------------------------------------------------------------|--------|
| `pnpm exec vitest run src/lib/shell/calculator-store.test.ts`    | 11/11 pass |
| `pnpm exec vitest run`                                           | 481/481 pass (was 470 before) |
| `pnpm exec svelte-check --tsconfig ./tsconfig.json`              | 0 errors, 0 warnings |
| `git diff --stat HEAD~1 HEAD -- src/lib/{pert,feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts` | empty diff |
| `git status --short` (after commit)                              | only 2 new files staged |

## Confirmation: no other files touched

`git diff --stat HEAD~1 HEAD` shows exactly two new files, 273 lines added, 0
deletions, 0 modifications:

```
 src/lib/shell/calculator-store.svelte.ts | 85 ++++++++++++++++++++++++++
 src/lib/shell/calculator-store.test.ts   | 188 ++++++++++++++++++++++++++++++
 2 files changed, 273 insertions(+)
```

No edits to any of the 6 slice state singletons that this class will eventually
replace, no edits to `LastEdited`, no test config or build config changes.

## Commits

- **45d86cf** — `feat(shell): add CalculatorStore<T> for state-singleton collapse`

## Deviations from Plan

None — plan executed exactly as written. Two minor test-file refinements during
the GREEN phase (both inside the new test file, not deviations from the class
contract):

1. The custom-merge test (#4) initially used `toBe(sentinel)`. The Svelte 5
   `$state(...)` rune wraps assignments in a Proxy, so identity equality fails
   even when the assigned value is the merge return. Switched to `toEqual` +
   an `__sentinel: true` discriminator field (already specified in the plan's
   action #6) to make the assertion unambiguous.
2. Original `afterEach` ordered `localStorage.clear()` before `unstubAllGlobals()`,
   which threw in the SSR test (test #10) because the stub leaves localStorage
   `undefined`. Reordered: unstub first, then clear.

Both fixes are inside the test file, do not weaken the assertions, and the class
behavior was correct on first implementation.

## Threat Flags

None. New surface is a generic in-memory + LocalStorage state class with no
network, auth, or trust-boundary impact beyond what the existing per-slice
singletons already do (and which it will eventually consolidate, not expand).

## Self-Check: PASSED

- `src/lib/shell/calculator-store.svelte.ts` exists (85 LOC) — verified via wc
- `src/lib/shell/calculator-store.test.ts` exists (188 LOC) — verified via wc
- Commit `45d86cf` exists — verified via `git rev-parse --short HEAD`
- `pnpm exec vitest run src/lib/shell/calculator-store.test.ts` — 11/11 pass
- `pnpm exec vitest run` (full suite) — 481/481 pass
- `pnpm exec svelte-check` — 0 errors, 0 warnings
- Zero modifications to existing `state.svelte.ts` files in the 6 slices

## Next commit (commit 2 of 5)

Migrate the **`uac-uvc`** slice to use `CalculatorStore<UacUvcStateData>` —
simplest case first (single field `weightKg`, default shallow merge sufficient,
no nested sub-objects, no schema legacy concerns). Pattern for that commit:

1. Replace `src/lib/uac-uvc/state.svelte.ts` body with a thin wrapper:
   ```ts
   import { CalculatorStore } from '$lib/shell/calculator-store.svelte.js';
   import type { UacUvcStateData } from './types.js';
   import config from './uac-uvc-config.json';
   export const uacUvcState = new CalculatorStore<UacUvcStateData>({
     storageKey: 'nicu_uac_uvc_state',
     defaults: () => ({ weightKg: config.defaults.weightKg })
   });
   ```
2. Verify `src/lib/uac-uvc/state.test.ts` (if any) still passes.
3. Verify the route component reading `uacUvcState.current` is unchanged.
4. Confirm `lastEdited` key remains `nicu_uac_uvc_state_ts` (round-trip from
   prior versions for users who already have data persisted).

After uac-uvc, sequence the remaining slices roughly in order of complexity:
gir, fortification, morphine, feeds, pert (pert last because it's the only
slice using a custom nested-merge — exercises the optional `merge` callback).
