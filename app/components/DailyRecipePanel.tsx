import { useState } from 'react';
import { CATEGORIES, type Category, type CategoryRatios } from '../utils/constants';
import type { Recipe } from '../utils/recipeCalculator';
import { ingredients } from '../data/ingredients';
import { card, groupLabel, iconBtn, sectionTitle } from './ui';
import { LockIcon, SwapIcon, UnlockIcon } from './icons';
import { IngredientPicker } from './IngredientPicker';

interface DailyRecipePanelProps {
  recipe: Recipe;
  ratios: CategoryRatios;
  locked: Partial<Record<Category, string[]>>;
  excluded: string[];
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
}

export function DailyRecipePanel({
  recipe,
  ratios,
  locked,
  excluded,
  onToggleLock,
  onSwap,
}: DailyRecipePanelProps) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section className={card}>
      <div className="mb-4 flex items-center justify-between gap-3 print:mb-2">
        <div>
          <h2 className={`${sectionTitle} print:text-lg`}>Daily Recipe</h2>
          <p className="mt-0.5 text-sm text-zinc-500 print:hidden">
            Swap ingredients if the store is out — lock to keep on regenerate
          </p>
        </div>
      </div>

      <div className="space-y-5 print:space-y-1">
        {CATEGORIES.map((category) => {
          const items = recipe.ingredients[category];
          if (items.length === 0) return null;
          const lockedNames = locked[category] ?? [];

          return (
            <div key={category} className="print:space-y-0.5">
              <h3 className={`${groupLabel} mb-2 flex items-baseline gap-1.5 print:mb-0.5 print:text-[10px]`}>
                {category}
                <span className="font-medium normal-case tracking-normal text-zinc-400">
                  {Math.round((ratios[category] ?? 0) * 100)}%
                </span>
              </h3>
              <div className="space-y-1 print:space-y-0.5">
                {items.map((ingredient) => {
                  const isLocked = lockedNames.includes(ingredient.name);
                  const editKey = `${category}:${ingredient.name}`;
                  const isEditing = editing === editKey;

                  if (isEditing) {
                    const usedNames = new Set(items.map((i) => i.name));
                    const options = ingredients[category]
                      .filter((i) => (i.caloriesPer100g || 0) > 0)
                      .map((i) => i.name)
                      .filter((n) => !excluded.includes(n) && !usedNames.has(n));
                    return (
                      <div key={ingredient.name} className="print:hidden">
                        <IngredientPicker
                          current={ingredient.name}
                          suggestions={options}
                          onSelect={(name) => {
                            onSwap(category, ingredient.name, name);
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={ingredient.name}
                      className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 hover:bg-zinc-50 print:px-0 print:py-0 print:hover:bg-transparent"
                    >
                      <button
                        type="button"
                        onClick={() => setEditing(editKey)}
                        title="Swap this ingredient"
                        className="group flex min-w-0 items-center gap-1.5 text-left text-sm text-black print:cursor-auto print:text-xs"
                      >
                        <span className="truncate decoration-zinc-300 decoration-dotted underline-offset-2 group-hover:underline print:no-underline">
                          {ingredient.name}
                        </span>
                        {isLocked && (
                          <LockIcon width={12} height={12} className="shrink-0 text-zinc-400 print:hidden" />
                        )}
                      </button>
                      <span className="flex shrink-0 items-center gap-1">
                        <span className="text-right text-sm tabular-nums text-black print:text-xs">
                          <span className="font-medium">{ingredient.grams}g</span>
                          <span className="ml-2 text-zinc-400 print:hidden">
                            {Math.round(ingredient.calories)} cal
                          </span>
                        </span>
                        <button
                          type="button"
                          aria-label={`Swap ${ingredient.name}`}
                          title="Swap this ingredient"
                          onClick={() => setEditing(editKey)}
                          className={`${iconBtn} print:hidden`}
                        >
                          <SwapIcon width={14} height={14} />
                        </button>
                        <button
                          type="button"
                          aria-pressed={isLocked}
                          aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${ingredient.name}`}
                          title={isLocked ? 'Locked — kept when regenerating' : 'Lock this ingredient'}
                          onClick={() => onToggleLock(category, ingredient.name)}
                          className={`${iconBtn} print:hidden ${isLocked ? 'text-black' : ''}`}
                        >
                          {isLocked ? (
                            <LockIcon width={14} height={14} />
                          ) : (
                            <UnlockIcon width={14} height={14} />
                          )}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 print:mt-2">
        <h3 className={`${groupLabel} mb-2 block print:mb-0.5 print:text-[10px]`}>Supplements</h3>
        <div className="space-y-1.5 print:space-y-0.5">
          {recipe.ingredients.supplements.map((supplement) => {
            const scoops = supplement.gramsPerScoop
              ? Math.round((supplement.grams / supplement.gramsPerScoop) * 10) / 10
              : null;
            return (
              <div key={supplement.name} className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-black print:text-xs">{supplement.name}</span>
                <span className="shrink-0 text-right text-sm tabular-nums text-black print:text-xs">
                  <span className="font-medium">{supplement.grams}g</span>
                  {scoops !== null && (
                    <span className="ml-2 text-zinc-400">
                      {scoops} scoop{scoops === 1 ? '' : 's'} · ⅓ tsp
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 print:mt-2 print:pt-1">
        <span className="text-base font-semibold text-black print:text-sm">Total Daily Calories</span>
        <span className="text-base font-bold tabular-nums text-black print:text-sm">
          {Math.round(recipe.totalCalories)}
        </span>
      </div>
    </section>
  );
}
