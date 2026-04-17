<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { girState } from '$lib/gir/state.svelte.js';
	import GirCalculator from '$lib/gir/GirCalculator.svelte';
	import { Droplet } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'gir',
			accentColor: 'var(--color-identity)'
		});
		girState.init();
	});
</script>

<svelte:head>
	<title>GIR | NICU Assistant</title>
</svelte:head>

<div class="identity-gir mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl">
	<header class="flex items-center gap-3">
		<Droplet size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
		<div class="flex flex-col">
			<h1 class="text-title font-bold text-[var(--color-text-primary)]">Glucose Infusion Rate</h1>
			<span class="text-ui text-[var(--color-text-secondary)]">mg/kg/min · titration helper</span>
		</div>
	</header>

	<GirCalculator />
</div>
