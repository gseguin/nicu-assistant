<script lang="ts">
  import SegmentedToggle from './SegmentedToggle.svelte';

  let { initial = 'a' }: { initial?: string } = $props();
  let value = $state(initial);

  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];
</script>

<SegmentedToggle label="Mode" bind:value {options} />
<span data-testid="current">{value}</span>
