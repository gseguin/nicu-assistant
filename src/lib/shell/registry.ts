// src/lib/shell/registry.ts
//
// Registry exposes only the CalculatorEntry view of each module. Per-route
// renders pull the full CalculatorModule<TState> directly from
// src/lib/{slice}/calculator.ts; the registry is for nav, routing, and
// favorites only.
//
// The structural-subtype relationship `CalculatorModule<T> extends
// CalculatorEntry` (declared in src/lib/shell/calculator-module.ts) makes
// assignment to `readonly CalculatorEntry[]` automatic and type-safe.

import type { CalculatorEntry } from './calculator-module.js';
import { feedsModule } from '$lib/feeds/calculator.js';
import { fortificationModule } from '$lib/fortification/calculator.js';
import { girModule } from '$lib/gir/calculator.js';
import { morphineModule } from '$lib/morphine/calculator.js';
import { pertModule } from '$lib/pert/calculator.js';
import { uacUvcModule } from '$lib/uac-uvc/calculator.js';

// Same alphabetical-by-id order as before — D-19 invariant guarded by
// src/lib/shell/__tests__/registry.test.ts.
export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  feedsModule,
  fortificationModule,
  girModule,
  morphineModule,
  pertModule,
  uacUvcModule
];

// Re-export CalculatorEntry from its new home so existing import paths keep
// working (e.g. src/lib/shell/__tests__/registry.test.ts imports it from
// '$lib/shell/registry').
export type { CalculatorEntry } from './calculator-module.js';
