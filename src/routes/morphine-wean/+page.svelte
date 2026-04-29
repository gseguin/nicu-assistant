<script lang="ts">
	import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
	import { morphineModule } from '$lib/morphine/calculator.js';
</script>

<CalculatorPage module={morphineModule} />
