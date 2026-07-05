import type { Category } from '../utils/constants';

/** Extended micronutrients per 100g (from USDA FDC when available). */
export interface ExtendedNutrients {
  zincMgPer100g?: number;
  copperMgPer100g?: number;
  iodineMcgPer100g?: number;
  /** Vitamin D as IU per 100g (converted from FDC µg). */
  vitaminDIUPer100g?: number;
  vitaminEMgPer100g?: number;
  cholineMgPer100g?: number;
  epaMgPer100g?: number;
  dhaMgPer100g?: number;
}

/** Nutrients we track per 100g of edible food (from USDA FDC). */
export interface FoodNutrients extends ExtendedNutrients {
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

/** Dog-safe food ingredient enriched from USDA FDC via sync. */
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
  /** Per-scoop micronutrients (manufacturer label). */
  nutrientsPerScoop?: SupplementNutrientsPerScoop;
}

/** Micronutrients contributed per full scoop (manufacturer guaranteed analysis). */
export interface SupplementNutrientsPerScoop {
  vitaminDIU?: number;
  vitaminEMg?: number;
  zincMg?: number;
  copperMg?: number;
  manganeseMg?: number;
  iodineMcg?: number;
  seleniumMcg?: number;
  cholineMg?: number;
  epaMg?: number;
  dhaMg?: number;
  ironMg?: number;
  calciumMg?: number;
  phosphorusMg?: number;
}

/** Union used by the recipe calculator food pools. */
export type Ingredient = FoodIngredient | (SupplementIngredient & { category?: never; fdcId?: never });

export type IngredientDatabase = Record<Category, FoodIngredient[]> & {
  supplements: SupplementIngredient[];
};
