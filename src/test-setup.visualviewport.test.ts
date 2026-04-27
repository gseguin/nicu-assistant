// src/test-setup.visualviewport.test.ts
// Phase 47 / TEST-01: assert the runtime shape of the window.visualViewport
// polyfill installed by src/test-setup.ts. The setupFile runs at vitest
// startup BEFORE any test imports, so window.visualViewport is already
// installed here. No import from test-setup is needed — global state.
import { describe, it, expect } from 'vitest';

describe('visualViewport polyfill (test-setup.ts)', () => {
	it('T-01 polyfill is installed and is an EventTarget', () => {
		expect(window.visualViewport).toBeDefined();
		expect(window.visualViewport).not.toBeNull();
		expect(window.visualViewport instanceof EventTarget).toBe(true);
	});

	it('T-02 polyfill exposes the documented mutable surface', () => {
		const vv = window.visualViewport!;
		// D-04: { width, height, offsetTop, offsetLeft, scale } at minimum, plus
		//       addEventListener / removeEventListener / dispatchEvent (from EventTarget).
		expect(typeof vv.width).toBe('number');
		expect(typeof vv.height).toBe('number');
		expect(typeof vv.offsetTop).toBe('number');
		expect(typeof vv.offsetLeft).toBe('number');
		expect(typeof vv.scale).toBe('number');
		expect(typeof vv.addEventListener).toBe('function');
		expect(typeof vv.removeEventListener).toBe('function');
		expect(typeof vv.dispatchEvent).toBe('function');
	});

	it('T-03 default values match D-05 baseline (no-keyboard / no-zoom)', () => {
		const vv = window.visualViewport!;
		// D-05: width = innerWidth, height = innerHeight, offsetTop/Left = 0, scale = 1.
		expect(vv.width).toBe(window.innerWidth);
		expect(vv.height).toBe(window.innerHeight);
		expect(vv.offsetTop).toBe(0);
		expect(vv.offsetLeft).toBe(0);
		expect(vv.scale).toBe(1);
	});

	it('T-04 dispatchEvent("resize") synchronously fires registered listeners', () => {
		const vv = window.visualViewport!;
		let count = 0;
		const handler = () => {
			count++;
		};
		vv.addEventListener('resize', handler);
		vv.dispatchEvent(new Event('resize'));
		vv.dispatchEvent(new Event('resize'));
		vv.removeEventListener('resize', handler);
		vv.dispatchEvent(new Event('resize'));
		expect(count).toBe(2);
	});

	it('T-05 properties are mutable so Plan-02 helper can drive state', () => {
		// Pitfall 2: helper mutates instance properties; do not replace the instance.
		// This test simulates the helper's write path and confirms it sticks.
		const vv = window.visualViewport as unknown as {
			width: number;
			height: number;
			offsetTop: number;
		};
		const originalHeight = vv.height;
		const originalOffsetTop = vv.offsetTop;
		try {
			vv.height = 400;
			vv.offsetTop = 200;
			expect(vv.height).toBe(400);
			expect(vv.offsetTop).toBe(200);
		} finally {
			// Restore baseline so subsequent tests in the file see D-05 defaults.
			vv.height = originalHeight;
			vv.offsetTop = originalOffsetTop;
		}
	});
});
