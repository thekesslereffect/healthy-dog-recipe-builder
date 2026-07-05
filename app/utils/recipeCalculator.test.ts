import { describe, expect, it } from 'vitest';
import { buildIngredientCatalog } from '../data/buildIngredientCatalog';
import { FOODS } from '../data/foods.generated';
import { setIngredientCatalog } from '../data/ingredientCatalogStore';
import { SUPPLEMENTS } from '../data/supplements';
import {
  CALCIUM_MG_PER_KCAL,
  DEFAULT_COUNTS,
  RECOMMENDED_RATIOS,
  LB_PER_KG,
} from './constants';
import {
  calculateDailyCalories,
  calculateMealPortions,
  calculateShoppingList,
  createRecipe,
  getTotalMER,
  type Dog,
} from './recipeCalculator';
import { seededRandom } from './random';
import { sumRecipeNutrients } from './nutrition';

const withMER = (dog: Dog): Dog => ({ ...dog, MER: calculateDailyCalories(dog) });

setIngredientCatalog(buildIngredientCatalog(FOODS, SUPPLEMENTS));

describe('energy requirements (RER / MER)', () => {
  it('computes RER = 70 × kg^0.75 and applies the activity multiplier', () => {
    const dog: Dog = { name: 'A', weight: 30, activityMultiplier: 1.0 };
    const kg = 30 / LB_PER_KG;
    const rer = 70 * Math.pow(kg, 0.75);
    expect(calculateDailyCalories(dog)).toBeCloseTo(rer, 6);
    expect(calculateDailyCalories({ ...dog, activityMultiplier: 1.6 })).toBeCloseTo(rer * 1.6, 6);
  });

  it('sums MER across dogs', () => {
    const dogs = [
      withMER({ name: 'A', weight: 30, activityMultiplier: 1.3 }),
      withMER({ name: 'B', weight: 12, activityMultiplier: 1.0 }),
    ];
    expect(getTotalMER(dogs)).toBeCloseTo((dogs[0].MER || 0) + (dogs[1].MER || 0), 6);
  });
});

describe('createRecipe', () => {
  const dogs = [
    withMER({ name: 'Jackson', weight: 30, activityMultiplier: 1.3 }),
    withMER({ name: 'Joey', weight: 12, activityMultiplier: 1.0 }),
  ];
  const totalMER = getTotalMER(dogs);

  it('doses eggshell so total calcium meets the AAFCO minimum (1.25 mg/kcal)', () => {
    const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(1),
      supplementOptions: {
        eggshell: true,
        rxEssentials: true,
        rxCanineMinerals: false,
        hempSeedOil: true,
        turmeric: false,
        ginger: false,
      },
    });
    const eggshell = recipe.ingredients.supplements.find((s) =>
      s.name.startsWith('Eggshell'),
    );
    expect(eggshell).toBeDefined();
    expect((eggshell?.grams ?? 0)).toBeGreaterThan(0);
    const totals = sumRecipeNutrients(recipe);
    const minCalciumMg = Math.round(totalMER * CALCIUM_MG_PER_KCAL);
    expect(totals.calciumMg).toBeGreaterThanOrEqual(minCalciumMg - 2);
  });

  it('total calories are approximately the target MER', () => {
    const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(7),
    });
    expect(recipe.totalCalories).toBeGreaterThan(totalMER * 0.98);
    expect(recipe.totalCalories).toBeLessThan(totalMER * 1.02);
  });

  it('is deterministic for a given seed', () => {
    const a = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(42),
    });
    const b = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(42),
    });
    expect(a.ingredients.protein.map((i) => i.name)).toEqual(
      b.ingredients.protein.map((i) => i.name),
    );
  });

  it('never selects an excluded ingredient', () => {
    const counts = { ...DEFAULT_COUNTS, protein: 4 };
    const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, counts, {
      excluded: ['Beef (ground, 85% lean)', 'Mackerel'],
      random: seededRandom(3),
    });
    const names = recipe.ingredients.protein.map((i) => i.name);
    expect(names).not.toContain('Beef (ground, 85% lean)');
    expect(names).not.toContain('Mackerel');
  });

  it('always keeps locked ingredients across rerolls', () => {
    const counts = { ...DEFAULT_COUNTS, protein: 2 };
    for (let seed = 0; seed < 5; seed++) {
      const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, counts, {
        locked: { protein: ['Venison'] },
        random: seededRandom(seed),
      });
      expect(recipe.ingredients.protein.map((i) => i.name)).toContain('Venison');
    }
  });

  it('honors a zero count / zero ratio by leaving the category empty', () => {
    const counts = { ...DEFAULT_COUNTS, fruits: 0 };
    const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, counts, {
      random: seededRandom(1),
    });
    expect(recipe.ingredients.fruits).toHaveLength(0);
  });

  it('honors supplement toggles — turmeric off by default', () => {
    const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(1),
      supplementOptions: {
        eggshell: true,
        rxEssentials: true,
        rxCanineMinerals: true,
        hempSeedOil: true,
        turmeric: false,
        ginger: false,
      },
    });
    const names = recipe.ingredients.supplements.map((s) => s.name);
    expect(names).not.toContain('Turmeric');
    expect(names).not.toContain('Ginger');
    expect(names).toContain('Rx Essentials');
  });

  it('omits eggshell when toggled off', () => {
    const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(1),
      supplementOptions: {
        eggshell: false,
        rxEssentials: true,
        rxCanineMinerals: true,
        hempSeedOil: true,
        turmeric: false,
        ginger: false,
      },
    });
    const names = recipe.ingredients.supplements.map((s) => s.name);
    expect(names.some((n) => n.startsWith('Eggshell'))).toBe(false);
  });

  it('does not list eggshell at 0 g when canine minerals cover calcium', () => {
    const recipe = createRecipe(totalMER, dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(1),
      supplementOptions: {
        eggshell: true,
        rxEssentials: true,
        rxCanineMinerals: true,
        hempSeedOil: true,
        turmeric: false,
        ginger: false,
      },
    });
    const eggshell = recipe.ingredients.supplements.find((s) => s.name.startsWith('Eggshell'));
    if (eggshell) {
      expect(eggshell.grams).toBeGreaterThan(0);
    }
  });

  it('includes egg and sardine in the protein pool', async () => {
    const { getAllFoodNames } = await import('../data/ingredients');
    expect(getAllFoodNames()).toContain('Egg (whole, raw)');
    expect(getAllFoodNames()).toContain('Sardines (canned in water, no salt)');
  });
});

describe('shopping list', () => {
  it('scales daily grams by the number of days', () => {
    const dogs = [withMER({ name: 'A', weight: 30, activityMultiplier: 1.3 })];
    const recipe = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
      random: seededRandom(9),
    });
    const oneDay = calculateShoppingList(recipe, 1);
    const sevenDays = calculateShoppingList(recipe, 7);
    for (const name of Object.keys(oneDay)) {
      expect(sevenDays[name].grams).toBeCloseTo(oneDay[name].grams * 7, 4);
    }
  });
});

describe('meal portions', () => {
  const dogs = [
    withMER({ name: 'Jackson', weight: 30, activityMultiplier: 1.3 }),
    withMER({ name: 'Joey', weight: 12, activityMultiplier: 1.0 }),
  ];
  const recipe = createRecipe(getTotalMER(dogs), dogs, RECOMMENDED_RATIOS, DEFAULT_COUNTS, {
    random: seededRandom(5),
  });

  it('splits the daily portion evenly across meals', () => {
    const twoMeals = calculateMealPortions(recipe, dogs, 2);
    for (const portion of Object.values(twoMeals)) {
      expect(portion.mealPortion).toBeCloseTo(portion.dailyPortion / 2, 1);
    }
    const threeMeals = calculateMealPortions(recipe, dogs, 3);
    for (const portion of Object.values(threeMeals)) {
      expect(portion.mealPortion).toBeCloseTo(portion.dailyPortion / 3, 1);
    }
  });

  it('energy shares add up to ~100%', () => {
    const portions = calculateMealPortions(recipe, dogs, 2);
    const total = Object.values(portions).reduce((sum, p) => sum + p.percentage, 0);
    expect(total).toBeGreaterThanOrEqual(99);
    expect(total).toBeLessThanOrEqual(101);
  });
});
