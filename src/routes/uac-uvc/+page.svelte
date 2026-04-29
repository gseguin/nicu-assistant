<script lang="ts">
	import CalculatorPage from '$lib/shell/CalculatorPage.svelte';
	import { uacUvcModule } from '$lib/uac-uvc/calculator.js';
</script>

<CalculatorPage module={uacUvcModule} />
