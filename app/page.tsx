'use client';

import { useEffect, useState } from 'react';
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
import { type MassUnit, type WeightUnit } from './utils/format';
import { createId, type SavedRecipe } from './utils/savedRecipes';
import { useLocalStorage } from './hooks/useLocalStorage';
import { HomePlan } from './components/HomePlan';
import { ProfileScreen } from './components/ProfileScreen';
import { RatioControls } from './components/RatioControls';
import { CountControls } from './components/CountControls';
import { DailyRecipePanel } from './components/DailyRecipePanel';
import { SavedRecipes } from './components/SavedRecipes';
import { TopTabs, BottomTabs, type TabDef, type TabId } from './components/TabBar';
import {
  btnPrimary,
  btnSecondary,
  card,
  fieldLabel,
  inputBase,
  pageSubtitle,
  pageTitle,
  sectionTitle,
} from './components/ui';
import {
  CartIcon,
  SlidersIcon,
  BookmarkIcon,
  UserIcon,
  ShuffleIcon,
} from './components/icons';

const DEFAULT_DOGS: Dog[] = [
  { id: 'default-jackson', name: 'Jackson', weight: 30, activityMultiplier: 1.3, allergies: [] },
  { id: 'default-joey', name: 'Joey', weight: 12, activityMultiplier: 1.0, allergies: [] },
];

const TABS: TabDef[] = [
  { id: 'home', label: 'Plan', icon: CartIcon },
  { id: 'build', label: 'Build', icon: SlidersIcon },
  { id: 'saved', label: 'Saved', icon: BookmarkIcon },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

const PAGE_META: Record<TabId, { title: string; subtitle: string }> = {
  home: {
    title: 'Plan',
    subtitle: 'Shopping list and feeding for your pack',
  },
  build: {
    title: 'Build',
    subtitle: 'Reroll until it looks right, then name and confirm',
  },
  saved: {
    title: 'Saved',
    subtitle: 'Plans you can reopen and edit',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Dogs, allergies, and preferences',
  },
};

export default function Home() {
  const [unit, setUnit] = useLocalStorage<WeightUnit>('hdrb.unit', 'lb');
  const [dogs, setDogs] = useLocalStorage<Dog[]>('hdrb.dogs', DEFAULT_DOGS);
  const [numberOfDays, setNumberOfDays] = useLocalStorage('hdrb.days', 7);
  const [mealsPerDay, setMealsPerDay] = useLocalStorage('hdrb.meals', 2);
  const [ratios, setRatios] = useLocalStorage<CategoryRatios>('hdrb.ratios', RECOMMENDED_RATIOS);
  const [counts, setCounts] = useLocalStorage<CategoryCounts>('hdrb.counts', DEFAULT_COUNTS);
  const [locked, setLocked] = useLocalStorage<Partial<Record<Category, string[]>>>('hdrb.locked', {});
  // Active plan shown on Plan tab (only set after confirm, or when opening a saved plan).
  const [recipe, setRecipe] = useLocalStorage<Recipe | null>('hdrb.recipe', null);
  // Working draft on Build — regenerate freely without touching the active plan.
  const [draftRecipe, setDraftRecipe] = useLocalStorage<Recipe | null>('hdrb.draft', null);
  const [saved, setSaved] = useLocalStorage<SavedRecipe[]>('hdrb.saved', []);
  const [shoppingUnits, setShoppingUnits] = useLocalStorage<Record<string, MassUnit>>(
    'hdrb.shoppingUnits',
    {},
  );
  const [portionUnits, setPortionUnits] = useLocalStorage<Record<string, MassUnit>>(
    'hdrb.portionUnits',
    {},
  );
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [draftName, setDraftName] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  // Migrate older saved dogs that predate stable ids.
  useEffect(() => {
    if (dogs.some((d) => !d.id)) {
      setDogs(dogs.map((d) => (d.id ? d : { ...d, id: createId() })));
    }
  }, [dogs, setDogs]);

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

  // Generate / reroll only updates the Build draft — Plan stays unchanged until confirm.
  const generateDraft = () => {
    if (!canGenerate) return;
    setDraftRecipe(computeRecipe(dogs));
  };

  const addDog = () =>
    setDogs([
      ...dogs,
      { id: createId(), name: '', weight: 0, activityMultiplier: 1.6, allergies: [] },
    ]);

  const removeDog = (index: number) => {
    if (dogs.length > 1) setDogs(dogs.filter((_, i) => i !== index));
  };

  const updateDog = (
    index: number,
    field: keyof Dog,
    value: string | number | string[] | undefined,
  ) => {
    const nextDogs = dogs.map((dog, i) => {
      if (i !== index) return dog;
      if (field === 'avatar' && value === undefined) {
        const { avatar: _removed, ...rest } = dog;
        return rest;
      }
      return { ...dog, [field]: value };
    });
    setDogs(nextDogs);
    // Allergies affect ingredient pools — refresh draft and active plan if present.
    if (field === 'allergies') {
      if (draftRecipe) setDraftRecipe(computeRecipe(nextDogs));
      if (recipe) setRecipe(computeRecipe(nextDogs));
    }
  };

  const clearDraft = () => {
    if (draftRecipe) setDraftRecipe(null);
  };

  const updateRatio = (category: Category, value: number) => {
    setRatios({ ...ratios, [category]: value });
    clearDraft();
  };

  const updateCount = (category: Category, value: number) => {
    setCounts({ ...counts, [category]: value });
    clearDraft();
  };

  const applyRecommendedRatios = () => {
    setRatios({ ...RECOMMENDED_RATIOS });
    clearDraft();
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

  const swapIngredient = (category: Category, oldName: string, newName: string) => {
    if (!draftRecipe || oldName === newName) return;
    const data = ingredients[category].find((i) => i.name === newName);
    if (!data) return;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const cpg = data.caloriesPer100g || 0;

    const nextCategoryItems = draftRecipe.ingredients[category].map((row) => {
      if (row.name !== oldName) return row;
      const grams = cpg > 0 ? round2((row.calories / cpg) * 100) : 0;
      return { name: newName, grams, calories: round2((grams * cpg) / 100) };
    });

    const nextRecipe: Recipe = {
      ...draftRecipe,
      ingredients: { ...draftRecipe.ingredients, [category]: nextCategoryItems },
    };

    let total = 0;
    for (const c of CATEGORIES) {
      for (const row of nextRecipe.ingredients[c]) total += row.calories;
    }
    for (const supplement of nextRecipe.ingredients.supplements) total += supplement.calories;
    nextRecipe.totalCalories = round2(total);

    setDraftRecipe(nextRecipe);

    setLocked((prev) => {
      const current = prev[category] ?? [];
      if (!current.includes(oldName)) return prev;
      return { ...prev, [category]: current.map((n) => (n === oldName ? newName : n)) };
    });
  };

  // Name + confirm commits the draft as the active Plan and saves it.
  const confirmDraft = () => {
    if (!draftRecipe) return;
    const name = draftName.trim() || `Plan ${new Date().toLocaleDateString()}`;
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
      recipe: draftRecipe,
    };
    setRecipe(draftRecipe);
    setSaved([entry, ...saved]);
    setCurrentSavedId(entry.id);
    setDraftRecipe(null);
    setDraftName('');
    setActiveTab('home');
  };

  const startAdjustingPlan = () => {
    // Seed Build from the active plan only when there isn't already a draft.
    if (recipe && !draftRecipe) setDraftRecipe(recipe);
    setActiveTab('build');
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

  const currentSaved = currentSavedId ? saved.find((s) => s.id === currentSavedId) : undefined;

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
    setCurrentSavedId(entry.id);
    setSaveName('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const updateSavedRecipe = () => {
    if (!recipe || !currentSavedId) return;
    setSaved(
      saved.map((s) =>
        s.id === currentSavedId
          ? {
              ...s,
              savedAt: Date.now(),
              dogs,
              ratios,
              counts,
              numberOfDays,
              mealsPerDay,
              locked,
              recipe,
            }
          : s,
      ),
    );
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 2000);
  };

  const renameSavedRecipe = (id: string, name: string) => {
    setSaved(saved.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const loadSavedRecipe = (id: string) => {
    const entry = saved.find((s) => s.id === id);
    if (!entry) return;
    setDogs(entry.dogs.map((d) => (d.id ? d : { ...d, id: createId() })));
    setRatios(entry.ratios);
    setCounts(entry.counts);
    setNumberOfDays(entry.numberOfDays);
    setMealsPerDay(entry.mealsPerDay);
    setLocked(entry.locked);
    setRecipe(entry.recipe);
    setDraftRecipe(null);
    setDraftName('');
    setCurrentSavedId(entry.id);
    setActiveTab('home');
  };

  const deleteSavedRecipe = (id: string) => {
    setSaved(saved.filter((s) => s.id !== id));
    if (id === currentSavedId) setCurrentSavedId(null);
  };

  const meta = PAGE_META[activeTab];

  return (
    <div className="min-h-screen bg-zinc-50 text-black print:min-h-0 print:bg-white">
      <div className="mx-auto w-full max-w-5xl px-3 pb-28 pt-4 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8 print:px-2 print:py-2 print:max-w-none print:pb-2">
        <header className="mb-5 flex items-start justify-between gap-3 sm:mb-8 print:mb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 print:hidden">
              Healthy Dog Recipe Builder
            </p>
            <h1 className={`${pageTitle} print:text-2xl`}>{meta.title}</h1>
            <p className={`${pageSubtitle} print:hidden`}>{meta.subtitle}</p>
          </div>
          <TopTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </header>

        {/* ---------------- Plan (home) ---------------- */}
        {activeTab === 'home' && (
          <HomePlan
            recipe={recipe}
            hasDraft={!!draftRecipe}
            dogsWithMER={dogsWithMER}
            numberOfDays={numberOfDays}
            mealsPerDay={mealsPerDay}
            unit={unit}
            shoppingUnits={shoppingUnits}
            portionUnits={portionUnits}
            copied={copied}
            saveName={saveName}
            justSaved={justSaved}
            justUpdated={justUpdated}
            currentSavedName={currentSaved?.name}
            canGenerate={canGenerate}
            hasInvalidDog={hasInvalidDog}
            onDaysChange={setNumberOfDays}
            onMealsChange={setMealsPerDay}
            onShoppingUnitsChange={setShoppingUnits}
            onPortionUnitsChange={setPortionUnits}
            onCopy={copyRecipe}
            onExportCsv={exportCsv}
            onSaveNameChange={setSaveName}
            onSave={saveCurrentRecipe}
            onUpdate={updateSavedRecipe}
            onGoBuild={startAdjustingPlan}
            onGoProfile={() => setActiveTab('profile')}
            onGoSaved={() => setActiveTab('saved')}
          />
        )}

        {/* ---------------- Build ---------------- */}
        {activeTab === 'build' && (
          <div className="space-y-5 print:hidden">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RatioControls
                ratios={ratios}
                onChange={updateRatio}
                onApplyRecommended={applyRecommendedRatios}
              />
              <CountControls counts={counts} onChange={updateCount} />
            </div>

            <section className={card}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={sectionTitle}>Draft</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Reroll as much as you like. Your active Plan stays put until you confirm.
                  </p>
                  {allergyList.length > 0 && (
                    <p className="mt-2 text-sm text-zinc-500">
                      Avoiding: <span className="text-zinc-700">{allergyList.join(', ')}</span>
                    </p>
                  )}
                  {recipe && !draftRecipe && (
                    <p className="mt-2 text-sm text-zinc-500">
                      You already have an active plan. Generate a draft to try a new mix.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={!canGenerate}
                  className={`${btnPrimary} inline-flex w-full items-center justify-center gap-2 sm:w-auto`}
                >
                  <ShuffleIcon width={16} height={16} />
                  {draftRecipe ? 'Reroll' : 'Generate draft'}
                </button>
              </div>
              {!canGenerate && (
                <p className="mt-3 text-sm text-zinc-500">
                  {!isPercentageValid
                    ? 'Ingredient ratios must total 100%.'
                    : 'Finish setting up your dogs in Profile first.'}
                </p>
              )}
            </section>

            {draftRecipe && (
              <>
                <DailyRecipePanel
                  recipe={draftRecipe}
                  ratios={ratios}
                  locked={locked}
                  excluded={allergyList}
                  onToggleLock={toggleLock}
                  onSwap={swapIngredient}
                />

                <section className={`${card} sticky bottom-20 z-10 border-zinc-200 shadow-md sm:static sm:shadow-sm`}>
                  <h2 className={sectionTitle}>Confirm plan</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Name it and send it to Plan — shopping list and feeding will update.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className={fieldLabel} htmlFor="draft-name">
                        Plan name
                      </label>
                      <input
                        id="draft-name"
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmDraft();
                        }}
                        placeholder="e.g. Weekly chicken mix"
                        className={inputBase}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generateDraft}
                      className={`${btnSecondary} inline-flex items-center justify-center gap-2`}
                    >
                      <ShuffleIcon width={16} height={16} />
                      Reroll
                    </button>
                    <button
                      type="button"
                      onClick={confirmDraft}
                      className={`${btnPrimary} inline-flex items-center justify-center`}
                    >
                      Use this plan
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* ---------------- Saved ---------------- */}
        {activeTab === 'saved' && (
          <div className="print:hidden">
            <SavedRecipes
              saved={saved}
              onLoad={loadSavedRecipe}
              onDelete={deleteSavedRecipe}
              onRename={renameSavedRecipe}
            />
          </div>
        )}

        {/* ---------------- Profile ---------------- */}
        {activeTab === 'profile' && (
          <ProfileScreen
            dogs={dogs}
            unit={unit}
            showInfo={showInfo}
            onToggleInfo={() => setShowInfo((v) => !v)}
            onUnitChange={setUnit}
            onAddDog={addDog}
            onRemoveDog={removeDog}
            onUpdateDog={updateDog}
          />
        )}
      </div>

      <BottomTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
