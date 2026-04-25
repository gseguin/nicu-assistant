// src/lib/shell/registry.ts
import type { Component } from 'svelte';
import { Syringe, Milk, Droplet, Baby, Ruler, Pill } from '@lucide/svelte';

export interface CalculatorEntry {
  id: string; // Route segment — must match src/routes/{id}/
  label: string; // Tab label text — always visible (NAV-01/NAV-02)
  href: string; // SvelteKit href
  icon: Component; // Lucide icon component
  description: string; // Screen reader accessible description
  identityClass:
    | 'identity-morphine'
    | 'identity-formula'
    | 'identity-gir'
    | 'identity-feeds'
    | 'identity-uac'
    | 'identity-pert';
}

export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  {
    id: 'feeds',
    label: 'Feeds',
    href: '/feeds',
    icon: Baby,
    description: 'Feed advance calculator',
    identityClass: 'identity-feeds'
  },
  {
    id: 'formula',
    label: 'Formula',
    href: '/formula',
    icon: Milk,
    description: 'Infant formula fortification calculator',
    identityClass: 'identity-formula'
  },
  {
    id: 'gir',
    label: 'GIR',
    href: '/gir',
    icon: Droplet,
    description: 'Glucose infusion rate calculator',
    identityClass: 'identity-gir'
  },
  {
    id: 'morphine-wean',
    label: 'Morphine',
    href: '/morphine-wean',
    icon: Syringe,
    description: 'Morphine weaning schedule calculator',
    identityClass: 'identity-morphine'
  },
  {
    id: 'pert',
    label: 'PERT',
    href: '/pert',
    icon: Pill,
    description: 'Pediatric EPI PERT calculator',
    identityClass: 'identity-pert'
  },
  {
    id: 'uac-uvc',
    label: 'UAC/UVC',
    href: '/uac-uvc',
    icon: Ruler,
    description: 'UAC/UVC umbilical catheter depth calculator',
    identityClass: 'identity-uac'
  }
] as const;
