import { test, expect } from '@playwright/test';

// Wave 0 (28-01-SUMMARY.md) empirically confirmed: Playwright renders
// exactly 6 radios at BOTH mobile (375x667) and desktop (1280x800)
// viewports, because Tailwind's sm:hidden / hidden sm:grid actually apply
// in a real browser (unlike jsdom, which renders both layouts = 12 radios).
for (const viewport of [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 }
]) {
  test.describe(`GIR happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/gir');
      await page
        .getByRole('button', { name: /understand/i })
        .click({ timeout: 2000 })
        .catch(() => {});
    });

    test('enter inputs → current hero updates → select bucket → target hero updates', async ({
      page
    }) => {
      await page.getByLabel('Weight').fill('3.1');
      await page.getByLabel('Dextrose').fill('12.5');
      await page.getByLabel('Fluid order').fill('80');

      // Current GIR hero populated
      await expect(page.getByText('CURRENT GIR')).toBeVisible();
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
      await page.getByLabel('Weight').fill('');
      await page.getByLabel('Dextrose').fill('');
      await page.getByLabel('Fluid order').fill('');
      await expect(page.getByText(/Enter weight, dextrose %, and fluid rate/)).toBeVisible();
    });

    test('all three NumericInputs have inputmode="decimal"', async ({ page }) => {
      await expect(page.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal');
      await expect(page.getByLabel('Dextrose')).toHaveAttribute('inputmode', 'decimal');
      await expect(page.getByLabel('Fluid order')).toHaveAttribute('inputmode', 'decimal');
    });
  });
}
