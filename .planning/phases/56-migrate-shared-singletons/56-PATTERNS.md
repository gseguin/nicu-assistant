# Phase 56: Migrate Shared Singletons - Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 4 modified files + 1 seam reference
**Analogs found:** 4 / 4 (each file is its own analog — refactor-in-place)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/shared/theme.svelte.ts` | adapter/singleton | request-response | itself (refactor-in-place) + `persistent-value.ts` (seam API) | exact |
| `src/lib/shared/disclaimer.svelte.ts` | adapter/singleton | request-response | itself (refactor-in-place) + `persistent-value.ts` (seam API) | exact |
| `src/lib/shared/favorites.svelte.ts` | adapter/singleton | CRUD | itself (refactor-in-place) + `persistent-value.ts` (seam API) | exact |
| `src/lib/shared/lastEdited.svelte.ts` | adapter/class | event-driven | itself (refactor-in-place) + `persistent-value.ts` (seam API) | exact |

---

## The Seam API — Read This Before All Four Migrations

**Source:** `src/lib/shared/persistent-value.ts` (lines 1-126)

**Import pattern** (lines 15-43, 53-72, 85-126):
```typescript
import { createPersistentValue, rawStringCodec } from './persistent-value.js';
// OR for favorites:
import { createPersistentValue, jsonCodec } from './persistent-value.js';
// OR for lastEdited (no codec needed — uses recover hook):
import { createPersistentValue } from './persistent-value.js';
import type { PersistentValue } from './persistent-value.js';
```

**Factory call shape** (lines 85-86):
```typescript
const pv = createPersistentValue<T>({
  key: 'the-storage-key',   // string
  defaultValue: theDefault, // T
  codec: rawStringCodec,    // optional; defaults to jsonCodec<T>() when omitted
  recover: optionalHook     // optional; (raw: string | null) => T — owns read path when present
});
```

**Three returned methods** (lines 88-124):
```typescript
pv.read()        // SSR guard + try/catch; calls recover(raw) when present, else codec.deserialize
pv.write(value)  // SSR guard + try/catch; calls codec.serialize(value) → localStorage.setItem
pv.remove()      // SSR guard + try/catch; localStorage.removeItem
```

**rawStringCodec behavior** (lines 69-72): identity — stores `'light'`/`'dark'`/`'true'` as-is, no JSON quotes. Non-negotiable for theme (FOUC byte-identity) and disclaimer.

**recover hook contract** (lines 93-98): when `opts.recover` is present, it completely owns the read path — `codec.deserialize` is NOT called. The outer `try/catch` (line 102) is defense-in-depth only. `recover` receives `raw: string | null` and must return `T`.

**Codec.serialize path for write** (lines 108-114): `codec.serialize(value)` is always called in `write()`, even when a `recover` hook is present. This is the key insight for favorites — serialize wraps in `{v:1,ids}`, while recover unwraps on read.

---

## Pattern Assignments

### MIG-01: `src/lib/shared/theme.svelte.ts` (adapter/singleton, request-response)

**Current state** (full file, 34 lines):
- `_theme = $state<'light' | 'dark'>('light')` — module-scope reactive state
- `set()` (lines 11-21): `_theme = value` → `try { localStorage.setItem(...) } catch {}` → DOM sync
- `init()` (lines 23-29): `localStorage.getItem(...)` returns `string | null` → null-coalescence fallback → `theme.set()`
- `toggle()` (lines 31-33): delegates to `set()`
- No SSR guard in current code — DOM calls in `set()` assume browser context (called from `onMount`)

**What changes:**
- Add `import { createPersistentValue, rawStringCodec } from './persistent-value.js'`
- Add module-scope `const pv = createPersistentValue<string>({ key: 'nicu_assistant_theme', defaultValue: 'light', codec: rawStringCodec })`
- `set()`: replace `try { localStorage.setItem('nicu_assistant_theme', value) } catch {}` with `pv.write(value)`
- `init()`: KEEP the raw `localStorage.getItem` null-probe (see PITFALL-03 below); only the `setItem` in `set()` moves to the seam

**What stays unchanged:**
- `_theme = $state<'light' | 'dark'>('light')` — reactive state is not in the seam
- DOM sync in `set()` (lines 19-20): `.classList.toggle('dark', ...)` and `.setAttribute('data-theme', ...)` — not persistence
- `prefers-color-scheme` fallback logic in `init()` (line 28)
- `toggle()` — unchanged

**Migrated `set()` pattern:**
```typescript
// theme.svelte.ts — set() after migration
set(value: 'light' | 'dark'): void {
  _theme = value;
  pv.write(value);  // replaces: try { localStorage.setItem('nicu_assistant_theme', value) } catch {}
  document.documentElement.classList.toggle('dark', value === 'dark');
  document.documentElement.setAttribute('data-theme', value);
},
```

**Migrated `init()` pattern — CRITICAL (PITFALL-03):**
```typescript
// theme.svelte.ts — init() after migration
// ONE allowed raw null-probe: pv.read() returns defaultValue='light' for both
// "nothing stored" and "stored 'light'" — indistinguishable without the probe.
// The prefers-color-scheme fallback only fires on true first-run (raw === null).
init(): void {
  const stored = localStorage.getItem('nicu_assistant_theme') as 'light' | 'dark' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  theme.set(stored ?? (prefersDark ? 'dark' : 'light'));
  // NOTE: theme.set() now calls pv.write() internally — write still routes through seam
  // NOTE: init() is called from onMount — no SSR risk on this localStorage.getItem call
}
```

**Post-migration grep note:** theme will retain ONE `localStorage.getItem` in `init()`. This is an allowed exception documented in RESEARCH.md §Post-Migration Verification. The `localStorage.setItem` is fully replaced by `pv.write()`.

**FOUC byte-identity verification (D-03):** The planner must include this assertion in the verification step:
```typescript
theme.set('dark');
expect(localStorage.getItem('nicu_assistant_theme')).toBe('dark'); // NOT '"dark"'
```
`rawStringCodec.serialize = (v) => v` guarantees unquoted storage. The `app.html` FOUC script at line 10-12 does `var stored = localStorage.getItem('nicu_assistant_theme'); if (stored === 'dark') ...` — this comparison must continue to work.

---

### MIG-02: `src/lib/shared/disclaimer.svelte.ts` (adapter/singleton, request-response)

**Current state** (full file, 38 lines):
- `_acknowledged = $state(false)`, `_initialized = $state(false)` — module-scope reactive state
- `init()` (lines 16-29): two raw `localStorage.getItem` calls → OR logic → conditional `try { localStorage.setItem(v2) } catch {}`
- `acknowledge()` (lines 30-37): `_acknowledged = true` → `try { localStorage.setItem(v2, 'true') } catch {}`
- v1 key is NEVER written or deleted — audit trail (lines 22-24 comment)

**What changes:**
- Add `import { createPersistentValue, rawStringCodec } from './persistent-value.js'`
- Add TWO module-scope `const pvV1 = createPersistentValue<string>({ key: DISCLAIMER_KEY_V1, defaultValue: '', codec: rawStringCodec })` and `const pvV2 = ...`
- `init()`: replace raw `localStorage.getItem` calls with `pvV1.read()` / `pvV2.read()`; replace `try { localStorage.setItem(v2, 'true') } catch {}` with `pvV2.write('true')` — seam's silent-catch already covers private mode
- `acknowledge()`: replace `try { localStorage.setItem(v2, 'true') } catch {}` with `pvV2.write('true')`
- `pvV1` is NEVER passed to `.write()` or `.remove()` — add comment enforcing this

**What stays unchanged:**
- `_acknowledged = $state(false)`, `_initialized = $state(false)` — reactive state is not in the seam
- The OR logic `_acknowledged = v2 === 'true' || v1 === 'true'` — adapter orchestration
- The v1→v2 migration condition `if (v1 === 'true' && v2 !== 'true')` — adapter orchestration
- v1 is never written or removed — hard constraint (ROADMAP SC-2)

**Migrated disclaimer pattern:**
```typescript
// disclaimer.svelte.ts — after migration
import { createPersistentValue, rawStringCodec } from './persistent-value.js';

const DISCLAIMER_KEY_V1 = 'nicu_assistant_disclaimer_v1';
const DISCLAIMER_KEY_V2 = 'nicu_assistant_disclaimer_v2';

// Two seam instances — pvV1 is READ-ONLY (never call .write() or .remove() on it)
const pvV1 = createPersistentValue<string>({
  key: DISCLAIMER_KEY_V1,
  defaultValue: '',
  codec: rawStringCodec
});
const pvV2 = createPersistentValue<string>({
  key: DISCLAIMER_KEY_V2,
  defaultValue: '',
  codec: rawStringCodec
});

// $state declarations unchanged
let _acknowledged = $state(false);
let _initialized = $state(false);

export const disclaimer = {
  // getters unchanged
  init(): void {
    const v1 = pvV1.read();  // '' when not stored; 'true' when stored — seam handles getItem throw
    const v2 = pvV2.read();  // '' when not stored; 'true' when stored
    _acknowledged = v2 === 'true' || v1 === 'true';  // OR logic UNCHANGED
    if (v1 === 'true' && v2 !== 'true') {
      pvV2.write('true');  // replaces: try { localStorage.setItem(KEY_V2, 'true') } catch {}
      // Do NOT call pvV1.write() or pvV1.remove() — v1 is audit trail (ROADMAP SC-2)
    }
    _initialized = true;
  },
  acknowledge(): void {
    _acknowledged = true;
    pvV2.write('true');  // replaces: try { localStorage.setItem(KEY_V2, 'true') } catch {}
  }
};
```

**Key removal:** Both `try { localStorage.setItem } catch {}` blocks disappear entirely — the seam's silent-catch covers private-mode and quota errors. `DisclaimerBanner.test.ts` scenario 6 (setItem-throw in private mode) continues to pass because `pvV2.write()` catches internally.

**rawStringCodec stores `'true'` not `true`** — the existing `v2 === 'true'` string comparison is preserved byte-for-byte.

---

### MIG-03: `src/lib/shared/favorites.svelte.ts` (adapter/singleton, CRUD)

**Current state** (full file, 125 lines):
- `recover()` function (lines 36-59): 6-step pipeline, `(raw: string | null) => CalculatorId[]`
- `persist()` function (lines 61-67): `try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, ids })) } catch {}`
- `_ids = $state(defaultIds())`, `_initialized = $state(false)` — module-scope reactive state
- `toggle()` (lines 97-109): mutates `_ids` then calls `persist(_ids)`
- `init()` (lines 112-124): raw null-probe (lines 113-117) → `recover(raw)` → `_ids = recovered` → `_initialized = true` → first-run write-back (line 123)

**What changes:**
- Add `import { createPersistentValue } from './persistent-value.js'`
- Add module-scope `const pv = createPersistentValue<CalculatorId[]>({ key: STORAGE_KEY, defaultValue: defaultIds(), codec: { serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids }), deserialize: (raw) => JSON.parse(raw) }, recover })`
- `persist()` function: DELETE the entire function; inline `pv.write(_ids)` at call sites
- `toggle()`: replace `persist(_ids)` with `pv.write(_ids)`
- `init()`: keep the raw null-probe (lines 113-117 — needed for first-run detection); replace `recover(raw)` with `pv.read()` (the seam calls `recover` internally); replace `persist(recovered)` with `pv.write(recovered)`

**What stays unchanged:**
- `recover()` function (lines 36-59) — passed as the seam's `recover` hook; NOT modified
- `defaultIds()`, `validIds()`, `StoredShape` interface, `FAVORITES_MAX`, `STORAGE_KEY`, `SCHEMA_VERSION` — all unchanged
- `_ids = $state(defaultIds())`, `_initialized = $state(false)` — module-scope reactive state, not in seam
- All getters (`current`, `count`, `isFull`, `initialized`) — unchanged
- `has()`, `canAdd()` — unchanged
- `toggle()` mutation logic (lines 98-106) — unchanged; only `persist(_ids)` call on line 108 changes
- Raw null-probe in `init()` (lines 113-117) — kept for first-run detection (PITFALL-04)

**CRITICAL — codec must wrap ids in `{v:1,ids}` shape (PITFALL-01):**
```typescript
// WRONG — stores bare array ["feeds","formula",...] — T-01 fails
const pv = createPersistentValue<CalculatorId[]>({
  key: STORAGE_KEY,
  defaultValue: defaultIds(),
  // jsonCodec default: serialize = JSON.stringify(ids) → '["feeds",...]'
  recover
});

// CORRECT — stores {v:1,ids:["feeds",...]} — T-01 passes
const pv = createPersistentValue<CalculatorId[]>({
  key: STORAGE_KEY,
  defaultValue: defaultIds(),
  codec: {
    serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids }),  // write wraps in schema
    deserialize: (raw) => JSON.parse(raw)  // never called — recover owns read path; defined for type correctness
  },
  recover  // owns read: recover(raw) → CalculatorId[]
});
```

**Migrated `init()` pattern:**
```typescript
// favorites.svelte.ts — init() after migration
init(): void {
  // D-05a: one allowed raw null-probe to detect first-run
  // (pv.read() cannot distinguish "null" from "stored defaultIds()" without it)
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  const recovered = pv.read();  // seam calls recover(raw) internally
  _ids = recovered;
  _initialized = true;
  // D-09: first-run write-back — seeds defaults into storage on first visit
  if (raw === null) pv.write(recovered);  // replaces: persist(recovered)
}
```

**T-18 flow trace (VERIFIED):** getItem spy throws → null-probe catch sets `raw = null` → `pv.read()` also calls getItem (spy still active) → seam catch returns `opts.defaultValue = defaultIds()` → `_ids = defaultIds()`. T-18 assertion `[...favorites.current] === defaults` passes.

**T-19 flow trace (VERIFIED):** `toggle()` mutates `_ids` first → then `pv.write(_ids)` → seam's setItem throws (spy) → silent catch → `_ids` already updated. T-19 assertion `favorites.has('formula') === false` passes because state mutation precedes the write call.

**T-01 first-run write-back (VERIFIED):** `raw === null` → `pv.write(recovered)` → stores `JSON.stringify({ v: 1, ids: defaultIds() })`. T-01 assertion `expect(stored).toEqual({ v: 1, ids: [...] })` passes because codec.serialize wraps in `{v:1,ids}`.

---

### MIG-04: `src/lib/shared/lastEdited.svelte.ts` (adapter/class, event-driven)

**Current state** (lines 20-61):
- `LastEdited` class, one instance per `CalculatorStore`
- Constructor (lines 24-36): SSR guard `if (typeof localStorage === 'undefined') return` → `try { raw = getItem(key); if (raw) { n = Number(raw); this.current = isFinite(n) ? n : null } } catch {}`
- `stamp()` (lines 39-50): debounce check → `this.current = now` → `try { setItem(key, String(this.current)) } catch {}`
- `clear()` (lines 53-60): `this.current = null` → `try { removeItem(key) } catch {}`
- `current = $state<number | null>(null)` — class field reactive state

**What changes:**
- Add `import { createPersistentValue } from './persistent-value.js'`
- Add `import type { PersistentValue } from './persistent-value.js'`
- Add `#pv: PersistentValue<number | null>` private field
- Constructor: replace the entire SSR guard + try/catch block with `createPersistentValue` + `this.current = this.#pv.read()`. Use a `recover` hook (not a codec) to handle the `if (!raw)` empty-string guard correctly (PITFALL-06).
- `stamp()`: replace `try { localStorage.setItem(key, String(this.current)) } catch {}` with `this.#pv.write(this.current)`. The `this.current = now` update BEFORE the write is preserved (stamp-outside-try semantics).
- `clear()`: replace `try { localStorage.removeItem(key) } catch {}` with `this.#pv.remove()`

**What stays unchanged:**
- `current = $state<number | null>(null)` — class field reactive state, not in seam
- `STAMP_DEBOUNCE_MS = 60_000` constant
- Debounce check in `stamp()` (line 43): `if (this.current !== null && now - this.current < STAMP_DEBOUNCE_MS) return`
- `this.current = now` before `pv.write()` (stamp-outside-try semantics)
- `this.current = null` before `pv.remove()` in `clear()`
- `formatLastEdited()`, `STALE_THRESHOLD_MS`, `isStale()` (lines 64-83) — unchanged

**Why `recover` hook over `{serialize: String, deserialize: Number}` codec (PITFALL-06):**
`Number('') = 0` and `isFinite(0) = true`, so a bare `deserialize: Number` would set `this.current = 0` for an empty-string stored value. The current constructor guards with `if (raw)` (falsy check). The `recover` hook replicates this guard cleanly:

**Migrated `LastEdited` class pattern:**
```typescript
// lastEdited.svelte.ts — after migration
import { createPersistentValue } from './persistent-value.js';
import type { PersistentValue } from './persistent-value.js';

const STAMP_DEBOUNCE_MS = 60_000;

export class LastEdited {
  current = $state<number | null>(null);
  #key: string;
  #pv: PersistentValue<number | null>;

  constructor(key: string) {
    this.#key = key;
    this.#pv = createPersistentValue<number | null>({
      key: this.#key,
      defaultValue: null,
      recover: (raw: string | null): number | null => {
        if (!raw) return null;              // handles null (nothing stored) AND '' (empty string)
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;  // handles non-numeric garbage
      }
    });
    // Replaces: SSR guard + try { raw = getItem; if (raw) { n = Number(raw); ... } } catch {}
    this.current = this.#pv.read();
  }

  stamp(): void {
    const now = Date.now();
    if (this.current !== null && now - this.current < STAMP_DEBOUNCE_MS) return;
    this.current = now;              // state update BEFORE write (stamp-outside-try semantics)
    this.#pv.write(this.current);    // replaces: try { setItem(key, String(this.current)) } catch {}
  }

  clear(): void {
    this.current = null;
    this.#pv.remove();               // replaces: try { removeItem(key) } catch {}
  }
}
```

**`calculator-store.test.ts` line 125-137 trace (VERIFIED):** setItem spy → `this.#pv.write()` seam catches silently → BUT `this.current = now` already ran before `pv.write()`. So `store.lastEdited.current` is a valid number. Test assertions `typeof stamped === 'number'` and `Number.isFinite(stamped)` pass.

**`calculator-store.test.ts` line 141-155 (reset) trace (VERIFIED):** `store.reset()` calls `this.lastEdited.clear()` → `this.current = null` → `this.#pv.remove()` → seam calls `localStorage.removeItem(key)`. Test assertion `localStorage.getItem(KEY + '_ts') === null` passes.

**Stored bytes:** `pv.write(this.current)` where `this.current = Date.now()` (a number). No codec supplied, so default `jsonCodec` is used. `JSON.stringify(1748443200000) === '1748443200000'` — a bare number string, no JSON quotes. Byte-identical to current `String(this.current)` = `'1748443200000'`. VERIFIED byte-identical.

---

## Shared Patterns

### Module-scope `const pv = createPersistentValue(...)` (D-01)
**Source:** CONTEXT.md D-01, RESEARCH.md §Module-scope pv instance pattern
**Apply to:** MIG-01, MIG-02, MIG-03 (module-scope singletons); MIG-04 uses per-instance class field
```typescript
// ALWAYS at module scope, before $state declarations
const pv = createPersistentValue<T>({
  key: 'the-storage-key',
  defaultValue: theDefault,
  codec: rawStringCodec,  // OR custom codec OR omit for jsonCodec default
  recover: optionalHook   // only when null/invalid raw needs custom handling
});
// The seam is stateless — it holds no $state. Reactive state stays in the adapter.
```

### Removing all manual `try { localStorage.X } catch {}` blocks
**Source:** `src/lib/shared/persistent-value.ts` lines 88-124
**Apply to:** ALL four files
Every `try { localStorage.setItem(...) } catch {}` → `pv.write(value)`
Every `try { localStorage.removeItem(...) } catch {}` → `pv.remove()`
Every `try { raw = localStorage.getItem(...) } catch { raw = null }` → `pv.read()` (unless a null-probe is needed for first-run detection)

### Allowed null-probe exceptions (TWO files only)
**Source:** CONTEXT.md D-05a, RESEARCH.md §PITFALL-01 §PITFALL-03
**Apply to:** MIG-01 (`theme.svelte.ts`) and MIG-03 (`favorites.svelte.ts`) only

Both files keep ONE `localStorage.getItem` call in `init()` — not for the value, but to detect `null` (no prior storage) for a fallback decision that the seam cannot make:
- Theme: `null` → apply `prefers-color-scheme` fallback. Seam returns `'light'` (defaultValue) for both null and stored `'light'` — indistinguishable.
- Favorites: `null` → write defaults back (first-run seeding). Seam's `recover(null)` returns defaults but does NOT write back.

These two `localStorage.getItem` calls must appear explicitly in the post-migration grep verification as allowed exceptions.

### `$state` and reactive state stays in the adapter (D-01, D-06)
**Source:** `persistent-value.ts` is plain `.ts` — Svelte runes do not compile in it
**Apply to:** ALL four files
The seam is stateless. `$state` runes stay in `.svelte.ts` files. The adapter reads the seam's output into `$state`:
```typescript
// Pattern: read seam output into $state
_value = pv.read();       // module-scope adapter
this.current = this.#pv.read();  // class-based adapter (lastEdited)
```

### DOM side-effects stay in the adapter
**Source:** `theme.svelte.ts` current lines 19-20
**Apply to:** MIG-01 only (other adapters have no DOM side-effects)
`.classList.toggle()` and `.setAttribute()` in `theme.set()` are not persistence — they stay exactly as-is after migration.

### Import extension convention
**Source:** `favorites.svelte.ts` current lines 5-6
**Apply to:** ALL four files
Use `.js` extension even for TypeScript source files in SvelteKit:
```typescript
import { createPersistentValue, rawStringCodec } from './persistent-value.js';
```
NOT `'./persistent-value.ts'` — SvelteKit/Vite module resolution requires `.js`.

---

## Old-to-New Call Site Map (executor reference)

| File | Old call | New call | Location |
|---|---|---|---|
| `theme.svelte.ts` | `localStorage.setItem('nicu_assistant_theme', value)` in try/catch | `pv.write(value)` | `set()` |
| `theme.svelte.ts` | `localStorage.getItem('nicu_assistant_theme')` | KEEP (null-probe) | `init()` |
| `disclaimer.svelte.ts` | `localStorage.getItem(DISCLAIMER_KEY_V2)` | `pvV2.read()` | `init()` |
| `disclaimer.svelte.ts` | `localStorage.getItem(DISCLAIMER_KEY_V1)` | `pvV1.read()` | `init()` |
| `disclaimer.svelte.ts` | `localStorage.setItem(DISCLAIMER_KEY_V2, 'true')` in try/catch (in init) | `pvV2.write('true')` | `init()` |
| `disclaimer.svelte.ts` | `localStorage.setItem(DISCLAIMER_KEY_V2, 'true')` in try/catch (in acknowledge) | `pvV2.write('true')` | `acknowledge()` |
| `favorites.svelte.ts` | `localStorage.getItem(STORAGE_KEY)` in try/catch in `init()` | KEEP (null-probe) | `init()` |
| `favorites.svelte.ts` | `recover(raw)` call in `init()` | `pv.read()` (seam calls recover internally) | `init()` |
| `favorites.svelte.ts` | `persist(recovered)` in `init()` | `pv.write(recovered)` | `init()` |
| `favorites.svelte.ts` | `persist(_ids)` in `toggle()` | `pv.write(_ids)` | `toggle()` |
| `favorites.svelte.ts` | `persist()` function body: `localStorage.setItem` in try/catch | DELETE entire `persist()` function | module scope |
| `lastEdited.svelte.ts` | `if (typeof localStorage === 'undefined') return` + try/catch block in constructor | `this.#pv = createPersistentValue(...)` + `this.current = this.#pv.read()` | `constructor` |
| `lastEdited.svelte.ts` | `localStorage.setItem(this.#key, String(this.current))` in try/catch | `this.#pv.write(this.current)` | `stamp()` |
| `lastEdited.svelte.ts` | `localStorage.removeItem(this.#key)` in try/catch | `this.#pv.remove()` | `clear()` |

---

## Pitfall Registry (executor must read before implementing)

| # | File | Pitfall | Symptom | Prevention |
|---|---|---|---|---|
| 1 | favorites | Using default `jsonCodec` for write stores bare array `["feeds",...]` not `{v:1,ids:[...]}` | T-01 fails: `received: ["feeds","formula","gir","morphine-wean"]` | Custom codec: `serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids })` |
| 2 | theme | Using `jsonCodec` stores `'"dark"'` (quoted), breaking FOUC script comparison `=== 'dark'` | Returning dark-mode users see light theme on load | `rawStringCodec` is non-negotiable for theme |
| 3 | theme | `pv.read()` returns `'light'` for both stored `'light'` AND nothing-stored — prefers-color-scheme fallback lost | New dark-mode users always get light theme | Keep raw null-probe in `init()` — one allowed exception |
| 4 | favorites | Removing null-probe + `if (raw === null) pv.write(recovered)` breaks first-run seeding | T-01 fails: `localStorage.getItem(STORAGE_KEY)` returns null after `init()` | Keep both lines from current `init()` lines 113-123 |
| 5 | disclaimer | Calling `pvV1.write()` or `pvV1.remove()` erases audit trail | v1-only users see disclaimer again; SC-2 fails | `pvV1` is read-only — add comment, never call write/remove on it |
| 6 | lastEdited | `{serialize: String, deserialize: Number}` codec: `Number('') = 0`, sets `current = 0` instead of `null` | `store.lastEdited.current` is `0` instead of `null`; reset test may fail | Use `recover` hook with `if (!raw) return null` guard |
| 7 | favorites | T-18: getItem spy active during both null-probe AND `pv.read()` — two throws | No failure — both caught silently, result is identical `defaultIds()` | No action; document in comment |
| 8 | all | Import with `.ts` extension instead of `.js` | Vite module resolution error at build | Use `'./persistent-value.js'` extension |

---

## Regression Contract Map

| Test file | Tests | What migration must preserve |
|---|---|---|
| `src/lib/shared/favorites.test.ts` | T-01..T-21, SAFE-02, SAFE-03 | 6-step recover pipeline; first-run write-back; `{v:1,ids}` stored shape; in-memory state mutation before write; module-scope default seed; stored-order preservation |
| `src/lib/shell/calculator-store.test.ts` | 10 tests (lines 27-188) | `stamp()` runs after setItem-throw (line 125); `lastEdited.current` is a number after persist (line 159); `lastEdited.current` is null after reset (line 154); SSR safety with `localStorage = undefined` (line 175) |
| `src/lib/shared/components/DisclaimerBanner.test.ts` | 6 scenarios | v1-only user acknowledged + v1 key preserved; acknowledge() in private mode silent; `_acknowledged` and `_initialized` states |

**Hard rule from CONTEXT.md D-06:** If any test in these three files requires a code change to pass, that is a behavior regression. Stop and reassess — do NOT edit the test to match.

---

## Post-Migration Verification Grep

After all four migrations, the following grep must match EXACTLY these files:

```bash
grep -r 'localStorage' src/ --include='*.ts' --include='*.svelte.ts' --include='*.svelte' \
  | grep -v '\.test\.' | grep -v 'node_modules'
```

Expected matches only:
1. `src/lib/shared/persistent-value.ts` — the seam (correct)
2. `src/lib/shell/calculator-store.svelte.ts` — Phase 57 migration pending (correct)
3. `src/lib/shared/favorites.svelte.ts` — ONE `localStorage.getItem` in `init()` (allowed, D-05a)
4. `src/lib/shared/theme.svelte.ts` — ONE `localStorage.getItem` in `init()` (allowed, Pitfall 3)

Any other file is a migration error.

---

## No Analog Found

Not applicable. All four files are refactored in-place. The seam (`persistent-value.ts`) provides the only new API being adopted, and it is already shipped (Phase 55).

---

## Metadata

**Analog search scope:** `src/lib/shared/` — the four target files plus `persistent-value.ts`
**Files read:** 7 (persistent-value.ts, theme.svelte.ts, disclaimer.svelte.ts, favorites.svelte.ts, lastEdited.svelte.ts, favorites.test.ts, calculator-store.test.ts)
**Pattern extraction date:** 2026-05-28
