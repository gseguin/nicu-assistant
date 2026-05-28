# Phase 56: Migrate Shared Singletons - Research

**Researched:** 2026-05-28
**Domain:** Svelte 5 runes + PersistentValue<T> seam adapter migration (TypeScript, SvelteKit 2)
**Confidence:** HIGH — all findings verified directly from source code; no external research required for a codebase-internal migration

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Each adapter creates a module-scope `const pv = createPersistentValue<T>({...})` and its accessors delegate to `pv.read()` / `pv.write(v)` / `pv.remove()`. The adapter keeps its own `$state` rune (the seam is stateless). Seam owns guarded I/O + codec + recover; all reactive state, DOM side-effects, defaults, cross-key/debounce orchestration stay in the adapter.
- **D-02:** `theme.svelte.ts` uses ONE `createPersistentValue<string>({ key: 'nicu_assistant_theme', defaultValue: 'light', codec: rawStringCodec })`.
- **D-03:** `app.html` FOUC inline script is LEFT UNCHANGED — raw `localStorage.getItem('nicu_assistant_theme')`. `rawStringCodec` is non-negotiable (stores `light`/`dark` unquoted).
- **D-04:** `disclaimer.svelte.ts` uses TWO `createPersistentValue<string>` instances (v1 + v2 keys). v1 instance is read-only — NEVER write or remove it. Adapter ORs the two reads and writes v2 if v1-only.
- **D-05:** `favorites.svelte.ts` uses ONE `createPersistentValue<CalculatorId[]>` with `jsonCodec` and the existing `recover()` passed as the seam's recover hook. First-run write-back preserved via a guarded raw null-probe in `init()` (option a).
- **D-06:** `favorites.test.ts` stays GREEN UNCHANGED. Any test requiring an edit is a behavior regression — stop.
- **D-07:** `lastEdited.svelte.ts`'s `LastEdited` class holds ONE `createPersistentValue<number>` per instance, with custom codec `{ serialize: String, deserialize: Number }`. 60s debounce + stamp-outside-try + `clear()` → `pv.remove()` stay in the class.
- **D-08:** Custom `{ serialize: String, deserialize: Number }` codec recommended for lastEdited to make the raw-number-string intent explicit. Non-finite guard stays in the class.

### Claude's Discretion

- Whether disclaimer uses two `PersistentValue` instances vs. two inline seam calls — both satisfy D-04; planner picks the cleaner one.
- The exact lastEdited codec form (custom String/Number codec vs. recover hook) — both byte-identical; D-07/D-08 recommend the custom codec.
- Whether favorites' first-run detection uses a raw null-probe (D-05a) or a recover-signal (D-05b) — planner picks whichever keeps every favorites test green.
- Migration order / plan split: all four are independent single-file edits with no shared state. Planner may do one plan or split per adapter; they are parallel-safe.

### Deferred Ideas (OUT OF SCOPE)

- `CalculatorStore` migrated onto the seam + the 5 `*Inputs.svelte` auto-persist `$effect` fold-in — Phase 57.
- `app.html` FOUC script — never migrated.
- `pwa.svelte.ts` / `visualViewport.svelte.ts` — not localStorage adapters.
- Release v1.18.0 — Phase 58.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-01 | `theme.svelte.ts` reads/writes through the seam; key `nicu_assistant_theme`, behavior and `.dark`/`data-theme` sync unchanged | Seam API + rawStringCodec verified; FOUC byte-identity constraint verified in app.html |
| MIG-02 | `disclaimer.svelte.ts` reads/writes through the seam; v1→v2 migration with v1 not deleted; `acknowledged`/`initialized` unchanged | Two-instance pattern verified; DisclaimerBanner.test.ts confirms behavior contract |
| MIG-03 | `favorites.svelte.ts` reads/writes through the seam; key `nicu:favorites`, schema `{v:1,ids}`, 6-step recovery, 4-cap, stored-order preserved | Full test suite (T-01..T-21, SAFE-02, SAFE-03) verified green; first-run null-probe pattern confirmed |
| MIG-04 | `lastEdited.svelte.ts` reads/writes through the seam; per-key stamp, 60s debounce, clear unchanged | CalculatorStore.test.ts verified; stamp-outside-try semantic preserved through seam's silent write |
</phase_requirements>

---

## Summary

Phase 56 is a purely internal refactor of four `.svelte.ts` adapter files. The `PersistentValue<T>` seam (Phase 55, `persistent-value.ts`) is already shipped and tested. Each adapter stops calling `localStorage` directly and routes its I/O through a module-scope `createPersistentValue` instance. No new packages, no API surface changes, no user-visible behavior changes.

The entire migration is about wiring correctly — each adapter's `$state`, DOM side-effects, domain orchestration, and observable behavior are preserved verbatim. The seam absorbs only the guarded I/O + codec. The hardest constraint is the FOUC dual-read on theme (rawStringCodec, unquoted bytes), followed by the favorites first-run write-back detection (one allowed raw null-probe in `init()`).

The regression gate is non-negotiable: `favorites.test.ts` T-01..T-21 + SAFE-02/03 must stay green without test edits, and `calculator-store.test.ts` must stay green through the lastEdited migration.

**Primary recommendation:** Migrate all four adapters in a single focused plan (or two plans split at adapter granularity). All four file edits are independent — no shared state, no ordering constraint between them.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Guarded localStorage I/O | Seam (`persistent-value.ts`) | — | Single audited location for SSR guard + try/catch |
| Codec (serialize/deserialize) | Seam instance (`createPersistentValue` opts) | — | Codec is per-key configuration, passed at creation |
| Reactive `$state` values | Adapter (`.svelte.ts`) | — | Runes require Svelte preprocessor; seam is plain .ts |
| DOM side-effects (`.dark`, `data-theme`) | Adapter (`theme.svelte.ts`) | — | Not persistence — stays in `set()` |
| Multi-key orchestration (v1→v2 migration) | Adapter (`disclaimer.svelte.ts`) | — | Seam is single-key; adapter composes two instances |
| First-run write-back detection | Adapter (`favorites.svelte.ts`) | — | Seam's recover swallows null→defaults; null-probe stays in adapter |
| Debounce + stamp ordering | Adapter (`lastEdited.svelte.ts`) | — | Adapter behavior, not persistence; seam swallows write throws |
| FOUC theme read | Inline script (`app.html`) | — | Cannot import modules; reads raw bytes pre-hydration |

---

## Standard Stack

### The Seam (already shipped — no new packages)

| Export | From | Purpose |
|--------|------|---------|
| `createPersistentValue<T>(opts)` | `persistent-value.ts` | Factory: returns `{read, write, remove}` |
| `rawStringCodec` | `persistent-value.ts` | Identity codec for theme/disclaimer; stores unquoted strings |
| `jsonCodec<T>()` | `persistent-value.ts` | Default codec; used by favorites (and as default when no codec supplied) |
| `Codec<T>` | `persistent-value.ts` | Interface for custom codecs (lastEdited uses custom String/Number) |

**No new packages.** All four migrations are source edits only. [VERIFIED: source code]

---

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages.

---

## Architecture Patterns

### System Architecture Diagram

```
app.html FOUC script
  → localStorage.getItem('nicu_assistant_theme')  [raw, unquoted — NEVER changes]
  → applies .dark / data-theme before first paint

+layout.svelte (onMount)
  → theme.init()      → pv_theme.read()     → localStorage
  → disclaimer.init() → pv_disc_v1.read()   → localStorage
                      → pv_disc_v2.read()   → localStorage
                      → [if v1-only] pv_disc_v2.write('true') → localStorage
  → favorites.init()  → localStorage.getItem(nullProbe) → null/raw
                      → pv_fav.read()  → recover(raw) → _ids
                      → [if null] pv_fav.write(defaults) → localStorage

CalculatorStore (per-calculator instance, constructed at module scope)
  → new LastEdited(`${key}_ts`)
      → pv_ts.read()  → Number(raw), isFinite guard → this.current
  → store.persist()
      → localStorage.setItem(storeKey, JSON.stringify(current))  [NOT yet migrated — Phase 57]
      → this.lastEdited.stamp()
          → debounce check
          → this.current = Date.now()
          → pv_ts.write(this.current)  → localStorage
  → store.reset()
      → this.lastEdited.clear()
          → this.current = null
          → pv_ts.remove()  → localStorage
```

### Recommended Project Structure

No structural changes. All four files are in-place edits:

```
src/lib/shared/
├── persistent-value.ts        # seam (already shipped — read-only)
├── theme.svelte.ts            # EDIT: wire pv_theme
├── disclaimer.svelte.ts       # EDIT: wire pv_disc_v1 + pv_disc_v2
├── favorites.svelte.ts        # EDIT: wire pv_fav + keep null-probe
└── lastEdited.svelte.ts       # EDIT: wire pv_ts per-instance
```

---

## Concrete Adapter Patterns

### MIG-01: theme.svelte.ts

**Current behavior (the spec):** Stores `'light'` or `'dark'` as a raw (unquoted) string. `init()` reads from storage, applies prefers-color-scheme fallback, calls `set()`. `set()` updates `$state`, writes to storage, syncs `.dark`/`data-theme` on `document.documentElement`. `toggle()` calls `set()`.

**After migration:** [VERIFIED: source code]

```typescript
// src/lib/shared/theme.svelte.ts (migrated)
import { createPersistentValue, rawStringCodec } from './persistent-value.js';

const pv = createPersistentValue<string>({
  key: 'nicu_assistant_theme',
  defaultValue: 'light',
  codec: rawStringCodec
});

let _theme = $state<'light' | 'dark'>('light');

export const theme = {
  get current(): 'light' | 'dark' {
    return _theme;
  },

  set(value: 'light' | 'dark'): void {
    _theme = value;
    pv.write(value);                                              // replaces direct localStorage.setItem + try/catch
    document.documentElement.classList.toggle('dark', value === 'dark');
    document.documentElement.setAttribute('data-theme', value);
  },

  init(): void {
    const stored = pv.read() as 'light' | 'dark' | 'light';     // returns defaultValue='light' when nothing stored
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // If stored equals defaultValue 'light', we cannot tell "stored light" from "nothing stored" via the seam.
    // Use the raw read for the fallback: if stored === 'light' AND nothing was written yet, prefer dark may apply.
    // SEE PITFALL-01 below for the correct init() shape.
    theme.set(stored as 'light' | 'dark' ?? (prefersDark ? 'dark' : 'light'));
  },

  toggle(): void {
    theme.set(_theme === 'dark' ? 'light' : 'dark');
  }
};
```

**PITFALL-01 (init() null-detection for theme):** `pv.read()` with `rawStringCodec` returns `'light'` (the defaultValue) when nothing is stored. But `'light'` is also a legitimate stored value. This means the seam cannot distinguish "stored light" from "nothing stored". The current `init()` uses `stored ?? (prefersDark ? 'dark' : 'light')` where `stored` is `null` on first-run.

**Correct init() shape for theme** — two safe options:

Option A (one raw null-probe, consistent with favorites pattern):
```typescript
init(): void {
  let storedRaw: string | null = null;
  try { storedRaw = localStorage.getItem('nicu_assistant_theme'); } catch { storedRaw = null; }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const value = (storedRaw as 'light' | 'dark' | null) ?? (prefersDark ? 'dark' : 'light');
  theme.set(value);
}
```

Option B (use pv.read() directly, since the default is 'light' and prefers-dark only matters when NOTHING is stored):
```typescript
init(): void {
  // pv.read() returns 'light' both for stored 'light' AND for nothing-stored.
  // The prefers-color-scheme fallback only matters on first run.
  // If no key exists, pv.read() returns defaultValue='light' — same as if user had stored 'light'.
  // For a new user who prefers dark: 'light' default → theme.set('light') → no dark mode.
  // This is WRONG for a dark-mode user on first visit.
  // Therefore Option A (null-probe) is required.
}
```

**Recommendation: Option A** — one guarded null-probe in `init()` ONLY. The call to `pv.write()` in `set()` still routes through the seam. Theme gets one allowed raw null-probe (same exception category as favorites).

**Post-migration grep note:** theme will still have ONE `localStorage.getItem` call in `init()` for the null-probe. This is a known exception — flag it in the grep verification comment alongside favorites'.

**FOUC byte-identity verification:** After migrating, the planner must add a test assertion:
```typescript
theme.set('dark');
expect(localStorage.getItem('nicu_assistant_theme')).toBe('dark'); // NOT '"dark"'
```
This ensures `rawStringCodec` stores unquoted bytes that the `app.html` FOUC script can match.

---

### MIG-02: disclaimer.svelte.ts

**Current behavior (the spec):** Two keys (`_v1`, `_v2`). `init()` reads both, ORs them, writes v2 if v1-only (v1 NEVER deleted). `acknowledge()` writes `'true'` to v2. [VERIFIED: source code]

**After migration:**

```typescript
// src/lib/shared/disclaimer.svelte.ts (migrated)
import { createPersistentValue, rawStringCodec } from './persistent-value.js';

const DISCLAIMER_KEY_V1 = 'nicu_assistant_disclaimer_v1';
const DISCLAIMER_KEY_V2 = 'nicu_assistant_disclaimer_v2';

const pvV1 = createPersistentValue<string>({
  key: DISCLAIMER_KEY_V1,
  defaultValue: '',
  codec: rawStringCodec
});
// READ-ONLY — NEVER call pvV1.write() or pvV1.remove()

const pvV2 = createPersistentValue<string>({
  key: DISCLAIMER_KEY_V2,
  defaultValue: '',
  codec: rawStringCodec
});

let _acknowledged = $state(false);
let _initialized = $state(false);

export const disclaimer = {
  get acknowledged(): boolean { return _acknowledged; },
  get initialized(): boolean { return _initialized; },

  init(): void {
    const v1 = pvV1.read();   // '' when not stored; 'true' when stored
    const v2 = pvV2.read();   // '' when not stored; 'true' when stored
    _acknowledged = v2 === 'true' || v1 === 'true';
    if (v1 === 'true' && v2 !== 'true') {
      pvV2.write('true');     // seam's silent-catch covers quota/private-mode — no manual try/catch needed
      // Do not call pvV1.write() or pvV1.remove() — v1 is read-only (audit trail)
    }
    _initialized = true;
  },

  acknowledge(): void {
    _acknowledged = true;
    pvV2.write('true');       // seam's silent-catch covers private browsing
  }
};
```

**Key insight:** The seam's `write()` already has `try/catch` — the manual `try { localStorage.setItem(...) } catch { // private mode }` wrapper in the current `init()` and `acknowledge()` disappears. The `pvV1` instance is created but only `.read()` is ever called on it. [VERIFIED: source code — disclaimer.svelte.ts lines 17-37]

**Existing tests:** `DisclaimerBanner.test.ts` (6 scenarios) exercises all disclaimer paths including v1-only migration (scenario 2) and setItem-throw in private mode (scenario 6). These tests use `await import('$lib/shared/disclaimer.svelte.js')` WITHOUT `vi.resetModules()`, so the module state persists across tests in the same describe block. After migration, the `pvV1`/`pvV2` module-scope constants persist identically — no behavioral change. [VERIFIED: DisclaimerBanner.test.ts, 6/6 passing]

**No new tests required for MIG-02** — DisclaimerBanner.test.ts scenario 2 already covers SC-2 (v1-only user stays acknowledged, v1 key not deleted). The planner may add a focused unit test asserting `localStorage.getItem(KEY_V1)` survives `disclaimer.init()`, but it is not strictly required.

---

### MIG-03: favorites.svelte.ts

**Current behavior (the spec):** JSON `{v:1,ids}` under `nicu:favorites`. 6-step `recover()` pipeline. Module-scope `$state` seed to defaults (D-07). `init()` probes raw for null to detect first-run, calls `recover(raw)`, writes defaults back on first-run. `toggle()` mutates `_ids` then calls `persist(_ids)`. [VERIFIED: source code — favorites.svelte.ts lines 1-125]

**After migration:**

```typescript
// src/lib/shared/favorites.svelte.ts (migrated) — changes only in persist() and init()
import { createPersistentValue, jsonCodec } from './persistent-value.js';
import { CALCULATOR_REGISTRY } from '$lib/shell/registry.js';
import type { CalculatorId } from './types.js';

export const FAVORITES_MAX = 4;
const STORAGE_KEY = 'nicu:favorites';
const SCHEMA_VERSION = 1;

// ... (StoredShape, defaultIds, validIds — UNCHANGED)

// recover() function — UNCHANGED (passed verbatim as the seam's recover hook)
function recover(raw: string | null): CalculatorId[] { /* ... unchanged ... */ }

// persist() — SIMPLIFIED: replace direct localStorage.setItem + try/catch
const pv = createPersistentValue<CalculatorId[]>({
  key: STORAGE_KEY,
  defaultValue: defaultIds(),
  codec: jsonCodec<{ v: number; ids: CalculatorId[] }>(),   // or use default jsonCodec
  recover
});
// Note: codec is the {v,ids} JSON shape but recover owns the read path entirely.
// For write: pv.write(ids) serializes as JSON.stringify(ids) — NOT {v:1,ids}.
// *** SEE PITFALL-02 below — codec type must match what we write ***

// D-07 latent-init fix: module-scope seed
let _ids = $state<CalculatorId[]>(defaultIds());
let _initialized = $state(false);

export const favorites = {
  // ... getters: UNCHANGED

  toggle(id: CalculatorId): void {
    if (this.has(id)) {
      _ids = _ids.filter((x) => x !== id);
    } else if (!this.isFull) {
      const registryOrder = CALCULATOR_REGISTRY.map((c) => c.id);
      const next: string[] = [..._ids, id];
      _ids = registryOrder.filter((rid) => next.includes(rid)) as CalculatorId[];
    }
    pv.write(_ids);   // replaces persist(_ids)
  },

  init(): void {
    // D-05a: one-line raw null-probe to detect first-run
    let raw: string | null = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch { raw = null; }
    const recovered = pv.read();   // recover() is called by the seam with the same raw value
    _ids = recovered;
    _initialized = true;
    if (raw === null) pv.write(recovered);   // first-run write-back
  }
};
```

**PITFALL-02 (favorites codec type mismatch):** The stored JSON shape is `{v:1, ids: string[]}` but `pv.write(ids)` would write a bare array `["feeds","formula",...]` if the codec serializes `CalculatorId[]` directly. The current `persist()` writes `JSON.stringify({ v: SCHEMA_VERSION, ids })`. This must be preserved.

There are two correct approaches:

**Approach A (recommended — T = StoredShape, codec serializes the wrapper):**
```typescript
const pv = createPersistentValue<StoredShape>({
  key: STORAGE_KEY,
  defaultValue: { v: SCHEMA_VERSION, ids: defaultIds() },
  // jsonCodec is the default — no codec needed
  recover: (raw) => {
    // recover still returns CalculatorId[], but T=StoredShape so we need an adapter...
    // TYPE MISMATCH — this approach forces a type gymnastics
  }
});
```

**Approach B (cleanest — keep T = CalculatorId[], encode wrapper in write):**
```typescript
const pv = createPersistentValue<CalculatorId[]>({
  key: STORAGE_KEY,
  defaultValue: defaultIds(),
  codec: {
    serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids }),   // writes {v:1,ids:[...]}
    deserialize: (raw) => JSON.parse(raw)                              // recover owns read path anyway
  },
  recover
});
// Now pv.write(_ids) stores the correct {v:1,ids:[...]} shape
// recover() owns the read path entirely — codec.deserialize never called when recover is present
```

**Approach B is correct.** T=`CalculatorId[]`, codec.serialize wraps in `{v:1,ids}`, recover owns read. [VERIFIED: persistent-value.ts line 93-97 — when recover is present, it replaces codec.deserialize]

This preserves byte-identical stored JSON shape `{v:1,ids:[...]}` so T-01's `expect(stored).toEqual({v:1,ids:[...]})` continues to pass.

**T-18 flow through the seam (VERIFIED):**
```
getItem spy throws
  → probe try/catch: raw = null (spy still active)
  → pv.read() → seam try/catch → getItem throws again → seam catch → returns opts.defaultValue = defaultIds()
  → _ids = defaultIds() = ['feeds','formula','gir','morphine-wean']
  → T-18 assertion: [...favorites.current] === defaults ✓
```
Both `recover(null)` and `opts.defaultValue` return `defaultIds()` — the spy-active second call falls back to `opts.defaultValue`, which is identical to `recover(null)`. T-18 passes either way. [VERIFIED: analysis]

**T-19 flow through the seam (VERIFIED):**
```
toggle() → _ids mutated (remove 'formula')
  → pv.write(_ids) → seam try { setItem throws (spy) } catch { silent }
  → T-19 assertion: favorites.has('formula') === false ✓ (_ids already updated before write)
```
The in-memory `$state` mutation in `toggle()` happens BEFORE `pv.write()`, so the setItem throw is irrelevant to state. [VERIFIED: analysis + current code line 99 vs 108]

**vi.resetModules() compatibility (VERIFIED):**
- `favorites.svelte.ts` has module-scope `$state` and module-scope `const pv = createPersistentValue(...)`.
- `vi.resetModules()` + dynamic `await import('./favorites.svelte.js')` gives a fresh module closure — fresh `_ids`, fresh `_initialized`, AND fresh `pv` instance.
- `pv` is a stateless closure (just holds opts.key/codec/recover) — each fresh module import re-creates it correctly.
- No cross-test state leakage. [VERIFIED: seam has no module-scope mutable state]

---

### MIG-04: lastEdited.svelte.ts

**Current behavior (the spec):** `LastEdited` class, one per `CalculatorStore` instance. Constructor probes `localStorage.getItem(key)` → `Number(raw)` → `isFinite` guard → `this.current`. `stamp()` debounce check, `this.current = Date.now()`, then `try { setItem } catch {}`. `clear()` = `this.current = null` + `try { removeItem } catch {}`. [VERIFIED: source code — lastEdited.svelte.ts lines 20-61]

**After migration:**

```typescript
// src/lib/shared/lastEdited.svelte.ts (migrated)
import { createPersistentValue } from './persistent-value.js';

const STAMP_DEBOUNCE_MS = 60_000;

export class LastEdited {
  current = $state<number | null>(null);
  #key: string;
  #pv: ReturnType<typeof createPersistentValue<number | null>>;

  constructor(key: string) {
    this.#key = key;
    this.#pv = createPersistentValue<number | null>({
      key: this.#key,
      defaultValue: null,
      recover: (raw: string | null): number | null => {
        if (!raw) return null;                          // null (nothing stored) or '' (empty)
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;          // non-finite garbage → null
      }
    });
    this.current = this.#pv.read();   // SSR guard + try/catch handled by seam
  }

  stamp(): void {
    const now = Date.now();
    if (this.current !== null && now - this.current < STAMP_DEBOUNCE_MS) return;
    this.current = now;               // in-memory update BEFORE write
    this.#pv.write(this.current);     // seam's try/catch swallows setItem throw silently
    // stamp-outside-try semantics preserved: this.current = now happens before pv.write,
    // so a setItem throw does NOT revert this.current. calculator-store.test.ts line 134-136 passes.
  }

  clear(): void {
    this.current = null;
    this.#pv.remove();               // seam's try/catch swallows removeItem throw
  }
}
```

**Codec vs recover for lastEdited:** D-07/D-08 recommend `{serialize: String, deserialize: Number}` codec. However, a bare `codec.deserialize = Number` would return `0` for an empty string (Number('') = 0) and the class constructor would then set `this.current = 0` (since `isFinite(0) = true`). The current constructor guards with `if (raw)` which treats empty string as falsy → null. Using `recover` instead avoids this edge case and matches the current behavior exactly. [VERIFIED: analysis]

If the planner prefers the D-07 custom codec approach, the class constructor must add:
```typescript
const raw = localStorage.getItem(key);  // raw null-probe to detect absence vs '0'
const n = this.#pv.read();              // Number('') = 0, Number(null-path) = defaultValue
this.current = (raw !== null && Number.isFinite(n)) ? n : null;
```
The `recover` approach is simpler and avoids the extra null-probe. Either satisfies D-08's "byte-identical stored bytes" requirement.

**stamp() "outside-try" semantics preserved (VERIFIED):**
The current `CalculatorStore.persist()` is:
```typescript
try { localStorage.setItem(key, JSON.stringify(current)); } catch {}
this.lastEdited.stamp();   // stamp OUTSIDE the try
```
After migration, `stamp()` becomes:
```typescript
this.current = now;         // state update
this.#pv.write(this.current);   // seam try/catch — write throw is silent
```
`calculator-store.test.ts` line 125-137 checks: "setItem throws → persist() silent AND lastEdited.stamp() still runs". The `setItem` spy makes `this.#pv.write` fail silently. But `this.current = now` was already set BEFORE `pv.write()`. So `store.lastEdited.current` is a valid number. Test passes. [VERIFIED: calculator-store.test.ts lines 125-137]

**Private class field for `#pv`:** TypeScript allows `#pv` as a private field typed as `ReturnType<typeof createPersistentValue<number | null>>`. Alternatively use `readonly #pv: PersistentValue<number | null>` after importing the interface. Either compiles cleanly. [VERIFIED: persistent-value.ts exports PersistentValue<T> interface]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSR localStorage guard | Custom `typeof localStorage` check in each adapter | `pv.read()/write()/remove()` | Already consolidated in seam; adding per-adapter guards reintroduces the duplication the seam was built to eliminate |
| Try/catch around setItem | Per-adapter `try { localStorage.setItem } catch {}` | `pv.write(value)` | Seam absorbs this; remove all manual try/catch blocks in the four files |
| Try/catch around getItem | Per-adapter `try { localStorage.getItem } catch {}` | `pv.read()` (with recover) | Same; seam's catch returns defaultValue silently |
| Try/catch around removeItem | Per-adapter `try { localStorage.removeItem } catch {}` | `pv.remove()` | Same |
| Custom JSON codec | `JSON.stringify({v:1,ids})` in favorites toggle | Custom codec `{serialize: (ids) => JSON.stringify({v:1,ids}), deserialize: ...}` in seam opts | Encode wrapper in codec once; don't duplicate the `{v:1,ids}` shape on every write call |

**Key insight:** The entire purpose of the migration is to remove the four hand-rolled SSR-guard + try/catch patterns. Every `try { localStorage.X } catch {}` block in the four adapter files is replaced by a seam call.

---

## Common Pitfalls

### Pitfall 1: jsonCodec on favorites writes bare array, breaking stored shape
**What goes wrong:** `pv.write(_ids)` with default `jsonCodec<CalculatorId[]>` stores `'["feeds","formula",...]'` instead of `'{"v":1,"ids":["feeds","formula",...]}'`. T-01 assertion `expect(stored).toEqual({v:1,ids:[...]})` fails.
**Why it happens:** `codec.serialize = JSON.stringify` applied to a bare `CalculatorId[]` produces a bare array string.
**How to avoid:** Use a custom codec: `{ serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids }), deserialize: (raw) => JSON.parse(raw) }`. The `recover` hook owns the read path entirely, so `deserialize` is never called — but define it for type correctness.
**Warning signs:** T-01 fails with `received: ["feeds","formula","gir","morphine-wean"]` instead of `{v:1,ids:[...]}`.

### Pitfall 2: rawStringCodec on theme stores quotes around value (FOUC break)
**What goes wrong:** Using `jsonCodec` instead of `rawStringCodec` stores `'"dark"'` (with JSON quotes). The `app.html` FOUC script checks `stored === 'dark'` — this comparison fails, and every returning dark-mode user sees the wrong theme on load.
**Why it happens:** `JSON.stringify('dark') === '"dark"'` — the string value gets JSON-quoted.
**How to avoid:** `rawStringCodec` is non-negotiable for theme, disclaimer, and the theme null-probe. The seam's `rawStringCodec.serialize = (v) => v` (identity).
**Warning signs:** Byte-assertion `expect(localStorage.getItem('nicu_assistant_theme')).toBe('dark')` fails with `'"dark"'`.

### Pitfall 3: theme init() loses prefers-color-scheme fallback
**What goes wrong:** `pv.read()` returns `'light'` (defaultValue) when nothing is stored. Without a null-probe, init() cannot distinguish "stored light" from "nothing stored". A new dark-mode user gets light theme.
**Why it happens:** `rawStringCodec.deserialize` returns the stored string verbatim. `pv.read()` cannot distinguish stored `'light'` from the default `'light'`.
**How to avoid:** Keep a single guarded `localStorage.getItem('nicu_assistant_theme')` null-probe in `init()`, identical to favorites' pattern. Only use `pv.write()` in `set()`.
**Warning signs:** New users who prefer dark mode always get light theme on first visit.

### Pitfall 4: Removing the favorites null-probe breaks T-01 first-run write-back
**What goes wrong:** Removing the `if (raw === null) pv.write(recovered)` line means defaults are NOT persisted on first run. T-01 asserts `expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()` after `init()` with empty storage.
**Why it happens:** `recover(null)` returns `defaultIds()` but does NOT write back. The caller must explicitly write-back on first-run. [VERIFIED: favorites.svelte.ts line 123]
**How to avoid:** Keep the null-probe + write-back pattern from D-05a exactly.
**Warning signs:** T-01 fails: `received: null` for `localStorage.getItem(STORAGE_KEY)` after `init()`.

### Pitfall 5: disclaimer v1 key deleted or overwritten
**What goes wrong:** Calling `pvV1.write()` or `pvV1.remove()` erases the audit trail. A v1 user who acknowledged re-sees the disclaimer.
**Why it happens:** Easy to confuse which seam instance is v1 vs v2, especially in a two-instance pattern.
**How to avoid:** Name the instances clearly (`pvV1`, `pvV2`). Add a code comment: `// READ-ONLY — never write or remove`. Only `pvV2.write('true')` is ever called.
**Warning signs:** `localStorage.getItem('nicu_assistant_disclaimer_v1')` is null after `disclaimer.init()` when it started as `'true'`.

### Pitfall 6: lastEdited codec deserialization of '' (empty string) returns 0 instead of null
**What goes wrong:** If using `{serialize: String, deserialize: Number}` codec, `Number('') = 0` and `isFinite(0) = true`, so constructor sets `this.current = 0` instead of `null`.
**Why it happens:** The current constructor guards with `if (raw)` which treats empty string as falsy. The codec's `deserialize` does not replicate this guard.
**How to avoid:** Use the `recover` hook approach: `recover: (raw) => !raw ? null : (Number.isFinite(Number(raw)) ? Number(raw) : null)`. Handles null, empty string, and non-finite values identically to the current code.
**Warning signs:** `calculator-store.test.ts` line 152 fails: `expect(store.lastEdited.current).toBeNull()` after reset, OR constructor returns 0 instead of null on an empty-string stored value.

### Pitfall 7: T-18 double getItem call when spy is active
**What goes wrong (minor):** If the favorites `init()` null-probe catches the getItem throw and sets `raw = null`, then `pv.read()` also calls getItem (which also throws with the spy active). This is fine — seam's catch returns `opts.defaultValue = defaultIds()`. T-18 still passes because `defaultIds() === recover(null)`.
**Why it can confuse an executor:** Two calls to `getItem` in one `init()` invocation; one throws in the probe, one throws inside the seam. Both are caught silently.
**How to avoid:** No action needed; the result is identical. Document in code comment if needed.

### Pitfall 8: Importing persistent-value.ts with wrong extension
**What goes wrong:** `import ... from './persistent-value.ts'` instead of `'./persistent-value.js'` causes SvelteKit/Vite module resolution errors.
**Why it happens:** SvelteKit convention requires `.js` extension even for TypeScript source files. [VERIFIED: project convention, favorites.svelte.ts lines 5-6 use `.js` extensions]
**How to avoid:** Use `import { createPersistentValue, rawStringCodec } from './persistent-value.js'`.

---

## Post-Migration Verification

### Grep gate (planner must include as a verification step)
```bash
grep -r 'localStorage' src/ --include='*.ts' --include='*.svelte.ts' --include='*.svelte' \
  | grep -v '\.test\.' | grep -v 'node_modules'
```
Expected files after Phase 56:
- `src/lib/shared/persistent-value.ts` — the seam (correct)
- `src/lib/shell/calculator-store.svelte.ts` — Phase 57 (correct)
- `src/lib/shared/favorites.svelte.ts` — ONE `localStorage.getItem` null-probe in `init()` (allowed exception, D-05a)
- `src/lib/shared/theme.svelte.ts` — ONE `localStorage.getItem` null-probe in `init()` (allowed exception, see Pitfall 3)

Any other file appearing here is a migration error.

### Byte-identity assertions (planner should add as part of verification)
```typescript
// theme: stored value must be unquoted
theme.set('dark');
expect(localStorage.getItem('nicu_assistant_theme')).toBe('dark');   // NOT '"dark"'

// disclaimer: stored value must be literal 'true' (not JSON true)
disclaimer.acknowledge();
expect(localStorage.getItem('nicu_assistant_disclaimer_v2')).toBe('true');   // NOT 'true' (JSON)

// favorites: stored value must wrap ids in {v:1,...}
favorites.init();
const stored = JSON.parse(localStorage.getItem('nicu:favorites')!);
expect(stored).toMatchObject({ v: 1, ids: expect.any(Array) });

// lastEdited: stored value must be a bare number string
const store = new CalculatorStore({ storageKey: 'test', defaults: () => ({}) });
store.persist();
expect(typeof localStorage.getItem('test_ts')).toBe('string');
expect(Number.isFinite(Number(localStorage.getItem('test_ts')))).toBe(true);
```

### Regression tests that MUST stay green unchanged
```bash
pnpm vitest run src/lib/shared/favorites.test.ts   # T-01..T-21, SAFE-02, SAFE-03
pnpm vitest run src/lib/shell/calculator-store.test.ts
pnpm vitest run src/lib/shared/components/DisclaimerBanner.test.ts  # scenarios 1-6
```

---

## Code Examples

### Module-scope pv instance pattern (D-01) [VERIFIED: CONTEXT.md D-01]

Every adapter follows this shape:
```typescript
// At module scope — before the $state declarations
const pv = createPersistentValue<T>({
  key: 'the-storage-key',
  defaultValue: theDefault,
  codec: rawStringCodec,   // or custom codec
  recover: optionalHook    // only for favorites/lastEdited
});

// $state at module scope (unchanged)
let _value = $state<T>(theDefault);

// Accessors delegate to pv, not localStorage
export const myStore = {
  set(value: T): void {
    _value = value;
    pv.write(value);      // replaces: try { localStorage.setItem(key, serialize(value)) } catch {}
  },
  init(): void {
    _value = pv.read();   // replaces: const raw = localStorage.getItem(key); ... deserialize(raw)
  }
};
```

### Two-instance disclaimer pattern (D-04) [VERIFIED: CONTEXT.md D-04 + source analysis]

```typescript
const pvV1 = createPersistentValue<string>({ key: DISCLAIMER_KEY_V1, defaultValue: '', codec: rawStringCodec });
const pvV2 = createPersistentValue<string>({ key: DISCLAIMER_KEY_V2, defaultValue: '', codec: rawStringCodec });
// pvV1 = READ-ONLY. pvV2 = read + write.

init(): void {
  const v1 = pvV1.read();   // '' or 'true'
  const v2 = pvV2.read();   // '' or 'true'
  _acknowledged = v2 === 'true' || v1 === 'true';
  if (v1 === 'true' && v2 !== 'true') pvV2.write('true');
  _initialized = true;
}
```

### Per-instance class pv (D-07) [VERIFIED: CONTEXT.md D-07 + LastEdited source]

```typescript
export class LastEdited {
  current = $state<number | null>(null);
  #key: string;
  #pv: PersistentValue<number | null>;

  constructor(key: string) {
    this.#key = key;
    this.#pv = createPersistentValue<number | null>({
      key: this.#key,
      defaultValue: null,
      recover: (raw) => {
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      }
    });
    this.current = this.#pv.read();
  }
}
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | theme `init()` requires a null-probe for the prefers-color-scheme fallback (Option A) | MIG-01 pattern | If Option B (just pv.read()) is deemed acceptable, theme could skip the null-probe; but new dark-mode users would get light theme on first visit — behavior regression |

**All other claims in this research were verified directly from source code.** No external sources consulted.

---

## Open Questions (RESOLVED)

1. **lastEdited codec form (D-07 vs recover hook)** — RESOLVED: recover hook.
   - What we know: Both `{serialize:String, deserialize:Number}` codec and a `recover` hook produce byte-identical stored values. The `recover` approach handles the `if (!raw)` guard more cleanly.
   - What's unclear: D-07/D-08 explicitly recommend the codec form; D-07 says "guard non-finite via the class (not the seam)".
   - RESOLVED: Use the `recover` hook approach (`(raw) => !raw ? null : Number.isFinite(Number(raw)) ? Number(raw) : null`) to avoid the `Number('') === 0` pitfall and match current behavior exactly. CONTEXT D-08 lists codec-vs-recover as Claude's Discretion; the plan (56-01 Task 2) chooses the recover hook.

2. **theme null-probe vs full raw read in init()** — RESOLVED: keep the raw null-probe.
   - What we know: `pv.read()` with `rawStringCodec` returns `'light'` (defaultValue) for both "nothing stored" and "stored light". Prefers-color-scheme only matters when nothing is stored.
   - What's unclear: CONTEXT.md D-02 says "init() calls pv.read() then applies prefers-color-scheme fallback when nothing stored" — but how does init() know "nothing stored" without a raw probe?
   - RESOLVED: Keep one allowed raw `localStorage.getItem` null-probe in `init()` (consistent with D-05a for favorites). The plan (56-01 Task 1) keeps the existing probe; this is one of the two documented allowed direct-localStorage exceptions after Phase 56.

---

## Environment Availability

Step 2.6: SKIPPED — this phase makes no changes to external tooling. All changes are source file edits to four `.svelte.ts` files. Build tools (pnpm, Vite, SvelteKit) and test runner (Vitest 4.1.4) are already installed and verified green (436/436 tests passing). [VERIFIED: vitest run output]

---

## Security Domain

`security_enforcement` is not set to `false` in `.planning/config.json`. However, this phase makes no changes to authentication, session management, cryptography, or data validation that would introduce new attack surfaces. The migration replaces direct `localStorage` calls with seam-routed calls — the same data is stored, under the same keys, with the same access control (browser-level storage, same-origin policy unchanged). No ASVS categories are newly applicable.

The seam itself (`persistent-value.ts`) was audited in Phase 55 (SEAM-04 tests cover quota errors, private-mode throws, SSR guard, parse-failure fallback). Phase 56 adds no new persistence logic — it wires existing logic through the seam.

---

## Sources

### Primary (HIGH confidence — all verified from source code)
- `src/lib/shared/persistent-value.ts` — full API, codec types, recover hook contract, rawStringCodec behavior
- `src/lib/shared/theme.svelte.ts` — current behavior spec for MIG-01
- `src/lib/shared/disclaimer.svelte.ts` — current behavior spec for MIG-02
- `src/lib/shared/favorites.svelte.ts` — current behavior spec for MIG-03 including null-probe pattern
- `src/lib/shared/lastEdited.svelte.ts` — current behavior spec for MIG-04
- `src/lib/shared/favorites.test.ts` — T-01..T-21, SAFE-02, SAFE-03 (regression contract)
- `src/lib/shell/calculator-store.test.ts` — regression contract for MIG-04
- `src/lib/shared/components/DisclaimerBanner.test.ts` — existing disclaimer behavior coverage
- `src/app.html` — FOUC script line 10-12 (raw `localStorage.getItem` + `=== 'dark'` comparison)
- `.planning/phases/56-migrate-shared-singletons/56-CONTEXT.md` — locked decisions D-01..D-08
- `.planning/phases/55-persistence-seam/55-PATTERNS.md` — established codebase patterns
- `pnpm vitest run` — 436/436 green baseline confirmed

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — verified in source; no new packages
- Architecture: HIGH — all patterns verified from existing code; seam API read in full
- Pitfalls: HIGH — derived from direct code analysis + test contract tracing
- Test compatibility: HIGH — T-18/T-19/T-01 flows traced call-by-call through new code paths

**Research date:** 2026-05-28
**Valid until:** This research is valid until the seam (`persistent-value.ts`) or any of the four adapter files changes. No external dependencies — valid indefinitely for this codebase state.
