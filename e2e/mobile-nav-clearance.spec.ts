// e2e/mobile-nav-clearance.spec.ts
// Phase 42.1-06 D-09 + D-32 verification: at iPhone-SE (375x667) and
// iPhone 14 Pro Max (414x896), the last `<main>` child of every calculator
// route must NOT overlap the bottom nav after scroll-to-bottom.
//
// Pattern source: e2e/navigation.spec.ts:26-41 (bottom-nav locator analog)
// + e2e/uac-uvc-a11y.spec.ts:20-35 (beforeEach + disclaimer-dismiss pattern).
//
// The geometry assertion uses page.evaluate(getBoundingClientRect) — no exact
// precedent in the suite for this shape; documented inline.

import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/morphine-wean', name: /Morphine Wean/i },
  { path: '/formula', name: /Formula Recipe/i },
  { path: '/gir', name: /Glucose Infusion Rate/i },
  { path: '/feeds', name: /Feed Advance Calculator/i },
  { path: '/uac-uvc', name: /UAC\/UVC Catheter Depth/i }
];

const VIEWPORTS = [
  { width: 375, height: 667, name: 'iPhone-SE' },
  { width: 414, height: 896, name: 'iPhone-14-Pro-Max' }
];

test.describe('Mobile bottom-nav clearance (D-09)', () => {
  test.beforeEach(async ({ page }) => {
    // Pre-acknowledge disclaimer + clear favorites so every test starts
    // with the default 4-tab nav and no banner overlap.
    await page.addInitScript(() => {
      localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
      localStorage.removeItem('nicu:favorites');
    });
  });

  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route.path} content does not overlap bottom nav at ${viewport.name}`, async ({
        page
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path);
        await page.getByRole('heading', { name: route.name }).first().waitFor({ state: 'visible' });
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForLoadState('networkidle');

        const overlap = await page.evaluate(() => {
          const main = document.querySelector('main');
          // The mobile bottom nav is the LAST nav with the calculator-navigation label
          // (the desktop nav with the same aria-label is hidden via md:hidden but is
          // present in DOM at narrow viewports too).
          const navs = document.querySelectorAll('nav[aria-label="Calculator navigation"]');
          const nav = navs[navs.length - 1];
          const lastChild = main?.lastElementChild?.getBoundingClientRect();
          const navRect = nav?.getBoundingClientRect();
          return {
            lastBottom: lastChild?.bottom ?? 0,
            navTop: navRect?.top ?? Infinity
          };
        });
        expect(overlap.lastBottom).toBeLessThanOrEqual(overlap.navTop);
      });
    }
  }
});
