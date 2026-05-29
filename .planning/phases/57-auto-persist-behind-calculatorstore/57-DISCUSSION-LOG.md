# Phase 57: Auto-Persist Behind CalculatorStore - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 57-Auto-Persist Behind CalculatorStore
**Mode:** `--auto` (all gray areas auto-selected; recommended option chosen per question)
**Areas discussed:** CalculatorStore-vs-seam scope, Auto-persist mechanism, Drawer-only-mount preservation, Per-Inputs.svelte deletion, Debounce + re-entry safety

---

## Should CalculatorStore also migrate onto the PersistentValue seam?

| Option | Description | Selected |
|--------|-------------|----------|
| No — keep CalculatorStore's direct guarded localStorage; only add auto-persist | Matches ROADMAP wording ("CalculatorStore already wraps the same pattern the seam formalizes") and AUTO-* requirement IDs | ✓ |
| Yes — also migrate CalculatorStore onto the seam | Scope expansion beyond AUTO-01/02 | |

**Auto-selection:** Out of scope.
**Notes:** Phase 57 requirements name CalculatorStore + the 5 `*Inputs.svelte`; they do NOT name CalculatorStore storage I/O. The milestone "no consumer touches localStorage directly" is satisfied at the consumer-facing surface (the four shared singletons + the 5 calculator slices). CalculatorStore is the per-calculator state-singleton infrastructure that wraps the same pattern internally. (CONTEXT D-01 domain note + deferred)

---

## Auto-persist mechanism inside CalculatorStore

| Option | Description | Selected |
|--------|-------------|----------|
| `$effect.root(() => $effect(() => { JSON.stringify(this.current); this.persist(); }))` in constructor | Class can't host bare `$effect`; root effect lives the app lifetime alongside the singleton | ✓ |
| Manual subscribe/notify in mutation paths | Loses reactivity simplicity; requires touching every consumer | |

**Auto-selection:** `$effect.root()` in constructor.
**Notes:** Body identical to the 5 deleted blocks. Subscribes to `this.current` via deep `JSON.stringify`; does NOT read `this.lastEdited.current`, so no re-entry. SSR-guarded by `typeof localStorage === 'undefined'`. (CONTEXT D-01, D-07, D-08)

---

## Drawer-only-mount preservation (AUTO-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Singleton's root effect runs at module-import (constructor), independent of which component mounts | The drawer-only Inputs mount imports the same singleton; effect is already active | ✓ |
| Keep per-fragment effect for drawer-only mount | Defeats the entire AUTO-01 deletion goal | |

**Auto-selection:** Singleton effect handles both mount paths.
**Notes:** Both the calculator route and drawer-only Inputs mount `import { xxxState } from '$lib/.../state.svelte.js'` — module evaluation triggers the constructor, which installs the root effect once for the session. Drawer-only mutations still fire it. (CONTEXT D-03)

---

## Per-`*Inputs.svelte` deletion strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Delete the `$effect` block + preceding comment in each of the 5 files; no other change | Minimal, identical change across all 5 | ✓ |
| Also restructure imports or other patterns | Out of scope; risks regression | |

**Auto-selection:** Targeted deletion only.
**Notes:** Each file diff = ~5-6 lines removed. State singleton import stays (used for input bindings). (CONTEXT D-04)

---

## Debounce + re-entry safety

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve existing lastEdited 60s STAMP_DEBOUNCE_MS as the re-entry guard; effect body does NOT read lastEdited.current | No subscription to lastEdited → no retrigger; 60s debounce as defense-in-depth | ✓ |
| Add a separate debounce around the auto-persist effect | Unnecessary; existing mechanism already prevents the loop | |

**Auto-selection:** Reuse existing lastEdited debounce.
**Notes:** The effect subscribes only to `this.current` (via JSON.stringify). `persist()` writes localStorage + calls `lastEdited.stamp()`; stamp's internal 60s debounce skips no-op cases. Since effect does NOT read `lastEdited.current`, stamping it does not retrigger. (CONTEXT D-01 re-entry safety)

---

## Claude's Discretion

- Inline auto-persist in constructor vs. extract to `#installAutoPersist()` helper — both work; helper is cleaner if it grows.
- Test idiom for drawer-mounted-alone proof: unit-level vs. component mount — D-05 lists both.

## Deferred Ideas

- Migrating CalculatorStore onto the PersistentValue seam → future milestone (would be the fifth adapter migration).
- Release v1.18.0 → Phase 58.
- Architecture review candidate 2 (config pass-throughs) → future milestone.
- ML_PER_OZ clinical constant → out of milestone, needs clinician sign-off.
- v1.15.1 SMOKE-01..10 → carries forward independently.
