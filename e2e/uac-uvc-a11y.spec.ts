// e2e/uac-uvc-a11y.spec.ts
// UAC-TEST-04: Playwright axe sweeps for /uac-uvc in light + dark modes.
//
// Pattern source: e2e/gir-a11y.spec.ts (light + dark sweeps; Phase 42 drops the
// advisory + selected-bucket variants — UAC/UVC has no buckets / no advisories
// per 42-PATTERNS.md §"e2e/uac-uvc-a11y.spec.ts").
//
// Expected result: 2/2 sweeps green on first run. The OKLCH identity quartet
// (.identity-uac light + dark) is pre-verified in 42-RESEARCH.md §"Identity Hue
// OKLCH Quartet" at ≥ 7.66:1 minimum contrast on every identity surface. Per
// 42-RESEARCH.md Pitfall #1: if any surface fails axe on first sweep, the
// implementation is wrong (contrast math is pre-verified) — fix the
// implementation, not the tokens.
//
// Project axe sweep total after this file: 20/20 → 22/22.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('UAC/UVC Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/uac-uvc');

		// Wait for the route's h1 — gates axe against a partially-hydrated DOM.
		await page
			.getByRole('heading', { name: 'UAC/UVC Catheter Depth' })
			.waitFor({ state: 'visible' });

		// Dismiss the disclaimer modal if it appears. No-op when localStorage
		// already has an acknowledgement.
		await page
			.getByRole('button', { name: /understand|acknowledge/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('uac-uvc page has no axe violations in light mode', async ({ page }) => {
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});

	test('uac-uvc page has no axe violations in dark mode', async ({ page }) => {
		// The `no-transition` class suppresses theme-transition flicker during
		// the class swap; the 250ms wait lets the DOM settle before axe runs.
		// Mirrors e2e/gir-a11y.spec.ts:32-38.
		await page.evaluate(() => {
			document.documentElement.classList.add('no-transition');
			document.documentElement.classList.remove('light');
			document.documentElement.classList.add('dark');
			document.documentElement.setAttribute('data-theme', 'dark');
		});
		await page.waitForTimeout(250);

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});
});
