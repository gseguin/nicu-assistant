<script lang="ts">
  import { slide } from 'svelte/transition';

  let idCounter = 0;

  let {
    value = $bindable(),
    label = '',
    placeholder = '',
    suffix = '',
    error = '',
    min = 0,
    max = 1000,
    step = 0.1,
    id = `numeric-input-${++idCounter}`
  } = $props<{
    value: number | null;
    label?: string;
    placeholder?: string;
    suffix?: string;
    error?: string;
    min?: number;
    max?: number;
    step?: number;
    id?: string;
  }>();

  let isFocused = $state(false);

  // Handle manual input parsing
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const val = target.value;

    if (val === '') {
      value = null;
      return;
    }

    const parsed = parseFloat(val);
    if (!isNaN(parsed) && isFinite(parsed)) {
      value = parsed;
    }
  }

  // Clamp to min/max on blur so out-of-range values are corrected
  function handleBlur(e: FocusEvent) {
    isFocused = false;
    if (value === null) return;
    if (value < min) {
      value = min;
      (e.target as HTMLInputElement).value = String(min);
    } else if (value > max) {
      value = max;
      (e.target as HTMLInputElement).value = String(max);
    }
  }

  // Svelte action to handle non-passive wheel events
  function setupWheel(node: HTMLInputElement) {
    const onWheel = (e: WheelEvent) => {
      if (!isFocused) return;

      // Must be non-passive to prevent scroll
      e.preventDefault();

      const direction = e.deltaY > 0 ? -1 : 1;
      const current = value ?? 0;
      // Use toFixed to avoid floating point jitter, then parse back to number
      const next = parseFloat((current + direction * step).toFixed(1));

      if (next >= min && next <= max) {
        value = next;
      }
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return {
      destroy() {
        node.removeEventListener('wheel', onWheel);
      }
    };
  }
</script>

<div class="space-y-1.5 w-full">
  {#if label}
    <label for={id} class="block text-ui font-semibold text-[var(--color-text-secondary)] ml-1">
      {label}
    </label>
  {/if}

  <div class="relative group">
    <input
      {id}
      use:setupWheel
      type="number"
      inputmode="decimal"
      value={value === null ? '' : value}
      oninput={handleInput}
      onfocus={() => (isFocused = true)}
      onblur={handleBlur}
      {placeholder}
      {min}
      {max}
      {step}
      class="num w-full pl-4 py-3 bg-[var(--color-surface-card)] border rounded-xl shadow-sm transition-all outline-none text-[var(--color-text-primary)] font-medium text-base {error ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]'} {isFocused ? 'scale-[1.01] border-[var(--color-accent)]' : ''} {suffix.length > 3 ? 'pr-20' : (suffix ? 'pr-12' : 'pr-4')}"
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : (suffix ? `${id}-suffix` : undefined)}
      aria-label={label || placeholder}
    />

    {#if suffix}
      <span
        id="{id}-suffix"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-semibold text-2xs uppercase tracking-wider pointer-events-none select-none"
      >
        {suffix}
      </span>
    {/if}
  </div>

  {#if error}
    <p
      id="{id}-error"
      class="text-xs text-[var(--color-error)] ml-1"
      transition:slide={{ duration: 150 }}
    >
      {error}
    </p>
  {/if}
</div>

<style>
  /* Hide standard HTML5 number arrows for cleaner clinical UI */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
</style>
