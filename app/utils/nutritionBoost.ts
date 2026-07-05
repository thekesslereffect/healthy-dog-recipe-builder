import { CATEGORIES, type Category } from './constants';
import type { FoodIngredient } from '../data/ingredientTypes';
import { getIngredientCatalogOrThrow } from '../data/ingredients';
import { assessRecipeNutrition, type NutrientCheck } from './nutrition';
import type { Dog, Recipe, RecipeIngredient } from './recipeCalculator';

/** At most one nutrition add per food category (protein, organs, fats, etc.). */
export const MAX_BOOSTS_PER_CATEGORY = 1;
export const BOOST_KCAL_FRACTION = 0.035;
/** Total boost calories cap (~4 category adds at 3.5% MER each). */
export const MAX_BOOST_KCAL_FRACTION = 0.14;

const BOOST_CATEGORIES: Record<string, Category[]> = {
  protein: ['protein', 'organs'],
  fat: ['fats', 'protein'],
  phosphorus: ['protein', 'organs'],
  zinc: ['organs', 'protein'],
  copper: ['organs', 'protein'],
  choline: ['organs', 'protein'],
  iodine: ['protein'],
  vitD: ['protein', 'organs'],
  vitE: ['fats', 'organs'],
  epaDha: ['protein', 'fats'],
  calcium: ['veggies', 'protein'],
};

const FISH_PATTERN =
  /mackerel|sardine|salmon|tilapia|trout|tuna|herring|anchov|cod|shrimp|clam|oyster|mussel/i;
const MUSCLE_MEAT_PATTERN = /beef|bison|buffalo|turkey|chicken|duck|venison|pork|lamb|ground/i;
const ORGAN_PATTERN = /liver|heart|kidney|organ/i;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function nutrientPer1000Kcal(food: FoodIngredient, nutrientId: string): number {
  const kcal = Math.max(food.caloriesPer100g, 1);
  const scale = 1000 / kcal;
  switch (nutrientId) {
    case 'protein':
      return food.proteinGPer100g * scale;
    case 'fat':
      return food.fatGPer100g * scale;
    case 'phosphorus':
      return food.phosphorusMgPer100g * scale;
    case 'zinc':
      return (food.zincMgPer100g ?? 0) * scale;
    case 'copper':
      return (food.copperMgPer100g ?? 0) * scale;
    case 'iodine':
      return (food.iodineMcgPer100g ?? 0) * scale;
    case 'vitD':
      return (food.vitaminDIUPer100g ?? 0) * scale;
    case 'vitE':
      return (food.vitaminEMgPer100g ?? 0) * scale;
    case 'choline':
      return (food.cholineMgPer100g ?? 0) * scale;
    case 'epaDha':
      return ((food.epaMgPer100g ?? 0) + (food.dhaMgPer100g ?? 0)) * scale;
    case 'calcium':
      return food.calciumMgPer100g * scale;
    default:
      return 0;
  }
}

function isFish(name: string): boolean {
  return FISH_PATTERN.test(name);
}

function isMuscleMeat(name: string): boolean {
  return MUSCLE_MEAT_PATTERN.test(name) && !ORGAN_PATTERN.test(name);
}

function isOrgan(name: string): boolean {
  return ORGAN_PATTERN.test(name);
}

type OrganSubtype = 'liver' | 'heart' | 'kidney';

function organSubtype(name: string): OrganSubtype | null {
  if (/liver/i.test(name)) return 'liver';
  if (/heart/i.test(name)) return 'heart';
  if (/kidney/i.test(name)) return 'kidney';
  return null;
}

function recipeOrganSubtypes(recipe: Recipe, exceptName?: string): Set<OrganSubtype> {
  const subtypes = new Set<OrganSubtype>();
  for (const category of CATEGORIES) {
    for (const row of recipe.ingredients[category]) {
      if (exceptName && row.name === exceptName) continue;
      const subtype = organSubtype(row.name);
      if (subtype) subtypes.add(subtype);
    }
  }
  return subtypes;
}

function isEgg(name: string): boolean {
  return /\begg\b/i.test(name);
}

export function recipeIngredientNames(recipe: Recipe): Set<string> {
  const names = new Set<string>();
  for (const category of CATEGORIES) {
    for (const row of recipe.ingredients[category]) {
      names.add(row.name);
    }
  }
  return names;
}

export function countNutritionBoosts(recipe: Recipe): number {
  let count = 0;
  for (const category of CATEGORIES) {
    count += recipe.ingredients[category].filter((row) => row.additional).length;
  }
  return count;
}

export function countNutritionBoostsInCategory(recipe: Recipe, category: Category): number {
  return recipe.ingredients[category].filter((row) => row.additional).length;
}

export function hasNutritionBoostInCategory(recipe: Recipe, category: Category): boolean {
  return countNutritionBoostsInCategory(recipe, category) >= MAX_BOOSTS_PER_CATEGORY;
}

export function boostCaloriesInRecipe(recipe: Recipe): number {
  let total = 0;
  for (const category of CATEGORIES) {
    for (const row of recipe.ingredients[category]) {
      if (row.additional) total += row.calories;
    }
  }
  return total;
}

/** Remove nutrition adds so Balance % can recompute from the core recipe. */
export function stripNutritionBoosts(recipe: Recipe): Recipe {
  return {
    totalCalories: recipe.totalCalories,
    ingredients: {
      protein: recipe.ingredients.protein.filter((row) => !row.additional),
      organs: recipe.ingredients.organs.filter((row) => !row.additional),
      fruits: recipe.ingredients.fruits.filter((row) => !row.additional),
      veggies: recipe.ingredients.veggies.filter((row) => !row.additional),
      carbs: recipe.ingredients.carbs.filter((row) => !row.additional),
      fats: recipe.ingredients.fats.filter((row) => !row.additional),
      supplements: recipe.ingredients.supplements.map((row) => ({ ...row })),
    },
  };
}

function cloneRecipe(recipe: Recipe): Recipe {
  return {
    totalCalories: recipe.totalCalories,
    ingredients: {
      protein: recipe.ingredients.protein.map((row) => ({ ...row })),
      organs: recipe.ingredients.organs.map((row) => ({ ...row })),
      fruits: recipe.ingredients.fruits.map((row) => ({ ...row })),
      veggies: recipe.ingredients.veggies.map((row) => ({ ...row })),
      carbs: recipe.ingredients.carbs.map((row) => ({ ...row })),
      fats: recipe.ingredients.fats.map((row) => ({ ...row })),
      supplements: recipe.ingredients.supplements.map((row) => ({ ...row })),
    },
  };
}

function recipeHasFish(recipe: Recipe): boolean {
  for (const category of CATEGORIES) {
    if (recipe.ingredients[category].some((row) => isFish(row.name))) return true;
  }
  return false;
}

function muscleMeatCount(recipe: Recipe): number {
  let count = 0;
  for (const category of CATEGORIES) {
    for (const row of recipe.ingredients[category]) {
      if (isMuscleMeat(row.name)) count += 1;
    }
  }
  return count;
}

function candidateCategories(lows: NutrientCheck[]): Category[] {
  const categories = new Set<Category>();
  for (const check of lows) {
    for (const category of BOOST_CATEGORIES[check.id] ?? ['protein']) {
      categories.add(category);
    }
  }
  return CATEGORIES.filter((category) => categories.has(category));
}

function compositeBoostScore(food: FoodIngredient, lows: NutrientCheck[], recipe: Recipe): number {
  let score = 0;
  const failedIds = new Set(lows.map((check) => check.id));
  for (const check of lows) {
    const gapWeight = 1 - Math.min(Math.max(check.progress, 0), 1);
    score += gapWeight * nutrientPer1000Kcal(food, check.id);
  }
  const name = food.name;
  if (
    (failedIds.has('epaDha') || failedIds.has('iodine') || failedIds.has('vitD')) &&
    isFish(name)
  ) {
    score *= 1.8;
  }
  if (
    (failedIds.has('zinc') || failedIds.has('copper') || failedIds.has('choline')) &&
    (isOrgan(name) || isEgg(name))
  ) {
    score *= 1.6;
  }
  if (isMuscleMeat(name)) {
    if (recipeHasFish(recipe)) score *= 0.1;
    else if (muscleMeatCount(recipe) >= 2) score *= 0.15;
    else if (muscleMeatCount(recipe) >= 1) score *= 0.35;
  }
  if (isFish(name)) {
    if (recipeHasFish(recipe)) {
      score *= 0.05;
    } else if (/sardine/i.test(name)) {
      score *= 1.35;
    } else if (/salmon/i.test(name)) {
      score *= 1.15;
    } else if (/mackerel/i.test(name)) {
      score *= 0.85;
    }
  }
  return score;
}

function isAllowedBoostFood(
  food: FoodIngredient,
  recipe: Recipe,
  usedNames: Set<string>,
  excluded: string[],
  exceptName?: string,
): boolean {
  if ((food.caloriesPer100g || 0) <= 0) return false;
  if (excluded.includes(food.name)) return false;
  if (usedNames.has(food.name) && food.name !== exceptName) return false;
  const subtype = organSubtype(food.name);
  if (subtype && recipeOrganSubtypes(recipe, exceptName).has(subtype)) return false;
  if (isFish(food.name) && recipeHasFish(recipe)) {
    const fishRows = CATEGORIES.flatMap((category) => recipe.ingredients[category]).filter((row) =>
      isFish(row.name),
    );
    const onlyCurrentFish =
      exceptName &&
      fishRows.length === 1 &&
      fishRows[0]?.name === exceptName &&
      food.name !== exceptName;
    if (!onlyCurrentFish) return false;
  }
  return true;
}

function pickBestBoostFood(
  recipe: Recipe,
  lows: NutrientCheck[],
  excluded: string[],
): { food: FoodIngredient; category: Category; score: number } | null {
  const catalog = getIngredientCatalogOrThrow();
  const usedNames = recipeIngredientNames(recipe);
  const categories = candidateCategories(lows);
  let best: { food: FoodIngredient; category: Category; score: number } | null = null;
  for (const category of categories) {
    if (hasNutritionBoostInCategory(recipe, category)) continue;
    for (const food of catalog[category]) {
      if (!isAllowedBoostFood(food, recipe, usedNames, excluded)) continue;
      const score = compositeBoostScore(food, lows, recipe);
      if (score <= 0) continue;
      if (!best || score > best.score) {
        best = { food, category, score };
      }
    }
  }
  return best;
}

/**
 * Append one nutrition-targeted ingredient in a category that does not yet have
 * a boost. Returns null when every eligible category already has a boost or no
 * pick improves the gaps.
 */
export function tryAddNutritionBoost(
  recipe: Recipe,
  failedChecks: NutrientCheck[],
  totalMER: number,
  excluded: string[] = [],
): Recipe | null {
  if (boostCaloriesInRecipe(recipe) >= totalMER * MAX_BOOST_KCAL_FRACTION) return null;
  const lows = failedChecks
    .filter((check) => check.status === 'low')
    .sort((a, b) => a.progress - b.progress);
  if (lows.length === 0) return null;
  const pick = pickBestBoostFood(recipe, lows, excluded);
  if (!pick) return null;
  const boostKcal = round2(totalMER * BOOST_KCAL_FRACTION);
  const caloriesPer100g = pick.food.caloriesPer100g || 1;
  const grams = round2((boostKcal / caloriesPer100g) * 100);
  const row: RecipeIngredient = {
    name: pick.food.name,
    grams,
    calories: boostKcal,
    additional: true,
  };
  const next = cloneRecipe(recipe);
  next.ingredients[pick.category].push(row);
  return next;
}

export function isNutritionBoostRow(row: RecipeIngredient): boolean {
  return row.additional === true;
}

/** Remove one nutrition add without redistributing calories. */
export function removeNutritionBoost(recipe: Recipe, category: Category, name: string): Recipe {
  return {
    ...recipe,
    ingredients: {
      ...recipe.ingredients,
      [category]: recipe.ingredients[category].filter(
        (row) => !(row.additional && row.name === name),
      ),
    },
  };
}

function nutrientChecksForBoostSwap(recipe: Recipe, dogsWithMER: Dog[]): NutrientCheck[] {
  const assessment = assessRecipeNutrition(recipe, dogsWithMER);
  const failed = assessment.checks.filter((check) => check.status !== 'ok');
  const lows = failed.filter((check) => check.status === 'low');
  return lows.length > 0 ? lows : failed;
}

export interface BoostSwapCandidate {
  name: string;
  category: Category;
  score: number;
}

/** Nutrient labels still below target — used to explain boost swap recommendations. */
export function getBoostNutrientGaps(recipe: Recipe, dogsWithMER: Dog[]): string[] {
  return nutrientChecksForBoostSwap(recipe, dogsWithMER).map((check) => check.label);
}
/** Rank alternative boost ingredients across categories that can address current gaps. */
export function getBoostSwapCandidates(
  recipe: Recipe,
  category: Category,
  boostName: string,
  dogsWithMER: Dog[],
  excluded: string[] = [],
): BoostSwapCandidate[] {
  const catalog = getIngredientCatalogOrThrow();
  const usedNames = recipeIngredientNames(recipe);
  const checks = nutrientChecksForBoostSwap(recipe, dogsWithMER);
  const searchCategories = new Set<Category>([category, ...candidateCategories(checks)]);
  const ranked: BoostSwapCandidate[] = [];
  for (const searchCategory of CATEGORIES) {
    if (!searchCategories.has(searchCategory)) continue;
    if (searchCategory !== category && hasNutritionBoostInCategory(recipe, searchCategory)) {
      continue;
    }
    for (const food of catalog[searchCategory]) {
      if (food.name === boostName) continue;
      if (!isAllowedBoostFood(food, recipe, usedNames, excluded, boostName)) continue;
      const score = compositeBoostScore(food, checks, recipe);
      if (score <= 0) continue;
      ranked.push({ name: food.name, category: searchCategory, score });
    }
  }
  ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const seen = new Set<string>();
  return ranked.filter((entry) => {
    if (seen.has(entry.name)) return false;
    seen.add(entry.name);
    return true;
  });
}
