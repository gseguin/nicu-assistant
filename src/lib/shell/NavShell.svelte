<script lang="ts">
  import { page } from '$app/state';
  import { CALCULATOR_REGISTRY } from './registry.js';
  import { theme } from '$lib/shared/theme.svelte.js';
  import { Sun, Moon, Info } from '@lucide/svelte';
  import AboutSheet from '$lib/shared/components/AboutSheet.svelte';
  import type { CalculatorId } from '$lib/shared/types.js';

  let aboutOpen = $state(false);

  const activeCalculatorId = $derived<CalculatorId>(
    page.url.pathname.startsWith('/formula') ? 'formula'
    : page.url.pathname.startsWith('/gir') ? 'gir'
    : page.url.pathname.startsWith('/feeds') ? 'feeds'
    : 'morphine-wean'
  );
</script>

<!-- Top title bar: always visible on all viewports -->
<header
  class="sticky top-0 left-0 right-0 z-10 min-h-14
         flex items-center px-4 gap-2
         border-b border-[var(--color-border)] bg-[var(--color-surface)]"
>
  <!-- App name -->
  <span class="font-semibold text-base tracking-tight text-[var(--color-text-primary)]">NICU Assist</span>

  <!-- Desktop calculator tabs (hidden on mobile) -->
  <nav class="hidden md:flex gap-2 ml-4" aria-label="Calculator navigation">
    <div class="flex gap-2" role="tablist">
      {#each CALCULATOR_REGISTRY as calc}
        {@const isActive = page.url.pathname.startsWith(calc.href)}
        <a
          href={calc.href}
          class="{calc.identityClass} flex items-center gap-2 px-4 py-3 text-ui font-medium
                 min-h-[48px] border-b-2 transition-colors rounded-t-lg
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-identity)]
                 {isActive
                   ? 'border-[var(--color-identity)] text-[var(--color-identity)]'
                   : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
          aria-label="{calc.label} — {calc.description}"
          aria-selected={isActive}
          role="tab"
        >
          <calc.icon size={18} aria-hidden="true" />
          <span>{calc.label}</span>
        </a>
      {/each}
    </div>
  </nav>

  <!-- Spacer pushes action buttons right -->
  <div class="flex-1"></div>

  <!-- Action buttons: info + theme toggle (all viewports) -->
  <div class="flex items-center gap-0.5">
    <button
      type="button"
      class="icon-btn min-h-[48px] min-w-[48px]"
      aria-label="About this calculator"
      onclick={() => aboutOpen = true}
    >
      <Info size={20} aria-hidden="true" />
    </button>
    <button
      type="button"
      class="icon-btn min-h-[48px] min-w-[48px]"
      aria-label={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onclick={() => theme.toggle()}
    >
      {#if theme.current === 'dark'}
        <Sun size={20} aria-hidden="true" />
      {:else}
        <Moon size={20} aria-hidden="true" />
      {/if}
    </button>
  </div>
</header>

<!-- Mobile bottom tab bar: calculator tabs only, hidden on md+ -->
<nav
  class="fixed bottom-0 left-0 right-0 z-10 md:hidden
         border-t border-[var(--color-border)] bg-[var(--color-surface)]
         pb-[env(safe-area-inset-bottom,0px)]"
  aria-label="Calculator navigation"
>
  <div class="flex" role="tablist">
    {#each CALCULATOR_REGISTRY as calc}
      {@const isActive = page.url.pathname.startsWith(calc.href)}
      <a
        href={calc.href}
        class="{calc.identityClass} flex flex-col items-center justify-center flex-1 gap-1
               min-h-14 py-2 text-ui font-medium transition-colors
               focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]
               {isActive
                 ? 'text-[var(--color-identity)] font-semibold'
                 : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
        aria-label="{calc.label} — {calc.description}"
        aria-selected={isActive}
        role="tab"
      >
        <calc.icon size={22} aria-hidden="true" />
        <span>{calc.label}</span>
      </a>
    {/each}
  </div>
</nav>

<AboutSheet calculatorId={activeCalculatorId} bind:open={aboutOpen} />
