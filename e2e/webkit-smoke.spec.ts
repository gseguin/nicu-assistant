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
