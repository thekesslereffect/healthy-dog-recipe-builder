import { CATEGORIES } from '../utils/constants';
import { buildIngredientCatalog } from './buildIngredientCatalog';
import { FOODS } from './foods.generated';
import type { FoodIngredient, IngredientDatabase } from './ingredientTypes';
import { SUPPLEMENTS } from './supplements';

/** Built from `foods.generated.ts` (refresh via `npm run sync:fdc`). */
let catalog: IngredientDatabase = buildIngredientCatalog(FOODS, SUPPLEMENTS);
let foodsByName: Map<string, FoodIngredient> = buildFoodsByName(catalog);

function buildFoodsByName(next: IngredientDatabase): Map<string, FoodIngredient> {
  return new Map(CATEGORIES.flatMap((category) => next[category]).map((food) => [food.name, food]));
}

/** Override catalog (tests only). */
export function setIngredientCatalog(next: IngredientDatabase): void {
  catalog = next;
  foodsByName = buildFoodsByName(next);
}

export function tryGetIngredientCatalog(): IngredientDatabase {
  return catalog;
}

export function getIngredientCatalogOrThrow(): IngredientDatabase {
  return catalog;
}

export function findFoodByName(name: string): FoodIngredient | undefined {
  return foodsByName.get(name);
}

export function getAllFoodNames(): string[] {
  return [...foodsByName.keys()].sort((a, b) => a.localeCompare(b));
}
