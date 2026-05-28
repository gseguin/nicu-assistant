---
phase: 55-persistence-seam
plan: "01"
subsystem: shared-storage
tags:
  - persistence
  - localStorage
  - infrastructure
  - seam
dependency_graph:
  requires: []
  provides:
    - createPersistentValue
    - Codec
    - PersistentValueOptions
    - PersistentValue
    - jsonCodec
    - rawStringCodec
  affects:
    - Phase 56 adapter migrations (theme, disclaimer, favorites, lastEdited)
    - Phase 57 CalculatorStore refactor
tech_stack:
  added: []
  patterns:
    - object-factory closure (no class, no this)
    - SSR early-return guard + silent-catch on all three methods
    - per-instance codec (serialize/deserialize) with JSON default
    - recover hook (raw string | null) => T for migrate-and-validate patterns
key_files:
  created:
    - src/lib/shared/persistent-value.ts
    - src/lib/shared/persistent-value.test.ts
  modified: []
decisions:
  - "Object factory pattern chosen over class (consistent with theme/disclaimer/favorites closure style; no this-binding surprises in test spies)"
  - "jsonCodec<T>() is a generic function not a constant — allows TypeScript to infer T at each call site"
  - "rawStringCodec is a module-level constant (Codec<string>) — D-01 requirement for theme FOUC safety"
  - "afterEach: vi.unstubAllGlobals() before localStorage.clear() — Pitfall 5 ordering"
metrics:
  duration: "6 minutes"
  completed: "2026-05-28T17:58:13Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
  tests_added: 22
  tests_total: 432
---

# Phase 55 Plan 01: Persistence Seam — PersistentValue Module Summary

**One-liner:** `createPersistentValue<T>` factory with SSR guard + silent-catch + per-instance JSON/raw-string codec + recover hook, consolidating five hand-rolled localStorage guard copies into one audited location.

## What Was Built

Two new files with zero modifications to existing code:

1. **`src/lib/shared/persistent-value.ts`** (~120 LOC) — The persistence seam. Plain `.ts` module (no Svelte rune, no imports) exporting:
   - `Codec<T>` interface — `serialize: (value: T) => string` / `deserialize: (raw: string) => T`
   - `PersistentValueOptions<T>` interface — `key`, `defaultValue`, optional `codec`, optional `recover`
   - `PersistentValue<T>` interface — `read()`, `write(value)`, `remove()`
   - `jsonCodec<T>()` generic function returning JSON stringify/parse codec (default)
   - `rawStringCodec: Codec<string>` — identity codec for raw-string adapters (D-01)
   - `createPersistentValue<T>(opts): PersistentValue<T>` — the factory

2. **`src/lib/shared/persistent-value.test.ts`** (~250 LOC) — 22 co-located tests covering all four SEAM scenarios:
   - SSR guard (SEAM-01): read/write/remove with `vi.stubGlobal('localStorage', undefined)`
   - Parse failure fallback (SEAM-02): invalid JSON and getItem-throw return defaultValue
   - Write/remove silent on throw (SEAM-02): setItem/removeItem throws are silent no-ops
   - Recover hook disclaimer-style (SEAM-03): raw string → boolean fixture
   - Recover hook favorites-style (SEAM-03): JSON + shape validation + filter + cap fixture
   - Raw-string codec (D-01): write('dark') stores literal 'dark' without JSON quotes
   - JSON default codec: round-trip and localStorage inspection

## Design Decisions Made

| Decision | Rationale |
|----------|-----------|
| Object factory (`createPersistentValue`) over class | Consistent with `theme`/`disclaimer`/`favorites` closure-object style; no `this`-binding surprises in spies |
| `jsonCodec<T>()` as generic function, not constant | TypeScript infers `T` at each call site; a constant `jsonCodec` would require explicit generic annotation at every use |
| `rawStringCodec` as module-level constant | D-01: `app.html` FOUC inline script reads `nicu_assistant_theme` as raw string with no `JSON.parse`; rawStringCodec stores `'light'`/`'dark'` byte-for-byte |
| `recover` hook fully owns read path when present | D-02: matches `favorites.recover(raw: string | null)` signature exactly — Phase 56 can pass its existing hook through unchanged |
| `afterEach` ordering: unstub → restore → clear | Pitfall 5: SSR tests stub localStorage as `undefined`; calling `clear()` before `unstubAllGlobals()` throws TypeError |

## Verification Results

| Gate | Result |
|------|--------|
| `pnpm exec tsc --noEmit` (persistent-value) | 0 errors |
| `pnpm exec svelte-check` | 0 errors, 0 warnings (4590 files) |
| `pnpm vitest run src/lib/shared/persistent-value.test.ts` | 22/22 passed |
| `pnpm vitest run` (full suite) | 432/432 passed (410 existing + 22 new) |
| `pnpm build` | ✓ no errors |
| Files modified (non-test) | 0 — no existing file touched |

## Deviations from Plan

None — plan executed exactly as written.

Both source assertions confirmed:
- `typeof localStorage === 'undefined'` guard appears exactly 3 times (once per method) in `persistent-value.ts`
- `export function createPersistentValue` appears exactly 1 time
- 0 import statements in `persistent-value.ts`
- 0 `$state` rune in `persistent-value.ts`
- `vi.resetModules` count in test file: 0
- `await import` count in test file: 0

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced. The threat model (T-55-01: JSON.parse try/catch; T-55-02: silent setItem no-op) is fully implemented and covered by tests.

## Self-Check

### Created files exist:
- `src/lib/shared/persistent-value.ts` — FOUND
- `src/lib/shared/persistent-value.test.ts` — FOUND

### Commits exist:
- `4512dcf` — feat(55-01): add PersistentValue seam module — FOUND
- `f5cb840` — test(55-01): add co-located tests for PersistentValue seam — FOUND

## Self-Check: PASSED
