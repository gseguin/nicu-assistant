<script lang="ts">
  import { slide } from 'svelte/transition';

  // Reduced-motion preference read once at module-load.
  // Matches the pattern used by MorphineWeanCalculator's dock magnification.
  const PREFERS_REDUCED_MOTION =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

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

  // Derived out-of-range error: show inline guidance when value exceeds min/max
  let rangeError = $derived.by(() => {
    if (error) return ''; // external error takes precedence
    if (value === null) return '';
    if (value < min) return `Minimum is ${min}`;
    if (value > max) return `Maximum is ${max}`;
    return '';
  });

  let displayError = $derived(error || rangeError);

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

  // Enter key blurs to confirm value instead of submitting a form
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }

  // Show inline error on blur instead of silently clamping
  function handleBlur(_e: FocusEvent) {
    isFocused = false;
  }

  // Svelte action to handle non-passive wheel events
  function setupWheel(node: HTMLInputElement) {
    const onWheel = (e: WheelEvent) => {
      if (!isFocused) return;

      // Must be non-passive to prevent scroll
      e.preventDefault();

      const direction = e.deltaY > 0 ? -1 : 1;
      // Start from min when empty, so first scroll gives a valid value
      const current = value ?? (direction > 0 ? min - step : max + step);
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
      onkeydown={handleKeydown}
      {placeholder}
      {min}
      {max}
      {step}
      class="num w-full pl-4 py-3 bg-[var(--color-surface-card)] border rounded-xl shadow-sm transition-all outline-none text-[var(--color-text-primary)] font-medium text-base {displayError ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]'} {isFocused ? 'scale-[1.01] border-[var(--color-accent)]' : ''} {suffix.length > 3 ? 'pr-20' : (suffix ? 'pr-12' : 'pr-4')}"
      aria-invalid={!!displayError}
      aria-describedby={displayError ? `${id}-error` : (suffix ? `${id}-suffix` : undefined)}
      aria-label={label || placeholder}
    />

    {#if suffix}
      <span
        id="{id}-suffix"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-semibold text-xs pointer-events-none select-none"
      >
        {suffix}
      </span>
    {/if}
  </div>

  {#if displayError}
    <p
      id="{id}-error"
      class="text-xs text-[var(--color-error)] ml-1"
      transition:slide={{ duration: PREFERS_REDUCED_MOTION ? 0 : 150 }}
    >
      {displayError}
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
