<script lang="ts">
  import { Milk } from '@lucide/svelte';
</script>

<svelte:head>
  <title>Formula Recipe | NICU Assistant</title>
</svelte:head>

<div class="max-w-md mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <Milk size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
    <h1 class="text-title font-bold text-[var(--color-text-primary)]">Formula Recipe</h1>
  </header>

  <!-- Skeleton: Formula brand selector -->
  <div class="card space-y-3" aria-hidden="true">
    <div class="h-3 bg-[var(--color-surface-alt)] rounded w-1/3 animate-pulse"></div>
    <div class="h-12 bg-[var(--color-surface-alt)] rounded animate-pulse"></div>
  </div>

  <!-- Skeleton: Target kcal/oz input -->
  <div class="card space-y-3" aria-hidden="true">
    <div class="h-3 bg-[var(--color-surface-alt)] rounded w-1/2 animate-pulse"></div>
    <div class="h-12 bg-[var(--color-surface-alt)] rounded animate-pulse"></div>
  </div>

  <!-- Skeleton: Volume input -->
  <div class="card space-y-3" aria-hidden="true">
    <div class="h-3 bg-[var(--color-surface-alt)] rounded w-2/5 animate-pulse"></div>
    <div class="h-12 bg-[var(--color-surface-alt)] rounded animate-pulse"></div>
  </div>

  <!-- Coming soon notice -->
  <div class="card p-6 text-center">
    <p class="text-[var(--color-text-secondary)] text-sm">
      Formula calculator coming in Phase 3
    </p>
  </div>
</div>
