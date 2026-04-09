---
phase: 27
plan: 01
subsystem: shell
tags: [identity, registry, routing, gir]
requires: [phase-26-gir-state]
provides: [identity-gir-css, gir-registry-entry, gir-route-placeholder]
affects: [src/app.css, src/lib/shell/registry.ts, src/routes/gir/+page.svelte]
tech_added: []
patterns: [identity-class-css-var-swap, registry-plugin-entry]
files_created:
  - src/routes/gir/+page.svelte
files_modified:
  - src/app.css
  - src/lib/shell/registry.ts
key_decisions:
  - "Hue 145 (Dextrose Green) locked via UI-SPEC OKLCH literals — no drift"
  - "GIR entry appended to registry after Formula (tab muscle-memory preserved)"
  - "Placeholder body left in /gir; Plan 03 swaps only the placeholder <p> for <GirCalculator />"
completed: 2026-04-09
requirements: [ARCH-01, ARCH-02, ARCH-03, ARCH-05]
---

# Phase 27 Plan 01: GIR UI Identity & Registration Summary

Wired the GIR calculator's third-tab identity hue, registry entry, and route wrapper so `/gir` loads inside an `identity-gir` wrapper, initializes `girState` on mount, and unblocks Plans 02–03 for the titration grid and calculator composition.

## Tasks Completed

| Task | Name                                          | Commit  | Files                           |
| ---- | --------------------------------------------- | ------- | ------------------------------- |
| 1    | Add `.identity-gir` OKLCH block to app.css    | faa61cf | src/app.css                     |
| 2    | Extend registry union + append GIR entry     | bfcc543 | src/lib/shell/registry.ts       |
| 3    | Create /gir route placeholder                | 56280cf | src/routes/gir/+page.svelte     |

## OKLCH Contract

- Light `.identity-gir`: `--color-identity: oklch(46% 0.12 145)`, `--color-identity-hero: oklch(94% 0.045 145)`
- Dark `.identity-gir`: `--color-identity: oklch(82% 0.10 145)`, `--color-identity-hero: oklch(30% 0.09 145)`

All four literals match UI-SPEC exactly.

## Verification

- `grep "\.identity-gir" src/app.css` → 2 hits (light + dark rules)
- Registry entry present with `Droplet`, `/gir`, `identity-gir`, appended after `formula`
- `src/routes/gir/+page.svelte` exists with `identity-gir` wrapper + `girState.init()` in onMount
- `pnpm build` → success (SPA + PWA service worker generated)
- `git diff --stat HEAD~3..HEAD -- src/lib/shared/components/` → empty (ARCH-06 honored)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `/gir` route body is a placeholder `<p>GIR calculator coming online…</p>` by design. Plan 03 replaces this single line with `<GirCalculator />`. Documented in plan task 3.

## Self-Check: PASSED

- FOUND: src/app.css (identity-gir light + dark literals)
- FOUND: src/lib/shell/registry.ts (Droplet import, GIR entry, identity-gir union)
- FOUND: src/routes/gir/+page.svelte
- FOUND commit: faa61cf
- FOUND commit: bfcc543
- FOUND commit: 56280cf
