<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import NavShell from '$lib/shell/NavShell.svelte';
	import UpdateBanner from '$lib/shell/UpdateBanner.svelte';
	import DisclaimerModal from '$lib/shared/components/DisclaimerModal.svelte';
	import { theme } from '$lib/shared/theme.svelte.js';
	import { disclaimer } from '$lib/shared/disclaimer.svelte.js';
	import { pwa } from '$lib/shared/pwa.svelte.js';
	import { morphineState } from '$lib/morphine/state.svelte.js';
	import { fortificationState } from '$lib/fortification/state.svelte.js';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	// Idle = all inputs in both calculators still at defaults (D-02)
	const isIdle = $derived(
		morphineState.current.weightKg === 3.1 &&
			morphineState.current.maxDoseMgKgDose === 0.04 &&
			morphineState.current.decreasePct === 10 &&
			fortificationState.current.base === 'breast-milk' &&
			fortificationState.current.volumeMl === 180 &&
			fortificationState.current.formulaId === 'neocate-infant' &&
			fortificationState.current.targetKcalOz === 24 &&
			fortificationState.current.unit === 'teaspoons'
	);

	// Auto-reload when idle and an update is waiting (D-02: never silently reload during active use)
	$effect(() => {
		if (pwa.needsRefresh && isIdle) {
			pwa.applyUpdate();
		}
	});

	// webManifest is reactive — undefined during SSG, populated client-side
	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(() => {
		theme.init();
		disclaimer.init();

		// SW registration — dynamic import avoids SSG/SSR issues with virtual modules
		if (pwaInfo) {
			import('virtual:pwa-register').then(({ registerSW }) => {
				const updateSW = registerSW({
					immediate: true,
					onNeedRefresh() {
						pwa.setUpdateAvailable(updateSW);
					},
					onOfflineReady() {
						// App is ready to work offline — no UI needed, precache complete
					}
				});
			});
		}
	});
</script>

<svelte:head>
	{@html webManifest}
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="NICU Assist" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

<DisclaimerModal />
<UpdateBanner />
<div class="flex min-h-screen flex-col">
	<NavShell />
	<!-- pb-20 clears the bottom nav on mobile (62.5px nav + safe-area + magnification headroom); no bottom padding on desktop -->
	<main class="flex-1 pb-20 md:pb-0">
		{@render children()}
	</main>
</div>
