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
}

/**
 * Curated dog-safe foods. Edit `allowlist.json`, then run `npm run sync:fdc`
 * to refresh nutrients from USDA FoodData Central.
 */
export const FOOD_ALLOWLIST = allowlistJson as AllowlistEntry[];
