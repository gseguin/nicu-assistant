import { test, expect } from '@playwright/test';

test.describe('Navigation (v1.2 restructure)', () => {
  test.beforeEach(async ({ page }) => {
    // Guard: pre-clear nicu:favorites so NavShell renders the default 4 tabs
    // (required after Phase 41 flips NavShell to favorites-driven rendering — Pitfall 2 in 41-RESEARCH.md)
    await page.addInitScript(() => {
      localStorage.removeItem('nicu:favorites');
    });
    await page.goto('/morphine-wean');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  test('top title bar shows app name, hamburger, and theme toggle', async ({ page }) => {
    // Use the banner landmark (NavShell header has role="banner" via <header>)
    // Phase 42.1-03: About moved out of the title bar — accessible via the
    // hamburger drawer's About menu OR the disclaimer banner's "More" link.
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
    await expect(header.getByText('NICU Assist')).toBeVisible();
    await expect(header.getByRole('button', { name: /open calculator menu/i })).toBeVisible();
    await expect(header.getByRole('button', { name: /switch to/i })).toBeVisible();
  });

  test('mobile bottom nav has only calculator tabs filling full width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // The bottom nav is the last nav element
    const bottomNav = page.locator('nav[aria-label="Calculator navigation"]').last();
    await expect(bottomNav).toBeVisible();

    const tabs = bottomNav.getByRole('tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText('Morphine');
    await expect(tabs.nth(1)).toContainText('Formula');
    await expect(tabs.nth(2)).toContainText('GIR');
    await expect(tabs.nth(3)).toContainText('Feeds');

    await expect(bottomNav.getByRole('button', { name: /about/i })).toHaveCount(0);
    await expect(bottomNav.getByRole('button', { name: /switch to/i })).toHaveCount(0);
  });

  test('switching between calculators preserves navigation', async ({ page }) => {
    await expect(page).toHaveURL(/morphine-wean/);

    await page
      .getByRole('tab', { name: /formula/i })
      .first()
      .click();
    await expect(page).toHaveURL(/formula/);

    await page
      .getByRole('tab', { name: /morphine/i })
      .first()
      .click();
    await expect(page).toHaveURL(/morphine-wean/);
  });

  test('desktop layout shows all controls in top bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const header = page.getByRole('banner');
    await expect(header.getByRole('tab', { name: /morphine/i })).toBeVisible();
    await expect(header.getByRole('tab', { name: /formula/i })).toBeVisible();
    await expect(header.getByText('NICU Assist')).toBeVisible();
  });

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    await page.getByRole('button', { name: /switch to/i }).click();
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
      true
    );

    await page.getByRole('button', { name: /switch to/i }).click();
    expect(await page.evaluate(() => !document.documentElement.classList.contains('dark'))).toBe(
      true
    );
  });

  test('hamburger drawer About row opens the about sheet', async ({ page }) => {
    // Phase 42.1-03 D-15: About row lives in the hamburger drawer; the prior
    // header info button was retired so disclaimer banner + drawer share one
    // AboutSheet instance hoisted to +layout.svelte.
    await page.getByRole('button', { name: /open calculator menu/i }).click();
    const drawer = page.getByRole('dialog', { name: /calculators/i });
    await drawer.waitFor({ state: 'visible' });
    await drawer.getByRole('button', { name: /^about( this app)?$/i }).click();
    await expect(page.getByRole('dialog').getByText('Morphine Wean Calculator')).toBeVisible();
  });
});

test.describe('Root redirect (D-19)', () => {
  test('root path redirects to /morphine-wean via meta refresh', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('nicu:favorites');
    });
    await page.goto('/');
    // Either the meta-refresh or SvelteKit hydration lands us at /morphine-wean.
    await expect(page).toHaveURL(/morphine-wean/, { timeout: 5000 });
  });

  test('deep link to /uac-uvc does NOT redirect to /morphine-wean (pathname gate)', async ({
    page
  }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('nicu:favorites');
    });
    // Adapter-static `fallback: 'index.html'` serves the prerendered root page for
    // deep links until SvelteKit hydrates. The inline pathname-gate script must
    // remove the meta-refresh tag before the browser acts on it; otherwise this
    // navigation would be yanked to /morphine-wean.
    await page.goto('/uac-uvc');
    // Give hydration a moment, then assert URL is still /uac-uvc.
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/uac-uvc/);
  });
});
