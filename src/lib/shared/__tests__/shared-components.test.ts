import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NumericInput from '../components/NumericInput.svelte';

// --- Disclaimer singleton tests ---
// The disclaimer module uses $state (Svelte rune), which requires the Svelte compiler.
// We import it as a .svelte.ts module — Vitest + svelte plugin handles compilation.

describe('disclaimer singleton', () => {
  const DISCLAIMER_KEY = 'nicu_assistant_disclaimer_v1';

  beforeEach(() => {
    localStorage.clear();
  });

  it('init() with localStorage "true" sets acknowledged to true', async () => {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
    // Dynamic import to get fresh module state per test via the Svelte compiler
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.acknowledged).toBe(true);
  });

  it('init() with no localStorage entry sets acknowledged to false', async () => {
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.acknowledged).toBe(false);
  });

  it('acknowledge() sets acknowledged to true and persists to localStorage', async () => {
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.acknowledged).toBe(false);

    disclaimer.acknowledge();
    expect(disclaimer.acknowledged).toBe(true);
    expect(localStorage.getItem(DISCLAIMER_KEY)).toBe('true');
  });

  it('acknowledge() succeeds even when localStorage.setItem throws (private browsing)', async () => {
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();

    // Simulate private browsing: setItem throws
    const originalSetItem = localStorage.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    disclaimer.acknowledge();
    expect(disclaimer.acknowledged).toBe(true);

    // Restore
    vi.restoreAllMocks();
  });
});

// --- NumericInput component tests ---

describe('NumericInput', () => {
  it('renders with inputmode="decimal" attribute', () => {
    render(NumericInput, { props: { value: null, label: 'Test Field' } });
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('inputmode', 'decimal');
  });

  it('shows error paragraph and aria-invalid="true" when error prop is set', () => {
    render(NumericInput, {
      props: { value: null, label: 'Test Field', error: 'Value is required' },
    });
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Value is required')).toBeTruthy();
  });

  it('has no error paragraph and aria-invalid="false" when error prop is empty', () => {
    render(NumericInput, {
      props: { value: null, label: 'Test Field', error: '' },
    });
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Value is required')).toBeNull();
  });
});
