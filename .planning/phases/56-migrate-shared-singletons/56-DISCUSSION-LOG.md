# Phase 56: Migrate Shared Singletons - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 56-Migrate Shared Singletons
**Mode:** `--auto` (all gray areas auto-selected; recommended option chosen per question)
**Areas discussed:** Adapter wiring pattern, Theme dual-read + FOUC, Disclaimer two-key v1→v2, Favorites recover/test-green, lastEdited per-instance class

---

## Adapter wiring pattern (all four)

| Option | Description | Selected |
|--------|-------------|----------|
| Module-scope `pv = createPersistentValue(...)`, accessors delegate; `$state` stays in adapter | Seam is stateless I/O; adapter keeps reactive state + domain logic | ✓ |
| Move reactive value into the seam | Seam holds the `$state` | |

**Auto-selection:** Stateless seam, adapter keeps `$state`.
**Notes:** Matches the Phase 55 design (seam = floor, adapter = tenant; D-04). DOM side-effects, defaults, cross-key/debounce orchestration stay in the adapter. (CONTEXT D-01)

---

## Theme (MIG-01) — FOUC dual-read

| Option | Description | Selected |
|--------|-------------|----------|
| One `PersistentValue<string>` + rawStringCodec; app.html FOUC stays raw getItem | rawStringCodec stores 'light'/'dark' unquoted → FOUC read matches byte-for-byte | ✓ |
| jsonCodec for theme | Would write '"dark"' (quoted) | |

**Auto-selection:** rawStringCodec; FOUC script unchanged.
**Notes:** Most load-bearing MIG-01 constraint — jsonCodec would break the no-flash boot for every returning user. `.dark`/`data-theme` sync + prefers-color-scheme fallback stay in the adapter. (CONTEXT D-02, D-03)

---

## Disclaimer (MIG-02) — two keys, single-key seam

| Option | Description | Selected |
|--------|-------------|----------|
| Two `PersistentValue<string>` instances (v1 + v2, rawStringCodec); adapter ORs + writes v2, never deletes v1 | Seam does per-key guarded I/O; adapter composes v1→v2 migration | ✓ |
| Single instance + multi-key recover | Seam recover is single-key | |

**Auto-selection:** Two instances, adapter orchestrates.
**Notes:** Cross-key v1→v2 stays in adapter (Phase 55 D-03). v1 key is read-only — never write/remove (audit trail, ROADMAP SC-2). Values are literal `'true'` strings. (CONTEXT D-04)

---

## Favorites (MIG-03) — recover hook + test-green

| Option | Description | Selected |
|--------|-------------|----------|
| One `PersistentValue` + jsonCodec + existing recover() passed as the seam's recover hook; favorites.test.ts unchanged | recover signature already matches the seam (designed for it in Phase 55) | ✓ |
| Rewrite recover logic | Risks behavior change | |

**Auto-selection:** Pass-through recover; no test edits.
**Notes:** First-run write-back (raw === null → seed defaults) must be preserved — recommended a single guarded null-probe in init() (D-05a) since recover swallows null→defaults. favorites.test.ts (T-01..T-21, SAFE-02/03) stays green UNCHANGED; if a test needs editing to pass, that's a regression — stop. (CONTEXT D-05, D-06)

---

## lastEdited (MIG-04) — per-instance class

| Option | Description | Selected |
|--------|-------------|----------|
| Each `LastEdited` holds one `PersistentValue<number>` (custom String/Number codec); 60s debounce + stamp-outside-try stay in the class | Seam owns guarded read/write/remove; debounce/idempotence is adapter behavior | ✓ |
| Move debounce into the seam | Debounce is domain behavior, not persistence | |

**Auto-selection:** Per-instance PersistentValue<number>, debounce stays in class.
**Notes:** Dynamic key `${storageKey}_ts` from CalculatorStore. Custom `{serialize: String, deserialize: Number}` codec matches stored bytes; non-finite guard stays in the class so `current` stays null on garbage. `calculator-store.test.ts` must stay green. (CONTEXT D-07, D-08)

---

## Claude's Discretion

- Disclaimer: two instances vs. two inline seam calls — both satisfy D-04.
- lastEdited codec form: custom String/Number codec vs. recover hook — both byte-identical (D-07 recommends the custom codec).
- Favorites first-run detection: raw null-probe (D-05a) vs. recover-signal (D-05b) — whichever keeps every test green.
- Plan split: four independent single-file edits (parallel-safe, different files) — one plan or one-per-adapter, not over-fragmented.

## Deferred Ideas

- `CalculatorStore` onto the seam + 5 `*Inputs.svelte` auto-persist `$effect` → Phase 57 (AUTO-01..02).
- `app.html` FOUC script → never migrated (cannot import a module).
- `pwa.svelte.ts` / `visualViewport.svelte.ts` → not localStorage adapters, out of scope.
- Release v1.18.0 → Phase 58.
- Architecture review candidate 2 (config pass-throughs) → future milestone.
- v1.15.1 SMOKE-01..10 real-iPhone gate → carries forward independently.
