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

// Per-item shopping-list mass units the user can switch between.
export type MassUnit = 'g' | 'oz' | 'lb' | 'kg';

export const MASS_UNITS: MassUnit[] = ['g', 'oz', 'lb', 'kg'];

const GRAMS_PER_OZ = 28.349523125;

/** Convert grams into the chosen mass unit, rounded for display. */
export function convertMass(grams: number, unit: MassUnit): number {
  switch (unit) {
    case 'oz':
      return Math.round((grams / GRAMS_PER_OZ) * 10) / 10;
    case 'lb':
      return Math.round((grams / GRAMS_PER_LB) * 100) / 100;
    case 'kg':
      return Math.round((grams / 1000) * 1000) / 1000;
    case 'g':
    default:
      return Math.round(grams);
  }
}

export function massUnitLabel(unit: MassUnit): string {
  return unit;
}

/** Sensible default display unit for the shopping list given the user's system. */
export function defaultMassUnit(unit: WeightUnit): MassUnit {
  return unit === 'kg' ? 'kg' : 'lb';
}
