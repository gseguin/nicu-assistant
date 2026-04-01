<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import NavShell from '$lib/shell/NavShell.svelte';
  import { theme } from '$lib/shared/theme.svelte.js';

  let { children } = $props();

  onMount(() => {
    theme.init();
  });
</script>

<div class="min-h-screen flex flex-col">
  <NavShell />
  <!-- pb-20 clears the fixed bottom nav on mobile; no bottom padding needed on desktop -->
  <main class="flex-1 pb-20 md:pb-0">
    {@render children()}
  </main>
</div>
