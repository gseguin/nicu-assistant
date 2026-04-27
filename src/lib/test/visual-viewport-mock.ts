// src/lib/test/visual-viewport-mock.ts
// Phase 47 / TEST-02: test-only helpers that drive the visualViewport polyfill
// installed in src/test-setup.ts. Plain TS — no test-framework imports so any
// test file (vitest today, future component tests, future jest, etc.) can
// reuse these helpers.
//
// Pitfall 2: mutate properties of the existing polyfill instance, never
// replace `window.visualViewport`. Tests holding a `const vv = window.visualViewport`
// reference must continue to observe the new values.

type MutableVisualViewport = {
	width: number;
	height: number;
	offsetTop: number;
	offsetLeft: number;
	scale: number;
	dispatchEvent: (e: Event) => boolean;
};

function getPolyfill(): MutableVisualViewport {
	const vv = window.visualViewport;
	if (!vv) {
		throw new Error(
			'visual-viewport-mock: window.visualViewport is not installed. ' +
				'Did src/test-setup.ts (with the visualViewport polyfill) load? ' +
				'Confirm vite.config.ts setupFiles includes "src/test-setup.ts".'
		);
	}
	return vv as unknown as MutableVisualViewport;
}

/**
 * Synchronously mutate the polyfill's `height` (required), `offsetTop` (default 0),
 * and optionally `width`, then dispatch a `resize` event so any registered
 * `addEventListener('resize', ...)` listeners fire.
 *
 * Real iOS semantics: `offsetTop > 0` means the keyboard is pushing content up;
 * `offsetTop === 0` means no keyboard or no scroll-zoom.
 *
 * D-08: helper exports `dispatchVisualViewportResize(height, offsetTop?, width?)`.
 */
export function dispatchVisualViewportResize(
	height: number,
	offsetTop = 0,
	width?: number
): void {
	const vv = getPolyfill();
	if (typeof width === 'number') vv.width = width;
	vv.height = height;
	vv.offsetTop = offsetTop;
	vv.dispatchEvent(new Event('resize'));
}

/**
 * Simulate iOS portrait soft-keyboard appearing.
 * 290 px = iOS portrait soft-keyboard height (PITFALLS.md DRAWER-09 keyboard-open heuristic).
 *
 * D-09: helper exports `simulateKeyboardOpen()` (height = innerHeight − 290).
 */
export function simulateKeyboardOpen(): void {
	dispatchVisualViewportResize(window.innerHeight - 290, 0);
}

/**
 * Simulate iOS soft-keyboard dismissing back to the no-keyboard baseline.
 *
 * D-09: helper exports `simulateKeyboardDown()` (height = innerHeight).
 */
export function simulateKeyboardDown(): void {
	dispatchVisualViewportResize(window.innerHeight, 0);
}

/**
 * Simulate the browser restoring the page from bfcache (back/forward cache).
 * Phase 49 DRAWER-03: the visualViewport singleton must rebind listeners on
 * `pageshow` events whose `event.persisted === true`.
 *
 * Falls back to a synthetic Event with a defined `persisted` property if the
 * `PageTransitionEvent` constructor is unavailable in the test environment
 * (RESEARCH.md A3 — LOW risk in jsdom 29, but kept for future-proofing).
 *
 * D-10: helper exports `simulateBfcacheRestore()` dispatching `pageshow` with
 * `persisted: true`.
 */
export function simulateBfcacheRestore(): void {
	let ev: Event;
	try {
		ev = new PageTransitionEvent('pageshow', { persisted: true });
	} catch {
		ev = new Event('pageshow');
		Object.defineProperty(ev, 'persisted', { value: true, configurable: true });
	}
	window.dispatchEvent(ev);
}

/**
 * Reset the polyfill's properties to the D-05 baseline values
 * (no-keyboard / no-zoom). Intended for use in `beforeEach` blocks
 * to ensure test isolation when multiple tests share the same vitest
 * worker (and therefore the same polyfill instance).
 *
 * Underscore prefix marks this as test-internal — Phase 49 production
 * code never calls it.
 */
export function _resetVisualViewportMock(): void {
	const vv = getPolyfill();
	vv.width = window.innerWidth;
	vv.height = window.innerHeight;
	vv.offsetTop = 0;
	vv.offsetLeft = 0;
	vv.scale = 1;
	vv.dispatchEvent(new Event('resize'));
}
