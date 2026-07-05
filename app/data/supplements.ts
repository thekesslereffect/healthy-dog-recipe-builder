import type { SupplementIngredient, SupplementNutrientsPerScoop } from './ingredientTypes';

import { AAFCO_ADULT_PER_1000_KCAL, CALCIUM_MG_PER_KCAL } from '../utils/constants';

export type { SupplementNutrientsPerScoop } from './ingredientTypes';

/** Row added to a daily recipe for a supplement. */
export interface SupplementRow {
  name: string;
  grams: number;
  calories: number;
  gramsPerScoop?: number | null;
}

export type SupplementToggleId =
  | 'eggshell'
  | 'rxEssentials'
  | 'rxCanineMinerals'
  | 'hempSeedOil'
  | 'turmeric'
  | 'ginger';

export interface SupplementOptions {
  /** Auto-dosed for calcium / Ca:P balance after food and other supplements. */
  eggshell: boolean;
  rxEssentials: boolean;
  /** Recommended with Rx Essentials for home-prepared diets (Rx Vitamins). */
  rxCanineMinerals: boolean;
  hempSeedOil: boolean;
  /** Optional — not required for nutritional balance. */
  turmeric: boolean;
  /** Optional — not required for nutritional balance. */
  ginger: boolean;
}

export const DEFAULT_SUPPLEMENT_OPTIONS: SupplementOptions = {
  eggshell: true,
  rxEssentials: true,
  rxCanineMinerals: true,
  hempSeedOil: true,
  turmeric: false,
  ginger: false,
};

export interface SupplementCatalogEntry extends SupplementIngredient {
  id: SupplementToggleId;
  /** Shown in the supplements UI. */
  toggleable?: boolean;
  /** When set, this supplement is only offered if the dependency toggle is on. */
  requires?: SupplementToggleId;
  nutrientsPerScoop?: SupplementNutrientsPerScoop;
  description?: string;
}

/** Rx Essentials — per 1 tsp (5 g) scoop. Source: Rx Vitamins guaranteed analysis. */
const RX_ESSENTIALS_PER_SCOOP: SupplementNutrientsPerScoop = {
  vitaminDIU: 75,
  vitaminEMg: 10,
  zincMg: 1.5,
  copperMg: 0.01,
  manganeseMg: 1,
  iodineMcg: 60,
  seleniumMcg: 5,
  ironMg: 0.25,
  calciumMg: 75,
};

/** Canine Minerals — per 1/2 tsp scoop. Source: Rx Vitamins / Drugs.com label. */
const CANINE_MINERALS_PER_SCOOP: SupplementNutrientsPerScoop = {
  calciumMg: 500,
  ironMg: 0.77,
  manganeseMg: 0.08,
  phosphorusMg: 0.07,
};

export const SUPPLEMENT_CATALOG: SupplementCatalogEntry[] = [
  {
    id: 'eggshell',
    name: 'Eggshell Powder (Calcium)',
    toggleable: true,
    caloriesPer100g: 0,
    gramsPerScoop: 1.9,
    calciumMgPerGram: 380,
    source: 'Vet nutrition sources (~38% Ca)',
    description:
      'Balances calcium and Ca:P after food. Dosed to the remaining need — hidden when other supplements already cover it.',
  },
  {
    id: 'rxEssentials',
    name: 'Rx Essentials',
    toggleable: true,
    caloriesPer100g: 500,
    gramsPerPoundPerDay: 0.1,
    gramsPerScoop: 5,
    nutrientsPerScoop: RX_ESSENTIALS_PER_SCOOP,
    source: 'Rx Vitamins guaranteed analysis',
    description: 'Daily vitamin & trace-mineral premix for home-prepared diets.',
  },
  {
    id: 'rxCanineMinerals',
    name: 'Rx Canine Minerals',
    toggleable: true,
    requires: 'rxEssentials',
    caloriesPer100g: 0,
    gramsPerScoop: 2.5,
    nutrientsPerScoop: CANINE_MINERALS_PER_SCOOP,
    source: 'Rx Vitamins guaranteed analysis (1/2 tsp scoop)',
    description:
      'Macro-mineral blend (calcium, magnesium) — Rx Vitamins recommends pairing with Rx Essentials on homemade diets.',
  },
  {
    id: 'hempSeedOil',
    name: 'Hemp Seed Oil',
    toggleable: true,
    caloriesPer100g: 886,
    gramsPerPoundPerDay: 0.15,
    fatGPer100g: 100,
    source: 'USDA FDC (hemp/flax oils ~886)',
    description: 'Plant omega-3 (ALA); oily fish still covers EPA/DHA best.',
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    toggleable: true,
    caloriesPer100g: 354,
    gramsPerPoundPerDay: 0.015,
    source: 'USDA FDC, ground',
    description:
      'Optional wellness spice — not a required nutrient. Some vets suggest intermittent use only.',
  },
  {
    id: 'ginger',
    name: 'Ginger',
    toggleable: true,
    caloriesPer100g: 335,
    gramsPerPoundPerDay: 0.015,
    source: 'USDA FDC, ground',
    description: 'Optional digestive support — not a required nutrient.',
  },
];

/** Legacy export — full catalog list for lookups. */
export const SUPPLEMENTS: SupplementIngredient[] = SUPPLEMENT_CATALOG.map(
  ({ id: _id, toggleable: _t, requires: _r, nutrientsPerScoop: _n, description: _d, ...rest }) =>
    rest,
);

export function getSupplementCatalogEntry(name: string): SupplementCatalogEntry | undefined {
  return SUPPLEMENT_CATALOG.find((s) => s.name === name);
}

/** Manufacturer weight-tier dosing for Canine Minerals (total household weight). */
export function canineMineralsScoopsPerDay(totalWeightLbs: number): number {
  if (totalWeightLbs <= 5) return 0.5;
  if (totalWeightLbs <= 15) return 1;
  if (totalWeightLbs <= 25) return 1.5;
  if (totalWeightLbs <= 35) return 2;
  if (totalWeightLbs <= 60) return 2.5;
  if (totalWeightLbs <= 85) return 3;
  if (totalWeightLbs <= 120) return 3.5;
  return 4;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isEnabled(entry: SupplementCatalogEntry, options: SupplementOptions): boolean {
  if (!entry.toggleable || !entry.id) return false;
  if (entry.requires && !options[entry.requires]) return false;
  return options[entry.id];
}

/** Daily grams for a weight-dosed or scoop-dosed supplement. */
export function doseSupplementGrams(
  entry: SupplementCatalogEntry,
  totalDogWeightLbs: number,
): number {
  if (entry.id === 'rxCanineMinerals') {
    const scoops = canineMineralsScoopsPerDay(totalDogWeightLbs);
    return round2(scoops * (entry.gramsPerScoop || 0));
  }
  return round2(totalDogWeightLbs * (entry.gramsPerPoundPerDay || 0));
}

/** Build weight-/scoop-dosed supplement rows (excludes auto-dosed eggshell). */
export function buildWeightDosedSupplements(
  totalDogWeightLbs: number,
  options: SupplementOptions,
): SupplementRow[] {
  const rows: SupplementRow[] = [];
  for (const entry of SUPPLEMENT_CATALOG) {
    if (entry.id === 'eggshell') continue;
    if (!isEnabled(entry, options)) continue;

    const grams = doseSupplementGrams(entry, totalDogWeightLbs);
    if (grams <= 0) continue;

    const calories = round2((grams * (entry.caloriesPer100g || 0)) / 100);
    rows.push({
      name: entry.name,
      grams,
      calories,
      gramsPerScoop: entry.gramsPerScoop || null,
    });
  }
  return rows;
}

/** Sum calcium (mg) from enabled supplements except eggshell. */
export function supplementCalciumMg(
  totalDogWeightLbs: number,
  options: SupplementOptions,
): number {
  let calciumMg = 0;
  for (const entry of SUPPLEMENT_CATALOG) {
    if (entry.id === 'eggshell' || !isEnabled(entry, options)) continue;
    const grams = doseSupplementGrams(entry, totalDogWeightLbs);
    if (entry.calciumMgPerGram) {
      calciumMg += grams * entry.calciumMgPerGram;
    }
    if (entry.nutrientsPerScoop && entry.gramsPerScoop) {
      const scoops = grams / entry.gramsPerScoop;
      calciumMg += scoops * (entry.nutrientsPerScoop.calciumMg || 0);
    }
  }
  return calciumMg;
}

/**
 * Dose eggshell for the remaining calcium / Ca:P gap after food and other supplements.
 * Returns null when toggled off or when no additional eggshell is needed.
 */
export function doseEggshellRow(
  totalMER: number,
  foodCalciumMg: number,
  foodPhosphorusMg: number,
  extraCalciumMg: number,
  options: SupplementOptions,
): SupplementRow | null {
  if (!normalizeSupplementOptions(options).eggshell) return null;

  const eggshell = getSupplementCatalogEntry('Eggshell Powder (Calcium)');
  if (!eggshell?.calciumMgPerGram) return null;

  const aafcoCalciumMg = Math.round(totalMER * CALCIUM_MG_PER_KCAL);
  const targetCalciumMg = Math.max(
    aafcoCalciumMg,
    foodPhosphorusMg * AAFCO_ADULT_PER_1000_KCAL.caPRatioMin,
  );
  const eggshellCalciumMg = Math.max(0, targetCalciumMg - foodCalciumMg - extraCalciumMg);
  const eggshellGrams = eggshellCalciumMg / eggshell.calciumMgPerGram;
  if (eggshellGrams < 0.01) return null;

  return {
    name: eggshell.name,
    grams: round2(eggshellGrams),
    calories: round2((eggshellGrams * (eggshell.caloriesPer100g || 0)) / 100),
    gramsPerScoop: eggshell.gramsPerScoop || null,
  };
}

export function normalizeSupplementOptions(
  options: Partial<SupplementOptions> | SupplementOptions,
): SupplementOptions {
  const next: SupplementOptions = { ...DEFAULT_SUPPLEMENT_OPTIONS, ...options };
  if (!next.rxEssentials) {
    next.rxCanineMinerals = false;
  }
  return next;
}
