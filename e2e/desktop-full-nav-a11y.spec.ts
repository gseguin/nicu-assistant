// e2e/desktop-full-nav-a11y.spec.ts
// NAV-ALL-TEST-03: Axe sweep of the desktop top toolbar with all 5 tabs rendered,
// in light + dark themes. Verifies no contrast regressions from added calculator labels.
// Pattern source: e2e/fortification-a11y.spec.ts (for-theme loop, no-transition class, axe analyze).

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Desktop full-nav accessibility (NAV-ALL-TEST-03)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    // Default favorites (4) — desktop still renders all 5 regardless, but keeps the page in
    // the canonical state.
    await page.addInitScript(() => {
      localStorage.removeItem('nicu:favorites');
      localStorage.removeItem('nicu:disclaimer-accepted');
    });
    // Land on /uac-uvc so the 5th tab is the active one (worst case for the auto-scroll
    // affordance + scroll-fade interaction).
    await page.goto('/uac-uvc');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`desktop top toolbar has no axe violations (${theme})`, async ({ page }) => {
      await page.evaluate((t) => {
        document.documentElement.classList.add('no-transition');
        document.documentElement.classList.toggle('dark', t === 'dark');
        document.documentElement.classList.toggle('light', t === 'light');
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      if (theme === 'dark') await page.waitForTimeout(250);

      // Confirm desktop nav is rendered with all 5 tabs before scanning
      const desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first();
      await expect(desktopNav.getByRole('tab')).toHaveCount(5);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

      expect(results.violations).toEqual([]);
    });
  }

  // NAV-ALL-TEST-03 narrow-desktop variant: at 768 px the tablist scrolls and the fade is visible.
  // Verify axe still passes (tab focus order, contrast of clipped tabs, etc.).
  for (const theme of ['light', 'dark'] as const) {
    test(`desktop top toolbar @768 (overflow + fade visible) has no axe violations (${theme})`, async ({
      page
    }) => {
      await page.setViewportSize({ width: 768, height: 800 });
      await page.evaluate((t) => {
        document.documentElement.classList.add('no-transition');
        document.documentElement.classList.toggle('dark', t === 'dark');
        document.documentElement.classList.toggle('light', t === 'light');
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      if (theme === 'dark') await page.waitForTimeout(250);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
