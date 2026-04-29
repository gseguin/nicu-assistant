---
date: "2026-04-29 16:54"
promoted: false
---

Consider extracting `CalculatorStoreReadonly<T>` interface from `CalculatorStore<T>` to remove the `any` in `CalculatorPage.svelte`'s prop type.

Context: commit 0ec8f98 (route shell collapse, 260429-mwe) typed `<CalculatorPage>`'s `module` prop as `CalculatorModule<any>` instead of the originally-designed `CalculatorModule<unknown>`. Reason: `CalculatorStore<T>` is invariant in T because its `merge?: (defaults: T, parsed: Partial<T>) => T` callback puts T in both input (parameter) and output (return) positions. This invariance propagates up to `CalculatorModule<T>` via the `state: CalculatorStore<T>` field, so `CalculatorModule<PertStateData>` is not assignable to `CalculatorModule<unknown>`.

Proposed fix: introduce `CalculatorStoreReadonly<T>` (interface, in `src/lib/shell/calculator-store.svelte.ts` or a sibling file) that omits `merge` and exposes only `current: T`, `lastEdited: LastEdited`, `init(): void`, `persist(): void`, `reset(): void`. The callback only matters at construction time; the public surface used by consumers is naturally covariant in T. Have `CalculatorStore<T>` implement it. Update `CalculatorModule<TState>` to reference `state: CalculatorStoreReadonly<TState>` instead of the concrete class. Then `CalculatorPage`'s prop type can be `CalculatorModule<unknown>` cleanly — no `any`, no eslint-disable.

Estimated effort: ~30 LOC of plumbing + a tweak to `CalculatorPage.svelte` and `calculator-module.ts`. Should not change runtime behavior. Tests should remain green; the existing `CalculatorPage.test.ts` and `calculator-store.test.ts` cover the surface.

Why deferred: pragmatic — the `any` at the prop site is honest and contained (the shell never inspects state, only round-trips it through `getRecapItems` and store methods). Not worth blocking the deepening commit on.
