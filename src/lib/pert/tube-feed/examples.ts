export type TubeFeedExample = {
  label: string;
  sourceFormula: string;
  volumePerDayMl: number;
  fatGramsPerLiter: number;
  fatGrams: number;
  lipaseUnitsPerGram: number;
  brand: string;
  strength: number;
  expectedTotalLipase: number;
  expectedCapsules: number;
};

export const TUBE_FEED_EXAMPLES: TubeFeedExample[] = [
  {
    label: 'Compleat Organic Blends 1500mL + Pertzye 24000',
    sourceFormula: 'Compleat Organic Blends',
    volumePerDayMl: 1500,
    fatGramsPerLiter: 48,
    fatGrams: 72,
    lipaseUnitsPerGram: 1000,
    brand: 'Pertzye',
    strength: 24000,
    expectedTotalLipase: 72000,
    expectedCapsules: 3
  },
  {
    label: 'Fibersource HN 500mL + Pancreaze 2600',
    sourceFormula: 'Fibersource HN',
    volumePerDayMl: 500,
    fatGramsPerLiter: 42,
    fatGrams: 21,
    lipaseUnitsPerGram: 1000,
    brand: 'Pancreaze',
    strength: 2600,
    expectedTotalLipase: 21000,
    expectedCapsules: 8
  },
  {
    label: 'Kate Farms 1.0 1000mL + Viokace 10440',
    sourceFormula: 'Kate Farms 1.0',
    volumePerDayMl: 1000,
    fatGramsPerLiter: 38,
    fatGrams: 38,
    lipaseUnitsPerGram: 1000,
    brand: 'Viokace',
    strength: 10440,
    expectedTotalLipase: 38000,
    expectedCapsules: 4
  },
  {
    label: 'Fibersource HN 500mL + Pertzye 4000',
    sourceFormula: 'Fibersource HN',
    volumePerDayMl: 500,
    fatGramsPerLiter: 42,
    fatGrams: 21,
    lipaseUnitsPerGram: 1000,
    brand: 'Pertzye',
    strength: 4000,
    expectedTotalLipase: 21000,
    expectedCapsules: 5
  }
];
