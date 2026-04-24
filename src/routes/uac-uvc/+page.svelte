<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { uacUvcState } from '$lib/uac-uvc/state.svelte.js';
	import { Ruler } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'uac-uvc',
			accentColor: 'var(--color-identity)'
		});
		uacUvcState.init();
	});
</script>

<svelte:head>
	<title>UAC/UVC | NICU Assistant</title>
</svelte:head>

<div class="identity-uac mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl">
	<header class="flex items-center gap-3">
		<Ruler size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
		<div class="flex flex-col">
			<h1 class="text-title font-bold text-[var(--color-text-primary)]">UAC/UVC Catheter Depth</h1>
			<span class="text-ui text-[var(--color-text-secondary)]">cm · weight-based formula</span>
		</div>
	</header>

	<!-- TODO(plan 42-02): replace placeholder with `<UacUvcCalculator />` once component is built. -->
	<div aria-hidden="true"></div>
</div>
