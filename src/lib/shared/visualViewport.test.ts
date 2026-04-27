// src/lib/shared/visualViewport.test.ts
// Co-located singleton test per project memory (feedback_test_colocation.md).
// Phase 49 / DRAWER-TEST-01: covers DRAWER-01..04 + DRAWER-09 + the no-scroll-
// listener regression sentinel (DRAWER-02 / P-08).
//
// Pattern source: src/lib/shared/favorites.test.ts (vi.resetModules + dynamic
// import for fresh $state per test) + src/lib/test/visual-viewport-mock.test.ts
// (consumer of the Phase 47 helpers).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	dispatchVisualViewportResize,
	simulateKeyboardOpen,
	simulateKeyboardDown,
	simulateBfcacheRestore,
	_resetVisualViewportMock
} from '$lib/test/visual-viewport-mock.js';

beforeEach(() => {
	// Fresh `vv` instance per test so #initialized starts false. Required because
	// calling init() twice (across tests) early-returns via the idempotency guard.
	vi.resetModules();
	// Restore polyfill baseline so vv.height === window.innerHeight at start.
	_resetVisualViewportMock();
});

describe('visualViewport store', () => {
	it('T-01 init() is idempotent — second call binds zero new listeners', async () => {
		// Spy addEventListener on the polyfill instance + window + document. Use vi.spyOn
		// (not Object.defineProperty) so the original behavior still runs.
		const vvAddSpy = vi.spyOn(window.visualViewport!, 'addEventListener');
		const winAddSpy = vi.spyOn(window, 'addEventListener');
		const docAddSpy = vi.spyOn(document, 'addEventListener');

		const { vv } = await import('./visualViewport.svelte.js');
		vv.init();
		const afterFirst = {
			vvCalls: vvAddSpy.mock.calls.length,
			winCalls: winAddSpy.mock.calls.length,
			docCalls: docAddSpy.mock.calls.length
		};
		vv.init(); // idempotent — must not bind again
		expect(vvAddSpy.mock.calls.length).toBe(afterFirst.vvCalls);
		expect(winAddSpy.mock.calls.length).toBe(afterFirst.winCalls);
		expect(docAddSpy.mock.calls.length).toBe(afterFirst.docCalls);
		vvAddSpy.mockRestore();
		winAddSpy.mockRestore();
		docAddSpy.mockRestore();
	});

	it('T-02 state updates on simulated keyboard-up resize (DRAWER-02)', async () => {
		const { vv } = await import('./visualViewport.svelte.js');
		vv.init();
		simulateKeyboardOpen(); // height = innerHeight - 290
		expect(vv.keyboardOpen).toBe(true);
		expect(vv.height).toBeLessThan(window.innerHeight);
	});

	it('T-03 state re-reads on keyboard-down — no caching (DRAWER-02 / iOS 26 #800125)', async () => {
		const { vv } = await import('./visualViewport.svelte.js');
		vv.init();
		simulateKeyboardOpen();
		simulateKeyboardDown(); // height = innerHeight
		expect(vv.keyboardOpen).toBe(false);
		expect(vv.height).toBe(window.innerHeight);
	});

	it('T-04 bfcache restore re-binds via pageshow.persisted (DRAWER-03 / P-04)', async () => {
		const { vv } = await import('./visualViewport.svelte.js');
		vv.init();
		// Mutate the polyfill BEFORE dispatching pageshow — if the singleton listens
		// correctly, the pageshow.persisted=true handler will sync-read the new value.
		// We bypass the dispatchVisualViewportResize call (which would also fire 'resize')
		// by mutating directly so the only signal that updates state is the pageshow handler.
		const polyfill = window.visualViewport as unknown as { height: number; offsetTop: number };
		polyfill.height = window.innerHeight - 290;
		polyfill.offsetTop = 0;
		simulateBfcacheRestore(); // dispatches pageshow with persisted: true
		expect(vv.height).toBe(window.innerHeight - 290);
	});

	it('T-05 hardware-keyboard guard — innerHeight - vv.height <= 100 keeps keyboardOpen false (DRAWER-09)', async () => {
		const { vv } = await import('./visualViewport.svelte.js');
		vv.init();
		// Bluetooth keyboard pairing leaves vv.height == innerHeight → delta = 0 → guard holds.
		dispatchVisualViewportResize(window.innerHeight, 0);
		expect(vv.keyboardOpen).toBe(false);
		// Edge of the threshold: 99px shrink stays false; 101px shrink flips true.
		dispatchVisualViewportResize(window.innerHeight - 99, 0);
		expect(vv.keyboardOpen).toBe(false);
		dispatchVisualViewportResize(window.innerHeight - 101, 0);
		expect(vv.keyboardOpen).toBe(true);
	});

	it('T-06 source-grep regression sentinel — no visualViewport.addEventListener("scroll", ...) (DRAWER-02 / P-08)', () => {
		const src = readFileSync(
			resolve(__dirname, 'visualViewport.svelte.ts'),
			'utf8'
		);
		// Strip comment lines first so a "// NOTE: NO scroll listener" comment does not trigger the gate.
		const code = src
			.split('\n')
			.filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
			.join('\n');
		expect(code).not.toMatch(/\.addEventListener\(\s*['"]scroll['"]/);
		// Defense in depth — also reject the literal API name match in code.
		expect(code).not.toMatch(/visualViewport\.addEventListener\(\s*['"]scroll/);
		// Positive sanity: the file DOES register a 'resize' listener (singleton is alive).
		expect(code).toMatch(/\.addEventListener\(\s*['"]resize['"]/);
	});
});
