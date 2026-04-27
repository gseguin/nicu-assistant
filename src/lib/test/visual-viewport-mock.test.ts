// src/lib/test/visual-viewport-mock.test.ts
// Phase 47 / TEST-02: assert all 5 helpers in visual-viewport-mock.ts behave
// per D-08..D-10 against the live polyfill installed by src/test-setup.ts.
import { describe, it, expect, beforeEach } from 'vitest';
import {
	dispatchVisualViewportResize,
	simulateKeyboardOpen,
	simulateKeyboardDown,
	simulateBfcacheRestore,
	_resetVisualViewportMock
} from './visual-viewport-mock';

describe('visual-viewport-mock helpers', () => {
	beforeEach(() => {
		// Restore D-05 baseline so each test starts from a known state.
		_resetVisualViewportMock();
	});

	it('T-01 dispatchVisualViewportResize mutates height + offsetTop and fires "resize"', () => {
		const vv = window.visualViewport!;
		let count = 0;
		let lastHeight = -1;
		let lastOffsetTop = -1;
		const handler = () => {
			count++;
			lastHeight = vv.height;
			lastOffsetTop = vv.offsetTop;
		};
		vv.addEventListener('resize', handler);
		try {
			dispatchVisualViewportResize(400, 200);
			expect(vv.height).toBe(400);
			expect(vv.offsetTop).toBe(200);
			expect(count).toBe(1);
			expect(lastHeight).toBe(400);
			expect(lastOffsetTop).toBe(200);
		} finally {
			vv.removeEventListener('resize', handler);
		}
	});

	it('T-02 dispatchVisualViewportResize mutates width when provided, leaves it untouched when omitted', () => {
		const vv = window.visualViewport!;
		const originalWidth = vv.width;

		dispatchVisualViewportResize(500); // no width arg
		expect(vv.width).toBe(originalWidth);
		expect(vv.height).toBe(500);
		expect(vv.offsetTop).toBe(0); // default

		dispatchVisualViewportResize(600, 100, 250); // explicit width
		expect(vv.width).toBe(250);
		expect(vv.height).toBe(600);
		expect(vv.offsetTop).toBe(100);
	});

	it('T-03 simulateKeyboardOpen produces height = innerHeight - 290, offsetTop = 0', () => {
		const vv = window.visualViewport!;
		simulateKeyboardOpen();
		expect(vv.height).toBe(window.innerHeight - 290);
		expect(vv.offsetTop).toBe(0);
	});

	it('T-04 simulateKeyboardDown produces height = innerHeight, offsetTop = 0', () => {
		const vv = window.visualViewport!;
		// First put it into the keyboard-open state, then dismiss.
		simulateKeyboardOpen();
		expect(vv.height).toBe(window.innerHeight - 290);

		simulateKeyboardDown();
		expect(vv.height).toBe(window.innerHeight);
		expect(vv.offsetTop).toBe(0);
	});

	it('T-05 simulateBfcacheRestore dispatches "pageshow" with persisted: true on window', () => {
		let received: Event | null = null;
		const handler = (e: Event) => {
			received = e;
		};
		window.addEventListener('pageshow', handler);
		try {
			simulateBfcacheRestore();
			expect(received).not.toBeNull();
			expect(received!.type).toBe('pageshow');
			// persisted is the property the singleton's bfcache rebind logic reads (DRAWER-03).
			expect((received as unknown as { persisted: boolean }).persisted).toBe(true);
		} finally {
			window.removeEventListener('pageshow', handler);
		}
	});

	it('T-06 _resetVisualViewportMock restores D-05 baseline and fires "resize"', () => {
		const vv = window.visualViewport!;
		// Mutate to non-baseline first.
		dispatchVisualViewportResize(123, 45, 67);
		expect(vv.height).toBe(123);
		expect(vv.offsetTop).toBe(45);
		expect(vv.width).toBe(67);

		let count = 0;
		const handler = () => {
			count++;
		};
		vv.addEventListener('resize', handler);
		try {
			_resetVisualViewportMock();
			expect(vv.width).toBe(window.innerWidth);
			expect(vv.height).toBe(window.innerHeight);
			expect(vv.offsetTop).toBe(0);
			expect(vv.offsetLeft).toBe(0);
			expect(vv.scale).toBe(1);
			expect(count).toBe(1); // reset must dispatch resize so listeners pick up the change
		} finally {
			vv.removeEventListener('resize', handler);
		}
	});

	it('T-07 helper mutates the existing polyfill instance — does not replace it (Pitfall 2)', () => {
		// Phase 49 tests will hold references like `const vv = window.visualViewport`
		// and expect them to remain valid across helper calls.
		const vvRef = window.visualViewport;
		dispatchVisualViewportResize(333, 111);
		expect(window.visualViewport).toBe(vvRef);
		expect(vvRef!.height).toBe(333);
		expect(vvRef!.offsetTop).toBe(111);
	});
});
