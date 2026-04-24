<script lang="ts">
	import { onMount } from 'svelte';
	import { setCalculatorContext } from '$lib/shared/context.js';
	import { girState } from '$lib/gir/state.svelte.js';
	import GirCalculator from '$lib/gir/GirCalculator.svelte';
	import GirInputs from '$lib/gir/GirInputs.svelte';
	import InputDrawer from '$lib/shared/components/InputDrawer.svelte';
	import { Droplet } from '@lucide/svelte';

	onMount(() => {
		setCalculatorContext({
			id: 'gir',
			accentColor: 'var(--color-identity)'
		});
		girState.init();
	});

	// Drawer expanded state — mobile-only affordance, drives the bottom-sheet <dialog>.
	let drawerExpanded = $state(false);

	// One-line summary for the drawer handle. Tracks live state so a clinician can
	// confirm what's loaded without expanding the drawer.
	const drawerSummary = $derived.by(() => {
		const w = girState.current.weightKg;
		const d = girState.current.dextrosePct;
		const f = girState.current.mlPerKgPerDay;
		const wStr = w === null ? '—' : `${w}`;
		const dStr = d === null ? '—' : `${d}%`;
		const fStr = f === null ? '—' : `${f}`;
		return `Weight ${wStr} kg · ${dStr} dextrose · ${fStr} ml/kg/day`;
	});
</script>

<svelte:head>
	<title>GIR | NICU Assistant</title>
</svelte:head>

<!--
  Plan 42.1-05 (D-08): hero-fills-viewport shell, default-ON.

  Mobile (<md): single column. Hero card + advisories + titration grid sit in the
  scroll region; the InputDrawer pins above the bottom nav (Plan 1's safe-area
  clearance is preserved by main's pb-[calc(...)] in +layout.svelte).

  Desktop (md+): two-column grid. Hero+grid on the left ~60%; inputs card sticks
  to the top of the right ~40% column as the user scrolls. The mobile drawer
  handle is hidden via md:hidden inside InputDrawer itself.

  Defaults pre-computed via girState (weight=3.93, dextrose=12.5, fluid=65) so
  the hero shows real Current GIR + Initial Rate numbers on first paint.

  IMPORTANT (per orchestrator): the GlucoseTitrationGrid stays BELOW the hero in
  the calculator — NOT in the drawer. The drawer contains only the 3 inputs
  (Weight, Dextrose, Fluid). Each titration row carries its own per-row "current"
  affordance and renders inside the calculator subtree.
-->
<div class="identity-gir">
	<div class="mx-auto max-w-lg px-4 py-6 md:max-w-6xl md:px-6">
		<header class="flex items-center gap-3">
			<Droplet size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
			<div class="flex flex-col">
				<h1 class="text-title font-bold text-[var(--color-text-primary)]">Glucose Infusion Rate</h1>
				<span class="text-ui text-[var(--color-text-secondary)]">mg/kg/min · titration helper</span>
			</div>
		</header>

		<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- Hero + advisories + titration grid column -->
			<div class="min-w-0">
				<GirCalculator />
			</div>

			<!-- Desktop inputs column: sticky as user scrolls. Mobile (<md) hides this; the
			     <InputDrawer> below is the mobile entry point. -->
			<aside class="hidden md:block" aria-label="GIR inputs">
				<div class="sticky top-20">
					<GirInputs />
				</div>
			</aside>
		</div>
	</div>
</div>

<!-- Mobile-only inputs drawer: handle pins above the bottom nav, sheet expands on tap. -->
<InputDrawer summary={drawerSummary} title="GIR inputs" bind:expanded={drawerExpanded}>
	{#snippet children()}
		<GirInputs />
	{/snippet}
</InputDrawer>
