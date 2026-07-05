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

// Maintenance Energy Requirement multipliers (× RER), aligned with the canine
// life-stage factors in the AAHA 2021 Nutrition & Weight Management Guidelines
// and the Pet Nutrition Alliance MER table:
//   weight loss/inactive 1.0 · neutered adult 1.4–1.6 · intact adult 1.6–1.8 ·
//   light work 1.6–2.0 · moderate work 2.0–5.0 · heavy work 5.0–11.0.
// These estimates can be off by ±30% for any individual dog, so adjust to keep
// a healthy body condition score. Hard-working/sport dogs exceed this list.
export const ACTIVITY_LEVELS = [
  { value: 1.0, label: 'Inactive / weight loss (1.0×)' },
  { value: 1.3, label: 'Low activity (1.3×)' },
  { value: 1.6, label: 'Typical · neutered adult (1.6×)' },
  { value: 1.8, label: 'Active · intact adult (1.8×)' },
  { value: 2.0, label: 'Very active / light work (2.0×)' },
] as const;

// Nutrition science constants.
export const LB_PER_KG = 2.2046;
export const GRAMS_PER_LB = 453.592;

// Calcium density of the diet (mg calcium per kcal of food).
// NRC (2006) recommended allowance is 1.0 mg/kcal; AAFCO (2016) adult
// maintenance minimum is 1.25 mg/kcal — we use the AAFCO minimum.
export const CALCIUM_MG_PER_KCAL = 1.25;

/**
 * AAFCO Dog Food Nutrient Profiles (2016) — adult maintenance minimums,
 * expressed per 1,000 kcal of metabolizable energy. Used only as a screening
 * check against the daily recipe total, not a complete diet analysis.
 */
export const AAFCO_ADULT_PER_1000_KCAL = {
  proteinG: 45,
  fatG: 13.8,
  calciumMg: 1250,
  phosphorusMg: 1000,
  /** Acceptable Ca:P ratio range (AAFCO). */
  caPRatioMin: 1,
  caPRatioMax: 2,
} as const;

/**
 * NRC (2006) adult maintenance recommended allowances per 1,000 kcal ME.
 * Used for micronutrient screening beyond AAFCO macro minerals.
 */
export const NRC_ADULT_PER_1000_KCAL = {
  zincMg: 15,
  copperMg: 1.5,
  iodineMcg: 220,
  /** 3.4 µg cholecalciferol ≈ 136 IU. */
  vitaminDIU: 136,
  vitaminEMg: 7.5,
  cholineMg: 425,
  /** Combined EPA + DHA. */
  epaDhaMg: 110,
} as const;
