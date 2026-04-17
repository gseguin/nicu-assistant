import type { WeanStep } from './types.js';
import config from './morphine-config.json';

/**
 * Calculate a linear weaning schedule.
 * Each step reduces by a fixed amount: initialDose * decreasePct.
 * Doses are clamped to 0 if reduction would make them negative.
 */
export function calculateLinearSchedule(
  weightKg: number,
  maxDoseMgKgDose: number,
  decreasePct: number
): WeanStep[] {
  const initialDose = weightKg * maxDoseMgKgDose;
  const reductionPerStep = initialDose * decreasePct;
  const steps: WeanStep[] = [];

  for (let i = 0; i < config.stepCount; i++) {
    const stepNum = i + 1;
    if (i === 0) {
      steps.push({
        step: stepNum,
        doseMg: initialDose,
        doseMgKgDose: initialDose / weightKg,
        reductionMg: 0
      });
    } else {
      const rawDose = steps[i - 1].doseMg - reductionPerStep;
      const doseMg = Math.max(0, rawDose);
      steps.push({
        step: stepNum,
        doseMg,
        doseMgKgDose: doseMg / weightKg,
        reductionMg: doseMg === 0 && rawDose < 0 ? steps[i - 1].doseMg : reductionPerStep
      });
    }
  }

  return steps;
}
