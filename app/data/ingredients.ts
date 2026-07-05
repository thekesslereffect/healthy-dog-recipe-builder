export type {
  FoodIngredient,
  FoodNutrients,
  Ingredient,
  IngredientDatabase,
  SupplementIngredient,
  SupplementNutrientsPerScoop,
} from './ingredientTypes';

export type { SupplementOptions, SupplementToggleId } from './supplements';
export {
  DEFAULT_SUPPLEMENT_OPTIONS,
  SUPPLEMENT_CATALOG,
  buildWeightDosedSupplements,
  canineMineralsScoopsPerDay,
  doseEggshellRow,
  doseSupplementGrams,
  getSupplementCatalogEntry,
  normalizeSupplementOptions,
  supplementCalciumMg,
} from './supplements';

export {
  findFoodByName,
  getAllFoodNames,
  getIngredientCatalogOrThrow,
  setIngredientCatalog,
  tryGetIngredientCatalog,
} from './ingredientCatalogStore';
