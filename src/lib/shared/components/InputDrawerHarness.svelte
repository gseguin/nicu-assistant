<script lang="ts">
	import InputDrawer from './InputDrawer.svelte';

	let { initialExpanded = false }: { initialExpanded?: boolean } = $props();
	// One-shot read at mount; the harness exists so tests can observe two-way binding.
	// svelte-ignore state_referenced_locally
	let expanded = $state(initialExpanded);
</script>

<InputDrawer summary="Weight 3.1 kg · 10% step" bind:expanded>
	{#snippet children()}
		<input data-testid="drawer-input" placeholder="weight" />
	{/snippet}
</InputDrawer>
<span data-testid="expanded-state">{expanded ? 'open' : 'closed'}</span>
