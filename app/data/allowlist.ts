import type { Category } from '../utils/constants';
import allowlistJson from './allowlist.json';

/** Dog-safe food catalog entry. Only these FDC IDs are ever synced. */
export interface AllowlistEntry {
  name: string;
  category: Category;
  /** USDA FoodData Central food id (prefer SR Legacy / Foundation). */
  fdcId: number;
  /** How the food is weighed in recipes. */
  basis: 'raw' | 'cooked' | 'drained' | 'oil';
  /**
   * Used when the FDC sync script cannot reach USDA (local dev / CI).
   * Replaced by `npm run sync:fdc` output in `foods.generated.ts`.
   */
  fallback: {
    caloriesPer100g: number;
    proteinGPer100g: number;
    fatGPer100g: number;
    calciumMgPer100g: number;
    phosphorusMgPer100g: number;
  };
}

/**
 * Curated dog-safe foods. Edit `allowlist.json`, then run `npm run sync:fdc`
 * to refresh nutrients from USDA FoodData Central.
 */
export const FOOD_ALLOWLIST = allowlistJson as AllowlistEntry[];
