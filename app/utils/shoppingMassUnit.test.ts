import { describe, expect, it, beforeAll } from 'vitest';
import { buildIngredientCatalog } from '../data/buildIngredientCatalog';
import { FOODS } from '../data/foods.generated';
import { setIngredientCatalog } from '../data/ingredientCatalogStore';
import { SUPPLEMENTS } from '../data/supplements';
import { suggestedShoppingMassUnit } from './shoppingMassUnit';

beforeAll(() => {
  setIngredientCatalog(buildIngredientCatalog(FOODS, SUPPLEMENTS));
});

describe('suggestedShoppingMassUnit', () => {
  it('uses lb for muscle meat in imperial mode', () => {
    expect(suggestedShoppingMassUnit('Chicken (breast, skinless)', 'lb')).toBe('lb');
    expect(suggestedShoppingMassUnit('Beef Liver', 'lb')).toBe('lb');
  });
  it('uses kg for bulk foods in metric mode', () => {
    expect(suggestedShoppingMassUnit('Chicken (breast, skinless)', 'kg')).toBe('kg');
    expect(suggestedShoppingMassUnit('Brown Rice (cooked)', 'kg')).toBe('kg');
  });
  it('uses oz for oils and canned fish', () => {
    expect(suggestedShoppingMassUnit('Olive Oil', 'lb')).toBe('oz');
    expect(suggestedShoppingMassUnit('Sardines (canned in water, no salt)', 'lb')).toBe('oz');
  });
  it('uses oz for supplements', () => {
    expect(suggestedShoppingMassUnit('Rx Essentials', 'lb')).toBe('oz');
  });
});
