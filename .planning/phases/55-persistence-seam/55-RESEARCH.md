# Phase 55: Persistence Seam — Research

**Researched:** 2026-05-28
**Domain:** TypeScript module design, localStorage guard patterns, Vitest jsdom testing
**Confidence:** HIGH — all findings grounded in direct codebase reading; no web research needed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Seam is NOT JSON-only. Per-instance codec (`serialize: (T) => string` / `deserialize: (string) => T`) defaults to JSON but allows raw-string (identity) codec. Theme/lastEdited/disclaimer store RAW strings today; the FOUC inline script in `src/app.html:10` reads `nicu_assistant_theme` as a raw string with NO `JSON.parse` — a JSON-always seam would write `"\"light\""` and silently break no-flash theme boot.
- **D-02:** Migrate hook signature is `recover?: (raw: string | null) => T`. It operates on raw string BEFORE deserialize and fully owns the read path when present. Matches `favorites.recover(raw: string | null): CalculatorId[]` verbatim.
- **D-03:** Disclaimer's cross-key v1→v2 orchestration stays in the adapter (Phase 56), not the seam. The seam reads/writes a single key per instance.
- **D-04:** Build a NEW standalone `PersistentValue<T>` module; do NOT widen `CalculatorStore<T>`.
- **D-05:** Location `src/lib/shared/persistent-value.ts`; co-located test `src/lib/shared/persistent-value.test.ts`.
- **D-06:** Plain `.ts`, NOT `.svelte.ts`. The seam holds no rune.
- **D-07:** Single guard: `typeof localStorage === 'undefined'` short-circuit on every path + try/catch swallowing errors silently. `read` returns default on guard-miss or throw; `write`/`remove` are silent no-ops.

### Claude's Discretion

- Exact API surface: object factory `createPersistentValue(opts)` vs. class `new PersistentValue(opts)` — researcher/planner may choose whichever matches prevailing codebase style.
- Whether `read` takes the default as a constructor option vs. per-call argument.
- Test framework specifics (Vitest is the project standard; co-located `.test.ts`).

### Deferred Ideas (OUT OF SCOPE)

- Disclaimer two-key v1→v2 orchestration — Phase 56 adapter, not the seam.
- `CalculatorStore` refactored to sit on the seam — Phase 57.
- lastEdited stamp-outside-try + 60s debounce orchestration — adapter/Phase 57.
- Architecture review candidate 2 (config pass-throughs) — future milestone.
- ML_PER_OZ clinical constant — needs clinician sign-off.
- v1.15.1 SMOKE-01..10 — independent of this storage-layer phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEAM-01 | `PersistentValue<T>` seam with guarded `read`/`write`/`remove` — single SSR/private-mode guard | D-07 guard pattern lifted from `calculator-store.svelte.ts:43,61,76` verbatim |
| SEAM-02 | Parse failure (invalid JSON, security error) falls back to supplied default, never throws | Existing `try/catch` + fallback pattern in `calculator-store.svelte.ts:44-56` |
| SEAM-03 | Custom recover/migrate hook transforms stored data on read; expressive enough for disclaimer v1→v2 AND favorites 6-step recovery | D-02: hook signature `(raw: string | null) => T` matches `favorites.recover` exactly |
| SEAM-04 | Co-located tests: SSR guard, quota/private-mode write throw, parse-failure fallback, migrate hook | Test patterns confirmed: `vi.stubGlobal`, `vi.spyOn(Storage.prototype)` — see Section 3 |
</phase_requirements>

---

## Summary

Phase 55 creates one small TypeScript file — `src/lib/shared/persistent-value.ts` — and its co-located test. The seam is a pure read/write/remove helper with no Svelte rune. Every design decision is already locked in CONTEXT.md (D-01..D-07). This research answers the five implementation questions the planner needs: (1) API surface, (2) codec design, (3) how to test the SSR/private-mode guard in jsdom, (4) what the representative migrate-hook test fixtures should look like, and (5) grep-scope clarification for Success Criterion 1.

The codebase already has the exact patterns needed. The seam consolidates them — it invents nothing new.

**Primary recommendation:** Use an object factory `createPersistentValue<T>(opts)` returning `{ read, write, remove }`, with `defaultValue` in the constructor options (not per-call). This matches the closure-object style of `theme`, `disclaimer`, and `favorites`, avoids `this`-binding pitfalls in tests, and makes the codec optional with a sensible default.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| localStorage guard (SSR + private mode) | Shared library (seam) | — | Single implementation replaces 5 copies across `theme`, `disclaimer`, `favorites`, `lastEdited`, `CalculatorStore` |
| JSON codec default | Seam | — | Seam owns default; adapter overrides by passing identity codec |
| Raw-string codec | Adapter (via option) | Seam | Seam provides the hook; adapter supplies `{ serialize: (v) => v, deserialize: (s) => s }` |
| Migrate/recover hook | Adapter (via option) | Seam | Seam provides the extension point; adapter supplies the function |
| `$state` reactive state | Adapter (.svelte.ts) | — | Seam holds NO rune; adapters keep their own `$state` and call seam at read/write time |
| Timing of init (onMount vs. eager) | Adapter | — | Seam is init-agnostic; adapter decides when to call `read` |

---

## 1. API Surface

**Recommendation: object factory `createPersistentValue<T>(opts)`**

The codebase mixes both styles: `CalculatorStore` is a class; `theme`/`disclaimer`/`favorites` are module-scope objects built with closures. The seam has no `$state`, no constructor side-effects, and no inheritance — making the factory the cleaner fit. It avoids `this`-binding surprises in test spies and matches how the four adapters are structured.

```typescript
// src/lib/shared/persistent-value.ts

export interface Codec<T> {
  serialize: (value: T) => string;
  deserialize: (raw: string) => T;
}

export interface PersistentValueOptions<T> {
  key: string;
  defaultValue: T;
  codec?: Codec<T>;          // defaults to JSON codec
  recover?: (raw: string | null) => T;  // D-02: owns the read path when present
}

export interface PersistentValue<T> {
  read(): T;
  write(value: T): void;
  remove(): void;
}

// Built-in codec constants for convenience
export const jsonCodec = <T>(): Codec<T> => ({
  serialize: JSON.stringify,
  deserialize: JSON.parse as (s: string) => T
});

export const rawStringCodec: Codec<string> = {
  serialize: (v) => v,
  deserialize: (v) => v
};

export function createPersistentValue<T>(opts: PersistentValueOptions<T>): PersistentValue<T> {
  const codec: Codec<T> = opts.codec ?? (jsonCodec<T>());

  return {
    read(): T {
      if (typeof localStorage === 'undefined') return opts.defaultValue;
      try {
        const raw = localStorage.getItem(opts.key);
        if (opts.recover) {
          // D-02: recover owns the read path when present
          return opts.recover(raw);
        }
        if (raw === null) return opts.defaultValue;
        return codec.deserialize(raw);
      } catch {
        return opts.defaultValue;
      }
    },

    write(value: T): void {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(opts.key, codec.serialize(value));
      } catch {
        // Silent: quota exceeded or private browsing
      }
    },

    remove(): void {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.removeItem(opts.key);
      } catch {
        // Silent: security error or private browsing
      }
    }
  };
}
```

**Why `defaultValue` in constructor, not per-call:**
- The default is logically part of the instance's identity (what type `T` is, what a missing key means). Making it per-call would allow accidental inconsistency across multiple `read()` calls.
- Matches how `CalculatorStore` captures `defaults` in the constructor.
- Matches how `favorites` has a module-level `defaultIds()`.

**Why NOT a class:**
- No inheritance needed. No instance methods that depend on `this` beyond the closure already captured in the factory.
- `vi.spyOn` works cleanly on the returned object methods; class prototype spying requires more ceremony.
- All four adapters in `src/lib/shared/` are closure-object style. Consistency with neighbors matters.

---

## 2. Codec Design (D-01)

**Pattern confirmed from codebase:**

```typescript
// JSON codec (default) — used by favorites today
codec: jsonCodec<T>()
// or simply: omit codec option entirely

// Raw-string codec — used by theme, disclaimer, lastEdited today
codec: rawStringCodec   // only valid when T = string
```

**How `recover` composes with `codec` (D-02):**

When `recover` is present, it **replaces** the entire deserialize+fallback path. The codec's `deserialize` is NOT called:

```
read() path:
  guard miss → return defaultValue
  getItem throws → return defaultValue (catch block)
  recover present → return recover(raw)     // raw may be null
  recover absent, raw null → return defaultValue
  raw present → codec.deserialize(raw)      // may throw → catch → defaultValue
```

This is exactly what `favorites.recover` does: it takes `(raw: string | null) => CalculatorId[]` and handles all cases itself (null→defaults, parse-try, shape validation, filter, cap, empty→defaults). The seam trusts `recover` to be total (never throw) — if `recover` itself throws, the outer try/catch returns `defaultValue` as a last resort.

**TypeScript typing note for `rawStringCodec`:**

`rawStringCodec` has type `Codec<string>`. When `T = string`, the codec is type-compatible. When `T` is an object type, using `rawStringCodec` would be a type error at the call site — which is the correct constraint. The TypeScript generic enforces correct codec choice.

**Edge case: `JSON.parse('null')` returns `null`:**

If someone stores the literal string `"null"`, `JSON.parse('null')` returns `null` (JavaScript `null`), not the TypeScript default. For the four adapters in scope, this is not a real scenario:
- `theme`: uses raw codec, value is `'light'` or `'dark'`, never `null`
- `favorites`: stored JSON is `{v:1, ids:[...]}`, never `null`
- `disclaimer`: uses raw codec, value is `'true'`, never `null`
- `lastEdited`: uses raw codec, value is a numeric string, never `null`

If a future adapter stores `null` as JSON, the recover hook is the right place to handle it. The seam's default path (`raw === null → defaultValue`) already handles the "nothing stored" case. The `JSON.parse('null') === null` edge case only matters if someone deliberately stored null — document as a known edge case in code comments.

**Edge case: empty string stored:**

`localStorage.getItem(key)` returns `''` (not `null`) if someone called `localStorage.setItem(key, '')`. With the JSON codec, `JSON.parse('')` throws — the catch block returns `defaultValue`. With the raw codec, `''` is returned as the stored value. This is correct behavior for both.

---

## 3. Testing the SSR/Private-Mode Guard in jsdom (SEAM-04)

**Vitest config:** `environment: 'jsdom'`, `globals: true`, `setupFiles: ['src/test-setup.ts']`. jsdom provides `localStorage` by default.

**Three test scenarios and proven patterns from this codebase:**

### Scenario A: SSR guard (`typeof localStorage === 'undefined'`)

Pattern used in `calculator-store.test.ts:177`:

```typescript
// PROVEN in this codebase — works with jsdom + vitest globals
vi.stubGlobal('localStorage', undefined);
// ... exercise code ...
vi.unstubAllGlobals(); // in afterEach
```

`vi.stubGlobal` replaces the global; `typeof localStorage` evaluates to `'undefined'`, triggering the guard.

**Critical ordering note** (from `calculator-store.test.ts:21-23`): Call `vi.unstubAllGlobals()` BEFORE `localStorage.clear()` in `afterEach`. If `localStorage` is still stubbed as `undefined` when you call `.clear()`, you get a TypeError. The existing test already models this exact pattern.

### Scenario B: `setItem` throwing (quota exceeded / private mode)

Pattern used in `favorites.test.ts:187-190` and `calculator-store.test.ts:128-131`:

```typescript
const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
  throw new DOMException('QuotaExceededError');
  // or: throw new Error('quota exceeded');
});
// ... exercise write() — should be silent no-op ...
spy.mockRestore();
```

`vi.spyOn(Storage.prototype, ...)` is the established pattern. Both `Error` and `DOMException` work for testing; the seam's catch block is catch-all.

### Scenario C: `getItem` throwing (security error)

Pattern used in `favorites.test.ts:176-181`:

```typescript
const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
  throw new Error('private browsing');
});
// ... exercise read() — should return defaultValue ...
spy.mockRestore();
```

### Scenario D: `getItem` returning invalid JSON (SEAM-02)

No spy needed — direct `localStorage.setItem` before the test:

```typescript
localStorage.setItem('test-key', '{malformed json');
// ... exercise read() — should return defaultValue ...
```

Pattern used extensively in `favorites.test.ts:38-40` and `calculator-store.test.ts:106-112`.

**Test file pattern — no `vi.resetModules()` needed:**

Unlike the adapter singletons (`favorites`, `disclaimer`) that have module-scope `$state`, `persistent-value.ts` is a PLAIN `.ts` file with no top-level state. Each call to `createPersistentValue()` creates a fresh closure. Tests can use static imports — no `vi.resetModules()` + dynamic import dance required. This simplifies the test file significantly.

**Cleanup pattern:**

```typescript
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();   // BEFORE localStorage.clear()
  vi.restoreAllMocks();
  localStorage.clear();
});
```

---

## 4. Representative Migrate-Hook Test Fixtures (SC-3 / SEAM-04)

The seam's own tests MUST NOT import the real adapters. Two fixture hooks are needed:

### Fixture 1: disclaimer-style v1→v2 (raw string transform)

```typescript
// Represents disclaimer's "any truthy-raw-string → boolean" pattern
const disclaimerLikeRecover = (raw: string | null): boolean => {
  if (raw === null) return false;
  return raw === 'true';
};

// Test: stored 'true' → returns true
localStorage.setItem('test-key', 'true');
const pv = createPersistentValue({
  key: 'test-key',
  defaultValue: false,
  codec: rawStringCodec,   // or no codec if recover owns read path entirely
  recover: disclaimerLikeRecover
});
expect(pv.read()).toBe(true);

// Test: stored null → returns false (default)
localStorage.clear();
expect(pv.read()).toBe(false);

// Test: stored unrecognized value → returns false
localStorage.setItem('test-key', 'yes');
expect(pv.read()).toBe(false);
```

### Fixture 2: favorites-style filter-and-cap (JSON + shape validation)

```typescript
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

// Test: valid stored array passes through (order preserved)
localStorage.setItem('test-key', JSON.stringify({ v: 1, ids: ['c', 'b'] }));
const pv2 = createPersistentValue({
  key: 'test-key',
  defaultValue: ['a', 'b', 'c'] as string[],
  recover: favoritesLikeRecover
});
expect(pv2.read()).toEqual(['c', 'b']);

// Test: unknown id filtered out
localStorage.setItem('test-key', JSON.stringify({ v: 1, ids: ['b', 'unknown', 'c'] }));
expect(pv2.read()).toEqual(['b', 'c']);

// Test: over-cap truncated
localStorage.setItem('test-key', JSON.stringify({ v: 1, ids: ['a', 'b', 'c', 'd'] }));
expect(pv2.read()).toEqual(['a', 'b', 'c']);

// Test: invalid JSON → defaults
localStorage.setItem('test-key', '{bad');
expect(pv2.read()).toEqual(['a', 'b', 'c']);

// Test: null raw → defaults
localStorage.clear();
expect(pv2.read()).toEqual(['a', 'b', 'c']);
```

These fixtures prove the hook signature is expressive enough for both SEAM-03 migration patterns without importing any real adapter.

---

## 5. Behavior-Preservation Proof

**Theme FOUC safety (D-01):**

The FOUC inline script at `src/app.html:10` does:
```javascript
var stored = localStorage.getItem('nicu_assistant_theme');
var isDark = stored ? stored === 'dark' : prefersDark;
```

It compares the raw string `stored === 'dark'`. If the seam used JSON codec, `theme.svelte.ts` would write `JSON.stringify('light')` = `'"light"'` (with quotes), and the comparison `'"light"' === 'dark'` would be false — both themes would always fall through to `prefersDark`. The FOUC script would break silently.

With `rawStringCodec`, `write('light')` stores `'light'` (no quotes), matching the FOUC script's expectation byte-for-byte. Phase 56's theme migration will use `codec: rawStringCodec` — the FOUC script is unchanged.

**`src/app.html` is NOT processed by the SvelteKit compiler or Vite for this inline script.** It is delivered verbatim. No build-time substitution of `localStorage.getItem` occurs. The raw-string requirement is immutable for the lifetime of this app.

**TypeScript generic constraint with `rawStringCodec`:**

`rawStringCodec` has type `Codec<string>`. The factory `createPersistentValue<T>` requires `codec?: Codec<T>`. When `T = string`, TypeScript accepts `rawStringCodec`. When `T = number` or an object type, TypeScript will error at the call site — correct. For `lastEdited` (which stores a number as a string), the adapter does its own `Number(raw)` coercion after reading — the seam stores and returns the raw numeric string (`'1748465400000'`). The seam type is `string`; coercion to `number` is adapter responsibility.

---

## 6. Pitfalls

### Pitfall 1: `.svelte.ts` vs. `.ts` import compatibility

**What goes wrong:** Someone might worry that importing `persistent-value.ts` (plain TS) from `theme.svelte.ts` (Svelte preprocessed) causes a compile error.

**Why it doesn't:** SvelteKit's `@sveltejs/kit/vite` plugin processes `.svelte.ts` files through the Svelte preprocessor, which transforms rune syntax. Plain `.ts` imports are passed through as-is by Vite's normal TypeScript handling. A `.svelte.ts` file CAN import from a `.ts` file without issues — this is the standard pattern. The `$lib` alias resolves both. No preprocessor issue.

**Confirmed by:** `CalculatorStore` in `calculator-store.svelte.ts` imports `LastEdited` from `lastEdited.svelte.ts`; `favorites.svelte.ts` imports `CALCULATOR_REGISTRY` from `registry.js`. Plain-TS-from-svelte-TS imports are universal in this codebase.

### Pitfall 2: `JSON.parse('null')` returns `null`

**What goes wrong:** If the stored value is the literal string `"null"`, `JSON.parse('null')` returns JavaScript `null`, NOT the TypeScript `defaultValue`. The consumer gets `null` typed as `T`.

**How to avoid:** The four Phase 56 adapters do not store `"null"` intentionally. Document this in a code comment. If a future adapter needs to store a nullable type, the `recover` hook is the correct place to handle the null case explicitly.

**Warning signs:** TypeScript `strict` mode won't catch this because `null` is assignable to most types when `strictNullChecks` is off; but this project uses strict TS — careful with `T` that includes `| null`.

### Pitfall 3: The SC-1 grep must exclude test files AND `calculator-store.svelte.ts`

**What goes wrong:** ROADMAP Success Criterion 1 says "four shared singletons are the only remaining direct localStorage callers" after Phase 55. A naive grep of `src/` would find 5 non-test callers (the 4 singletons + `calculator-store.svelte.ts`) PLUS multiple test files — and now also `persistent-value.ts` itself.

**Correct grep scope:**

```bash
grep -rn "localStorage" src \
  --include="*.ts" --include="*.svelte.ts" --include="*.svelte" \
  --exclude="*.test.ts" --exclude="*.spec.ts"
```

Expected results AFTER Phase 55 (before Phase 56):
- `src/lib/shared/persistent-value.ts` — the seam itself (intended direct caller)
- `src/lib/shared/theme.svelte.ts` — not yet migrated (Phase 56)
- `src/lib/shared/disclaimer.svelte.ts` — not yet migrated (Phase 56)
- `src/lib/shared/favorites.svelte.ts` — not yet migrated (Phase 56)
- `src/lib/shared/lastEdited.svelte.ts` — not yet migrated (Phase 56)
- `src/lib/shell/calculator-store.svelte.ts` — migrates in Phase 57, not 56

SC-1's "four shared singletons are the only remaining direct localStorage callers" is the **post-Phase-56** gate, not post-Phase-55. After Phase 55, the grep baseline is: 5 non-test callers + the new seam. SC-1 verifies this AGAIN after Phase 56.

**After Phase 55 specifically (the Phase 55 success criterion should be):** `persistent-value.ts` exists; no ADAPTER has yet been migrated; the seam has passing tests. The SC-1 grep is a Phase 56 gate, not a Phase 55 gate. The planner should frame Phase 55 SC-1 as: "The seam module exists and its tests pass; the grep confirms NO migration has happened yet — adapters migrate in Phase 56."

### Pitfall 4: `recover` hook throwing unexpectedly

**What goes wrong:** If a `recover` hook contains a bug and throws, the outer try/catch in `read()` returns `defaultValue`. This is the correct behavior (behavior-preserving degradation) but it may mask bugs during Phase 56 migration work.

**How to avoid:** The seam test fixtures (Section 4) test both the happy path and error paths of representative `recover` hooks. Phase 56 adapters should have their own tests (they already exist: `favorites.test.ts`) that stay green.

### Pitfall 5: `vi.unstubAllGlobals()` ordering in afterEach

**What goes wrong:** If `localStorage.clear()` runs BEFORE `vi.unstubAllGlobals()` in `afterEach`, and a previous test stubbed `localStorage` as `undefined`, the `clear()` call throws TypeError.

**How to avoid:** Always order `afterEach` as: `vi.unstubAllGlobals()` first, then `vi.restoreAllMocks()`, then `localStorage.clear()`. This is already the pattern in `calculator-store.test.ts:19-25` — copy it exactly.

---

## Standard Stack

No new packages. This phase introduces zero new dependencies.

```
src/lib/shared/persistent-value.ts     — new file (pure TS, no imports except possibly none)
src/lib/shared/persistent-value.test.ts — new file (imports from vitest, no new packages)
```

The seam has no imports at all — it uses the browser's `localStorage` global directly, which is the established pattern from every existing adapter. Pure TypeScript module with no runtime dependencies.

---

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages.

---

## Architecture Patterns

### System Architecture

```
[Adapter call site: e.g., theme.init()]
    |
    v
createPersistentValue<string>({ key, defaultValue, codec: rawStringCodec })
    |
    +-- read() ---> [typeof localStorage === 'undefined'?] --yes--> return defaultValue
    |                        |no
    |               [try localStorage.getItem(key)]
    |                        |throws --> return defaultValue
    |               [recover present?] --yes--> recover(raw) --> return T
    |                        |no
    |               [raw === null?] --yes--> return defaultValue
    |               [codec.deserialize(raw)] --throws--> return defaultValue
    |               return T
    |
    +-- write(v) -> [typeof localStorage === 'undefined'?] --yes--> return
    |                        |no
    |               [try localStorage.setItem(key, codec.serialize(v))]
    |                        |throws --> silent
    |               return
    |
    +-- remove() -> [typeof localStorage === 'undefined'?] --yes--> return
                             |no
                    [try localStorage.removeItem(key)]
                             |throws --> silent
                    return
```

### Recommended File Location

```
src/lib/shared/
├── persistent-value.ts        ← NEW: the seam (plain .ts, no rune)
├── persistent-value.test.ts   ← NEW: co-located tests
├── theme.svelte.ts            (unchanged in Phase 55)
├── disclaimer.svelte.ts       (unchanged in Phase 55)
├── favorites.svelte.ts        (unchanged in Phase 55)
├── lastEdited.svelte.ts       (unchanged in Phase 55)
└── types.ts
```

### Anti-Patterns to Avoid

- **Do NOT bake init-timing into the seam.** The seam is a pure read/write helper. Adapters decide when to call `read()` (eagerly in constructor, or lazily in `onMount`). The seam has no `init()` method.
- **Do NOT add a `$state` field.** The seam is plain `.ts`. Adapters own their `$state`. Adding `$state` would require `.svelte.ts`, break the D-06 decision, and couple state lifetime to the factory closure instead of the adapter module.
- **Do NOT console.warn on failures.** Existing pattern is fully silent on storage errors. No console noise. Clinical tool — don't add unexpected log output.
- **Do NOT make `recover` required.** It is optional. The JSON default-codec path (used by favorites) must work with no `recover` hook.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSR guard | Custom `isSSR()` utility | Inline `typeof localStorage === 'undefined'` | Already the established codebase pattern; adding an abstraction layer adds complexity for zero benefit |
| Codec registry | Named enum of codec types | Direct `Codec<T>` interface with exported constants | Type-safe without over-engineering; two built-in constants (`jsonCodec`, `rawStringCodec`) cover all four adapters |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vite.config.ts` (`test:` block) |
| Quick run command | `pnpm vitest run src/lib/shared/persistent-value.test.ts` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEAM-01 | `read`/`write`/`remove` behind SSR guard | unit | `pnpm vitest run src/lib/shared/persistent-value.test.ts` | ❌ Wave 0 |
| SEAM-02 | Parse failure falls back to `defaultValue` | unit | same | ❌ Wave 0 |
| SEAM-03 | Migrate hook expressive enough for both patterns | unit | same | ❌ Wave 0 |
| SEAM-04 | Co-located test file covers all four scenarios | unit | same | ❌ Wave 0 |

### Wave 0 Gaps

- `src/lib/shared/persistent-value.ts` — the seam (SEAM-01..04)
- `src/lib/shared/persistent-value.test.ts` — test surface (SEAM-04)

No new test infrastructure needed (vitest + jsdom already configured, `src/test-setup.ts` already covers localStorage, HTMLDialogElement, matchMedia, visualViewport polyfills).

---

## Security Domain

> `security_enforcement` not explicitly `false` in config — including section.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes | `try/catch` around `JSON.parse`; fallback to `defaultValue` — never let malformed stored data crash the app |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed localStorage content (XSS residue, browser extension tampering) | Tampering | try/catch around `JSON.parse` + fallback to `defaultValue` (already in design) |
| Storage quota attack (fill quota to make writes fail) | Denial of Service | Silent no-op on setItem throw — app continues functioning with in-memory defaults |

No new attack surface introduced. The seam consolidates existing guards into one audited location — this is a security improvement over 5 hand-rolled copies.

---

## Assumptions Log

No `[ASSUMED]` claims in this research. All findings verified by direct reading of the codebase source files.

---

## Open Questions

None. All five implementation questions from the research brief are answered above. The planner has everything needed to write tasks.

---

## Sources

### Primary (HIGH confidence — direct codebase reading)

- `src/lib/shell/calculator-store.svelte.ts` — guard pattern (lines 43, 61, 76), JSON codec pattern (lines 47, 63)
- `src/lib/shared/favorites.svelte.ts` — `recover(raw: string | null)` signature and 6-step pipeline (lines 36-59)
- `src/lib/shared/theme.svelte.ts` — raw-string storage proof (line 14)
- `src/lib/shared/disclaimer.svelte.ts` — raw-string `'true'` storage, two-key orchestration
- `src/lib/shared/lastEdited.svelte.ts` — raw number-string, `String(this.current)` serialize
- `src/app.html` lines 8-24 — FOUC inline script confirms raw-string requirement (no `JSON.parse`)
- `src/lib/shared/favorites.test.ts` — test patterns: `vi.spyOn(Storage.prototype)`, `localStorage.setItem(key, '{malformed')`, `vi.resetModules()` + dynamic import
- `src/lib/shell/calculator-store.test.ts` — `vi.stubGlobal('localStorage', undefined)` SSR pattern (line 177), afterEach ordering (lines 19-25)
- `src/test-setup.ts` — jsdom setup: no localStorage polyfill (jsdom provides it natively), confirmed `globals: true`, `environment: 'jsdom'`
- `vite.config.ts` lines 60-65 — Vitest configuration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; direct reading of existing code
- Architecture: HIGH — API surface derived from direct pattern analysis of 5 existing files
- Test patterns: HIGH — exact patterns verified in existing test files that already pass
- Pitfalls: HIGH — derived from existing code comments and established afterEach ordering

**Research date:** 2026-05-28
**Valid until:** Stable for this milestone; revisit if Svelte 5 or Vitest major-version changes occur.
