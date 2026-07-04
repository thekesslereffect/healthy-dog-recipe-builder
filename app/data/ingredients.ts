import { CATEGORIES, type Category } from '../utils/constants';
import { FOODS } from './foods.generated';
import type {
  FoodIngredient,
  Ingredient,
  SupplementIngredient,
} from './ingredientTypes';

export type {
  FoodIngredient,
  FoodNutrients,
  Ingredient,
  SupplementIngredient,
} from './ingredientTypes';

export type IngredientDatabase = Record<Category, FoodIngredient[]> & {
  supplements: SupplementIngredient[];
};

/** Hand-maintained supplements (not all map cleanly to a single FDC food). */
export const SUPPLEMENTS: SupplementIngredient[] = [
  {
    name: 'Rx Essentials',
    caloriesPer100g: 500,
    gramsPerPoundPerDay: 0.1,
    gramsPerScoop: 5,
    source: 'Manufacturer dosing',
  },
  {
    name: 'Hemp Seed Oil',
    caloriesPer100g: 886,
    gramsPerPoundPerDay: 0.15,
    fatGPer100g: 100,
    source: 'USDA FDC (hemp/flax oils ~886)',
  },
  {
    name: 'Turmeric',
    caloriesPer100g: 354,
    gramsPerPoundPerDay: 0.015,
    source: 'USDA FDC, ground',
  },
  {
    name: 'Ginger',
    caloriesPer100g: 335,
    gramsPerPoundPerDay: 0.015,
    source: 'USDA FDC, ground',
  },
  {
    name: 'Eggshell Powder (Calcium)',
    caloriesPer100g: 0,
    gramsPerPoundPerDay: 0,
    gramsPerScoop: 1.9,
    calciumMgPerGram: 380,
    source: 'Vet nutrition sources (~38% Ca)',
  },
];

function foodsByCategory(): Record<Category, FoodIngredient[]> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, [] as FoodIngredient[]])) as Record<
    Category,
    FoodIngredient[]
  >;
  for (const food of FOODS) {
    out[food.category].push(food);
  }
  for (const category of CATEGORIES) {
    out[category].sort((a, b) => a.name.localeCompare(b.name));
  }
  return out;
}

/** Full catalog: FDC-synced foods + hand-maintained supplements. */
export const ingredients: IngredientDatabase = {
  ...foodsByCategory(),
  supplements: SUPPLEMENTS,
};

/** Look up a food ingredient by display name. */
export function findFoodByName(name: string): FoodIngredient | undefined {
  return FOODS.find((f) => f.name === name);
}

// All selectable food ingredient names (excludes supplements), sorted, for the
// per-dog allergy typeahead.
export const ALL_FOOD_NAMES: string[] = FOODS.map((f) => f.name).sort((a, b) =>
  a.localeCompare(b),
);
