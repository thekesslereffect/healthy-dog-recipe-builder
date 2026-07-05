import { useState } from 'react';

import {

  calculateMealPortions,

  calculateShoppingList,

  type Dog,

  type Recipe,

} from '../utils/recipeCalculator';

import type { MassUnit, WeightUnit } from '../utils/format';

import { btnGhost, btnPrimary, btnSecondary, emptyIconWrap, iconBtn, segmentBtn, segmentTrack } from './ui';

import {

  ArrowRight,

  Bookmark,

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

      <div className="flex h-full min-h-0 flex-col items-center justify-center px-4 text-center print:hidden">

        <div className={emptyIconWrap}>

          {hasDraft ? <Sparkles size={28} /> : <CookingPot size={28} />}

        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">

          {hasDraft ? 'Almost there!' : 'Your kitchen awaits'}

        </h2>

        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">

          {hasDraft

            ? 'Name and confirm your draft in Build to unlock shopping lists and feeding guides.'

            : 'Create a balanced meal plan tailored to your pack — then shop and feed with confidence.'}

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

          <button

            type="button"

            onClick={onGoSaved}

            className={`${btnGhost} inline-flex items-center justify-center gap-2`}

          >

            <Bookmark size={15} />

            Browse saved plans

          </button>

        </div>

      </div>

    );

  }



  const shoppingList = calculateShoppingList(recipe, numberOfDays);

  const portions = calculateMealPortions(recipe, dogsWithMER, mealsPerDay);



  return (

    <div className="flex h-full min-h-0 flex-col">

      <div className="flex shrink-0 items-center justify-between gap-2 pb-3 print:hidden">

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

            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98]"

          >

            <Pencil size={14} />

            Edit

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

