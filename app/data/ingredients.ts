import type { Category } from '../utils/constants';

export interface Ingredient {
  name: string;
  /** kcal per 100g. */
  caloriesPer100g: number;
  /** Supplement dose, grams per lb of body weight per day. */
  gramsPerPoundPerDay?: number;
  /** Grams per measuring scoop, for supplements sold by the scoop. */
  gramsPerScoop?: number;
  /** mg of elemental calcium per gram, for calcium supplements. */
  calciumMgPerGram?: number;
  /** Provenance / basis of the calorie value, for auditing. */
  source?: string;
}

export type IngredientDatabase = Record<Category, Ingredient[]> & {
  supplements: Ingredient[];
};

// Calorie values are kcal per 100g. Meats, organs, fish, produce and oils use
// USDA FoodData Central RAW values (you buy and weigh these raw), so the whole
// database is on a consistent basis. Grains are the exception and use COOKED
// values (dogs eat them cooked) and are labelled "(cooked)".
export const ingredients: IngredientDatabase = {
  protein: [
    { name: 'Beef (ground, 85% lean)', caloriesPer100g: 215, source: 'USDA FDC, raw' },
    { name: 'Beef (sirloin steak)', caloriesPer100g: 201, source: 'USDA FDC, raw' },
    { name: 'Turkey (ground, 85% lean)', caloriesPer100g: 213, source: 'USDA FDC, raw' },
    { name: 'Turkey (breast, skinless)', caloriesPer100g: 114, source: 'USDA FDC, raw' },
    { name: 'Duck (meat without skin)', caloriesPer100g: 185, source: 'USDA FDC, raw' },
    { name: 'Pork (lean cuts)', caloriesPer100g: 143, source: 'USDA FDC, raw (loin)' },
    { name: 'Venison', caloriesPer100g: 158, source: 'USDA FDC, raw (ground)' },
    { name: 'Buffalo/Bison', caloriesPer100g: 146, source: 'USDA FDC, raw (ground)' },
    { name: 'Tuna (canned in water)', caloriesPer100g: 116, source: 'USDA FDC, drained' },
    { name: 'Tilapia', caloriesPer100g: 96, source: 'USDA FDC, raw' },
    { name: 'Trout', caloriesPer100g: 141, source: 'USDA FDC, raw' },
    { name: 'Mackerel', caloriesPer100g: 205, source: 'USDA FDC, raw (Atlantic)' },
  ],

  organs: [
    { name: 'Pork Heart', caloriesPer100g: 118, source: 'USDA FDC, raw' },
    { name: 'Pork Liver', caloriesPer100g: 134, source: 'USDA FDC, raw' },
    { name: 'Pork Kidneys', caloriesPer100g: 100, source: 'USDA FDC, raw' },
    { name: 'Beef Liver', caloriesPer100g: 135, source: 'USDA FDC, raw' },
    { name: 'Beef Kidneys', caloriesPer100g: 99, source: 'USDA FDC, raw' },
  ],

  carbs: [
    { name: 'White Rice (cooked)', caloriesPer100g: 130, source: 'USDA FDC, cooked' },
    { name: 'Quinoa (cooked)', caloriesPer100g: 120, source: 'USDA FDC, cooked' },
  ],

  fruits: [
    { name: 'Apple', caloriesPer100g: 52, source: 'USDA FDC, raw' },
    { name: 'Blueberry', caloriesPer100g: 57, source: 'USDA FDC, raw' },
    { name: 'Strawberries', caloriesPer100g: 32, source: 'USDA FDC, raw' },
    { name: 'Watermelon', caloriesPer100g: 30, source: 'USDA FDC, raw' },
  ],

  veggies: [
    { name: 'Broccoli', caloriesPer100g: 34, source: 'USDA FDC, raw' },
    { name: 'Brussels Sprouts', caloriesPer100g: 43, source: 'USDA FDC, raw' },
    { name: 'Cabbage', caloriesPer100g: 25, source: 'USDA FDC, raw' },
    { name: 'Carrots', caloriesPer100g: 41, source: 'USDA FDC, raw' },
    { name: 'Cauliflower', caloriesPer100g: 25, source: 'USDA FDC, raw' },
    { name: 'Celery', caloriesPer100g: 14, source: 'USDA FDC, raw' },
    { name: 'Collard Greens', caloriesPer100g: 32, source: 'USDA FDC, raw' },
    { name: 'Cucumber', caloriesPer100g: 16, source: 'USDA FDC, raw' },
    { name: 'Green Beans', caloriesPer100g: 31, source: 'USDA FDC, raw' },
    { name: 'Green Peas', caloriesPer100g: 81, source: 'USDA FDC, raw' },
    { name: 'Kale', caloriesPer100g: 49, source: 'USDA FDC, raw' },
    { name: 'Spinach', caloriesPer100g: 23, source: 'USDA FDC, raw' },
    { name: 'Zucchini', caloriesPer100g: 17, source: 'USDA FDC, raw' },
    { name: 'Summer Squash', caloriesPer100g: 16, source: 'USDA FDC, raw' },
    { name: 'Winter Squash', caloriesPer100g: 39, source: 'USDA FDC, raw' },
    { name: 'Bok Choy', caloriesPer100g: 13, source: 'USDA FDC, raw' },
  ],

  fats: [
    { name: 'Olive Oil', caloriesPer100g: 884, source: 'USDA FDC' },
    { name: 'Coconut Oil', caloriesPer100g: 862, source: 'USDA FDC' },
  ],

  supplements: [
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
      caloriesPer100g: 0.0, // negligible calories
      gramsPerPoundPerDay: 0.0, // dosed from calcium need, not body weight
      gramsPerScoop: 1.9, // 1/3 teaspoon ~= 1.9g
      calciumMgPerGram: 380, // eggshell is ~38% elemental calcium => ~380 mg/g
      source: 'Vet nutrition sources (~38% Ca)',
    },
  ],
};
