'use client';

import { useState } from 'react';
import {
  CATEGORIES,
  DEFAULT_COUNTS,
  RECOMMENDED_RATIOS,
  type Category,
  type CategoryCounts,
  type CategoryRatios,
} from './utils/constants';
import {
  calculateDailyCalories,
  createRecipe,
  getTotalMER,
  type Dog,
  type Recipe,
} from './utils/recipeCalculator';
import { recipeToText, shoppingListToCsv, downloadTextFile } from './utils/export';
import { weightUnitLabel, type WeightUnit } from './utils/format';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Disclaimer } from './components/Disclaimer';
import { DogCard } from './components/DogCard';
import { RatioControls } from './components/RatioControls';
import { CountControls } from './components/CountControls';
import { RecipeResults } from './components/RecipeResults';
import { btnPrimary, btnSecondary, card, fieldLabel, inputBase, sectionTitle } from './components/ui';
import { CopyIcon, DownloadIcon, PrinterIcon } from './components/icons';

const DEFAULT_DOGS: Dog[] = [
  { name: 'Jackson', weight: 30, activityMultiplier: 1.3 },
  { name: 'Joey', weight: 12, activityMultiplier: 1.0 },
];

export default function Home() {
  const [unit, setUnit] = useLocalStorage<WeightUnit>('hdrb.unit', 'lb');
  const [dogs, setDogs] = useLocalStorage<Dog[]>('hdrb.dogs', DEFAULT_DOGS);
  const [numberOfDays, setNumberOfDays] = useLocalStorage('hdrb.days', 7);
  const [mealsPerDay, setMealsPerDay] = useLocalStorage('hdrb.meals', 2);
  const [ratios, setRatios] = useLocalStorage<CategoryRatios>('hdrb.ratios', RECOMMENDED_RATIOS);
  const [counts, setCounts] = useLocalStorage<CategoryCounts>('hdrb.counts', DEFAULT_COUNTS);
  const [excluded, setExcluded] = useLocalStorage<string[]>('hdrb.excluded', []);
  const [locked, setLocked] = useLocalStorage<Partial<Record<Category, string[]>>>('hdrb.locked', {});
  const [recipe, setRecipe] = useLocalStorage<Recipe | null>('hdrb.recipe', null);
  const [copied, setCopied] = useState(false);

  const percentageSum = CATEGORIES.reduce((sum, c) => sum + ratios[c], 0);
  const isPercentageValid = Math.abs(percentageSum - 1) < 0.001;
  const hasInvalidDog = dogs.some((d) => !d.name?.trim() || d.weight <= 0);
  const canGenerate = isPercentageValid && !hasInvalidDog;

  const dogsWithMER = dogs.map((dog) => ({ ...dog, MER: calculateDailyCalories(dog) }));

  const buildRecipe = (overrides?: {
    excluded?: string[];
    locked?: Partial<Record<Category, string[]>>;
  }): Recipe => {
    const totalMER = getTotalMER(dogsWithMER);
    return createRecipe(totalMER, dogsWithMER, ratios, counts, {
      excluded: overrides?.excluded ?? excluded,
      locked: overrides?.locked ?? locked,
    });
  };

  const generate = () => {
    if (!canGenerate) return;
    setRecipe(buildRecipe());
  };

  const addDog = () => setDogs([...dogs, { name: '', weight: 0, activityMultiplier: 1.6 }]);

  const removeDog = (index: number) => {
    if (dogs.length > 1) setDogs(dogs.filter((_, i) => i !== index));
  };

  const updateDog = (index: number, field: keyof Dog, value: string | number) => {
    setDogs(dogs.map((dog, i) => (i === index ? { ...dog, [field]: value } : dog)));
  };

  const toggleLock = (category: Category, name: string) => {
    setLocked((prev) => {
      const current = prev[category] ?? [];
      const next = current.includes(name)
        ? current.filter((n) => n !== name)
        : [...current, name];
      return { ...prev, [category]: next };
    });
  };

  const excludeIngredient = (name: string) => {
    const nextExcluded = Array.from(new Set([...excluded, name]));
    const nextLocked: Partial<Record<Category, string[]>> = {};
    for (const category of CATEGORIES) {
      const kept = (locked[category] ?? []).filter((n) => n !== name);
      if (kept.length) nextLocked[category] = kept;
    }
    setExcluded(nextExcluded);
    setLocked(nextLocked);
    setRecipe(buildRecipe({ excluded: nextExcluded, locked: nextLocked }));
  };

  const restoreIngredient = (name: string) => {
    setExcluded(excluded.filter((n) => n !== name));
  };

  const copyRecipe = async () => {
    if (!recipe) return;
    try {
      await navigator.clipboard.writeText(
        recipeToText(recipe, numberOfDays, dogsWithMER, mealsPerDay),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no-op.
    }
  };

  const exportCsv = () => {
    if (!recipe) return;
    downloadTextFile('dog-shopping-list.csv', shoppingListToCsv(recipe, numberOfDays), 'text/csv');
  };

  return (
    <div className="min-h-screen bg-white text-black print:min-h-0">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 print:px-2 print:py-2 print:max-w-none">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 sm:mb-10 print:mb-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl print:text-2xl">
              Healthy Dog Recipe Builder
            </h1>
            <p className="mt-2 text-base text-zinc-500 sm:mt-3 sm:text-lg print:hidden">
              Create balanced, nutritious meals for your furry friends.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 print:hidden" role="group" aria-label="Weight units">
            {(['lb', 'kg'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  unit === u ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'
                }`}
              >
                {weightUnitLabel(u)}
              </button>
            ))}
          </div>
        </header>

        <Disclaimer />

        {/* Config */}
        <div className="space-y-6 sm:space-y-8 print:hidden">
          {/* Dogs */}
          <section className={card}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className={sectionTitle}>Your Dogs</h2>
              <button
                onClick={addDog}
                className="shrink-0 rounded-lg bg-zinc-100 px-3.5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
              >
                + Add Dog
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dogs.map((dog, index) => (
                <DogCard
                  key={index}
                  dog={dog}
                  index={index}
                  unit={unit}
                  dailyCalories={calculateDailyCalories(dog)}
                  canRemove={dogs.length > 1}
                  onChange={(field, value) => updateDog(index, field, value)}
                  onRemove={() => removeDog(index)}
                />
              ))}
            </div>
          </section>

          {/* Plan */}
          <section className={card}>
            <h2 className={sectionTitle}>Plan</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-md">
              <div>
                <label className={fieldLabel} htmlFor="days">
                  Shopping duration (days)
                </label>
                <input
                  id="days"
                  type="number"
                  inputMode="numeric"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className={inputBase}
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="meals">
                  Meals per day
                </label>
                <select
                  id="meals"
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
                  className={inputBase}
                >
                  <option value={1}>1 meal</option>
                  <option value={2}>2 meals</option>
                  <option value={3}>3 meals</option>
                </select>
              </div>
            </div>
          </section>

          {/* Ratios + Counts */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <RatioControls
              ratios={ratios}
              onChange={(category, value) => setRatios({ ...ratios, [category]: value })}
              onApplyRecommended={() => setRatios({ ...RECOMMENDED_RATIOS })}
            />
            <CountControls
              counts={counts}
              onChange={(category, value) => setCounts({ ...counts, [category]: value })}
            />
          </div>

          {/* Excluded ingredients */}
          {excluded.length > 0 && (
            <section className={card}>
              <h2 className={sectionTitle}>Excluded Ingredients</h2>
              <p className="mt-1 mb-3 text-sm text-zinc-500">
                These won&apos;t appear in recipes (e.g. allergies). Click to restore.
              </p>
              <div className="flex flex-wrap gap-2">
                {excluded.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => restoreIngredient(name)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 transition-colors hover:bg-zinc-200"
                    title="Restore this ingredient"
                  >
                    {name}
                    <span aria-hidden="true" className="text-zinc-400">×</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Action bar (sticky on mobile) */}
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={generate}
                disabled={!canGenerate}
                className={`${btnPrimary} w-full sm:w-auto`}
              >
                {recipe ? 'Regenerate Recipe' : 'Generate Recipe'}
              </button>

              {recipe && (
                <div className="flex flex-wrap gap-3">
                  <button onClick={copyRecipe} className={`${btnSecondary} inline-flex items-center gap-2`}>
                    <CopyIcon width={16} height={16} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={exportCsv} className={`${btnSecondary} inline-flex items-center gap-2`}>
                    <DownloadIcon width={16} height={16} />
                    CSV
                  </button>
                  <button onClick={() => window.print()} className={`${btnSecondary} inline-flex items-center gap-2`}>
                    <PrinterIcon width={16} height={16} />
                    Print
                  </button>
                </div>
              )}

              {hasInvalidDog && (
                <span className="text-sm text-zinc-500">
                  Add a name and weight for each dog to continue.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Print-only summary of settings */}
        {recipe && (
          <div className="hidden print:mt-2 print:block print:text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-1 font-semibold">Dogs:</h3>
                {dogs.map((dog, index) => (
                  <div key={index} className="mb-0.5">
                    {dog.name} - {dog.weight} lbs - Activity: {dog.activityMultiplier}
                  </div>
                ))}
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Settings:</h3>
                <div>
                  Duration: {numberOfDays} days · {mealsPerDay} meals/day
                </div>
                <div className="mt-1">
                  Ratios: {CATEGORIES.map((c) => `${c[0].toUpperCase()}${Math.round(ratios[c] * 100)}`).join(' ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {recipe ? (
          <RecipeResults
            recipe={recipe}
            numberOfDays={numberOfDays}
            mealsPerDay={mealsPerDay}
            dogsWithMER={dogsWithMER}
            unit={unit}
            locked={locked}
            onToggleLock={toggleLock}
            onExclude={excludeIngredient}
            onReroll={generate}
          />
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-200 px-6 py-16 text-center print:hidden">
            <h2 className="text-xl font-semibold text-black">Ready to Generate</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Fill in your dog information and press “Generate Recipe” to create a healthy meal plan.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-zinc-200 pt-6 text-center print:hidden">
          <p className="text-xs leading-relaxed text-zinc-400">
            Calories: RER = 70 × kg<sup>0.75</sup> × activity factor. Calcium: 1.25 mg/kcal (AAFCO 2016).
            Food values from USDA FoodData Central.
          </p>
          <p className="mt-2 text-sm text-zinc-400">Created by - Your Husband</p>
        </footer>
      </div>
    </div>
  );
}
