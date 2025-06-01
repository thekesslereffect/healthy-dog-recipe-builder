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

export default function Home() {
  const [dogs, setDogs] = useState<Dog[]>([
    { name: 'Jackson', weight: 35, activityMultiplier: 1.3 },
    { name: 'Joey', weight: 17, activityMultiplier: 1.0 }
  ]);
  
  const [numberOfDays, setNumberOfDays] = useState(7);
  
  const [ingredientPercentages, setIngredientPercentages] = useState<IngredientPercentages>({
    protein: 0.70,
    organs: 0.05,
    fruits: 0.05,
    veggies: 0.05,
    carbs: 0.075,
    fats: 0.075
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

  return (
    <div className="min-h-screen bg-white print:min-h-0">
      <div className="max-w-4xl mx-auto px-8 py-12 print:px-4 print:py-6 print:max-w-none">
        {/* Header */}
        <div className="mb-16 print:mb-8">
          <h1 className="text-5xl font-bold text-black mb-4 print:text-3xl print:mb-2">Healthy Dog Recipe Builder</h1>
          <p className="text-xl text-black font-light print:text-base print:hidden">Create balanced, nutritious meals for your furry friends</p>
        </div>

        {/* Input Sections - Hidden when printing */}
        <div className="space-y-12 mb-16 print:hidden">
          {/* Dogs Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-black">Your Dogs</h2>
              <button
                onClick={addDog}
                className="px-4 py-2 bg-zinc-200 text-black font-medium hover:bg-zinc-300 transition-colors rounded-lg text-sm"
              >
                + Add Dog
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dogs.map((dog, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-black">Dog {index + 1}</span>
                    {dogs.length > 1 && (
                      <button
                        onClick={() => removeDog(index)}
                        className="px-3 py-1 bg-zinc-200 text-black hover:bg-zinc-300 transition-colors rounded text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Name</label>
                      <input
                        type="text"
                        value={dog.name}
                        onChange={(e) => updateDog(index, 'name', e.target.value)}
                        className="w-full px-4 py-3 text-black bg-zinc-50 rounded-lg border-0 focus:outline-none focus:bg-zinc-100"
                        placeholder="Dog name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Weight (lbs)</label>
                      <input
                        type="number"
                        value={dog.weight || ''}
                        onChange={(e) => updateDog(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 text-black bg-zinc-50 rounded-lg border-0 focus:outline-none focus:bg-zinc-100"
                        placeholder="35"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Activity Level</label>
                      <select
                        value={dog.activityMultiplier}
                        onChange={(e) => updateDog(index, 'activityMultiplier', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 text-black bg-zinc-50 rounded-lg border-0 focus:outline-none focus:bg-zinc-100"
                      >
                        <option value={1}>No exercise</option>
                        <option value={1.3}>Light exercise</option>
                        <option value={1.6}>Moderate exercise</option>
                        <option value={1.8}>Heavy exercise</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shopping Duration, Ingredient Ratios, and Ingredient Counts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Days Section */}
            <div>
              <h2 className="text-2xl font-semibold text-black mb-8">Shopping Duration</h2>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Number of Days</label>
                <input
                  type="number"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 text-black bg-zinc-50 rounded-lg border-0 focus:outline-none focus:bg-zinc-100"
                  min="1"
                  max="30"
                />
              </div>
            </div>

            {/* Ingredient Percentages Section */}
            <div>
              <h2 className="text-2xl font-semibold text-black mb-8">Ingredient Ratios</h2>
              <div className="space-y-4">
                {Object.entries(ingredientPercentages).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-black mb-2 capitalize">
                      {key} ({Math.round(value * 100)}%)
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
              <div className="mt-6 text-sm">
                <span className="font-medium text-black">
                  Total: {Math.round(percentageSum * 100)}% {!isPercentageValid && '(Should be 100%)'}
                </span>
              </div>
            </div>

            {/* Ingredient Counts Section */}
            <div>
              <h2 className="text-2xl font-semibold text-black mb-8">Ingredients per Category</h2>
              <div className="space-y-4">
                {Object.entries(ingredientCounts).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-black mb-2 capitalize">
                      {key} ({value} ingredient{value !== 1 ? 's' : ''})
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 pt-8">
            <button
              onClick={generateRecipe}
              disabled={isGenerating || !isPercentageValid || dogs.some(d => !d.name || d.weight <= 0)}
              className="px-8 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors rounded-lg"
            >
              {isGenerating ? 'Generating...' : 'Generate Recipe'}
            </button>
            
            {recipe && (
              <button
                onClick={printRecipe}
                className="px-8 py-3 bg-zinc-200 text-black font-medium hover:bg-zinc-300 transition-colors rounded-lg"
              >
                Print
              </button>
            )}
          </div>
        </div>

        {/* Print-only summary of settings */}
        {recipe && (
          <div className="hidden print:block mb-8 text-sm">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Dogs:</h3>
                {dogs.map((dog, index) => (
                  <div key={index} className="mb-1">
                    {dog.name} - {dog.weight} lbs - Activity Level: {dog.activityMultiplier}
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Settings:</h3>
                <div>Shopping Duration: {numberOfDays} days</div>
                <div className="mt-2">
                  Ratios: Protein {Math.round(ingredientPercentages.protein * 100)}%, 
                  Organs {Math.round(ingredientPercentages.organs * 100)}%, 
                  Fruits {Math.round(ingredientPercentages.fruits * 100)}%, 
                  Veggies {Math.round(ingredientPercentages.veggies * 100)}%, 
                  Carbs {Math.round(ingredientPercentages.carbs * 100)}%, 
                  Fats {Math.round(ingredientPercentages.fats * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {recipe ? (
          <div className="space-y-12 print:space-y-6">
            {/* Daily Recipe and Shopping List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 print:grid-cols-2 print:gap-8 print:page-break-inside-avoid">
              {/* Daily Recipe */}
              <div>
                <h2 className="text-2xl font-semibold text-black mb-8 print:text-xl print:mb-4">Daily Recipe</h2>
                
                <div className="space-y-4 print:space-y-2">
                  {Object.entries(recipe.ingredients).map(([category, ingredients]) => {
                    if (category === 'supplements') return null;
                    const ingredientArray = ingredients as RecipeIngredient[];
                    if (ingredientArray.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-2 print:space-y-1">
                        <h3 className="font-semibold text-black capitalize text-lg print:text-base">{category}:</h3>
                        {ingredientArray.map((ingredient, index) => (
                          <div key={index} className="flex justify-between items-center py-1 pl-4">
                            <span className="text-black">{ingredient.name}</span>
                            <div className="text-right">
                              <div className="font-medium text-black">{ingredient.grams}g</div>
                              <div className="text-sm text-black">{Math.round(ingredient.calories)} cal</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 print:mt-4">
                  <h3 className="font-semibold text-black mb-4 print:mb-2">Supplements</h3>
                  <div className="space-y-2 print:space-y-1">
                    {recipe.ingredients.supplements.map((supplement, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-black">{supplement.name}</span>
                        <div className="text-right">
                          <div className="text-sm text-black">{supplement.grams}g {supplement.gramsPerScoop && `(${Math.round(supplement.grams / supplement.gramsPerScoop * 10) / 10} scoops)`}</div>
                          <div className="text-xs text-black">{supplement.calories} cal</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-black print:mt-4 print:pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-black print:text-base">Total Daily Calories:</span>
                    <span className="text-lg font-bold text-black print:text-base">{Math.round(recipe.totalCalories)}</span>
                  </div>
                </div>
              </div>

              {/* Shopping List */}
              <div>
                <h2 className="text-2xl font-semibold text-black mb-8 print:text-xl print:mb-4">Shopping List ({numberOfDays} days)</h2>
                
                <div className="space-y-3 print:space-y-1">
                  {Object.entries(calculateShoppingList(recipe, numberOfDays)).map(([name, amounts]) => (
                    <div key={name} className="flex justify-between items-center py-1">
                      <span className="font-medium text-black">{name}</span>
                      <div className="text-right">
                        <div className="text-black">{Math.round(amounts.grams)}g</div>
                        {amounts.pounds && <div className="text-sm text-black">({amounts.pounds} lbs)</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Meal Portions - Full Width */}
            <div className="print:page-break-inside-avoid">
              <h2 className="text-2xl font-semibold text-black mb-8 print:text-xl print:mb-4">Meal Portions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6">
                {Object.entries(calculateMealPortions(recipe, dogs.map(dog => ({ ...dog, MER: calculateDailyCalories(dog) })))).map(([dogName, portions]) => (
                  <div key={dogName}>
                    <h3 className="font-semibold text-black mb-3 print:mb-2">{dogName} ({portions.percentage}% of total food)</h3>
                    <div className="space-y-2 print:space-y-1">
                      <div>
                        <span className="text-black">Daily portion:</span>
                        <span className="ml-2 font-medium text-black">{portions.dailyPortion}g</span>
                      </div>
                      <div>
                        <span className="text-black">Per meal:</span>
                        <span className="ml-2 font-medium text-black">{portions.mealPortion}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center pt-16 print:hidden">
            <h2 className="text-2xl font-semibold text-black mb-4">Ready to Generate</h2>
            <p className="text-black">Fill in your dog information and click "Generate Recipe" to create a healthy meal plan.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 print:hidden">
          <p className="text-center text-gray-500 text-sm">Created by - Your Husband</p>
        </footer>
      </div>
    </div>
  );
}
