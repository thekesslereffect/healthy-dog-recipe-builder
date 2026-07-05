import {
  CATEGORIES,
  GRAMS_PER_LB,
  LB_PER_KG,
  NRC_ADULT_PER_1000_KCAL,
  type Category,
} from './constants';
import {
  findFoodByName,
  getIngredientCatalogOrThrow,
  type Ingredient,
  type SupplementOptions,
  DEFAULT_SUPPLEMENT_OPTIONS,
  buildWeightDosedSupplements,
  doseEggshellRow,
  supplementCalciumMg,
  normalizeSupplementOptions,
} from '../data/ingredients';

export type { SupplementOptions } from '../data/ingredients';
export { DEFAULT_SUPPLEMENT_OPTIONS } from '../data/ingredients';

export type { Ingredient };

export interface Dog {
  /** Stable identity for UI state (avatars, portion prefs). */
  id?: string;
  name: string;
  /** Body weight in pounds (internal unit). */
  weight: number;
  activityMultiplier: number;
  /** Ingredient names this dog is allergic to / should avoid. */
  allergies?: string[];
  /** Optional photo as a data URL (resized client-side). */
  avatar?: string;
  MER?: number;
}

export type IngredientPercentages = Record<Category, number>;
export type IngredientCounts = Record<Category, number>;

export interface RecipeIngredient {
  name: string;
  grams: number;
  calories: number;
  gramsPerScoop?: number | null;
  /** Added by Balance % to improve nutrition — original picks are unchanged. */
  additional?: boolean;
}

export type Recipe = {
  ingredients: Record<Category, RecipeIngredient[]> & {
    supplements: RecipeIngredient[];
  };
  totalCalories: number;
};

export interface ShoppingListItem {
  grams: number;
  pounds?: number;
}

export interface ShoppingList {
  [ingredientName: string]: ShoppingListItem;
}

export interface RecipeOptions {
  /** Ingredient names to exclude from selection (e.g. allergies). */
  excluded?: string[];
  /** Ingredient names to force-keep per category (locked on reroll). */
  locked?: Partial<Record<Category, string[]>>;
  /** Which optional supplements to include in the recipe. */
  supplementOptions?: SupplementOptions;
  /** Injectable RNG for reproducible/testable results. Defaults to Math.random. */
  random?: () => number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function emptyRecipe(): Recipe {
  return {
    ingredients: {
      protein: [],
      organs: [],
      fruits: [],
      veggies: [],
      carbs: [],
      fats: [],
      supplements: [],
    },
    totalCalories: 0,
  };
}

export function calculateDailyCalories(dog: Dog): number {
  const weightKg = dog.weight / LB_PER_KG;
  const RER = 70 * Math.pow(weightKg, 0.75);
  return RER * dog.activityMultiplier;
}

export function getTotalMER(dogs: Dog[]): number {
  return dogs.reduce((total, dog) => total + (dog.MER || 0), 0);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function selectIngredients(
  pool: Ingredient[],
  count: number,
  lockedNames: string[],
  excluded: string[],
  random: () => number,
): Ingredient[] {
  if (count <= 0) return [];
  const available = pool.filter((i) => !excluded.includes(i.name));
  const locked = available.filter((i) => lockedNames.includes(i.name));
  if (locked.length >= count) return locked.slice(0, count);
  const rest = available.filter((i) => !lockedNames.includes(i.name));
  const picks = shuffle(rest, random).slice(0, count - locked.length);
  return [...locked, ...picks];
}

export function createRecipe(
  totalMER: number,
  dogs: Dog[],
  ingredientPercentages: IngredientPercentages,
  ingredientCounts: IngredientCounts,
  options: RecipeOptions = {},
): Recipe {
  const {
    excluded = [],
    locked = {},
    supplementOptions = DEFAULT_SUPPLEMENT_OPTIONS,
    random = Math.random,
  } = options;
  const supplements = normalizeSupplementOptions(supplementOptions);
  const recipe = emptyRecipe();
  const totalDogWeight = dogs.reduce((sum, dog) => sum + dog.weight, 0);
  let totalSupplementCalories = 0;
  const weightDosed = buildWeightDosedSupplements(totalDogWeight, supplements);
  for (const row of weightDosed) {
    recipe.ingredients.supplements.push(row);
    totalSupplementCalories += row.calories;
  }
  const extraCalciumMg = supplementCalciumMg(totalDogWeight, supplements);
  const remainingMER = totalMER - totalSupplementCalories;
  let mainIngredientsCalories = 0;
  for (const category of CATEGORIES) {
    const percentage = ingredientPercentages[category] ?? 0;
    const count = ingredientCounts[category] ?? 0;
    const calorieTarget = remainingMER * percentage;
    if (calorieTarget <= 0 || percentage === 0 || count === 0) {
      recipe.ingredients[category] = [];
      continue;
    }
    const selected = selectIngredients(
      getIngredientCatalogOrThrow()[category],
      count,
      locked[category] ?? [],
      excluded,
      random,
    );
    if (selected.length === 0) {
      recipe.ingredients[category] = [];
      continue;
    }
    const caloriesPerIngredient = calorieTarget / selected.length;
    for (const ingredient of selected) {
      const caloriesPer100g = ingredient.caloriesPer100g || 0;
      if (caloriesPer100g <= 0) continue;
      const gramsNeeded = (caloriesPerIngredient / caloriesPer100g) * 100;
      const actualCalories = round2((gramsNeeded * caloriesPer100g) / 100);
      recipe.ingredients[category].push({
        name: ingredient.name,
        grams: round2(gramsNeeded),
        calories: actualCalories,
      });
      mainIngredientsCalories += actualCalories;
    }
  }
  let foodCalciumMg = 0;
  let foodPhosphorusMg = 0;
  for (const category of CATEGORIES) {
    for (const row of recipe.ingredients[category]) {
      const food = findFoodByName(row.name);
      if (!food) continue;
      foodCalciumMg += (food.calciumMgPer100g * row.grams) / 100;
      foodPhosphorusMg += (food.phosphorusMgPer100g * row.grams) / 100;
    }
  }
  const eggshellRow = doseEggshellRow(
    totalMER,
    foodCalciumMg,
    foodPhosphorusMg,
    extraCalciumMg,
    supplements,
  );
  if (eggshellRow) {
    recipe.ingredients.supplements.push(eggshellRow);
    totalSupplementCalories += eggshellRow.calories;
  }
  recipe.totalCalories = round2(mainIngredientsCalories + totalSupplementCalories);
  return recipe;
}

export function calculateShoppingList(recipe: Recipe, numberOfDays: number): ShoppingList {
  const shoppingList: ShoppingList = {};
  for (const category of CATEGORIES) {
    for (const ingredient of recipe.ingredients[category]) {
      const totalGrams = ingredient.grams * numberOfDays;
      const totalPounds = Math.round((totalGrams / GRAMS_PER_LB) * 1000) / 1000;
      if (shoppingList[ingredient.name]) {
        shoppingList[ingredient.name].grams += totalGrams;
        if (shoppingList[ingredient.name].pounds !== undefined) {
          shoppingList[ingredient.name].pounds! += totalPounds;
        }
      } else {
        shoppingList[ingredient.name] = { grams: totalGrams, pounds: totalPounds };
      }
    }
  }
  for (const supplement of recipe.ingredients.supplements) {
    shoppingList[supplement.name] = { grams: supplement.grams * numberOfDays };
  }
  return shoppingList;
}

export interface MealPortion {
  dailyPortion: number;
  mealPortion: number;
  percentage: number;
}

export function calculateMealPortions(
  recipe: Recipe,
  dogs: Dog[],
  mealsPerDay = 2,
): Record<string, MealPortion> {
  const totalMER = getTotalMER(dogs);
  const totalWeightLbs = dogs.reduce((sum, dog) => sum + (dog.weight || 0), 0);
  const meals = mealsPerDay > 0 ? mealsPerDay : 1;
  const portions: Record<string, MealPortion> = {};
  for (const dog of dogs) {
    const dogEnergyShare = totalMER > 0 ? (dog.MER || 0) / totalMER : 0;
    const dogWeightShare = totalWeightLbs > 0 ? (dog.weight || 0) / totalWeightLbs : 0;
    let totalDailyGrams = 0;
    for (const category of CATEGORIES) {
      for (const ingredient of recipe.ingredients[category]) {
        totalDailyGrams += ingredient.grams * dogEnergyShare;
      }
    }
    for (const supplement of recipe.ingredients.supplements) {
      totalDailyGrams += supplement.grams * dogWeightShare;
    }
    portions[dog.name] = {
      dailyPortion: round2(totalDailyGrams),
      mealPortion: round2(totalDailyGrams / meals),
      percentage: Math.round(dogEnergyShare * 100),
    };
  }
  return portions;
}

/** Re-export NRC constants for nutrition module convenience. */
export { NRC_ADULT_PER_1000_KCAL };
