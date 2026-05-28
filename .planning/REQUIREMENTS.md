# Requirements — v1.18 Persistence Seam

**Milestone goal:** Hoist the hand-rolled localStorage read/write/guard pattern out of the shared global singletons onto one deep persistence seam, so storage logic lives in one tested place instead of being re-implemented across four modules. Behavior-preserving — the win is locality and leverage, not new user features.

**Source:** Architecture review candidate 1 (top recommendation) + candidate 3 (auto-persist fold-in).

## v1.18 Requirements

### SEAM — the persistence module

- [ ] **SEAM-01**: A `PersistentValue<T>` seam exists with one guarded `read` / `write` / `remove`, behind a single SSR/private-mode guard (`typeof localStorage === 'undefined'` + try/catch), so no consumer touches `localStorage` directly.
- [ ] **SEAM-02**: The seam handles JSON serialize/parse, and a parse failure (invalid JSON, security error) falls back to the supplied default rather than throwing.
- [ ] **SEAM-03**: The seam supports a custom recover/migrate hook so an adapter can transform stored data on read (covers disclaimer v1→v2 migration and favorites 6-step recovery).
- [ ] **SEAM-04**: The seam is covered by co-located tests exercising the SSR guard, quota/private-mode write throw, parse-failure fallback, and the migrate hook — this is the single test surface for persistence.

### MIGRATE — move the four adapters onto the seam

- [ ] **MIG-01**: `theme.svelte.ts` reads/writes through the seam; storage key `nicu_assistant_theme` and its `get current` / `set` / `init` / `toggle` behavior (plus `.dark` class + `data-theme` sync) are unchanged.
- [ ] **MIG-02**: `disclaimer.svelte.ts` reads/writes through the seam; the v1→v2 migration with audit-trail preservation (v1 key not deleted) and `acknowledged` / `initialized` accessors are unchanged.
- [ ] **MIG-03**: `favorites.svelte.ts` reads/writes through the seam; key `nicu:favorites`, schema `{v:1, ids}`, the 6-step recovery pipeline, 4-cap, and stored-order preservation are unchanged.
- [ ] **MIG-04**: `lastEdited.svelte.ts` reads/writes through the seam; per-key stamp, 60s stamp-debounce (prevents effect re-entry), and `clear` are unchanged.

### AUTOPERSIST — candidate 3 fold-in

- [ ] **AUTO-01**: `CalculatorStore` owns auto-persist; the copy-pasted `$effect(() => { JSON.stringify(state.current); state.persist() })` is removed from all 5 `*Inputs.svelte`.
- [ ] **AUTO-02**: An inputs fragment mounted alone in the mobile `InputDrawer` still persists on change, and the `lastEdited` minute-debounce + no-effect-re-entry guarantee are preserved.

### REL — release

- [ ] **REL-01**: `package.json` bumped to 1.18.0; AboutSheet reflects it via the `__APP_VERSION__` build-time constant (no hardcoded version string).
- [ ] **REL-02**: PROJECT.md Validated list and this REQUIREMENTS.md traceability table updated at milestone close.
- [ ] **REL-03**: Clinical gate green — svelte-check 0/0, vitest fully green, `pnpm build` ✓, Playwright E2E + extended axe sweeps green in both themes.

## Future Requirements (deferred)

- Architecture review candidate 2 — collapse the config pass-throughs (`*-config.ts` + lookup-by-id seam, add morphine-config.ts).

## Out of Scope

- **Architecture review candidate 4 (ML_PER_OZ clinical constant)** — feeds uses 30, fortification uses 29.57; unifying needs clinician sign-off, not just a refactor. Tracked as a correctness flag, deliberately excluded here.
- **New persisted data or user-visible behavior** — this milestone is behavior-preserving; storage keys and persisted JSON shapes do not change.
- **v1.15.1 SMOKE-01..10 real-iPhone gate** — carries forward as a deferred item, independent of this milestone.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEAM-01 | Phase 55 | Pending |
| SEAM-02 | Phase 55 | Pending |
| SEAM-03 | Phase 55 | Pending |
| SEAM-04 | Phase 55 | Pending |
| MIG-01 | Phase 56 | Pending |
| MIG-02 | Phase 56 | Pending |
| MIG-03 | Phase 56 | Pending |
| MIG-04 | Phase 56 | Pending |
| AUTO-01 | Phase 57 | Pending |
| AUTO-02 | Phase 57 | Pending |
| REL-01 | Phase 58 | Pending |
| REL-02 | Phase 58 | Pending |
| REL-03 | Phase 58 | Pending |
