---
phase: 47-wave-0-test-scaffolding
plan: 03
subsystem: testing
tags: [playwright, e2e, webkit, ios, multi-project, ci, smoke-test]

# Dependency graph
requires:
  - phase: 47-02
    provides: Test helper conventions for v1.15.1 (independent track — Plan 47-03 does not import the helper; real WebKit ships its own visualViewport so the smoke spec asserts against the live browser, not the jsdom polyfill).
provides:
  - playwright.config.ts — webkit-iphone project entry using devices['iPhone 14 Pro'] (393×660 viewport, iPhone UA, deviceScaleFactor 3, hasTouch true, isMobile true, defaultBrowserType webkit). Existing chromium project preserved byte-for-byte.
  - e2e/webkit-smoke.spec.ts — single-test wiring proof asserting window.visualViewport is defined inside page.evaluate() under both projects.
  - .github/workflows/ci.yml — webkit binary now installed alongside chromium so CI runners can launch the new project.
  - Phase 47 (Wave-0 Test Scaffolding) closure: TEST-01, TEST-02, TEST-03 all delivered.
affects:
  - Phase 49 (DRAWER-TEST-03) — first behavioral consumer of webkit-iphone. Drawer-anchoring assertions under WebKit + iPhone viewport now have a CI-green project to land in.
  - Phase 48 (FOCUS-TEST-03 cross-calculator focus-order) — can opt into webkit-iphone via test.skip(({browserName}) => …) inversion if it needs WebKit-specific behavior.

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-project Playwright config — second project entry appended after the existing chromium entry, sharing the same top-level `webServer`, `use`, `timeout`, `workers` and reporter config. Mirrors the @playwright/test multi-project convention without `globalSetup` / `testIgnore` / `testMatch` filters (D-15)."
    - "Device-descriptor spread (`{ ...devices['iPhone 14 Pro'] }`) — `defaultBrowserType: 'webkit'` on the descriptor implicitly selects the WebKit engine, so no explicit `browserName: 'webkit'` override is needed (RESEARCH.md Q3)."
    - "Wiring-proof smoke spec — bare `await page.goto('/')` + `page.evaluate()` typeof check, no UI interaction, no disclaimer-dismiss boilerplate. Single test compatible with BOTH projects so neither project needs a test.skip."
    - "CI webkit install paired with config edit — the `playwright install --with-deps chromium webkit` change MUST land alongside the new project entry; otherwise CI runners fail at browser launch."

key-files:
  created:
    - e2e/webkit-smoke.spec.ts
  modified:
    - playwright.config.ts
    - .github/workflows/ci.yml

key-decisions:
  - "Single-test smoke spec — no second test asserting iPhone user-agent or 393×660 viewport. A second test would be chromium-incompatible (Desktop Chrome reports a desktop UA + 1280×720 viewport) and would force a `test.skip(browserName !== 'webkit', …)` reverse-direction skip that violates D-15's spirit (D-15 only authorizes webkit-incompatible→skip-on-webkit, not the reverse). Plan 47-03 was revised in commit d0bfe98 specifically to remove this exact pattern."
  - "No `testMatch` / `testIgnore` filtering between projects (D-15). Both projects run all 21 e2e spec files. webkit-iphone runs the same 125 specs as chromium — several existing specs (notably desktop-full-nav.spec.ts and desktop-full-nav-a11y.spec.ts that pin 1280×800) WILL fail under webkit-iphone because of viewport/UA mismatches. This is captured as a deferred follow-up per D-15 / RESEARCH.md Open Question §2 — not a Phase 47 blocker."
  - "Existing chromium project preserved byte-for-byte (D-13, D-18). The diff in playwright.config.ts is purely additive — 4 inserted lines (the new entry + a comma after the chromium entry's closing brace). D-18's '99-passing chromium suite must still pass' is satisfied (122 passing + 3 pre-existing skips = same baseline since RESEARCH.md was written; new specs from later phases were already passing on chromium)."
  - "CI install line edit is single-line (`chromium` → `chromium webkit`). No separate `Install webkit` step. Playwright's documented invocation accepts space-separated browser names — RESEARCH.md Q5 verified."
  - "`pnpm exec playwright test --list` is the type-check gate for e2e/*.ts (svelte-check / tsc do NOT include e2e/* per the project tsconfig). Playwright transpiles each spec at discovery time and surfaces TS syntax errors there — the `--list` invocation IS the type-check for the new smoke spec."

patterns-established:
  - "Multi-project Playwright pattern — future iOS-form-factor projects (e.g. webkit-ipad, webkit-iphone-landscape) can be appended using the same `{ ...devices['…'] }` spread without modifying the chromium entry or top-level config."
  - "CI browser-install line must list every engine that any project uses. `pnpm exec playwright install --with-deps <list>` is the single source of truth — adding a project to playwright.config.ts requires a paired CI edit if the engine isn't already installed."
  - "Smoke-spec convention for new Playwright projects: a single page.goto('/') + page.evaluate() check that proves wiring without UI interaction. Behavioral assertions belong in feature-phase specs, not in the wiring-proof spec."

requirements-completed: [TEST-03]

# Metrics
duration: 4min
completed: 2026-04-27
---

# Phase 47 Plan 03: webkit-iphone Playwright project Summary

**Adds a `webkit-iphone` Playwright project to `playwright.config.ts` using `devices['iPhone 14 Pro']` (393×660 viewport + iPhone user-agent + WebKit engine via the descriptor's `defaultBrowserType`), creates a minimal `e2e/webkit-smoke.spec.ts` that asserts `window.visualViewport` is defined under both projects, and updates `.github/workflows/ci.yml` so CI installs the WebKit binary — closing the last requirement in Phase 47 (Wave-0 Test Scaffolding) and unblocking Phase 49's DRAWER-TEST-03 behavioral assertions on iOS form factor.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-27T07:46:26Z
- **Completed:** 2026-04-27T07:50:35Z
- **Tasks:** 2/2 complete (no deviations)
- **Files created:** 1 (`e2e/webkit-smoke.spec.ts`)
- **Files modified:** 2 (`playwright.config.ts`, `.github/workflows/ci.yml`)
- **Playwright project delta:** 1 → 2 (`chromium` preserved + `webkit-iphone` added)
- **Test count delta:** chromium 124 → 125 (+1 smoke spec); new webkit-iphone project = 125 (same specs, no testMatch filter per D-15) — total `--list` output 250 in 21 files
- **svelte-check delta:** 4589 → 4589 (e2e/*.ts is outside the svelte-check tsconfig include list, by design — Playwright's own `--list` invocation is the type-check gate)

## Accomplishments

- Appended a `webkit-iphone` project entry to `playwright.config.ts:projects[]` after the existing `chromium` entry. Existing entry remains byte-for-byte identical (verified via `git diff playwright.config.ts` — pure 4-line addition + a trailing comma; no other lines touched).
- Created `e2e/webkit-smoke.spec.ts` (18 lines including header comment) with the verbatim minimum content from RESEARCH.md Q7: a single `test('visualViewport is defined', …)` that navigates to `/`, runs `page.evaluate(() => typeof window.visualViewport === 'object' && window.visualViewport !== null)`, and asserts the result is `true`. No `test.describe`, no `test.skip`, no second test, no UI interaction.
- Updated `.github/workflows/ci.yml:70` from `pnpm exec playwright install --with-deps chromium` to `pnpm exec playwright install --with-deps chromium webkit` — single-line edit, single insertion, single deletion (verified via `git diff --stat`).
- Verified locally that the new project + smoke spec are wired correctly:
  - `pnpm exec playwright test --list` shows TWO projects (`chromium`, `webkit-iphone`), 125 tests each, 250 total in 21 files. Smoke spec appears under BOTH project listings.
  - `pnpm exec playwright test webkit-smoke` passes 2/2 (1 chromium + 1 webkit-iphone, 5.8s wall clock).
  - `pnpm exec playwright test --project=webkit-iphone webkit-smoke` passes 1/1 in isolation.
  - `pnpm exec playwright test --project chromium` reports 122 passed + 3 pre-existing skips (no chromium regression — D-18 satisfied).
- `pnpm run check` reports 0 errors / 0 warnings / 4589 files (unchanged — e2e/*.ts is outside the svelte-check tsconfig include list per the project's design).

## Task Commits

Each task was committed atomically per project convention:

1. **Task 1: Add webkit-iphone Playwright project + create smoke spec** — `1d5dcaa` (feat)
2. **Task 2: Update CI workflow to install the WebKit browser binary** — `36f00ae` (chore)

**Plan metadata commit:** _to be appended after SUMMARY commit_

## Files Created/Modified

- `e2e/webkit-smoke.spec.ts` (NEW, 18 lines) — single `test('visualViewport is defined', …)`. Imports only `{ expect, test }` from `@playwright/test`. No `test.describe`, no `test.skip`, no `beforeEach`, no UI interaction. Bare `await page.goto('/')` + `page.evaluate()` typeof check.
- `playwright.config.ts` (MODIFIED, +4 lines) — second `projects[]` entry appended after `chromium`. Existing entry unchanged. No new imports (`devices` already imported at line 1). No `webServer`, `use`, `timeout`, `workers` or other top-level field touched.
- `.github/workflows/ci.yml` (MODIFIED, +1/-1 line) — line 70's `playwright install` browser list extended from `chromium` to `chromium webkit`. `--with-deps` preserved (system libraries for both engines). No other line of `ci.yml` touched.

## Diffs (verbatim)

**`playwright.config.ts`** (commit `1d5dcaa`):

```diff
@@ -16,6 +16,10 @@ export default defineConfig({
     {
       name: 'chromium',
       use: { ...devices['Desktop Chrome'] }
+    },
+    {
+      name: 'webkit-iphone',
+      use: { ...devices['iPhone 14 Pro'] }
     }
   ],
   webServer: process.env.CI
```

**`e2e/webkit-smoke.spec.ts`** (commit `1d5dcaa`, full file):

```ts
// e2e/webkit-smoke.spec.ts
// Phase 47 / TEST-03: smoke check that the webkit-iphone Playwright project
// is wired correctly. Behavioral assertions belong to Phase 49 (DRAWER-TEST-03).
//
// Goal: prove (a) the project loads, (b) the page navigates, (c) the running
// browser reports a non-null window.visualViewport (real WebKit + real chromium,
// independent of the jsdom polyfill from Plan 47-01). This single test runs in
// BOTH projects and passes in BOTH — no test.skip, no testMatch filter.
import { expect, test } from '@playwright/test';

test('visualViewport is defined', async ({ page }) => {
  await page.goto('/');
  const hasVV = await page.evaluate(() => {
    return typeof window.visualViewport === 'object' && window.visualViewport !== null;
  });
  expect(hasVV).toBe(true);
});
```

**`.github/workflows/ci.yml`** (commit `36f00ae`):

```diff
@@ -67,7 +67,7 @@ jobs:
         run: pnpm install --frozen-lockfile

       - name: Install Playwright browsers
-        run: pnpm exec playwright install --with-deps chromium
+        run: pnpm exec playwright install --with-deps chromium webkit

       - name: Run Playwright tests
         run: pnpm exec playwright test
```

## Decisions Made

1. **Single-test smoke spec — no UA/viewport assertions.** A second test asserting `navigator.userAgent.includes('iPhone')` or `page.viewportSize() === { width: 393, height: 660 }` would be chromium-incompatible (Desktop Chrome reports a desktop UA + 1280×720 viewport) and would force a `test.skip(({browserName}) => browserName !== 'webkit', …)` reverse-direction skip. The plan was REVISED in commit d0bfe98 to remove this exact pattern (it violated D-15's spirit). Phase 49's DRAWER-TEST-03 will add device-specific behavioral assertions inside specs that already gate on the project.
2. **No `test.describe` block, no `beforeEach`.** Single file, single test, below the threshold for grouping (PATTERNS.md §`e2e/webkit-smoke.spec.ts`). The pwa.spec.ts disclaimer-dismiss boilerplate was deliberately NOT mirrored — the smoke spec doesn't interact with calculator UI.
3. **No `testMatch` / `testIgnore` filtering between projects (D-15).** Both projects run the same 21 e2e spec files. webkit-iphone runs all 125 chromium specs. Several existing specs (notably `desktop-full-nav.spec.ts` and `desktop-full-nav-a11y.spec.ts`) WILL fail under webkit-iphone because they pin 1280×800 desktop chrome — captured as deferred follow-up per D-15 / RESEARCH.md Open Question §2. Phase 47 does NOT add `test.skip(({browserName}) => browserName === 'webkit', …)` annotations to any existing spec.
4. **CI install paired with config edit, not deferred.** The `playwright.config.ts` edit and the `ci.yml` browser-list edit MUST land together (or in adjacent commits) — otherwise the next CI run fails at browser launch with `Executable doesn't exist at .../webkit-XXXX/...`. Two atomic commits in the same plan was the cleanest option.
5. **Local-dev gotcha surfaced explicitly.** Developers running `pnpm exec playwright test` for the first time after this plan merges will hit the same `Executable doesn't exist` error until they run `pnpm exec playwright install webkit` once. The error message is actionable, but flagging it in this SUMMARY (and in onboarding) avoids surprise.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1 (auto-fix bug), Rule 2 (auto-add critical), Rule 3 (auto-fix blocker), or Rule 4 (architectural) deviations triggered. Both action sketches landed byte-for-byte:

- The `playwright.config.ts` diff matches the plan's "Required new entry" snippet exactly.
- The `e2e/webkit-smoke.spec.ts` content matches the plan's "Required content (final form — do NOT add additional tests)" snippet byte-for-byte.
- The `.github/workflows/ci.yml` diff is the single-line change specified in Task 2, with `--with-deps` preserved as required.

## Issues Encountered

**Worktree branch was 14 commits behind `main` at start.** The agent worktree branch was cut at `df30e64` (before the Phase 47 plan files and Plan 47-01/47-02 work landed on `main`). A clean fast-forward merge from `main` (zero local commits to rebase, clean working tree) brought the worktree to commit `854c1ef` so the planning artifacts and prior 47-01/47-02 deliverables were available for the executor. No conflicts. Not a code-level issue; a worktree-lifecycle issue worth noting for future parallel-executor runs.

**No other issues.** Authentication gates: none. CLAUDE.md compliance: this plan is GSD-authorized (`/gsd-execute-phase` flow); no edits made outside the workflow.

## User Setup Required

**For developers (one-time after merge):**

```bash
pnpm exec playwright install webkit
```

This downloads the ~99 MiB WebKit binary to `~/.cache/ms-playwright/`. Without it, `pnpm exec playwright test` will fail with:

```
Error: browserType.launch: Executable doesn't exist at /home/<user>/.cache/ms-playwright/webkit-XXXX/...
```

The Playwright error message itself is actionable (it suggests `Run "npx playwright install webkit"`). CI runners get the binary automatically via the `.github/workflows/ci.yml` edit.

**No environment variables, no secrets, no external services.**

## Verification Results

| Gate | Expected | Actual | Status |
|------|----------|--------|--------|
| `pnpm exec playwright test --list` shows 2 projects | `chromium` + `webkit-iphone` | 2 projects listed, 125 tests under each, 250 total in 21 files | PASS |
| Smoke spec listed under BOTH projects | Once per project | `[chromium] › webkit-smoke.spec.ts:11:1 › visualViewport is defined` AND `[webkit-iphone] › webkit-smoke.spec.ts:11:1 › visualViewport is defined` both present | PASS |
| Smoke spec passes under both projects | 2 / 2 | 2 / 2 (chromium 2.3s + webkit-iphone 2.3s, 5.8s wall clock) | PASS |
| Smoke spec passes under webkit-iphone alone | 1 / 1 | 1 / 1 (`pnpm exec playwright test --project=webkit-iphone webkit-smoke`) | PASS |
| Existing chromium suite remains green (D-18) | 122 passed + 3 pre-existing skips, 0 new failures | 122 passed, 3 skipped, 0 failed (43.5s wall clock) | PASS |
| `pnpm run check` (svelte-check) | 0 errors / 0 warnings | 0 errors / 0 warnings (4589 files — unchanged from Plan 47-02 baseline; e2e/*.ts is outside the svelte-check include list per project tsconfig) | PASS |
| `playwright.config.ts` diff is purely additive | chromium entry byte-for-byte unchanged; only the new `webkit-iphone` entry + a trailing comma added | `git diff playwright.config.ts` shows +4 lines (1 comma + 3 entry lines + 1 closing brace), 0 lines changed/removed in the chromium block | PASS |
| `.github/workflows/ci.yml` diff is single-line | 1 insertion, 1 deletion on line 70 | `git diff --stat .github/workflows/ci.yml` shows `1 file changed, 1 insertion(+), 1 deletion(-)` | PASS |
| Playwright `--list` is the type-check gate for `e2e/webkit-smoke.spec.ts` | No TS syntax errors at discovery | `--list` succeeds with no transpile errors; spec discovered cleanly | PASS |
| Atomic commit prefixes | `feat(47-03):` + `chore(47):` | `1d5dcaa feat(47-03): add webkit-iphone Playwright project and visualViewport smoke spec` + `36f00ae chore(47): install webkit browser in CI for new webkit-iphone Playwright project` | PASS |

## Threat Surface Notes

The plan's `<threat_model>` register lists T-47-09..T-47-15. All mitigations relevant to this plan landed as written:

- **T-47-09 (Tampering — `playwright.config.ts` chromium entry accidentally modified):** mitigated. Verified via `git diff playwright.config.ts` — chromium entry's three lines (`name: 'chromium'`, `use: { ...devices['Desktop Chrome'] }`, closing brace) are byte-for-byte unchanged. Only additions are the trailing comma after the chromium closing brace and the four lines for the new entry. The chromium-suite-green gate (`pnpm exec playwright test --project chromium` → 122/0/3) is the regression sentinel and ran clean.
- **T-47-10 (Tampering — `.github/workflows/ci.yml` other lines accidentally modified):** mitigated. `git diff --stat` shows `1 file changed, 1 insertion(+), 1 deletion(-)` — exactly the line-70 edit. The hunk diff confirms only `chromium` → `chromium webkit` on the run line; no surrounding YAML touched.
- **T-47-11 (Information disclosure — smoke spec leaks user data):** n/a (per plan). Spec navigates to `/` (no auth, no PII), evaluates a typeof check, asserts `window.visualViewport` is defined. No sensitive data crosses the test boundary.
- **T-47-12 (DoS — webkit binary download fails on CI):** accept (per plan). Playwright CDN uptime is high; transient failure → re-run job. Not a phase blocker.
- **T-47-13 (Elevation of privilege — webkit binary on CI):** accept (per plan). Same trust class as the existing chromium install on the same ephemeral `ubuntu-latest` runner.
- **T-47-14 (Repudiation — chromium 99-passing suite regresses unnoticed):** mitigated. `pnpm exec playwright test --project chromium` ran clean (122 passed + 3 pre-existing skips, 0 new failures). CI logs will record per-project pass count on the next run.
- **T-47-15 (Information disclosure — webkit-iphone runs ALL specs and a spec leaks calculator state):** accept (per plan). Existing specs were designed for chromium; running them under webkit-iphone may surface different behavior, but they don't expose new attack surface. The deferred follow-up (below) is informational, not a security gate.

No new threat flags surfaced during execution.

## Deferred Follow-up (for STATE.md Pending Todos)

Per CRITICAL CONSTRAINT #7 of the executor context and CONTEXT.md `<deferred>` §1:

**Existing-spec compatibility under webkit-iphone is OUT OF SCOPE for Phase 47.** Several existing specs WILL fail under the new project because they pin desktop viewport / DOM. Phase 47 does NOT add `test.skip(({browserName}) => browserName === 'webkit', …)` annotations to mask these — D-15 forbids inter-project filtering at the config level, and per-spec skips are a deferred-follow-up decision (RESEARCH.md Open Question §2 explicitly recommends "do NOT skip in Phase 47; capture as deferred follow-up").

**Spec compatibility table** (per RESEARCH.md Q6, with deferred-todo categorization):

| Category | Specs | Disposition |
|----------|-------|-------------|
| **confirmed-fail** under webkit-iphone (393×660 viewport, iPhone UA) | `desktop-full-nav.spec.ts`, `desktop-full-nav-a11y.spec.ts` | Pin 1280×800 desktop viewport; assertions assume desktop nav DOM. Need either `test.skip(({browserName}) => browserName === 'webkit', 'desktop-only specs')` or split into per-engine spec files. Deferred to Phase 47-followup or absorbed into Phase 48 if it touches NavShell. |
| **likely-pass** (self-contained mobile viewports) | `mobile-nav-clearance.spec.ts`, `favorites-nav.spec.ts`, `feeds.spec.ts`, `gir.spec.ts`, `formula.spec.ts`, `pwa.spec.ts` | Set their own per-test viewport via `test.use({ viewport: 375×667 })` or `page.setViewportSize(...)` — should run cleanly under both engines. Verify on the next CI run. |
| **unverified** (need first-CI-run signal) | `pert.spec.ts`, `pert-a11y.spec.ts`, `uac-uvc.spec.ts`, `uac-uvc-a11y.spec.ts`, `morphine-wean.spec.ts`, `morphine-wean-a11y.spec.ts`, `disclaimer-banner.spec.ts`, `navigation.spec.ts`, `fortification-a11y.spec.ts`, `favorites-nav-a11y.spec.ts`, `feeds-a11y.spec.ts`, `gir-a11y.spec.ts` | Mixed viewport patterns; some pin desktop in a subset of tests (`navigation.spec.ts:64` sets 1280×800). May surface webkit-specific timing or DOM differences. Capture failures from the first CI run and triage. |

**Recommended STATE.md Pending Todo:**

> **Phase 47-03 follow-up:** After the first CI run completes against the new `webkit-iphone` project, triage failing specs by category. Add `test.skip(({browserName}) => browserName === 'webkit', '<reason>')` to confirmed-incompatible specs (start with `desktop-full-nav.spec.ts` and `desktop-full-nav-a11y.spec.ts`). For unverified specs that fail, decide per-spec whether to skip-on-webkit, port to mobile viewport, or split into per-engine files. Do NOT add `testMatch`/`testIgnore` filters to `playwright.config.ts` (D-15). Target: get webkit-iphone CI to green before Phase 48 begins, OR accept webkit-iphone as informational (chromium remains the green gate) until Phase 49 substantive specs land.

This todo is informational — Phase 47's narrow success criteria (D-16) are satisfied without resolving it (chromium green, webkit-iphone smoke spec green).

## Phase 47 Closure (Wave-0 Test Scaffolding)

This plan is the **last plan** in Phase 47. With Plan 47-01 (visualViewport polyfill in `src/test-setup.ts` + co-located self-test), Plan 47-02 (`src/lib/test/visual-viewport-mock.ts` helper + co-located unit test), and Plan 47-03 (webkit-iphone Playwright project + smoke spec + CI install) all delivered, **Phase 47 is complete**.

**Wave-0 deliverables (TEST-01..03):**
- ✅ TEST-01 (Plan 47-01, commits `350d279` + `ad6715c` + `f34461f`) — `window.visualViewport` polyfill in `src/test-setup.ts` with throw-on-regression self-test mirroring HTMLDialogElement at lines 122-149.
- ✅ TEST-02 (Plan 47-02, commits `bb0b407` + `76c9152` + `854c1ef`) — `src/lib/test/visual-viewport-mock.ts` helper with five framework-neutral exports + co-located T-01..T-07 unit test.
- ✅ TEST-03 (Plan 47-03, commits `1d5dcaa` + `36f00ae` + this SUMMARY commit) — `webkit-iphone` Playwright project + smoke spec + CI webkit install.

**Phase 47 Success Criteria** (from 47-CONTEXT.md D-16):
- (a) Polyfill self-test passes at vitest startup → satisfied by Plan 47-01 (444 vitest tests pass on every run).
- (b) Helper functions are deterministic and importable → satisfied by Plan 47-02 (T-01..T-07 all green; framework-neutral verified by grep).
- (c) `pnpm exec playwright test --list` shows two projects → satisfied by Plan 47-03 (chromium + webkit-iphone, 250 tests in 21 files).
- (d) The smoke spec passes → satisfied by Plan 47-03 (2/2 across both projects).

**Existing 439+ vitest tests still pass (D-17):** Yes — Plan 47-02's run reported 451/451 (444 prior + 7 new); this plan does not touch vitest.

**Existing 99-passing chromium Playwright suite still passes (D-18):** Yes — this plan's `pnpm exec playwright test --project chromium` reports 122 passed + 3 pre-existing skips, 0 new failures. (Baseline grew from 99 to 125 because Phase 42 + Phase 45 added specs since RESEARCH.md was written; all of those continue to pass on chromium.)

## Next Phase Readiness

**Phase 48 (Wave-1 NOTCH + FOCUS):** Unblocked. Has access to the polyfill (Plan 47-01) for any vitest unit tests, the helper (Plan 47-02) for jsdom keyboard simulation, and the webkit-iphone project (Plan 47-03) for Playwright assertions if FOCUS-TEST-03 needs cross-engine focus-order verification.

**Phase 49 (Wave-2 visualViewport Drawer):** Unblocked. DRAWER-TEST-01..02 (vitest) consume the polyfill + helper. DRAWER-TEST-03 (Playwright) is the first behavioral consumer of the webkit-iphone project — uses `page.evaluate(() => window.visualViewport.height)` directly against real WebKit, independent of the jsdom polyfill. Phase 49 may also need to address the deferred-follow-up triage of existing-spec/webkit incompatibilities depending on which specs it touches.

**Phase 50 (Wave-3 Real-iPhone Smoke):** Unblocked at the test-infrastructure level. Phase 50's manual checklist is independent of Phase 47 deliverables; the webkit-iphone Playwright project does NOT replace it (Playwright cannot emulate iOS keyboard, notch, or Dynamic Island per STACK.md / PITFALLS.md — Phase 50 closes that gap with manual verification).

**Phase 51 (Release v1.15.1):** Unblocked once Phases 48 + 49 + 50 ship.

## Self-Check: PASSED

- File `e2e/webkit-smoke.spec.ts` created (commit `1d5dcaa`) — verified via `[ -f ]`.
- File `playwright.config.ts` modified (commit `1d5dcaa`) — verified via `git log -- playwright.config.ts`.
- File `.github/workflows/ci.yml` modified (commit `36f00ae`) — verified via `git log -- .github/workflows/ci.yml`.
- Commit `1d5dcaa` exists on the worktree branch — verified via `git log --oneline | grep 1d5dcaa`.
- Commit `36f00ae` exists on the worktree branch — verified via `git log --oneline | grep 36f00ae`.
- `pnpm run check` 0/0 — verified twice (after Task 1 and overall verification).
- `pnpm exec playwright test --list` shows 2 projects with 125 tests each — verified.
- `pnpm exec playwright test webkit-smoke` 2/2 passed — verified.
- `pnpm exec playwright test --project chromium` 122 passed + 3 pre-existing skips + 0 failed — verified.
- `git diff --stat .github/workflows/ci.yml` shows `1 insertion(+), 1 deletion(-)` — verified.
- `playwright.config.ts` chromium entry byte-for-byte unchanged — verified by reading the diff hunk.

---

*Phase: 47-wave-0-test-scaffolding*
*Plan: 03 (last plan in Phase 47 — phase complete)*
*Completed: 2026-04-27*
