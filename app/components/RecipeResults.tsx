import { useState } from 'react';
import { CATEGORIES, type Category, type CategoryRatios } from '../utils/constants';
import {
  calculateShoppingList,
  calculateMealPortions,
  type Dog,
  type Recipe,
} from '../utils/recipeCalculator';
import { ingredients } from '../data/ingredients';
import {
  convertMass,
  defaultMassUnit,
  MASS_UNITS,
  massUnitLabel,
  type MassUnit,
  type WeightUnit,
} from '../utils/format';
import { card, groupLabel, iconBtn, sectionTitle } from './ui';
import { CopyIcon, DownloadIcon, LockIcon, PrinterIcon, SwapIcon, UnlockIcon } from './icons';
import { IngredientPicker } from './IngredientPicker';

interface RecipeResultsProps {
  recipe: Recipe;
  ratios: CategoryRatios;
  numberOfDays: number;
  mealsPerDay: number;
  dogsWithMER: Dog[];
  unit: WeightUnit;
  locked: Partial<Record<Category, string[]>>;
  excluded: string[];
  copied: boolean;
  shoppingUnits: Record<string, MassUnit>;
  portionUnits: Record<string, MassUnit>;
  onToggleLock: (category: Category, name: string) => void;
  onSwap: (category: Category, oldName: string, newName: string) => void;
  onMealsChange: (meals: number) => void;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  onPortionUnitsChange: (next: Record<string, MassUnit>) => void;
  onCopy: () => void;
  onExportCsv: () => void;
}

export function RecipeResults({
  recipe,
  ratios,
  numberOfDays,
  mealsPerDay,
  dogsWithMER,
  unit,
  locked,
  excluded,
  copied,
  shoppingUnits,
  portionUnits,
  onToggleLock,
  onSwap,
  onMealsChange,
  onShoppingUnitsChange,
  onPortionUnitsChange,
  onCopy,
  onExportCsv,
}: RecipeResultsProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const fallbackUnit = defaultMassUnit(unit);
  const unitFor = (name: string): MassUnit => shoppingUnits[name] ?? fallbackUnit;
  const setUnitFor = (name: string, u: MassUnit) =>
    onShoppingUnitsChange({ ...shoppingUnits, [name]: u });
  const portionUnitFor = (name: string): MassUnit => portionUnits[name] ?? 'g';
  const setPortionUnitFor = (name: string, u: MassUnit) =>
    onPortionUnitsChange({ ...portionUnits, [name]: u });
  const shoppingList = calculateShoppingList(recipe, numberOfDays);
  const portions = calculateMealPortions(recipe, dogsWithMER, mealsPerDay);

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Action row */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
        >
          <CopyIcon width={16} height={16} />
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
        >
          <DownloadIcon width={16} height={16} />
          CSV
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
        >
          <PrinterIcon width={16} height={16} />
          Print
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
        {/* Daily Recipe */}
        <section className={card}>
          <div className="mb-5 flex items-center justify-between gap-3 print:mb-2">
            <h2 className={`${sectionTitle} print:text-lg`}>Daily Recipe</h2>
            <span className="text-xs text-zinc-400 print:hidden">tap the lock to keep an item</span>
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
                          className="flex items-center justify-between gap-3"
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

          <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 print:mt-2 print:pt-1">
            <span className="text-base font-semibold text-black print:text-sm">Total Daily Calories</span>
            <span className="text-base font-bold tabular-nums text-black print:text-sm">
              {Math.round(recipe.totalCalories)}
            </span>
          </div>
        </section>

        {/* Shopping List */}
        <section className={card}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:mb-2">
            <h2 className={`${sectionTitle} print:text-lg`}>
              Shopping List
              <span className="ml-2 text-sm font-normal text-zinc-500">{numberOfDays} days</span>
            </h2>
            <label className="flex items-center gap-2 text-sm text-zinc-600 print:hidden">
              All in
              <select
                value=""
                onChange={(e) => {
                  const u = e.target.value as MassUnit;
                  if (!u) return;
                  const next: Record<string, MassUnit> = { ...shoppingUnits };
                  for (const name of Object.keys(shoppingList)) next[name] = u;
                  onShoppingUnitsChange(next);
                }}
                className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
                aria-label="Set units for all items"
              >
                <option value="">Set all…</option>
                {MASS_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {massUnitLabel(u)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="print:space-y-0.5">
            {Object.entries(shoppingList).map(([name, amounts], index) => {
              const u = unitFor(name);
              return (
                <div
                  key={name}
                  className={`flex items-center justify-between gap-3 rounded-md px-2 py-1.5 print:rounded-none print:px-1.5 print:py-0.5 ${
                    index % 2 === 1
                      ? 'bg-zinc-50 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]'
                      : ''
                  }`}
                >
                  <span className="min-w-0 truncate text-sm text-black print:text-xs">{name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums text-sm text-black print:text-xs">
                      <span className="font-medium">{convertMass(amounts.grams, u)}</span>
                      <span className="ml-1 text-zinc-500">{massUnitLabel(u)}</span>
                      {u !== 'g' && (
                        <span className="ml-2 text-xs text-zinc-400 print:hidden">
                          {Math.round(amounts.grams)}g
                        </span>
                      )}
                    </span>
                    <select
                      value={u}
                      onChange={(e) => setUnitFor(name, e.target.value as MassUnit)}
                      aria-label={`Units for ${name}`}
                      className="rounded-md bg-zinc-50 px-1.5 py-1 text-xs text-zinc-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300 print:hidden"
                    >
                      {MASS_UNITS.map((option) => (
                        <option key={option} value={option}>
                          {massUnitLabel(option)}
                        </option>
                      ))}
                    </select>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Meal Portions */}
      <section className={card}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:mb-1">
          <h2 className={`${sectionTitle} print:text-lg`}>Meal Portions</h2>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              All in
              <select
                value=""
                onChange={(e) => {
                  const u = e.target.value as MassUnit;
                  if (!u) return;
                  const next: Record<string, MassUnit> = { ...portionUnits };
                  for (const name of Object.keys(portions)) next[name] = u;
                  onPortionUnitsChange(next);
                }}
                className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
                aria-label="Set units for all portions"
              >
                <option value="">Set all…</option>
                {MASS_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {massUnitLabel(u)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              Meals per day
              <select
                value={mealsPerDay}
                onChange={(e) => onMealsChange(parseInt(e.target.value))}
                className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-sm text-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
                aria-label="Meals per day"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-4 print:gap-2">
          {Object.entries(portions).map(([dogName, portion]) => {
            const pu = portionUnitFor(dogName);
            return (
              <div
                key={dogName}
                className="rounded-xl border border-zinc-200 p-4 print:border-0 print:p-0"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="min-w-0 truncate font-semibold text-black print:text-sm">
                    {dogName}
                  </h3>
                  <span className="text-xs font-medium tabular-nums text-zinc-500">
                    {portion.percentage}%
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between gap-2 print:mb-1">
                  <span className="text-xs text-zinc-500">
                    {Math.round(dogsWithMER.find((d) => d.name === dogName)?.MER || 0)} cal/day
                  </span>
                  <select
                    value={pu}
                    onChange={(e) => setPortionUnitFor(dogName, e.target.value as MassUnit)}
                    aria-label={`Units for ${dogName}`}
                    className="rounded-md bg-zinc-50 px-1.5 py-1 text-xs text-zinc-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300 print:hidden"
                  >
                    {MASS_UNITS.map((option) => (
                      <option key={option} value={option}>
                        {massUnitLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-baseline justify-between text-sm print:text-xs">
                  <span className="text-zinc-600">Daily</span>
                  <span className="font-medium tabular-nums text-black">
                    {convertMass(portion.dailyPortion, pu)} {massUnitLabel(pu)}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-sm print:text-xs">
                  <span className="text-zinc-600">
                    Per meal <span className="text-zinc-400">×{mealsPerDay}</span>
                  </span>
                  <span className="font-medium tabular-nums text-black">
                    {convertMass(portion.mealPortion, pu)} {massUnitLabel(pu)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
