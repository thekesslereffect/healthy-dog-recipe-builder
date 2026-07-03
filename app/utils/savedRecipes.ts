import type { Category, CategoryCounts, CategoryRatios } from './constants';
import type { Dog, Recipe } from './recipeCalculator';

// A full snapshot of a build so it can be reloaded and edited later.
export interface SavedRecipe {
  id: string;
  name: string;
  savedAt: number;
  dogs: Dog[];
  ratios: CategoryRatios;
  counts: CategoryCounts;
  numberOfDays: number;
  mealsPerDay: number;
  locked: Partial<Record<Category, string[]>>;
  recipe: Recipe;
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatSavedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
