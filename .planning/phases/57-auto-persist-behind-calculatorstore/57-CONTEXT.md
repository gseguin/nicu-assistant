# Phase 57: Auto-Persist Behind CalculatorStore - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

> Captured in `--auto` mode: all gray areas auto-selected, recommended option chosen for each. Derived from reading the existing duplicated `$effect` pattern in all 5 `*Inputs.svelte`, `CalculatorStore<T>` (`src/lib/shell/calculator-store.svelte.ts`), and the post-Phase-56 `lastEdited.svelte.ts` (`LastEdited` class with seam-backed `#pv`). Review and adjust before planning if any default is wrong.

<domain>
## Phase Boundary

Phase 57 delivers EXACTLY ONE refactor: `CalculatorStore<T>` owns auto-persist, and the copy-pasted `$effect(() => { JSON.stringify(state.current); state.persist() })` is REMOVED from all 5 `*Inputs.svelte` files (AUTO-01). The drawer-only-mount persistence and the `lastEdited` 60s minute-debounce + no-effect-re-entry guarantee MUST be preserved (AUTO-02).

**In scope — exactly 6 files modified (one source, five consumers):**
- `src/lib/shell/calculator-store.svelte.ts` — add auto-persist `$effect.root()` so every instance gets it for free
- `src/lib/gir/GirInputs.svelte` — delete the per-fragment `$effect`
- `src/lib/morphine/MorphineWeanInputs.svelte` — delete
- `src/lib/fortification/FortificationInputs.svelte` — delete
- `src/lib/feeds/FeedAdvanceInputs.svelte` — delete
- `src/lib/uac-uvc/UacUvcInputs.svelte` — delete

**Explicitly NOT in scope:**
- **Migrating `CalculatorStore` ONTO the PersistentValue seam.** This was a deliberate cut — the ROADMAP's "Depends on" line for Phase 57 says "CalculatorStore already wraps the same guarded-localStorage pattern the seam formalizes; this phase folds the copy-pasted effect behind that store" — implying CalculatorStore *keeps* its direct guarded `localStorage.getItem`/`setItem`/`removeItem`. The milestone's "no consumer touches localStorage directly" wording is satisfied at the **consumer-facing surface** (the four shared singletons + the 5 calculator slices); CalculatorStore is the per-calculator state-singleton infrastructure that wraps the same pattern internally, parallel to the seam, not a "consumer" of it. AUTO-* requirements name CalculatorStore and the 5 `*Inputs.svelte` — they do NOT name calculator-store storage I/O. **Decision:** leave `calculator-store.svelte.ts` direct-localStorage calls untouched.
- Anything else outside the 5 `*Inputs.svelte` + `calculator-store.svelte.ts`.
- The other 5 `state.svelte.ts` per-calculator singleton files — they only instantiate `CalculatorStore<T>`; the auto-persist lives in the class, so the per-calculator singletons inherit it without edits.
- Phase 58 (release v1.18.0) is separate.

**The hard gate:** behavior-preserving. (a) Editing any input in any of the 5 calculators still persists across reload, INCLUDING when the inputs fragment is mounted alone in the mobile `InputDrawer` (ROADMAP SC-2). (b) `lastEdited` 60s stamp-debounce still skips writes in-window (ROADMAP SC-3). (c) `calculator-store.test.ts` stays green THROUGH the migration, plus one new test pins the drawer-mounted-alone persist path.

</domain>

<decisions>
## Implementation Decisions

### Auto-persist mechanism — `$effect.root()` inside CalculatorStore
- **D-01:** The auto-persist effect lives in `CalculatorStore`'s constructor (or a private init helper called from it). Because `CalculatorStore` is a **class instance** (not a component), it can't host a bare `$effect` — Svelte 5 requires a component context or `$effect.root()`. The constructor calls `$effect.root(() => $effect(() => { JSON.stringify(this.current); this.persist(); }))`. The `JSON.stringify(this.current)` deeply touches every reactive field on `this.current` so the effect re-runs whenever any nested field mutates (the same mechanism the per-fragment `$effect` used). `this.persist()` is the existing method (writes `localStorage` + stamps `lastEdited`); no signature change.
  - **Why this is load-bearing:** `state.svelte.ts` singletons live for the app lifetime (module-scope singletons imported by both the calculator route AND the drawer-only Inputs mount). A root effect created at constructor-time runs as long as the singleton exists — i.e., forever in the app session. No `.dispose()` needed at this scope; the singleton is intentionally global.
  - **Re-entry safety:** the root effect subscribes to `this.current` (read inside `JSON.stringify`). It does NOT subscribe to `this.lastEdited.current` — that's a separate $state rune updated inside `lastEdited.stamp()`, which is called from `persist()`. Because `lastEdited.current` is not READ in the effect body, mutating it does not retrigger. Combined with `lastEdited`'s internal 60s `STAMP_DEBOUNCE_MS` skip, there is no unbounded recursion. (The `STAMP_DEBOUNCE_MS` is a defense-in-depth second guard against any future code path that did accidentally subscribe to `lastEdited.current`.)

### Eager init ordering
- **D-02:** The auto-persist root effect runs at constructor time, immediately after the existing `this.init()` call (which restores state from localStorage). Order: restore-from-storage → install auto-persist → return. This means the first effect run fires once with the restored state, immediately re-persisting it (a benign no-op write of identical bytes). Acceptable: the existing per-fragment effect already had this behavior on mount, so no observable change.

### Drawer-only-mount preservation (AUTO-02)
- **D-03:** Drawer-only-mount auto-persist is satisfied by D-01 with zero per-component code: the singleton's root effect runs regardless of which component mounts the input bindings, because `import { girState } from '$lib/gir/state.svelte.js'` triggers module evaluation (and the CalculatorStore constructor) on first import. Both the calculator route and the drawer-only Inputs mount import the same singleton, so the singleton's root effect is already running by the time either component mounts. Mutating an input via either mount triggers the same root effect → `persist()`.
  - The comment "duplicates the calculator's effect so the inputs work independently if mounted in isolation" that justifies the current per-fragment effect becomes obsolete — the root effect provides this naturally.
  - **Test invariant (SC-2 / ROADMAP):** add a test that mounts ONLY the inputs (not the full calculator route), mutates a state field, and asserts the stored localStorage value updates. One representative test (e.g., on `GirInputs`) is sufficient; the mechanism is identical for all 5.

### Per-`*Inputs.svelte` deletion strategy (AUTO-01)
- **D-04:** Delete the 4-line `$effect(() => { JSON.stringify(...State.current); ...State.persist(); });` block and the immediately preceding "Persist on every change — duplicates …" comment in each of the 5 files (gir, morphine, fortification, feeds, uac-uvc). No other code in those files changes — the `import { ...State }` line stays (the singleton is used for input bindings); other `$effect`/`$derived` blocks are untouched. Each file's diff should be exactly the deletion of those ~5-6 lines.

### Test additions
- **D-05:** Add a new test (or extend `calculator-store.test.ts`) that:
  - (a) Constructs a `CalculatorStore<T>` instance, mutates `.current`, and asserts `localStorage.setItem` was called (auto-persist fires) — proves the in-class effect works.
  - (b) Pins the drawer-mounted-alone persist path — either at the unit level via a `flush-microtasks` style check on the store, or via a component test mounting only one `*Inputs.svelte` and asserting `localStorage` updates after a field mutation. Unit-level is sufficient if it convincingly demonstrates the singleton's effect fires without any component mounted.
  - (c) Verifies the `lastEdited` 60s debounce still holds under rapid effect passes (existing tests should cover this; if not, add one).
- **D-06:** Do NOT remove or edit any existing tests that currently rely on the per-fragment effect (none should exist — the existing tests mutate state and assert persistence via the store's `persist()` method directly). The 5 `*Inputs.svelte` are component files with no co-located tests of the deleted effect — there is nothing to update.

### Svelte 5 $effect.root() correctness
- **D-07:** `$effect.root()` creates an untracked root scope; the inner `$effect` reactively subscribes to whatever it reads. The function returned by `$effect.root()` is a cleanup callback — we intentionally do NOT store or call it. The singleton lives the app lifetime; cleanup happens at app teardown (browser close/reload) which discards the entire JS context. No memory-leak concern at this scope.
- **D-08:** SSR/test safety: in jsdom/Vitest, `$effect.root()` works correctly because vitest sets up Svelte's reactivity runtime. In SSR (`prerender`), CalculatorStore's `init()` already short-circuits via `typeof localStorage === 'undefined'`, but the constructor still runs. The root effect created in SSR is harmless (no localStorage available, so `persist()` no-ops); however, to avoid creating a phantom root effect on the server, **wrap the `$effect.root()` call in the same `typeof localStorage === 'undefined'` guard**. This keeps SSR a pure no-op for the persistence layer.

### Claude's Discretion
- Whether to extract the auto-persist installer into a private `#installAutoPersist()` helper or keep it inline in the constructor — both work; helper is cleaner if it grows.
- The exact test framework idiom for proving the drawer-mounted-alone path (unit-only vs. component mount) — D-05 lists both options.
- Whether to delete the now-stale "Persist on every change — duplicates …" comment in `state.svelte.ts` per-calculator singletons (there isn't one there, but if any analogous comment exists, prune it).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & locked decisions
- `.planning/REQUIREMENTS.md` §"AUTOPERSIST — candidate 3 fold-in" — AUTO-01..02 acceptance language.
- `.planning/ROADMAP.md` §"Phase 57: Auto-Persist Behind CalculatorStore" — goal + 3 success criteria (effect gone from all 5; drawer-mounted-alone still persists; 60s debounce + no re-entry).
- `.planning/STATE.md` §"Accumulated Context › Decisions" — the `[v1.18]` AUTO-* split rationale + critical invariants (drawer-only-mount must persist; `lastEdited` 60s stamp-debounce + Svelte-5 effect re-entry prevention).
- `.planning/PROJECT.md` §"Current Milestone" — milestone framing (locality + leverage).

### Source files touched (read all in full)
- `src/lib/shell/calculator-store.svelte.ts` — the class that gains auto-persist (`this.current = $state<T>()`, `init()`, `persist()`, `reset()`, `lastEdited = new LastEdited(...)` — Phase 56 already made LastEdited seam-backed, no further change there).
- `src/lib/gir/GirInputs.svelte` — the per-fragment effect to delete (`$effect(() => { JSON.stringify(girState.current); girState.persist(); })` at line 24 + preceding comment).
- `src/lib/morphine/MorphineWeanInputs.svelte` — line ~22.
- `src/lib/fortification/FortificationInputs.svelte` — line ~135.
- `src/lib/feeds/FeedAdvanceInputs.svelte` — line ~36.
- `src/lib/uac-uvc/UacUvcInputs.svelte` — line ~29.

### Files read for context but NOT modified
- `src/lib/shared/lastEdited.svelte.ts` — Phase-56-migrated `LastEdited` class with seam-backed `#pv`; the 60s `STAMP_DEBOUNCE_MS` lives here and is the re-entry guard.
- `src/lib/shared/persistent-value.ts` — the seam (CalculatorStore is NOT migrated onto it in Phase 57; out of scope).
- `src/lib/{gir,morphine,fortification,feeds,uac-uvc}/state.svelte.ts` — per-calculator state singletons; they instantiate `CalculatorStore<T>` and benefit from the auto-persist automatically — NO edits needed.

### Regression contract — must stay green THROUGH migration
- `src/lib/shell/calculator-store.test.ts` — the primary contract; covers `init`/`persist`/`reset`/merge + lastEdited.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **The 5 duplicated `$effect` blocks are character-for-character identical** (modulo the state name): `JSON.stringify(<name>State.current); <name>State.persist();`. This is exactly the consolidation target — moving one block into `CalculatorStore.constructor` deletes 5 copies.
- **`CalculatorStore.persist()` already exists** and is what each per-fragment effect calls. The new in-class effect just calls the same method — no new persistence surface, no new bytes written.
- **`LastEdited` from Phase 56** already routes through the seam and owns the 60s debounce; no Phase 57 change to that file. The re-entry guarantee is preserved by NOT subscribing to `lastEdited.current` inside the effect body (the effect reads `this.current` only).

### Established Patterns
- **State singletons live the app lifetime:** each calculator's `state.svelte.ts` exports a module-scope `const xxxState = new CalculatorStore<T>(...)` that's imported by the route + drawer. Module-scope evaluation runs the constructor exactly once per session — perfect host for a root effect.
- **`$effect.root()` for class-hosted effects:** the standard Svelte 5 idiom when an effect must live outside a component. `$effect.root(() => $effect(...))` creates a root scope owning the inner effect; the closure returns a cleanup function that we discard (singleton lifetime = app lifetime).
- **SSR guard pattern:** `typeof localStorage === 'undefined'` short-circuit is used everywhere in this codebase (CalculatorStore.init/persist/reset, the seam, the four shared singletons). Apply the same guard around `$effect.root()` to skip phantom effects in SSR.

### Integration Points
- After Phase 57: zero `*Inputs.svelte` calls `persist()` or hosts a persistence effect. The 5 calculators' inputs work IDENTICALLY in main-page mount AND drawer-only mount because the state singleton (not the component) owns persistence. The mobile `InputDrawer` behavior is unchanged — it still mounts the same `<XxxInputs>` fragment; the difference is the fragment no longer has its own `$effect`.
- Grep gate after Phase 57: `grep -r "JSON.stringify.*State.current" src/lib/**/*Inputs.svelte` → ZERO matches (ROADMAP SC-1). `grep -r "JSON.stringify(this.current)" src/lib/shell/calculator-store.svelte.ts` → ONE match (the new in-class effect).

</code_context>

<specifics>
## Specific Ideas

- The auto-persist effect's body should be a literal one-liner: `JSON.stringify(this.current); this.persist();`. Identical to the 5 deleted blocks. Don't refactor `persist()`'s behavior in this phase — the win is locality, not new mechanics.
- Acceptance proof for AUTO-02 (drawer-mounted-alone): a single representative test on one calculator (e.g., GIR) is sufficient — the mechanism is shared across all 5 via `CalculatorStore`. We do not need 5 separate tests; one proves the class-level wiring.

</specifics>

<deferred>
## Deferred Ideas

- **Migrating `CalculatorStore` onto the `PersistentValue` seam** — explicitly out of scope (see D-01 / domain note). If desired in a future milestone, it would be a fifth adapter migration; the class already isolates its localStorage calls in `init/persist/reset`, making it the easiest of any future migration.
- **Release v1.18.0** — Phase 58.
- **Architecture review candidate 2** (config pass-throughs) — future milestone.
- **ML_PER_OZ clinical constant** (candidate 4) — out of milestone, needs clinician sign-off.
- **v1.15.1 SMOKE-01..10 real-iPhone gate** — carries forward independently.

</deferred>

---

*Phase: 57-Auto-Persist Behind CalculatorStore*
*Context gathered: 2026-05-29*
