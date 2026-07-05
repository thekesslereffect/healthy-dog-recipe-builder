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
  DEFAULT_SUPPLEMENT_OPTIONS,
  type Dog,
  type Recipe,
  type SupplementOptions,
} from './utils/recipeCalculator';
import { getIngredientCatalogOrThrow, findFoodByName } from './data/ingredients';
import { normalizeSupplementOptions } from './data/supplements';
import { recipeToText } from './utils/export';
import { balanceRecipeMix, applyRatiosToRecipe } from './utils/rebalance';
import { removeNutritionBoost, hasNutritionBoostInCategory } from './utils/nutritionBoost';
import { type MassUnit, type WeightUnit } from './utils/format';
import type { ShoppingMassUnitMode } from './utils/shoppingMassUnit';
import { createId, resolveSupplementOptions, type SavedRecipe } from './utils/savedRecipes';
import { useLocalStorage } from './hooks/useLocalStorage';
import { HomePlan } from './components/HomePlan';
import { BuildScreen } from './components/BuildScreen';
import { EditScreen } from './components/EditScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PlanPicker } from './components/PlanPicker';
import type { ScreenId } from './components/TabBar';
import { User, Sun, Moon, ArrowLeft } from 'lucide-react';
import { iconBtn } from './components/ui';

type Theme = 'light' | 'dark';

const DEFAULT_DOGS: Dog[] = [
  { id: 'default-jackson', name: 'Jackson', weight: 30, activityMultiplier: 1.3, allergies: [] },
  { id: 'default-joey', name: 'Joey', weight: 12, activityMultiplier: 1.0, allergies: [] },
];

export default function Home() {
  const [unit, setUnit] = useLocalStorage<WeightUnit>('hdrb.unit', 'lb');
  const [dogs, setDogs] = useLocalStorage<Dog[]>('hdrb.dogs', DEFAULT_DOGS);
  const [numberOfDays, setNumberOfDays] = useLocalStorage('hdrb.days', 7);
  const [mealsPerDay, setMealsPerDay] = useLocalStorage('hdrb.meals', 2);
  const [ratios, setRatios] = useLocalStorage<CategoryRatios>('hdrb.ratios', RECOMMENDED_RATIOS);
  const [counts, setCounts] = useLocalStorage<CategoryCounts>('hdrb.counts', DEFAULT_COUNTS);
  const [locked, setLocked] = useLocalStorage<Partial<Record<Category, string[]>>>(
    'hdrb.locked',
    {},
  );
  const [supplementOptions, setSupplementOptions] = useLocalStorage<SupplementOptions>(
    'hdrb.supplements',
    DEFAULT_SUPPLEMENT_OPTIONS,
  );
  const [recipe, setRecipe] = useLocalStorage<Recipe | null>('hdrb.recipe', null);
  const [planName, setPlanName] = useLocalStorage<string>('hdrb.planName', '');
  const [draftRecipe, setDraftRecipe] = useLocalStorage<Recipe | null>('hdrb.draft', null);
  const [saved, setSaved] = useLocalStorage<SavedRecipe[]>('hdrb.saved', []);
  const [shoppingUnits, setShoppingUnits] = useLocalStorage<Record<string, MassUnit>>(
    'hdrb.shoppingUnits',
    {},
  );
  const [shoppingUnitMode, setShoppingUnitMode] = useLocalStorage<ShoppingMassUnitMode>(
    'hdrb.shoppingUnitMode',
    'auto',
  );
  const [checkedItems, setCheckedItems] = useLocalStorage<Record<string, boolean>>(
    'hdrb.shoppingChecked',
    {},
  );
  const [portionUnits, setPortionUnits] = useLocalStorage<Record<string, MassUnit>>(
    'hdrb.portionUnits',
    {},
  );
  const [theme, setTheme] = useLocalStorage<Theme>('hdrb.theme', 'light');
  const [activeScreen, setActiveScreen] = useState<ScreenId>('plan');
  const [returnScreen, setReturnScreen] = useState<ScreenId>('plan');
  const [copied, setCopied] = useState(false);
  const [draftName, setDraftName] = useState('');
  /** Working copy while on the Edit screen (never used by Build). */
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [currentSavedId, setCurrentSavedId] = useLocalStorage<string | null>(
    'hdrb.currentSavedId',
    null,
  );
  useEffect(() => {
    if (dogs.some((d) => !d.id)) {
      setDogs(dogs.map((d) => (d.id ? d : { ...d, id: createId() })));
    }
  }, [dogs, setDogs]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Always print in light mode (white paper), even when the UI is dark.
  useEffect(() => {
    const root = document.documentElement;
    const beforePrint = () => root.classList.remove('dark');
    const afterPrint = () => {
      if (theme === 'dark') root.classList.add('dark');
    };
    const onPrintMedia = (event: MediaQueryListEvent) => {
      if (event.matches) beforePrint();
      else afterPrint();
    };
    const printMql = window.matchMedia('print');
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    printMql.addEventListener('change', onPrintMedia);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
      printMql.removeEventListener('change', onPrintMedia);
    };
  }, [theme]);

  // Heal sessions where saved plans were removed but Plan was left behind.
  useEffect(() => {
    if (saved.length === 0 && (recipe || planName)) {
      setRecipe(null);
      setPlanName('');
      setCurrentSavedId(null);
      setCheckedItems({});
    }
  }, [saved.length, recipe, planName, setRecipe, setPlanName, setCheckedItems]);
  const percentageSum = CATEGORIES.reduce((sum, c) => sum + ratios[c], 0);
  const isPercentageValid = Math.abs(percentageSum - 1) < 0.001;
  const hasInvalidDog = dogs.some((d) => !d.name?.trim() || d.weight <= 0);
  const canGenerate = isPercentageValid && !hasInvalidDog;
  const dogsWithMER = dogs.map((dog) => ({ ...dog, MER: calculateDailyCalories(dog) }));
  const allergyList = Array.from(new Set(dogs.flatMap((d) => d.allergies ?? [])));
  const computeRecipe = (
    dogList: Dog[],
    lockedState: Partial<Record<Category, string[]>> = locked,
    ratioState: CategoryRatios = ratios,
    countState: CategoryCounts = counts,
    supplementState: SupplementOptions = supplementOptions,
  ): Recipe => {
    const withMER = dogList.map((dog) => ({ ...dog, MER: calculateDailyCalories(dog) }));
    const totalMER = getTotalMER(withMER);
    const excluded = Array.from(new Set(dogList.flatMap((d) => d.allergies ?? [])));
    return createRecipe(totalMER, withMER, ratioState, countState, {
      excluded,
      locked: lockedState,
      supplementOptions: normalizeSupplementOptions(supplementState),
    });
  };
  const generateDraft = () => {
    if (!canGenerate) return;
    setDraftRecipe(computeRecipe(dogs, locked, ratios, counts, supplementOptions));
  };
  const balanceDraft = () => {
    if (!draftRecipe) return;
    const result = balanceRecipeMix(draftRecipe, dogs, supplementOptions, allergyList);
    if (!result) return;
    // Keep Mix-sheet ratios unchanged so Reroll still uses the user's percentages.
    setDraftRecipe(result.recipe);
  };
  const balanceEdit = () => {
    if (!editRecipe) return;
    const result = balanceRecipeMix(editRecipe, dogs, supplementOptions, allergyList);
    if (!result) return;
    setEditRecipe(result.recipe);
  };

  /** Keep an existing draft when the mix changes (preserve locks). */
  const refreshDraft = (
    ratioState: CategoryRatios,
    countState: CategoryCounts,
    dogList: Dog[] = dogs,
    supplementState: SupplementOptions = supplementOptions,
  ) => {
    if (!draftRecipe) return;
    const sum = CATEGORIES.reduce((s, c) => s + ratioState[c], 0);
    const ratiosOk = Math.abs(sum - 1) < 0.001;
    const dogsOk = !dogList.some((d) => !d.name?.trim() || d.weight <= 0);
    if (!ratiosOk || !dogsOk) {
      setDraftRecipe(null);
      return;
    }
    setDraftRecipe(computeRecipe(dogList, locked, ratioState, countState, supplementState));
  };
  const updateSupplementOptions = (next: SupplementOptions) => {
    const normalized = normalizeSupplementOptions(next);
    setSupplementOptions(normalized);
    if (draftRecipe) {
      refreshDraft(ratios, counts, dogs, normalized);
    }
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
    if (field === 'allergies') {
      if (draftRecipe) setDraftRecipe(computeRecipe(nextDogs));
      if (recipe) setRecipe(computeRecipe(nextDogs));
    }
  };
  const updateRatio = (category: Category, value: number) => {
    const nextRatios = { ...ratios, [category]: value };
    setRatios(nextRatios);
    refreshDraft(nextRatios, counts);
  };
  const updateCount = (category: Category, value: number) => {
    const nextCounts = { ...counts, [category]: value };
    setCounts(nextCounts);
    refreshDraft(ratios, nextCounts);
  };
  const applyRecommendedRatios = () => {
    const nextRatios = { ...RECOMMENDED_RATIOS };
    setRatios(nextRatios);
    refreshDraft(nextRatios, counts);
  };
  const toggleLock = (category: Category, name: string) => {
    setLocked((prev) => {
      const current = prev[category] ?? [];
      const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
      return { ...prev, [category]: next };
    });
  };
  const applySwap = (
    source: Recipe,
    setSource: (r: Recipe) => void,
    category: Category,
    oldName: string,
    newName: string,
  ) => {
    if (oldName === newName) return;
    const data = getIngredientCatalogOrThrow()[category].find((i) => i.name === newName);
    if (!data) return;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const cpg = data.caloriesPer100g || 0;
    const nextCategoryItems = source.ingredients[category].map((row) => {
      if (row.name !== oldName) return row;
      const grams = cpg > 0 ? round2((row.calories / cpg) * 100) : 0;
      return {
        name: newName,
        grams,
        calories: round2((grams * cpg) / 100),
        additional: row.additional,
      };
    });
    const nextRecipe: Recipe = {
      ...source,
      ingredients: { ...source.ingredients, [category]: nextCategoryItems },
    };
    let total = 0;
    for (const c of CATEGORIES) {
      for (const row of nextRecipe.ingredients[c]) total += row.calories;
    }
    for (const supplement of nextRecipe.ingredients.supplements) total += supplement.calories;
    nextRecipe.totalCalories = round2(total);
    setSource(nextRecipe);
    setLocked((prev) => {
      const current = prev[category] ?? [];
      if (!current.includes(oldName)) return prev;
      return { ...prev, [category]: current.map((n) => (n === oldName ? newName : n)) };
    });
  };
  const recalculateRecipe = (source: Recipe): Recipe =>
    applyRatiosToRecipe(source, dogs, ratios, supplementOptions);
  const removeBoost = (
    source: Recipe,
    setSource: (recipe: Recipe) => void,
    category: Category,
    name: string,
  ) => {
    setSource(recalculateRecipe(removeNutritionBoost(source, category, name)));
  };
  const swapBoost = (
    source: Recipe,
    setSource: (recipe: Recipe) => void,
    category: Category,
    oldName: string,
    newName: string,
  ) => {
    if (oldName === newName) return;
    const food = findFoodByName(newName);
    if (!food) return;
    const newCategory = food.category;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const cpg = food.caloriesPer100g || 0;
    const oldRow = source.ingredients[category].find(
      (row) => row.name === oldName && row.additional,
    );
    if (!oldRow) return;
    if (newCategory !== category && hasNutritionBoostInCategory(source, newCategory)) {
      return;
    }
    const grams = cpg > 0 ? round2((oldRow.calories / cpg) * 100) : 0;
    const newRow = {
      name: newName,
      grams,
      calories: round2((grams * cpg) / 100),
      additional: true as const,
    };
    const nextIngredients = {
      protein: [...source.ingredients.protein],
      organs: [...source.ingredients.organs],
      fruits: [...source.ingredients.fruits],
      veggies: [...source.ingredients.veggies],
      carbs: [...source.ingredients.carbs],
      fats: [...source.ingredients.fats],
      supplements: source.ingredients.supplements.map((row) => ({ ...row })),
    };
    if (newCategory === category) {
      nextIngredients[category] = nextIngredients[category].map((row) => {
        if (row.name !== oldName || !row.additional) return row;
        return newRow;
      });
    } else {
      nextIngredients[category] = nextIngredients[category].filter(
        (row) => !(row.additional && row.name === oldName),
      );
      nextIngredients[newCategory] = [...nextIngredients[newCategory], newRow];
    }
    const swapped: Recipe = {
      ...source,
      ingredients: nextIngredients,
    };
    setSource(recalculateRecipe(swapped));
  };
  const swapDraftIngredient = (category: Category, oldName: string, newName: string) => {
    if (!draftRecipe) return;
    applySwap(draftRecipe, setDraftRecipe, category, oldName, newName);
  };
  const removeDraftBoost = (category: Category, name: string) => {
    if (!draftRecipe) return;
    removeBoost(draftRecipe, setDraftRecipe, category, name);
  };
  const swapDraftBoost = (category: Category, oldName: string, newName: string) => {
    if (!draftRecipe) return;
    swapBoost(draftRecipe, setDraftRecipe, category, oldName, newName);
  };
  const swapEditIngredient = (category: Category, oldName: string, newName: string) => {
    if (!editRecipe) return;
    applySwap(editRecipe, setEditRecipe, category, oldName, newName);
  };
  const removeEditBoost = (category: Category, name: string) => {
    if (!editRecipe) return;
    removeBoost(editRecipe, setEditRecipe, category, name);
  };
  const swapEditBoost = (category: Category, oldName: string, newName: string) => {
    if (!editRecipe) return;
    swapBoost(editRecipe, setEditRecipe, category, oldName, newName);
  };

  /** Build only: commit a new plan (never updates an existing one). */
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
      supplementOptions,
      recipe: draftRecipe,
    };
    setRecipe(draftRecipe);
    setPlanName(name);
    setCheckedItems({});
    setSaved([entry, ...saved]);
    setCurrentSavedId(entry.id);
    setDraftRecipe(null);
    setDraftName('');
    setEditRecipe(null);
    setActiveScreen('plan');
  };
  const startEdit = () => {
    if (!recipe) return;
    setEditRecipe(recipe);
    setActiveScreen('edit');
  };
  const cancelEdit = () => {
    setEditRecipe(null);
    setActiveScreen('plan');
  };
  const saveEdit = () => {
    if (!editRecipe || !currentSavedId) {
      if (editRecipe) {
        setRecipe(editRecipe);
        setEditRecipe(null);
        setActiveScreen('plan');
      }
      return;
    }
    setSaved((prev) =>
      prev.map((s) =>
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
              supplementOptions,
              recipe: editRecipe,
            }
          : s,
      ),
    );
    setRecipe(editRecipe);
    setEditRecipe(null);
    setActiveScreen('plan');
  };

  /** Keep the linked saved plan in sync when Plan settings change. */
  const syncSavedMeta = (patch: Partial<Pick<SavedRecipe, 'numberOfDays' | 'mealsPerDay'>>) => {
    if (!currentSavedId) return;
    setSaved((prev) =>
      prev.map((s) => (s.id === currentSavedId ? { ...s, ...patch, savedAt: Date.now() } : s)),
    );
  };
  const changeDays = (days: number) => {
    setNumberOfDays(days);
    syncSavedMeta({ numberOfDays: days });
  };
  const changeMeals = (meals: number) => {
    setMealsPerDay(meals);
    syncSavedMeta({ mealsPerDay: meals });
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
      // no-op
    }
  };
  const currentSaved = currentSavedId ? saved.find((s) => s.id === currentSavedId) : undefined;
  const loadSavedRecipe = (id: string) => {
    const entry = saved.find((s) => s.id === id);
    if (!entry) return;
    setDogs(entry.dogs.map((d) => (d.id ? d : { ...d, id: createId() })));
    setRatios(entry.ratios);
    setCounts(entry.counts);
    setNumberOfDays(entry.numberOfDays);
    setMealsPerDay(entry.mealsPerDay);
    setLocked(entry.locked);
    setSupplementOptions(resolveSupplementOptions(entry));
    setRecipe(entry.recipe);
    setPlanName(entry.name);
    setCheckedItems({});
    setDraftRecipe(null);
    setDraftName('');
    setEditRecipe(null);
    setCurrentSavedId(entry.id);
    setActiveScreen('plan');
  };
  const startNewPlan = () => {
    setEditRecipe(null);
    setActiveScreen('build');
  };
  const openProfile = () => {
    if (activeScreen === 'profile') return;
    setReturnScreen(activeScreen);
    setActiveScreen('profile');
  };
  const closeProfile = () => {
    setActiveScreen(returnScreen === 'profile' ? 'plan' : returnScreen);
  };
  const deleteSavedRecipe = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    if (id === currentSavedId || next.length === 0) {
      clearActivePlan();
    }
  };
  const clearActivePlan = () => {
    setRecipe(null);
    setPlanName('');
    setCurrentSavedId(null);
    setCheckedItems({});
    setEditRecipe(null);
  };
  const activePlanName = planName || currentSaved?.name || (recipe ? 'Untitled plan' : '');
  const pickerLabel =
    activeScreen === 'profile'
      ? 'Profile'
      : activeScreen === 'build'
        ? draftName.trim() || 'New plan'
        : activeScreen === 'edit'
          ? activePlanName || 'Edit plan'
          : activePlanName || 'Select a plan';
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground print:h-auto print:min-h-0 print:bg-white print:text-black">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 print:px-2 print:py-2">
        <div className="min-w-0 flex-1">
          {activeScreen === 'profile' ? (
            <div className="flex items-center gap-1">
              <button type="button" onClick={closeProfile} className={iconBtn} aria-label="Back">
                <ArrowLeft size={18} />
              </button>
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl print:text-2xl print:text-black">
                Profile
              </h1>
            </div>
          ) : (
            <div className="print:hidden">
              <PlanPicker
                saved={saved}
                currentSavedId={currentSavedId}
                label={pickerLabel}
                onSelectPlan={loadSavedRecipe}
                onNewPlan={startNewPlan}
                onDeletePlan={deleteSavedRecipe}
              />
            </div>
          )}
          <h1 className="hidden truncate text-xl font-bold tracking-tight print:block print:text-2xl print:text-black">
            {activePlanName || 'Dog meal plan'}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 print:hidden sm:gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={iconBtn}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={() => (activeScreen === 'profile' ? closeProfile() : openProfile())}
            aria-label={activeScreen === 'profile' ? 'Close profile' : 'Profile'}
            aria-current={activeScreen === 'profile' ? 'page' : undefined}
            className={`${iconBtn} ${activeScreen === 'profile' ? 'bg-accent-soft text-accent' : ''}`}
          >
            <User size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-visible px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-w-5xl sm:px-6 print:max-w-none print:overflow-visible print:px-2">
        {activeScreen === 'plan' && (
          <div key="plan" className="animate-fade-in flex min-h-0 flex-1 flex-col overflow-visible">
            <HomePlan
              recipe={recipe}
              hasDraft={!!draftRecipe}
              planName={activePlanName}
              dogsWithMER={dogsWithMER}
              numberOfDays={numberOfDays}
              mealsPerDay={mealsPerDay}
              unit={unit}
              shoppingUnits={shoppingUnits}
              shoppingUnitMode={shoppingUnitMode}
              checkedItems={checkedItems}
              portionUnits={portionUnits}
              copied={copied}
              canGenerate={canGenerate}
              hasInvalidDog={hasInvalidDog}
              onDaysChange={changeDays}
              onMealsChange={changeMeals}
              onShoppingUnitsChange={setShoppingUnits}
              onShoppingUnitModeChange={setShoppingUnitMode}
              onCheckedItemsChange={setCheckedItems}
              onPortionUnitsChange={setPortionUnits}
              onCopy={copyRecipe}
              onGoEdit={startEdit}
              onGoBuild={startNewPlan}
              onGoProfile={openProfile}
            />
          </div>
        )}

        {activeScreen === 'build' && (
          <div
            key="build"
            className="animate-fade-in flex min-h-0 flex-1 flex-col overflow-visible"
          >
            <BuildScreen
              ratios={ratios}
              counts={counts}
              draftRecipe={draftRecipe}
              dogsWithMER={dogsWithMER}
              hasActivePlan={!!recipe}
              allergyList={allergyList}
              canGenerate={canGenerate}
              isPercentageValid={isPercentageValid}
              hasInvalidDog={hasInvalidDog}
              draftName={draftName}
              locked={locked}
              supplementOptions={supplementOptions}
              onSupplementOptionsChange={updateSupplementOptions}
              onRatioChange={updateRatio}
              onCountChange={updateCount}
              onApplyRecommended={applyRecommendedRatios}
              onGenerate={generateDraft}
              onConfirm={confirmDraft}
              onDraftNameChange={setDraftName}
              onToggleLock={toggleLock}
              onSwap={swapDraftIngredient}
              onRemoveBoost={removeDraftBoost}
              onSwapBoost={swapDraftBoost}
              onBalance={balanceDraft}
            />
          </div>
        )}

        {activeScreen === 'edit' && editRecipe && (
          <div key="edit" className="animate-fade-in flex min-h-0 flex-1 flex-col overflow-visible">
            <EditScreen
              planName={activePlanName}
              editRecipe={editRecipe}
              dogsWithMER={dogsWithMER}
              ratios={ratios}
              allergyList={allergyList}
              locked={locked}
              onToggleLock={toggleLock}
              onSwap={swapEditIngredient}
              onRemoveBoost={removeEditBoost}
              onSwapBoost={swapEditBoost}
              onSave={saveEdit}
              onCancel={cancelEdit}
              onBalance={balanceEdit}
            />
          </div>
        )}

        {activeScreen === 'profile' && (
          <div
            key="profile"
            className="animate-fade-in flex min-h-0 flex-1 flex-col overflow-visible"
          >
            <ProfileScreen
              dogs={dogs}
              unit={unit}
              onUnitChange={setUnit}
              onAddDog={addDog}
              onRemoveDog={removeDog}
              onUpdateDog={updateDog}
            />
          </div>
        )}
      </main>
    </div>
  );
}
