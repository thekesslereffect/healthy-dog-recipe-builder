import { useState } from 'react';
import {
  calculateMealPortions,
  calculateShoppingList,
  type Dog,
  type Recipe,
} from '../utils/recipeCalculator';
import type { MassUnit, WeightUnit } from '../utils/format';
import { btnPrimary, btnSecondary, iconBtn, segmentBtn, segmentTrack } from './ui';
import {
  Bookmark,
  CookingPot,
  Copy,
  Pencil,
  Printer,
  SlidersHorizontal,
} from 'lucide-react';
import { ShoppingListPanel } from './ShoppingListPanel';
import { MealPortionsPanel } from './MealPortionsPanel';
import { DogAvatar } from './DogAvatar';

type PlanPane = 'shop' | 'feed';

interface HomePlanProps {
  recipe: Recipe | null;
  hasDraft: boolean;
  planName?: string;
  dogsWithMER: Dog[];
  numberOfDays: number;
  mealsPerDay: number;
  unit: WeightUnit;
  shoppingUnits: Record<string, MassUnit>;
  checkedItems: Record<string, boolean>;
  portionUnits: Record<string, MassUnit>;
  copied: boolean;
  canGenerate: boolean;
  hasInvalidDog: boolean;
  onDaysChange: (days: number) => void;
  onMealsChange: (meals: number) => void;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  onCheckedItemsChange: (next: Record<string, boolean>) => void;
  onPortionUnitsChange: (next: Record<string, MassUnit>) => void;
  onCopy: () => void;
  onGoEdit: () => void;
  onGoBuild: () => void;
  onGoProfile: () => void;
  onGoSaved: () => void;
}

export function HomePlan({
  recipe,
  hasDraft,
  planName,
  dogsWithMER,
  numberOfDays,
  mealsPerDay,
  unit,
  shoppingUnits,
  checkedItems,
  portionUnits,
  copied,
  canGenerate,
  hasInvalidDog,
  onDaysChange,
  onMealsChange,
  onShoppingUnitsChange,
  onCheckedItemsChange,
  onPortionUnitsChange,
  onCopy,
  onGoEdit,
  onGoBuild,
  onGoProfile,
  onGoSaved,
}: HomePlanProps) {
  const [pane, setPane] = useState<PlanPane>('shop');

  if (!recipe) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center px-2 text-center print:hidden">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <CookingPot size={28} />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          {hasDraft ? 'Finish your draft' : 'No active plan'}
        </h2>
        <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
          {hasDraft
            ? 'Name and use your draft in Build to see shopping and feeding here.'
            : 'Build a draft, reroll until you like it, then use it as your plan.'}
        </p>
        <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={onGoBuild}
            disabled={!canGenerate && !hasDraft}
            className={`${btnPrimary} inline-flex items-center justify-center gap-2`}
          >
            <SlidersHorizontal size={16} />
            {hasDraft ? 'Finish draft' : 'Build a plan'}
          </button>
          {hasInvalidDog && (
            <button type="button" onClick={onGoProfile} className={btnSecondary}>
              Set up dogs
            </button>
          )}
          <button
            type="button"
            onClick={onGoSaved}
            className={`${btnSecondary} inline-flex items-center justify-center gap-2`}
          >
            <Bookmark size={16} />
            Open saved
          </button>
        </div>
        {dogsWithMER.length > 0 && (
          <button type="button" onClick={onGoProfile} className="mt-6 flex items-center gap-2">
            {dogsWithMER.slice(0, 4).map((dog) => (
              <DogAvatar
                key={dog.id ?? dog.name}
                name={dog.name}
                avatar={dog.avatar}
                size="sm"
              />
            ))}
          </button>
        )}
      </div>
    );
  }

  const shoppingList = calculateShoppingList(recipe, numberOfDays);
  const portions = calculateMealPortions(recipe, dogsWithMER, mealsPerDay);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2 print:hidden">
        <div className={segmentTrack}>
          <button
            type="button"
            className={segmentBtn(pane === 'shop')}
            onClick={() => setPane('shop')}
          >
            Shop
          </button>
          <button
            type="button"
            className={segmentBtn(pane === 'feed')}
            onClick={() => setPane('feed')}
          >
            Feed
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onGoEdit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={onCopy}
            className={iconBtn}
            aria-label={copied ? 'Copied' : 'Copy'}
            title={copied ? 'Copied' : 'Copy'}
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={iconBtn}
            aria-label="Print"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      <div className="hidden print:mb-2 print:block print:text-xs">
        {planName && <h2 className="mb-1 text-sm font-semibold">{planName}</h2>}
        {dogsWithMER.map((dog) => (
          <div key={dog.id ?? dog.name}>
            {dog.name} — {dog.weight} lbs — {mealsPerDay} meals/day — {numberOfDays} days
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 print:hidden">
        {pane === 'shop' ? (
          <ShoppingListPanel
            shoppingList={shoppingList}
            numberOfDays={numberOfDays}
            unit={unit}
            shoppingUnits={shoppingUnits}
            checkedItems={checkedItems}
            onShoppingUnitsChange={onShoppingUnitsChange}
            onCheckedItemsChange={onCheckedItemsChange}
            onDaysChange={onDaysChange}
          />
        ) : (
          <MealPortionsPanel
            portions={portions}
            dogsWithMER={dogsWithMER}
            mealsPerDay={mealsPerDay}
            portionUnits={portionUnits}
            onPortionUnitsChange={onPortionUnitsChange}
            onMealsChange={onMealsChange}
          />
        )}
      </div>

      <div className="hidden print:block print:space-y-4">
        <ShoppingListPanel
          shoppingList={shoppingList}
          numberOfDays={numberOfDays}
          unit={unit}
          shoppingUnits={shoppingUnits}
          checkedItems={checkedItems}
          onShoppingUnitsChange={onShoppingUnitsChange}
          onCheckedItemsChange={onCheckedItemsChange}
          onDaysChange={onDaysChange}
        />
        <MealPortionsPanel
          portions={portions}
          dogsWithMER={dogsWithMER}
          mealsPerDay={mealsPerDay}
          portionUnits={portionUnits}
          onPortionUnitsChange={onPortionUnitsChange}
          onMealsChange={onMealsChange}
        />
      </div>
    </div>
  );
}
