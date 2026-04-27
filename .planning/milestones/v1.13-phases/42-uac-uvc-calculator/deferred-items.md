# Phase 42 — Deferred Items (out-of-scope discoveries)

Items logged here during plan execution are out of scope for Phase 42.
They relate to pre-existing failures observed while running the full test suite
as a regression guard. Do NOT fix in Phase 42 — route to a follow-up phase.

---

## From Plan 42-03 (E2E + axe Playwright tests)

### DEFER-42-03-01 — navigation.spec.ts "about" button assertions are stale after Phase 40

**Found during:** Plan 42-03 Task 2 verification run (`pnpm exec playwright test`).

**Symptom:** 2 pre-existing failures in `e2e/navigation.spec.ts`:
- Line 22: `header.getByRole('button', { name: /about/i })` not found — timeout.
- Line 80: `page.getByRole('button', { name: /about/i })` not found — timeout.

**Root cause:** Phase 40 (commit `00e66f8` — "hamburger → top-left + sliding drawer;
About moves into menu") removed the top-bar About button. About is now an item inside
`src/lib/shell/HamburgerMenu.svelte` (line 140), reachable via the "Open calculator menu"
trigger → "About" button. The `navigation.spec.ts` was NOT updated when About was moved.

**Why NOT fixed in Plan 42-03:** Out of Phase 42 scope.
- Plan 42-03 added only two new Playwright specs (`e2e/uac-uvc.spec.ts`,
  `e2e/uac-uvc-a11y.spec.ts`). It did not edit `e2e/navigation.spec.ts`.
- Phase 42 does not own the Phase 40 hamburger-drawer restructure — fixing
  these assertions belongs to a Phase 40 follow-up OR a dedicated test-debt
  cleanup phase.

**Verification that this is pre-existing (not a Plan 42-03 regression):**
- Both failures reference the old top-bar About button which was removed in Phase 40
  commit `00e66f8` — months before Phase 42.
- My new spec files are additive only (no edits to existing specs or components).

**Remediation sketch (for the future phase that picks this up):**
- Update `navigation.spec.ts:17-24` to either remove the About/Theme assertions
  from the banner landmark, or re-point them into the hamburger drawer:
  ```ts
  await page.getByRole('button', { name: 'Open calculator menu' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: /about/i })).toBeVisible();
  ```
- Update `navigation.spec.ts:79-82` similarly — open hamburger, click About,
  assert dialog content.

**Full suite result as observed during Plan 42-03:** 82 passed, 2 failed (both above),
3 skipped. The 9 new UAC/UVC E2E + 2 new axe tests all pass green.
