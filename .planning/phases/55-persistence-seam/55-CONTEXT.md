# Phase 55: Persistence Seam - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

> Captured in `--auto` mode: all gray areas auto-selected, recommended option chosen for each. Decisions below are derived from reading the four adapters this seam must serve (`theme`, `disclaimer`, `favorites`, `lastEdited`), the existing `CalculatorStore<T>`, and the `app.html` FOUC inline script. Review and adjust before planning if any default is wrong.

<domain>
## Phase Boundary

Phase 55 delivers **exactly one thing**: a standalone `PersistentValue<T>` module that owns guarded localStorage `read` / `write` / `remove`, JSON serialize/parse with parse-failure fallback to a supplied default, and a custom recover/migrate hook — covered by co-located tests that become the single test surface for persistence (SEAM-01..04).

**In scope:**
- The seam module + its public API (`read`, `write`, `remove`, migrate hook).
- The seam's own co-located test file (SSR guard, write-throw, parse-failure fallback, migrate hook).

**Explicitly NOT in scope (later phases):**
- Migrating any of the four adapters onto the seam — that is **Phase 56** (MIG-01..04). After Phase 55, the four shared singletons remain the only direct `localStorage` callers; they are untouched.
- Folding auto-persist behind `CalculatorStore` — that is **Phase 57** (AUTO-01..02).
- The release wrap-up — **Phase 58**.

**The hard gate for the whole milestone (carries into 56/57):** behavior-preserving. Identical storage keys, identical persisted byte shapes, zero user-visible change. The seam must be *capable* of byte-identical reads/writes for all four adapters' existing formats, or Phase 56 cannot migrate without breaking stored data.

</domain>

<decisions>
## Implementation Decisions

### Storage format — the central decision
- **D-01:** The seam is **NOT JSON-only**. It takes a per-instance codec (`serialize: (T) => string` / `deserialize: (string) => T`) that **defaults to JSON** (`JSON.stringify` / `JSON.parse`), but allows a raw-string codec (identity) for adapters that store plain strings today.
  - **Why this is load-bearing:** theme stores `'light'`/`'dark'` as a **raw string**, lastEdited stores a **raw number string**, disclaimer stores literal `'true'` strings — none are JSON-wrapped. Critically, the FOUC inline script in `src/app.html:10` reads `localStorage.getItem('nicu_assistant_theme')` as a **raw string with no `JSON.parse`**. A JSON-always seam would write `"\"light\""` and silently break the no-flash theme boot. Forcing JSON would change stored bytes for 3 of 4 adapters and violate the behavior-preserving gate.
  - favorites already stores JSON (`{v:1, ids}`) → uses the default JSON codec.

### Migrate / recover hook signature
- **D-02:** The migrate hook operates on the **raw string (or `null`) BEFORE deserialize**: `recover?: (raw: string | null) => T`. When present, it fully owns the read path (replaces the default deserialize+fallback). When absent, `read` does default-deserialize-with-fallback.
  - **Why:** `favorites.recover(raw: string | null): CalculatorId[]` already has *exactly* this shape — null→defaults, JSON.parse-in-try, shape validation, filter-to-registry, cap, empty→defaults. Mapping the seam's hook to that signature lets favorites move onto the seam in Phase 56 by passing its existing `recover` verbatim. SEAM-03's "expressive enough for disclaimer v1→v2 AND favorites 6-step recovery" is satisfied because both are single-key raw→T transforms when expressed at the raw-string boundary.
- **D-03:** Disclaimer's cross-key v1→v2 migration stays in the **adapter**, not the seam. The seam reads/writes a single key per instance; the v1→v2 audit-trail logic (read v2, fall back to v1, write v2 without deleting v1) is multi-key orchestration the disclaimer adapter composes from two seam instances or two seam reads in Phase 56. The seam's migrate hook only needs to prove it *can* express a representative migration in its own tests (SEAM-04) — it does not need to natively model two-key flows.

### New module vs. generalize CalculatorStore
- **D-04:** Build a **new standalone `PersistentValue<T>` module**, do NOT widen `CalculatorStore<T>`.
  - **Why:** `CalculatorStore<T>` (`src/lib/shell/calculator-store.svelte.ts`) couples persistence to a `$state` rune + `LastEdited` stamping + a `merge` strategy + eager-init-in-constructor. The four shared singletons need none of that — theme syncs DOM classes, disclaimer has no `$state` data shape, favorites manages its own `$state` + registry sort, lastEdited IS the stamping layer. A new module is the clean primitive; `CalculatorStore` is a *consumer* of the same underlying pattern. Phase 57 later refactors `CalculatorStore` to sit on the seam (AUTO-*), so the relationship is "seam is the floor, CalculatorStore is one tenant" — not "seam = generalized CalculatorStore."

### File location & naming
- **D-05:** Location `src/lib/shared/persistent-value.ts`; class/factory name `PersistentValue<T>`; co-located test `src/lib/shared/persistent-value.test.ts`.
  - **Why:** It sits beside the four adapters it serves (`src/lib/shared/{theme,disclaimer,favorites,lastEdited}.svelte.ts`).
- **D-06:** Plain `.ts`, **not** `.svelte.ts`. The seam holds **no rune** — it is a pure read/write/remove helper. Adapters keep their own `$state`. (`CalculatorStore` is `.svelte.ts` only because it declares `this.current = $state<T>(...)`; the seam declares none.)

### SSR / private-mode guard shape (locked by SEAM-01)
- **D-07:** Single guard pattern matching the existing code verbatim: `typeof localStorage === 'undefined'` short-circuit on every path, plus `try/catch` swallowing security/quota errors silently. `read` returns the default on guard-miss or throw; `write`/`remove` are silent no-ops on guard-miss or throw. This is the pattern already proven in `calculator-store.svelte.ts:43,61,76` — the seam consolidates it, it does not invent a new one.

### Claude's Discretion
- Exact API surface (object factory `createPersistentValue(opts)` returning `{read, write, remove}` vs. a class `new PersistentValue(opts)`) — planner/researcher may choose whichever matches the codebase's prevailing style. `CalculatorStore` is a class; `theme`/`disclaimer`/`favorites` are object literals with closures. Either is acceptable as long as D-01..D-07 hold.
- Whether `read` takes the default as a constructor option vs. a per-call argument.
- Test framework specifics (vitest is the project standard; co-located `.test.ts`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & locked decisions
- `.planning/REQUIREMENTS.md` §"SEAM — the persistence module" — SEAM-01..04 requirement text (the literal acceptance language).
- `.planning/ROADMAP.md` §"Phase 55: Persistence Seam" — goal + 4 success criteria (what must be TRUE).
- `.planning/STATE.md` §"Accumulated Context › Decisions" — the four `[v1.18]` decisions, especially: build-order spine (SEAM before MIG), the four-different-adapters justification, the migrate-hook-must-express-both-disclaimer-v1→v2-AND-favorites-6-step requirement, and the behavior-preserving hard gate (identical keys + byte shapes).
- `.planning/PROJECT.md` §"Current Milestone: v1.18 Persistence Seam" — milestone framing (locality + leverage, not new features).

### Source files the seam must serve (read before designing the API)
- `src/lib/shell/calculator-store.svelte.ts` — the existing guarded-localStorage pattern the seam consolidates (init/persist/reset, `typeof localStorage` guard, silent try/catch). The seam is the primitive this class will later (Phase 57) sit on top of.
- `src/lib/shared/theme.svelte.ts` — **raw-string** value `'light'`/`'dark'`, key `nicu_assistant_theme`; proves D-01 (no JSON).
- `src/lib/shared/disclaimer.svelte.ts` — two-key v1→v2 migration, raw `'true'` strings; proves D-03 (cross-key stays in adapter).
- `src/lib/shared/favorites.svelte.ts` — `recover(raw: string|null): CalculatorId[]` 6-step pipeline + JSON `{v:1, ids}`; proves D-02 (hook signature) and is the JSON-codec exemplar.
- `src/lib/shared/lastEdited.svelte.ts` — raw number string + 60s stamp-debounce; another raw-codec consumer (relevant to Phase 56/57, not 55's API, but informs D-01).
- `src/app.html` §inline FOUC script (line ~10) — reads `nicu_assistant_theme` as a **raw string, no JSON.parse**. This is the concrete reason D-01 (raw-string codec) is non-negotiable.

### Existing tests that must stay green through later migration (context, not modified in 55)
- `src/lib/shared/favorites.test.ts` — the 6-step recovery + 'pert'-drop regression suite.
- `src/lib/shell/calculator-store.test.ts` — the store's persistence behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Guard + try/catch pattern** (`calculator-store.svelte.ts:43-57, 60-71, 74-84`): the exact SSR + private-mode + quota handling to lift into the seam. Don't reinvent — consolidate.
- **`favorites.recover()`** (`favorites.svelte.ts:36-59`): the canonical migrate-hook shape `(raw: string | null) => T`. The seam's hook signature should be a generalization of this so Phase 56 can pass it through unchanged.
- **JSON codec** (`calculator-store.svelte.ts:47,63` and `favorites.svelte.ts:46,63`): `JSON.parse`/`JSON.stringify` is the seam's *default* codec.

### Established Patterns
- **Eager init vs. onMount init:** `CalculatorStore` inits eagerly in its constructor (to beat child `$effect`s); the four shared singletons init from `+layout.svelte:onMount` and `favorites` also seeds `$state` at module scope (D-07 latent-init fix). The seam itself should be **init-agnostic** — it's a read/write helper, and *the adapter* decides when to call `read`. Do not bake an init-timing assumption into the seam.
- **Silent-on-failure is universal:** every existing localStorage write swallows errors silently (private mode / quota). The seam must preserve this — no throwing, no console noise.
- **Stamp-outside-try (lastEdited / CalculatorStore):** the `lastEdited.stamp()` is intentionally called even when `setItem` throws. This is adapter-level orchestration (Phase 57 concern), NOT a seam concern — the seam just exposes `write` that returns/throws-nothing.

### Integration Points
- After Phase 55: zero adapters import the seam yet (it ships with only its own tests). The four singletons in `src/lib/shared/` are the migration targets for Phase 56; `CalculatorStore` in `src/lib/shell/` is the Phase 57 target.
- Success-criterion grep (ROADMAP SC-1): "the four shared singletons are the only remaining direct `localStorage` callers" — note current direct callers also include several `.test.ts` files (expected; tests may touch localStorage directly). The grep target is **non-test source**: `theme`, `disclaimer`, `favorites`, `lastEdited`, plus `calculator-store.svelte.ts`. The seam adds itself as a new (intended) caller. Researcher should scope the grep to exclude `*.test.ts` and account for `calculator-store.svelte.ts` migrating in Phase 57, not 56.

</code_context>

<specifics>
## Specific Ideas

- The migrate hook MUST be demonstrably expressive enough for BOTH disclaimer-style migration AND favorites 6-step recovery — verified by a **representative hook in the seam's own tests** (SEAM-04 / ROADMAP SC-3), NOT by importing the real adapters (they migrate in Phase 56). Write a small fixture hook in the test that mimics a v1→v2-ish transform and a filter-and-cap transform.
- Behavior-preservation is provable now via the codec choice (D-01): the seam can round-trip a raw `'light'` string byte-for-byte, which the FOUC script depends on.

</specifics>

<deferred>
## Deferred Ideas

- **Disclaimer two-key v1→v2 orchestration** — lives in the disclaimer adapter (D-03), addressed in Phase 56 (MIG-02), not in the seam.
- **`CalculatorStore` refactored to sit on the seam** — Phase 57 (AUTO-01..02). The seam is designed as the floor it will stand on, but the refactor itself is out of Phase 55 scope.
- **lastEdited stamp-outside-try + 60s debounce orchestration** — adapter/Phase 57 behavior; the seam exposes only primitive `write`.
- **Architecture review candidate 2** (config pass-throughs) — future milestone, per REQUIREMENTS.md.
- **ML_PER_OZ clinical constant** (candidate 4) — out of scope, needs clinician sign-off.
- **v1.15.1 SMOKE-01..10 real-iPhone gate** — carries forward independently; this storage-layer phase touches no iOS surface.

</deferred>

---

*Phase: 55-Persistence Seam*
*Context gathered: 2026-05-28*
