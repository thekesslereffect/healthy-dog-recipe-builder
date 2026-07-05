import { findFoodByName } from '../data/ingredientCatalogStore';
import { getSupplementCatalogEntry } from '../data/supplements';
import type { MassUnit, WeightUnit } from './format';
import { defaultMassUnit } from './format';

export type ShoppingMassUnitMode = 'auto' | MassUnit;

const CANNED_PATTERN = /canned|drained/i;
const OIL_PATTERN = /\boil\b/i;
const SEED_PATTERN = /seed/i;
const DAIRY_PATTERN = /yogurt|cottage cheese/i;
const SMALL_ITEM_PATTERN = /shrimp|clam|oyster|mussel|anchov|parsley|kelp/i;

/** Typical store unit for an ingredient when shopping. */
export function suggestedShoppingMassUnit(name: string, weightUnit: WeightUnit): MassUnit {
  if (getSupplementCatalogEntry(name)) {
    return weightUnit === 'kg' ? 'g' : 'oz';
  }
  const food = findFoodByName(name);
  const lower = name.toLowerCase();
  if (food?.category === 'fats' || OIL_PATTERN.test(lower)) {
    return 'oz';
  }
  if (food?.basis === 'drained' || CANNED_PATTERN.test(lower)) {
    return 'oz';
  }
  if (DAIRY_PATTERN.test(lower)) {
    return 'oz';
  }
  if (SEED_PATTERN.test(lower) && !OIL_PATTERN.test(lower)) {
    return 'oz';
  }
  if (/egg/i.test(lower)) {
    return weightUnit === 'kg' ? 'g' : 'oz';
  }
  if (SMALL_ITEM_PATTERN.test(lower)) {
    return weightUnit === 'kg' ? 'g' : 'oz';
  }
  if (
    food?.category === 'protein' ||
    food?.category === 'organs' ||
    food?.category === 'veggies' ||
    food?.category === 'fruits' ||
    food?.category === 'carbs'
  ) {
    return defaultMassUnit(weightUnit);
  }
  return defaultMassUnit(weightUnit);
}

export function resolveShoppingMassUnit(
  ingredientName: string,
  mode: ShoppingMassUnitMode,
  overrides: Record<string, MassUnit>,
  weightUnit: WeightUnit,
): MassUnit {
  if (overrides[ingredientName]) return overrides[ingredientName];
  if (mode === 'auto') return suggestedShoppingMassUnit(ingredientName, weightUnit);
  return mode;
}
