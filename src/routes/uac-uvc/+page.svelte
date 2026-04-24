<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { uacUvcState } from '$lib/uac-uvc/state.svelte.js';
	import UacUvcCalculator from '$lib/uac-uvc/UacUvcCalculator.svelte';
	import UacUvcInputs from '$lib/uac-uvc/UacUvcInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import InputsRecap, { type RecapItem } from '$lib/shared/components/InputsRecap.svelte';
	import { Ruler } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'uac-uvc',
			accentColor: 'var(--color-identity)'
		});
		uacUvcState.init();
	});

	// Drawer expanded state — mobile-only affordance, driven by InputsRecap tap.
	let drawerExpanded = $state(false);

	// Single-input calculator — the recap still renders for pattern consistency
	// across all 5 calculators (the clinician reads the same shape every time).
	const recapItems = $derived.by<RecapItem[]>(() => [
		{
			label: 'Weight',
			value: uacUvcState.current.weightKg === null ? null : `${uacUvcState.current.weightKg}`,
			unit: 'kg',
			fullRow: true
		}
	]);
</script>

<svelte:head>
	<title>UAC/UVC | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Reading order below the title: InputsRecap → UAC + UVC hero pair. The inputs
  include both NumericInput and bits-ui Slider for weight (bidirectionally
  synced) — both go in the drawer. Tapping the recap on mobile opens it.
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

		<div class="mt-4">
			<InputsRecap
				items={recapItems}
				onOpen={() => (drawerExpanded = true)}
				expanded={drawerExpanded}
				lastEditedAt={uacUvcState.lastEdited.current}
			/>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero pair column -->
			<div class="min-w-0">
				<UacUvcCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile opens the drawer via InputsRecap. -->
			<aside class="hidden md:block" aria-label="UAC/UVC inputs">
				<div class="sticky top-20">
					<UacUvcInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: opened by InputsRecap above. -->
<InputDrawer
	title="UAC/UVC inputs"
	bind:expanded={drawerExpanded}
	onClear={() => uacUvcState.reset()}
>
	{#snippet children()}
		<UacUvcInputs />
	{/snippet}
</InputDrawer>
