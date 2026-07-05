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
  it('uses g for powder supplements', () => {
    expect(suggestedShoppingMassUnit('Rx Essentials', 'lb')).toBe('g');
    expect(suggestedShoppingMassUnit('Rx Canine Minerals', 'lb')).toBe('g');
    expect(suggestedShoppingMassUnit('Kelp Powder', 'lb')).toBe('g');
    expect(suggestedShoppingMassUnit('Turmeric', 'lb')).toBe('g');
    expect(suggestedShoppingMassUnit('Ginger', 'lb')).toBe('g');
  });

  it('uses oz for liquid supplements in imperial mode', () => {
    expect(suggestedShoppingMassUnit('Fish Oil (EPA/DHA)', 'lb')).toBe('oz');
  });
});
