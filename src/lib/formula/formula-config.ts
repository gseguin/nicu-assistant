import rawFormulaConfig from './formula-config.json';

// ============================================================
// TypeScript Interfaces
// ============================================================

export interface BrandConfig {
  /** Stable kebab-case identifier for use as UI key (e.g., "abbott-elecare-jr") */
  id: string;
  /** Exact brand name as it appears in Displacement.xlsx */
  brand: string;
  /** Manufacturer name; one of the four allowed values */
  manufacturer: 'Abbott' | 'Nutricia' | 'Mead Johnson' | 'Nestlé';
  /** Powder displacement volume in mL per gram (>= 0) */
  displacementMlPerG: number;
  /**
   * Calorie density in kcal per gram (> 0).
   * NOTE: Alfamino has null kcalPerG in Displacement.xlsx (source data gap).
   * Brands with null kcalPerG cannot be used for calorie-based recipe calculation.
   */
  kcalPerG: number | null;
  /** Can/container size description (e.g., "14.1 oz (400 g)") */
  canSize: string;
  /**
   * Grams per scoop for powder brands (> 0).
   * Null for packet-based brands (Tolerex, Vivonex) and weight-only brands (Ketocal 3:1, Ketocal 4:1).
   */
  gPerScoop: number | null;
  /** Grams per tablespoon (optional, null if not available) */
  gPerTbsp: number | null;
  /** Grams per teaspoon (optional, null if not available) */
  gPerTsp: number | null;
  /**
   * Human-readable packet label for packet-based brands (e.g., "1 pkt = 80 g").
   * Present only for Tolerex, Vivonex Pediatric, and Vivonex Plus.
   * Null for all other brands.
   */
  packetLabel: string | null;
}

export interface Disclaimer {
  headline: string;
  body: string;
}

export interface ValidationMessages {
  invalidDisplacement: string;
  invalidCalories: string;
  invalidScoop: string;
}

export interface FormulaConfig {
  brands: BrandConfig[];
  disclaimer: Disclaimer;
  validationMessages: ValidationMessages;
}

// ============================================================
// Validation Helpers
// ============================================================

const ALLOWED_MANUFACTURERS: ReadonlySet<string> = new Set([
  'Abbott',
  'Nutricia',
  'Mead Johnson',
  'Nestlé'
]);

/** Matches kebab-case: lowercase letters, digits, hyphens only */
const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`formula config: ${path} must be a non-empty string`);
  }
}

function assertKebabCase(value: unknown, path: string): asserts value is string {
  assertString(value, path);
  if (!KEBAB_CASE_REGEX.test(value as string)) {
    throw new Error(
      `formula config: ${path} must be kebab-case (lowercase letters, digits, hyphens only), got "${value}"`
    );
  }
}

function assertPositiveNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) {
    throw new Error(
      `formula config: ${path} must be a finite number > 0, got ${JSON.stringify(value)}`
    );
  }
}

function assertNonNegativeNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number' || !isFinite(value) || value < 0) {
    throw new Error(
      `formula config: ${path} must be a finite number >= 0, got ${JSON.stringify(value)}`
    );
  }
}

function assertNullablePositiveNumber(
  value: unknown,
  path: string
): asserts value is number | null {
  if (value !== null) {
    assertPositiveNumber(value, path);
  }
}

function assertNullableString(value: unknown, path: string): asserts value is string | null {
  if (value !== null) {
    assertString(value, path);
  }
}

// ============================================================
// Config Parser (fail-fast on startup)
// ============================================================

/**
 * Parses and validates the raw formula config JSON.
 * Throws a descriptive Error immediately if any required field is missing or malformed.
 * Called once at module load time to prevent silent data corruption.
 *
 * Validation rules (per plan 01-01):
 * - id: non-empty kebab-case string (for stable UI keys)
 * - brand: non-empty string
 * - manufacturer: one of 4 allowed values
 * - displacementMlPerG: finite number >= 0 (review feedback: allow 0 edge case)
 * - kcalPerG: finite number > 0 OR null (Alfamino has null in source data — data gap)
 * - canSize: non-empty string
 * - gPerScoop: finite number > 0, null for packet brands and weight-only brands (Ketocal)
 * - gPerTbsp / gPerTsp / packetLabel: nullable
 * - At least one of gPerScoop or packetLabel must be non-null for dispensing calculation;
 *   exception: Ketocal 3:1 and 4:1 are weight-dispensed with no scoop or packet label.
 */
export function parseFormulaConfig(raw: unknown): FormulaConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('formula config: root value must be an object');
  }

  const config = raw as Record<string, unknown>;

  // --- Validate brands array ---
  if (!Array.isArray(config.brands) || config.brands.length === 0) {
    throw new Error('formula config: brands must be a non-empty array');
  }

  const seenIds = new Set<string>();

  const brands: BrandConfig[] = config.brands.map((entry: unknown, index: number) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`formula config: brands[${index}] must be an object`);
    }

    const b = entry as Record<string, unknown>;
    const path = `brands[${index}]`;

    // id — kebab-case, unique
    assertKebabCase(b.id, `${path}.id`);
    if (seenIds.has(b.id as string)) {
      throw new Error(`formula config: ${path}.id "${b.id}" is not unique`);
    }
    seenIds.add(b.id as string);

    // brand — non-empty string
    assertString(b.brand, `${path}.brand`);

    // manufacturer — must be one of 4 allowed values
    assertString(b.manufacturer, `${path}.manufacturer`);
    if (!ALLOWED_MANUFACTURERS.has(b.manufacturer as string)) {
      throw new Error(
        `formula config: ${path}.manufacturer must be one of Abbott, Nutricia, Mead Johnson, Nestlé — got "${b.manufacturer}"`
      );
    }

    // displacementMlPerG — finite number >= 0 (allow zero per review feedback)
    assertNonNegativeNumber(b.displacementMlPerG, `${path}.displacementMlPerG`);

    // kcalPerG — finite number > 0, OR null (data gap: Alfamino has null in source spreadsheet)
    assertNullablePositiveNumber(b.kcalPerG, `${path}.kcalPerG`);

    // canSize — non-empty string
    assertString(b.canSize, `${path}.canSize`);

    // gPerScoop — finite number > 0, or null (packet brands and weight-only brands like Ketocal)
    assertNullablePositiveNumber(b.gPerScoop, `${path}.gPerScoop`);

    // gPerTbsp — nullable positive number
    assertNullablePositiveNumber(b.gPerTbsp, `${path}.gPerTbsp`);

    // gPerTsp — nullable positive number
    assertNullablePositiveNumber(b.gPerTsp, `${path}.gPerTsp`);

    // packetLabel — nullable string
    assertNullableString(b.packetLabel, `${path}.packetLabel`);

    return {
      id: b.id as string,
      brand: b.brand as string,
      manufacturer: b.manufacturer as BrandConfig['manufacturer'],
      displacementMlPerG: b.displacementMlPerG as number,
      kcalPerG: b.kcalPerG as number | null,
      canSize: b.canSize as string,
      gPerScoop: b.gPerScoop as number | null,
      gPerTbsp: b.gPerTbsp as number | null,
      gPerTsp: b.gPerTsp as number | null,
      packetLabel: b.packetLabel as string | null
    };
  });

  // --- Validate disclaimer ---
  if (typeof config.disclaimer !== 'object' || config.disclaimer === null) {
    throw new Error('formula config: disclaimer must be an object');
  }

  const disc = config.disclaimer as Record<string, unknown>;
  assertString(disc.headline, 'disclaimer.headline');
  assertString(disc.body, 'disclaimer.body');

  // --- Validate validationMessages ---
  if (typeof config.validationMessages !== 'object' || config.validationMessages === null) {
    throw new Error('formula config: validationMessages must be an object');
  }

  const vm = config.validationMessages as Record<string, unknown>;
  assertString(vm.invalidDisplacement, 'validationMessages.invalidDisplacement');
  assertString(vm.invalidCalories, 'validationMessages.invalidCalories');
  assertString(vm.invalidScoop, 'validationMessages.invalidScoop');

  return {
    brands,
    disclaimer: {
      headline: disc.headline as string,
      body: disc.body as string
    },
    validationMessages: {
      invalidDisplacement: vm.invalidDisplacement as string,
      invalidCalories: vm.invalidCalories as string,
      invalidScoop: vm.invalidScoop as string
    }
  };
}

// ============================================================
// Singleton — evaluated at module load time.
// Any validation failure throws immediately, preventing silent
// data corruption from propagating into clinical calculations.
// ============================================================

export const FORMULA_CONFIG: FormulaConfig = parseFormulaConfig(rawFormulaConfig);

// ============================================================
// Convenience exports
// ============================================================

/** All brand configs (shorthand for FORMULA_CONFIG.brands) */
export const BRANDS: readonly BrandConfig[] = FORMULA_CONFIG.brands;

/**
 * Look up a brand by its exact brand name string.
 * Returns undefined if not found.
 */
export function getBrandByName(name: string): BrandConfig | undefined {
  return FORMULA_CONFIG.brands.find((b) => b.brand === name);
}

/**
 * Look up a brand by its stable kebab-case id.
 * Use this in UI components as the stable key for selectors and rendering.
 * Returns undefined if not found.
 */
export function getBrandById(id: string): BrandConfig | undefined {
  return FORMULA_CONFIG.brands.find((b) => b.id === id);
}

/**
 * Get all brands for a given manufacturer.
 * Returns an empty array if the manufacturer has no matching brands.
 */
export function getBrandsByManufacturer(manufacturer: string): BrandConfig[] {
  return FORMULA_CONFIG.brands.filter((b) => b.manufacturer === manufacturer);
}

/**
 * Check if a brand uses packet-based dispensing (Tolerex, Vivonex variants).
 */
export function isPacketBrand(brand: BrandConfig): boolean {
  return brand.packetLabel !== null;
}

/**
 * Check if a brand has calorie data available for recipe calculation.
 * Alfamino lacks kcalPerG in the source spreadsheet (data gap).
 */
export function hasCalorieData(brand: BrandConfig): boolean {
  return brand.kcalPerG !== null;
}
