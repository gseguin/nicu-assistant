// e2e/drawer-no-autofocus.spec.ts
// Phase 48 / FOCUS-TEST-03: opening the drawer on each calculator route lands
// focus on the close button (NOT a textbox/select/textarea/slider). Runs under
// both `chromium` and `webkit-iphone` projects (Phase 47 D-15 — both projects
// run all e2e specs by default). 6 routes x 2 projects = 12 cases.
//
// Pattern source: e2e/mobile-nav-clearance.spec.ts (route-loop + addInitScript) +
// e2e/feeds.spec.ts:35 (drawer-open trigger).
//
// IMPORTANT: ROUTES lists ALL SIX calculators (mobile-nav-clearance.spec.ts omits
// /pert; we must NOT inherit that omission, FOCUS-03 requires all six covered).
import { test, expect } from '@playwright/test';

const ROUTES = [
	'/morphine-wean',
	'/formula',
	'/gir',
	'/feeds',
	'/uac-uvc',
	'/pert'
];

// iPhone-SE viewport — narrow enough to put the route below the md: breakpoint
// so InputsRecap renders and the drawer is the active inputs surface. The
// webkit-iphone project's iPhone-14-Pro device descriptor will be overridden
// by this test.use; that is intentional — FOCUS-TEST-03 is a focus-target check,
// not a notch check.
test.use({ viewport: { width: 375, height: 667 } });

for (const path of ROUTES) {
	test(`drawer open on ${path}: focus is on close button (not an input)`, async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
			localStorage.removeItem('nicu:favorites');
		});
		await page.goto(path);
		await page.getByRole('button', { name: /tap to edit inputs/i }).click();
		const close = page.getByRole('button', { name: /Close /i });
		await expect(close).toBeFocused();
		// Defense in depth: the focused element's tag is BUTTON, never INPUT/SELECT/TEXTAREA/[role=slider].
		const tag = await page.evaluate(() => document.activeElement?.tagName);
		expect(tag).toBe('BUTTON');
		const role = await page.evaluate(() => document.activeElement?.getAttribute('role'));
		expect(role).not.toBe('slider');
	});
}
