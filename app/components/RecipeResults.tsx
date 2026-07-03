import { CATEGORIES, type Category } from '../utils/constants';
import {
  calculateShoppingList,
  calculateMealPortions,
  type Dog,
  type Recipe,
} from '../utils/recipeCalculator';
import { bulkUnitLabel, gramsToBulk, type WeightUnit } from '../utils/format';
import { card, groupLabel, iconBtn, sectionTitle } from './ui';
import { CloseIcon, LockIcon, ShuffleIcon, UnlockIcon } from './icons';

interface RecipeResultsProps {
  recipe: Recipe;
  numberOfDays: number;
  mealsPerDay: number;
  dogsWithMER: Dog[];
  unit: WeightUnit;
  locked: Partial<Record<Category, string[]>>;
  onToggleLock: (category: Category, name: string) => void;
  onExclude: (name: string) => void;
  onReroll: () => void;
}

export function RecipeResults({
  recipe,
  numberOfDays,
  mealsPerDay,
  dogsWithMER,
  unit,
  locked,
  onToggleLock,
  onExclude,
  onReroll,
}: RecipeResultsProps) {
  const shoppingList = calculateShoppingList(recipe, numberOfDays);
  const portions = calculateMealPortions(recipe, dogsWithMER, mealsPerDay);

  return (
    <div className="mt-8 space-y-6 sm:mt-12 print:mt-2 print:space-y-2">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
        {/* Daily Recipe */}
        <section className={card}>
          <div className="mb-5 flex items-center justify-between gap-3 print:mb-2">
            <h2 className={`${sectionTitle} print:text-lg`}>Daily Recipe</h2>
            <button
              type="button"
              onClick={onReroll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-zinc-200 print:hidden"
              title="Reroll the ingredients you haven't locked"
            >
              <ShuffleIcon width={14} height={14} />
              Reroll
            </button>
          </div>

          <div className="space-y-5 print:space-y-1">
            {CATEGORIES.map((category) => {
              const items = recipe.ingredients[category];
              if (items.length === 0) return null;
              const lockedNames = locked[category] ?? [];

              return (
                <div key={category} className="print:space-y-0.5">
                  <h3 className={`${groupLabel} mb-2 block print:mb-0.5 print:text-[10px]`}>
                    {category}
                  </h3>
                  <div className="space-y-1 print:space-y-0.5">
                    {items.map((ingredient) => {
                      const isLocked = lockedNames.includes(ingredient.name);
                      return (
                        <div
                          key={ingredient.name}
                          className="group flex items-baseline justify-between gap-3"
                        >
                          <span className="flex items-center gap-1.5 text-sm text-black print:text-xs">
                            {ingredient.name}
                            {isLocked && (
                              <LockIcon width={12} height={12} className="text-zinc-400 print:hidden" />
                            )}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-right text-sm tabular-nums text-black print:text-xs">
                              <span className="font-medium">{ingredient.grams}g</span>
                              <span className="ml-2 text-zinc-400 print:hidden">
                                {Math.round(ingredient.calories)} cal
                              </span>
                            </span>
                            <span className="flex items-center print:hidden">
                              <button
                                type="button"
                                aria-pressed={isLocked}
                                aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${ingredient.name}`}
                                title={isLocked ? 'Locked — kept on reroll' : 'Lock this ingredient'}
                                onClick={() => onToggleLock(category, ingredient.name)}
                                className={`${iconBtn} ${isLocked ? 'text-black' : ''}`}
                              >
                                {isLocked ? (
                                  <LockIcon width={14} height={14} />
                                ) : (
                                  <UnlockIcon width={14} height={14} />
                                )}
                              </button>
                              <button
                                type="button"
                                aria-label={`Exclude ${ingredient.name} from future recipes`}
                                title="Exclude (e.g. allergy) and reroll"
                                onClick={() => onExclude(ingredient.name)}
                                className={iconBtn}
                              >
                                <CloseIcon width={14} height={14} />
                              </button>
                            </span>
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

          <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 print:mt-2 print:pt-1">
            <span className="text-base font-semibold text-black print:text-sm">Total Daily Calories</span>
            <span className="text-base font-bold tabular-nums text-black print:text-sm">
              {Math.round(recipe.totalCalories)}
            </span>
          </div>
        </section>

        {/* Shopping List */}
        <section className={card}>
          <h2 className={`${sectionTitle} mb-5 print:mb-2 print:text-lg`}>
            Shopping List
            <span className="ml-2 text-sm font-normal text-zinc-500">{numberOfDays} days</span>
          </h2>
          <div className="space-y-1.5 print:space-y-0.5">
            {Object.entries(shoppingList).map(([name, amounts]) => (
              <div key={name} className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-black print:text-xs">{name}</span>
                <span className="shrink-0 text-right text-sm tabular-nums text-black print:text-xs">
                  <span className="font-medium">{Math.round(amounts.grams)}g</span>
                  {amounts.pounds !== undefined && (
                    <span className="ml-2 text-zinc-400 print:hidden">
                      {gramsToBulk(amounts.grams, unit)} {bulkUnitLabel(unit)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Meal Portions */}
      <section className={card}>
        <h2 className={`${sectionTitle} mb-5 print:mb-1 print:text-lg`}>
          Meal Portions
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {mealsPerDay} meal{mealsPerDay === 1 ? '' : 's'}/day
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-4 print:gap-2">
          {Object.entries(portions).map(([dogName, portion]) => (
            <div
              key={dogName}
              className="rounded-xl border border-zinc-200 p-4 print:border-0 print:p-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-black print:text-sm">{dogName}</h3>
                <span className="text-xs font-medium tabular-nums text-zinc-500">
                  {portion.percentage}%
                </span>
              </div>
              <div className="mb-3 text-xs text-zinc-500 print:mb-1">
                {Math.round(dogsWithMER.find((d) => d.name === dogName)?.MER || 0)} cal/day
              </div>
              <div className="flex items-baseline justify-between text-sm print:text-xs">
                <span className="text-zinc-600">Daily</span>
                <span className="font-medium tabular-nums text-black">{portion.dailyPortion}g</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-sm print:text-xs">
                <span className="text-zinc-600">Per meal</span>
                <span className="font-medium tabular-nums text-black">{portion.mealPortion}g</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
