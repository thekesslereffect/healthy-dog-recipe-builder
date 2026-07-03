'use client';

import { useState } from 'react';
import { 
  Dog, 
  IngredientPercentages,
  IngredientCounts, 
  Recipe, 
  RecipeIngredient,
  calculateDailyCalories, 
  getTotalMER, 
  createRecipe, 
  calculateShoppingList, 
  calculateMealPortions 
} from './utils/recipeCalculator';

// Shared style tokens keep the markup clean and the look consistent.
const card =
  'rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 print:border-0 print:p-0 print:rounded-none';
const sectionTitle =
  'text-lg sm:text-xl font-semibold tracking-tight text-black';
const fieldLabel = 'block text-sm font-medium text-zinc-600 mb-1.5';
const inputBase =
  'w-full px-3.5 py-2.5 text-black bg-zinc-50 rounded-lg border border-transparent focus:outline-none focus:border-zinc-300 focus:bg-white transition-colors';
const groupLabel =
  'text-[11px] font-semibold uppercase tracking-wider text-zinc-500';

// General starting-point ratios for a balanced adult homemade diet, expressed
// as a share of daily CALORIES (this tool splits by calories, not weight).
// Derived from BARF / raw-feeding guidelines (~70% muscle meat, ~5% liver,
// ~5% other organ, ~7% vegetables, ~1% fruit) adapted for a cooked diet, with a
// modest carbohydrate + fat allowance for energy. There is no single "correct"
// ratio, so these are a baseline to adjust from — always confirm with your vet.
const RECOMMENDED_RATIOS: IngredientPercentages = {
  protein: 0.70,
  organs: 0.05,
  fruits: 0.03,
  veggies: 0.07,
  carbs: 0.07,
  fats: 0.08,
};

const RECOMMENDED_RANGES: Record<keyof IngredientPercentages, string> = {
  protein: '50–80%',
  organs: '5–10%',
  fruits: '0–5%',
  veggies: '5–10%',
  carbs: '0–30%',
  fats: '5–15%',
};

export default function Home() {
  const [dogs, setDogs] = useState<Dog[]>([
    { name: 'Jackson', weight: 30, activityMultiplier: 1.3 },
    { name: 'Joey', weight: 12, activityMultiplier: 1.0 }
  ]);
  
  const [numberOfDays, setNumberOfDays] = useState(7);
  
  const [ingredientPercentages, setIngredientPercentages] = useState<IngredientPercentages>({
    ...RECOMMENDED_RATIOS,
  });

  const [ingredientCounts, setIngredientCounts] = useState<IngredientCounts>({
    protein: 1,
    organs: 1,
    fruits: 1,
    veggies: 1,
    carbs: 1,
    fats: 1
  });

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const addDog = () => {
    setDogs([...dogs, { name: '', weight: 0, activityMultiplier: 1.6 }]);
  };

  const removeDog = (index: number) => {
    if (dogs.length > 1) {
      setDogs(dogs.filter((_, i) => i !== index));
    }
  };

  const updateDog = (index: number, field: keyof Dog, value: string | number) => {
    const updatedDogs = dogs.map((dog, i) => 
      i === index ? { ...dog, [field]: value } : dog
    );
    setDogs(updatedDogs);
  };

  const updatePercentage = (field: keyof IngredientPercentages, value: number) => {
    setIngredientPercentages(prev => ({ ...prev, [field]: value }));
  };

  const updateCount = (field: keyof IngredientCounts, value: number) => {
    setIngredientCounts(prev => ({ ...prev, [field]: value }));
  };

  const applyRecommendedRatios = () => {
    setIngredientPercentages({ ...RECOMMENDED_RATIOS });
  };

  const generateRecipe = () => {
    setIsGenerating(true);
    
    // Calculate MER for each dog
    const dogsWithMER = dogs.map(dog => ({
      ...dog,
      MER: calculateDailyCalories(dog)
    }));
    
    const totalMER = getTotalMER(dogsWithMER);
    const newRecipe = createRecipe(totalMER, dogsWithMER, ingredientPercentages, ingredientCounts);
    
    setRecipe(newRecipe);
    setIsGenerating(false);
  };

  const printRecipe = () => {
    window.print();
  };

  const percentageSum = Object.values(ingredientPercentages).reduce((sum, val) => sum + val, 0);
  const isPercentageValid = Math.abs(percentageSum - 1) < 0.001; // Allow small floating point errors
  const hasInvalidDog = dogs.some(d => !d.name || d.weight <= 0);

  // Compute daily calories (MER) per dog for display and meal portions
  const dogsWithMER = dogs.map(dog => ({ ...dog, MER: calculateDailyCalories(dog) }));

  return (
    <div className="min-h-screen bg-white text-black print:min-h-0">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 print:px-2 print:py-2 print:max-w-none">
        {/* Header */}
        <header className="mb-10 sm:mb-14 print:mb-3">
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl print:text-2xl">
            Healthy Dog Recipe Builder
          </h1>
          <p className="mt-2 text-base text-zinc-500 sm:mt-3 sm:text-lg print:hidden">
            Create balanced, nutritious meals for your furry friends.
          </p>
        </header>

        {/* Input Sections - Hidden when printing */}
        <div className="space-y-6 sm:space-y-8 print:hidden">
          {/* Dogs Section */}
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
                <div
                  key={index}
                  className="rounded-xl border border-zinc-200 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-black">
                      {dog.name?.trim() ? dog.name : `Dog ${index + 1}`}
                    </span>
                    {dogs.length > 1 && (
                      <button
                        onClick={() => removeDog(index)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-black"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3.5">
                    <div>
                      <label className={fieldLabel}>Name</label>
                      <input
                        type="text"
                        value={dog.name}
                        onChange={(e) => updateDog(index, 'name', e.target.value)}
                        className={inputBase}
                        placeholder="Dog name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={fieldLabel}>Weight (lbs)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={dog.weight || ''}
                          onChange={(e) => updateDog(index, 'weight', parseFloat(e.target.value) || 0)}
                          className={inputBase}
                          placeholder="35"
                        />
                      </div>
                      <div>
                        <label className={fieldLabel}>Daily calories</label>
                        <div className="w-full rounded-lg bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-500">
                          {dog.weight > 0 ? `${Math.round(calculateDailyCalories(dog))} cal` : '—'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className={fieldLabel}>Activity Level</label>
                      <select
                        value={dog.activityMultiplier}
                        onChange={(e) => updateDog(index, 'activityMultiplier', parseFloat(e.target.value))}
                        className={inputBase}
                      >
                        <option value={1}>No exercise (1.0×)</option>
                        <option value={1.3}>Light exercise (1.3×)</option>
                        <option value={1.6}>Moderate exercise (1.6×)</option>
                        <option value={1.8}>Heavy exercise (1.8×)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Shopping Duration */}
          <section className={card}>
            <h2 className={sectionTitle}>Shopping Duration</h2>
            <div className="mt-4 max-w-xs">
              <label className={fieldLabel}>Number of Days</label>
              <input
                type="number"
                inputMode="numeric"
                value={numberOfDays}
                onChange={(e) => setNumberOfDays(parseInt(e.target.value) || 1)}
                className={inputBase}
                min="1"
                max="30"
              />
            </div>
          </section>

          {/* Ratios + Counts */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Ingredient Percentages Section */}
            <section className={card}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className={sectionTitle}>Ingredient Ratios</h2>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isPercentageValid ? 'text-zinc-400' : 'text-black'
                  }`}
                >
                  {Math.round(percentageSum * 100)}%
                </span>
              </div>
              <div className="space-y-4">
                {Object.entries(ingredientPercentages).map(([key, value]) => (
                  <div key={key}>
                    <label className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-zinc-700">{key}</span>
                      <span className="flex items-baseline gap-2">
                        <span className="text-[11px] text-zinc-400">
                          rec {RECOMMENDED_RANGES[key as keyof IngredientPercentages]}
                        </span>
                        <span className="w-9 text-right font-medium tabular-nums text-black">
                          {Math.round(value * 100)}%
                        </span>
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.025"
                      value={value}
                      onChange={(e) => updatePercentage(key as keyof IngredientPercentages, parseFloat(e.target.value))}
                      className="w-full accent-black"
                    />
                  </div>
                ))}
              </div>

              {!isPercentageValid && (
                <p className="mt-4 text-sm text-zinc-500">
                  Ratios must add up to 100% to generate a recipe.
                </p>
              )}

              {/* Baseline guidance */}
              <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-500">
                <p className="text-sm font-semibold text-black">Recommended baseline</p>
                <p className="mt-1.5">
                  For a balanced adult diet, muscle meat should be the majority
                  (~70%), with a small amount of nutrient-dense organs (~5–10%,
                  mostly liver), some vegetables (~5–10%), a little fruit, and
                  carbs &amp; fats for extra energy. Working or very active dogs
                  can take more carbs; less active dogs need fewer.
                </p>
                <p className="mt-2">
                  Popular raw-feeding guides (e.g. BARF: ~70% meat, 10% bone,
                  10% organ, 10% veg/fruit) are measured by <em>weight</em>.
                  This tool splits by <em>calories</em>, so the exact numbers
                  differ — treat these as a starting point and confirm a
                  long-term diet with your vet.
                </p>
                <button
                  type="button"
                  onClick={applyRecommendedRatios}
                  className="mt-3 rounded-lg bg-zinc-200 px-3.5 py-2 text-xs font-medium text-black transition-colors hover:bg-zinc-300"
                >
                  Apply recommended baseline
                </button>
              </div>
            </section>

            {/* Ingredient Counts Section */}
            <section className={card}>
              <h2 className={sectionTitle}>Ingredients per Category</h2>
              <p className="mt-1 mb-4 text-sm text-zinc-500">
                How many random items to pick from each group.
              </p>
              <div className="space-y-4">
                {Object.entries(ingredientCounts).map(([key, value]) => (
                  <div key={key}>
                    <label className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-zinc-700">{key}</span>
                      <span className="tabular-nums text-zinc-500">
                        {value} item{value !== 1 ? 's' : ''}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={value}
                      onChange={(e) => updateCount(key as keyof IngredientCounts, parseInt(e.target.value))}
                      className="w-full accent-black"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={generateRecipe}
              disabled={isGenerating || !isPercentageValid || hasInvalidDog}
              className="w-full rounded-lg bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 sm:w-auto"
            >
              {isGenerating ? 'Generating…' : recipe ? 'Regenerate Recipe' : 'Generate Recipe'}
            </button>
            
            {recipe && (
              <button
                onClick={printRecipe}
                className="w-full rounded-lg bg-zinc-100 px-6 py-3 font-medium text-black transition-colors hover:bg-zinc-200 sm:w-auto"
              >
                Print
              </button>
            )}

            {hasInvalidDog && (
              <span className="text-sm text-zinc-500">
                Add a name and weight for each dog to continue.
              </span>
            )}
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
                <div>Duration: {numberOfDays} days</div>
                <div className="mt-1">
                  Ratios: P{Math.round(ingredientPercentages.protein * 100)}%, 
                  O{Math.round(ingredientPercentages.organs * 100)}%, 
                  F{Math.round(ingredientPercentages.fruits * 100)}%, 
                  V{Math.round(ingredientPercentages.veggies * 100)}%, 
                  C{Math.round(ingredientPercentages.carbs * 100)}%, 
                  Fat{Math.round(ingredientPercentages.fats * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {recipe ? (
          <div className="mt-8 space-y-6 sm:mt-12 print:mt-2 print:space-y-2">
            {/* Daily Recipe and Shopping List Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
              {/* Daily Recipe */}
              <section className={card}>
                <h2 className={`${sectionTitle} mb-5 print:mb-2 print:text-lg`}>Daily Recipe</h2>
                
                <div className="space-y-5 print:space-y-1">
                  {Object.entries(recipe.ingredients).map(([category, ingredients]) => {
                    if (category === 'supplements') return null;
                    const ingredientArray = ingredients as RecipeIngredient[];
                    if (ingredientArray.length === 0) return null;
                    
                    return (
                      <div key={category} className="print:space-y-0.5">
                        <h3 className={`${groupLabel} mb-2 block print:mb-0.5 print:text-[10px]`}>
                          {category}
                        </h3>
                        <div className="space-y-1.5 print:space-y-0.5">
                          {ingredientArray.map((ingredient, index) => (
                            <div key={index} className="flex items-baseline justify-between gap-4">
                              <span className="text-sm text-black print:text-xs">{ingredient.name}</span>
                              <span className="shrink-0 text-right text-sm tabular-nums text-black print:text-xs">
                                <span className="font-medium">{ingredient.grams}g</span>
                                <span className="ml-2 text-zinc-400 print:hidden">
                                  {Math.round(ingredient.calories)} cal
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 print:mt-2">
                  <h3 className={`${groupLabel} mb-2 block print:mb-0.5 print:text-[10px]`}>
                    Supplements
                  </h3>
                  <div className="space-y-1.5 print:space-y-0.5">
                    {recipe.ingredients.supplements.map((supplement, index) => {
                      const scoops = supplement.gramsPerScoop
                        ? Math.round((supplement.grams / supplement.gramsPerScoop) * 10) / 10
                        : null;
                      return (
                        <div key={index} className="flex items-baseline justify-between gap-4">
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
                <h2 className={`${sectionTitle} mb-5 print:mb-2 print:text-lg`}>
                  Shopping List
                  <span className="ml-2 text-sm font-normal text-zinc-500">{numberOfDays} days</span>
                </h2>
                
                <div className="space-y-1.5 print:space-y-0.5">
                  {Object.entries(calculateShoppingList(recipe, numberOfDays)).map(([name, amounts]) => (
                    <div key={name} className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-black print:text-xs">{name}</span>
                      <span className="shrink-0 text-right text-sm tabular-nums text-black print:text-xs">
                        <span className="font-medium">{Math.round(amounts.grams)}g</span>
                        {amounts.pounds ? (
                          <span className="ml-2 text-zinc-400 print:hidden">{amounts.pounds} lbs</span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Meal Portions - Full Width */}
            <section className={card}>
              <h2 className={`${sectionTitle} mb-5 print:mb-1 print:text-lg`}>Meal Portions</h2>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-4 print:gap-2">
                {Object.entries(calculateMealPortions(recipe, dogsWithMER)).map(([dogName, portions]) => (
                  <div
                    key={dogName}
                    className="rounded-xl border border-zinc-200 p-4 print:border-0 print:p-0"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-black print:text-sm">{dogName}</h3>
                      <span className="text-xs font-medium tabular-nums text-zinc-500">
                        {portions.percentage}%
                      </span>
                    </div>
                    <div className="mb-3 text-xs text-zinc-500 print:mb-1">
                      {Math.round(dogsWithMER.find(d => d.name === dogName)?.MER || 0)} cal/day
                    </div>
                    <div className="flex items-baseline justify-between text-sm print:text-xs">
                      <span className="text-zinc-600">Daily</span>
                      <span className="font-medium tabular-nums text-black">{portions.dailyPortion}g</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-sm print:text-xs">
                      <span className="text-zinc-600">Per meal</span>
                      <span className="font-medium tabular-nums text-black">{portions.mealPortion}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-200 px-6 py-16 text-center print:hidden">
            <h2 className="text-xl font-semibold text-black">Ready to Generate</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Fill in your dog information and press “Generate Recipe” to create a healthy meal plan.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-zinc-200 pt-6 print:hidden">
          <p className="text-center text-sm text-zinc-400">Created by - Your Husband</p>
        </footer>
      </div>
    </div>
  );
}
