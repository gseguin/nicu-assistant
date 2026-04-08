<script lang="ts" generics="T extends string">
  interface SegmentedOption {
    value: T;
    label: string;
  }

  let {
    label,
    value = $bindable(),
    options,
    ariaLabel,
    class: className = '',
  }: {
    label: string;
    value: T;
    options: SegmentedOption[];
    ariaLabel?: string;
    class?: string;
  } = $props();

  const uid = crypto.randomUUID();

  function activate(next: T) {
    value = next;
  }

  function handleKeydown(event: KeyboardEvent, current: T) {
    const idx = options.findIndex((o) => o.value === current);
    if (idx === -1) return;
    let nextIdx = idx;
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        nextIdx = (idx + 1) % options.length;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        nextIdx = (idx - 1 + options.length) % options.length;
        break;
      case 'Home':
        event.preventDefault();
        nextIdx = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIdx = options.length - 1;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        activate(current);
        return;
      default:
        return;
    }
    const nextValue = options[nextIdx].value;
    activate(nextValue);
    document.getElementById(`${uid}-tab-${nextValue}`)?.focus();
  }
</script>

<div
  class="flex p-1 bg-[var(--color-surface-alt)] rounded-2xl shadow-inner border border-[var(--color-border)] {className}"
  role="tablist"
  aria-label={ariaLabel ?? label}
>
  {#each options as option (option.value)}
    {@const active = value === option.value}
    <button
      type="button"
      role="tab"
      aria-selected={active}
      id="{uid}-tab-{option.value}"
      tabindex={active ? 0 : -1}
      class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold text-ui outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-identity)] {active ? 'bg-[var(--color-surface-card)] text-[var(--color-identity)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-identity)] hover:bg-[var(--color-surface)]'}"
      onclick={() => activate(option.value)}
      onkeydown={(e) => handleKeydown(e, option.value)}
    >
      <span>{option.label}</span>
    </button>
  {/each}
</div>
