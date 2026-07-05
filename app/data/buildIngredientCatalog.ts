import { CATEGORIES, type Category } from '../utils/constants';
import type { FoodIngredient, IngredientDatabase, SupplementIngredient } from './ingredientTypes';

/** Build the full ingredient catalog from pre-synced foods and supplement definitions. */
export function buildIngredientCatalog(
  foods: FoodIngredient[],
  supplements: SupplementIngredient[],
): IngredientDatabase {
  const byCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, [] as FoodIngredient[]]),
  ) as Record<Category, FoodIngredient[]>;
  for (const food of foods) {
    byCategory[food.category].push(food);
  }
  for (const category of CATEGORIES) {
    byCategory[category].sort((a, b) => a.name.localeCompare(b.name));
  }
  return {
    ...byCategory,
    supplements,
  };
}
