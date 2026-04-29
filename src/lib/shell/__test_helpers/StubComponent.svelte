<!--
  Test-only stub component used by CalculatorPage.test.ts to substitute for
  the slice-specific Calculator and Inputs components. Renders a deterministic
  data-testid so assertions can confirm the shell mounted the correct prop.
-->
<script lang="ts">
	let { label = 'Stub' }: { label?: string } = $props();
</script>

<div data-testid={`stub-${label}`}>{label}</div>
