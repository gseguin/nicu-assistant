<script lang="ts">
  import { tick } from 'svelte';
  import { Check, ChevronDown } from '@lucide/svelte';
  import { getCalculatorContext } from '../context.js';
  import type { SelectOption } from '../types.js';

  let {
    label,
    value = $bindable(),
    options,
    placeholder = 'Select...',
    class: className = '',
  }: {
    label: string;
    value: string;
    options: SelectOption[];
    placeholder?: string;
    class?: string;
  } = $props();

  const ctx = getCalculatorContext();
  const accentColor = ctx.accentColor;

  const uid = crypto.randomUUID();
  const labelId = `select-${uid}-label`;
  const dialogTitleId = `${labelId}-title`;
  const listboxId = `select-${uid}-listbox`;

  let dialog = $state<HTMLDialogElement | null>(null);
  let triggerBtn = $state<HTMLButtonElement | null>(null);
  let open = $state(false);
  let focusedIndex = $state(-1);

  const selectedLabel = $derived(
    options.find((o) => o.value === value)?.label ?? placeholder
  );

  const hasGroups = $derived(options.some((o) => o.group));
  const groups = $derived(
    [...new Set(options.map((o) => o.group).filter(Boolean) as string[])]
  );

  function slug(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function openPicker() {
    if (!dialog) return;
    open = true;
    const idx = options.findIndex((o) => o.value === value);
    focusedIndex = idx >= 0 ? idx : 0;
    dialog.showModal();
    await tick();
    focusOption(focusedIndex);
  }

  function closePicker() {
    dialog?.close();
  }

  function focusOption(i: number) {
    if (!dialog) return;
    const el = dialog.querySelector<HTMLButtonElement>(
      `[role="option"][data-index="${i}"]`
    );
    el?.focus();
  }

  function select(v: string) {
    value = v;
    closePicker();
  }

  function handleListboxKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIndex = Math.min(focusedIndex + 1, options.length - 1);
      focusOption(focusedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIndex = Math.max(focusedIndex - 1, 0);
      focusOption(focusedIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusedIndex = 0;
      focusOption(focusedIndex);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusedIndex = options.length - 1;
      focusOption(focusedIndex);
    }
  }

  function handleDialogClick(e: MouseEvent) {
    if (e.target === dialog) closePicker();
  }

  function handleClose() {
    open = false;
    focusedIndex = -1;
    triggerBtn?.focus();
  }
</script>

<div class="min-w-0 {className}">
  <div class="flex flex-col gap-1.5">
    <span
      id={labelId}
      class="text-xs font-semibold leading-none tracking-[0.02em] text-[var(--color-text-secondary)] ml-0.5"
    >
      {label}
    </span>

    <button
      bind:this={triggerBtn}
      type="button"
      data-select-trigger
      aria-labelledby={labelId}
      aria-haspopup="dialog"
      aria-expanded={open ? 'true' : 'false'}
      class="flex min-h-12 w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-card)] px-3.5 py-2.5 text-left text-[0.9375rem] font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      onclick={openPicker}
    >
      <span class="flex-1 truncate">{selectedLabel}</span>
      <ChevronDown
        class="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]"
        aria-hidden="true"
      />
    </button>
  </div>

  <dialog
    bind:this={dialog}
    class="picker-dialog rounded-2xl bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
    aria-labelledby={open ? dialogTitleId : undefined}
    onclick={handleDialogClick}
    onclose={handleClose}
  >
    {#if open}
      <div
        class="flex flex-col"
        style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      >
        <header class="border-b border-[var(--color-border)] px-5 py-4">
          <span
            id={dialogTitleId}
            class="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            {label}
          </span>
        </header>

        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={dialogTitleId}
          tabindex="-1"
          class="max-h-[70svh] overflow-y-auto px-2 py-2"
          onkeydown={handleListboxKeydown}
        >
          {#if hasGroups}
            {#each groups as group (group)}
              {@const headingId = `${listboxId}-g-${slug(group)}`}
              <div role="group" aria-labelledby={headingId}>
                <div
                  id={headingId}
                  class="sticky top-0 z-10 bg-[var(--color-surface-card)] px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.18em]"
                  style="color: {accentColor}"
                >
                  {group}
                </div>
                {#each options as option, idx (option.value)}
                  {#if option.group === group}
                    <button
                      type="button"
                      role="option"
                      data-index={idx}
                      aria-selected={option.value === value ? 'true' : 'false'}
                      tabindex={idx === focusedIndex ? 0 : -1}
                      class="flex w-full items-center justify-between rounded-xl px-4 py-3 min-h-12 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)] aria-selected:bg-[var(--color-surface-alt)] aria-selected:font-semibold"
                      onclick={() => select(option.value)}
                    >
                      <span>{option.label}</span>
                      {#if option.value === value}
                        <Check
                          class="h-4 w-4 shrink-0"
                          style="color: {accentColor}"
                          aria-hidden="true"
                        />
                      {/if}
                    </button>
                  {/if}
                {/each}
              </div>
            {/each}
          {:else}
            {#each options as option, idx (option.value)}
              <button
                type="button"
                role="option"
                data-index={idx}
                aria-selected={option.value === value ? 'true' : 'false'}
                tabindex={idx === focusedIndex ? 0 : -1}
                class="flex w-full items-center justify-between rounded-xl px-4 py-3 min-h-12 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-alt)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)] aria-selected:bg-[var(--color-surface-alt)] aria-selected:font-semibold"
                onclick={() => select(option.value)}
              >
                <span>{option.label}</span>
                {#if option.value === value}
                  <Check
                    class="h-4 w-4 shrink-0"
                    style="color: {accentColor}"
                    aria-hidden="true"
                  />
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </dialog>
</div>

<style>
  .picker-dialog {
    margin: auto;
    width: min(32rem, 100vw);
    max-width: 32rem;
    border: 0;
    padding: 0;
  }
  .picker-dialog::backdrop {
    background: var(--color-scrim);
  }
  @media (max-width: 640px) {
    .picker-dialog {
      margin: auto auto 0 auto;
      width: 100vw;
      max-width: 100vw;
      border-radius: 1rem 1rem 0 0;
    }
  }
</style>
