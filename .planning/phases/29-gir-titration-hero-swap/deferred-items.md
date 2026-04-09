# Phase 29 Deferred / Pre-existing Issues (out of scope)

- `src/lib/shell/__tests__/registry.test.ts:9` — asserts CALCULATOR_REGISTRY length 2, but registry now has 3 entries. Pre-existing, unrelated to hero swap.
- `pnpm svelte-check` pre-existing errors (all untouched by phase 29):
  - `src/lib/gir/GirCalculator.svelte:13:56` — GlucoseBucket id type narrowing (pre-existing)
  - `src/lib/shell/NavShell.svelte:2:24` — `$app/state` module resolution (svelte-check env, not runtime)
  - `src/routes/+layout.svelte:12,44` — `virtual:pwa-*` module resolution (Vite-only virtuals)
  - `src/routes/+page.svelte:2:24` — `$app/navigation` module resolution
- `src/lib/shared/components/SegmentedToggleHarness.svelte:5:22` — Svelte 5 state_referenced_locally warning, pre-existing.
