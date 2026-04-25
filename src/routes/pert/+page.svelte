<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { pertState } from '$lib/pert/state.svelte.js';
	import { getFormulaById } from '$lib/pert/config.js';
	import PertCalculator from '$lib/pert/PertCalculator.svelte';
	import PertInputs from '$lib/pert/PertInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import InputsRecap, { type RecapItem } from '$lib/shared/components/InputsRecap.svelte';
	import { Pill } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'pert',
			accentColor: 'var(--color-identity)'
		});
		pertState.init();
	});

	// Drawer expanded state: mobile-only affordance, driven by InputsRecap tap.
	let drawerExpanded = $state(false);

	// Recap surface: weight is shared across both modes (the patient anchor); the
	// mode-specific addenda below cover Oral (Fat g) and Tube-Feed (Formula name +
	// Volume mL) per UI-SPEC Copywriting Contract. Each mode contributes the
	// inputs that drive its hero numeral so the recap reads "what I fed it"
	// correctly across mode switches.
	const recapItems = $derived.by<RecapItem[]>(() => {
		const items: RecapItem[] = [
			{
				label: 'Weight',
				value: pertState.current.weightKg === null ? null : `${pertState.current.weightKg}`,
				unit: 'kg',
				fullRow: true
			}
		];

		if (pertState.current.mode === 'oral') {
			items.push({
				label: 'Fat',
				value:
					pertState.current.oral.fatGrams === null
						? null
						: `${pertState.current.oral.fatGrams}`,
				unit: 'g'
			});
		} else {
			const formula =
				pertState.current.tubeFeed.formulaId === null
					? null
					: getFormulaById(pertState.current.tubeFeed.formulaId);
			items.push({
				label: 'Formula',
				value: formula?.name ?? null,
				fullRow: true
			});
			items.push({
				label: 'Volume',
				value:
					pertState.current.tubeFeed.volumePerDayMl === null
						? null
						: `${pertState.current.tubeFeed.volumePerDayMl}`,
				unit: 'mL'
			});
		}

		return items;
	});
</script>

<svelte:head>
	<title>PERT | NICU Assistant</title>
</svelte:head>

<!-- Phase 1 shell. Real inputs (mode toggle, fat g, formula picker, volume,
     lipasePerKg, medication, strength) land in Phase 2 inside PertInputs. -->
<div class="identity-pert">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Pill size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
			<div class="flex flex-col">
				<h1 class="text-title font-bold text-[var(--color-text-primary)]">
					Pediatric EPI PERT Calculator
				</h1>
				<span class="text-ui text-[var(--color-text-secondary)]">
					Capsule dosing · oral &amp; tube-feed modes
				</span>
			</div>
		</header>

		<div class="mt-4">
			<InputsRecap
				items={recapItems}
				onOpen={() => (drawerExpanded = true)}
				expanded={drawerExpanded}
				lastEditedAt={pertState.lastEdited.current}
			/>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="min-w-0">
				<PertCalculator />
			</div>

			<aside class="hidden md:block" aria-label="PERT inputs">
				<div class="sticky top-20">
					<PertInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<InputDrawer
	title="PERT inputs"
	bind:expanded={drawerExpanded}
	onClear={() => pertState.reset()}
>
	{#snippet children()}
		<PertInputs />
	{/snippet}
</InputDrawer>
