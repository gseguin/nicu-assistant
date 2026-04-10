---
phase: 36-wave-0-scaffolding-identity-hue
plan: 01
subsystem: shell
tags: [scaffolding, registry, identity-hue, feeds]
dependency_graph:
  requires: []
  provides: [CalculatorId-feeds, identity-feeds-css, feeds-route, feeds-registry-entry]
  affects: [NavShell, aboutContent, app.css]
tech_stack:
  added: []
  patterns: [OKLCH identity hue, placeholder route]
key_files:
  created:
    - src/routes/feeds/+page.svelte
  modified:
    - src/lib/shared/types.ts
    - src/lib/shell/registry.ts
    - src/lib/shell/NavShell.svelte
    - src/lib/shared/about-content.ts
    - src/app.css
    - src/lib/shell/__tests__/registry.test.ts
decisions:
  - "Baby icon from @lucide/svelte for feeds tab (consistent with existing icon pattern)"
  - "Warm terracotta OKLCH hue ~30 for feeds identity (distinct from morphine blue ~220, formula teal ~195, GIR green ~145)"
metrics:
  duration: 212s
  completed: "2026-04-10T04:10:14Z"
---

# Phase 36 Plan 01: Shell Scaffolding + Identity Hue Summary

Extended the app shell to recognize a 4th "Feeds" calculator with Baby icon, OKLCH hue ~30 terracotta identity tokens, and a placeholder /feeds route.

## What Was Done

### Task 1: Extend CalculatorId, registry, NavShell, and about-content (bfc5464)

- Added `'feeds'` to the `CalculatorId` union type in `types.ts`
- Imported `Baby` from `@lucide/svelte` and added 4th entry to `CALCULATOR_REGISTRY` with `identity-feeds` class
- Extended `identityClass` type union with `'identity-feeds'`
- Added `/feeds` ternary branch in `NavShell.svelte` before the `morphine-wean` fallback
- Added `feeds` key to `aboutContent` Record for TypeScript exhaustiveness

### Task 2: Add .identity-feeds CSS tokens and /feeds placeholder route (d639868)

- Added `.identity-feeds` block in `app.css` with OKLCH light tokens (50% 0.13 30 / 94% 0.04 30) and dark tokens (80% 0.10 30 / 24% 0.05 30)
- Created `src/routes/feeds/+page.svelte` with Baby icon, "Feed Advance Calculator", "coming soon" subtitle, and `identity-feeds` class
- Updated registry test to expect 4 calculator IDs (auto-fixed: Rule 1 - test expected old 3-entry array)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated registry test to include 'feeds' in expected IDs**
- **Found during:** Task 2 verification
- **Issue:** `src/lib/shell/__tests__/registry.test.ts` expected 3 calculator IDs, failed with 4
- **Fix:** Added `'feeds'` to the expected sorted array
- **Files modified:** `src/lib/shell/__tests__/registry.test.ts`
- **Commit:** d639868

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| src/routes/feeds/+page.svelte | 24 | "coming soon" placeholder text | Feed calculator UI ships in Phase 37+; this plan only scaffolds the shell entry point |
| src/lib/shared/about-content.ts | 55 | "Coming soon." note | Matches route placeholder; will be replaced when calculator logic is implemented |

## Verification

- `pnpm check`: 0 errors, 0 warnings (4523 files)
- `pnpm test`: 185 passed, 0 failed (17 test files)
- `pnpm build`: success, `feeds.html` generated in build output
- Zero new dependencies added (ARCH-07 satisfied)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | bfc5464 | feat(36-01): extend shell with feeds calculator type, registry entry, nav routing, and about content |
| 2 | d639868 | feat(36-01): add feeds identity hue CSS tokens and placeholder route |
