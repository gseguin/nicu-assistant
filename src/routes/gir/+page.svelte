<script lang="ts">
	import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
	import { girModule } from '$lib/gir/calculator.js';
</script>

<CalculatorPage module={girModule} />
