// E2E Playwright spec for /pert (Phase 3 plan 03-04 / CONTEXT D-10).
// Mirrors e2e/feeds.spec.ts viewport-loop + getInputsScope helper.
// Mirrors e2e/favorites-nav.spec.ts:69-105 (FAV-TEST-03-2) for the favorites
// round-trip describe block.
//
// Em-dash + en-dash ban: this file is em-dash-free per Phase 3 Q1 broad convention.

import { test, expect, type Page } from '@playwright/test';

// Pitfall 6: src/routes/pert/+page.svelte mounts <PertInputs /> twice (desktop
// sticky aside aria-label="PERT inputs" + mobile InputDrawer dialog title="PERT
// inputs"). Both bind to the same pertState singleton; strict-locator queries
// must scope to ONE copy. This helper returns the active copy at the current
// viewport so getByLabel resolves to exactly one element.
function getInputsScope(page: Page, viewport: 'mobile' | 'desktop') {
	if (viewport === 'mobile') {
		// Drawer dialog, rendered + visible after the recap tap.
		return page.getByRole('dialog', { name: 'PERT inputs' });
	}
	// Desktop sticky aside.
	return page.locator('aside[aria-label="PERT inputs"]');
}

for (const viewport of [
	{ name: 'mobile' as const, width: 375, height: 667 },
	{ name: 'desktop' as const, width: 1280, height: 800 }
]) {
	// ----- happy path block (default pre-clear beforeEach) -----
	test.describe(`PERT happy path (${viewport.name})`, () => {
		test.use({ viewport: { width: viewport.width, height: viewport.height } });

		test.beforeEach(async ({ page }) => {
			// Pre-clear PERT state + favorites + disclaimer keys so each test starts
			// fresh. addInitScript runs on EVERY navigation including reload.
			await page.addInitScript(() => {
				localStorage.removeItem('nicu_pert_state');
				localStorage.removeItem('nicu_pert_state_ts');
				localStorage.removeItem('nicu:favorites');
				localStorage.removeItem('nicu_assistant_disclaimer_v1');
				localStorage.removeItem('nicu_assistant_disclaimer_v2');
				localStorage.removeItem('nicu:disclaimer-accepted');
			});
			await page.goto('/pert');
			// Dismiss the disclaimer banner if present. The .catch swallows the
			// timeout when the banner is already dismissed (suite-internal reuse).
			await page
				.getByRole('button', { name: /understand/i })
				.click({ timeout: 2000 })
				.catch(() => {});
			if (viewport.name === 'mobile') {
				// Open the InputDrawer so the inputs become the active visible copy.
				await page.getByRole('button', { name: /tap to edit inputs/i }).click();
			}
		});

		// KI-1 closure (Phase 3.1 D-05 + D-06): picker-driven happy-paths.
		// These were deferred from Phase 3 Plan 03-04 because the SelectPicker
		// string-bridge proxies in PertInputs.svelte had a bidirectional $effect
		// race that caused click-revert. Phase 3.1 Plan 03.1-01 replaced those
		// proxies with Svelte 5 function bindings. These tests lock the symptom
		// (visible click-then-result) at the e2e tier; the mechanism is locked
		// at the component tier in PertInputs.test.ts D-01 + D-04.

		test('Oral mode happy path: weight + fat + lipase + medication + strength produces capsulesPerDose=4', async ({
			page
		}) => {
			const scope = getInputsScope(page, viewport.name);
			// Oral is the default mode. Fill numeric inputs first.
			await scope.getByLabel('Weight', { exact: true }).fill('10');
			await scope.getByLabel('Fat per meal').fill('25');
			await scope.getByLabel('Lipase per gram of fat').fill('2000');
			// Open and select medication. Pitfall 6: scope-relative trigger,
			// page-level option (the SelectPicker dialog is a top-level modal).
			await scope.getByRole('button', { name: /^Medication/ }).click();
			await page.getByRole('option', { name: /^Creon$/ }).click();
			// D-11 cascade: medicationId change clears strengthValue. Wait for the
			// strength picker placeholder to update to "Select strength" before
			// clicking it (avoids racing a stale picker UI). Polled assertion.
			await expect(scope.getByRole('button', { name: /^Strength/ })).toContainText(
				/Select strength/
			);
			await scope.getByRole('button', { name: /^Strength/ }).click();
			await page.getByRole('option', { name: /^12,000 units$/ }).click();
			if (viewport.name === 'mobile') {
				// Close the InputDrawer so the hero card under it is visible.
				await page.keyboard.press('Escape');
			}
			// Hero asserts: capsulesPerDose = ROUND(25 * 2000 / 12000) = ROUND(4.167) = 4.
			await expect(page.getByText('4', { exact: true }).first()).toBeVisible();
			await expect(page.getByText('capsules/dose')).toBeVisible();
		});

		test('Tube-Feed mode happy path: weight + formula + volume + lipase + medication + strength produces capsulesPerDay=5 + capsulesPerMonth=150', async ({
			page
		}) => {
			const scope = getInputsScope(page, viewport.name);
			// Switch to Tube-Feed.
			await scope.getByRole('tab', { name: /Tube-Feed/i }).click();
			// Fill numerics.
			await scope.getByLabel('Weight', { exact: true }).fill('15');
			// Open and search the Formula picker (searchable=true). The
			// SelectPicker trigger's accessible role is 'combobox' when
			// searchable=true (SelectPicker.svelte:172), NOT 'button'. Only
			// the non-searchable Medication + Strength triggers below are buttons.
			await scope.getByRole('combobox', { name: /^Formula/ }).click();
			// SelectPicker.svelte:199-208 renders <input type="text" aria-label="Filter Formula">
			// (not type="search"), so its accessible role is 'textbox'. `getByRole('searchbox')`
			// would not match. Plan deviation protocol fallback to aria-label-anchored textbox.
			await page.getByRole('textbox', { name: /Filter Formula/i }).fill('Kate Farms');
			await page.getByRole('option', { name: /Kate Farms Pediatric Standard 1\.2/ }).click();
			await scope.getByLabel('Volume per day').fill('1500');
			await scope.getByLabel('Lipase per gram of fat').fill('2500');
			// Open and select medication.
			await scope.getByRole('button', { name: /^Medication/ }).click();
			await page.getByRole('option', { name: /^Pancreaze$/ }).click();
			// D-11 cascade wait before opening strength.
			await expect(scope.getByRole('button', { name: /^Strength/ })).toContainText(
				/Select strength/
			);
			await scope.getByRole('button', { name: /^Strength/ }).click();
			await page.getByRole('option', { name: /^37,000 units$/ }).click();
			if (viewport.name === 'mobile') {
				await page.keyboard.press('Escape');
			}
			// Hero: capsulesPerDay = ROUND(48 * 1500/1000 * 2500 / 37000) = ROUND(4.864) = 5.
			// capsulesPerMonth = 5 * 30 = 150.
			await expect(page.getByText('5', { exact: true }).first()).toBeVisible();
			await expect(page.getByText('capsules/day')).toBeVisible();
			await expect(page.getByText('Capsules per month')).toBeVisible();
			// `{ exact: true }` so '150' (Capsules per month) doesn't also match the
			// '1500' Volume per day input value as a substring (strict mode violation).
			await expect(page.getByText('150', { exact: true })).toBeVisible();
		});

		test('mode-switch state preservation', async ({ page }) => {
			const scope = getInputsScope(page, viewport.name);
			// Fill oral inputs (default mode).
			await scope.getByLabel('Weight', { exact: true }).fill('10');
			await scope.getByLabel('Fat per meal').fill('25');
			await scope.getByLabel('Lipase per gram of fat').fill('2000');
			// Switch to Tube-Feed; weight is shared and must persist.
			await scope.getByRole('tab', { name: /Tube-Feed/i }).click();
			await expect(scope.getByLabel('Weight', { exact: true })).toHaveValue('10');
			// Switch back to Oral; mode-specific oral values must restore.
			await scope.getByRole('tab', { name: /Oral/i }).click();
			await expect(scope.getByLabel('Fat per meal')).toHaveValue('25');
			await expect(scope.getByLabel('Lipase per gram of fat')).toHaveValue('2000');
		});

		test('every numeric input has inputmode="decimal" (PERT-TEST-05 + D-14)', async ({ page }) => {
			const scope = getInputsScope(page, viewport.name);
			// Oral mode (default) renders Weight + Fat per meal + Lipase per gram of fat.
			await expect(scope.getByLabel('Weight', { exact: true })).toHaveAttribute(
				'inputmode',
				'decimal'
			);
			await expect(scope.getByLabel('Fat per meal')).toHaveAttribute('inputmode', 'decimal');
			await expect(scope.getByLabel('Lipase per gram of fat')).toHaveAttribute(
				'inputmode',
				'decimal'
			);
		});
	});

	// ----- localStorage round-trip block (Q2: NO default pre-clear beforeEach) -----
	test.describe(`PERT localStorage round-trip (${viewport.name})`, () => {
		test.use({ viewport: { width: viewport.width, height: viewport.height } });

		test('reload restores form values from nicu_pert_state', async ({ page }) => {
			// Suppress disclaimer + favorites only; do NOT touch nicu_pert_state so it
			// PERSISTS across reload. addInitScript runs on every navigation including
			// the post-fill reload below.
			await page.addInitScript(() => {
				localStorage.removeItem('nicu:favorites');
				localStorage.removeItem('nicu_assistant_disclaimer_v1');
				localStorage.removeItem('nicu_assistant_disclaimer_v2');
				localStorage.removeItem('nicu:disclaimer-accepted');
			});
			await page.goto('/pert');
			await page
				.getByRole('button', { name: /understand/i })
				.click({ timeout: 2000 })
				.catch(() => {});
			if (viewport.name === 'mobile') {
				await page.getByRole('button', { name: /tap to edit inputs/i }).click();
			}
			const scope = getInputsScope(page, viewport.name);
			await scope.getByLabel('Weight', { exact: true }).fill('10');
			await scope.getByLabel('Fat per meal').fill('25');
			await scope.getByLabel('Lipase per gram of fat').fill('2000');
			// Verify localStorage was written with the canonical state shape.
			const stored = await page.evaluate(() => localStorage.getItem('nicu_pert_state'));
			expect(stored).not.toBeNull();
			const parsed = JSON.parse(stored as string);
			expect(parsed.weightKg).toBe(10);
			expect(parsed.oral.fatGrams).toBe(25);
			expect(parsed.oral.lipasePerKgPerMeal).toBe(2000);
			// Reload and assert form values restored from localStorage.
			await page.reload();
			await page
				.getByRole('button', { name: /understand/i })
				.click({ timeout: 2000 })
				.catch(() => {});
			if (viewport.name === 'mobile') {
				await page.getByRole('button', { name: /tap to edit inputs/i }).click();
			}
			const scope2 = getInputsScope(page, viewport.name);
			await expect(scope2.getByLabel('Weight', { exact: true })).toHaveValue('10');
			await expect(scope2.getByLabel('Fat per meal')).toHaveValue('25');
			await expect(scope2.getByLabel('Lipase per gram of fat')).toHaveValue('2000');
		});
	});

	// ----- favorites round-trip block (mirrors FAV-TEST-03-2 at favorites-nav.spec.ts:69) -----
	test.describe(`PERT favorites round-trip (${viewport.name})`, () => {
		test.use({ viewport: { width: viewport.width, height: viewport.height } });
		const isDesktop = viewport.width >= 768;

		test('favorite PERT -> nav shows PERT tab + correct count for viewport', async ({ page }) => {
			// Pre-seed 3 of 4 alphabetical defaults so the 4th slot is open. Mirrors
			// e2e/favorites-nav.spec.ts:76-79. PERT is NOT in the seed; the test
			// verifies the add path.
			await page.addInitScript(() => {
				localStorage.removeItem('nicu_pert_state');
				localStorage.removeItem('nicu_pert_state_ts');
				localStorage.removeItem('nicu_assistant_disclaimer_v1');
				localStorage.removeItem('nicu_assistant_disclaimer_v2');
				localStorage.removeItem('nicu:disclaimer-accepted');
				localStorage.setItem(
					'nicu:favorites',
					JSON.stringify({ v: 1, ids: ['feeds', 'formula', 'gir'] })
				);
			});
			await page.goto('/pert');
			await page
				.getByRole('button', { name: /understand/i })
				.click({ timeout: 2000 })
				.catch(() => {});
			// Open hamburger and add PERT (capacity available, so aria-label is
			// 'Add PERT to favorites' per HamburgerMenu.svelte:114-118).
			await page.getByRole('button', { name: 'Open calculator menu' }).click();
			await page.getByRole('dialog').waitFor({ state: 'visible' });
			await page.getByRole('button', { name: /add pert to favorites/i }).click();
			await page.keyboard.press('Escape');
			await page.getByRole('dialog').waitFor({ state: 'hidden' });
			// Phase 45 divergence: desktop nav is registry-driven (6 tabs always),
			// mobile bottom nav is favorites-driven (4 tabs after adding PERT).
			// first() = desktop top nav, last() = mobile bottom nav.
			const nav = isDesktop
				? page.locator('nav[aria-label="Calculator navigation"]').first()
				: page.locator('nav[aria-label="Calculator navigation"]').last();
			await expect(nav.getByRole('tab')).toHaveCount(isDesktop ? 6 : 4);
			await expect(nav.getByRole('tab', { name: /pert/i })).toBeVisible();
			// localStorage persisted with PERT included (the contract that matters
			// regardless of viewport — desktop visibility is favorites-independent).
			const stored = await page.evaluate(() => localStorage.getItem('nicu:favorites'));
			const parsed = JSON.parse(stored as string);
			expect(parsed.ids).toContain('pert');
		});
	});
}
