import { useState } from 'react';

import {
  calculateMealPortions,
  calculateShoppingList,
  type Dog,
  type Recipe,
} from '../utils/recipeCalculator';

import type { MassUnit, WeightUnit } from '../utils/format';
import { defaultMassUnit, MASS_UNITS, massUnitLabel } from '../utils/format';
import type { ShoppingMassUnitMode } from '../utils/shoppingMassUnit';

import {
  btnPrimary,
  btnSecondary,
  emptyIconWrap,
  iconBtn,
  segmentBtn,
  segmentTrack,
  stepperBtn,
  stepperReadout,
  stepperReadoutLabel,
  stepperReadoutValue,
  toolbarUnitSelect,
} from './ui';

import {
  ArrowRight,
  Check,
  CookingPot,
  Copy,
  Pencil,
  Printer,
  SlidersHorizontal,
  Sparkles,
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
  shoppingUnitMode: ShoppingMassUnitMode;
  checkedItems: Record<string, boolean>;
  portionUnits: Record<string, MassUnit>;
  copied: boolean;
  canGenerate: boolean;
  hasInvalidDog: boolean;
  onDaysChange: (days: number) => void;
  onMealsChange: (meals: number) => void;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  onShoppingUnitModeChange: (mode: ShoppingMassUnitMode) => void;
  onCheckedItemsChange: (next: Record<string, boolean>) => void;
  onPortionUnitsChange: (next: Record<string, MassUnit>) => void;
  onCopy: () => void;
  onGoEdit: () => void;
  onGoBuild: () => void;
  onGoProfile: () => void;
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
  shoppingUnitMode,
  checkedItems,
  portionUnits,
  copied,
  canGenerate,
  hasInvalidDog,
  onDaysChange,
  onMealsChange,
  onShoppingUnitsChange,
  onShoppingUnitModeChange,
  onCheckedItemsChange,
  onPortionUnitsChange,
  onCopy,
  onGoEdit,
  onGoBuild,
  onGoProfile,
}: HomePlanProps) {
  const [pane, setPane] = useState<PlanPane>('shop');
  if (!recipe) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center px-4 text-center print:hidden">
        <div className={emptyIconWrap}>
          {hasDraft ? <Sparkles size={28} /> : <CookingPot size={28} />}
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">
          {hasDraft ? 'Almost there!' : 'Your kitchen awaits'}
        </h2>

        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {hasDraft
            ? 'Name and confirm your draft to unlock shopping and feeding guides.'
            : 'Pick a saved plan from the menu above, or create a new one.'}
        </p>

        {dogsWithMER.length > 0 && (
          <div className="mt-6 flex items-center -space-x-2">
            {dogsWithMER.slice(0, 4).map((dog) => (
              <DogAvatar
                key={dog.id ?? dog.name}
                name={dog.name}
                avatar={dog.avatar}
                size="sm"
                className="ring-2 ring-background"
              />
            ))}

            {dogsWithMER.length > 4 && (
              <span className="ml-3 text-xs font-medium text-muted">
                +{dogsWithMER.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
          <button
            type="button"
            onClick={onGoBuild}
            disabled={!canGenerate && !hasDraft}
            className={`${btnPrimary} inline-flex items-center justify-center gap-2 py-3`}
          >
            <SlidersHorizontal size={16} />

            {hasDraft ? 'Finish draft' : 'Build a plan'}

            <ArrowRight size={14} className="opacity-70" />
          </button>

          {hasInvalidDog && (
            <button type="button" onClick={onGoProfile} className={btnSecondary}>
              Set up your dogs first
            </button>
          )}
        </div>
      </div>
    );
  }
  const shoppingList = calculateShoppingList(recipe, numberOfDays);
  const portions = calculateMealPortions(recipe, dogsWithMER, mealsPerDay);
  const shopEntries = Object.entries(shoppingList);
  const portionEntries = Object.entries(portions);
  const fallbackMassUnit = defaultMassUnit(unit);
  const applyShoppingUnitMode = (mode: ShoppingMassUnitMode) => {
    onShoppingUnitModeChange(mode);
    onShoppingUnitsChange({});
  };
  const portionUnitFor = (name: string): MassUnit => portionUnits[name] ?? fallbackMassUnit;
  const portionGlobalUnit =
    portionEntries.length > 0 &&
    portionEntries.every(([name]) => portionUnitFor(name) === portionUnitFor(portionEntries[0][0]))
      ? portionUnitFor(portionEntries[0][0])
      : fallbackMassUnit;
  const setAllPortionUnits = (massUnit: MassUnit) => {
    const next: Record<string, MassUnit> = { ...portionUnits };
    for (const [name] of portionEntries) next[name] = massUnit;
    onPortionUnitsChange(next);
  };
  const checkedCount = shopEntries.filter(([name]) => checkedItems[name]).length;
  const shopProgress = shopEntries.length > 0 ? (checkedCount / shopEntries.length) * 100 : 0;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 pb-1.5 print:hidden">
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

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {pane === 'shop' ? (
            <>
              <div className={segmentTrack}>
                <button
                  type="button"
                  aria-label="Fewer days"
                  className={stepperBtn}
                  onClick={() => onDaysChange(Math.max(1, numberOfDays - 1))}
                >
                  −
                </button>

                <span className={stepperReadout}>
                  <span className={stepperReadoutValue}>{numberOfDays}</span>
                  <span className={stepperReadoutLabel}>Days</span>
                </span>

                <button
                  type="button"
                  aria-label="More days"
                  className={stepperBtn}
                  onClick={() => onDaysChange(Math.min(30, numberOfDays + 1))}
                >
                  +
                </button>
              </div>

              <select
                value={shoppingUnitMode}
                onChange={(e) => applyShoppingUnitMode(e.target.value as ShoppingMassUnitMode)}
                aria-label="Shopping list units"
                className={toolbarUnitSelect}
              >
                <option value="auto">Auto</option>
                {MASS_UNITS.map((massUnit) => (
                  <option key={massUnit} value={massUnit}>
                    {massUnitLabel(massUnit)}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <div className={segmentTrack}>
                <button
                  type="button"
                  aria-label="Fewer meals per day"
                  className={stepperBtn}
                  onClick={() => onMealsChange(Math.max(1, mealsPerDay - 1))}
                >
                  −
                </button>

                <span className={stepperReadout}>
                  <span className={stepperReadoutValue}>{mealsPerDay}</span>
                  <span className={stepperReadoutLabel}>Meals / Day</span>
                </span>

                <button
                  type="button"
                  aria-label="More meals per day"
                  className={stepperBtn}
                  onClick={() => onMealsChange(Math.min(3, mealsPerDay + 1))}
                >
                  +
                </button>
              </div>

              <select
                value={portionGlobalUnit}
                onChange={(e) => setAllPortionUnits(e.target.value as MassUnit)}
                aria-label="Portion units"
                className={toolbarUnitSelect}
              >
                {MASS_UNITS.map((massUnit) => (
                  <option key={massUnit} value={massUnit}>
                    {massUnitLabel(massUnit)}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {pane === 'shop' && (
        <div className="flex shrink-0 items-center gap-2 pb-2 print:hidden">
          {shopEntries.length > 0 ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-sage transition-all duration-300"
                  style={{ width: `${shopProgress}%` }}
                />
              </div>

              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sage">
                {Math.round(shopProgress)}%
              </span>

              <span className="hidden shrink-0 text-[11px] font-medium text-muted sm:inline">
                {checkedCount}/{shopEntries.length}
              </span>
            </div>
          ) : (
            <div className="min-w-0 flex-1" />
          )}

          <div className="flex shrink-0 items-center gap-0.5">
            <button type="button" onClick={onGoEdit} className={iconBtn} aria-label="Edit plan">
              <Pencil size={16} />
            </button>

            <button
              type="button"
              onClick={onCopy}
              className={`${iconBtn} ${copied ? 'bg-sage-soft text-sage' : ''}`}
              aria-label={copied ? 'Copied' : 'Copy'}
              title={copied ? 'Copied!' : 'Copy recipe'}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
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
      )}

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
            shoppingUnitMode={shoppingUnitMode}
            checkedItems={checkedItems}
            onShoppingUnitsChange={onShoppingUnitsChange}
            onShoppingUnitModeChange={onShoppingUnitModeChange}
            onCheckedItemsChange={onCheckedItemsChange}
            onDaysChange={onDaysChange}
            showToolbar={false}
            showProgress={false}
          />
        ) : (
          <MealPortionsPanel
            portions={portions}
            dogsWithMER={dogsWithMER}
            mealsPerDay={mealsPerDay}
            unit={unit}
            portionUnits={portionUnits}
            onPortionUnitsChange={onPortionUnitsChange}
            onMealsChange={onMealsChange}
            showToolbar={false}
          />
        )}
      </div>

      <div className="hidden print:block print:space-y-4">
        <ShoppingListPanel
          shoppingList={shoppingList}
          numberOfDays={numberOfDays}
          unit={unit}
          shoppingUnits={shoppingUnits}
          shoppingUnitMode={shoppingUnitMode}
          checkedItems={checkedItems}
          onShoppingUnitsChange={onShoppingUnitsChange}
          onShoppingUnitModeChange={onShoppingUnitModeChange}
          onCheckedItemsChange={onCheckedItemsChange}
          onDaysChange={onDaysChange}
        />

        <MealPortionsPanel
          portions={portions}
          dogsWithMER={dogsWithMER}
          mealsPerDay={mealsPerDay}
          unit={unit}
          portionUnits={portionUnits}
          onPortionUnitsChange={onPortionUnitsChange}
          onMealsChange={onMealsChange}
        />
      </div>
    </div>
  );
}
