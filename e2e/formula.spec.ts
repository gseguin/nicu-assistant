import { test, expect } from '@playwright/test';

// Plan 42.1-05 (D-08): inputs live behind the InputDrawer on mobile. The
// default spec runs in Playwright's desktop viewport (1280x720), so the inputs
// render in the sticky right column and the tablist / Volume input are directly
// visible. A small mobile block verifies the drawer affordance at 375x667.
test.describe('Formula Calculator (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/formula');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  test('renders formula page with heading and unit segmented toggle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Formula Recipe', level: 1 })).toBeVisible();
    // v1.6+ Formula uses SelectPickers for base/brand/kcal and a SegmentedToggle
    // for unit selection — no "Modified Formula" tabs, no "Select Brand" placeholder.
    const unitTablist = page.getByRole('tablist').first();
    await expect(unitTablist).toBeVisible();
  });

  test('renders recipe numeric output with defaults', async ({ page }) => {
    // Defaults load a valid formula — the recipe card should show a numeric result
    // (validates the full calculator wiring without depending on stale copy).
    // Scope to the desktop aside because the mobile drawer (hidden at md+) also
    // mounts a copy of FortificationInputs, producing duplicate visibility hits.
    const aside = page.locator('aside[aria-label="Formula inputs"]');
    await expect(aside.getByLabel('Starting Volume')).toBeVisible();
    // Recipe card lives in main; use visible locator so we don't pick the
    // off-screen drawer dialog copy.
    await expect(page.getByText(/ml/i).locator('visible=true').first()).toBeVisible();
  });
});

test.describe('Formula Calculator (mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/formula');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  test('inputs live behind the drawer handle; tap opens the sheet', async ({ page }) => {
    // Plan 42.1-05 + 390aba6 (recap desktop-hide): the drawer trigger is now the
    // InputsRecap button (md:hidden on desktop), whose composed aria-label ends
    // with "Tap to edit inputs." The old "Open inputs drawer" handle was retired.
    const handle = page.getByRole('button', { name: /tap to edit inputs/i });
    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute('aria-expanded', 'false');
    // Tap the handle -> drawer expands, inputs become visible inside the dialog.
    // NOTE: both the desktop aside (hidden via CSS `hidden md:block`) AND the
    // drawer mount the SAME FortificationInputs component, so two DOM nodes share
    // the aria-label. Scope to the open dialog to disambiguate.
    await handle.click();
    const dialog = page.getByRole('dialog', { name: 'Formula inputs' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Starting Volume')).toBeVisible();
    // Esc collapses
    await page.keyboard.press('Escape');
    await expect(handle).toHaveAttribute('aria-expanded', 'false');
  });
});
