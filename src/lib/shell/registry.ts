// src/lib/shell/registry.ts
import type { Component } from 'svelte';
import { FlaskConical, Milk } from '@lucide/svelte';

export interface CalculatorEntry {
  id: string;          // Route segment — must match src/routes/{id}/
  label: string;       // Tab label text — always visible (NAV-01/NAV-02)
  href: string;        // SvelteKit href
  icon: Component;     // Lucide icon component — D-07: Impeccable confirms final icons
  description: string; // Screen reader accessible description
}

export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  {
    id: 'pert',
    label: 'PERT',
    href: '/pert',
    icon: FlaskConical,
    description: 'PERT enzyme dosing calculator',
  },
  {
    id: 'formula',
    label: 'Formula',
    href: '/formula',
    icon: Milk,
    description: 'Infant formula recipe calculator',
  },
] as const;
