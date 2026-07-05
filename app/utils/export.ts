import { CATEGORIES } from './constants';
import {
  calculateMealPortions,
  calculateShoppingList,
  type Dog,
  type Recipe,
} from './recipeCalculator';

// Plain-text summary of a recipe, suitable for copying to the clipboard.
export function recipeToText(
  recipe: Recipe,
  numberOfDays: number,
  dogs: Dog[],
  mealsPerDay: number,
): string {
  const lines: string[] = [];
  lines.push('HEALTHY DOG RECIPE');
  lines.push('');
  lines.push('Daily Recipe');

  for (const category of CATEGORIES) {
    const items = recipe.ingredients[category];
    if (items.length === 0) continue;
    lines.push(`  ${capitalize(category)}:`);
    for (const item of items) {
      const suffix = item.additional ? ' (nutrition add)' : '';
      lines.push(`    - ${item.name}${suffix}: ${item.grams}g (${Math.round(item.calories)} cal)`);
    }
  }

  lines.push('  Supplements:');
  for (const supplement of recipe.ingredients.supplements) {
    lines.push(`    - ${supplement.name}: ${supplement.grams}g`);
  }
  lines.push(`  Total daily calories: ${Math.round(recipe.totalCalories)}`);
  lines.push('');

  lines.push(`Shopping List (${numberOfDays} days)`);
  for (const [name, amounts] of Object.entries(calculateShoppingList(recipe, numberOfDays))) {
    lines.push(`  - ${name}: ${Math.round(amounts.grams)}g`);
  }
  lines.push('');

  lines.push(`Meal Portions (${mealsPerDay} meals/day)`);
  const portions = calculateMealPortions(recipe, dogs, mealsPerDay);
  for (const [dogName, portion] of Object.entries(portions)) {
    lines.push(`  - ${dogName}: ${portion.dailyPortion}g/day, ${portion.mealPortion}g/meal`);
  }

  return lines.join('\n');
}

// CSV of the shopping list.
export function shoppingListToCsv(recipe: Recipe, numberOfDays: number): string {
  const rows: string[] = ['Ingredient,Grams,Days'];
  for (const [name, amounts] of Object.entries(calculateShoppingList(recipe, numberOfDays))) {
    rows.push(`${csvCell(name)},${Math.round(amounts.grams)},${numberOfDays}`);
  }
  return rows.join('\n');
}

export function downloadTextFile(filename: string, contents: string, mime = 'text/plain') {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
