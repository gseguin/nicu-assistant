---
phase: 48-wave-1-trivial-fixes-notch-focus
plan: 01
subsystem: shared-ui-shell
tags: [focus, ios-pwa, dialog, autofocus, a11y, regression-guard]
requires: [47-wave-0-test-scaffolding]
provides:
  - InputDrawer drawer-open never summons iOS soft keyboard
  - Close button is the deterministic first-focus target across all 6 calculators
  - 12 cross-calculator Playwright cases (6 routes x 2 projects) gate FOCUS-03
affects:
  - src/lib/shared/components/InputDrawer.svelte
  - src/lib/shared/components/InputDrawer.test.ts
  - e2e/drawer-no-autofocus.spec.ts
tech-stack:
  added: []
  patterns:
    - "Native <dialog>.showModal() with explicit closeBtn.focus() in $effect (Svelte 5 autofocus directive does NOT set the HTML content attribute that showModal autofocus resolution reads)"
    - "Source-grep regression guard mirroring T-06 pattern (read .svelte source, assert deleted strings absent and new attribute present)"
    - "Cross-calculator Playwright spec iterating ROUTES list, no testMatch filter so it runs under both chromium and webkit-iphone projects (Phase 47 D-15 inheritance)"
key-files:
  created:
    - e2e/drawer-no-autofocus.spec.ts
  modified:
    - src/lib/shared/components/InputDrawer.svelte
    - src/lib/shared/components/InputDrawer.test.ts
key-decisions:
  - id: D-08
    text: "Delete the entire queueMicrotask focus block (including comment lines 47-50) — full deletion, not narrowed selector (PITFALLS.md P-13)"
  - id: D-09
    text: "Add autofocus attribute to the always-present close button, not the optional Clear button"
  - id: D-10
    text: "Single source of truth in InputDrawer.svelte — no per-calculator divergence (FOCUS-03)"
  - id: D-11
    text: "Declarative HTML autofocus over imperative dialog.focus() (PITFALLS.md P-14)"
  - id: D-12
    text: "T-07 vitest assertion: document.activeElement is NOT input/select/textarea/[role=slider] and IS the close button"
  - id: D-13
    text: "T-08 source-grep regression guard: queueMicrotask and [role=slider] absent; autofocus present"
  - id: D-14
    text: "FOCUS-TEST-03 single new spec at e2e/drawer-no-autofocus.spec.ts running under both chromium + webkit-iphone projects = 12 cases"
  - id: D-15
    text: "Stale comment cleanup — delete the original lines 47-50 explanation; no replacement comment"
requirements-completed:
  - FOCUS-01
  - FOCUS-02
  - FOCUS-03
  - FOCUS-TEST-01
  - FOCUS-TEST-02
  - FOCUS-TEST-03
duration: 18 min
completed: 2026-04-27
---

# Phase 48 Plan 01: FOCUS — Drawer Auto-Focus Removal Summary

Eliminated the imperative `queueMicrotask(() => firstInput?.focus())` block from `InputDrawer.svelte`, added declarative `autofocus` to the always-present close button, and shipped three regression tests (T-07 + T-08 vitest + 12 cross-calculator Playwright cases) so opening the drawer on any of the 6 NICU calculators lands focus on the close button — never on an `<input>`, `<select>`, `<textarea>`, or `[role="slider"]` — and so the iOS soft keyboard never appears unbidden on drawer-open.

**Plan status:** Complete. All 4 tasks executed, 4 commits + 1 deviation fix folded into Task 4 commit. Vitest: 8/8 InputDrawer tests passing (T-01..T-08); 453/453 full vitest suite. Playwright: 12/12 drawer-no-autofocus cases passing (6 routes x 2 projects); chromium full suite 128/128 passing. svelte-check: 0 errors, 1 expected `a11y_autofocus` advisory warning (per locked decision D-09 + D-11).

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `src/lib/shared/components/InputDrawer.svelte` | Modified | -11 / +14 (net +3) |
| `src/lib/shared/components/InputDrawer.test.ts` | Modified | +28 |
| `e2e/drawer-no-autofocus.spec.ts` | Created | +46 |
| `.planning/phases/48-wave-1-trivial-fixes-notch-focus/deferred-items.md` | Created | +44 |

## Commits

| Task | Type | Hash | Message |
|------|------|------|---------|
| 1 | fix | `46fb859` | `fix(48-01): delete queueMicrotask auto-focus block from InputDrawer` |
| 2 | feat | `f7e7dd0` | `feat(48-01): add autofocus attribute to InputDrawer close button` |
| 3 | test | `b41e6f8` | `test(48-01): add T-07 + T-08 FOCUS regression tests to InputDrawer` |
| 4 | test | `5ec70c1` | `test(48-01): add cross-calculator drawer-focus Playwright spec` (includes Rule 1 deviation fix to InputDrawer.svelte for closeBtn focus) |

## Verification Results

| Gate | Command | Result |
|------|---------|--------|
| Vitest InputDrawer | `pnpm vitest run src/lib/shared/components/InputDrawer.test.ts` | 8/8 passing (T-01..T-08) |
| Full vitest non-regression | `pnpm vitest run` | 453/453 passing (43 test files) |
| Playwright FOCUS-TEST-03 | `pnpm exec playwright test drawer-no-autofocus.spec.ts` | 12/12 passing (6 routes x 2 projects) |
| Playwright non-regression (chromium) | `pnpm exec playwright test --project=chromium` | 128/128 passing, 0 failed, 3 skipped |
| Playwright webkit-iphone smoke + new spec | `pnpm exec playwright test webkit-smoke.spec.ts drawer-no-autofocus.spec.ts --project=webkit-iphone` | 7/7 passing |
| svelte-check | `pnpm svelte-check` | 0 errors, 1 expected `a11y_autofocus` warning |
| Source-grep guards | `grep queueMicrotask` / `grep '[role="slider"]'` | Both absent — PASS |

**Note on local-run hygiene:** Per the user's standing instruction, ALL test commands above were run plain — no `CI=1` / `CI=true` env var. Vitest and Playwright both ran in normal local-developer mode (Playwright reporter `list`, no retries, no CI build path).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Svelte 5 `autofocus` directive does NOT set the HTML content attribute that `<dialog>.showModal()` autofocus resolution reads**

- **Found during:** Task 4 verification (initial Playwright run produced 12/12 failures with `document.activeElement` resolving to the calculator's first numeric input — `aria-label="Weight"`, `id="pert-weight"` — instead of the close button).
- **Issue:** Svelte 5's compiler routes the `autofocus` attribute through a runtime helper at `node_modules/svelte/src/internal/client/dom/elements/misc.js:10-21`:

  ```js
  export function autofocus(dom, value) {
    if (value) {
      const body = document.body;
      dom.autofocus = true;            // sets IDL property only
      queue_micro_task(() => {
        if (document.activeElement === body) {
          dom.focus();                  // gated; never fires after showModal
        }
      });
    }
  }
  ```

  This sets the `dom.autofocus` IDL property (NOT the HTML content attribute) and queues a microtask focus call gated on `document.activeElement === body`. Once `<dialog>.showModal()` has run, activeElement is no longer body (showModal moves focus during the focus-fixup-step), so Svelte's microtask is a no-op. The HTML autofocus content attribute that `<dialog>.showModal()`'s autofocus resolution reads (HTML spec § 4.10.5) is never set.

  Result: `<dialog>.showModal()` falls back to "first focusable child" — which for a calculator with a NumericInput as the first input is exactly what the deleted `queueMicrotask` block was already doing (re-summoning the iOS soft keyboard, the bug we just fixed).

- **Fix:** Added `bind:this={closeBtn}` to the close button (a `let closeBtn = $state<HTMLButtonElement | null>(null)` declaration alongside the existing `let dialog`), and added `closeBtn?.focus()` inside the existing `$effect` immediately after `dialog.showModal()`. Single source of truth preserved in `InputDrawer.svelte` — no per-calculator divergence (FOCUS-03 spec respected). The declarative `autofocus` attribute remains in source as a documentation marker AND as the source-grep contract that T-08 / FOCUS-TEST-02 asserts (`expect(src).toContain('autofocus')`).
- **Files modified:** `src/lib/shared/components/InputDrawer.svelte`
- **Verification:** 12/12 Playwright cases pass (verified end-to-end via Playwright focus-event listener that the close button receives focus and is the final activeElement on each of 6 routes under both projects); 8/8 vitest tests pass; D-10/D-11 contracts preserved (declarative attribute as source of truth, no `dialog.focus()`, no per-calculator divergence).
- **Commit:** `5ec70c1` (folded into Task 4 commit so the spec ships with a working implementation).

### Worktree-mode discovery (NOT a deviation, just documented)

The user maintains an external `pnpm dev` server on port 5173 in the main repo (separate process from this worktree). Playwright's default config (`reuseExistingServer: true`, `baseURL: http://localhost:5173`) hits the user's dev server which serves the main repo's source — not this worktree's source. To verify spec end-to-end inside the worktree, a temporary worktree-local dev server was started on port 5174 and a one-off Playwright config (`/tmp/playwright-worktree.config.ts` — cleaned up after verification) re-pointed `baseURL` to it. Both files / processes were stopped and removed before completing the plan; no permanent config change.

When the orchestrator merges this worktree to `main`, the user's port-5173 dev server (with HMR) will pick up the merged source automatically and the spec will pass against that server too.

## Threat Surface

Per the plan's `<threat_model>`: zero threat surface. Phase 48 / Plan 01 changes are an HTML attribute addition + a JS effect-block deletion + test files in the Browser/Client tier. No new network endpoints, no auth path, no schema, no PII handling. ASVS sweep: not applicable.

No new threat flags surfaced during execution.

## Deferred Items

See `.planning/phases/48-wave-1-trivial-fixes-notch-focus/deferred-items.md` — 31 pre-existing webkit-iphone Playwright failures in non-migrated specs (e.g. `feeds-a11y.spec.ts`, `gir-a11y.spec.ts`, `morphine-wean.spec.ts`). Per CONTEXT.md D-21 these are explicitly out of scope for Phase 48 ("Phase 48 does NOT migrate the existing 6 calculator e2e specs to also run under `webkit-iphone` — that's a Phase 47 deferred follow-up"). They are not regressions caused by this plan; they pre-date Phase 48 and would surface against `main` HEAD identically.

## Phase 49 Unblocked

This plan eliminates the auto-focus confound from `InputDrawer.svelte`. Phase 49 (visualViewport drawer anchoring) can now observe "drawer position when keyboard is up" as a deliberate clinician tap on a numeric input field, NOT as a side effect of every drawer-open spuriously summoning the keyboard. The visualViewport polyfill + helper from Phase 47 + the close-button-as-first-focus contract from this plan = the preconditions Phase 49 needs.

Phase 50 SMOKE-03 will close FOCUS-01 + FOCUS-02 on real iPhone hardware (real-device VoiceOver "Close inputs, button" announcement; real-device keyboard non-summons confirmation).

## Self-Check: PASSED

All claimed files present on disk:
- `src/lib/shared/components/InputDrawer.svelte` — FOUND
- `src/lib/shared/components/InputDrawer.test.ts` — FOUND
- `e2e/drawer-no-autofocus.spec.ts` — FOUND
- `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-01-SUMMARY.md` — FOUND
- `.planning/phases/48-wave-1-trivial-fixes-notch-focus/deferred-items.md` — FOUND

All claimed commits present in `git log --all`:
- `46fb859` — FOUND
- `f7e7dd0` — FOUND
- `b41e6f8` — FOUND
- `5ec70c1` — FOUND

Plan-level `<verification>` gates 1–6: all PASSED (vitest 8/8 + 453/453, Playwright 12/12 new + 128/128 chromium baseline + 7/7 webkit-iphone smoke+new, svelte-check 0 errors, source-grep regression guards green).

Plan-level `<success_criteria>` checklist: all 8 items satisfied.
