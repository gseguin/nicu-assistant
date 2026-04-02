// src/lib/shell/registry.ts
import type { Component } from 'svelte';
import { Syringe, Milk } from '@lucide/svelte';

export interface CalculatorEntry {
  id: string;          // Route segment — must match src/routes/{id}/
  label: string;       // Tab label text — always visible (NAV-01/NAV-02)
  href: string;        // SvelteKit href
  icon: Component;     // Lucide icon component
  description: string; // Screen reader accessible description
}

export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  {
    id: 'morphine-wean',
    label: 'Morphine Wean',
    href: '/morphine-wean',
    icon: Syringe,
    description: 'Morphine weaning schedule calculator',
  },
  {
    id: 'formula',
    label: 'Formula',
    href: '/formula',
    icon: Milk,
    description: 'Infant formula recipe calculator',
  },
] as const;
