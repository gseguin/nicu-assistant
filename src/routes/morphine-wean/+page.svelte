<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { morphineState } from '$lib/morphine/state.svelte.js';
	import MorphineWeanCalculator from '$lib/morphine/MorphineWeanCalculator.svelte';
	import { Syringe } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'morphine-wean',
			accentColor: 'var(--color-accent)'
		});
		morphineState.init();
	});
</script>

<svelte:head>
	<title>Morphine Wean | NICU Assistant</title>
</svelte:head>

<div class="identity-morphine mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl">
	<header class="flex items-center gap-3">
		<Syringe size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
		<h1 class="text-title font-bold text-[var(--color-text-primary)]">Morphine Wean</h1>
	</header>

	<MorphineWeanCalculator />
</div>
