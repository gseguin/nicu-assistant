<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { fortificationState } from '$lib/fortification/state.svelte.js';
	import FortificationCalculator from '$lib/fortification/FortificationCalculator.svelte';
	import { Milk } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'formula',
			accentColor: 'var(--color-accent)'
		});
		fortificationState.init();
	});
</script>

<svelte:head>
	<title>Formula Recipe | NICU Assistant</title>
</svelte:head>

<div class="identity-formula mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl">
	<header class="flex items-center gap-3">
		<Milk size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
		<h1 class="text-title font-bold text-[var(--color-text-primary)]">Formula Recipe</h1>
	</header>

	<FortificationCalculator />
</div>
