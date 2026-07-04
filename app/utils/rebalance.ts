import {
  AAFCO_ADULT_PER_1000_KCAL,
  CALCIUM_MG_PER_KCAL,
  CATEGORIES,
  RECOMMENDED_RATIOS,
  type Category,
  type CategoryRatios,
} from './constants';
import {
  calculateDailyCalories,
  getTotalMER,
  type Dog,
  type Recipe,
} from './recipeCalculator';
import { assessRecipeNutrition } from './nutrition';
import { findFoodByName, ingredients } from '../data/ingredients';

export interface BalanceResult {
  ratios: CategoryRatios;
  recipe: Recipe;
  /** True when every AAFCO screening check passed. */
  fullyBalanced: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function normalize(ratios: CategoryRatios): CategoryRatios {
  const sum = CATEGORIES.reduce((total, category) => total + (ratios[category] || 0), 0);
  if (sum <= 0) return { ...RECOMMENDED_RATIOS };
  const next = { ...ratios };
  for (const category of CATEGORIES) {
    next[category] = (ratios[category] || 0) / sum;
  }
  return next;
}

/** Minimum share for a category that already has ingredients (keeps them in the plan). */
const OCCUPIED_FLOOR = 0.02;

/**
 * Fit a ratio profile to the current draft:
 * - empty categories stay at 0% (nothing to allocate)
 * - categories with ingredients keep at least OCCUPIED_FLOOR so Balance % never
 *   deletes foods by zeroing their share
 */
function fitToRecipe(ratios: CategoryRatios, recipe: Recipe): CategoryRatios {
  const next = { ...ratios };
  for (const category of CATEGORIES) {
    const occupied = recipe.ingredients[category].length > 0;
    if (!occupied) {
      next[category] = 0;
    } else {
      next[category] = Math.max(OCCUPIED_FLOOR, ratios[category] || 0);
    }
  }
  return normalize(next);
}

/**
 * Rebuild a recipe using the same ingredient names, only changing category
 * calorie shares (percentages) and grams. Eggshell is re-dosed for Ca / Ca:P.
 */
export function applyRatiosToRecipe(
  recipe: Recipe,
  dogs: Dog[],
  ratios: CategoryRatios,
): Recipe {
  const dogsWithMER = dogs.map((dog) => ({
    ...dog,
    MER: calculateDailyCalories(dog),
  }));
  const totalMER = getTotalMER(dogsWithMER);
  const totalDogWeight = dogs.reduce((sum, dog) => sum + dog.weight, 0);
  const fitted = fitToRecipe(ratios, recipe);
  const next: Recipe = {
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

  let supplementCalories = 0;
  for (const supplement of ingredients.supplements) {
    if (supplement.name === 'Eggshell Powder (Calcium)') continue;
    if ((supplement.gramsPerPoundPerDay || 0) <= 0) continue;
    const gramsPerDay = totalDogWeight * (supplement.gramsPerPoundPerDay || 0);
    const calories = round2((gramsPerDay * (supplement.caloriesPer100g || 0)) / 100);
    next.ingredients.supplements.push({
      name: supplement.name,
      grams: round2(gramsPerDay),
      calories,
      gramsPerScoop: supplement.gramsPerScoop || null,
    });
    supplementCalories += calories;
  }

  const remainingMER = Math.max(totalMER - supplementCalories, 0);
  let mainCalories = 0;

  for (const category of CATEGORIES) {
    const rows = recipe.ingredients[category];
    if (rows.length === 0 || (fitted[category] || 0) <= 0) {
      next.ingredients[category] = [];
      continue;
    }

    const calorieTarget = remainingMER * fitted[category];
    const caloriesPerIngredient = calorieTarget / rows.length;

    for (const row of rows) {
      const food = findFoodByName(row.name);
      const caloriesPer100g = food?.caloriesPer100g || 0;
      if (caloriesPer100g <= 0) {
        next.ingredients[category].push({ ...row });
        mainCalories += row.calories;
        continue;
      }
      const grams = (caloriesPerIngredient / caloriesPer100g) * 100;
      const calories = round2((grams * caloriesPer100g) / 100);
      next.ingredients[category].push({
        name: row.name,
        grams: round2(grams),
        calories,
      });
      mainCalories += calories;
    }
  }

  let foodCalciumMg = 0;
  let foodPhosphorusMg = 0;
  for (const category of CATEGORIES) {
    for (const row of next.ingredients[category]) {
      const food = findFoodByName(row.name);
      if (!food) continue;
      foodCalciumMg += (food.calciumMgPer100g * row.grams) / 100;
      foodPhosphorusMg += (food.phosphorusMgPer100g * row.grams) / 100;
    }
  }

  const eggshell = ingredients.supplements.find((s) => s.name === 'Eggshell Powder (Calcium)');
  if (eggshell?.calciumMgPerGram) {
    const aafcoCalciumMg = Math.round(totalMER * CALCIUM_MG_PER_KCAL);
    const targetCalciumMg = Math.max(
      aafcoCalciumMg,
      foodPhosphorusMg * AAFCO_ADULT_PER_1000_KCAL.caPRatioMin,
    );
    const eggshellCalciumMg = Math.max(0, targetCalciumMg - foodCalciumMg);
    const eggshellGrams = eggshellCalciumMg / eggshell.calciumMgPerGram;
    const calories = round2((eggshellGrams * (eggshell.caloriesPer100g || 0)) / 100);
    next.ingredients.supplements.push({
      name: eggshell.name,
      grams: round2(eggshellGrams),
      calories,
      gramsPerScoop: eggshell.gramsPerScoop || null,
    });
    supplementCalories += calories;
  }

  next.totalCalories = round2(mainCalories + supplementCalories);
  return next;
}

/** Candidate percentage mixes (calorie shares). */
const RATIO_PROFILES: CategoryRatios[] = [
  RECOMMENDED_RATIOS,
  { protein: 0.78, organs: 0.08, fruits: 0.02, veggies: 0.04, carbs: 0.02, fats: 0.06 },
  { protein: 0.75, organs: 0.08, fruits: 0.02, veggies: 0.05, carbs: 0.0, fats: 0.1 },
  { protein: 0.8, organs: 0.1, fruits: 0.01, veggies: 0.03, carbs: 0.0, fats: 0.06 },
  { protein: 0.7, organs: 0.08, fruits: 0.02, veggies: 0.05, carbs: 0.03, fats: 0.12 },
  { protein: 0.82, organs: 0.08, fruits: 0.01, veggies: 0.03, carbs: 0.0, fats: 0.06 },
  { protein: 0.72, organs: 0.1, fruits: 0.02, veggies: 0.04, carbs: 0.02, fats: 0.1 },
  { protein: 0.65, organs: 0.08, fruits: 0.03, veggies: 0.06, carbs: 0.05, fats: 0.13 },
];

function nudgeRatios(ratios: CategoryRatios, failedIds: string[]): CategoryRatios {
  const next = { ...ratios };
  const bump = (category: Category, delta: number) => {
    next[category] = Math.max(0, (next[category] || 0) + delta);
  };

  for (const id of failedIds) {
    if (id === 'protein' || id === 'phosphorus') {
      bump('protein', 0.06);
      bump('organs', 0.02);
      bump('carbs', -0.04);
      bump('fruits', -0.02);
      bump('veggies', -0.02);
    }
    if (id === 'fat') {
      bump('fats', 0.05);
      bump('protein', 0.02);
      bump('carbs', -0.04);
      bump('veggies', -0.02);
      bump('fruits', -0.01);
    }
  }

  return normalize(next);
}

/**
 * Adjust category percentages only (same ingredients), searching for a mix that
 * meets AAFCO adult screening checks. Returns best effort if not fully balanced.
 */
export function balanceRecipeMix(recipe: Recipe, dogs: Dog[]): BalanceResult | null {
  const dogsWithMER = dogs.map((dog) => ({
    ...dog,
    MER: calculateDailyCalories(dog),
  }));
  if (dogsWithMER.some((d) => !d.name?.trim() || d.weight <= 0)) return null;
  if (getTotalMER(dogsWithMER) <= 0) return null;

  const scored: Array<BalanceResult & { score: number }> = [];

  const tryRatios = (ratios: CategoryRatios): BalanceResult | null => {
    const fitted = fitToRecipe(ratios, recipe);
    const nextRecipe = applyRatiosToRecipe(recipe, dogs, fitted);
    const assessment = assessRecipeNutrition(nextRecipe, dogsWithMER);
    const score = assessment.okCount;
    const result = { ratios: fitted, recipe: nextRecipe, fullyBalanced: score === assessment.checks.length, score };
    scored.push(result);
    if (result.fullyBalanced) return result;
    return null;
  };

  for (const profile of RATIO_PROFILES) {
    const hit = tryRatios(profile);
    if (hit) return { ratios: hit.ratios, recipe: hit.recipe, fullyBalanced: true };
  }

  scored.sort((a, b) => b.score - a.score);
  let best = scored[0];
  if (!best) return null;

  // Hill-climb percentages from the best partial result.
  let ratios = { ...best.ratios };
  for (let step = 0; step < 12; step++) {
    const assessment = assessRecipeNutrition(best.recipe, dogsWithMER);
    const failedIds = assessment.checks
      .filter((check) => check.status !== 'ok')
      .map((check) => check.id);
    if (failedIds.length === 0) {
      return { ratios: best.ratios, recipe: best.recipe, fullyBalanced: true };
    }
    ratios = nudgeRatios(ratios, failedIds);
    const fitted = fitToRecipe(ratios, recipe);
    const nextRecipe = applyRatiosToRecipe(recipe, dogs, fitted);
    const nextAssessment = assessRecipeNutrition(nextRecipe, dogsWithMER);
    const score = nextAssessment.okCount;
    if (score === nextAssessment.checks.length) {
      return { ratios: fitted, recipe: nextRecipe, fullyBalanced: true };
    }
    if (score > best.score) {
      best = { ratios: fitted, recipe: nextRecipe, fullyBalanced: false, score };
    }
  }

  return {
    ratios: best.ratios,
    recipe: best.recipe,
    fullyBalanced: best.fullyBalanced,
  };
}
