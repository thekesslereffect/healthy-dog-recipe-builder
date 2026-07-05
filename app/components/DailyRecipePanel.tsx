import { useMemo, useState } from 'react';
import { CATEGORIES, type Category, type CategoryRatios } from '../utils/constants';
import type { Dog, Recipe } from '../utils/recipeCalculator';
import { getIngredientCatalogOrThrow } from '../data/ingredients';
import {
  getBoostSwapCandidates,
  getBoostNutrientGaps,
  isNutritionBoostRow,
} from '../utils/nutritionBoost';
import { groupLabel, Button } from './ui';
import { ArrowLeftRight, Lock, LockOpen, Trash2 } from 'lucide-react';
import { IngredientPicker, type IngredientPickerOption } from './IngredientPicker';
import { NutritionSnapshot } from './NutritionSnapshot';

interface DailyRecipePanelProps {
  recipe: Recipe;
  ratios: CategoryRatios;
  locked: Partial<Record<Category, string[]>>;
  excluded: string[];
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
  onRemoveBoost?: (category: Category, name: string) => void;
  onSwapBoost?: (category: Category, oldName: string, newName: string) => void;
  dogsWithMER?: Dog[];
  onBalance?: () => void;
  balancing?: boolean;
  /** Viewport-fit layout for Build screen. */
  compact?: boolean;
}

type EditingTarget = {
  category: Category;
  name: string;
  boost: boolean;
};

export function DailyRecipePanel({
  recipe,
  ratios,
  locked,
  excluded,
  onToggleLock,
  onSwap,
  onRemoveBoost,
  onSwapBoost,
  dogsWithMER,
  onBalance,
  balancing = false,
  compact = false,
}: DailyRecipePanelProps) {
  const [editing, setEditing] = useState<EditingTarget | null>(null);
  const calorieShares = useMemo(() => {
    const foodCalories = CATEGORIES.reduce(
      (sum, category) =>
        sum + recipe.ingredients[category].reduce((total, row) => total + row.calories, 0),
      0,
    );
    const shares = {} as CategoryRatios;
    for (const category of CATEGORIES) {
      const categoryCalories = recipe.ingredients[category].reduce(
        (total, row) => total + row.calories,
        0,
      );
      shares[category] =
        foodCalories > 0 ? categoryCalories / foodCalories : (ratios[category] ?? 0);
    }
    return shares;
  }, [recipe, ratios]);
  const pickerOptions = useMemo(() => {
    if (!editing)
      return {
        suggestions: [] as string[],
        options: [] as IngredientPickerOption[],
        subtitle: undefined as string | undefined,
      };
    if (editing.boost) {
      if (!dogsWithMER) {
        return { suggestions: [], options: [], subtitle: undefined };
      }
      const gaps = getBoostNutrientGaps(recipe, dogsWithMER);
      const candidates = getBoostSwapCandidates(
        recipe,
        editing.category,
        editing.name,
        dogsWithMER,
        excluded,
      );
      const options: IngredientPickerOption[] = candidates.map((candidate) => ({
        name: candidate.name,
        detail:
          candidate.category !== editing.category ? `${candidate.category} category` : undefined,
      }));
      return {
        suggestions: candidates.map((candidate) => candidate.name),
        options,
        subtitle: gaps.length > 0 ? gaps.join(', ') : undefined,
      };
    }
    const usedNames = new Set(recipe.ingredients[editing.category].map((i) => i.name));
    const suggestions = getIngredientCatalogOrThrow()
      [editing.category].filter((i) => (i.caloriesPer100g || 0) > 0)
      .map((i) => i.name)
      .filter((n) => !excluded.includes(n) && !usedNames.has(n));
    return { suggestions, options: undefined, subtitle: undefined };
  }, [editing, recipe, excluded, dogsWithMER]);
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
                  {Math.round((calorieShares[category] ?? 0) * 100)}%
                </span>
              </h3>
              <div className="space-y-0.5">
                {items.map((ingredient) => {
                  const isLocked = lockedNames.includes(ingredient.name);
                  const isBoost = isNutritionBoostRow(ingredient);
                  return (
                    <div
                      key={`${ingredient.name}-${isBoost ? 'boost' : 'base'}`}
                      className="flex items-center justify-between gap-1.5 rounded-lg py-0.5 sm:gap-2 sm:py-1"
                    >
                      <div className="min-w-0 truncate text-left text-sm text-foreground">
                        {isBoost ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({ category, name: ingredient.name, boost: true })
                            }
                            className="truncate text-left font-medium transition-colors hover:text-accent"
                          >
                            {ingredient.name}
                            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-sage">
                              + add
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({ category, name: ingredient.name, boost: false })
                            }
                            className="truncate text-left font-medium transition-colors hover:text-accent"
                          >
                            {ingredient.name}
                          </button>
                        )}
                      </div>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <span className="mr-1 text-sm tabular-nums text-muted">
                          <span className="font-semibold text-foreground">{ingredient.grams}g</span>
                        </span>
                        {isBoost ? (
                          <>
                            {onSwapBoost && (
                              <Button
                                variant="icon"
                                aria-label={`Swap ${ingredient.name} boost`}
                                onClick={() =>
                                  setEditing({ category, name: ingredient.name, boost: true })
                                }
                                className="h-8 w-8 sm:h-9 sm:w-9"
                              >
                                <ArrowLeftRight size={14} />
                              </Button>
                            )}
                            {onRemoveBoost && (
                              <Button
                                variant="icon"
                                aria-label={`Remove ${ingredient.name} boost`}
                                onClick={() => onRemoveBoost(category, ingredient.name)}
                                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 sm:h-9 sm:w-9 dark:hover:bg-red-950/30"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              variant="icon"
                              aria-label={`Swap ${ingredient.name}`}
                              onClick={() =>
                                setEditing({ category, name: ingredient.name, boost: false })
                              }
                              className="h-8 w-8 sm:h-9 sm:w-9"
                            >
                              <ArrowLeftRight size={14} />
                            </Button>
                            <Button
                              variant="icon"
                              aria-pressed={isLocked}
                              aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${ingredient.name}`}
                              onClick={() => onToggleLock(category, ingredient.name)}
                              className={`h-8 w-8 sm:h-9 sm:w-9 ${isLocked ? 'text-accent' : ''}`}
                            >
                              {isLocked ? <Lock size={14} /> : <LockOpen size={14} />}
                            </Button>
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

      <div className="mt-3 border-t border-border pt-3">
        <h3 className={`${groupLabel} mb-1.5`}>Supplements</h3>
        {recipe.ingredients.supplements.map((supplement) => {
          const scoops = supplement.gramsPerScoop
            ? Math.round((supplement.grams / supplement.gramsPerScoop) * 10) / 10
            : null;
          return (
            <div
              key={supplement.name}
              className="flex items-baseline justify-between gap-2 text-sm"
            >
              <span className="truncate text-foreground">{supplement.name}</span>
              <span className="shrink-0 tabular-nums text-muted">
                <span className="font-semibold text-foreground">{supplement.grams}g</span>
                {scoops !== null && <span className="ml-1 text-xs text-muted">{scoops} scoop</span>}
              </span>
            </div>
          );
        })}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 text-sm font-semibold">
          <span className="text-accent">Daily calories</span>
          <span className="tabular-nums text-accent">{Math.round(recipe.totalCalories)}</span>
        </div>
      </div>
    </>
  );
  const picker = editing ? (
    <IngredientPicker
      current={editing.name}
      suggestions={pickerOptions.suggestions}
      options={pickerOptions.options}
      subtitle={pickerOptions.subtitle}
      boost={editing.boost}
      title={editing.boost ? `Replace ${editing.name}` : undefined}
      onSelect={(name) => {
        if (editing.boost) {
          onSwapBoost?.(editing.category, editing.name, name);
        } else {
          onSwap(editing.category, editing.name, name);
        }
        setEditing(null);
      }}
      onCancel={() => setEditing(null)}
    />
  ) : null;
  if (compact) {
    return (
      <>
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 sm:px-4">
            {body}
          </div>
          {dogsWithMER && (
            <NutritionSnapshot
              recipe={recipe}
              dogsWithMER={dogsWithMER}
              onBalance={onBalance}
              balancing={balancing}
              collapsible
              embedded
            />
          )}
        </div>
        {picker}
      </>
    );
  }
  return (
    <>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
        {body}
      </div>
      {picker}
    </>
  );
}
