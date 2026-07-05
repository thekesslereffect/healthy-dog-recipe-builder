import { useMemo, useState } from 'react';
import { CATEGORIES, type Category, type CategoryRatios } from '../utils/constants';
import type { Recipe } from '../utils/recipeCalculator';
import { getIngredientCatalogOrThrow } from '../data/ingredients';
import { isNutritionBoostRow } from '../utils/nutritionBoost';
import { groupLabel, iconBtn } from './ui';
import { ArrowLeftRight, Lock, LockOpen } from 'lucide-react';
import { IngredientPicker } from './IngredientPicker';

interface DailyRecipePanelProps {
  recipe: Recipe;
  ratios: CategoryRatios;
  locked: Partial<Record<Category, string[]>>;
  excluded: string[];
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
  /** Viewport-fit layout for Build screen. */
  compact?: boolean;
}

export function DailyRecipePanel({
  recipe,
  ratios,
  locked,
  excluded,
  onToggleLock,
  onSwap,
  compact = false,
}: DailyRecipePanelProps) {
  const [editing, setEditing] = useState<{ category: Category; name: string } | null>(null);

  const pickerOptions = useMemo(() => {
    if (!editing) return [];
    const usedNames = new Set(recipe.ingredients[editing.category].map((i) => i.name));
    return getIngredientCatalogOrThrow()[editing.category]
      .filter((i) => (i.caloriesPer100g || 0) > 0)
      .map((i) => i.name)
      .filter((n) => !excluded.includes(n) && !usedNames.has(n));
  }, [editing, recipe.ingredients, excluded]);

  const body = (
    <>
      <div className="space-y-3">
        {CATEGORIES.map((category) => {
          const items = recipe.ingredients[category];
          if (items.length === 0) return null;
          const lockedNames = locked[category] ?? [];

          return (
            <div key={category}>
              <h3 className={`${groupLabel} mb-1 flex items-baseline gap-1.5`}>
                {category}
                <span className="font-medium normal-case tracking-normal text-zinc-400">
                  {Math.round((ratios[category] ?? 0) * 100)}%
                </span>
              </h3>
              <div className="space-y-0.5">
                {items.map((ingredient) => {
                  const isLocked = lockedNames.includes(ingredient.name);
                  const isBoost = isNutritionBoostRow(ingredient);
                  return (
                    <div
                      key={`${ingredient.name}-${isBoost ? 'boost' : 'base'}`}
                      className="flex items-center justify-between gap-2 rounded-lg py-1"
                    >
                      <div className="min-w-0 truncate text-left text-sm text-black dark:text-zinc-50">
                        {isBoost ? (
                          <>
                            <span className="text-zinc-500">{ingredient.name}</span>
                            <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                              + add
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ category, name: ingredient.name })}
                            className="truncate text-left"
                          >
                            {ingredient.name}
                          </button>
                        )}
                      </div>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <span className="mr-1 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-black dark:text-zinc-50">
                            {ingredient.grams}g
                          </span>
                        </span>
                        {!isBoost && (
                          <>
                            <button
                              type="button"
                              aria-label={`Swap ${ingredient.name}`}
                              onClick={() => setEditing({ category, name: ingredient.name })}
                              className={iconBtn}
                            >
                              <ArrowLeftRight size={14} />
                            </button>
                            <button
                              type="button"
                              aria-pressed={isLocked}
                              aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${ingredient.name}`}
                              onClick={() => onToggleLock(category, ingredient.name)}
                              className={`${iconBtn} ${isLocked ? 'text-black dark:text-zinc-50' : ''}`}
                            >
                              {isLocked ? <Lock size={14} /> : <LockOpen size={14} />}
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <h3 className={`${groupLabel} mb-1`}>Supplements</h3>
        {recipe.ingredients.supplements.map((supplement) => {
          const scoops = supplement.gramsPerScoop
            ? Math.round((supplement.grams / supplement.gramsPerScoop) * 10) / 10
            : null;
          return (
            <div
              key={supplement.name}
              className="flex items-baseline justify-between gap-2 text-sm"
            >
              <span className="truncate text-black dark:text-zinc-50">{supplement.name}</span>
              <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-black dark:text-zinc-50">{supplement.grams}g</span>
                {scoops !== null && (
                  <span className="ml-1 text-xs text-zinc-400">{scoops} scoop</span>
                )}
              </span>
            </div>
          );
        })}
        <div className="mt-2 flex items-center justify-between text-sm font-medium">
          <span>Daily calories</span>
          <span className="tabular-nums">{Math.round(recipe.totalCalories)}</span>
        </div>
      </div>
    </>
  );

  const picker = editing ? (
    <IngredientPicker
      current={editing.name}
      suggestions={pickerOptions}
      onSelect={(name) => {
        onSwap(editing.category, editing.name, name);
        setEditing(null);
      }}
      onCancel={() => setEditing(null)}
    />
  ) : null;

  if (compact) {
    return (
      <>
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="shrink-0 border-b border-zinc-50 px-3 py-2 dark:border-zinc-800">
            <p className="text-sm font-medium text-black dark:text-zinc-50">Daily ingredients</p>
            <p className="text-[11px] text-zinc-400">Tap to swap · lock to keep on reroll</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">{body}</div>
        </div>
        {picker}
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {body}
      </div>
      {picker}
    </>
  );
}
