<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import NavShell from '$lib/shell/NavShell.svelte';
  import UpdateBanner from '$lib/shell/UpdateBanner.svelte';
  import DisclaimerModal from '$lib/shared/components/DisclaimerModal.svelte';
  import { theme } from '$lib/shared/theme.svelte.js';
  import { disclaimer } from '$lib/shared/disclaimer.svelte.js';
  import { pwa } from '$lib/shared/pwa.svelte.js';
  import { pertState } from '$lib/pert/state.svelte.js';
  import { formulaState } from '$lib/formula/state.svelte.js';
  import { pwaInfo } from 'virtual:pwa-info';

  let { children } = $props();

  // Idle = no meaningful numeric inputs filled in either calculator (D-02)
  const isIdle = $derived(
    pertState.current.meal.fatGramsRaw === '' &&
    pertState.current.tubeFeed.fatGramsRaw === '' &&
    formulaState.current.modified.targetKcalOzRaw === '' &&
    formulaState.current.bmf.targetKcalOzRaw === ''
  );

  // Auto-reload when idle and an update is waiting (D-02: never silently reload during active use)
  $effect(() => {
    if (pwa.needsRefresh && isIdle) {
      pwa.applyUpdate();
    }
  });

  // webManifest is reactive — undefined during SSG, populated client-side
  const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

  onMount(() => {
    theme.init();
    disclaimer.init();

    // SW registration — dynamic import avoids SSG/SSR issues with virtual modules
    if (pwaInfo) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        const updateSW = registerSW({
          immediate: true,
          onNeedRefresh() {
            pwa.setUpdateAvailable(updateSW);
          },
          onOfflineReady() {
            // App is ready to work offline — no UI needed, precache complete
          },
        });
      });
    }
  });
</script>

<svelte:head>
  {@html webManifest}
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="NICU Assist" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

<DisclaimerModal />
<UpdateBanner />
<div class="min-h-screen flex flex-col">
  <NavShell />
  <!-- pb-20 clears the fixed bottom nav on mobile; no bottom padding needed on desktop -->
  <main class="flex-1 pb-20 md:pb-0">
    {@render children()}
  </main>
</div>
