<script lang="ts">
	// Test-only stub icon: matches the @lucide/svelte SVG component shape so
	// HeroResult can pass it via the `icon` prop and render it like a real icon.
	let {
		size = 24,
		class: className = '',
		...rest
	}: {
		size?: number;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<svg
	data-testid="stub-icon"
	width={size}
	height={size}
	class={className}
	{...rest}
>
	<rect width={size} height={size} />
</svg>
