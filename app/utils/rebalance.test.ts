import { describe, expect, it, beforeAll } from 'vitest';
import { buildIngredientCatalog } from '../data/buildIngredientCatalog';
import { FOODS } from '../data/foods.generated';
import { setIngredientCatalog } from '../data/ingredientCatalogStore';
import { SUPPLEMENTS } from '../data/supplements';
import { DEFAULT_COUNTS, RECOMMENDED_RATIOS, CATEGORIES } from './constants';
import {
  calculateDailyCalories,
  createRecipe,
  getTotalMER,
  type Dog,
  type Recipe,
} from './recipeCalculator';
import { balanceRecipeMix } from './rebalance';
import {
  MAX_BOOSTS_PER_CATEGORY,
  countNutritionBoostsInCategory,
  getBoostSwapCandidates,
  stripNutritionBoosts,
  tryAddNutritionBoost,
} from './nutritionBoost';
import { assessRecipeNutrition } from './nutrition';
import { seededRandom } from './random';

const dogs: Dog[] = [
  { name: 'Jackson', weight: 30, activityMultiplier: 1.3 },
  { name: 'Joey', weight: 12, activityMultiplier: 1.0 },
].map((dog) => ({ ...dog, MER: calculateDailyCalories(dog) }));

beforeAll(() => {
  setIngredientCatalog(buildIngredientCatalog(FOODS, SUPPLEMENTS));
});

describe('nutrition boosts', () => {
  it('stripNutritionBoosts removes only additional rows', () => {
    const recipe = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(3),
    });
    recipe.ingredients.protein.push({
      name: 'Sardines (canned in water, no salt)',
      grams: 20,
      calories: 40,
      additional: true,
    });

    const stripped = stripNutritionBoosts(recipe);
    expect(stripped.ingredients.protein.some((row) => row.additional)).toBe(false);
    expect(stripped.ingredients.protein.some((row) => row.name.includes('Sardines'))).toBe(false);
  });

  it('balanceRecipeMix may add nutrition boosters without removing base picks', () => {
    const base = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(11),
      supplementOptions: {
        eggshell: true,
        rxEssentials: true,
        rxCanineMinerals: false,
        hempSeedOil: true,
        turmeric: false,
        ginger: false,
      },
    });
    const baseNames = new Set(
      CATEGORIES.flatMap((category) =>
        base.ingredients[category].map((row) => `${category}:${row.name}`),
      ),
    );

    const result = balanceRecipeMix(base, dogs, {
      eggshell: true,
      rxEssentials: true,
      rxCanineMinerals: false,
      hempSeedOil: true,
      turmeric: false,
      ginger: false,
    });

    expect(result).not.toBeNull();
    for (const key of baseNames) {
      const [category, name] = key.split(':') as [typeof CATEGORIES[number], string];
      expect(
        result!.recipe.ingredients[category].some((row) => row.name === name && !row.additional),
      ).toBe(true);
    }
    assertAtMostOneBoostPerCategory(result!.recipe);
  });

  it('prefers specialty boost over extra muscle meat when fish is already in the recipe', () => {
    const base = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(11),
      supplementOptions: {
        eggshell: true,
        rxEssentials: true,
        rxCanineMinerals: false,
        hempSeedOil: true,
        turmeric: false,
        ginger: false,
      },
    });
    if (!base.ingredients.protein.some((row) => row.name === 'Mackerel')) {
      base.ingredients.protein.push({
        name: 'Mackerel',
        grams: 50,
        calories: 100,
      });
    }

    const result = balanceRecipeMix(base, dogs, {
      eggshell: true,
      rxEssentials: true,
      rxCanineMinerals: false,
      hempSeedOil: true,
      turmeric: false,
      ginger: false,
    });

    expect(result).not.toBeNull();
    const boosts = CATEGORIES.flatMap((category) =>
      result!.recipe.ingredients[category].filter((row) => row.additional),
    );
    assertAtMostOneBoostPerCategory(result!.recipe);
    for (const boost of boosts) {
      expect(isMuscleMeat(boost.name)).toBe(false);
    }
  });

  it('does not add a second liver when beef liver is already in the recipe', () => {
    const base = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(11),
    });
    if (!base.ingredients.organs.some((row) => row.name === 'Beef Liver')) {
      base.ingredients.organs.push({
        name: 'Beef Liver',
        grams: 30,
        calories: 40,
        additional: false,
      });
    }

    const assessment = assessRecipeNutrition(base, dogs);
    const failed = assessment.checks.filter((check) => check.status !== 'ok');
    const boosted = tryAddNutritionBoost(base, failed, getTotalMER(dogs), []);
    if (!boosted) return;

    const added = CATEGORIES.flatMap((category) =>
      boosted.ingredients[category].filter((row) => row.additional),
    );
    for (const row of added) {
      expect(row.name).not.toMatch(/pork liver/i);
    }
  });

  it('does not add a second fish when fish is already in the recipe', () => {
    const base = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(11),
    });
    if (!base.ingredients.protein.some((row) => row.name === 'Sardines (canned in water, no salt)')) {
      base.ingredients.protein.push({
        name: 'Sardines (canned in water, no salt)',
        grams: 40,
        calories: 80,
        additional: false,
      });
    }

    const assessment = assessRecipeNutrition(base, dogs);
    const failed = assessment.checks.filter((check) => check.status !== 'ok');
    const boosted = tryAddNutritionBoost(base, failed, getTotalMER(dogs), []);
    if (!boosted) return;

    const added = CATEGORIES.flatMap((category) =>
      boosted.ingredients[category].filter((row) => row.additional),
    );
    for (const row of added) {
      expect(row.name).not.toMatch(/mackerel/i);
    }
  });

  it('ranks sardines ahead of mackerel for boost swaps when no fish is present', () => {
    const base = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(11),
    });
    base.ingredients.protein.push({
      name: 'Mackerel',
      grams: 20,
      calories: 40,
      additional: true,
    });

    const candidates = getBoostSwapCandidates(
      base,
      'protein',
      'Mackerel',
      dogs,
      [],
    );
    const sardineIndex = candidates.findIndex((name) => /sardine/i.test(name));
    const mackerelIndex = candidates.findIndex((name) => /^mackerel$/i.test(name));
    if (sardineIndex >= 0 && mackerelIndex >= 0) {
      expect(sardineIndex).toBeLessThan(mackerelIndex);
    }
  });
});

function assertAtMostOneBoostPerCategory(recipe: Recipe): void {
  for (const category of CATEGORIES) {
    expect(countNutritionBoostsInCategory(recipe, category)).toBeLessThanOrEqual(
      MAX_BOOSTS_PER_CATEGORY,
    );
  }
}

function isMuscleMeat(name: string): boolean {
  return /beef|bison|buffalo|turkey|chicken|duck|venison|pork|lamb|ground/i.test(name)
    && !/liver|heart|kidney|organ/i.test(name);
}
