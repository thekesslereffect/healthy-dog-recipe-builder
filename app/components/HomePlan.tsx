import {
  calculateMealPortions,
  calculateShoppingList,
  type Dog,
  type Recipe,
} from '../utils/recipeCalculator';
import type { MassUnit, WeightUnit } from '../utils/format';
import { btnPrimary, btnSecondary, card, fieldLabel, inputBase } from './ui';
import {
  BookmarkIcon,
  BowlIcon,
  CopyIcon,
  DownloadIcon,
  PrinterIcon,
  SlidersIcon,
} from './icons';
import { ShoppingListPanel } from './ShoppingListPanel';
import { MealPortionsPanel } from './MealPortionsPanel';
import { DogAvatar } from './DogAvatar';

interface HomePlanProps {
  recipe: Recipe | null;
  /** True when Build has an unconfirmed draft. */
  hasDraft: boolean;
  dogsWithMER: Dog[];
  numberOfDays: number;
  mealsPerDay: number;
  unit: WeightUnit;
  shoppingUnits: Record<string, MassUnit>;
  portionUnits: Record<string, MassUnit>;
  copied: boolean;
  saveName: string;
  justSaved: boolean;
  justUpdated: boolean;
  currentSavedName?: string;
  canGenerate: boolean;
  hasInvalidDog: boolean;
  onDaysChange: (days: number) => void;
  onMealsChange: (meals: number) => void;
  onShoppingUnitsChange: (next: Record<string, MassUnit>) => void;
  onPortionUnitsChange: (next: Record<string, MassUnit>) => void;
  onCopy: () => void;
  onExportCsv: () => void;
  onSaveNameChange: (name: string) => void;
  onSave: () => void;
  onUpdate: () => void;
  onGoBuild: () => void;
  onGoProfile: () => void;
  onGoSaved: () => void;
}

export function HomePlan({
  recipe,
  hasDraft,
  dogsWithMER,
  numberOfDays,
  mealsPerDay,
  unit,
  shoppingUnits,
  portionUnits,
  copied,
  saveName,
  justSaved,
  justUpdated,
  currentSavedName,
  canGenerate,
  hasInvalidDog,
  onDaysChange,
  onMealsChange,
  onShoppingUnitsChange,
  onPortionUnitsChange,
  onCopy,
  onExportCsv,
  onSaveNameChange,
  onSave,
  onUpdate,
  onGoBuild,
  onGoProfile,
  onGoSaved,
}: HomePlanProps) {
  if (!recipe) {
    return (
      <div className="space-y-4 print:hidden">
        <section className={`${card} text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <BowlIcon width={28} height={28} />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-black">
            {hasDraft ? 'Finish your draft' : 'Your plan starts here'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
            {hasDraft
              ? 'You have a draft in Build. Name it and confirm to put the shopping list and feeding amounts here.'
              : 'Build a draft, reroll until you like it, then confirm — this screen becomes your shopping list and feeding guide.'}
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onGoBuild}
              disabled={!canGenerate && !hasDraft}
              className={`${btnPrimary} inline-flex items-center justify-center gap-2`}
            >
              <SlidersIcon width={16} height={16} />
              {hasDraft ? 'Finish draft' : 'Build a plan'}
            </button>
            {hasInvalidDog && (
              <button
                type="button"
                onClick={onGoProfile}
                className={`${btnSecondary} inline-flex items-center justify-center`}
              >
                Set up your dogs
              </button>
            )}
            <button
              type="button"
              onClick={onGoSaved}
              className={`${btnSecondary} inline-flex items-center justify-center gap-2`}
            >
              <BookmarkIcon width={16} height={16} />
              Open saved
            </button>
          </div>
          {!canGenerate && !hasInvalidDog && !hasDraft && (
            <p className="mt-3 text-sm text-zinc-500">Finish ingredient ratios in Build first.</p>
          )}
        </section>

        {dogsWithMER.length > 0 && (
          <section className={card}>
            <h3 className="text-sm font-medium text-zinc-500">Your pack</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {dogsWithMER.map((dog) => (
                <button
                  key={dog.id ?? dog.name}
                  type="button"
                  onClick={onGoProfile}
                  className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-black transition-colors hover:border-zinc-300"
                >
                  <DogAvatar name={dog.name} avatar={dog.avatar} size="sm" />
                  {dog.name || 'Unnamed'}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const shoppingList = calculateShoppingList(recipe, numberOfDays);
  const portions = calculateMealPortions(recipe, dogsWithMER, mealsPerDay);

  return (
    <div className="space-y-5 print:space-y-2">
      {/* Compact plan toolbar */}
      <section className={`${card} print:hidden`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className={fieldLabel} htmlFor="home-days">
                Days
              </label>
              <input
                id="home-days"
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                value={numberOfDays}
                onChange={(e) => onDaysChange(Math.max(1, parseInt(e.target.value) || 1))}
                className={`${inputBase} w-20`}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-5">
              {dogsWithMER.map((dog) => (
                <DogAvatar
                  key={dog.id ?? dog.name}
                  name={dog.name}
                  avatar={dog.avatar}
                  size="sm"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              <CopyIcon width={15} height={15} />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              <DownloadIcon width={15} height={15} />
              CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              <PrinterIcon width={15} height={15} />
              Print
            </button>
            <button
              type="button"
              onClick={onGoBuild}
              className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <SlidersIcon width={15} height={15} />
              Adjust
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center">
          {currentSavedName && (
            <button
              type="button"
              onClick={onUpdate}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <BookmarkIcon width={15} height={15} />
              {justUpdated ? 'Updated' : `Update “${currentSavedName}”`}
            </button>
          )}
          <input
            type="text"
            value={saveName}
            onChange={(e) => onSaveNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
            }}
            placeholder="Name this plan…"
            aria-label="Recipe name"
            className={`${inputBase} sm:max-w-xs`}
          />
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3.5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            <BookmarkIcon width={15} height={15} />
            {justSaved ? 'Saved' : currentSavedName ? 'Save as new' : 'Save'}
          </button>
        </div>
      </section>

      {/* Print-only summary */}
      <div className="hidden print:mb-2 print:block print:text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="mb-1 font-semibold">Dogs:</h3>
            {dogsWithMER.map((dog) => (
              <div key={dog.id ?? dog.name} className="mb-0.5">
                {dog.name} — {dog.weight} lbs — Activity: {dog.activityMultiplier}
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-1 font-semibold">Settings:</h3>
            <div>
              Duration: {numberOfDays} days · {mealsPerDay} meals/day
            </div>
          </div>
        </div>
      </div>

      <ShoppingListPanel
        shoppingList={shoppingList}
        numberOfDays={numberOfDays}
        unit={unit}
        shoppingUnits={shoppingUnits}
        onShoppingUnitsChange={onShoppingUnitsChange}
        featured
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
  );
}
