---
phase: 30
plan: "02"
subsystem: tech-debt
tags: [deps, svelte-check, dead-code, eslint-decision, e2e-drift]
requires: [phase-30-01]
provides: [clean-svelte-check, current-deps-within-major, pruned-shared-lib, green-e2e-baseline]
affects:
  - package.json
  - pnpm-lock.yaml
  - tsconfig.json
  - src/app.d.ts
  - src/virtual-pwa.d.ts
  - src/lib/gir/GirCalculator.svelte
  - src/lib/shared/components/SegmentedToggleHarness.svelte
  - src/lib/shared/components/ResultsDisplay.svelte
  - src/lib/shared/index.ts
  - e2e/navigation.spec.ts
  - e2e/formula.spec.ts
  - e2e/gir.spec.ts
  - e2e/morphine-wean.spec.ts
  - .planning/PROJECT.md
tech-stack:
  added: []
  patterns:
    - per-group-dep-bump-with-gate
    - local-ambient-d-ts-for-vite-virtual-modules
key-files:
  created:
    - src/virtual-pwa.d.ts
    - .planning/phases/30-impeccable-polish-tech-debt-sweep/30-02-SUMMARY.md
  modified:
    - package.json
    - pnpm-lock.yaml
    - tsconfig.json
    - src/app.d.ts
    - src/lib/gir/GirCalculator.svelte
    - src/lib/shared/components/SegmentedToggleHarness.svelte
    - e2e/navigation.spec.ts
    - e2e/formula.spec.ts
    - e2e/gir.spec.ts
    - e2e/morphine-wean.spec.ts
    - .planning/PROJECT.md
  deleted:
    - src/lib/shared/components/ResultsDisplay.svelte
    - src/lib/shared/index.ts
decisions:
  - ESLint dropped from DEBT-03 in favor of svelte-check + Prettier (never installed, zero added signal on 3-calculator PWA)
  - virtual:pwa-info / virtual:pwa-register declared locally (vite-plugin-pwa subpath type exports are not followed by TS triple-slash references)
  - GlucoseBucket narrowing fixed via explicit type assertion at JSON import site (not any cast)
  - ResultsDisplay.svelte + shared/index.ts barrel deleted as confirmed dead code (deferred across v1.4–v1.6 research passes)
  - Major-version bumps (@types/node 22→25, typescript 5→6) explicitly deferred per non-goals guardrail
  - 8 pre-existing e2e drifts fixed instead of re-deferred — DEBT-04 picked them up cleanly
metrics:
  completed: 2026-04-09
  tasks-committed: 8
  dep-groups-bumped: 4 of 4
  axe-sweeps: 16/16 green
---

# Phase 30 Plan 02: Tech Debt Sweep Summary

All four dependency groups bumped within their current majors, all five pre-existing svelte-check errors plus one warning resolved, confirmed dead code removed, ESLint decision recorded, and every one of the 8 Plan 30-01 deferred e2e drifts picked up and fixed — ending with svelte-check 0/0, vitest 205/205, Playwright 48 passed + 3 skipped + 0 failed, 16/16 axe green, and only two major-version upgrades remaining (both explicitly out of scope).

## Commits

| # | Task | Commit | Scope |
|---|---|---|---|
| 1 | svelte-check — 5 errors + 1 warning resolved | `93389d3` | DEBT-03 + Phase 29 pickup |
| 2 | ESLint decision recorded (drop, use svelte-check + Prettier) | `fa5e0cd` | DEBT-03 |
| 3 | Group D bump — `@lucide/svelte` 1.7.0→1.8.0, `bits-ui` 2.16.5→2.17.3 | `5c5eea2` | DEBT-01 |
| 4 | Group C bump — `vitest`/`@vitest/ui` 4.1.2→4.1.4, `@playwright/test` 1.59.0→1.59.1, `jsdom` 29.0.1→29.0.2 | `4108a50` | DEBT-01 |
| 5 | Group B bump — `vite` 8.0.3→8.0.8 | `22166d6` | DEBT-01 |
| 6 | Group A bump — `svelte` 5.55.1→5.55.2, `@sveltejs/kit` 2.55.0→2.57.0 | `9d9806c` | DEBT-01 |
| 7 | Dead code — `ResultsDisplay.svelte` + `shared/index.ts` barrel deleted | `b8192e2` | DEBT-02 + DEBT-04 |
| 8 | E2E DEBT-04 — 8 stale assertions fixed | `1a26763` | DEBT-04 |

Plus `43b3246` (Wave 1) already fixed the `registry.test.ts` length-2→key-set deferral.

## Dependency Group Results

| Group | Deps Bumped | Status | Notes |
|---|---|---|---|
| D — Other | `@lucide/svelte` 1.7.0→1.8.0, `bits-ui` 2.16.5→2.17.3 | ✅ green | First group, smallest blast radius |
| C — Testing | `vitest`/`@vitest/ui` 4.1.2→4.1.4, `@playwright/test` 1.59.0→1.59.1, `jsdom` 29.0.1→29.0.2 | ✅ green | No test drift |
| B — Build | `vite` 8.0.3→8.0.8 | ✅ green | Tailwind already latest within major |
| A — Svelte core | `svelte` 5.55.1→5.55.2, `@sveltejs/kit` 2.55.0→2.57.0 | ✅ green | `adapter-static` and `vite-plugin-svelte` already latest within major |

**Per-group gate on each:** `pnpm check` (svelte-check), `pnpm test:run` (vitest 205/205), `pnpm build` (adapter-static SPA). Final Group A also passed full Playwright (48/3/0) + 16/16 axe.

**Deferred majors (explicitly out of scope per plan non-goals):**
- `@types/node` 22.19.17 → 25.5.2 (major)
- `typescript` 5.9.3 → 6.0.2 (major)

**Peer-dep warning (noise, runtime-harmless):** `vite-plugin-pwa@1.2.0` still advertises a `vite ^3–^7` peer range while we run on Vite 8. The PWA build produces a valid service worker + manifest and 35-entry precache on every run, so this is a stale advertised range upstream — left unchanged.

## svelte-check Pre-existing Errors — Disposition

| # | File:Line | Classification | Fix |
|---|---|---|---|
| 1 | `src/lib/gir/GirCalculator.svelte:13:56` | Genuine type narrowing | Added `GlucoseBucket` import + `as unknown as GlucoseBucket[]` on JSON bucket import (type-only, runtime identical) |
| 2 | `src/lib/shell/NavShell.svelte:2:24` (`$app/state`) | svelte-check env noise — root `tsconfig.json` was replacing the SvelteKit base's `include`, dropping `.svelte-kit/ambient.d.ts` | Added `.svelte-kit/ambient.d.ts`, `non-ambient.d.ts`, `types/**/$types.d.ts` back into the root tsconfig `include` |
| 3 | `src/routes/+layout.svelte:12` (`virtual:pwa-info`) | svelte-check couldn't follow vite-plugin-pwa's `./info` subpath type export via triple-slash `types` reference | Added `src/virtual-pwa.d.ts` ambient declarations (PwaInfo + pwaInfo const) |
| 4 | `src/routes/+layout.svelte:44` (`virtual:pwa-register`) | Same as #3 — the root `virtual:pwa-register` entry is not shipped by vite-plugin-pwa (only the `virtual:pwa-register/svelte` framework helper is) | Same ambient file, added `registerSW` + `RegisterSWOptions` declaration matching our usage |
| 5 | `src/routes/+page.svelte:2:24` (`$app/navigation`) | Same as #2 | Resolved by the same `tsconfig.json` include fix |
| 6 (warning) | `src/lib/shared/components/SegmentedToggleHarness.svelte:5:22` (`state_referenced_locally`) | Test-only harness that intentionally captures the `initial` prop once at mount | `svelte-ignore state_referenced_locally` with rationale comment (not a runtime bug) |

**Result:** `pnpm check` → 0 errors / 0 warnings / 0 files with problems across 4496 files.

## Phase 29 `deferred-items.md` Disposition

- ✅ `registry.test.ts:9` length 2 → key-set assertion — already picked up in Wave 1 (`43b3246`).
- ✅ `GirCalculator.svelte:13:56` narrowing — fixed (#1 above).
- ✅ `NavShell.svelte:2:24` `$app/state` — fixed (#2 above).
- ✅ `+layout.svelte:12,44` `virtual:pwa-*` — fixed (#3, #4 above).
- ✅ `+page.svelte:2:24` `$app/navigation` — fixed (#5 above).
- ✅ `SegmentedToggleHarness.svelte:5:22` `state_referenced_locally` — suppressed with rationale (#6 above).

Phase 29 deferred list fully cleared.

## Phase 30-01 `deferred-items.md` Disposition (DEBT-04)

All 8 pre-existing Playwright e2e drifts addressed in commit `1a26763`. Zero product changes — every fix is a test-assertion update tracking UI copy/structure that shipped in v1.5–v1.8.

| # | Spec:Line | Failure | Fix |
|---|---|---|---|
| 1 | `navigation.spec.ts:21` | Bottom nav tabs `toHaveCount(2)` | → `toHaveCount(3)` + assertion for the GIR tab |
| 2 | `formula.spec.ts:12` | `heading 'Formula Recipe'` not visible (test had stale `Modified Formula` tab assertion that errored before reaching heading) | Rewrote assertion set around current SelectPicker-driven Formula UI (heading + unit tablist + Volume label) |
| 3 | `formula.spec.ts:18` | `'Choose a formula brand above to see the recipe'` empty-state copy | Replaced with a recipe-wiring assertion (defaults render a numeric output) |
| 4 | `formula.spec.ts:22` | `'Select Brand'` placeholder | Removed — fortification config loads a default brand, there is no placeholder state |
| 5 | `gir.spec.ts:22` (mobile) | `'TARGET GIR'` exact text | → `/ADJUST RATE|HYPERGLYCEMIA|TARGET REACHED/` matching the Phase 29 / Plan 30-01 b278e7c discriminated-union eyebrow |
| 6 | `gir.spec.ts:22` (desktop) | Same as #5 | Same fix |
| 7 | `morphine-wean.spec.ts:25` | `bg-[var(--color-accent-light)]` locator (pre v1.5 token name) | → `bg-[var(--color-identity-hero)]` (v1.5 Phase 19 identity-token migration) |
| 8 | `morphine-wean.spec.ts:45` | Same locator, different test (compounding) | Same fix (`replace_all` of the class selector) |

## Dead Code Removed (DEBT-02)

**Scan method:** `pnpm dlx knip --no-progress --no-config-hints` + cross-grep for TODO/FIXME/XXX/@deferred markers.

| File | Size | Evidence of deadness |
|---|---|---|
| `src/lib/shared/components/ResultsDisplay.svelte` | 126 LOC | Documented as "exported but unused" across v1.4 Phase 16 SUMMARY, v1.5 Phase 19 RESEARCH ("do not edit — dead code or delete in a separate phase"), and v1.6 research notes. The sole consumer was `src/lib/shared/index.ts`, which itself had zero importers. |
| `src/lib/shared/index.ts` | 13 LOC barrel | Zero imports of `$lib/shared` or `$lib/shared/index` anywhere under `src/` (verified via ripgrep). All calculators import from specific module paths directly. |

**Kept (false positives from knip):**
- `src/lib/index.ts` — SvelteKit `$lib` placeholder convention.
- `workbox-window` devDep — peer of `vite-plugin-pwa`.

No grep hits for `TODO` / `FIXME` / `XXX` / `@deferred` anywhere under `src/`.

## ESLint Decision (DEBT-03)

**Decision:** Drop ESLint from DEBT-03 in favor of `svelte-check` + Prettier only.

**Rationale (recorded in `.planning/PROJECT.md` Key Decisions):**
- ESLint was never installed. Phase 29 executor hit `"eslint not installed"` on the `pnpm lint` script.
- `svelte-check` already covers TS + Svelte semantic errors, including a11y warnings and untyped-prop lint.
- Prettier (still present, `format` script) covers formatting.
- Adding ESLint + `typescript-eslint` + `svelte-eslint-parser` + `eslint-plugin-svelte` would add ~6 devDeps and a second overlapping rule source for zero additional signal on a 3-calculator PWA.

**Implementation:** Removed the stale `"lint": "eslint ."` script from `package.json`. Key Decisions entry dated 2026-04-09 / Phase 30-02.

## Final Verification Gate

| Check | Result |
|---|---|
| `pnpm check` (svelte-check) | **0 errors / 0 warnings / 0 files with problems (4496 files)** |
| `pnpm test:run` (vitest) | **205 / 205 passing** |
| `pnpm build` (adapter-static + vite-pwa) | ✅ green — 35-entry precache (326.47 KiB) |
| `pnpm exec playwright test` | **48 passed / 3 skipped / 0 failed** (skips are PWA specs that require production build) |
| 16/16 axe sweeps (GIR 6 + Fortification 4 + Morphine 6 · light + dark) | ✅ **16 / 16 green** |
| `pnpm outdated` remaining | Only `@types/node` 22→25 and `typescript` 5→6 — both majors, explicitly out of scope |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Node modules missing at plan start**
- **Found during:** Task 1 first `pnpm check` invocation
- **Issue:** Worktree had no `node_modules/` (fresh branch), `pnpm check` failed with `svelte-kit: not found`
- **Fix:** Ran `pnpm install` before baseline. Not counted as a dep change.

**2. [Rule 2 — Missing correctness functionality] tsconfig `include` was replacing the SvelteKit base include**
- **Found during:** Task 1 svelte-check fix classification
- **Issue:** Root `tsconfig.json` `include: ["src/**/*", "vitest.config.ts"]` silently overrode the `.svelte-kit/tsconfig.json` base's `include`, which meant `.svelte-kit/ambient.d.ts` (where `$app/state` and `$app/navigation` module declarations live) was never being picked up by `svelte-check`. This was the root cause of 3 of the 5 pre-existing errors, not 3 independent Vite-virtual-module issues.
- **Fix:** Explicitly included the SvelteKit generated declaration files in the root tsconfig.

### Out of Scope — Deferred

- `@types/node` 22 → 25 and `typescript` 5 → 6 — both majors, barred by the plan's `non_goals` guardrail.
- `vite-plugin-pwa` upstream peer-dep range still advertising `vite ^3–^7` — not our package to fix; runtime is fine.

## Known Stubs

None. All removals are confirmed-dead code paths; no placeholder content was introduced.

## Threat Flags

None. This plan reduces surface (dead code removed, barrel file removed, deps bumped) and adds no new endpoints, trust boundaries, or data paths.

## Cross-cutting Observations for Phase 31 Release

1. **PWA peer-dep drift** — vite-plugin-pwa 1.2.0 still ships with a Vite peer-dep range that excludes 8.x. Either wait for an upstream 1.3 release or consider pinning to vite 7.x latest if upstream stagnates. Runtime currently fine.
2. **TS 6.0 + @types/node 25** — major bumps are now the only outstanding upgrades. Recommend a dedicated single-commit experiment in an early v2.0 phase, since TS 6 removes deprecated compiler behaviours that can surface type errors across the shared component library.
3. **`.svelte-kit/tsconfig.json` `include` override gotcha** — worth adding a comment in the root tsconfig pointing future editors at the base-include override pitfall, so a future dependabot-style config regeneration doesn't accidentally re-drop `ambient.d.ts` and reintroduce the five pre-existing `$app/*` / virtual-module svelte-check errors.
4. **Formula e2e coverage** — the rewritten `formula.spec.ts` is minimal (heading, unit tablist, Volume label, "ml" text). If Phase 31 wants higher confidence, a dedicated formula e2e expansion plan would cover base/brand/unit flows end-to-end.

## Self-Check: PASSED

- `.planning/phases/30-impeccable-polish-tech-debt-sweep/30-02-SUMMARY.md` exists — this file
- All 8 task commits present on worktree branch:
  - `93389d3` svelte-check fixes
  - `fa5e0cd` ESLint decision
  - `5c5eea2` Group D bump
  - `4108a50` Group C bump
  - `22166d6` Group B bump
  - `9d9806c` Group A bump
  - `b8192e2` dead code removal
  - `1a26763` e2e DEBT-04 fixes
- Final verification values recorded above match actual post-plan runs (verified in-session).
