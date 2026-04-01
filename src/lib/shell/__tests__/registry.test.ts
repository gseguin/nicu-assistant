// src/lib/shell/__tests__/registry.test.ts
// Tests for the calculator plugin registry.

import { describe, it, expect } from 'vitest';
import { CALCULATOR_REGISTRY, type CalculatorEntry } from '$lib/shell/registry';

describe('CALCULATOR_REGISTRY', () => {
  it('has exactly 2 calculator entries', () => {
    expect(CALCULATOR_REGISTRY).toHaveLength(2);
  });

  it('includes PERT calculator as first entry', () => {
    expect(CALCULATOR_REGISTRY[0].id).toBe('pert');
    expect(CALCULATOR_REGISTRY[0].label).toBe('PERT');
    expect(CALCULATOR_REGISTRY[0].href).toBe('/pert');
  });

  it('includes Formula calculator as second entry', () => {
    expect(CALCULATOR_REGISTRY[1].id).toBe('formula');
    expect(CALCULATOR_REGISTRY[1].label).toBe('Formula');
    expect(CALCULATOR_REGISTRY[1].href).toBe('/formula');
  });

  it('all entries have required fields', () => {
    for (const entry of CALCULATOR_REGISTRY) {
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.href).toBe('string');
      expect(entry.href.startsWith('/')).toBe(true);
      expect(entry.icon).toBeDefined();
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('all entry IDs are unique', () => {
    const ids = CALCULATOR_REGISTRY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all entry hrefs are unique', () => {
    const hrefs = CALCULATOR_REGISTRY.map(e => e.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('hrefs match /{id} pattern', () => {
    for (const entry of CALCULATOR_REGISTRY) {
      expect(entry.href).toBe(`/${entry.id}`);
    }
  });
});
