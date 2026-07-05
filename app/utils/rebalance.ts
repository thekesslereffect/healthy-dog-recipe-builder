import {
  CATEGORIES,
  RECOMMENDED_RATIOS,
  type Category,
  type CategoryRatios,
} from './constants';
import {
  buildWeightDosedSupplements,
  DEFAULT_SUPPLEMENT_OPTIONS,
  doseEggshellRow,
  findFoodByName,
  supplementCalciumMg,
  normalizeSupplementOptions,
  type SupplementOptions,
} from '../data/ingredients';
import {
  calculateDailyCalories,
  getTotalMER,
  type Dog,
  type Recipe,
} from './recipeCalculator';
import { assessRecipeNutrition, nutritionBalanceScore } from './nutrition';
import {
  boostCaloriesInRecipe,
  stripNutritionBoosts,
  tryAddNutritionBoost,
} from './nutritionBoost';

export interface BalanceResult {
  ratios: CategoryRatios;
  recipe: Recipe;
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

const OCCUPIED_FLOOR = 0.02;

function fitToRecipe(ratios: CategoryRatios, recipe: Recipe): CategoryRatios {
  const next = { ...ratios };
  for (const category of CATEGORIES) {
    const hasBase = recipe.ingredients[category].some((row) => !row.additional);
    if (!hasBase) {
      next[category] = 0;
    } else {
      next[category] = Math.max(OCCUPIED_FLOOR, ratios[category] || 0);
    }
  }
  return normalize(next);
}

/**
 * Rebuild a recipe using the same ingredient names, only changing category
 * calorie shares (percentages) and grams. Supplements and eggshell are re-dosed.
 */
export function applyRatiosToRecipe(
  recipe: Recipe,
  dogs: Dog[],
  ratios: CategoryRatios,
  supplementOptions: SupplementOptions = DEFAULT_SUPPLEMENT_OPTIONS,
): Recipe {
  const dogsWithMER = dogs.map((dog) => ({
    ...dog,
    MER: calculateDailyCalories(dog),
  }));
  const totalMER = getTotalMER(dogsWithMER);
  const totalDogWeight = dogs.reduce((sum, dog) => sum + dog.weight, 0);
  const supplements = normalizeSupplementOptions(supplementOptions);
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
  for (const row of buildWeightDosedSupplements(totalDogWeight, supplements)) {
    next.ingredients.supplements.push(row);
    supplementCalories += row.calories;
  }
  const extraCalciumMg = supplementCalciumMg(totalDogWeight, supplements);

  const boostTotal = boostCaloriesInRecipe(recipe);
  const remainingMER = Math.max(totalMER - supplementCalories - boostTotal, 0);
  let mainCalories = 0;

  for (const category of CATEGORIES) {
    const rows = recipe.ingredients[category];
    const baseRows = rows.filter((row) => !row.additional);
    const addRows = rows.filter((row) => row.additional);

    if (baseRows.length === 0 && addRows.length === 0) {
      next.ingredients[category] = [];
      continue;
    }

    if (baseRows.length > 0 && (fitted[category] || 0) > 0) {
      const calorieTarget = remainingMER * fitted[category];
      const caloriesPerIngredient = calorieTarget / baseRows.length;

      for (const row of baseRows) {
        const food = findFoodByName(row.name);
        const caloriesPer100g = food?.caloriesPer100g || 0;
        if (caloriesPer100g <= 0) {
          next.ingredients[category].push({ ...row, additional: false });
          mainCalories += row.calories;
          continue;
        }
        const grams = (caloriesPerIngredient / caloriesPer100g) * 100;
        const calories = round2((grams * caloriesPer100g) / 100);
        next.ingredients[category].push({
          name: row.name,
          grams: round2(grams),
          calories,
          additional: false,
        });
        mainCalories += calories;
      }
    } else if (baseRows.length > 0) {
      for (const row of baseRows) {
        next.ingredients[category].push({ ...row, additional: false });
        mainCalories += row.calories;
      }
    }

    for (const row of addRows) {
      const food = findFoodByName(row.name);
      const caloriesPer100g = food?.caloriesPer100g || 0;
      const targetCalories = row.calories > 0 ? row.calories : round2(totalMER * 0.025);
      if (caloriesPer100g <= 0) {
        next.ingredients[category].push({ ...row, additional: true });
        mainCalories += row.calories;
        continue;
      }
      const grams = round2((targetCalories / caloriesPer100g) * 100);
      const calories = round2((grams * caloriesPer100g) / 100);
      next.ingredients[category].push({
        name: row.name,
        grams,
        calories,
        additional: true,
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

  const eggshellRow = doseEggshellRow(
    totalMER,
    foodCalciumMg,
    foodPhosphorusMg,
    extraCalciumMg,
    supplements,
  );
  if (eggshellRow) {
    next.ingredients.supplements.push(eggshellRow);
    supplementCalories += eggshellRow.calories;
  }

  next.totalCalories = round2(mainCalories + supplementCalories);
  return next;
}

const RATIO_PROFILES: CategoryRatios[] = [
  RECOMMENDED_RATIOS,
  { protein: 0.78, organs: 0.08, fruits: 0.02, veggies: 0.04, carbs: 0.02, fats: 0.06 },
  { protein: 0.75, organs: 0.08, fruits: 0.02, veggies: 0.05, carbs: 0.0, fats: 0.1 },
  { protein: 0.8, organs: 0.1, fruits: 0.01, veggies: 0.03, carbs: 0.0, fats: 0.06 },
  { protein: 0.7, organs: 0.08, fruits: 0.02, veggies: 0.05, carbs: 0.03, fats: 0.12 },
  { protein: 0.82, organs: 0.08, fruits: 0.01, veggies: 0.03, carbs: 0.0, fats: 0.06 },
  { protein: 0.72, organs: 0.1, fruits: 0.02, veggies: 0.04, carbs: 0.02, fats: 0.1 },
  { protein: 0.65, organs: 0.08, fruits: 0.03, veggies: 0.06, carbs: 0.05, fats: 0.13 },
  { protein: 0.68, organs: 0.12, fruits: 0.01, veggies: 0.04, carbs: 0.0, fats: 0.15 },
  { protein: 0.74, organs: 0.1, fruits: 0.01, veggies: 0.03, carbs: 0.0, fats: 0.12 },
  { protein: 0.76, organs: 0.12, fruits: 0.0, veggies: 0.02, carbs: 0.0, fats: 0.1 },
];

/** Categories to adjust when a nutrient is below target. */
const NUDGE_BY_NUTRIENT: Record<string, Array<{ category: Category; delta: number }>> = {
  protein: [
    { category: 'protein', delta: 0.07 },
    { category: 'organs', delta: 0.02 },
    { category: 'carbs', delta: -0.05 },
    { category: 'fruits', delta: -0.02 },
    { category: 'veggies', delta: -0.02 },
  ],
  fat: [
    { category: 'fats', delta: 0.06 },
    { category: 'protein', delta: 0.02 },
    { category: 'carbs', delta: -0.05 },
    { category: 'veggies', delta: -0.02 },
    { category: 'fruits', delta: -0.01 },
  ],
  phosphorus: [
    { category: 'protein', delta: 0.05 },
    { category: 'organs', delta: 0.03 },
    { category: 'carbs', delta: -0.05 },
    { category: 'fruits', delta: -0.02 },
  ],
  zinc: [
    { category: 'organs', delta: 0.05 },
    { category: 'protein', delta: 0.03 },
    { category: 'carbs', delta: -0.04 },
    { category: 'fruits', delta: -0.02 },
    { category: 'veggies', delta: -0.02 },
  ],
  copper: [
    { category: 'organs', delta: 0.06 },
    { category: 'protein', delta: 0.02 },
    { category: 'carbs', delta: -0.04 },
    { category: 'veggies', delta: -0.02 },
  ],
  choline: [
    { category: 'organs', delta: 0.04 },
    { category: 'protein', delta: 0.04 },
    { category: 'carbs', delta: -0.04 },
    { category: 'fruits', delta: -0.02 },
  ],
  iodine: [
    { category: 'protein', delta: 0.06 },
    { category: 'fats', delta: 0.02 },
    { category: 'carbs', delta: -0.05 },
    { category: 'veggies', delta: -0.02 },
  ],
  vitD: [
    { category: 'protein', delta: 0.06 },
    { category: 'organs', delta: 0.02 },
    { category: 'carbs', delta: -0.05 },
    { category: 'veggies', delta: -0.02 },
  ],
  vitE: [
    { category: 'fats', delta: 0.05 },
    { category: 'organs', delta: 0.02 },
    { category: 'veggies', delta: -0.03 },
    { category: 'carbs', delta: -0.02 },
  ],
  epaDha: [
    { category: 'protein', delta: 0.07 },
    { category: 'fats', delta: 0.03 },
    { category: 'carbs', delta: -0.06 },
    { category: 'veggies', delta: -0.02 },
  ],
  calcium: [
    { category: 'veggies', delta: 0.03 },
    { category: 'protein', delta: 0.02 },
    { category: 'organs', delta: -0.03 },
    { category: 'carbs', delta: -0.02 },
  ],
  cap: [
    { category: 'organs', delta: -0.04 },
    { category: 'protein', delta: -0.02 },
    { category: 'veggies', delta: 0.03 },
    { category: 'fruits', delta: 0.02 },
    { category: 'fats', delta: 0.01 },
  ],
};

function nudgeRatios(ratios: CategoryRatios, failedChecks: Array<{ id: string; status: string }>): CategoryRatios {
  const next = { ...ratios };

  for (const check of failedChecks) {
    if (check.id === 'cap' && check.status === 'high') {
      next.organs = Math.max(0, (next.organs || 0) - 0.05);
      next.protein = Math.max(0, (next.protein || 0) - 0.02);
      next.veggies = (next.veggies || 0) + 0.04;
      next.fruits = (next.fruits || 0) + 0.02;
      continue;
    }
    if (check.id === 'cap' && check.status === 'low') {
      next.organs = Math.max(0, (next.organs || 0) - 0.04);
      next.protein = Math.max(0, (next.protein || 0) - 0.02);
      next.veggies = (next.veggies || 0) + 0.03;
      continue;
    }

    const nudges = NUDGE_BY_NUTRIENT[check.id];
    if (!nudges) continue;
    for (const { category, delta } of nudges) {
      next[category] = Math.max(0, (next[category] || 0) + delta);
    }
  }

  return normalize(next);
}

type ScoredBalance = BalanceResult & { score: number };

function applyNutritionBoosts(
  recipe: Recipe,
  ratios: CategoryRatios,
  dogs: Dog[],
  dogsWithMER: Dog[],
  supplementOptions: SupplementOptions,
  excluded: string[],
): Recipe {
  let working = applyRatiosToRecipe(recipe, dogs, ratios, supplementOptions);
  const totalMER = getTotalMER(dogsWithMER);

  for (let step = 0; step < CATEGORIES.length; step++) {
    const assessment = assessRecipeNutrition(working, dogsWithMER);
    const failed = assessment.checks.filter((check) => check.status !== 'ok');
    if (failed.length === 0) break;

    const withBoost = tryAddNutritionBoost(working, failed, totalMER, excluded);
    if (!withBoost) break;

    working = applyRatiosToRecipe(withBoost, dogs, ratios, supplementOptions);
  }

  return working;
}

function evaluateMix(
  recipe: Recipe,
  dogs: Dog[],
  dogsWithMER: Dog[],
  ratios: CategoryRatios,
  supplementOptions: SupplementOptions,
  excluded: string[],
): ScoredBalance {
  const fitted = fitToRecipe(ratios, recipe);
  const nextRecipe = applyNutritionBoosts(
    recipe,
    fitted,
    dogs,
    dogsWithMER,
    supplementOptions,
    excluded,
  );
  const assessment = assessRecipeNutrition(nextRecipe, dogsWithMER);
  const score = nutritionBalanceScore(assessment);
  return {
    ratios: fitted,
    recipe: nextRecipe,
    fullyBalanced: assessment.okCount === assessment.checks.length,
    score,
  };
}

export function balanceRecipeMix(
  recipe: Recipe,
  dogs: Dog[],
  supplementOptions: SupplementOptions = DEFAULT_SUPPLEMENT_OPTIONS,
  excluded: string[] = [],
): BalanceResult | null {
  const dogsWithMER = dogs.map((dog) => ({
    ...dog,
    MER: calculateDailyCalories(dog),
  }));
  if (dogsWithMER.some((d) => !d.name?.trim() || d.weight <= 0)) return null;
  if (getTotalMER(dogsWithMER) <= 0) return null;

  const baseRecipe = stripNutritionBoosts(recipe);
  const scored: ScoredBalance[] = [];

  for (const profile of RATIO_PROFILES) {
    const result = evaluateMix(
      baseRecipe,
      dogs,
      dogsWithMER,
      profile,
      supplementOptions,
      excluded,
    );
    scored.push(result);
    if (result.fullyBalanced) {
      return { ratios: result.ratios, recipe: result.recipe, fullyBalanced: true };
    }
  }

  scored.sort((a, b) => b.score - a.score);
  let best = scored[0];
  if (!best) return null;

  let ratios = { ...best.ratios };

  for (let step = 0; step < 16; step++) {
    const assessment = assessRecipeNutrition(best.recipe, dogsWithMER);
    const failed = assessment.checks.filter((check) => check.status !== 'ok');
    if (failed.length === 0) {
      return { ratios: best.ratios, recipe: best.recipe, fullyBalanced: true };
    }

    ratios = nudgeRatios(ratios, failed);
    const result = evaluateMix(
      baseRecipe,
      dogs,
      dogsWithMER,
      ratios,
      supplementOptions,
      excluded,
    );
    if (result.fullyBalanced) {
      return { ratios: result.ratios, recipe: result.recipe, fullyBalanced: true };
    }
    if (result.score > best.score) {
      best = result;
      ratios = { ...result.ratios };
    }
  }

  return {
    ratios: best.ratios,
    recipe: best.recipe,
    fullyBalanced: best.fullyBalanced,
  };
}
