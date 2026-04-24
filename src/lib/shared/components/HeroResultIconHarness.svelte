<script lang="ts">
	// Test-only harness: passes a stub Component as the `icon` prop of HeroResult.
	import HeroResult from './HeroResult.svelte';
	import StubIcon from './StubIcon.svelte';
</script>

<HeroResult
	eyebrow="ICON EYEBROW"
	value="42"
	unit="cm"
	icon={StubIcon}
/>
