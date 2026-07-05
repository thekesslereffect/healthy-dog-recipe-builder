import { buildIngredientCatalog } from '../data/buildIngredientCatalog';
import { FOODS } from '../data/foods.generated';
import type { IngredientDatabase } from '../data/ingredientTypes';
import { SUPPLEMENTS } from '../data/supplements';

let cached: IngredientDatabase | null = null;

/** Server-only catalog from pre-synced USDA data (no live FDC calls). */
export function getIngredientCatalog(): IngredientDatabase {
  if (!cached) {
    cached = buildIngredientCatalog(FOODS, SUPPLEMENTS);
  }
  return cached;
}
