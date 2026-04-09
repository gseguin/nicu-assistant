<script lang="ts">
  import SegmentedToggle from './SegmentedToggle.svelte';

  let { initial = 'a' }: { initial?: string } = $props();
  // Capture initial prop at mount; this harness is test-only and never reacts
  // to prop changes after mount, so the one-time read is intentional.
  // svelte-ignore state_referenced_locally
  let value = $state(initial);

  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];
</script>

<SegmentedToggle label="Mode" bind:value {options} />
<span data-testid="current">{value}</span>
