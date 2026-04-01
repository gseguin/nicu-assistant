// src/lib/shared/pwa.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// Reactive singleton bridging the SW update lifecycle to the UpdateBanner component.
// Follows the established theme.svelte.ts / disclaimer.svelte.ts singleton pattern.

let needsRefresh = $state(false);
let _updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

export const pwa = {
	get needsRefresh(): boolean {
		return needsRefresh;
	},

	/** Called from +layout.svelte onNeedRefresh callback with the updateSW function */
	setUpdateAvailable(updateFn: (reloadPage?: boolean) => Promise<void>): void {
		_updateSW = updateFn;
		needsRefresh = true;
	},

	/** Apply the waiting SW and reload. Called by UpdateBanner "Update now" button. */
	async applyUpdate(): Promise<void> {
		if (_updateSW) {
			await _updateSW(true);
		}
	},

	/** Dismiss the banner without updating. User can update on next session. */
	dismiss(): void {
		needsRefresh = false;
	}
};
