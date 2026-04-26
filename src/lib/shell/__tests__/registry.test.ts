// src/lib/shell/__tests__/registry.test.ts
// Tests for the calculator plugin registry.

import { describe, it, expect } from 'vitest';
import { CALCULATOR_REGISTRY, type CalculatorEntry } from '$lib/shell/registry';

describe('CALCULATOR_REGISTRY', () => {
  it('contains the expected calculator ids', () => {
    const ids = CALCULATOR_REGISTRY.map((e) => e.id).sort();
    expect(ids).toEqual(['feeds', 'formula', 'gir', 'morphine-wean', 'pert', 'uac-uvc']);
  });

  it('is ordered alphabetically by id (D-19 invariant — guards future inserts)', () => {
    const ids = CALCULATOR_REGISTRY.map((e) => e.id);
    expect(ids).toEqual([...ids].slice().sort());
  });

  it('includes Feeds calculator as first entry', () => {
    expect(CALCULATOR_REGISTRY[0].id).toBe('feeds');
    expect(CALCULATOR_REGISTRY[0].label).toBe('Feeds');
    expect(CALCULATOR_REGISTRY[0].href).toBe('/feeds');
    expect(CALCULATOR_REGISTRY[0].identityClass).toBe('identity-feeds');
  });

  it('includes Formula calculator as second entry', () => {
    expect(CALCULATOR_REGISTRY[1].id).toBe('formula');
    expect(CALCULATOR_REGISTRY[1].label).toBe('Formula');
    expect(CALCULATOR_REGISTRY[1].href).toBe('/formula');
    expect(CALCULATOR_REGISTRY[1].identityClass).toBe('identity-formula');
  });

  it('includes GIR calculator as third entry', () => {
    expect(CALCULATOR_REGISTRY[2].id).toBe('gir');
    expect(CALCULATOR_REGISTRY[2].label).toBe('GIR');
    expect(CALCULATOR_REGISTRY[2].href).toBe('/gir');
    expect(CALCULATOR_REGISTRY[2].identityClass).toBe('identity-gir');
  });

  it('includes Morphine Wean calculator as fourth entry', () => {
    expect(CALCULATOR_REGISTRY[3].id).toBe('morphine-wean');
    expect(CALCULATOR_REGISTRY[3].label).toBe('Morphine');
    expect(CALCULATOR_REGISTRY[3].href).toBe('/morphine-wean');
    expect(CALCULATOR_REGISTRY[3].identityClass).toBe('identity-morphine');
  });

  it('includes PERT calculator as fifth entry', () => {
    expect(CALCULATOR_REGISTRY[4].id).toBe('pert');
    expect(CALCULATOR_REGISTRY[4].label).toBe('PERT');
    expect(CALCULATOR_REGISTRY[4].href).toBe('/pert');
    expect(CALCULATOR_REGISTRY[4].description).toBe('Pediatric EPI PERT calculator');
    expect(CALCULATOR_REGISTRY[4].identityClass).toBe('identity-pert');
  });

  it('includes UAC/UVC calculator as sixth entry', () => {
    expect(CALCULATOR_REGISTRY[5].id).toBe('uac-uvc');
    expect(CALCULATOR_REGISTRY[5].label).toBe('UAC/UVC');
    expect(CALCULATOR_REGISTRY[5].href).toBe('/uac-uvc');
    expect(CALCULATOR_REGISTRY[5].identityClass).toBe('identity-uac');
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
    const ids = CALCULATOR_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all entry hrefs are unique', () => {
    const hrefs = CALCULATOR_REGISTRY.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('hrefs match /{id} pattern', () => {
    for (const entry of CALCULATOR_REGISTRY) {
      expect(entry.href).toBe(`/${entry.id}`);
    }
  });
});
