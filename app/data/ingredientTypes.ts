import type { Category } from '../utils/constants';

/** Nutrients we track per 100g of edible food (from USDA FDC). */
export interface FoodNutrients {
  /** kcal per 100g. */
  caloriesPer100g: number;
  /** Protein grams per 100g. */
  proteinGPer100g: number;
  /** Total fat grams per 100g. */
  fatGPer100g: number;
  /** Calcium mg per 100g. */
  calciumMgPer100g: number;
  /** Phosphorus mg per 100g. */
  phosphorusMgPer100g: number;
}

/** Dog-safe food ingredient enriched from FDC (or allowlist fallback). */
export interface FoodIngredient extends FoodNutrients {
  name: string;
  category: Category;
  fdcId: number;
  basis: 'raw' | 'cooked' | 'drained' | 'oil';
  source?: string;
  /** Description returned by FDC for the linked id (audit trail). */
  fdcDescription?: string;
}

/** Supplement / non-FDC catalog item (dosed by body weight or calcium need). */
export interface SupplementIngredient {
  name: string;
  caloriesPer100g: number;
  gramsPerPoundPerDay?: number;
  gramsPerScoop?: number;
  calciumMgPerGram?: number;
  proteinGPer100g?: number;
  fatGPer100g?: number;
  calciumMgPer100g?: number;
  phosphorusMgPer100g?: number;
  source?: string;
}

/** Union used by the recipe calculator food pools. */
export type Ingredient = FoodIngredient | (SupplementIngredient & { category?: never; fdcId?: never });
