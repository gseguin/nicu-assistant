// src/lib/shell/calculator-module.ts
//
// Locked design from quick-task 260429-mwe (route shell collapse, commit 5/5
// of the architectural deepening initiative).
//
// Two interfaces, type-only file (no runtime code):
//
// - CalculatorEntry — metadata-only view consumed by the registry, navigation,
//   and routing surfaces. Same shape the previous registry exposed; widened
//   identityClass to a template literal type so future calculators don't
//   require a type edit in two places.
//
// - CalculatorModule<TState> — full module: metadata + state singleton +
//   Calculator/Inputs components + recap derivation. Each slice exports one
//   from src/lib/{slice}/calculator.ts. Generic in state shape so each slice's
//   recap function is fully typed against its slice's state.
//
// Structural-subtype relationship (CalculatorModule<T> extends CalculatorEntry)
// makes assignment of modules to readonly CalculatorEntry[] automatic.

import type { Component } from 'svelte';
import type { RecapItem } from '$lib/shared/components/InputsRecap.svelte';
import type { CalculatorStore } from './calculator-store.svelte.js';

// Metadata-only view. What the registry, nav, and routing care about.
// No generic — fully typed, used as `readonly CalculatorEntry[]`.
// THIS REPLACES the existing CalculatorEntry interface in registry.ts.
export interface CalculatorEntry {
  id: string;
  label: string;
  href: string;
  icon: Component;
  description: string;
  identityClass: `identity-${string}`;
}

// Full module — what a route hands to <CalculatorPage>.
// Generic in state shape; never collected into a heterogeneous array.
// Each slice exports one of these from `src/lib/{slice}/calculator.ts`.
export interface CalculatorModule<TState> extends CalculatorEntry {
  title: string; // e.g. "Pediatric EPI PERT Calculator"
  subtitle?: string; // e.g. "Capsule dosing · oral & tube-feed modes"
  inputsLabel: string; // e.g. "PERT inputs" — drawer title + aria-label
  state: CalculatorStore<TState>;
  Calculator: Component;
  Inputs: Component;
  getRecapItems: (state: TState) => RecapItem[];
}
