import { test, expect, type Page } from '@playwright/test';

// Wave 0 (28-01-SUMMARY.md) empirically confirmed: Playwright renders
// exactly 6 radios at BOTH mobile (375x667) and desktop (1280x800)
// viewports, because Tailwind's sm:hidden / hidden sm:grid actually apply
// in a real browser (unlike jsdom, which renders both layouts = 12 radios).
//
// Plan 42.1-05 (D-08): the route renders the SAME inputs twice — once in the
// desktop sticky aside (hidden via CSS `hidden md:block`) and once inside the
// mobile <InputDrawer>. This helper returns the input scoped to whichever
// container is active at the current viewport so strict-mode locators resolve
// to exactly one element.
function getInputsScope(page: Page, viewport: 'mobile' | 'desktop') {
  if (viewport === 'mobile') {
    return page.getByRole('dialog', { name: 'GIR inputs' });
  }
  return page.locator('aside[aria-label="GIR inputs"]');
}

for (const viewport of [
  { name: 'mobile' as const, width: 375, height: 667 },
  { name: 'desktop' as const, width: 1280, height: 800 }
]) {
  test.describe(`GIR happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/gir');
      await page
        .getByRole('button', { name: /understand/i })
        .click({ timeout: 2000 })
        .catch(() => {});
      // Plan 42.1-05 (D-08): on mobile (<md), inputs live behind the InputDrawer
      // bottom-sheet. Open the drawer once so the dialog is visible and its
      // content is the active (visible) copy. On desktop the handle has
      // md:hidden, so this is a no-op.
      if (viewport.name === 'mobile') {
        await page.getByLabel('Open inputs drawer').click();
      }
    });

    test('enter inputs → current hero updates → select bucket → target hero updates', async ({
      page
    }) => {
      const scope = getInputsScope(page, viewport.name);
      await scope.getByLabel('Weight').fill('3.1');
      await scope.getByLabel('Dextrose').fill('12.5');
      await scope.getByLabel('Fluid order').fill('80');

      // On mobile, close the drawer so the hero + titration grid become visible.
      if (viewport.name === 'mobile') {
        await page.keyboard.press('Escape');
      }

      // Post-shape refactor: Current GIR is now a quiet state line (title
      // case in DOM, uppercased via CSS). Assert on the DOM text.
      await expect(page.getByText('Current GIR')).toBeVisible();
      await expect(page.getByText('mg/kg/min').first()).toBeVisible();

      // Titration grid rendered — see Wave 0 note above: 6 at both viewports
      const radios = page.getByRole('radio');
      await expect(radios).toHaveCount(6);

      // Select a bucket
      await radios.first().click();

      // Post-32-01: summary hero is gone. Selection state lives on the
      // bucket card itself (aria-checked + identity-hero border/fill).
      await expect(radios.first()).toHaveAttribute('aria-checked', 'true');

      // Δ rate is the titration-row hero — at least one visible direction word + ml/hr unit on a populated bucket
      await expect(
        page
          .getByText(/\((increase|decrease)\)/)
          .locator('visible=true')
          .first()
      ).toBeVisible();
      await expect(page.getByText('ml/hr').locator('visible=true').first()).toBeVisible();
    });

    test('empty-state hero renders when inputs null', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await scope.getByLabel('Weight').fill('');
      await scope.getByLabel('Dextrose').fill('');
      await scope.getByLabel('Fluid order').fill('');
      if (viewport.name === 'mobile') {
        await page.keyboard.press('Escape');
      }
      await expect(page.getByText(/Enter weight, dextrose, and fluid rate to see GIR\./)).toBeVisible();
    });

    test('all three NumericInputs have inputmode="decimal"', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await expect(scope.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal');
      await expect(scope.getByLabel('Dextrose')).toHaveAttribute('inputmode', 'decimal');
      await expect(scope.getByLabel('Fluid order')).toHaveAttribute('inputmode', 'decimal');
    });
  });
}
