---
phase: 48-wave-1-trivial-fixes-notch-focus
plan: 02
subsystem: shell
tags: [notch, ios, pwa, safe-area-inset, navshell, accessibility]

requires:
  - 47 (visualViewport polyfill / webkit-iphone Playwright project — established baseline)
provides:
  - "Notch-safe sticky <header>: pt-[env(safe-area-inset-top,0px)] + px-[max(env(safe-area-inset-left,0px),1rem)]"
  - "T-13 NOTCH-TEST-01 source-grep regression guard"
affects:
  - src/lib/shell/NavShell.svelte (header className gains 2 inset tokens, replaces px-4)
  - src/lib/shell/NavShell.test.ts (T-13 appended inside Phase 45 describe block)

tech-stack:
  added: []
  patterns:
    - "Tailwind arbitrary-value bracket syntax for env(safe-area-inset-*) with bare 0px fallback (mirror of NavShell.svelte:150 mobile bottom-nav pattern)"
    - "max(env(safe-area-inset-left,0px),1rem) preserves design-floor 16px gutter when env() returns 0 in browser-tab mode"
    - "Source-grep regression guard via fs.readFileSync of source file + literal-token expect(...).toContain — format-stable because bracket-syntax tokens are atomic to prettier-plugin-tailwindcss"

key-files:
  created: []
  modified:
    - src/lib/shell/NavShell.svelte
    - src/lib/shell/NavShell.test.ts

key-decisions:
  - "D-01: Single edit on existing <header>; no new wrapper element"
  - "D-02: Bare env() on pt- (no max() floor) — protects Phase 42.1 hero-fills-viewport contract in Safari browser-tab mode"
  - "D-03: Tailwind arbitrary-value bracket syntax mirrors NavShell.svelte:150 bottom-nav inset pattern"
  - "D-04: Existing bg-[var(--color-surface)] paints into the new pt- region by default — no extra rule needed"
  - "D-05: No per-route edits; min-h-14 (56px) + 0px desktop inset clears top-20 (80px) consumers by 24px"
  - "D-06: No --header-h CSS custom property (over-engineering for 10 LOC fix)"
  - "D-07: T-13 colocated in NavShell.test.ts via existing navShellSource constant + classAttrContainsAll helper"

requirements-completed:
  - NOTCH-01
  - NOTCH-02
  - NOTCH-03
  - NOTCH-04
  - NOTCH-TEST-01

metrics:
  duration: "3 min"
  completed: "2026-04-27"
---

# Phase 48 Plan 02: NOTCH (NavShell sticky-header safe-area-inset padding) Summary

Added `pt-[env(safe-area-inset-top,0px)]` and replaced `px-4` with `px-[max(env(safe-area-inset-left,0px),1rem)]` on the existing `<header>` at `NavShell.svelte:76-80`, then appended `T-13 NOTCH-TEST-01` source-grep regression guard inside the existing Phase-45 describe block in `NavShell.test.ts`. This lands the NOTCH half of Phase 48 (the FOCUS half is `48-01-PLAN.md`).

The fix is purely additive on a single className string — ~3 LOC of source change + 12 LOC of test. The header's existing `bg-[var(--color-surface)]` declaration extends opaquely into the new padded region by default, satisfying NOTCH-03 with no separate background rule. No new wrapper element, no new CSS rule, no `--header-h` custom property.

## What was built

| Aspect | Detail |
|--------|--------|
| Edit site | `src/lib/shell/NavShell.svelte:76-80` (the existing sticky `<header>`) |
| Tokens added | `pt-[env(safe-area-inset-top,0px)]`, `px-[max(env(safe-area-inset-left,0px),1rem)]` |
| Tokens removed | `px-4` (replaced by the `px-[max(...)]` token) |
| Pattern mirrored | `NavShell.svelte:150` mobile bottom-nav `pb-[env(safe-area-inset-bottom,0px)]` (same Tailwind arbitrary-value bracket shape, same `0px` fallback default) |
| Test added | `NavShell.test.ts` T-13 inside the third describe block (`'NavShell — desktop full-nav divergence (Phase 45)'`), reusing the existing `navShellSource` constant + `classAttrContainsAll` helper |
| No-edit zones | All 6 calculator routes' `sticky top-20` asides untouched (D-05 inspection audit: 56px header + 0px desktop inset clears 80px consumers by 24px); DESIGN.md / DESIGN.json contract not modified |

## Test results

| Gate | Result |
|------|--------|
| `pnpm test:run src/lib/shell/NavShell.test.ts` | 19 / 19 passing (12 named T-01..T-12 + 6 unnamed structure tests + new T-13) |
| `pnpm test:run` (full vitest suite) | 452 / 452 passing across 43 files (above the 439 baseline; +1 T-13 land net) |
| `pnpm svelte-check` | 0 errors / 0 warnings across 4589 files (preserves the v1.13 svelte-check 0/0 invariant) |
| `pnpm exec playwright test --list` | 250 specs listed cleanly across `chromium` + `webkit-iphone` projects, 0 syntax errors, no specs broken |
| `grep -c 'pt-\[env(safe-area-inset-top,0px)\]' src/lib/shell/NavShell.svelte` | 1 (NOTCH-01 token present once) |
| `grep -c 'px-\[max(env(safe-area-inset-left,0px),1rem)\]' src/lib/shell/NavShell.svelte` | 1 (NOTCH-02 token present once) |
| `grep -c 'max(env(safe-area-inset-top' src/lib/shell/NavShell.svelte` | 0 (D-02 / P-10 honored — no max() floor on `pt-`) |
| `grep -rn 'top-20' src/routes/ \| wc -l` | 6 (D-05 audit: all 6 calculator routes unchanged — NOTCH-04 closed by inspection) |

## Commits

| Task | Commit | Type | Message |
|------|--------|------|---------|
| 1 | `d907db9` | `feat` | feat(48-02): add safe-area-inset padding to NavShell sticky header |
| 2 | `eb604ba` | `test` | test(48-02): add T-13 NOTCH-TEST-01 source-grep regression guard |

## Requirements closed

- **NOTCH-01** — `<header>` carries `pt-[env(safe-area-inset-top,0px)]` (chrome sits below Dynamic Island in standalone PWA portrait).
- **NOTCH-02** — `<header>` carries `px-[max(env(safe-area-inset-left,0px),1rem)]` replacing `px-4` (landscape side-notch respect + 16px gutter floor in browser-tab mode).
- **NOTCH-03** — Existing `bg-[var(--color-surface)]` paints opaquely into the new `pt-` padded region by default (CSS box-model behavior; no additional rule needed per D-04).
- **NOTCH-04** — Sticky-top consumers (`top-20` on 6 routes) NOT modified; D-05 audit confirms 56px header + 0px desktop inset = 56px clearance, 24px under the 80px `top-20` threshold (no per-route edits expected — verified by inspection).
- **NOTCH-TEST-01** — `NavShell.test.ts` T-13 appended; asserts both new tokens are present + canonical sticky-header tokens (`sticky`, `top-0`, `min-h-14`) preserved via the existing `classAttrContainsAll` helper.

## Decisions implemented

D-01, D-02, D-03, D-04, D-05, D-06, D-07 — all from `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-CONTEXT.md`.

## Deviations from Plan

None — plan executed exactly as written.

The plan's `<acceptance_criteria>` for Task 2 stated "13 passing tests (T-01 through T-13)" — the actual file has 19 tests passing because 6 of them are unnamed structural tests in the first `describe('NavShell structure (v1.2 restructure)', ...)` block (lines 41-81) that pre-date the T-XX numbering convention. The plan's intent (count of named T-XX tests) is exactly 13 (T-01..T-13); the full file count is 19. This is consistent with the existing convention and not a deviation.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None — Plan 48-02 is a structural Tailwind className edit on the existing `<header>` element + a source-grep test assertion. No new inputs, API calls, service worker change, data flow modification, or PII handling. Threat register `T-48-02` accepts trivially because there is no security surface introduced.

## Notes for Phase 50 (real-iPhone smoke)

Real-iPhone visual notch confirmation is deferred to Phase 50 SMOKE-02 (portrait Dynamic Island clearance) and SMOKE-08 (landscape side-notch respect) per CONTEXT.md D-19. Playwright cannot render the Dynamic Island even at iPhone-14-Pro-Max viewport (PITFALLS.md P-19), so source-grep is the correct CI proxy and T-13 is the deliberate landed regression guard.

## Ready for next step

Plan 48-02 is complete. Plan 48-01 (FOCUS — InputDrawer.svelte autofocus removal) is the sibling plan and runs on a different file with no shared state per D-16. After both 48-01 and 48-02 land, Phase 48 is ready for `/gsd-verify-work 48`.

## Self-Check: PASSED

- `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-02-SUMMARY.md` exists on disk.
- `src/lib/shell/NavShell.svelte` contains both `pt-[env(safe-area-inset-top,0px)]` and `px-[max(env(safe-area-inset-left,0px),1rem)]`.
- `src/lib/shell/NavShell.test.ts` contains `T-13 NOTCH-TEST-01`.
- Commit `d907db9` (Task 1: feat) found in git log.
- Commit `eb604ba` (Task 2: test) found in git log.
- Plan-level verification: vitest 452/452 passing, svelte-check 0/0, Playwright 250 specs listed cleanly, all source-grep regression guards pass.
