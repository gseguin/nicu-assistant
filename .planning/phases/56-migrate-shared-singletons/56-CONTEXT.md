# Phase 56: Migrate Shared Singletons - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

> Captured in `--auto` mode: all gray areas auto-selected, recommended option chosen for each. Decisions below are derived from reading the four adapters, the shipped `PersistentValue<T>` seam (Phase 55), `CalculatorStore`, the existing `favorites.test.ts`, and the `app.html` FOUC script. Review and adjust before planning if any default is wrong.

<domain>
## Phase Boundary

Phase 56 migrates the **four shared global singletons** onto the `PersistentValue<T>` seam shipped in Phase 55, as thin behavior-preserving adapters. Each adapter stops calling `localStorage` directly and instead delegates its guarded read/write/remove to a `createPersistentValue` instance (MIG-01..04).

**In scope — exactly four files modified:**
- `src/lib/shared/theme.svelte.ts` (MIG-01)
- `src/lib/shared/disclaimer.svelte.ts` (MIG-02)
- `src/lib/shared/favorites.svelte.ts` (MIG-03)
- `src/lib/shared/lastEdited.svelte.ts` (MIG-04)

**Explicitly NOT in scope:**
- `src/lib/shell/calculator-store.svelte.ts` — migrates in **Phase 57** (AUTO-*), NOT here. After Phase 56 it still calls `localStorage` directly; that is correct.
- The 5 `*Inputs.svelte` auto-persist `$effect` — Phase 57.
- The `app.html` FOUC inline script — stays a raw `localStorage.getItem` (it cannot import a module). See D-01.
- `pwa.svelte.ts` / `visualViewport.svelte.ts` — not localStorage adapters, out of scope.

**The hard gate (same as the whole milestone):** behavior-preserving. Byte-identical storage keys (`nicu_assistant_theme`, `nicu_assistant_disclaimer_v1`/`_v2`, `nicu:favorites`, per-state `_ts`), byte-identical persisted JSON/string shapes, zero user-visible change. **Existing `favorites.test.ts` (T-01..T-21, SAFE-02, SAFE-03) MUST stay green THROUGH the migration, not just at milestone close** (ROADMAP SC-3). Same for `calculator-store.test.ts` (lastEdited is instantiated by CalculatorStore).

</domain>

<decisions>
## Implementation Decisions

### Adapter wiring pattern (applies to all four)
- **D-01:** Each adapter creates a module-scope `const pv = createPersistentValue<T>({...})` and its accessors delegate to `pv.read()` / `pv.write(v)` / `pv.remove()`. The adapter keeps its own `$state` rune (the seam is stateless — it does NOT hold the reactive value). The seam owns ONLY the guarded localStorage I/O + codec + recover; all reactive state, DOM side-effects, defaults computation, and cross-key/debounce orchestration stay in the adapter.
  - **Why:** The seam is the floor (read/write/remove primitive); the adapter is the tenant (reactive `$state` + domain behavior). This is the exact split the seam was designed for in Phase 55 (D-04).

### Theme (MIG-01) — the FOUC dual-read constraint
- **D-02:** `theme.svelte.ts` uses ONE `createPersistentValue<string>({ key: 'nicu_assistant_theme', defaultValue: 'light', codec: rawStringCodec })`. `set()` calls `pv.write(value)`; `init()` calls `pv.read()` then applies the `prefers-color-scheme` fallback when nothing stored. The `.dark` class toggle + `data-theme` attribute sync stay in `set()` (DOM side-effect, not persistence).
- **D-03:** The `app.html` FOUC inline script is LEFT UNCHANGED — it stays a raw `var stored = localStorage.getItem('nicu_assistant_theme')` (line ~10). It runs before any module loads and cannot import the seam. `rawStringCodec` guarantees the stored bytes are `light`/`dark` (no JSON quotes), so the FOUC read still matches byte-for-byte. **This is the single most load-bearing constraint of MIG-01** — a planner/executor must verify the stored value is unquoted (a test asserting `localStorage.getItem('nicu_assistant_theme') === 'dark'` after `theme.set('dark')`).
  - **Why:** Using `jsonCodec` would write `"dark"` (quoted) and silently break the no-flash theme boot for every returning user. rawStringCodec is non-negotiable here (Phase 55 D-01).

### Disclaimer (MIG-02) — two keys, single-key seam
- **D-04:** `disclaimer.svelte.ts` uses TWO `createPersistentValue<string>` instances (one for `nicu_assistant_disclaimer_v1`, one for `_v2`), both `rawStringCodec`. `init()` reads both via the seam, sets `_acknowledged = (v2 === 'true' || v1 === 'true')`, and if `v1 === 'true' && v2 !== 'true'` writes `'true'` to the v2 instance via the seam. **The v1 instance is read-only — never write or remove it (audit trail preservation, ROADMAP SC-2).** `acknowledge()` writes `'true'` to the v2 instance.
  - **Why:** D-03 (Phase 55 CONTEXT) decided cross-key v1→v2 orchestration stays in the adapter; the seam's recover hook is single-key. Two seam instances give each key its own guarded I/O while the adapter composes the two-key migration logic. The seam's silent-catch already covers the v2 write-on-migration try/catch the adapter currently hand-rolls.
  - Note: the existing values stored are the literal strings `'true'` (not JSON booleans) — rawStringCodec preserves that.

### Favorites (MIG-03) — recover hook is the migration vehicle
- **D-05:** `favorites.svelte.ts` uses ONE `createPersistentValue<CalculatorId[]>({ key: 'nicu:favorites', defaultValue: defaultIds(), codec: jsonCodec, recover: <existing recover, adapted> })`. The existing `recover(raw: string | null): CalculatorId[]` 6-step pipeline becomes the seam's `recover` hook **passed through essentially verbatim** — its signature already matches the seam exactly (Phase 55 D-02 was designed around it). `init()` calls `pv.read()` (which runs recover) then, on first-run (raw was null), writes defaults back. `toggle()`'s `persist(_ids)` becomes `pv.write(_ids)`.
  - **Subtlety (first-run write-back, D-09):** the current `init()` detects first-run by `raw === null` to seed defaults via `persist()`. The seam's `read()` does not expose whether raw was null when a recover hook is present (recover swallows null → defaults). Preserve the first-run-seeding behavior: either (a) keep a one-line raw `localStorage.getItem` probe in `init()` purely to detect null-vs-stored before calling `pv.read()`, or (b) have recover signal first-run another way. **Recommended (a):** a single guarded `localStorage.getItem(key)` null-check in `init()` is acceptable — the seam owns the value transform; the adapter may still peek for the first-run seeding decision. The planner should pick whichever keeps all of T-01 (first-run seeds + persists) AND T-02..T-21 + SAFE-02/03 green.
- **D-06:** `favorites.test.ts` stays GREEN UNCHANGED — do not edit it. The tests assert behavior (`favorites.current`, stored JSON via `localStorage.getItem`) and failure modes (T-18/T-19 spy on `Storage.prototype.getItem/setItem` throwing). The seam routes through `Storage.prototype` and updates in-memory `$state` before persisting, so all 21 + SAFE-02/03 assertions hold. **If any favorites test requires a code change to pass, that is a behavior regression — stop and reassess, do not edit the test to match.**

### lastEdited (MIG-04) — per-instance class, dynamic key, debounce stays
- **D-07:** `lastEdited.svelte.ts`'s `LastEdited` class holds ONE `createPersistentValue<number>` per instance, constructed from the dynamic key passed in (`${storageKey}_ts`, supplied by `CalculatorStore`). The numeric coercion (currently `Number(raw)` + `Number.isFinite` guard) maps onto a custom codec `{ serialize: String, deserialize: Number }` OR a `recover` hook that returns `Number.isFinite(n) ? n : <null-ish>`. The class keeps `current = $state<number | null>(null)`, the 60s `STAMP_DEBOUNCE_MS` skip logic, the stamp-outside-try ordering caller (note: the seam's `write` IS the try/catch now), and `clear()` → `pv.remove()`.
  - **Subtlety (D-08):** the current constructor stores a raw number string and reads it with `Number(raw)`, treating non-finite as `null`. A bare `jsonCodec<number>` would also parse `"123"`→123, but `String(Date.now())` is already valid JSON for a number, so EITHER codec yields byte-identical storage. **Recommended:** custom `{ serialize: String, deserialize: Number }` codec to make the raw-number-string intent explicit and match the existing stored bytes exactly; guard non-finite via the class (not the seam) so `current` stays `null` on garbage.
  - The 60s debounce and the "stamp() runs even if setItem threw" semantics are ADAPTER behavior — they do NOT move into the seam. The seam's `write` silently swallows the throw; the class still updates `current` and applies the debounce around the `pv.write` call. Preserve the `calculator-store.test.ts` green-ness (it exercises lastEdited via CalculatorStore).

### Claude's Discretion
- Whether disclaimer uses two `PersistentValue` instances vs. two inline seam calls — both satisfy D-04; planner picks the cleaner one.
- The exact lastEdited codec form (custom String/Number codec vs. recover hook) — both byte-identical; D-07 recommends the custom codec.
- Whether favorites' first-run detection uses a raw null-probe (D-05a) or a recover-signal (D-05b) — planner picks whichever keeps every favorites test green.
- Migration order / plan split: all four are independent single-file edits with no shared state. Planner may do one plan (all four) or split; they are parallel-safe (different files). Recommend a single plan or one-plan-per-adapter — not over-fragmented.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & locked decisions
- `.planning/REQUIREMENTS.md` §"MIGRATE — move the four adapters onto the seam" — MIG-01..04 acceptance language.
- `.planning/ROADMAP.md` §"Phase 56: Migrate Shared Singletons" — goal + 5 success criteria (esp. SC-2 disclaimer v1-not-deleted, SC-3 favorites.test.ts stays green, SC-5 no key/shape change).
- `.planning/phases/55-persistence-seam/55-CONTEXT.md` — the seam's design decisions D-01..D-07 (codec, recover-hook signature, single-key-seam + adapter-owns-cross-key, plain .ts).
- `.planning/STATE.md` §"Accumulated Context › Decisions" — the [v1.18] behavior-preserving hard gate (identical keys + byte shapes; existing tests green THROUGH migration).

### The seam being migrated onto (read its full public API)
- `src/lib/shared/persistent-value.ts` — `createPersistentValue<T>(opts)` → `{read, write, remove}`; `jsonCodec<T>()`, `rawStringCodec`; `recover?: (raw: string | null) => T` owns read path when present; SSR guard + silent-catch on every method.

### The four adapters being migrated (read each in full — current behavior is the spec)
- `src/lib/shared/theme.svelte.ts` — key `nicu_assistant_theme`, raw string, `get current`/`set`/`init`/`toggle`, `.dark` class + `data-theme` sync, `prefers-color-scheme` fallback.
- `src/lib/shared/disclaimer.svelte.ts` — keys `_v1`/`_v2`, raw `'true'`, v1→v2 migration (v1 NOT deleted), `acknowledged`/`initialized`/`acknowledge()`.
- `src/lib/shared/favorites.svelte.ts` — key `nicu:favorites`, JSON `{v:1, ids}`, `recover()` 6-step pipeline, 4-cap, registry-order toggle sort, module-scope `$state` seed (D-07), first-run write-back.
- `src/lib/shared/lastEdited.svelte.ts` — `LastEdited` class, dynamic `${key}_ts`, raw number string, `Number()` coercion, 60s `STAMP_DEBOUNCE_MS`, stamp-outside-try, `clear()`.

### Tests that MUST stay green (regression contract — do NOT edit to pass)
- `src/lib/shared/favorites.test.ts` — T-01..T-21 + SAFE-02 + SAFE-03 (recovery pipeline, first-run, throw modes, pert-drop). ROADMAP SC-3 names this explicitly.
- `src/lib/shell/calculator-store.test.ts` — exercises lastEdited via CalculatorStore; MIG-04 must not regress it.
- `src/app.html` (FOUC inline script ~line 10) — reads `nicu_assistant_theme` raw; MIG-01 must keep stored bytes unquoted so this still works.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **The seam itself** (`persistent-value.ts`) is the whole reusable asset — Phase 56 is "wire four adapters onto it." `rawStringCodec` (theme/disclaimer/lastEdited), `jsonCodec` default (favorites), and the `recover` hook (favorites' existing pipeline passes through verbatim).
- **favorites.recover()** already matches the seam's `recover` signature exactly — it was the design template (Phase 55 D-02). This is a near-zero-friction migration.

### Established Patterns
- **Adapter keeps `$state`, seam is stateless:** theme/disclaimer/favorites are module-scope `$state` + closure-object accessors; favorites also seeds `$state` at module scope (D-07 latent-init fix — must be preserved so SSR/pre-init paint shows default 4 favorites). lastEdited is a per-instance class with `current = $state`. None of this `$state` moves into the seam.
- **DOM side-effects stay in the adapter:** theme's `.dark`/`data-theme` toggle, prefers-color-scheme fallback are NOT persistence — they stay in `set()`/`init()`.
- **Orchestration stays in the adapter:** disclaimer's two-key v1→v2 OR + write-back-without-delete; lastEdited's 60s debounce + stamp-outside-try; favorites' registry-order toggle sort + 4-cap. The seam only does guarded I/O.

### Integration Points
- After Phase 56: a grep for direct `localStorage` callers in non-test `src/` finds exactly TWO — `persistent-value.ts` (the seam, correct) and `calculator-store.svelte.ts` (migrates in Phase 57). This is when ROADMAP Phase 55 SC-1's "four shared singletons are the only remaining direct callers" clause finally becomes... actually, after Phase 56 the four singletons are NO LONGER direct callers, so the only direct callers are the seam + calculator-store. The planner's verification grep should expect: seam + calculator-store only (the four adapters now go through the seam). The favorites first-run null-probe (D-05a), if chosen, is one allowed exception — note it explicitly so the grep gate doesn't false-positive.
- `+layout.svelte:onMount` still calls `theme.init()`, `disclaimer.init()`, `favorites.init()` unchanged — the migration is internal to each adapter; init call sites do not change.

</code_context>

<specifics>
## Specific Ideas

- The acceptance proof for behavior-preservation is the EXISTING test suite staying green plus targeted byte-shape assertions: `theme.set('dark')` → `localStorage.getItem('nicu_assistant_theme') === 'dark'` (unquoted); disclaimer v1-only user → `acknowledged === true` AND v1 key still present after init; favorites `favorites.test.ts` 100% green unchanged; lastEdited stamp writes a bare number string under `${key}_ts`.
- This is a behavior-preserving refactor — the win is locality (storage failure handled once in the seam) and leverage (one interface, four call sites). No new user-facing behavior, no new keys, no new persisted shapes.

</specifics>

<deferred>
## Deferred Ideas

- **`CalculatorStore` migrated onto the seam + the 5 `*Inputs.svelte` auto-persist `$effect` fold-in** — Phase 57 (AUTO-01..02). Independent of Phase 56.
- **`app.html` FOUC script** — intentionally never migrated (cannot import a module; raw read is correct).
- **`pwa.svelte.ts` / `visualViewport.svelte.ts`** — not localStorage adapters; out of milestone scope.
- **Release v1.18.0** — Phase 58.
- **Architecture review candidate 2 (config pass-throughs)** — future milestone.
- **v1.15.1 SMOKE-01..10 real-iPhone gate** — carries forward independently; this storage-layer phase touches no iOS surface.

</deferred>

---

*Phase: 56-Migrate Shared Singletons*
*Context gathered: 2026-05-28*
