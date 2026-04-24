import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import NumericInput from '../components/NumericInput.svelte';

// --- Disclaimer singleton tests ---
// The disclaimer module uses $state (Svelte rune), which requires the Svelte compiler.
// We import it as a .svelte.ts module — Vitest + svelte plugin handles compilation.

describe('disclaimer singleton', () => {
  const DISCLAIMER_KEY_V1 = 'nicu_assistant_disclaimer_v1';
  const DISCLAIMER_KEY_V2 = 'nicu_assistant_disclaimer_v2';

  beforeEach(() => {
    localStorage.clear();
  });

  // Scenario 1: Fresh install (no v1, no v2) → not acknowledged
  it('fresh install (no v1, no v2): init() leaves acknowledged false', async () => {
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.initialized).toBe(true);
    expect(disclaimer.acknowledged).toBe(false);
    // Banner gate: initialized && !acknowledged = true (show banner)
    expect(disclaimer.initialized && !disclaimer.acknowledged).toBe(true);
  });

  // Scenario 2: v1='true' present, v2 absent → acknowledged true; v2 written; v1 still present
  it('migration: v1="true" with v2 absent on init writes v2 and preserves v1', async () => {
    localStorage.setItem(DISCLAIMER_KEY_V1, 'true');
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.acknowledged).toBe(true);
    // v2 was written by migration
    expect(localStorage.getItem(DISCLAIMER_KEY_V2)).toBe('true');
    // v1 preserved (audit trail)
    expect(localStorage.getItem(DISCLAIMER_KEY_V1)).toBe('true');
  });

  // Scenario 3: v2='true' on init → acknowledged true; no v1 read needed
  it('steady state: v2="true" sets acknowledged true (banner hidden)', async () => {
    localStorage.setItem(DISCLAIMER_KEY_V2, 'true');
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.acknowledged).toBe(true);
    // Banner gate: initialized && !acknowledged = false (hide banner)
    expect(disclaimer.initialized && !disclaimer.acknowledged).toBe(false);
  });

  // Scenario 4: acknowledge() writes v2 only
  it('acknowledge() writes v2 (not v1) to localStorage', async () => {
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.acknowledged).toBe(false);

    disclaimer.acknowledge();
    expect(disclaimer.acknowledged).toBe(true);
    expect(localStorage.getItem(DISCLAIMER_KEY_V2)).toBe('true');
    // v1 is not written by acknowledge()
    expect(localStorage.getItem(DISCLAIMER_KEY_V1)).toBe(null);
  });

  // Scenario 5: localStorage.setItem throws (private mode) → in-memory acknowledge still works
  it('acknowledge() succeeds even when localStorage.setItem throws (private browsing)', async () => {
    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();

    // Simulate private browsing: setItem throws
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    disclaimer.acknowledge();
    expect(disclaimer.acknowledged).toBe(true);

    // Restore
    vi.restoreAllMocks();
  });

  // Scenario 6: v1='true' AND v2='true' both present → acknowledged true; idempotent (no extra writes)
  it('idempotent: both v1 and v2 set → acknowledged true, no extra writes', async () => {
    localStorage.setItem(DISCLAIMER_KEY_V1, 'true');
    localStorage.setItem(DISCLAIMER_KEY_V2, 'true');

    // Spy on setItem to confirm migration does NOT re-write v2
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { disclaimer } = await import('../disclaimer.svelte.js');
    disclaimer.init();
    expect(disclaimer.acknowledged).toBe(true);
    // No setItem call from init() since v2 was already 'true'
    expect(setItemSpy).not.toHaveBeenCalled();

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
      props: { value: null, label: 'Test Field', error: 'Value is required' }
    });
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Value is required')).toBeTruthy();
  });

  it('has no error paragraph and aria-invalid="false" when error prop is empty', () => {
    render(NumericInput, {
      props: { value: null, label: 'Test Field', error: '' }
    });
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Value is required')).toBeNull();
  });
});
