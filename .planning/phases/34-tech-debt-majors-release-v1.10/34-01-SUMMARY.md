---
phase: 34-tech-debt-majors-release-v1.10
plan: 01
subsystem: tech-debt / release
tags: [typescript, types-node, release, v1.10]
requires: [32-01, 33-01]
provides:
  - "@types/node on v25"
  - "typescript on v6"
  - "package.json at 1.10.0"
  - "AboutSheet auto-reflects v1.10.0 via __APP_VERSION__"
  - "PROJECT.md Validated list refreshed for v1.10"
affects:
  - package.json
  - pnpm-lock.yaml
  - .planning/PROJECT.md
tech-stack:
  added: []
  patterns:
    - "Build-time version injection via vite.config.ts define __APP_VERSION__ (unchanged)"
key-files:
  modified:
    - package.json
    - pnpm-lock.yaml
    - .planning/PROJECT.md
  created: []
decisions:
  - "TS 6 upgrade landed cleanly on first attempt — 0 errors / 0 warnings, no source edits required, SvelteKit ambient include list preserved"
  - "REF-01 (GIR population reference card) and Target GIR summary hero card portion of GIR-SWAP-01..03 marked retired in v1.10 Validated list with strikethrough"
metrics:
  duration: "~6 min"
  completed: "2026-04-09"
  tasks: 5
  commits: 4
---

# Phase 34 Plan 01: Tech Debt Majors + Release v1.10 Summary

Closed v1.9's two deferred dep majors (`@types/node` 22→25 and `typescript` 5→6) and shipped v1.10 as a self-describing release via `package.json` version bump + PROJECT.md Validated list refresh.

## Execution Summary

| Task | Requirement | Commit | Description |
|------|-------------|--------|-------------|
| 1 | DEBT-MAJ-01 | `a499d22` | Bump `@types/node` 22.19.17 → 25.5.2 |
| 2 | DEBT-MAJ-02 | `aef2d92` | Bump `typescript` 5.9.3 → 6.0.2 |
| 3 | REL-01 | `06a076a` | `package.json` version 1.9.0 → 1.10.0 |
| 4 | REL-02 | (verify-only) | `pnpm build` succeeds; `about-content.ts` unchanged; `1.10.0` present in built bundle |
| 5 | REL-03 | `b31c1c7` | PROJECT.md Validated list — v1.10 entries appended, REF-01 + GIR-SWAP summary-hero portion struck through, footer updated |

## Final Gate

| Gate | Result |
|------|--------|
| `pnpm check` (svelte-check on TS 6) | 0 errors / 0 warnings (4521 files) |
| `pnpm test:run` (vitest) | 17 files / 203 tests passing |
| `pnpm build` (adapter-static + vite-pwa) | ✓ 35 precache entries (320.77 KiB), `1.10.0` injected in bundle |
| `pnpm exec playwright test` | 48 passed / 3 skipped / 0 failed; 16/16 axe sweeps green |

## Requirement Traceability

| Req | Status | Evidence |
|-----|--------|----------|
| DEBT-MAJ-01 | ✓ | `package.json` → `"@types/node": "^25.5.2"`, commit `a499d22`, post-bump gate green |
| DEBT-MAJ-02 | ✓ | `package.json` → `"typescript": "^6.0.2"`, commit `aef2d92`, full gate green (svelte-check 0/0, vitest 203/203, build ✓, Playwright 48/3/0 + 16/16 axe) |
| REL-01 | ✓ | `package.json` line 4 → `"version": "1.10.0"`, commit `06a076a` |
| REL-02 | ✓ | `pnpm build` success; `git diff --stat src/lib/shared/about-content.ts` empty; `grep "1.10.0" build/_app/immutable/` finds hits |
| REL-03 | ✓ | PROJECT.md: 4 v1.10 Validated entries appended, REF-01 struck through with "retired in v1.10" note, GIR-SWAP summary-hero-card portion struck through, footer updated to "milestone shipped", commit `b31c1c7` |

## Deviations from Plan

**None — plan executed exactly as written.**

The Pause Criteria for Task 2 (TS 6) did not fire. `pnpm add -D typescript@^6` resolved to 6.0.2 and the full gate came back green on the first attempt with zero source edits, zero tsconfig changes, zero test adjustments. The `.svelte-kit/ambient.d.ts` include guard from Phase 30-02 held perfectly under TS 6.

Edit C (conditional — re-deferral NOTES.md + Key Decisions row) in Task 5 was not needed. `.planning/phases/34-tech-debt-majors-release-v1.10/NOTES.md` was NOT created — nothing to document.

## Key Observations (for v2.0+)

- **TS 6 was a non-event.** The Phase 30-02 deferral was cautious but correct — TS 6 was only one week old at that time. Picking it up in Phase 34 with nothing riding on it made the upgrade trivial. This is the right deferral pattern for major-version dep risks.
- **The `__APP_VERSION__` build-time define pattern (Phase 31-01) has now earned its third clean release (v1.9, v1.10).** About sheet updates are free — one line in `package.json` and the bundle picks it up. Retain this pattern for v2.0.
- **`vite-plugin-pwa` peer warning against Vite 8** continues to be noisy but harmless. Not TS-related. Upstream fix tracked separately.

## Self-Check: PASSED

- [x] FOUND: `package.json` with `"version": "1.10.0"`, `"@types/node": "^25.5.2"`, `"typescript": "^6.0.2"`
- [x] FOUND: `.planning/PROJECT.md` with v1.10 entries + strikethroughs + updated footer
- [x] FOUND: commit `a499d22` (DEBT-MAJ-01)
- [x] FOUND: commit `aef2d92` (DEBT-MAJ-02)
- [x] FOUND: commit `06a076a` (REL-01)
- [x] FOUND: commit `b31c1c7` (REL-03)
- [x] VERIFIED: `src/lib/shared/about-content.ts` unchanged in git (REL-02 guardrail honored)
- [x] VERIFIED: final gate (svelte-check 0/0, vitest 203/203, build ✓, Playwright 48/3/0 + 16/16 axe)
