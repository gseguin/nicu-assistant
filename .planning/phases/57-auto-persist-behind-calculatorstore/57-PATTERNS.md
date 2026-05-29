# Phase 57: Auto-Persist Behind CalculatorStore - Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 6 modified files (0 created)
**Analogs found:** 6 / 6 (every file is its own analog — this is a pure deletion/addition refactor)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/shell/calculator-store.svelte.ts` | service/state-singleton | event-driven (reactive effect) | itself — `init()` / `persist()` / `reset()` SSR guard pattern | exact |
| `src/lib/gir/GirInputs.svelte` | component | event-driven (delete only) | itself — lines 22–27 are the deletion target | exact |
| `src/lib/morphine/MorphineWeanInputs.svelte` | component | event-driven (delete only) | itself — lines 19–24 | exact |
| `src/lib/fortification/FortificationInputs.svelte` | component | event-driven (delete only) | itself — lines 132–137 | exact |
| `src/lib/feeds/FeedAdvanceInputs.svelte` | component | event-driven (delete only) | itself — lines 33–38 | exact |
| `src/lib/uac-uvc/UacUvcInputs.svelte` | component | event-driven (delete only) | itself — lines 26–31 | exact |

There are no new files and no new packages. Every analog is the file being modified.

---

## Pattern Assignments

### `src/lib/shell/calculator-store.svelte.ts` (service, event-driven addition)

**Analog:** itself — the existing constructor + `init()` / `persist()` SSR guard pattern.

**Existing constructor** (`calculator-store.svelte.ts` lines 28–39):
```typescript
constructor(options: CalculatorStoreOptions<T>) {
  this.#storageKey = options.storageKey;
  this.#defaults = options.defaults;
  this.#merge = options.merge;
  this.lastEdited = new LastEdited(`${options.storageKey}_ts`);
  this.current = $state<T>(options.defaults());
  // Eager init: child $effects mounted before the route's onMount can fire
  // persist() with default values and clobber the restored state. Running
  // here means .current already reflects localStorage by the time any
  // component reads it. Mirrors the per-slice state.svelte.ts pattern.
  this.init();
}
```

**SSR guard pattern to copy** (lines 43, 61, 76 — used identically in `init`, `persist`, `reset`):
```typescript
// init():
if (typeof localStorage === 'undefined') return;

// persist():
if (typeof localStorage !== 'undefined') { ... }

// reset():
if (typeof localStorage !== 'undefined') { ... }
```

**Exact addition — insert immediately after `this.init();` (after line 38, before the closing `}` of the constructor):**

```typescript
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
```

**Complete constructor after change** (`calculator-store.svelte.ts` lines 28–48, extended):
```typescript
constructor(options: CalculatorStoreOptions<T>) {
  this.#storageKey = options.storageKey;
  this.#defaults = options.defaults;
  this.#merge = options.merge;
  this.lastEdited = new LastEdited(`${options.storageKey}_ts`);
  this.current = $state<T>(options.defaults());
  // Eager init: child $effects mounted before the route's onMount can fire
  // persist() with default values and clobber the restored state. Running
  // here means .current already reflects localStorage by the time any
  // component reads it. Mirrors the per-slice state.svelte.ts pattern.
  this.init();
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

**Key rules from the analog's established patterns:**
- The `typeof localStorage !== 'undefined'` guard form (NOT `=== 'undefined'` with early return) matches `persist()` and `reset()` — use the positive form wrapping the block.
- `$effect.root()` return value is intentionally discarded (D-07). Do NOT assign it to a variable.
- The inner `$effect` body is a one-liner: `JSON.stringify(this.current); this.persist();` — identical to all 5 deleted per-component blocks.

---

### `src/lib/gir/GirInputs.svelte` (component, delete only)

**Analog:** itself.

**Exact lines to delete** (lines 22–27):
```svelte
	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(girState.current);
		girState.persist();
	});
```

**Line that STAYS** (line 15): `import { girState } from '$lib/gir/state.svelte.js';` — the singleton import remains because it is used for all `bind:value` attributes in the template.

**After deletion:** the `<script>` block goes from line 13 to line 32 with the `$derived` for `showDexAdvisory` (current line 29) immediately following the last import.

---

### `src/lib/morphine/MorphineWeanInputs.svelte` (component, delete only)

**Analog:** itself.

**Exact lines to delete** (lines 19–24):
```svelte
	// Persist on every change — duplicates the calculator's effect so the inputs work
	// independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(morphineState.current);
		morphineState.persist();
	});
```

**Line that STAYS** (line 13): `import { morphineState } from '$lib/morphine/state.svelte.js';`

---

### `src/lib/fortification/FortificationInputs.svelte` (component, delete only)

**Analog:** itself.

**Exact lines to delete** (lines 132–137):
```svelte
	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(fortificationState.current);
		fortificationState.persist();
	});
```

**Line that STAYS** (line 14): `import { fortificationState } from '$lib/fortification/state.svelte.js';`

**Caution:** FortificationInputs has MANY other `$effect` blocks (lines 34–66, 69–75, 112–130) that are NOT the deletion target. Delete only the comment+effect block at lines 132–137 — the last item before `</script>`. All string-bridge mirror effects and the auto-reset-on-formula-change effect remain untouched.

---

### `src/lib/feeds/FeedAdvanceInputs.svelte` (component, delete only)

**Analog:** itself.

**Exact lines to delete** (lines 33–38):
```svelte
	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(feedsState.current);
		feedsState.persist();
	});
```

**Line that STAYS** (line 20): `import { feedsState } from './state.svelte.js';`

---

### `src/lib/uac-uvc/UacUvcInputs.svelte` (component, delete only)

**Analog:** itself.

**Exact lines to delete** (lines 26–31):
```svelte
	// Persist on every change — duplicates the calculator's effect so the inputs
	// work independently if mounted in isolation (drawer-only rendering on mobile).
	$effect(() => {
		JSON.stringify(uacUvcState.current);
		uacUvcState.persist();
	});
```

**Line that STAYS** (line 20): `import { uacUvcState } from '$lib/uac-uvc/state.svelte.js';`

---

## Shared Patterns

### SSR Guard (apply to the new `$effect.root()` block in CalculatorStore)

**Source:** `src/lib/shell/calculator-store.svelte.ts` lines 61, 76 (persist + reset)
**Apply to:** The new `$effect.root()` call in the constructor

```typescript
// Pattern from persist() and reset() — use positive guard form wrapping the block:
if (typeof localStorage !== 'undefined') {
  // ... localStorage-dependent code
}
```

The `init()` method uses `if (typeof localStorage === 'undefined') return;` (early-return form). The constructor addition should use the wrapping form (matching `persist()` / `reset()`) since there is no early return needed.

### Silent try/catch (already present in persist(); do NOT duplicate)

**Source:** `src/lib/shell/calculator-store.svelte.ts` lines 62–66
```typescript
try {
  localStorage.setItem(this.#storageKey, JSON.stringify(this.current));
} catch {
  // Silent: private browsing mode or storage quota exceeded.
}
```

The new `$effect.root()` block calls `this.persist()`, which already wraps `setItem` in this try/catch. Do NOT add another try/catch around the `$effect.root()` call itself.

---

## Test Pattern (new tests in `src/lib/shell/calculator-store.test.ts`)

**Source:** `src/lib/shell/calculator-store.test.ts` (entire file — 10 existing tests)

**Established test-file conventions to copy:**
- `import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';` (line 8)
- `import { CalculatorStore } from './calculator-store.svelte.js';` (line 9)
- Reuse existing `type Shape`, `makeDefaults`, `KEY` constants (lines 11–13)
- `beforeEach(() => { localStorage.clear(); })` (lines 15–17)
- `afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); })` (lines 19–25)
- `vi.spyOn(Storage.prototype, 'setItem')` pattern used in line 130

**New `import` required** — add `tick` to the existing vitest import or add separately:
```typescript
import { tick } from 'svelte';
```

**New describe block to add** (after the existing 6 describe blocks, at the end of the file):

```typescript
describe('CalculatorStore — auto-persist (D-05)', () => {
  it('(a) mutating .current triggers auto-persist without calling persist() directly', async () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    // spy installed after construction to exclude the initial benign write (D-02)

    store.current.a = 99;
    await tick(); // flush the scheduled inner $effect

    expect(spy).toHaveBeenCalledWith(KEY, JSON.stringify({ a: 99, b: 'x' }));
  });

  it('(b) auto-persist fires without any component mounted — proves drawer-only-mount path', async () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    const spy = vi.spyOn(Storage.prototype, 'setItem');

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
    await tick(); // let initial benign-write effect fire

    store.current.a = 10;
    await tick();
    const stamp1 = store.lastEdited.current;
    expect(typeof stamp1).toBe('number');

    // Immediate second mutation — within the 60s STAMP_DEBOUNCE_MS window
    store.current.a = 11;
    await tick();
    const stamp2 = store.lastEdited.current;

    // stamp2 should equal stamp1: debounce suppressed the re-stamp
    expect(stamp2).toBe(stamp1);
  });
});
```

**Critical test idioms:**
- All three D-05 tests MUST be `async` — the inner `$effect` is a scheduled microtask, not synchronous.
- `await tick()` (from `svelte`) is the only correct flush idiom — `Promise.resolve()` alone does not drain the Svelte batch scheduler.
- Install the `setItem` spy AFTER `new CalculatorStore()` to exclude the initial benign write (D-02 first-fire). This is the simplest isolation strategy; `spy.mockClear()` post-construction is an equivalent alternative.
- Spy before construction captures the initial benign write — count will be N+1; use `.calls.at(-1)` or `mockClear()` to isolate.

---

## Mock Side-Effect Note (Pitfall 4)

**Files:** `src/lib/fortification/FortificationInputs.test.ts`, `src/lib/morphine/MorphineWeanInputs.test.ts`

Both test files `vi.mock('$lib/{calc}/state.svelte.js', ...)` with `persist: vi.fn()` in the mock factory. After Phase 57 deletes the `$effect` from those components, `persist: vi.fn()` becomes an **unused stub** — the deleted effect was the only component-level caller. Neither test file asserts that `persist()` was called, so no tests break. The mock factory line `persist: vi.fn()` can be left in place (it is harmless) or removed by the implementer as dead code cleanup. It is out of scope for Phase 57 (D-06: do not modify existing tests).

---

## Grep Verification Gates

After applying all changes, these two greps must produce the expected counts:

```bash
# Must return ZERO matches — all per-component effects deleted
grep -r "JSON.stringify.*State.current" src/lib/gir/GirInputs.svelte \
  src/lib/morphine/MorphineWeanInputs.svelte \
  src/lib/fortification/FortificationInputs.svelte \
  src/lib/feeds/FeedAdvanceInputs.svelte \
  src/lib/uac-uvc/UacUvcInputs.svelte

# Must return EXACTLY ONE match — the new in-class effect
grep "JSON.stringify(this.current)" src/lib/shell/calculator-store.svelte.ts
```

---

## No Analog Found

None. All 6 files are self-analogous: the file itself contains both the pattern to copy from (SSR guard, existing constructor structure, existing test conventions) and the target edit location.

---

## Metadata

**Analog search scope:** `src/lib/shell/`, `src/lib/gir/`, `src/lib/morphine/`, `src/lib/fortification/`, `src/lib/feeds/`, `src/lib/uac-uvc/`
**Files scanned:** 8 (calculator-store.svelte.ts, calculator-store.test.ts, GirInputs.svelte, MorphineWeanInputs.svelte, FortificationInputs.svelte, FeedAdvanceInputs.svelte, UacUvcInputs.svelte, plus CONTEXT.md and RESEARCH.md)
**Pattern extraction date:** 2026-05-29
