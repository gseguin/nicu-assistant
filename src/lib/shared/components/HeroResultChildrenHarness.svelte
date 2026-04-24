<script lang="ts">
	// Test-only harness: passes a `children` Snippet to HeroResult so the
	// Snippet override path can be exercised without test code constructing
	// runtime Snippets.
	import HeroResult from './HeroResult.svelte';
</script>

<HeroResult eyebrow="DEFAULT EYEBROW" value="999">
	{#snippet children()}
		<div data-testid="custom-body">CUSTOM CHILDREN BODY</div>
	{/snippet}
</HeroResult>
