import { test, expect } from '@playwright/test';

// PWA features (manifest, SW, offline) require a production build.
// These tests verify the HTML meta tags and structure that are present in dev mode,
// and skip tests that require the service worker (production-only).

test.describe('PWA meta tags', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/morphine-wean');
		await page
			.getByRole('button', { name: /understand/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('has apple-touch-icon link', async ({ page }) => {
		const link = page.locator('link[rel="apple-touch-icon"]').first();
		const href = await link.getAttribute('href');
		expect(href).toContain('apple-touch-icon.png');
	});

	test('has apple-mobile-web-app-capable meta', async ({ page }) => {
		const meta = page.locator('meta[name="apple-mobile-web-app-capable"]').first();
		await expect(meta).toHaveAttribute('content', 'yes');
	});

	test('has viewport meta with width=device-width', async ({ page }) => {
		const viewport = page.locator('meta[name="viewport"]');
		const content = await viewport.getAttribute('content');
		expect(content).toContain('width=device-width');
	});
});

test.describe('PWA service worker (production build)', () => {
	// These tests require `pnpm build && pnpm preview` instead of `pnpm dev`.
	// Skip in dev mode — run against preview server in CI.
	test.skip(({ }, testInfo) => !process.env.CI, 'Skipped in dev mode — SW only available in production build');

	test('registers a service worker', async ({ page }) => {
		await page.goto('/morphine-wean');
		await page.waitForTimeout(3000);
		const swRegistered = await page.evaluate(async () => {
			if (!('serviceWorker' in navigator)) return false;
			const registrations = await navigator.serviceWorker.getRegistrations();
			return registrations.length > 0;
		});
		expect(swRegistered).toBe(true);
	});

	test('serves a valid web app manifest', async ({ page }) => {
		await page.goto('/morphine-wean');
		const manifestLink = page.locator('link[rel="manifest"]');
		const href = await manifestLink.getAttribute('href');
		expect(href).toBeTruthy();

		const response = await page.goto(href!);
		expect(response?.status()).toBe(200);
		const manifest = await response?.json();
		expect(manifest.name).toBe('NICU Assistant');
		expect(manifest.short_name).toBe('NICU Assist');
		expect(manifest.display).toBe('standalone');
	});

	test('works offline after initial load', async ({ page, context }) => {
		await page.goto('/morphine-wean');
		await page
			.getByRole('button', { name: /understand/i })
			.click({ timeout: 2000 })
			.catch(() => {});
		await page.waitForTimeout(4000);

		await context.setOffline(true);
		await page.reload();
		await expect(page.getByRole('heading', { name: 'Morphine Wean' })).toBeVisible({ timeout: 10000 });
		await context.setOffline(false);
	});
});
