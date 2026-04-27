// src/lib/shared/visualViewport.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// Source pattern: favorites.svelte.ts (class-based singleton with $state runes + idempotent init())
// Phase 49 / DRAWER-01..04 + DRAWER-09: subscribes to window.visualViewport.resize ONLY
// (NOT scroll — P-08); rebinds on pageshow.persisted + visibilitychange (P-04 bfcache);
// re-reads on every event with NO caching (iOS 26 #800125 post-dismiss regression).

import { browser } from '$app/environment';

class VisualViewportStore {
	offsetTop = $state(0);
	height = $state(0);
	keyboardOpen = $state(false);
	#initialized = false;

	init(): void {
		if (!browser || this.#initialized) return;
		this.#initialized = true;

		const vv = window.visualViewport;
		// Older iOS / unsupported runtime: leave runes at defaults; .input-drawer-sheet
		// falls back to verbatim 80dvh / safe-area-inset-bottom behavior. Per D-03.
		if (!vv) return;

		const update = () => {
			this.offsetTop = vv.offsetTop;
			this.height = vv.height;
			// 100px threshold filters URL-bar collapse (~50-80px Safari) and admits
			// OSK only (~290px portrait). Hardware Bluetooth keyboards leave vv.height
			// unchanged → window.innerHeight - vv.height ≈ 0 → keyboardOpen stays false.
			// Per D-07 + DRAWER-09 + PITFALLS.md P-05.
			this.keyboardOpen = window.innerHeight - vv.height > 100;
		};

		update(); // seed initial values per D-05

		// D-04: resize ONLY (NOT scroll — P-08). { passive: true } defense-in-depth.
		vv.addEventListener('resize', update, { passive: true });

		// D-04 + DRAWER-03: bfcache restore re-binds via pageshow.persisted === true.
		window.addEventListener(
			'pageshow',
			(e: PageTransitionEvent) => {
				if (e.persisted) update();
			},
			{ passive: true }
		);

		// D-04 + DRAWER-03: foreground-return re-binds via visibilitychange.
		document.addEventListener(
			'visibilitychange',
			() => {
				if (document.visibilityState === 'visible') update();
			},
			{ passive: true }
		);
	}
}

export const vv = new VisualViewportStore();
