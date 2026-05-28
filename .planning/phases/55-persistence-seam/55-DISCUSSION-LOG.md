# Phase 55: Persistence Seam - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 55-Persistence Seam
**Mode:** `--auto` (all gray areas auto-selected; recommended option chosen per question)
**Areas discussed:** Storage format, Migrate hook signature, New module vs generalize CalculatorStore, File location & naming

---

## Storage format (JSON-only vs. raw-string capable)

| Option | Description | Selected |
|--------|-------------|----------|
| Per-instance codec defaulting to JSON, with a raw-string codec | `serialize`/`deserialize` options; JSON by default, identity codec for plain strings | ✓ |
| JSON-always | Every value `JSON.stringify`'d; simplest API | |
| Raw-string-always | Caller does its own serialization above the seam | |

**Auto-selection:** Per-instance codec, JSON default.
**Notes:** Load-bearing. theme/lastEdited/disclaimer store raw strings today; `src/app.html:10` FOUC script reads `nicu_assistant_theme` as a raw string with no `JSON.parse`. JSON-always would change stored bytes for 3 of 4 adapters and break the no-flash theme boot — violating the milestone's behavior-preserving gate. favorites already stores JSON → uses the default codec. (CONTEXT D-01)

---

## Migrate / recover hook signature

| Option | Description | Selected |
|--------|-------------|----------|
| `recover(raw: string \| null) => T` on read, before deserialize | Hook owns the raw→T transform; matches `favorites.recover` verbatim | ✓ |
| `migrate(parsed: unknown) => T` after deserialize | Hook runs post-parse; loses the null/parse-throw branch the adapters need | |
| Multi-key migration hook | Hook receives multiple keys for cross-version flows | |

**Auto-selection:** `recover(raw: string | null) => T` at the raw-string boundary.
**Notes:** `favorites.svelte.ts:36` already has this exact signature (null→defaults, parse-in-try, shape-validate, filter, cap, empty→defaults). The seam hook generalizes it so Phase 56 passes favorites' existing `recover` through unchanged. Disclaimer's cross-key v1→v2 stays in the adapter (CONTEXT D-02, D-03).

---

## New `PersistentValue<T>` module vs. generalize `CalculatorStore<T>`

| Option | Description | Selected |
|--------|-------------|----------|
| New standalone `PersistentValue<T>` module | Pure read/write/remove primitive; CalculatorStore later sits on it | ✓ |
| Widen existing `CalculatorStore<T>` | Reuse the class; add raw-codec + no-`$state` modes | |

**Auto-selection:** New standalone module.
**Notes:** `CalculatorStore` couples persistence to `$state` + `LastEdited` stamping + `merge` + eager-init; the four shared singletons need none of that. The seam is the floor; CalculatorStore becomes one tenant in Phase 57. (CONTEXT D-04)

---

## File location & naming

| Option | Description | Selected |
|--------|-------------|----------|
| `src/lib/shared/persistent-value.ts`, plain `.ts` | Beside the four adapters; no rune so plain `.ts` | ✓ |
| `src/lib/shell/persistent-value.svelte.ts` | Beside CalculatorStore; `.svelte.ts` | |

**Auto-selection:** `src/lib/shared/persistent-value.ts` (plain `.ts`), co-located `persistent-value.test.ts`.
**Notes:** Lives beside the adapters it serves. Plain `.ts` because the seam declares no rune — only adapters keep `$state`. (CONTEXT D-05, D-06)

---

## Claude's Discretion

- Object-factory (`createPersistentValue(opts)`) vs. class (`new PersistentValue(opts)`) API surface — planner picks the prevailing codebase style as long as D-01..D-07 hold.
- Default supplied via constructor option vs. per-call argument.
- Test specifics (vitest, co-located `.test.ts`).

## Deferred Ideas

- Disclaimer two-key v1→v2 orchestration → Phase 56 (MIG-02).
- `CalculatorStore` refactored onto the seam → Phase 57 (AUTO-01..02).
- lastEdited stamp-outside-try + 60s debounce → adapter/Phase 57 behavior.
- Architecture review candidate 2 (config pass-throughs) → future milestone.
- ML_PER_OZ clinical constant (candidate 4) → out of scope, needs clinician sign-off.
- v1.15.1 SMOKE-01..10 real-iPhone gate → carries forward independently.
