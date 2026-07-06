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
  Button,
  EmptyState,
  Segment,
  SegmentControl,
  Select,
  Stepper,
} from './ui';

import {
  ArrowRight,
  Check,
  CookingPot,
  Copy,
  Flame,
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
  mealsFedToday: number;
  feedingStreak: number;
  onLogMealFed: () => void;
  canGenerate: boolean;
  needsSetup: boolean;
  hasInvalidDog: boolean;
  onDaysChange: (days: number) => void;
  onMealsChange: (meals: number) => void;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  onShoppingUnitModeChange: (mode: ShoppingMassUnitMode) => void;
  onCheckedItemsChange: (next: Record<string, boolean>) => void;
  onPortionUnitsChange: (next: Record<string, MassUnit>) => void;
  onCopy: () => void;
  onGoBuild: () => void;
  onGoProfile: () => void;
  onGoSetup: () => void;
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
  mealsFedToday,
  feedingStreak,
  onLogMealFed,
  canGenerate,
  needsSetup,
  hasInvalidDog,
  onDaysChange,
  onMealsChange,
  onShoppingUnitsChange,
  onShoppingUnitModeChange,
  onCheckedItemsChange,
  onPortionUnitsChange,
  onCopy,
  onGoBuild,
  onGoProfile,
  onGoSetup,
}: HomePlanProps) {
  const [pane, setPane] = useState<PlanPane>('shop');
  if (!recipe) {
    return (
      <EmptyState
        className="h-full min-h-0 print:hidden"
        icon={hasDraft ? <Sparkles size={28} /> : <CookingPot size={28} />}
        title={needsSetup ? 'Set up your dogs' : hasDraft ? 'Almost there!' : 'Your kitchen awaits'}
        description={
          needsSetup
            ? 'Add at least one dog with a name and weight before building a meal plan.'
            : hasDraft
              ? 'Name and confirm your draft to unlock shopping and feeding guides.'
              : 'Pick a saved plan from the menu above, or create a new one.'
        }
      >
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
          {needsSetup ? (
            <Button onClick={onGoSetup} className="inline-flex items-center justify-center gap-2 py-3">
              Set up dogs
              <ArrowRight size={14} className="opacity-70" />
            </Button>
          ) : (
            <Button
              onClick={onGoBuild}
              disabled={!canGenerate && !hasDraft}
              className="inline-flex items-center justify-center gap-2 py-3"
            >
              <SlidersHorizontal size={16} />
              {hasDraft ? 'Finish draft' : 'Build a plan'}
              <ArrowRight size={14} className="opacity-70" />
            </Button>
          )}

          {!needsSetup && hasInvalidDog && (
            <Button variant="secondary" onClick={onGoSetup}>
              Finish dog setup
            </Button>
          )}
        </div>
      </EmptyState>
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
  const allMealsFed = mealsFedToday >= mealsPerDay;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 pb-1.5 print:hidden">
        <SegmentControl>
          <Segment active={pane === 'shop'} onClick={() => setPane('shop')}>
            Shop
          </Segment>
          <Segment active={pane === 'feed'} onClick={() => setPane('feed')}>
            Feed
          </Segment>
        </SegmentControl>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {pane === 'shop' ? (
            <>
              <Stepper
                value={numberOfDays}
                label="Days"
                min={1}
                max={30}
                decrementLabel="Fewer days"
                incrementLabel="More days"
                onChange={onDaysChange}
              />

              <Select
                variant="toolbar"
                value={shoppingUnitMode}
                onChange={(e) => applyShoppingUnitMode(e.target.value as ShoppingMassUnitMode)}
                aria-label="Shopping list units"
              >
                <option value="auto">Auto</option>
                {MASS_UNITS.map((massUnit) => (
                  <option key={massUnit} value={massUnit}>
                    {massUnitLabel(massUnit)}
                  </option>
                ))}
              </Select>
            </>
          ) : (
            <>
              <Stepper
                value={mealsPerDay}
                label="Meals / Day"
                min={1}
                max={3}
                decrementLabel="Fewer meals per day"
                incrementLabel="More meals per day"
                onChange={onMealsChange}
              />

              <Select
                variant="toolbar"
                value={portionGlobalUnit}
                onChange={(e) => setAllPortionUnits(e.target.value as MassUnit)}
                aria-label="Portion units"
              >
                {MASS_UNITS.map((massUnit) => (
                  <option key={massUnit} value={massUnit}>
                    {massUnitLabel(massUnit)}
                  </option>
                ))}
              </Select>
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
            <Button
              variant="icon"
              onClick={onCopy}
              className={copied ? 'bg-sage-soft text-sage' : undefined}
              aria-label={copied ? 'Copied' : 'Copy'}
              title={copied ? 'Copied!' : 'Copy recipe'}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>

            <Button variant="icon" onClick={() => window.print()} aria-label="Print">
              <Printer size={16} />
            </Button>
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

      {pane === 'feed' && (
        <div className="shrink-0 space-y-4 border-t border-border px-1 pt-5 pb-1 print:hidden sm:space-y-5 sm:pt-6">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className="flex items-center gap-2">
              <Flame
                size={18}
                className={feedingStreak > 0 ? 'text-accent' : 'text-muted'}
              />
              <p className="text-sm font-semibold text-foreground sm:text-base">
                {feedingStreak > 0
                  ? `${feedingStreak}-day feeding streak`
                  : 'Start a feeding streak'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                {Array.from({ length: mealsPerDay }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i < mealsFedToday ? 'bg-sage' : 'bg-surface-muted ring-1 ring-inset ring-border'
                    }`}
                  />
                ))}
              </span>
              <span className="text-xs text-muted sm:text-sm">
                {allMealsFed
                  ? 'All meals fed today'
                  : `${mealsFedToday} of ${mealsPerDay} meal${mealsPerDay > 1 ? 's' : ''} fed today`}
              </span>
            </div>
          </div>
          <Button
            onClick={onLogMealFed}
            variant={allMealsFed ? 'secondary' : 'primary'}
            aria-pressed={allMealsFed}
            className={`inline-flex w-full items-center justify-center gap-2 py-3.5 sm:py-4 ${
              allMealsFed ? 'bg-sage-soft text-sage hover:bg-sage-soft' : ''
            }`}
          >
            {allMealsFed ? (
              <>
                <Check size={16} />
                Fed today
              </>
            ) : mealsPerDay > 1 ? (
              `Feed meal ${mealsFedToday + 1}`
            ) : (
              'Mark as fed'
            )}
          </Button>
        </div>
      )}

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
