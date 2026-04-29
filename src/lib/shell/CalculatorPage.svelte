<!--
  src/lib/shell/CalculatorPage.svelte

  Generic calculator route shell. Replaces the ~95–122 LOC of duplicated
  layout that previously lived in each src/routes/{slice}/+page.svelte.
  Driven by a CalculatorModule that bundles a slice's metadata, state,
  components, and recap-derivation function.

  Local state owned here:
  - drawerExpanded — was per-route before; mobile InputsRecap toggles it
  - recapItems — derived by calling module.getRecapItems(module.state.current)

  `module` is a Svelte reserved word, so we alias the prop to `mod`.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { CalculatorModule } from './calculator-module.js';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import InputsRecap from '$lib/shared/components/InputsRecap.svelte';

	// `CalculatorModule<TState>` is invariant in TState (CalculatorStore's merge
	// callback has T in both input and output positions), so a narrow
	// `CalculatorModule<unknown>` annotation breaks every typed consumer.
	// The shell never inspects state — it round-trips it through getRecapItems
	// and state methods — so `any` is the honest, contained erasure here.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let { module: mod }: { module: CalculatorModule<any> } = $props();

	let drawerExpanded = $state(false);
	const recapItems = $derived(mod.getRecapItems(mod.state.current));

	// Defensive init: CalculatorStore's constructor already eagerly inits, but
	// each existing route also called state.init() in onMount. init() is
	// idempotent — calling it twice is safe — so we preserve the defensive
	// call to match existing behavior 1:1.
	onMount(() => {
		mod.state.init();
	});

	const Icon = $derived(mod.icon);
	const Calculator = $derived(mod.Calculator);
	const Inputs = $derived(mod.Inputs);
</script>

<svelte:head>
	<title>{mod.label} | NICU Assistant</title>
</svelte:head>

<div class={mod.identityClass}>
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Icon size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
			<div class="flex flex-col">
				<h1 class="text-title font-bold text-[var(--color-text-primary)]">
					{mod.title}
				</h1>
				{#if mod.subtitle}
					<span class="text-ui text-[var(--color-text-secondary)]">
						{mod.subtitle}
					</span>
				{/if}
			</div>
		</header>

		<div class="mt-4">
			<InputsRecap
				items={recapItems}
				onOpen={() => (drawerExpanded = true)}
				expanded={drawerExpanded}
				lastEditedAt={mod.state.lastEdited.current}
			/>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="min-w-0">
				<Calculator />
			</div>

			<aside class="hidden md:block" aria-label={mod.inputsLabel}>
				<div class="sticky top-20">
					<Inputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<InputDrawer
	title={mod.inputsLabel}
	bind:expanded={drawerExpanded}
	onClear={() => mod.state.reset()}
>
	{#snippet children()}
		<Inputs />
	{/snippet}
</InputDrawer>
