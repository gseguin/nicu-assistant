# Phase 55: Persistence Seam - Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 2 (both new)
**Analogs found:** 2 / 2

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/lib/shared/persistent-value.ts` | utility (storage seam) | request-response (read/write/remove) | `src/lib/shell/calculator-store.svelte.ts` | role-match (guard + codec pattern); `src/lib/shared/favorites.svelte.ts` for recover hook shape |
| `src/lib/shared/persistent-value.test.ts` | test | — | `src/lib/shell/calculator-store.test.ts` | exact (SSR stub + afterEach ordering); `src/lib/shared/favorites.test.ts` for spyOn and recovery fixture style |

---

## Pattern Assignments

### `src/lib/shared/persistent-value.ts` (utility, request-response)

**Primary analog:** `src/lib/shell/calculator-store.svelte.ts`
**Secondary analog:** `src/lib/shared/favorites.svelte.ts` (recover hook shape)

---

#### Imports pattern

The seam has **no imports** — it uses the `localStorage` global directly and uses no external modules. This matches the zero-import style of `src/lib/shared/theme.svelte.ts` (line 1 is a comment, no imports) and the inline-guard style throughout the codebase. The seam exports only types and the factory function.

```typescript
// NO imports. Pure TypeScript module.
// Exports: Codec<T>, PersistentValueOptions<T>, PersistentValue<T>, createPersistentValue,
//          jsonCodec, rawStringCodec
```

---

#### SSR guard pattern — copy verbatim from `calculator-store.svelte.ts` lines 42-56, 60-70, 74-84

The guard shape is identical on every path. Note the `init()` guard uses `=== 'undefined'` (early return) while `persist()` and `reset()` use `!== 'undefined'` (positive check wrapping the whole body). Either form is acceptable; the seam should use the early-return form (`=== 'undefined'`) consistently for all three methods — this is the cleaner shape for a dedicated seam.

```typescript
// src/lib/shell/calculator-store.svelte.ts lines 42-56 — init() guard form
init(): void {
  if (typeof localStorage === 'undefined') return;    // ← copy this guard verbatim
  try {
    const stored = localStorage.getItem(this.#storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<T>;
      // ...
    }
  } catch {
    // Silent: invalid JSON, security error, or private browsing mode — fall back to defaults.
  }
}

// src/lib/shell/calculator-store.svelte.ts lines 59-71 — persist() guard form
persist(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(this.#storageKey, JSON.stringify(this.current));
    } catch {
      // Silent: private browsing mode or storage quota exceeded.
    }
  }
  // NOTE: stamp() is intentionally OUTSIDE try/catch — this is adapter concern, not seam concern
}

// src/lib/shell/calculator-store.svelte.ts lines 73-84 — reset() guard form
reset(): void {
  // ...
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(this.#storageKey);
    } catch {
      // Silent: private browsing mode or security error.
    }
  }
}
```

**For the seam**, standardize all three paths to the early-return form:

```typescript
read(): T {
  if (typeof localStorage === 'undefined') return opts.defaultValue;
  try { /* ... */ } catch { return opts.defaultValue; }
}

write(value: T): void {
  if (typeof localStorage === 'undefined') return;
  try { /* ... */ } catch { /* silent */ }
}

remove(): void {
  if (typeof localStorage === 'undefined') return;
  try { /* ... */ } catch { /* silent */ }
}
```

---

#### Recover hook signature — copy from `favorites.svelte.ts` lines 36-59

The seam's `recover?: (raw: string | null) => T` is a direct generalization of the existing `recover(raw: string | null): CalculatorId[]` function. The hook must own the entire read path when present (replaces deserialize + fallback).

```typescript
// src/lib/shared/favorites.svelte.ts lines 36-59 — the canonical hook shape
function recover(raw: string | null): CalculatorId[] {
  if (raw === null) return defaultIds();   // (1) null → defaults
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);              // (2) parse-throw → defaults
  } catch {
    return defaultIds();
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as StoredShape).v !== SCHEMA_VERSION ||
    !Array.isArray((parsed as StoredShape).ids)
  ) {
    return defaultIds();                   // (3) shape check → defaults
  }
  const valid = validIds();
  const filtered = (parsed as StoredShape).ids
    .filter((id): id is string => typeof id === 'string' && valid.has(id))
    .slice(0, FAVORITES_MAX);              // (4+5) filter + cap
  if (filtered.length === 0) return defaultIds(); // (6) empty → defaults
  return filtered as CalculatorId[];
}
```

**In the seam:** when `opts.recover` is present, call `opts.recover(raw)` and return the result directly. The outer `try/catch` in `read()` provides last-resort fallback if the hook itself throws.

---

#### Object-factory module style — copy from `favorites.svelte.ts` lines 75-125

The four adapters in `src/lib/shared/` all use the closure-object style (module-scope private variables + exported object literal with methods). The seam factory returns `{ read, write, remove }` — same style, no `class`, no `this`.

```typescript
// src/lib/shared/favorites.svelte.ts lines 75-125 — closure-object style
export const favorites = {
  get current(): readonly CalculatorId[] { return _ids; },
  // ...
  init(): void { /* reads localStorage, calls recover(), sets _ids */ }
};
```

The seam's factory is the same pattern without module-scope state (it captures everything in the closure):

```typescript
export function createPersistentValue<T>(opts: PersistentValueOptions<T>): PersistentValue<T> {
  const codec: Codec<T> = opts.codec ?? jsonCodec<T>();
  return {
    read(): T { /* ... */ },
    write(value: T): void { /* ... */ },
    remove(): void { /* ... */ }
  };
}
```

---

#### JSON codec pattern — copy from `calculator-store.svelte.ts` lines 47 and 63

```typescript
// src/lib/shell/calculator-store.svelte.ts line 47 — JSON parse in try block
const parsed = JSON.parse(stored) as Partial<T>;

// src/lib/shell/calculator-store.svelte.ts line 63 — JSON stringify in try block
localStorage.setItem(this.#storageKey, JSON.stringify(this.current));
```

The seam wraps both in a `Codec<T>` interface so the raw-string adapters (theme, disclaimer, lastEdited) can pass identity functions:

```typescript
export const rawStringCodec: Codec<string> = {
  serialize: (v) => v,
  deserialize: (v) => v
};
```

---

#### Silent-comment style — copy from `calculator-store.svelte.ts` and `favorites.svelte.ts`

All three analogs use the same silent-failure comment pattern. Copy exactly:

```typescript
// From calculator-store.svelte.ts line 55:
// Silent: invalid JSON, security error, or private browsing mode — fall back to defaults.

// From calculator-store.svelte.ts line 65:
// Silent: private browsing mode or storage quota exceeded.

// From calculator-store.svelte.ts line 82:
// Silent: private browsing mode or security error.

// From favorites.svelte.ts line 66:
// Silent: private browsing mode or storage quota exceeded
```

---

### `src/lib/shared/persistent-value.test.ts` (test)

**Primary analog:** `src/lib/shell/calculator-store.test.ts`
**Secondary analog:** `src/lib/shared/favorites.test.ts`

---

#### Import block — copy from `calculator-store.test.ts` lines 8-9

```typescript
// src/lib/shell/calculator-store.test.ts lines 8-9
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { CalculatorStore } from './calculator-store.svelte.js';
```

For the seam test:

```typescript
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createPersistentValue, jsonCodec, rawStringCodec } from './persistent-value.js';
```

Note: `.js` extension in imports (not `.ts`) is the project convention for SvelteKit module resolution — confirmed by both analog files.

---

#### `beforeEach` / `afterEach` setup — copy from `calculator-store.test.ts` lines 15-25

**Critical ordering:** `vi.unstubAllGlobals()` MUST run BEFORE `localStorage.clear()`. If a test stubs `localStorage` as `undefined`, calling `.clear()` before unstubbing throws TypeError.

```typescript
// src/lib/shell/calculator-store.test.ts lines 15-25 — COPY THIS ORDERING EXACTLY
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  // Restore stubbed globals BEFORE touching localStorage — the SSR test stubs
  // `localStorage` with `undefined`, so calling `.clear()` first would throw.
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});
```

---

#### SSR guard test — copy from `calculator-store.test.ts` lines 175-188

```typescript
// src/lib/shell/calculator-store.test.ts lines 175-188 — vi.stubGlobal pattern
describe('CalculatorStore — SSR safety', () => {
  it('init() does not throw when localStorage is undefined and current stays at defaults', () => {
    vi.stubGlobal('localStorage', undefined);
    let store: CalculatorStore<Shape> | undefined;
    expect(() => {
      store = new CalculatorStore<Shape>({
        storageKey: KEY,
        defaults: makeDefaults
      });
    }).not.toThrow();
    expect(() => store!.init()).not.toThrow();
    expect(store!.current).toEqual({ a: 1, b: 'x' });
  });
});
```

For the seam, the shape is simpler (no constructor side-effects, no `!` non-null assertion needed):

```typescript
it('read() returns defaultValue when localStorage is undefined (SSR guard)', () => {
  vi.stubGlobal('localStorage', undefined);
  const pv = createPersistentValue({ key: 'test', defaultValue: 'fallback', codec: rawStringCodec });
  expect(() => pv.read()).not.toThrow();
  expect(pv.read()).toBe('fallback');
});

it('write() is a silent no-op when localStorage is undefined', () => {
  vi.stubGlobal('localStorage', undefined);
  const pv = createPersistentValue({ key: 'test', defaultValue: 'x', codec: rawStringCodec });
  expect(() => pv.write('y')).not.toThrow();
});

it('remove() is a silent no-op when localStorage is undefined', () => {
  vi.stubGlobal('localStorage', undefined);
  const pv = createPersistentValue({ key: 'test', defaultValue: 'x', codec: rawStringCodec });
  expect(() => pv.remove()).not.toThrow();
});
```

---

#### `setItem` throw test — copy from `calculator-store.test.ts` lines 125-137 and `favorites.test.ts` lines 185-193

```typescript
// src/lib/shell/calculator-store.test.ts lines 128-131 — setItem spy pattern
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
  throw new Error('quota');
});
// ...
expect(() => store.persist()).not.toThrow();

// src/lib/shared/favorites.test.ts lines 186-193 — same pattern
const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
  throw new Error('quota exceeded');
});
favorites.toggle('formula');
expect(favorites.has('formula')).toBe(false); // state mutation succeeded
spy.mockRestore();
```

For the seam:

```typescript
it('write() is silent when setItem throws (quota / private mode)', () => {
  const pv = createPersistentValue({ key: 'test', defaultValue: 0 });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('QuotaExceededError');
  });
  expect(() => pv.write(42)).not.toThrow();
});
```

---

#### `getItem` throw test — copy from `favorites.test.ts` lines 175-183

```typescript
// src/lib/shared/favorites.test.ts lines 175-183
it('T-18 init: localStorage.getItem throws → falls back to defaults silently', async () => {
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('private browsing');
  });
  const { favorites } = await import('./favorites.svelte.js');
  favorites.init();
  expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
  spy.mockRestore();
});
```

For the seam (no dynamic import needed — plain `.ts` has no module-scope `$state`):

```typescript
it('read() returns defaultValue when getItem throws (security error)', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('private browsing');
  });
  const pv = createPersistentValue({ key: 'test', defaultValue: 99 });
  expect(pv.read()).toBe(99);
});
```

---

#### Invalid JSON / parse-failure test — copy from `calculator-store.test.ts` lines 104-112 and `favorites.test.ts` lines 36-40

```typescript
// src/lib/shell/calculator-store.test.ts lines 104-112
it('invalid JSON in storage falls back silently to defaults', () => {
  localStorage.setItem(KEY, '{not json');
  const store = new CalculatorStore<Shape>({ storageKey: KEY, defaults: makeDefaults });
  expect(store.current).toEqual({ a: 1, b: 'x' });
});

// src/lib/shared/favorites.test.ts lines 36-40
it('T-03 recovery: invalid JSON → defaults', async () => {
  localStorage.setItem(STORAGE_KEY, '{malformed');
  const { favorites } = await import('./favorites.svelte.js');
  favorites.init();
  expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
});
```

For the seam (no dynamic import, direct `localStorage.setItem` before the call):

```typescript
it('read() returns defaultValue when stored value is invalid JSON (SEAM-02)', () => {
  const pv = createPersistentValue({ key: 'test', defaultValue: { a: 1 } });
  localStorage.setItem('test', '{malformed json');
  expect(pv.read()).toEqual({ a: 1 });
});
```

---

#### No `vi.resetModules()` + dynamic import needed

Unlike `favorites.test.ts` which requires `vi.resetModules()` + dynamic import to get a fresh module-scope `$state` per test, `persistent-value.ts` is a plain `.ts` with no top-level state. Each call to `createPersistentValue()` creates a fresh closure. Use static imports throughout:

```typescript
// favorites.test.ts pattern — DO NOT use for persistent-value.test.ts
beforeEach(() => {
  localStorage.clear();
  vi.resetModules(); // ← NOT needed for persistent-value.ts
});
const { favorites } = await import('./favorites.svelte.js'); // ← NOT needed

// persistent-value.test.ts — use static import instead
import { createPersistentValue, rawStringCodec } from './persistent-value.js';
// createPersistentValue() each time gives a fresh closure — no module reset needed
```

---

#### Migrate hook test fixtures — representative fixtures (SEAM-03/SEAM-04)

These fixtures must NOT import real adapters. Write inline in the test file.

**Fixture style from `favorites.test.ts` lines 36-58** (recovery pipeline as inline logic):

```typescript
// Fixture 1: disclaimer-style raw-string transform
const disclaimerLikeRecover = (raw: string | null): boolean => {
  if (raw === null) return false;
  return raw === 'true';
};

// Fixture 2: favorites-style filter-and-cap (JSON + shape validation)
const VALID = new Set(['a', 'b', 'c', 'd', 'e']);
const CAP = 3;
const favoritesLikeRecover = (raw: string | null): string[] => {
  if (raw === null) return ['a', 'b', 'c'];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return ['a', 'b', 'c']; }
  if (
    typeof parsed !== 'object' || parsed === null ||
    (parsed as { v: number }).v !== 1 ||
    !Array.isArray((parsed as { ids: unknown }).ids)
  ) return ['a', 'b', 'c'];
  const filtered = ((parsed as { ids: string[] }).ids)
    .filter((id): id is string => typeof id === 'string' && VALID.has(id))
    .slice(0, CAP);
  return filtered.length === 0 ? ['a', 'b', 'c'] : filtered;
};
```

Test these fixtures via `createPersistentValue({ key, defaultValue, recover })` — the factory does not need `codec` when `recover` is present (recover owns the read path).

---

#### `describe` block structure — copy from `calculator-store.test.ts`

Use named `describe` blocks per behavior group, one `it` per assertion. Same style as `calculator-store.test.ts` lines 27-188:

```typescript
describe('PersistentValue — defaults and round-trip', () => { /* ... */ });
describe('PersistentValue — SSR guard (SEAM-01)', () => { /* ... */ });
describe('PersistentValue — parse failure fallback (SEAM-02)', () => { /* ... */ });
describe('PersistentValue — recover hook (SEAM-03)', () => { /* ... */ });
describe('PersistentValue — write/remove silent on throw', () => { /* ... */ });
describe('PersistentValue — raw-string codec (D-01)', () => { /* ... */ });
```

---

## Shared Patterns

### SSR guard
**Source:** `src/lib/shell/calculator-store.svelte.ts` lines 43, 61, 76
**Apply to:** All three methods of `persistent-value.ts` (`read`, `write`, `remove`)
```typescript
if (typeof localStorage === 'undefined') return /* defaultValue or void */;
```

### Silent-catch
**Source:** `src/lib/shell/calculator-store.svelte.ts` lines 54-56, 64-66, 79-81
**Apply to:** All three methods of `persistent-value.ts`
```typescript
} catch {
  // Silent: [reason description]
}
```

### `afterEach` ordering
**Source:** `src/lib/shell/calculator-store.test.ts` lines 19-25
**Apply to:** `persistent-value.test.ts` `afterEach` block — MANDATORY ORDERING
```typescript
afterEach(() => {
  vi.unstubAllGlobals();   // FIRST — before any localStorage access
  vi.restoreAllMocks();
  localStorage.clear();
});
```

### `vi.stubGlobal` for SSR simulation
**Source:** `src/lib/shell/calculator-store.test.ts` line 177
**Apply to:** All SSR guard tests in `persistent-value.test.ts`
```typescript
vi.stubGlobal('localStorage', undefined);
```

### `vi.spyOn(Storage.prototype, ...)` for throw simulation
**Source:** `src/lib/shell/calculator-store.test.ts` lines 115-116, 130-131; `src/lib/shared/favorites.test.ts` lines 176-177, 187-188
**Apply to:** All quota/private-mode and security-error tests in `persistent-value.test.ts`
```typescript
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('...'); });
vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('...'); });
```

---

## No Analog Found

Neither file has an analog gap — both are well-covered by the existing codebase.

| Gap concern | Resolution |
|-------------|------------|
| `Codec<T>` interface with pluggable serialize/deserialize | No direct codebase analog, but derived from the JSON hardcoding in `calculator-store.svelte.ts:47,63` and the raw-string direct write in `theme.svelte.ts:14` and `favorites.svelte.ts:63`. The interface generalizes what already exists as hardcoded calls. RESEARCH.md Section 1 provides the full design. |
| `rawStringCodec` constant | No prior exported codec constant — but the pattern of `(v) => v` / identity codec is trivially derived from `theme.svelte.ts:14` (`localStorage.setItem('nicu_assistant_theme', value)` — raw string, no serialization). |

---

## Metadata

**Analog search scope:** `src/lib/shell/`, `src/lib/shared/`, `src/test-setup.ts`
**Files scanned:** 7 (`calculator-store.svelte.ts`, `favorites.svelte.ts`, `theme.svelte.ts`, `disclaimer.svelte.ts`, `lastEdited.svelte.ts`, `calculator-store.test.ts`, `favorites.test.ts`)
**Pattern extraction date:** 2026-05-28
