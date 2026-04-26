# Phase 2 Known Issues

Issues discovered after Phase 2 verification but pre-authorized for deferral to a dedicated follow-up phase. Tracking here so they are not lost; not fixed inside Phase 3 because the proper resolution requires architectural changes outside Phase 3's test-only scope.

## KI-1: SelectPicker click-revert bug in PertInputs.svelte (discovered 2026-04-25 during Phase 3 Plan 03-04 e2e)

### Symptom

When a clinician clicks any of the three SelectPicker options in `<PertInputs />` (medication / strength / formula), the picker visually reverts to its placeholder text immediately after the click. The user's selection does NOT persist; `pertState.current.medicationId` (or `.strengthValue` / `.tubeFeed.formulaId`) stays `null`.

Reproduces deterministically in:
- Playwright e2e via real DOM clicks (the original `e2e/pert.spec.ts` "Oral mode happy path" + "Tube-Feed mode happy path" tests, both viewports).
- Manual users (any browser, any clinician workflow that uses the picker UI).

Does NOT reproduce in:
- Phase 3 Wave 1 component tests (`PertInputs.test.ts`) because those tests bypass the picker UI by mutating `pertState.current.*` directly.
- Phase 3 Wave 2 calculation tests (pure-function calc layer; no UI).
- localStorage rehydration round-trip (state writes flow state→string correctly).
- The D-11 strength-reset-on-medication-change unit test (mutates `medicationId` directly, not via picker).

### Root cause

`PertInputs.svelte` uses three string-bridge `$state` proxies for SelectPicker `bind:value` (medication / strength / formula). Each proxy has two `$effect` blocks: a read-from-state effect (state → string) and a write-to-state effect (string → state). The original code registers them in **read-first** order.

When SelectPicker writes `medicationIdStr = 'creon'` via `bind:value`, both effects schedule. The read-effect runs first (per registration order):

```svelte
$effect(() => {
  const next = pertState.current.medicationId ?? '';     // reads state — still null
  if (next !== medicationIdStr) {                          // '' !== 'creon' → true
    medicationIdStr = next;                                // CLOBBERS 'creon' back to ''
  }
});
```

The reverted `medicationIdStr = ''` then propagates back through `bind:value` to the SelectPicker, which re-renders the placeholder. The write-effect runs second and finds nothing to propagate.

### Architectural collision

A naive fix is to swap effect registration order so the write-effect runs first. This works for the medication and formula bridges. But the strength bridge has a sibling `$effect` (the "lastMedId" / D-11 strength-reset effect) that mutates `pertState.current.strengthValue = null` externally on medication change. The original read-first order is required for D-11 to work — the read-effect must run first to propagate that null into `strengthStr = ''` before the write-effect sees stale string.

Two fix attempts during Phase 3:

1. **Mechanical swap (all three bridges write-first).** Click-revert resolved for medication + formula. Strength click-revert hypothetically resolved. **Broke D-11**: the swapped strength write-effect runs first against the external `strengthValue = null` mutation with stale `strengthStr = '12000'`, undoing the reset. `PertInputs.test.ts:75-86` D-11 test fails.

2. **Fold D-11 into the strength write-effect.** Removed the separate `lastMedId` effect; folded its logic into the swapped strength write-effect's first conditional branch. **Still broke D-11**: the medication write-effect (now first-registered) races against external mutations to `pertState.current.medicationId`. When the test mutates `medicationId = 'zenpep'`, the medication write-effect runs first, reads `medicationIdStr` (still `'creon'`), and **writes `medicationId = 'creon'`** — reverting the test's external mutation before the medication read-effect can sync the string. The fold also has the same write-first-clobbers-external-write race for medication that the strength bridge has for D-11.

The fundamental issue: `bind:value` on SelectPicker creates a bidirectional binding. With two `$effect`s and one registration order, you can satisfy either picker-click direction OR external-state-mutation direction, never both simultaneously. The feeds analog (`FeedAdvanceInputs.svelte:55-74`) gets away with write-first because the bridged field (`enteralKcalPerOz`) is never mutated externally during normal operation.

### Why Phase 1 + Phase 2 verification missed it

- Phase 2 Plan 02-03 shipped the bridges with read-first order. The plan's acceptance criteria run svelte-check + vitest, neither of which exercises the click-driven `bind:value` cycle through SelectPicker.
- Phase 2 verification ran component tests via `pertState.current.* = X` direct mutations — same bypass.
- Phase 3 Wave 1 Plan 03-03 component tests follow the same direct-mutation pattern (the test sets `pertState.current.medicationId = 'creon'` directly, line 78 of PertInputs.test.ts).
- Phase 3 Wave 3 Plan 03-04 e2e is the FIRST coverage exercising real DOM clicks → `bind:value` → string proxy → state propagation. The bug surfaced immediately.

### Phase 3 disposition

Per user decision 2026-04-25 (after the two failed hotfix attempts): Phase 3 ships `e2e/pert.spec.ts` with the 2 picker-driven happy-path tests **dropped** (Oral mode + Tube-Feed mode happy paths, both viewports = 4 tests removed). The remaining 8 tests (mode-switch state preservation, `inputmode="decimal"` regression guard, localStorage round-trip, favorites round-trip — all of which avoid the picker click path) ship as planned. PERT-TEST-05 closes partially; the picker happy-paths defer to a follow-up phase.

The bug ships to v1.15. Manual users will see picker-revert behavior. Worst-case clinical impact is the hero shows empty-state copy ("Enter weight and fat grams") instead of producing a wrong dose — clinicians will notice they cannot complete the calculation.

### Recommended resolution path (follow-up phase)

The proper fix requires a SelectPicker contract change — out of Phase 3 (test-only) scope, and would touch a shared component used by feeds / gir / uac-uvc / pert. Three viable architectural directions:

1. **Add `onValueChange` callback prop to SelectPicker.** SelectPicker emits explicit value-change events instead of (or in addition to) bidirectional `bind:value`. PertInputs writes directly to `pertState.current.*` from the callback. No string proxy needed; no bidirectional race. This is the Svelte 5 idiomatic pattern (event callbacks > two-way binding for cross-cutting state). Affects all callers; a careful migration plan.

2. **`$derived`-backed binding wrapper.** Wrap `bind:value` with a `$derived` getter (state → string) and a setter (string → state). Single effect, no race. Svelte 5 supports `bind:value={getStrengthAsString, setStrengthFromString}` syntax. Cleanest local change; keeps SelectPicker's existing API.

3. **Move PERT off `bind:value` entirely** by forking SelectPicker into a per-calculator `<PertSelectPicker />` that uses an internal click handler writing directly to `pertState.current.*`. Higher local complexity; isolates pert from the shared component. Last-resort.

Recommend **option 2 (`$derived`-backed binding wrapper)** for the follow-up phase: smallest blast radius, no shared-component change, eliminates the bidirectional race at the source.

### Phase traceability

- Bug originated: Phase 2 Plan 02-03 (PertInputs.svelte initial implementation; commit `3171b06`)
- Bug discovered: Phase 3 Plan 03-04 e2e execution (2026-04-25)
- Hotfix attempt 1 (mechanical swap): rejected by D-11 test failure
- Hotfix attempt 2 (fold D-11): rejected by external-write race on medication
- Disposition: deferred to a follow-up phase; Phase 3 ships partial PERT-TEST-05 coverage with this known-issue note
- Follow-up phase: TBD (likely Phase 4 design-polish, or a new phase between 3 and 4 specifically for the bridge architecture)

### Files involved

- `src/lib/pert/PertInputs.svelte` (lines 82-147 — three string-bridge proxies + lastMedId D-11 effect)
- `src/lib/shared/components/SelectPicker.svelte` (the shared component with bidirectional `bind:value` API)
- `src/lib/feeds/FeedAdvanceInputs.svelte:55-74` (the analog that "works" because feeds has no external state mutations on the bridged field)
- `src/lib/pert/PertInputs.test.ts:75-86` (the D-11 test that breaks under both hotfix attempts)
- `e2e/pert.spec.ts` (Phase 3 — the dropped tests are commented in-file at the location they would have lived)

### RESOLVED in Phase 3.1 (2026-04-26)

**Status:** RESOLVED — KI-1 closed at Plan 03.1-01 commit `f2da16d` (the bridge fix); regression guards locked at Plan 03.1-02 commit `dfb6a62` (component tier) + Plan 03.1-03 commit `0d9636f` (e2e tier); clinical gate verification + PERT-TEST-05 FULL closure record at Plan 03.1-04 (SUMMARY: `.planning/workstreams/pert/phases/03.1-selectpicker-bridge-fix/03.1-04-SUMMARY.md`).

**Resolution path taken:** Option 2 from the original recommended-resolution list (`$derived`-backed binding wrapper) — implemented via Svelte 5.9+ function bindings `bind:value={() => getter, (v) => setter}` per CONTEXT D-01. The fix replaced 3 string-bridge `$state` proxies + 6 bidirectional `$effect` blocks in `PertInputs.svelte` (lines 74-134 pre-fix) with 3 inline function-binding wrappers at the existing `<SelectPicker>` markup sites. Net delta: −27 LOC in PertInputs.svelte. Zero `$effect` involvement in the bridge path means zero registration-order race. SelectPicker.svelte was NOT touched (D-02 zero-change contract upheld); the shared component remains byte-identical for feeds / fortification / gir / uac-uvc consumers.

**Architectural collision (read-vs-write effect order with D-11) eliminated:** The new pattern has no `$effect` at all for the bridge, so the trade-off described above (satisfy picker-click direction OR external-state-mutation direction, never both) no longer applies. The standalone D-11 `lastMedId` effect was preserved byte-identical and continues to work because it does not interact with the new function-binding bridge — when D-11 mutates `pertState.current.strengthValue = null` externally, the strength wrapper's getter (which reads `pertState.current.strengthValue` reactively) re-evaluates on the next microtask flush and the SelectPicker re-renders with the empty placeholder. Verified by the existing `PertInputs.test.ts:75-86` D-11 reset test staying green WITHOUT modification per D-03 contract, plus the new D-04 external-mutation propagation test in `PertInputs.test.ts:124-149` (Plan 03.1-02).

**E2e closure (PERT-TEST-05 PARTIAL → FULL):** The 4 picker-driven happy-path runner cases (2 unique tests x 2 viewports) shipped at Plan 03.1-03 (`0d9636f`). pert.spec went from 8/8 (Phase 3 PARTIAL) to 12/12 (Phase 3.1 FULL). The clinical gate at Plan 03.1-04 verified the count is exactly 12. PERT-TEST-05 is now FULL; the requirement was flipped `[ ]` → `[x]` in `.planning/workstreams/pert/REQUIREMENTS.md` with the traceability row updated `Active` → `Validated`.

**Phase traceability (final):**

- Bug originated: Phase 2 Plan 02-03 (PertInputs.svelte initial implementation; commit `3171b06`)
- Bug discovered: Phase 3 Plan 03-04 e2e execution (2026-04-25)
- Hotfix attempt 1 (mechanical swap): rejected by D-11 test failure
- Hotfix attempt 2 (fold D-11): rejected by external-write race on medication
- Disposition (Phase 3): deferred to a follow-up phase; Phase 3 shipped partial PERT-TEST-05 coverage
- Follow-up phase shipped: Phase 3.1 (4 plans, Wave 1 + Wave 2 + Wave 3)
  - Plan 03.1-01 `f2da16d`: bridge fix (Svelte 5.9+ function bindings)
  - Plan 03.1-02 `dfb6a62`: D-01 click-persist + D-04 external-mutation regression guards (component tier)
  - Plan 03.1-03 `0d9636f`: 2 picker-driven e2e happy-paths (Oral + Tube-Feed) x 2 viewports = 4 new runner cases
  - Plan 03.1-04: clinical gate verification + PERT-TEST-05 FULL closure record
- Final outcome: KI-1 RESOLVED; KI-1 will not ship to v1.15 release. Worst-case clinical impact (clinicians cannot complete the picker flow) is fully eliminated.
