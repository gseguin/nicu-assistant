<script lang="ts">
	import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
	import { feedsModule } from '$lib/feeds/calculator.js';
</script>

<CalculatorPage module={feedsModule} />
