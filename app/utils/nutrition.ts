import { AAFCO_ADULT_PER_1000_KCAL, CATEGORIES, NRC_ADULT_PER_1000_KCAL } from './constants';
import { findFoodByName, getSupplementCatalogEntry } from '../data/ingredients';
import type { ExtendedNutrients } from '../data/ingredientTypes';
import type { SupplementNutrientsPerScoop } from '../data/ingredientTypes';
import type { Dog, Recipe } from './recipeCalculator';

/** Daily totals for tracked nutrients (FDC foods + labeled supplements). */
export interface RecipeNutrientTotals {
  calories: number;
  proteinG: number;
  fatG: number;
  calciumMg: number;
  phosphorusMg: number;
  zincMg: number;
  copperMg: number;
  iodineMcg: number;
  vitaminDIU: number;
  vitaminEMg: number;
  cholineMg: number;
  epaDhaMg: number;
  /** Calcium : phosphorus ratio (null if P is 0). */
  calciumPhosphorusRatio: number | null;
  /** Grams of food that contributed FDC nutrient data. */
  trackedGrams: number;
  /** Ingredient names missing from the FDC food catalog. */
  untracked: string[];
}

export type NutrientStatus = 'ok' | 'low' | 'high';

export interface NutrientCheck {
  id: string;
  label: string;
  amountLabel: string;
  targetLabel: string;
  progress: number;
  status: NutrientStatus;
  hint: string;
}

export interface NutritionAssessment {
  totals: RecipeNutrientTotals;
  targets: {
    proteinG: number;
    fatG: number;
    calciumMg: number;
    phosphorusMg: number;
    zincMg: number;
    copperMg: number;
    iodineMcg: number;
    vitaminDIU: number;
    vitaminEMg: number;
    cholineMg: number;
    epaDhaMg: number;
  };
  checks: NutrientCheck[];
  okCount: number;
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

function addExtendedFromFood(
  food: ExtendedNutrients,
  grams: number,
  acc: {
    zincMg: number;
    copperMg: number;
    iodineMcg: number;
    vitaminDIU: number;
    vitaminEMg: number;
    cholineMg: number;
    epaDhaMg: number;
  },
): void {
  const factor = grams / 100;
  if (food.zincMgPer100g != null) acc.zincMg += food.zincMgPer100g * factor;
  if (food.copperMgPer100g != null) acc.copperMg += food.copperMgPer100g * factor;
  if (food.iodineMcgPer100g != null) acc.iodineMcg += food.iodineMcgPer100g * factor;
  if (food.vitaminDIUPer100g != null) acc.vitaminDIU += food.vitaminDIUPer100g * factor;
  if (food.vitaminEMgPer100g != null) acc.vitaminEMg += food.vitaminEMgPer100g * factor;
  if (food.cholineMgPer100g != null) acc.cholineMg += food.cholineMgPer100g * factor;
  if (food.epaMgPer100g != null) acc.epaDhaMg += food.epaMgPer100g * factor;
  if (food.dhaMgPer100g != null) acc.epaDhaMg += food.dhaMgPer100g * factor;
}

function addFromSupplementScoop(
  perScoop: SupplementNutrientsPerScoop,
  grams: number,
  gramsPerScoop: number,
  acc: {
    zincMg: number;
    copperMg: number;
    iodineMcg: number;
    vitaminDIU: number;
    vitaminEMg: number;
    cholineMg: number;
    epaDhaMg: number;
  },
): { calciumMg: number; phosphorusMg: number } {
  if (gramsPerScoop <= 0) return { calciumMg: 0, phosphorusMg: 0 };
  const scoops = grams / gramsPerScoop;
  if (perScoop.zincMg != null) acc.zincMg += perScoop.zincMg * scoops;
  if (perScoop.copperMg != null) acc.copperMg += perScoop.copperMg * scoops;
  if (perScoop.iodineMcg != null) acc.iodineMcg += perScoop.iodineMcg * scoops;
  if (perScoop.vitaminDIU != null) acc.vitaminDIU += perScoop.vitaminDIU * scoops;
  if (perScoop.vitaminEMg != null) acc.vitaminEMg += perScoop.vitaminEMg * scoops;
  if (perScoop.cholineMg != null) acc.cholineMg += perScoop.cholineMg * scoops;
  if (perScoop.epaMg != null) acc.epaDhaMg += perScoop.epaMg * scoops;
  if (perScoop.dhaMg != null) acc.epaDhaMg += perScoop.dhaMg * scoops;
  return {
    calciumMg: (perScoop.calciumMg ?? 0) * scoops,
    phosphorusMg: (perScoop.phosphorusMg ?? 0) * scoops,
  };
}

export function sumRecipeNutrients(recipe: Recipe): RecipeNutrientTotals {
  let calories = 0;
  let proteinG = 0;
  let fatG = 0;
  let calciumMg = 0;
  let phosphorusMg = 0;
  let trackedGrams = 0;
  const untracked: string[] = [];
  const micro = {
    zincMg: 0,
    copperMg: 0,
    iodineMcg: 0,
    vitaminDIU: 0,
    vitaminEMg: 0,
    cholineMg: 0,
    epaDhaMg: 0,
  };

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
      addExtendedFromFood(food, row.grams, micro);
    }
  }

  for (const row of recipe.ingredients.supplements) {
    calories += row.calories;
    const supplement = getSupplementCatalogEntry(row.name);
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
    if (supplement.nutrientsPerScoop && supplement.gramsPerScoop) {
      const extra = addFromSupplementScoop(
        supplement.nutrientsPerScoop,
        row.grams,
        supplement.gramsPerScoop,
        micro,
      );
      calciumMg += extra.calciumMg;
      phosphorusMg += extra.phosphorusMg;
    }
  }

  const { zincMg, copperMg, iodineMcg, vitaminDIU, vitaminEMg, cholineMg, epaDhaMg } = micro;

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const ratio =
    phosphorusMg > 0 ? Math.round((calciumMg / phosphorusMg) * 100) / 100 : null;

  return {
    calories: Math.round(calories),
    proteinG: round1(proteinG),
    fatG: round1(fatG),
    calciumMg: Math.round(calciumMg),
    phosphorusMg: Math.round(phosphorusMg),
    zincMg: round1(zincMg),
    copperMg: round1(copperMg * 1000) / 1000,
    iodineMcg: round1(iodineMcg),
    vitaminDIU: Math.round(vitaminDIU),
    vitaminEMg: round1(vitaminEMg),
    cholineMg: Math.round(cholineMg),
    epaDhaMg: Math.round(epaDhaMg),
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
  if (n >= 100) return String(Math.round(n));
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

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
    zincMg: Math.round(NRC_ADULT_PER_1000_KCAL.zincMg * scale * 10) / 10,
    copperMg: Math.round(NRC_ADULT_PER_1000_KCAL.copperMg * scale * 1000) / 1000,
    iodineMcg: Math.round(NRC_ADULT_PER_1000_KCAL.iodineMcg * scale),
    vitaminDIU: Math.round(NRC_ADULT_PER_1000_KCAL.vitaminDIU * scale),
    vitaminEMg: Math.round(NRC_ADULT_PER_1000_KCAL.vitaminEMg * scale * 10) / 10,
    cholineMg: Math.round(NRC_ADULT_PER_1000_KCAL.cholineMg * scale),
    epaDhaMg: Math.round(NRC_ADULT_PER_1000_KCAL.epaDhaMg * scale),
  };

  const checks: NutrientCheck[] = [
    minCheck('protein', 'Protein', totals.proteinG, targets.proteinG, 'g', 'Add more meat or organs'),
    minCheck('fat', 'Fat', totals.fatG, targets.fatG, 'g', 'Add fattier meat or oil'),
    minCheck('calcium', 'Calcium', totals.calciumMg, targets.calciumMg, 'mg', 'Eggshell or Canine Minerals usually needed'),
    minCheck('phosphorus', 'Phosphorus', totals.phosphorusMg, targets.phosphorusMg, 'mg', 'Add more meat, organs, or fish'),
    minCheck('zinc', 'Zinc', totals.zincMg, targets.zincMg, 'mg', 'Add Rx Essentials, liver, or red meat'),
    minCheck('copper', 'Copper', totals.copperMg, targets.copperMg, 'mg', 'Add liver or Rx Essentials'),
    minCheck('iodine', 'Iodine', totals.iodineMcg, targets.iodineMcg, 'mcg', 'Add fish or Rx Essentials (kelp)'),
    minCheck('vitD', 'Vitamin D', totals.vitaminDIU, targets.vitaminDIU, 'IU', 'Add oily fish, eggs, or Rx Essentials'),
    minCheck('vitE', 'Vitamin E', totals.vitaminEMg, targets.vitaminEMg, 'mg', 'Add Rx Essentials or vitamin E oil'),
    minCheck('choline', 'Choline', totals.cholineMg, targets.cholineMg, 'mg', 'Add eggs or liver'),
    minCheck('epaDha', 'EPA+DHA', totals.epaDhaMg, targets.epaDhaMg, 'mg', 'Add sardines, mackerel, or salmon'),
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

/**
 * Higher is better. Uses partial credit for low nutrients (progress toward minimum)
 * and penalizes high/excess values (e.g. Ca:P above range).
 */
export function nutritionBalanceScore(assessment: NutritionAssessment): number {
  let score = 0;
  for (const check of assessment.checks) {
    if (check.status === 'ok') {
      score += 1;
    } else if (check.status === 'low') {
      score += Math.min(Math.max(check.progress, 0), 1);
    } else {
      score += Math.max(0, 1 - Math.max(check.progress - 1, 0));
    }
  }
  return score;
}
