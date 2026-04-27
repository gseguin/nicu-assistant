// e2e/drawer-visual-viewport.spec.ts
// Phase 49 / DRAWER-TEST-03: synthetic-dispatch CI proxy. Real-iPhone visual
// verification is Phase 50 SMOKE-04..07. Playwright WebKit on Linux does NOT
// emulate the iOS soft keyboard (visualViewport.resize does not fire automatically;
// we synthesize it here). Documented in PITFALLS.md P-19 + P-20 + CONTEXT.md D-24.
//
// What this spec proves: the singleton (49-01) + CSS-variable wiring (49-02) is
// observable end-to-end in real Chromium and real WebKit. After synthesizing
// `Object.defineProperty(window.visualViewport, 'height', { value: 400 })` and
// dispatching a 'resize' event, the .input-drawer-sheet's computed max-height
// updates to approximately (400 − 16)px = 384px.
//
// What this spec does NOT prove: that the iOS soft keyboard actually triggers
// this code path on a real iPhone in standalone PWA mode. That is Phase 50's
// obligation (SMOKE-04..07).
//
// Runs under both `chromium` and `webkit-iphone` projects (Phase 47 D-15 default —
// both projects run all e2e specs unless overridden). Single calculator suffices
// because DRAWER-05 single-source-of-truth makes cross-calculator divergence
// structurally impossible (CONTEXT.md D-19).
//
// Pattern source: e2e/drawer-no-autofocus.spec.ts (drawer-open trigger +
// addInitScript boilerplate) + e2e/webkit-smoke.spec.ts (page.evaluate against
// window.visualViewport).
import { expect, test } from '@playwright/test';

// iPhone-SE viewport — narrow enough to put the route below the md: breakpoint
// so InputsRecap renders and the drawer is the active inputs surface. The
// webkit-iphone project's iPhone-14-Pro device descriptor is overridden by this
// test.use; that is intentional — DRAWER-TEST-03 verifies the visualViewport-aware
// sizing math, not the notch/Dynamic Island chrome (which is Phase 48's NOTCH-TEST
// and Phase 50 SMOKE-01..02 territory).
test.use({ viewport: { width: 375, height: 667 } });

test('DRAWER-TEST-03: .input-drawer-sheet max-height responds to synthetic visualViewport.resize', async ({ page }) => {
	// Setup — bypass the disclaimer modal + clear favorites so the route mounts
	// immediately into the calculator surface (matches drawer-no-autofocus.spec.ts).
	await page.addInitScript(() => {
		localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
		localStorage.removeItem('nicu:favorites');
	});

	// Open Morphine — first calculator in the registry. Cross-calculator divergence
	// is structurally impossible (DRAWER-05) so a single route suffices.
	await page.goto('/morphine-wean');

	// Open the drawer via the same affordance Phase 48 uses — the InputsRecap "Tap
	// to edit inputs" button. This is the only path that opens the drawer on mobile;
	// at md+ breakpoints the trigger is `md:hidden` so this test (running at 375x667)
	// reaches the drawer.
	await page.getByRole('button', { name: /tap to edit inputs/i }).click();

	// Wait for the drawer to actually be in the DOM (Svelte 5's {#if expanded} block
	// only mounts the children after the bind:expanded value flips). Without this wait
	// the locator below could resolve before the sheet is rendered.
	const sheet = page.locator('.input-drawer-sheet');
	await expect(sheet).toBeVisible();

	// Establish the keyboard-down baseline — verify the empty-style short-circuit
	// holds (LC-03) and the CSS fallback resolves max-height to 80dvh = 80% of 667
	// = 533.6px. Allow ±1px for browser rounding.
	const baselineMaxHeight = await sheet.evaluate((el) => parseFloat(getComputedStyle(el).maxHeight));
	expect(baselineMaxHeight).toBeGreaterThan(530);
	expect(baselineMaxHeight).toBeLessThan(540);

	// Synthesize the iOS soft keyboard appearing. Override the live visualViewport
	// height to 400 (about 60% of the 667 viewport — well above the 100px keyboardOpen
	// threshold, so vv.keyboardOpen flips true) and dispatch a resize event so the
	// singleton's listener fires.
	await page.evaluate(() => {
		const vv = window.visualViewport;
		if (!vv) throw new Error('visualViewport unavailable in this browser');
		Object.defineProperty(vv, 'height', { value: 400, configurable: true });
		Object.defineProperty(vv, 'offsetTop', { value: 0, configurable: true });
		vv.dispatchEvent(new Event('resize'));
	});

	// Allow Svelte's reactive update to flush. The $derived recomputes synchronously
	// when vv.keyboardOpen flips, but the inline-style attribute write happens in the
	// next microtask. A short polling assertion handles both immediate and deferred
	// engines (chromium vs webkit) without flake.
	await expect
		.poll(() => sheet.evaluate((el) => parseFloat(getComputedStyle(el).maxHeight)), { timeout: 2000 })
		.toBeLessThan(390);

	// Assert the computed max-height is approximately (400 − 16) = 384px. Allow
	// ±2px for browser rounding (chromium tends to be exact; webkit rounds half-px
	// to nearest integer).
	const keyboardUpMaxHeight = await sheet.evaluate((el) => parseFloat(getComputedStyle(el).maxHeight));
	expect(keyboardUpMaxHeight).toBeGreaterThan(380);
	expect(keyboardUpMaxHeight).toBeLessThan(390);

	// Defense-in-depth: assert the inline style attribute contains both CSS variable
	// substrings — proves the wiring goes through the singleton, not via some other
	// codepath. (If a future regression hardcoded max-height: 384px, the computed-style
	// assertion would still pass; this assertion would fail.)
	const inlineStyle = await sheet.getAttribute('style');
	expect(inlineStyle ?? '').toMatch(/--ivv-bottom:/);
	expect(inlineStyle ?? '').toMatch(/--ivv-max-height:/);
});
