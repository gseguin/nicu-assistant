---
phase: 52-code-purge-test-suite-repair
plan: 02
subsystem: shared-types, app-css, shell-comments
tags: [svelte5, sveltekit, typescript, purge, calculator-id, css]

# Dependency graph
requires:
  - "52-01: src/lib/pert/ deleted, pertModule removed from registry"
provides:
  - "CalculatorId union narrowed to 5 members: 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc'"
  - "about-content.ts Record<CalculatorId, AboutContent> has exactly 5 keys (pert: block deleted)"
  - "app.css has no .identity-pert selector (light or dark variant); 5 identity selectors remain"
  - "Source comments in shell + favorites + fortification contain zero PERT word-boundary matches"
  - "vitest green (407/407, 42 files); svelte-check 0/0 at commit boundary"
affects:
  - 52-03-test-suite-repair

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Co-commit CalculatorId union narrowing + Record<CalculatorId> exhaustiveness drop to avoid TS2741"

key-files:
  created: []
  modified:
    - "src/lib/shared/types.ts — 'pert' removed from CalculatorId union; 5 members remain"
    - "src/lib/shared/about-content.ts — pert: block (14 lines) deleted; 5-key record"
    - "src/app.css — .identity-pert block (9 lines, light + dark variants) deleted"
    - "src/lib/shared/favorites.svelte.ts — D-21 comment: drop '(Phase pert-01)' parenthetical"
    - "src/lib/shell/calculator-store.svelte.ts — 3 comment sites generalized (brace-list, Mirrors, PERT pattern)"
    - "src/lib/shell/calculator-module.ts — JSDoc examples replaced PERT with GIR equivalents"
    - "src/lib/fortification/calculator.ts — 'PERT slice' replaced with 'other calculator slices'"

key-decisions:
  - "Co-commit types.ts + about-content.ts in Task 1 (both edits MUST land together: Record<CalculatorId> exhaustiveness check TS2741 fires if only one lands)"
  - "favorites.svelte.ts defaultIds() required NO code edit — cascade from 52-01 (pertModule removed) automatically resolves defaults to ['feeds','formula','gir','morphine-wean'] baseline"
  - "407 vitest tests (not 433) is the correct baseline post-52-01: 489 baseline minus 56 PERT co-located tests deleted in 52-01; plan note of 433 reflected a pre-52-01 estimate"

# Metrics
duration: 12min
completed: 2026-05-23
---

# Phase 52 Plan 02: Source Integration Points Purge Summary

**Narrowed CalculatorId union to 5 members, dropped pert: from about-content, removed .identity-pert CSS, and generalized 6 source comments — vitest 407/407 and svelte-check 0/0 at commit boundary**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-05-23T22:44:00Z

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 81d008b | chore(52-02): narrow CalculatorId union + drop pert: from about-content (PURGE-04 + PURGE-05) |
| Task 2 | 67c35c2 | chore(52-02): remove .identity-pert blocks from app.css (PURGE-06) |
| Task 3 | 6e6e6fb | chore(52-02): generalize PERT source comments in shell, favorites, fortification (D-14) |

## Edits Applied

### Task 1 — CalculatorId union + about-content (2 files, co-committed)

**src/lib/shared/types.ts (line 7):**
- Before: `export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc' | 'pert';`
- After: `export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc';`

**src/lib/shared/about-content.ts:**
- Deleted the 14-line `pert:` block (lines 81-94 in original): title, version, description, 5 notes, disclaimer
- `Record<CalculatorId, AboutContent>` now has exactly 5 keys: morphine-wean, formula, gir, feeds, uac-uvc
- Trailing `},` before the pert: block (the uac-uvc entry's closing brace) preserved per Prettier trailingComma:all

Both edits co-committed per RESEARCH §6 to satisfy TypeScript's exhaustiveness check on `Record<CalculatorId, AboutContent>`.

### Task 2 — .identity-pert CSS removal (1 file)

**src/app.css:**
- Deleted 9-line `.identity-pert` block:
  - Light variant: `.identity-pert { --color-identity: oklch(42% 0.12 285); --color-identity-hero: oklch(96% 0.03 285); }`
  - Dark variant: `.dark .identity-pert, [data-theme='dark'] .identity-pert { ... }`
- Outer `@layer` closing `}` at line 292 preserved (belongs to enclosing block, not the .identity-pert rule)
- Post-edit: exactly 5 light `.identity-{slug}` selectors (feeds, formula, gir, morphine, uac) + 5 corresponding dark-scoped variants

### Task 3 — Source comment generalization (4 files, 6 comment sites)

| File | Site | Change |
|------|------|--------|
| favorites.svelte.ts | line 57 | Dropped `(Phase pert-01)` from D-21 comment |
| calculator-store.svelte.ts | line 7 | Removed `pert,` from brace-list in src path comment |
| calculator-store.svelte.ts | line 37 | Replaced `Mirrors src/lib/pert/state.svelte.ts` with generic form |
| calculator-store.svelte.ts | lines 68-69 | Replaced "matches the existing PERT pattern" with intent-preserving generic explanation |
| calculator-module.ts | lines 41-43 | JSDoc examples: PERT Calculator / Capsule dosing / PERT inputs replaced with GIR equivalents |
| fortification/calculator.ts | line 13 | `the PERT slice` replaced with `other calculator slices` |

All decision-ID anchors (D-21, D-14) preserved; only PERT proper-noun references removed.

## favorites.svelte.ts defaultIds() — No Code Edit Required

Per plan note and RESEARCH D-03: `defaultIds()` in `favorites.svelte.ts` (lines 17-20) computes from `CALCULATOR_REGISTRY.map(c => c.id).slice(0, FAVORITES_MAX)`. With `pertModule` removed in plan 52-01, the computed defaults are now `['feeds', 'formula', 'gir', 'morphine-wean']` — the v1.13 D-19 baseline. No code edit was needed or applied.

## Verification Gate Results

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| CalculatorId union members | 5 | 5 | PASS |
| about-content.ts pert: block | absent | absent | PASS |
| app.css .identity-pert | absent | absent | PASS |
| app.css light-mode identity selectors | 5 | 5 | PASS |
| PERT word-boundary in 4 comment files | 0 | 0 | PASS |
| svelte-check errors | 0 | 0 | PASS |
| svelte-check warnings | 0 | 0 | PASS |
| vitest tests passing | 407 (post-52-01 baseline) | 407 | PASS |
| vitest test files | 42 | 42 | PASS |

**Note on test count:** The plan mentioned 433 tests, which was the pre-52-01 estimate from RESEARCH §5. The 52-01 SUMMARY confirmed the actual post-52-01 baseline is 407/407. Plan 52-02 touches no test files, so the count correctly remains at 407. Plan 52-03 will add the T-21 regression test to bring the final count to 408.

## Deviations from Plan

None — all 8 source-file edits applied as specified in RESEARCH.md §2.2–§2.5 + §3. The `favorites.svelte.ts` `defaultIds()` no-edit decision also confirmed (D-03 hedge: "edit only if present" — not present after 52-01).

## Known Stubs

None. This plan makes no UI-rendering changes; it removes a PERT entry from a static content record and purges CSS tokens. No data display paths are affected.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. Changes are deletions of a removed calculator's integration points.

## Self-Check: PASSED

- [x] `src/lib/shared/types.ts` — edited (verified: no 'pert' in union)
- [x] `src/lib/shared/about-content.ts` — edited (verified: no pert: key)
- [x] `src/app.css` — edited (verified: no .identity-pert)
- [x] `src/lib/shared/favorites.svelte.ts` — edited (verified: 0 PERT hits)
- [x] `src/lib/shell/calculator-store.svelte.ts` — edited (verified: 0 PERT hits)
- [x] `src/lib/shell/calculator-module.ts` — edited (verified: 0 PERT hits)
- [x] `src/lib/fortification/calculator.ts` — edited (verified: 0 PERT hits)
- [x] Commit 81d008b exists: Task 1
- [x] Commit 67c35c2 exists: Task 2
- [x] Commit 6e6e6fb exists: Task 3
