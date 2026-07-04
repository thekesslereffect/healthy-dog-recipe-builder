import { AAFCO_ADULT_PER_1000_KCAL, CATEGORIES } from './constants';
import { findFoodByName, ingredients } from '../data/ingredients';
import type { Dog, Recipe } from './recipeCalculator';

/** Daily totals for the nutrients we track (from FDC-backed foods). */
export interface RecipeNutrientTotals {
  calories: number;
  proteinG: number;
  fatG: number;
  calciumMg: number;
  phosphorusMg: number;
  /** Calcium : phosphorus ratio (null if P is 0). */
  calciumPhosphorusRatio: number | null;
  /** Grams of food that contributed FDC nutrient data. */
  trackedGrams: number;
  /** Ingredient names missing from the FDC food catalog (e.g. some supplements). */
  untracked: string[];
}

export type NutrientStatus = 'ok' | 'low' | 'high';

export interface NutrientCheck {
  id: string;
  label: string;
  /** Human-readable amount in the recipe. */
  amountLabel: string;
  /** Human-readable target (e.g. "≥ 56g"). */
  targetLabel: string;
  /** 0–1+ progress toward minimum (capped for display). */
  progress: number;
  status: NutrientStatus;
  hint: string;
}

export interface NutritionAssessment {
  totals: RecipeNutrientTotals;
  /** AAFCO adult minimums scaled to this recipe's calories. */
  targets: {
    proteinG: number;
    fatG: number;
    calciumMg: number;
    phosphorusMg: number;
  };
  checks: NutrientCheck[];
  /** How many minimums are currently met. */
  okCount: number;
  /** Per-dog share of the plan (by calorie need). */
  perDog: Array<{
    name: string;
    share: number;
    calories: number;
    proteinG: number;
    fatG: number;
    calciumMg: number;
    phosphorusMg: number;
  }>;
}

/**
 * Sum protein, fat, Ca, and P for a daily recipe using FDC-backed food data.
 * Eggshell calcium is included via calciumMgPerGram on the supplement entry.
 */
export function sumRecipeNutrients(recipe: Recipe): RecipeNutrientTotals {
  let calories = 0;
  let proteinG = 0;
  let fatG = 0;
  let calciumMg = 0;
  let phosphorusMg = 0;
  let trackedGrams = 0;
  const untracked: string[] = [];

  for (const category of CATEGORIES) {
    for (const row of recipe.ingredients[category]) {
      calories += row.calories;
      const food = findFoodByName(row.name);
      if (!food) {
        untracked.push(row.name);
        continue;
      }
      const factor = row.grams / 100;
      proteinG += food.proteinGPer100g * factor;
      fatG += food.fatGPer100g * factor;
      calciumMg += food.calciumMgPer100g * factor;
      phosphorusMg += food.phosphorusMgPer100g * factor;
      trackedGrams += row.grams;
    }
  }

  for (const row of recipe.ingredients.supplements) {
    calories += row.calories;
    const supplement = ingredients.supplements.find((s) => s.name === row.name);
    if (!supplement) {
      untracked.push(row.name);
      continue;
    }
    if (supplement.calciumMgPerGram) {
      calciumMg += row.grams * supplement.calciumMgPerGram;
    }
    if (supplement.proteinGPer100g != null) {
      proteinG += (supplement.proteinGPer100g * row.grams) / 100;
    }
    if (supplement.fatGPer100g != null) {
      fatG += (supplement.fatGPer100g * row.grams) / 100;
    }
    if (supplement.calciumMgPer100g != null) {
      calciumMg += (supplement.calciumMgPer100g * row.grams) / 100;
    }
    if (supplement.phosphorusMgPer100g != null) {
      phosphorusMg += (supplement.phosphorusMgPer100g * row.grams) / 100;
    }
  }

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const ratio =
    phosphorusMg > 0 ? Math.round((calciumMg / phosphorusMg) * 100) / 100 : null;

  return {
    calories: Math.round(calories),
    proteinG: round1(proteinG),
    fatG: round1(fatG),
    calciumMg: Math.round(calciumMg),
    phosphorusMg: Math.round(phosphorusMg),
    calciumPhosphorusRatio: ratio,
    trackedGrams: Math.round(trackedGrams),
    untracked,
  };
}

function minCheck(
  id: string,
  label: string,
  amount: number,
  minimum: number,
  unit: string,
  lowHint: string,
): NutrientCheck {
  const progress = minimum > 0 ? amount / minimum : 1;
  const status: NutrientStatus = amount + 1e-9 >= minimum ? 'ok' : 'low';
  return {
    id,
    label,
    amountLabel: `${formatAmount(amount)}${unit}`,
    targetLabel: `≥ ${formatAmount(minimum)}${unit}`,
    progress,
    status,
    hint: status === 'ok' ? 'Meets adult minimum' : lowHint,
  };
}

function formatAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/**
 * Compare the daily recipe to AAFCO adult maintenance minimums for its calorie
 * level, and split totals across dogs by their share of daily calories.
 */
export function assessRecipeNutrition(
  recipe: Recipe,
  dogsWithMER: Dog[],
): NutritionAssessment {
  const totals = sumRecipeNutrients(recipe);
  const kcal = Math.max(totals.calories, 1);
  const scale = kcal / 1000;

  const targets = {
    proteinG: Math.round(AAFCO_ADULT_PER_1000_KCAL.proteinG * scale * 10) / 10,
    fatG: Math.round(AAFCO_ADULT_PER_1000_KCAL.fatG * scale * 10) / 10,
    calciumMg: Math.round(AAFCO_ADULT_PER_1000_KCAL.calciumMg * scale),
    phosphorusMg: Math.round(AAFCO_ADULT_PER_1000_KCAL.phosphorusMg * scale),
  };

  const checks: NutrientCheck[] = [
    minCheck(
      'protein',
      'Protein',
      totals.proteinG,
      targets.proteinG,
      'g',
      'Add more meat or organs',
    ),
    minCheck(
      'fat',
      'Fat',
      totals.fatG,
      targets.fatG,
      'g',
      'Add fattier meat or oil',
    ),
    minCheck(
      'calcium',
      'Calcium',
      totals.calciumMg,
      targets.calciumMg,
      'mg',
      'Eggshell powder is usually needed',
    ),
    minCheck(
      'phosphorus',
      'Phosphorus',
      totals.phosphorusMg,
      targets.phosphorusMg,
      'mg',
      'Meat and organs usually cover this',
    ),
  ];

  const ratio = totals.calciumPhosphorusRatio;
  if (ratio != null) {
    let status: NutrientStatus = 'ok';
    let hint = 'In the ideal 1:1–2:1 range';
    if (ratio < AAFCO_ADULT_PER_1000_KCAL.caPRatioMin) {
      status = 'low';
      hint = 'Raise calcium (eggshell) or lower phosphorus-heavy foods';
    } else if (ratio > AAFCO_ADULT_PER_1000_KCAL.caPRatioMax) {
      status = 'high';
      hint = 'Too much calcium relative to phosphorus';
    }
    const mid = (AAFCO_ADULT_PER_1000_KCAL.caPRatioMin + AAFCO_ADULT_PER_1000_KCAL.caPRatioMax) / 2;
    checks.push({
      id: 'cap',
      label: 'Ca : P ratio',
      amountLabel: String(ratio),
      targetLabel: '1.0–2.0',
      progress: status === 'ok' ? 1 : Math.min(ratio / mid, 1.5),
      status,
      hint,
    });
  }

  const totalMer = dogsWithMER.reduce((sum, d) => sum + (d.MER || 0), 0);
  const perDog = dogsWithMER.map((dog) => {
    const share = totalMer > 0 ? (dog.MER || 0) / totalMer : 1 / Math.max(dogsWithMER.length, 1);
    return {
      name: dog.name?.trim() || 'Dog',
      share,
      calories: Math.round(totals.calories * share),
      proteinG: Math.round(totals.proteinG * share * 10) / 10,
      fatG: Math.round(totals.fatG * share * 10) / 10,
      calciumMg: Math.round(totals.calciumMg * share),
      phosphorusMg: Math.round(totals.phosphorusMg * share),
    };
  });

  return {
    totals,
    targets,
    checks,
    okCount: checks.filter((c) => c.status === 'ok').length,
    perDog,
  };
}
