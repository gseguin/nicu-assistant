# Phase 57: Auto-Persist Behind CalculatorStore - Research

**Researched:** 2026-05-29
**Domain:** Svelte 5 `$effect.root()` in `.svelte.ts` class constructors; Vitest 4 async effect flushing; test isolation with module-scope singletons
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `$effect.root(() => $effect(() => { JSON.stringify(this.current); this.persist(); }))` in the constructor (or a private helper called from it). The inner `$effect` deeply subscribes to `this.current` via `JSON.stringify`; `this.persist()` is the existing method unchanged. Cleanup function returned by `$effect.root()` is intentionally discarded (singleton lives app lifetime).
- **D-02:** Install auto-persist AFTER `this.init()`. First-fire is a benign no-op write (identical bytes just read from localStorage). Acceptable: existing per-fragment effect already did this on mount.
- **D-03:** Drawer-only-mount preserved automatically — module-scope `new CalculatorStore<T>(...)` runs the constructor (and installs the root effect) at import time, before any component mounts. Both route and drawer mount import the same singleton.
- **D-04:** In each of the 5 `*Inputs.svelte`, delete the `$effect(() => { JSON.stringify(...State.current); ...State.persist(); });` block AND the immediately preceding "Persist on every change — duplicates …" comment. No other changes to those files.
- **D-05:** Add tests to `calculator-store.test.ts`: (a) constructor mutation triggers auto-persist, (b) drawer-mounted-alone path (unit-level proof store effect fires without a component), (c) 60s debounce still holds.
- **D-06:** Do NOT remove or edit existing tests. The 5 `*Inputs.svelte` files have no co-located tests of the deleted effect.
- **D-07:** `$effect.root()` cleanup function is discarded. Singleton lifetime = app lifetime; cleanup happens at browser close.
- **D-08:** Wrap `$effect.root()` in `typeof localStorage === 'undefined'` guard to skip SSR.

### Claude's Discretion

- Whether to extract auto-persist installer into a private `#installAutoPersist()` helper or keep it inline in the constructor — both work; helper is cleaner if it grows.
- Exact test framework idiom for drawer-mounted-alone path (unit-only vs. component mount) — D-05 lists both options.
- Whether to delete any analogous stale comment in `state.svelte.ts` singletons (none exists, but prune if found).

### Deferred Ideas (OUT OF SCOPE)

- Migrating `CalculatorStore` onto the `PersistentValue` seam — future milestone.
- Release v1.18.0 — Phase 58.
- Architecture review candidate 2 (config pass-throughs) — future milestone.
- ML_PER_OZ clinical constant — needs clinician sign-off.
- v1.15.1 SMOKE-01..10 real-iPhone gate — carries forward independently.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTO-01 | `CalculatorStore` owns auto-persist; `$effect(() => { JSON.stringify(state.current); state.persist() })` removed from all 5 `*Inputs.svelte` | D-01 mechanism verified correct; D-04 deletion scope confirmed |
| AUTO-02 | Inputs fragment mounted alone in mobile `InputDrawer` still persists on change; `lastEdited` 60s debounce + no effect re-entry preserved | D-03 module-import timing confirmed; re-entry safety proven by reactive dependency trace |
</phase_requirements>

---

## Summary

Phase 57 is a 6-file, zero-new-API, behavior-preserving refactor. Every locked decision in CONTEXT.md has been verified against the installed Svelte 5.55.4 runtime source and the project's Vitest 4.1.4 test suite.

The core mechanic — `$effect.root(() => $effect(() => { ... }))` in a `.svelte.ts` class constructor — is sound. `$effect.root` is compiled to `$.effect_root`, which calls `create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn)`. Because `ROOT_EFFECT` does not carry the `EFFECT` bit, the root callback runs **synchronously** during construction (not deferred). Inside that callback, the active effect context is set to the root effect, so the inner `$effect` (`user_effect`) passes `validate_effect` without a component context. The inner `$effect` is then scheduled as a microtask via Svelte's batch scheduler and runs after the first `tick()` / `flushSync()`.

Re-entry safety is verified by tracing reactive subscriptions: the auto-persist effect reads `this.current` (via `JSON.stringify`) but does NOT read `this.lastEdited.current`. Writing `this.lastEdited.current` inside `stamp()` therefore does not retrigger the outer effect. The 60s `STAMP_DEBOUNCE_MS` in `lastEdited.svelte.ts` is a second-layer defense.

All 448 existing tests pass on the current baseline. After Phase 57, they remain green — no existing test asserts on auto-persist call counts or localStorage state in a way that the new async effect would violate. The new test for D-05 must be async and use `await tick()` to flush the scheduled effect.

**Primary recommendation:** Implement exactly as specified in D-01 through D-08. One plan, one wave, one commit.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auto-persist on state change | State singleton (class constructor) | — | All 5 calculators share `CalculatorStore<T>`; moving the effect to the class eliminates 5 identical copies |
| Per-calculator state bindings | Browser / Client (component) | — | Input components bind to singleton state via `$lib/{calc}/state.svelte.ts` imports |
| localStorage read/write | `CalculatorStore.persist()` / `init()` / `reset()` | — | Already isolated in these three methods; Phase 57 does not change their implementation |
| Drawer-only-mount persistence | Module-import-time effect (D-03) | — | Module evaluation runs constructor once on first `import`, before any component mounts |
| 60s stamp debounce | `LastEdited.stamp()` in `lastEdited.svelte.ts` | — | Phase 56 migrated this; Phase 57 does not touch it |

---

## Standard Stack

No new packages. Phase 57 uses only what is already installed.

| Technology | Version (installed) | Role in Phase 57 |
|-----------|--------------------|--------------------|
| Svelte 5 | 5.55.4 | `$effect.root()` + `$effect()` runes in `.svelte.ts` |
| `@sveltejs/vite-plugin-svelte` | 7.0.0 | Compiles `.svelte.ts` via `svelte.compileModule()` |
| Vitest | 4.1.4 | Test runner; `tick()` / `flushSync()` for effect flushing |
| `@testing-library/svelte` | 5.3.1 | `fireEvent` (wrapped in `act()` → `tick()`) for component tests |

**Installation:** None required.

---

## Package Legitimacy Audit

Not applicable — Phase 57 installs no packages.

---

## Architecture Patterns

### System Architecture Diagram

```
Import time
  │
  ├─ src/lib/{calc}/state.svelte.ts  (module eval)
  │    └─ new CalculatorStore<T>(...)  ← constructor runs once
  │         ├─ this.current = $state<T>(defaults())
  │         ├─ this.init()   ← restores from localStorage
  │         └─ $effect.root(() =>
  │               $effect(() => {         ← scheduled async
  │                 JSON.stringify(this.current)   ← subscribes
  │                 this.persist()                  ← writes + stamp
  │               })
  │            )
  │
Runtime — user edits an input
  │
  ├─ *Inputs.svelte  bind:value → this.current.field = x
  │    └─ (no $effect — deleted)
  │
  ├─ Svelte scheduler detects this.current changed (DIRTY)
  │
  └─ Batch flushes (next microtask or flushSync)
       └─ auto-persist effect fires
            ├─ JSON.stringify(this.current)  [re-subscribes]
            └─ this.persist()
                 ├─ localStorage.setItem(key, JSON.stringify(this.current))
                 └─ this.lastEdited.stamp()
                      ├─ debounce check (< 60s? return early)
                      └─ this.lastEdited.current = now   [NOT subscribed by outer effect]
```

### Recommended File Structure

No new files. One file gains code, five lose code.

```
src/lib/shell/
└── calculator-store.svelte.ts   ← ADD ~5 lines (D-01 + D-08 guard)

src/lib/gir/GirInputs.svelte           ← DELETE ~5 lines (D-04)
src/lib/morphine/MorphineWeanInputs.svelte  ← DELETE ~5 lines (D-04)
src/lib/fortification/FortificationInputs.svelte  ← DELETE ~5 lines (D-04)
src/lib/feeds/FeedAdvanceInputs.svelte      ← DELETE ~5 lines (D-04)
src/lib/uac-uvc/UacUvcInputs.svelte        ← DELETE ~5 lines (D-04)
```

### Pattern 1: `$effect.root()` in a `.svelte.ts` class constructor

**What:** Install a persistent reactive effect from a class constructor in a `.svelte.ts` file, outside any component lifecycle.

**When to use:** A class instance (state singleton) needs to react to its own `$state` field without being tied to a component's lifecycle.

**How the Svelte 5 compiler handles it:** [VERIFIED: Svelte 5.55.4 source]

`$effect.root(fn)` compiles to `$.effect_root(fn)` (CallExpression.js:79). The runtime implementation calls `create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn)`. Since `ROOT_EFFECT` (value 64) does not have the `EFFECT` bit (value 4) set, `create_effect` runs the callback **synchronously** (update_effect path at line 138 of effects.js), not via the batch scheduler.

Inside the root effect callback, `active_effect` is set to the root effect. When the inner `$effect(fn2)` fires (`user_effect(fn2)`), `validate_effect` checks `active_effect !== null` — it passes. The `defer` check (`BRANCH_EFFECT` flag — value 32) is false for ROOT_EFFECT (64 & 32 = 0), so `create_user_effect(fn2)` is called immediately, which schedules `fn2` as a **microtask** (via `Batch.ensure().schedule(effect)`).

**Example (the exact D-01 incantation):** [ASSUMED — following D-01 prescription exactly]

```typescript
// Inside CalculatorStore<T> constructor, after this.init():
if (typeof localStorage !== 'undefined') {
  $effect.root(() => {
    $effect(() => {
      JSON.stringify(this.current);
      this.persist();
    });
  });
}
```

**Compiler requirement:** The file MUST have the `.svelte.ts` extension. `@sveltejs/vite-plugin-svelte` routes `.svelte.ts` files through `svelte.compileModule()` (not `svelte.compile()`), which enables rune syntax (`$state`, `$effect.root`, `$effect`) in TypeScript class contexts. This already works — `this.current = $state<T>(options.defaults())` in the constructor uses the same mechanism and is proven by all 448 passing tests.

**No component context required:** `$effect.root` does NOT call `validate_effect` (unlike bare `$effect`). It calls `create_effect` directly with `ROOT_EFFECT`. Module-scope class instantiation is a valid and documented use case — confirmed by Svelte official docs: `$effect.root` "creates a non-tracked scope that doesn't auto-cleanup" and "can be called outside components." [CITED: https://svelte.dev/docs/svelte/$effect]

### Pattern 2: Flushing effects in Vitest unit tests (no component)

**What:** Force pending Svelte effects to run synchronously in a non-component test.

**How it works:** [VERIFIED: Svelte 5.55.4 source, `tick()` implementation]

`tick()` (exported from `svelte`) does `await Promise.resolve(); flushSync()`. In non-async mode (no `async_mode_flag`), `flushSync()` drains all pending batches synchronously. This works entirely outside a component context — it flushes the global effect scheduler.

**Example (D-05 test idiom):**

```typescript
import { tick } from 'svelte';
import { CalculatorStore } from './calculator-store.svelte.js';

it('auto-persist fires on mutation without any component mounted', async () => {
  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  const store = new CalculatorStore<{ a: number }>({
    storageKey: 'test_auto',
    defaults: () => ({ a: 1 })
  });

  store.current.a = 42;
  await tick();  // flushes the auto-persist $effect

  const lastCall = setItemSpy.mock.calls.at(-1);
  expect(lastCall?.[0]).toBe('test_auto');
  expect(JSON.parse(lastCall?.[1] as string).a).toBe(42);
});
```

**Why unit-level is sufficient for D-05b:** After Phase 57, the auto-persist effect lives in `CalculatorStore`, NOT in any component. The drawer-only-mount claim is: "the singleton effect fires regardless of which component (if any) mounts the input bindings." A pure unit test that instantiates `CalculatorStore`, mutates `.current`, and asserts `localStorage.setItem` was called — without mounting any component — is a stronger proof of this claim than a component test would be, because it demonstrates the class's self-contained behavior at the mechanism level.

### Anti-Patterns to Avoid

- **Bare `$effect()` at class level (outside a root):** `validate_effect` throws `effect_orphan` if `active_effect === null`. Bare `$effect` must be nested inside `$effect.root()` when used outside a component. [VERIFIED: effects.js:54-59]
- **Storing and calling the `$effect.root()` cleanup function:** The cleanup fn calls `destroy_effect()`, which would stop the auto-persist permanently. Since the singleton lives the app lifetime, this is wrong — discard the return value (D-07).
- **Calling `$effect.root()` outside the `typeof localStorage === 'undefined'` guard:** In SSR (SvelteKit prerender), `typeof localStorage === 'undefined'` is true. The root effect itself is harmless in SSR (persist() no-ops), but it's consistent with the codebase's SSR guard convention and avoids any future edge case (D-08).
- **Testing auto-persist with synchronous assertions (no `await tick()`):** The inner `$effect` is scheduled as a microtask; it has not fired when the constructor returns. Synchronous assertions on `localStorage.setItem` call count will falsely show 0 calls.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flushing scheduled Svelte effects in tests | Custom microtask drain / `setTimeout` / `Promise.resolve()` | `await tick()` from `svelte` | `tick()` calls `flushSync()` which properly drains the Svelte batch scheduler; `Promise.resolve()` alone does not guarantee the batch has flushed |
| Root effect scope for class-hosted effects | Wrapping in a custom observable/proxy | `$effect.root(() => $effect(...))` | This is the standard Svelte 5 idiom; the compiler transforms it correctly in `.svelte.ts` |

---

## Q1: `$effect.root()` in a `.svelte.ts` class — verified correctness

**Answer: FULLY CORRECT. No preprocessor gotchas.** [VERIFIED: Svelte 5.55.4 source + existing codebase patterns]

The sequence:
1. `effect_root(fn)` calls `create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn)`.
2. Since ROOT_EFFECT has no EFFECT bit, the callback runs **synchronously** (`update_effect` path).
3. During callback execution, `active_effect` is the root effect node → inner `user_effect` passes `validate_effect`.
4. Inner `$effect` is scheduled as a microtask (EFFECT bit set → `Batch.ensure().schedule(effect)`).
5. `create_effect` returns the root effect node; `effect_root` wraps it in a `() => destroy_effect(effect)` cleanup closure which is then discarded (D-07).

**Module-scope instantiation is sufficient.** `const xxxState = new CalculatorStore<T>(...)` at module scope in `state.svelte.ts` runs the constructor exactly once at `import` time. No component context is needed. This is confirmed by the Svelte docs and by the fact that `this.current = $state<T>(...)` already works the same way in the existing code.

**No "can only be called inside an effect tree" error.** That restriction applies only to bare `$effect()`, not to `$effect.root()`. `$effect.root` is specifically designed for non-component use cases.

**Vitest/jsdom support:** The test environment already processes `.svelte.ts` runes (all 448 tests pass today, including the `$state`-in-constructor pattern). `$effect.root` is compiled to `$.effect_root` by the same pipeline. No special test harness is needed.

---

## Q2: Module-scope instantiation timing (D-03 drawer-only-mount)

**Answer: CONFIRMED. Constructor runs at import time, before any component mounts.** [VERIFIED: reading state.svelte.ts files in codebase]

All five `state.svelte.ts` files export a module-scope singleton:
```typescript
export const girState = new CalculatorStore<GirStateData>({
  storageKey: 'nicu_gir_state',
  defaults: defaultState
});
```

JavaScript module evaluation is eager and synchronous. When any file `import`s `girState`, the module evaluates and the constructor runs immediately — before any Svelte component function executes. Both the calculator route (`+page.svelte` imports `girState`) and the drawer-only mount (`GirInputs.svelte` imports `girState`) import the **same singleton**. The auto-persist root effect is installed once when the module is first imported.

The drawer-only mount scenario (mobile `InputDrawer` showing `<GirInputs>` without the full calculator route) works because `GirInputs.svelte` imports `girState` at line 15 (`import { girState } from '$lib/gir/state.svelte.js'`), which triggers module evaluation and installs the root effect. The component does not need to call any lifecycle hook to activate persistence.

---

## Q3: lastEdited 60s debounce + re-entry safety

**Answer: CONFIRMED SAFE. No re-entry is possible.** [VERIFIED: reading `lastEdited.svelte.ts` + `calculator-store.svelte.ts`]

The auto-persist effect body:
```
JSON.stringify(this.current);   ← reads this.current → SUBSCRIBED
this.persist();                 ← calls localStorage.setItem + this.lastEdited.stamp()
```

Inside `persist()`:
- `localStorage.setItem(this.#storageKey, JSON.stringify(this.current))` — reads `this.current` again (already tracked)
- `this.lastEdited.stamp()` — **writes** `this.lastEdited.current = now`

The effect subscribes to `this.current` ONLY. It does NOT read `this.lastEdited.current` anywhere in the effect body. Svelte's reactivity only re-runs an effect when a signal it **read** (subscribed to) is mutated. Writing `this.lastEdited.current` (a different signal) does not retrigger the outer effect.

`STAMP_DEBOUNCE_MS = 60_000` in `lastEdited.svelte.ts` is a defense-in-depth guard: `stamp()` returns early if `now - this.current < 60_000`. This prevents any hypothetical future code path from accidentally creating infinite stamp → read → retrigger cycles.

---

## Q4: First-fire ordering (D-02)

**Answer: BENIGN. Existing behavior on first load is preserved exactly.** [VERIFIED: tracing `LastEdited.stamp()` in `lastEdited.svelte.ts`]

On first page load (no stored data):
1. Constructor: `this.init()` — localStorage empty → `this.current` stays at defaults.
2. Constructor: root effect installed, inner `$effect` **scheduled** (not yet fired).
3. First `tick()` / microtask drain: inner effect fires → `JSON.stringify(defaults)` read → `persist()` called → `localStorage.setItem(key, JSON.stringify(defaults))` writes defaults → `lastEdited.stamp()`.
4. `stamp()`: `this.lastEdited.current === null` → `if (null !== null && ...)` is false → `current = now; pv.write(now)` — stamps on first run.

On page reload (recent edit, stored data within 60s):
1. Constructor: `this.init()` restores `this.current` from localStorage. `this.lastEdited` constructor reads `_ts` key → `this.lastEdited.current = storedTimestamp`.
2. Inner effect fires on first tick → `persist()` → `setItem` (same bytes, no change) → `stamp()`.
3. `stamp()`: `this.lastEdited.current !== null` AND `now - storedTimestamp < 60_000` → **returns early** (no re-stamp).

ROADMAP SC-3 is preserved: rapid effect passes during a single render do not re-stamp the 60s debounce window. The re-stamp on a page reload within the debounce window is correctly suppressed.

**Observable consequence of first-fire benign write:** On fresh install, `_ts` gets stamped immediately on page load (even before a user edits anything). This was also true of the existing per-fragment `$effect` pattern (it fired on component mount). Behavior is identical.

---

## Q5: Testing the drawer-mounted-alone path (D-05b)

**Recommendation: Pure unit test (no component).** [ASSUMED — based on mechanism analysis]

The recommended approach is a pure unit test:
```typescript
it('auto-persist fires without any component mounted — proves drawer-only-mount path', async () => {
  const store = new CalculatorStore<{ x: number }>({
    storageKey: 'drawer_test',
    defaults: () => ({ x: 0 })
  });
  const spy = vi.spyOn(Storage.prototype, 'setItem');

  store.current.x = 7;
  await tick();

  expect(spy).toHaveBeenCalledWith('drawer_test', JSON.stringify({ x: 7 }));
});
```

**Why unit-level is correct and sufficient:** After Phase 57, the auto-persist mechanism lives in `CalculatorStore`, not in any `*Inputs.svelte` component. The drawer-only-mount claim is precisely that persistence works WITHOUT a component hosting the effect. A test that instantiates `CalculatorStore` and mutates `.current` without mounting any component directly tests this claim. A component test would prove that `GirInputs.svelte` renders correctly, but it would not add confidence about the mechanism — the effect is in the class, not the component.

A component test mounting only `<GirInputs />` (without the route shell) would be reasonable to add as a **separate** regression test for the overall drawer-mount integration, but it is NOT required for D-05b. One unit test proves the class-level wiring.

**Where to add:** `src/lib/shell/calculator-store.test.ts` — the existing home for `CalculatorStore` unit tests.

**Note on `vi.spyOn` ordering:** Spy on `setItem` BEFORE calling `store.current.x = 7`, so the spy captures both the initial construction write (benign default-state persist) and the mutation-triggered persist. Alternatively, clear the spy calls after construction and before mutation. The example above installs the spy after construction, which means it captures only the mutation-triggered call — this is the cleanest approach.

---

## Q6: Cleanup / leak concerns

**Answer: NO LEAK CONCERNS in any scenario.** [VERIFIED: Svelte 5.55.4 effects.js + test framework behavior]

**(a) Vitest module isolation (`vi.resetModules()`):**

When `vi.resetModules()` is called, the module cache is cleared. The old `CalculatorStore` class (and any instances created from it) becomes unreachable. The old root effect subscribes to the old `this.current` signal (from the old module's `$state`). Since the old `this.current` is unreachable (no code holds a reference to the old instance after `resetModules`), the old signal is never mutated → old effect never fires → no write to localStorage. The old effect is GC'd along with the old instance.

The existing test `'round-trips via vi.resetModules() + dynamic import'` (calculator-store.test.ts:54) creates two instances across two module resets. After Phase 57, each creation installs a root effect. The first instance's effect may fire once (the initial benign write) before being GC'd; this writes the default state to localStorage and is cleaned up by `beforeEach(localStorage.clear())`. No test pollution.

**(b) Vite HMR:**

HMR replaces modules by re-evaluating them. A new `CalculatorStore` class is created; any `state.svelte.ts` module that imports it is also re-evaluated, creating a new singleton instance with a new root effect. The old module's root effect (from the discarded instance) is eventually GC'd when no references remain. There is no "double effect" scenario because HMR replaces the module reference, not instances. The old effect never fires after module replacement (old `this.current` is orphaned). In development, this means on HMR, the state is re-initialized from localStorage — same as a page reload. No leak.

**(c) Production browser session:**

A singleton that lives the app lifetime is the correct scope for a root effect without cleanup. The browser's JS context is destroyed on navigation away / tab close, which implicitly disposes all effects. No leak.

---

## Q7: Pitfalls

### Pitfall 1: Testing without `await tick()` — assertions always see 0 calls

**What goes wrong:** A synchronous test instantiates `CalculatorStore`, mutates `.current`, then asserts `localStorage.setItem` was called. The spy shows 0 calls (or only the initial benign write, not the mutation-triggered write).

**Why it happens:** The inner `$effect` is scheduled as a microtask via `Batch.ensure().schedule()`. It has not fired when the synchronous test body completes.

**How to avoid:** All D-05 tests MUST be `async` and include `await tick()` after the mutation. `tick()` calls `flushSync()` internally, which drains the batch synchronously.

**Warning signs:** `expect(spy).toHaveBeenCalledWith(...)` fails with 0 calls even though state was mutated.

### Pitfall 2: Spy installed before construction captures initial benign write

**What goes wrong:** `vi.spyOn(Storage.prototype, 'setItem')` is installed before `new CalculatorStore()`. The spy captures the initial effect fire (default state persisted after first `tick()`). Test asserts the spy was called with mutation value but the spy was called twice — could confuse `toHaveBeenCalledWith` vs `toHaveBeenLastCalledWith`.

**Why it happens:** The initial auto-persist effect fires after the first `tick()` even with default (unchanged) state. This is the D-02 "benign no-op write."

**How to avoid:** Install the spy AFTER construction (or call `spy.mockClear()` after construction and before the mutation). The recommended test pattern installs the spy after construction.

### Pitfall 3: `.svelte.ts` vs `.ts` extension — runes don't compile in plain `.ts`

**What goes wrong:** If `calculator-store.svelte.ts` were renamed to `calculator-store.ts`, `$effect.root` and `$effect` would NOT be recognized by the vite plugin and would throw `ReferenceError: $effect is not defined` at runtime.

**Why it happens:** `@sveltejs/vite-plugin-svelte`'s `compile-module` plugin only processes files matching the `.svelte.ts` pattern. Plain `.ts` files are handled by esbuild/TypeScript directly — no Svelte rune transformation.

**How to avoid:** The file is already named `calculator-store.svelte.ts`. Don't rename it. This pitfall is only relevant if someone tries to move the class to a plain `.ts` file.

### Pitfall 4: Existing `FortificationInputs.test.ts` / `MorphineWeanInputs.test.ts` mock pattern — no breakage

**What goes wrong (concern):** These tests `vi.mock('$lib/{calc}/state.svelte.js', ...)` with `persist: vi.fn()`. After Phase 57 deletes the `$effect` from the component, the mock's `persist` is never called by the component. Tests that previously asserted `persist` was called would fail.

**Why this is NOT a problem:** Neither `FortificationInputs.test.ts` nor `MorphineWeanInputs.test.ts` asserts that `persist()` was called. The mocks exist only to prevent real localStorage writes during component rendering tests. The deleted `$effect` was the only component-level persist caller — its deletion means the mock's `persist: vi.fn()` becomes an unused stub. Tests remain green.

### Pitfall 5: `vi.spyOn(Storage.prototype, 'setItem')` active at effect-fire time

**What goes wrong:** The existing test `'localStorage.setItem throwing during persist() is silent'` spies on `setItem` to throw. After Phase 57, the auto-persist effect fires asynchronously after the synchronous test body. If the effect fires while the spy is still throwing (i.e., before `afterEach` restores mocks), an unhandled error could escape.

**Why this is NOT a problem:** The auto-persist effect calls `persist()`, which wraps `setItem` in a `try/catch` — the throw is silently caught. `stamp()` runs outside the try/catch (by design, proven in Phase 56). The effect fires, catches the throw, updates `lastEdited.current` — identical to the existing behavior. The test's synchronous assertions on `lastEdited.current` complete before the effect fires (no await in the test). `afterEach` restores the spy before microtasks drain. No breakage.

---

## Common Pitfalls (summary table)

### Pitfall Summary

| # | Pitfall | Impact | Mitigation |
|---|---------|--------|------------|
| P1 | Sync assertions after mutation (no `await tick()`) | New D-05 test silently passes with 0 calls | All auto-persist tests MUST be async + `await tick()` |
| P2 | Spy before construction captures benign initial write | Spy call count is N+1 instead of N | Install spy after construction, or `spy.mockClear()` post-construction |
| P3 | Renaming `.svelte.ts` to `.ts` | Runes fail to compile | Don't rename; file is already `.svelte.ts` |
| P4 | Mock's `persist: vi.fn()` no longer called by component | Tests that assert persist was called would fail | Neither test asserts this; no action needed |
| P5 | setItem spy throws, async effect fires with spy active | Unhandled error escapes | persist() wraps setItem in try/catch — already handled |

---

## Code Examples

### Exact constructor change (D-01 + D-08)

```typescript
// src/lib/shell/calculator-store.svelte.ts
// ADD after this.init():
if (typeof localStorage !== 'undefined') {
  $effect.root(() => {
    $effect(() => {
      JSON.stringify(this.current);
      this.persist();
    });
  });
}
```

The complete constructor becomes:
```typescript
constructor(options: CalculatorStoreOptions<T>) {
  this.#storageKey = options.storageKey;
  this.#defaults = options.defaults;
  this.#merge = options.merge;
  this.lastEdited = new LastEdited(`${options.storageKey}_ts`);
  this.current = $state<T>(options.defaults());
  this.init();  // restore from localStorage FIRST (D-02)
  // Auto-persist: fires on every mutation of this.current.
  // $effect.root() required because CalculatorStore is a class, not a component.
  // SSR guard: skip on server (no localStorage, would create a phantom root effect).
  if (typeof localStorage !== 'undefined') {
    $effect.root(() => {
      $effect(() => {
        JSON.stringify(this.current);
        this.persist();
      });
    });
  }
}
```

### Exact deletion per *Inputs.svelte (D-04)

Delete these lines (modulo state name) from each of the 5 files:

```svelte
// Persist on every change — duplicates the calculator's effect so the inputs
// work independently if mounted in isolation (drawer-only rendering on mobile).
$effect(() => {
    JSON.stringify(girState.current);
    girState.persist();
});
```

The `import { girState } from '$lib/gir/state.svelte.js'` line STAYS (used for input bindings).

### New tests for D-05 (in `calculator-store.test.ts`)

```typescript
import { tick } from 'svelte';

describe('CalculatorStore — auto-persist (D-05)', () => {
  it('(a) mutating .current triggers auto-persist without calling persist() directly', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    spy.mockClear(); // discard the initial benign write from first effect fire

    store.current.a = 99;
    await tick();

    expect(spy).toHaveBeenCalledWith(KEY, JSON.stringify({ a: 99, b: 'x' }));
  });

  it('(b) auto-persist fires without any component mounted — drawer-only-mount path', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    // No render() call — no component is mounted. Proves the class-level effect.
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    spy.mockClear();

    store.current.b = 'drawer';
    await tick();

    const lastCall = spy.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(KEY);
    expect(JSON.parse(lastCall?.[1] as string).b).toBe('drawer');
  });

  it('(c) 60s debounce: rapid mutations do not re-stamp lastEdited within the window', async () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    await tick(); // let initial effect fire

    store.current.a = 10;
    await tick();
    const stamp1 = store.lastEdited.current;
    expect(typeof stamp1).toBe('number');

    // Immediate second mutation — within 60s debounce window
    store.current.a = 11;
    await tick();
    const stamp2 = store.lastEdited.current;

    // stamp2 should equal stamp1 (debounce skipped the second stamp)
    expect(stamp2).toBe(stamp1);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-fragment `$effect` in 5 `*Inputs.svelte` files | Single `$effect.root()` in `CalculatorStore` constructor | Phase 57 | Eliminates 5 identical copies; auto-persist is a class-level concern not a component concern |
| `$effect` required component context | `$effect.root()` enables class-hosted effects in `.svelte.ts` | Svelte 5 (current) | Singleton classes can own their own reactive behavior |

**Current state of related files:**
- `lastEdited.svelte.ts` — already seam-backed (Phase 56). `STAMP_DEBOUNCE_MS = 60_000` intact. [VERIFIED]
- `persistent-value.ts` — seam exists but `CalculatorStore` does NOT migrate onto it in Phase 57 (explicitly out of scope). [VERIFIED: CONTEXT.md domain note]
- `calculator-store.test.ts` — 10 tests, all passing. No test asserts on auto-persist call counts. [VERIFIED: running `pnpm test:run` — 448/448 green]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact code pattern `if (typeof localStorage !== 'undefined') { $effect.root(() => { $effect(() => { JSON.stringify(this.current); this.persist(); }); }); }` compiles and runs correctly in this project's exact toolchain | Q1 / Code Examples | Low — mechanism verified from Svelte 5.55.4 source; existing `$state`-in-constructor proves the `.svelte.ts` compile path |
| A2 | `vi.spyOn(Storage.prototype, 'setItem').mockClear()` after construction correctly isolates the initial benign write from the mutation-triggered write | Q5 / D-05 test code | Low — standard Vitest spy API; if `mockClear` fails, use `spy.mock.calls.at(-1)` which is stable regardless |
| A3 | Tests (c) for 60s debounce: two mutations within the same test are within the debounce window | D-05c test code | Low — debounce is 60s; test runs in milliseconds |

**If this table is empty for production-critical claims:** All core claims are VERIFIED from source code. The three ASSUMED items are test implementation details with negligible risk.

---

## Open Questions

1. **Helper vs. inline in constructor**
   - What we know: Both work. D-07 says cleanup is intentionally discarded.
   - What's unclear: Whether a private `#installAutoPersist()` helper improves readability enough to be worth it.
   - Recommendation: Keep inline for minimal diff. If the phase adds no other constructor complexity, inline is fine. If Claude's discretion leads to adding other constructor helpers, extract it.

2. **`spy.mockClear()` vs `spy.mock.calls.at(-1)` in D-05 tests**
   - What we know: The initial benign write fires after the first `tick()`. If the spy is installed before construction, `mockClear()` after construction is the cleanest way to isolate.
   - What's unclear: Whether the initial effect fires in the same `tick()` as the mutation-triggered effect when both are pending simultaneously.
   - Recommendation: Use `spy.mockClear()` after construction (before mutation) to eliminate ambiguity. Alternatively, install the spy after construction.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 57 is a code-only refactor. No external tools, services, CLIs, runtimes, databases, or package managers beyond what is already installed and verified (node 25.x, pnpm 10.x, Svelte 5.55.4, Vitest 4.1.4). All 448 existing tests pass on the current environment.

---

## Validation Architecture

`nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is omitted per the skip condition.

---

## Security Domain

Phase 57 adds no new attack surface. The `$effect.root()` call in the constructor runs only when `typeof localStorage !== 'undefined'` (D-08 guard). No new storage keys, no new network calls, no new inputs. Security domain: NOT APPLICABLE.

---

## Sources

### Primary (HIGH confidence — verified from installed source)
- Svelte 5.55.4 `node_modules/svelte/src/internal/client/reactivity/effects.js` — `effect_root`, `user_effect`, `validate_effect`, `create_effect` implementations
- Svelte 5.55.4 `node_modules/svelte/src/internal/client/constants.js` — flag values (ROOT_EFFECT = 64, EFFECT = 4, BRANCH_EFFECT = 32)
- Svelte 5.55.4 `node_modules/svelte/src/compiler/phases/2-analyze/visitors/CallExpression.js` — `$effect.root` analysis: only checks argument count, no component-context restriction
- Svelte 5.55.4 `node_modules/svelte/src/compiler/phases/3-transform/client/visitors/CallExpression.js` — `$effect.root` → `$.effect_root(...)` compilation
- `node_modules/@sveltejs/vite-plugin-svelte/src/plugins/compile-module.js` — `.svelte.ts` files use `svelte.compileModule()`
- `src/lib/shell/calculator-store.svelte.ts` — class structure, method signatures, SSR guard pattern
- `src/lib/shared/lastEdited.svelte.ts` — `STAMP_DEBOUNCE_MS = 60_000`, `stamp()` debounce logic
- `src/lib/shell/calculator-store.test.ts` — existing test inventory (10 tests, no auto-persist assertions)
- `pnpm test:run` result — 448/448 tests green on current baseline

### Secondary (MEDIUM confidence — official documentation)
- Svelte official docs, `$effect.root` page [CITED: https://svelte.dev/docs/svelte/$effect] — confirms: creates non-tracked scope, can be called outside components, returns cleanup function
- `node_modules/svelte` package.json — version 5.55.4 confirmed

---

## Metadata

**Confidence breakdown:**
- `$effect.root` correctness in class constructor: HIGH — verified from Svelte 5.55.4 source
- Module-scope instantiation timing: HIGH — confirmed from codebase reading
- Re-entry safety: HIGH — proven by reactive dependency trace
- First-fire ordering: HIGH — traced through `lastEdited.stamp()` debounce
- Test idiom for D-05: HIGH — confirmed `tick()` calls `flushSync()`; async pattern is established
- Cleanup/leak concerns: HIGH — verified GC behavior; no active references after module reset
- Existing test compatibility: HIGH — verified no test asserts on auto-persist call counts

**Research date:** 2026-05-29
**Valid until:** Stable — Svelte 5 runtime internals are unlikely to change in ways that affect `$effect.root` semantics within the 30-day window.
