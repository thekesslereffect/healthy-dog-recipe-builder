import {
  CATEGORIES,
  CALCIUM_MG_PER_KCAL,
  AAFCO_ADULT_PER_1000_KCAL,
  GRAMS_PER_LB,
  LB_PER_KG,
  type Category,
} from './constants';
import { findFoodByName, ingredients, type Ingredient } from '../data/ingredients';

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

// Calcium requirements are tied to energy intake (per 1,000 kcal), NOT to body
// weight directly, because dogs eat to meet energy needs and calcium must be
// balanced against dietary phosphorus.
function calculateCalciumNeeds(totalDailyCalories: number): number {
  return Math.round(totalDailyCalories * CALCIUM_MG_PER_KCAL);
}

// RER = 70 × (kg)^0.75, MER = RER × activity factor.
export function calculateDailyCalories(dog: Dog): number {
  const weightKg = dog.weight / LB_PER_KG;
  const RER = 70 * Math.pow(weightKg, 0.75);
  return RER * dog.activityMultiplier;
}

export function getTotalMER(dogs: Dog[]): number {
  return dogs.reduce((total, dog) => total + (dog.MER || 0), 0);
}

// Deterministic Fisher–Yates shuffle using an injected RNG.
function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Choose `count` ingredients: honour locked names first, drop excluded ones,
// then randomly fill the remaining slots.
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
  const { excluded = [], locked = {}, random = Math.random } = options;
  const recipe = emptyRecipe();

  const totalDogWeight = dogs.reduce((sum, dog) => sum + dog.weight, 0);
  let totalSupplementCalories = 0;

  // Non-eggshell supplements first (eggshell is dosed after foods so Ca:P can balance).
  for (const supplement of ingredients.supplements) {
    if (supplement.name === 'Eggshell Powder (Calcium)') continue;
    const gramsPerDay = totalDogWeight * (supplement.gramsPerPoundPerDay || 0);
    const calories = round2((gramsPerDay * (supplement.caloriesPer100g || 0)) / 100);
    recipe.ingredients.supplements.push({
      name: supplement.name,
      grams: round2(gramsPerDay),
      calories,
      gramsPerScoop: supplement.gramsPerScoop || null,
    });
    totalSupplementCalories += calories;
  }

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
      ingredients[category],
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

  // Dose eggshell to meet AAFCO calcium minimum and keep Ca:P ≥ 1:1.
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

  const eggshell = ingredients.supplements.find((s) => s.name === 'Eggshell Powder (Calcium)');
  if (eggshell?.calciumMgPerGram) {
    const aafcoCalciumMg = calculateCalciumNeeds(totalMER);
    const targetCalciumMg = Math.max(
      aafcoCalciumMg,
      foodPhosphorusMg * AAFCO_ADULT_PER_1000_KCAL.caPRatioMin,
    );
    const eggshellCalciumMg = Math.max(0, targetCalciumMg - foodCalciumMg);
    const eggshellGrams = eggshellCalciumMg / eggshell.calciumMgPerGram;
    const calories = round2((eggshellGrams * (eggshell.caloriesPer100g || 0)) / 100);
    recipe.ingredients.supplements.push({
      name: eggshell.name,
      grams: round2(eggshellGrams),
      calories,
      gramsPerScoop: eggshell.gramsPerScoop || null,
    });
    totalSupplementCalories += calories;
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

    // Supplements are dosed by body weight, not energy share.
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
