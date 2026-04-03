<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { X } from '@lucide/svelte';
  import { aboutContent } from '$lib/shared/about-content.js';
  import type { CalculatorId } from '$lib/shared/types.js';

  let {
    calculatorId,
    open = $bindable(false),
  }: {
    calculatorId: CalculatorId;
    open: boolean;
  } = $props();

  let content = $derived(aboutContent[calculatorId]);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
  }

  function handleCloseAutoFocus(e: Event) {
    e.preventDefault();
    // bits-ui handles focus restoration automatically; preventDefault stops default behavior
    // so focus returns to whatever element was focused before the sheet opened
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" />
    <Dialog.Content
      onCloseAutoFocus={handleCloseAutoFocus}
      class="fixed z-50 bg-[var(--color-surface-card)] shadow-2xl
             bottom-0 left-0 right-0 rounded-t-2xl max-h-[85svh]
             sm:bottom-auto sm:top-0 sm:right-0 sm:left-auto sm:h-full
             sm:w-[min(28rem,100vw)] sm:rounded-none sm:rounded-l-2xl
             flex flex-col overflow-hidden"
      aria-labelledby="about-title"
    >
      <div class="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div>
          <Dialog.Title id="about-title" class="text-lg font-bold text-[var(--color-text-primary)]">
            {content.title}
          </Dialog.Title>
          <span class="text-2xs text-[var(--color-text-tertiary)] font-medium">{content.version}</span>
        </div>
        <Dialog.Close
          class="flex items-center justify-center w-10 h-10 rounded-xl
                 bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]
                 hover:bg-[var(--color-border)] transition-colors"
          aria-label="Close"
        >
          <X class="w-5 h-5" aria-hidden="true" />
        </Dialog.Close>
      </div>

      <div class="flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] space-y-4">
        <p class="text-base leading-relaxed text-[var(--color-text-secondary)]">{content.description}</p>
        <ul class="space-y-2">
          {#each content.notes as note}
            <li class="flex gap-2 text-sm text-[var(--color-text-secondary)]">
              <span class="text-[var(--color-accent)] font-bold mt-0.5" aria-hidden="true">&#8226;</span>
              <span>{note}</span>
            </li>
          {/each}
        </ul>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
