// Single source of truth for the recipe categories and their metadata.
// Everything else (data, calculations, UI) derives category lists from here so
// there is exactly one place to change when categories are added or renamed.

export const CATEGORIES = [
  'protein',
  'organs',
  'fruits',
  'veggies',
  'carbs',
  'fats',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type CategoryRatios = Record<Category, number>;
export type CategoryCounts = Record<Category, number>;

// General starting-point ratios for a balanced adult homemade diet, expressed
// as a share of daily CALORIES (this tool splits by calories, not weight).
// Derived from BARF / raw-feeding guidelines (~70% muscle meat, ~5% liver,
// ~5% other organ, ~7% vegetables, ~1% fruit) adapted for a cooked diet, with a
// modest carbohydrate + fat allowance for energy. There is no single "correct"
// ratio, so these are a baseline to adjust from — always confirm with your vet.
export const RECOMMENDED_RATIOS: CategoryRatios = {
  protein: 0.7,
  organs: 0.05,
  fruits: 0.03,
  veggies: 0.07,
  carbs: 0.07,
  fats: 0.08,
};

export const RECOMMENDED_RANGES: Record<Category, string> = {
  protein: '50–80%',
  organs: '5–10%',
  fruits: '0–5%',
  veggies: '5–10%',
  carbs: '0–30%',
  fats: '5–15%',
};

export const DEFAULT_COUNTS: CategoryCounts = {
  protein: 1,
  organs: 1,
  fruits: 1,
  veggies: 1,
  carbs: 1,
  fats: 1,
};

// Maintenance Energy Requirement multipliers (× RER). These are conservative
// pet-dog activity levels; working/sport dogs can range far higher (2–8×).
// Sources: NRC 2006, WSAVA / Pet Nutrition Alliance MER factors.
export const ACTIVITY_LEVELS = [
  { value: 1.0, label: 'No exercise (1.0×)' },
  { value: 1.3, label: 'Light exercise (1.3×)' },
  { value: 1.6, label: 'Moderate exercise (1.6×)' },
  { value: 1.8, label: 'Heavy exercise (1.8×)' },
] as const;

// Nutrition science constants.
export const LB_PER_KG = 2.2046;
export const GRAMS_PER_LB = 453.592;

// Calcium density of the diet (mg calcium per kcal of food).
// NRC (2006) recommended allowance is 1.0 mg/kcal; AAFCO (2016) adult
// maintenance minimum is 1.25 mg/kcal — we use the AAFCO minimum.
export const CALCIUM_MG_PER_KCAL = 1.25;
