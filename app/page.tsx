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
import { ingredients } from './data/ingredients';
import { recipeToText, shoppingListToCsv, downloadTextFile } from './utils/export';
import { weightUnitLabel, type WeightUnit } from './utils/format';
import { createId, type SavedRecipe } from './utils/savedRecipes';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Disclaimer } from './components/Disclaimer';
import { DogCard } from './components/DogCard';
import { RatioControls } from './components/RatioControls';
import { CountControls } from './components/CountControls';
import { RecipeResults } from './components/RecipeResults';
import { SavedRecipes } from './components/SavedRecipes';
import { TopTabs, BottomTabs, type TabDef, type TabId } from './components/TabBar';
import { btnPrimary, card, fieldLabel, inputBase, sectionTitle } from './components/ui';
import { PawIcon, SlidersIcon, BowlIcon, PlusIcon, BookmarkIcon } from './components/icons';

const DEFAULT_DOGS: Dog[] = [
  { name: 'Jackson', weight: 30, activityMultiplier: 1.3, allergies: [] },
  { name: 'Joey', weight: 12, activityMultiplier: 1.0, allergies: [] },
];

const TABS: TabDef[] = [
  { id: 'dogs', label: 'Dogs', icon: PawIcon },
  { id: 'build', label: 'Build', icon: SlidersIcon },
  { id: 'recipe', label: 'Recipe', icon: BowlIcon },
  { id: 'saved', label: 'Saved', icon: BookmarkIcon },
];

export default function Home() {
  const [unit, setUnit] = useLocalStorage<WeightUnit>('hdrb.unit', 'lb');
  const [dogs, setDogs] = useLocalStorage<Dog[]>('hdrb.dogs', DEFAULT_DOGS);
  const [numberOfDays, setNumberOfDays] = useLocalStorage('hdrb.days', 7);
  const [mealsPerDay, setMealsPerDay] = useLocalStorage('hdrb.meals', 2);
  const [ratios, setRatios] = useLocalStorage<CategoryRatios>('hdrb.ratios', RECOMMENDED_RATIOS);
  const [counts, setCounts] = useLocalStorage<CategoryCounts>('hdrb.counts', DEFAULT_COUNTS);
  const [locked, setLocked] = useLocalStorage<Partial<Record<Category, string[]>>>('hdrb.locked', {});
  const [recipe, setRecipe] = useLocalStorage<Recipe | null>('hdrb.recipe', null);
  const [saved, setSaved] = useLocalStorage<SavedRecipe[]>('hdrb.saved', []);
  const [activeTab, setActiveTab] = useState<TabId>('dogs');
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const percentageSum = CATEGORIES.reduce((sum, c) => sum + ratios[c], 0);
  const isPercentageValid = Math.abs(percentageSum - 1) < 0.001;
  const hasInvalidDog = dogs.some((d) => !d.name?.trim() || d.weight <= 0);
  const canGenerate = isPercentageValid && !hasInvalidDog;

  const dogsWithMER = dogs.map((dog) => ({ ...dog, MER: calculateDailyCalories(dog) }));
  const allergyList = Array.from(new Set(dogs.flatMap((d) => d.allergies ?? [])));

  const computeRecipe = (
    dogList: Dog[],
    lockedState: Partial<Record<Category, string[]>> = locked,
  ): Recipe => {
    const withMER = dogList.map((dog) => ({ ...dog, MER: calculateDailyCalories(dog) }));
    const totalMER = getTotalMER(withMER);
    const excluded = Array.from(new Set(dogList.flatMap((d) => d.allergies ?? [])));
    return createRecipe(totalMER, withMER, ratios, counts, { excluded, locked: lockedState });
  };

  const generate = () => {
    if (!canGenerate) return;
    setRecipe(computeRecipe(dogs));
  };

  const addDog = () =>
    setDogs([...dogs, { name: '', weight: 0, activityMultiplier: 1.6, allergies: [] }]);

  const removeDog = (index: number) => {
    if (dogs.length > 1) setDogs(dogs.filter((_, i) => i !== index));
  };

  const updateDog = (index: number, field: keyof Dog, value: string | number | string[]) => {
    const nextDogs = dogs.map((dog, i) => (i === index ? { ...dog, [field]: value } : dog));
    setDogs(nextDogs);
    // Keep an already-generated recipe consistent when allergies change.
    if (field === 'allergies' && recipe) {
      setRecipe(computeRecipe(nextDogs));
    }
  };

  // Changing the ingredient mix invalidates a previously generated recipe.
  const clearRecipe = () => {
    if (recipe) setRecipe(null);
  };

  const updateRatio = (category: Category, value: number) => {
    setRatios({ ...ratios, [category]: value });
    clearRecipe();
  };

  const updateCount = (category: Category, value: number) => {
    setCounts({ ...counts, [category]: value });
    clearRecipe();
  };

  const applyRecommendedRatios = () => {
    setRatios({ ...RECOMMENDED_RATIOS });
    clearRecipe();
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

  // Swap a single ingredient in the current recipe, keeping the same calorie
  // target for that slot (recomputing grams for the new ingredient).
  const swapIngredient = (category: Category, oldName: string, newName: string) => {
    if (!recipe || oldName === newName) return;
    const data = ingredients[category].find((i) => i.name === newName);
    if (!data) return;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const cpg = data.caloriesPer100g || 0;

    const nextCategoryItems = recipe.ingredients[category].map((row) => {
      if (row.name !== oldName) return row;
      const grams = cpg > 0 ? round2((row.calories / cpg) * 100) : 0;
      return { name: newName, grams, calories: round2((grams * cpg) / 100) };
    });

    const nextRecipe: Recipe = {
      ...recipe,
      ingredients: { ...recipe.ingredients, [category]: nextCategoryItems },
    };

    let total = 0;
    for (const c of CATEGORIES) {
      for (const row of nextRecipe.ingredients[c]) total += row.calories;
    }
    for (const supplement of nextRecipe.ingredients.supplements) total += supplement.calories;
    nextRecipe.totalCalories = round2(total);

    setRecipe(nextRecipe);

    // Keep lock state pointing at the ingredient that is actually in the recipe.
    setLocked((prev) => {
      const current = prev[category] ?? [];
      if (!current.includes(oldName)) return prev;
      return { ...prev, [category]: current.map((n) => (n === oldName ? newName : n)) };
    });
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

  const saveCurrentRecipe = () => {
    if (!recipe) return;
    const name = saveName.trim() || `Recipe ${new Date().toLocaleDateString()}`;
    const entry: SavedRecipe = {
      id: createId(),
      name,
      savedAt: Date.now(),
      dogs,
      ratios,
      counts,
      numberOfDays,
      mealsPerDay,
      locked,
      recipe,
    };
    setSaved([entry, ...saved]);
    setSaveName('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const loadSavedRecipe = (id: string) => {
    const entry = saved.find((s) => s.id === id);
    if (!entry) return;
    setDogs(entry.dogs);
    setRatios(entry.ratios);
    setCounts(entry.counts);
    setNumberOfDays(entry.numberOfDays);
    setMealsPerDay(entry.mealsPerDay);
    setLocked(entry.locked);
    setRecipe(entry.recipe);
    setActiveTab('recipe');
  };

  const deleteSavedRecipe = (id: string) => {
    setSaved(saved.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-white text-black print:min-h-0">
      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8 print:px-2 print:py-2 print:max-w-none print:pb-2">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between print:mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl lg:text-4xl print:text-2xl">
              Healthy Dog Recipe Builder
            </h1>
            <p className="mt-1 text-sm text-zinc-500 sm:text-base print:hidden">
              Balanced, nutritious meals for your dogs.
            </p>
          </div>
          <TopTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </header>

        <div className="mb-6 print:mb-2">
          <Disclaimer />
        </div>

        {/* ---------------- Dogs ---------------- */}
        {activeTab === 'dogs' && (
          <div className="space-y-6 print:hidden">
            <section className={card}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className={sectionTitle}>Your Dogs</h2>
                <div className="flex items-center gap-2">
                  <div
                    className="inline-flex rounded-lg border border-zinc-200 p-0.5"
                    role="group"
                    aria-label="Weight units"
                  >
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
                  <button
                    onClick={addDog}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
                  >
                    <PlusIcon width={15} height={15} />
                    Add Dog
                  </button>
                </div>
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

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setActiveTab('build')}
                disabled={hasInvalidDog}
                className={`${btnPrimary} w-full sm:w-auto`}
              >
                Continue to Build
              </button>
              {hasInvalidDog && (
                <span className="text-sm text-zinc-500">
                  Add a name and weight for each dog to continue.
                </span>
              )}
            </div>
          </div>
        )}

        {/* ---------------- Build ---------------- */}
        {activeTab === 'build' && (
          <div className="space-y-6 print:hidden">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <RatioControls
                ratios={ratios}
                onChange={updateRatio}
                onApplyRecommended={applyRecommendedRatios}
              />
              <CountControls counts={counts} onChange={updateCount} />
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setActiveTab('recipe')}
                disabled={!isPercentageValid}
                className={`${btnPrimary} w-full sm:w-auto`}
              >
                Continue to Recipe
              </button>
              {!isPercentageValid && (
                <span className="text-sm text-zinc-500">Ingredient ratios must total 100%.</span>
              )}
            </div>
          </div>
        )}

        {/* ---------------- Recipe ---------------- */}
        {activeTab === 'recipe' && (
          <div className="space-y-6 print:space-y-2">
            {/* Generation controls */}
            <section className={`${card} print:hidden`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full max-w-[10rem]">
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
                <button
                  onClick={generate}
                  disabled={!canGenerate}
                  className={`${btnPrimary} w-full sm:w-auto`}
                >
                  {recipe ? 'Regenerate Recipe' : 'Generate Recipe'}
                </button>
              </div>
              {allergyList.length > 0 && (
                <p className="mt-3 text-sm text-zinc-500">
                  Avoiding for all dogs:{' '}
                  <span className="text-zinc-700">{allergyList.join(', ')}</span>
                </p>
              )}
              {!canGenerate && (
                <p className="mt-3 text-sm text-zinc-500">
                  {!isPercentageValid
                    ? 'Ingredient ratios must total 100% (see Build).'
                    : 'Finish setting up your dogs first (see Dogs).'}
                </p>
              )}

              {recipe && (
                <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveCurrentRecipe();
                    }}
                    placeholder="Name this recipe…"
                    aria-label="Recipe name"
                    className={`${inputBase} sm:max-w-xs`}
                  />
                  <button
                    type="button"
                    onClick={saveCurrentRecipe}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
                  >
                    <BookmarkIcon width={16} height={16} />
                    {justSaved ? 'Saved' : 'Save recipe'}
                  </button>
                </div>
              )}
            </section>

            {recipe ? (
              <>
                {/* Print-only summary of settings */}
                <div className="hidden print:mb-2 print:block print:text-xs">
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
                        Ratios:{' '}
                        {CATEGORIES.map(
                          (c) => `${c[0].toUpperCase()}${Math.round(ratios[c] * 100)}`,
                        ).join(' ')}
                      </div>
                    </div>
                  </div>
                </div>

                <RecipeResults
                  recipe={recipe}
                  ratios={ratios}
                  numberOfDays={numberOfDays}
                  mealsPerDay={mealsPerDay}
                  dogsWithMER={dogsWithMER}
                  unit={unit}
                  locked={locked}
                  excluded={allergyList}
                  copied={copied}
                  onToggleLock={toggleLock}
                  onSwap={swapIngredient}
                  onMealsChange={setMealsPerDay}
                  onCopy={copyRecipe}
                  onExportCsv={exportCsv}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 px-6 py-12 text-center print:hidden">
                <p className="mx-auto max-w-sm text-sm text-zinc-500">
                  Press “Generate Recipe” above to create a balanced meal plan for your dogs.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ---------------- Saved ---------------- */}
        {activeTab === 'saved' && (
          <div className="print:hidden">
            <SavedRecipes saved={saved} onLoad={loadSavedRecipe} onDelete={deleteSavedRecipe} />
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

      <BottomTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
