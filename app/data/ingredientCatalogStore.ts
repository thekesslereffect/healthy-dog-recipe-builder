import { CATEGORIES } from '../utils/constants';
import type { FoodIngredient, IngredientDatabase } from './ingredientTypes';

let catalog: IngredientDatabase | null = null;
let foodsByName: Map<string, FoodIngredient> | null = null;

export function setIngredientCatalog(next: IngredientDatabase): void {
  catalog = next;
  foodsByName = new Map(
    CATEGORIES.flatMap((category) => next[category]).map((food) => [food.name, food]),
  );
}

export function tryGetIngredientCatalog(): IngredientDatabase | null {
  return catalog;
}

export function getIngredientCatalogOrThrow(): IngredientDatabase {
  if (!catalog) {
    throw new Error('Ingredient catalog not loaded — call loadIngredientCatalog() first.');
  }
  return catalog;
}

export function findFoodByName(name: string): FoodIngredient | undefined {
  return foodsByName?.get(name);
}

export function getAllFoodNames(): string[] {
  if (!foodsByName) return [];
  return [...foodsByName.keys()].sort((a, b) => a.localeCompare(b));
}
