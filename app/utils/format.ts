import { GRAMS_PER_LB, LB_PER_KG } from './constants';

export type WeightUnit = 'lb' | 'kg';

/** Convert an internal weight in pounds to the chosen display unit. */
export function toDisplayWeight(lbs: number, unit: WeightUnit): number {
  const value = unit === 'kg' ? lbs / LB_PER_KG : lbs;
  return Math.round(value * 100) / 100;
}

/** Convert a value entered in the chosen display unit back to pounds. */
export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value * LB_PER_KG : value;
}

/** The secondary bulk unit shown next to grams in the shopping list. */
export function gramsToBulk(grams: number, unit: WeightUnit): number {
  const value = unit === 'kg' ? grams / 1000 : grams / GRAMS_PER_LB;
  return Math.round(value * 1000) / 1000;
}

export function bulkUnitLabel(unit: WeightUnit): string {
  return unit === 'kg' ? 'kg' : 'lbs';
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'kg' ? 'kg' : 'lbs';
}
