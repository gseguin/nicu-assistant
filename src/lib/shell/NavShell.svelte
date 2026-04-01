<script lang="ts">
  import { page } from '$app/state';
  import { CALCULATOR_REGISTRY } from './registry.js';
</script>

<!-- NAV-01: Mobile bottom tab bar — fixed, hidden on md+ -->
<nav
  class="fixed bottom-0 left-0 right-0 flex md:hidden
         border-t border-[var(--color-border)] bg-[var(--color-surface)]
         pb-[env(safe-area-inset-bottom,0px)]"
  aria-label="Calculator navigation"
  role="tablist"
>
  {#each CALCULATOR_REGISTRY as calc}
    {@const isActive = page.url.pathname.startsWith(calc.href)}
    <a
      href={calc.href}
      class="flex flex-col items-center justify-center flex-1 gap-1
             min-h-[48px] py-2 text-ui font-medium
             {isActive
               ? 'text-[var(--color-accent)]'
               : 'text-[var(--color-text-secondary)]'}"
      aria-label={calc.description}
      aria-selected={isActive}
      role="tab"
    >
      <calc.icon size={22} aria-hidden="true" />
      <span>{calc.label}</span>
    </a>
  {/each}
</nav>

<!-- NAV-02: Desktop top nav bar — sticky, hidden on mobile -->
<nav
  class="hidden md:flex sticky top-0 left-0 right-0
         border-b border-[var(--color-border)] bg-[var(--color-surface)]
         px-4 gap-2 z-10"
  aria-label="Calculator navigation"
  role="tablist"
>
  {#each CALCULATOR_REGISTRY as calc}
    {@const isActive = page.url.pathname.startsWith(calc.href)}
    <a
      href={calc.href}
      class="flex items-center gap-2 px-4 py-3 text-ui font-medium
             min-h-[48px] border-b-2 transition-colors
             {isActive
               ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
               : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
      aria-label={calc.description}
      aria-selected={isActive}
      role="tab"
    >
      <calc.icon size={18} aria-hidden="true" />
      <span>{calc.label}</span>
    </a>
  {/each}
</nav>
