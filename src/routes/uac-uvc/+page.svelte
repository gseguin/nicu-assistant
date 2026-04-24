<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { uacUvcState } from '$lib/uac-uvc/state.svelte.js';
	import UacUvcCalculator from '$lib/uac-uvc/UacUvcCalculator.svelte';
	import UacUvcInputs from '$lib/uac-uvc/UacUvcInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import { Ruler } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'uac-uvc',
			accentColor: 'var(--color-identity)'
		});
		uacUvcState.init();
	});

	// Drawer expanded state — mobile-only affordance, drives the bottom-sheet <dialog>.
	let drawerExpanded = $state(false);

	// One-line summary for the drawer handle. Tracks live state so a clinician can
	// confirm what's loaded without expanding the drawer.
	const drawerSummary = $derived.by(() => {
		const w = uacUvcState.current.weightKg;
		const wStr = w === null ? '—' : `${w}`;
		return `Weight ${wStr} kg`;
	});
</script>

<svelte:head>
	<title>UAC/UVC | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Mobile (<md): single column. UAC + UVC hero grid sits at top of the page; the
  InputDrawer pins above the bottom nav (Plan 1's safe-area clearance is preserved
  by main's pb-[calc(...)] in +layout.svelte).

  Desktop (md+): two-column grid. Hero pair on the left ~60%; inputs card sticks
  to the top of the right ~40% column as the user scrolls. The mobile drawer
  handle is hidden via md:hidden inside InputDrawer itself.

  IMPORTANT (per orchestrator): the inputs include BOTH NumericInput AND bits-ui
  Slider for weight (bidirectionally synced). Both go in the drawer.

  Defaults pre-computed via uacUvcState (weight=2.5) so the hero shows real UAC=
  16.5 / UVC=8.3 numerals on first paint per D-08 acceptance.
-->
<div class="identity-uac">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Ruler size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
			<div class="flex flex-col">
				<h1 class="text-title font-bold text-[var(--color-text-primary)]">UAC/UVC Catheter Depth</h1>
				<span class="text-ui text-[var(--color-text-secondary)]">cm · weight-based formula</span>
			</div>
		</header>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero pair column -->
			<div class="min-w-0">
				<UacUvcCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile (<md) hides this; the
			     <InputDrawer> below is the mobile entry point. -->
			<aside class="hidden md:block" aria-label="UAC/UVC inputs">
				<div class="sticky top-20">
					<UacUvcInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: handle pins above the bottom nav, sheet expands on tap. -->
<InputDrawer summary={drawerSummary} title="UAC/UVC inputs" bind:expanded={drawerExpanded}>
	{#snippet children()}
		<UacUvcInputs />
	{/snippet}
</InputDrawer>
