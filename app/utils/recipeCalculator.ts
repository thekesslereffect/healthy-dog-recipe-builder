// Types for our recipe builder
export interface Dog {
  name: string;
  weight: number;
  activityMultiplier: number;
  MER?: number;
}

export interface IngredientPercentages {
  protein: number;
  organs: number;
  fruits: number;
  veggies: number;
  carbs: number;
  fats: number;
}

export interface Ingredient {
  name: string;
  caloriesPerGram: number;
  gramsPerPoundPerDay?: number;
  gramsPerScoop?: number;
}

export interface RecipeIngredient {
  name: string;
  grams: number;
  calories: number;
  gramsPerScoop?: number | null;
}

export interface Recipe {
  ingredients: {
    protein: RecipeIngredient;
    organs: RecipeIngredient;
    fruits: RecipeIngredient;
    veggies: RecipeIngredient;
    carbs: RecipeIngredient;
    fats: RecipeIngredient;
    supplements: RecipeIngredient[];
  };
  totalCalories: number;
}

export interface ShoppingListItem {
  grams: number;
  pounds?: number;
}

export interface ShoppingList {
  [ingredientName: string]: ShoppingListItem;
}

// Available ingredients
const ingredients = {
  protein: [
    { name: "Lean Ground Turkey", caloriesPerGram: 2.13 },
    { name: "Ground Pork", caloriesPerGram: 2.97 },
    { name: "Ground Beef 93", caloriesPerGram: 2.10 },
    { name: "Tilapia", caloriesPerGram: 1.29 },
  ],
  
  organs: [
    { name: "Heart", caloriesPerGram: 1.87 },
    { name: "Gizzard", caloriesPerGram: 1.53 }
  ],
  
  carbs: [
    { name: "Brown Rice", caloriesPerGram: 1.11 },
    { name: "White Rice", caloriesPerGram: 1.30 },    
    { name: "Quinoa", caloriesPerGram: 1.19 },
    { name: "Sweet Potato", caloriesPerGram: 0.90 }  
  ],

  fruits: [
    { name: "Apple", caloriesPerGram: 0.52 },
    { name: "Mango", caloriesPerGram: 0.60 },
    { name: "Pear", caloriesPerGram: 0.57 },
    { name: "Raspberry", caloriesPerGram: 0.50 },
    { name: "Blackberry", caloriesPerGram: 0.43 },
    { name: "Blueberry", caloriesPerGram: 0.56 },
  ],

  veggies: [
    { name: "Carrots", caloriesPerGram: 0.35 },
    { name: "Green Beans", caloriesPerGram: 0.35 },
    { name: "Spinach", caloriesPerGram: 0.23 },
    { name: "Zucchini", caloriesPerGram: 0.15 },
    { name: "Broccoli", caloriesPerGram: 0.35 },
    { name: "Pumpkin", caloriesPerGram: 0.20 },
    { name: "Cabbage", caloriesPerGram: 0.22 },
    { name: "Bok Choy", caloriesPerGram: 0.12 }
  ],
  
  fats: [
    { name: "Olive Oil", caloriesPerGram: 8.50 },
    { name: "Coconut Oil", caloriesPerGram: 8.65 }
  ],

  supplements: [
    {
      name: "Rx Essentials",
      caloriesPerGram: 5.00,
      gramsPerPoundPerDay: 0.1,
      gramsPerScoop: 5,
    },
    {
      name: "Hemp Seed Oil",
      caloriesPerGram: 8.86,
      gramsPerPoundPerDay: 0.15,
    },
    {
      name: "Turmeric",
      caloriesPerGram: 5.72,
      gramsPerPoundPerDay: 0.015,
    },
    {
      name: "Ginger",
      caloriesPerGram: 4.00,
      gramsPerPoundPerDay: 0.015,
    }
  ]
};

// Calculate the daily calorie requirements for each dog
export function calculateDailyCalories(dog: Dog): number {
  const weight = dog.weight; 
  const weightKg = weight / 2.2046;
  const RER = 70 * Math.pow(weightKg, 0.75);
  const activityMultiplier = dog.activityMultiplier;
  const MER = RER * activityMultiplier;
  return MER;
}

// Get total MER for all dogs combined per day
export function getTotalMER(dogs: Dog[]): number {
  return dogs.reduce((total, dog) => total + (dog.MER || 0), 0);
}

// Helper function to select a random ingredient from an array
function selectRandomIngredient(ingredientArray: Ingredient[]): Ingredient {
  const randomIndex = Math.floor(Math.random() * ingredientArray.length);
  return ingredientArray[randomIndex];
}

// Create a random balanced recipe 
export function createRecipe(totalMER: number, dogs: Dog[], ingredientPercentages: IngredientPercentages): Recipe {
  const recipe: Recipe = {
    ingredients: {
      protein: { name: "", grams: 0, calories: 0 },
      organs: { name: "", grams: 0, calories: 0 },
      fruits: { name: "", grams: 0, calories: 0 },
      veggies: { name: "", grams: 0, calories: 0 },
      carbs: { name: "", grams: 0, calories: 0 },
      fats: { name: "", grams: 0, calories: 0 },
      supplements: []
    },
    totalCalories: 0
  };

  // First calculate supplements (based on total dog weight, not calories)
  const totalDogWeight = dogs.reduce((sum, dog) => sum + dog.weight, 0);
  let totalSupplementCalories = 0;
  
  for (const supplement of ingredients.supplements) {
    const gramsPerDay = totalDogWeight * supplement.gramsPerPoundPerDay!;
    const calories = gramsPerDay * supplement.caloriesPerGram;
    
    recipe.ingredients.supplements.push({
      name: supplement.name,
      grams: Math.round(gramsPerDay * 100) / 100,
      calories: Math.round(calories * 100) / 100,
      gramsPerScoop: supplement.gramsPerScoop || null
    });
    totalSupplementCalories += Math.round(calories * 100) / 100;
  }

  // Subtract supplement calories from total MER to get remaining calories for main ingredients
  const remainingMER = totalMER - totalSupplementCalories;
  
  // Calculate calories needed for each main ingredient category from remaining MER
  const calorieTargets = {
    protein: remainingMER * ingredientPercentages.protein,
    organs: remainingMER * ingredientPercentages.organs,
    fruits: remainingMER * ingredientPercentages.fruits,
    veggies: remainingMER * ingredientPercentages.veggies,
    carbs: remainingMER * ingredientPercentages.carbs,
    fats: remainingMER * ingredientPercentages.fats
  };

  // Select random ingredients from each category and calculate amounts
  let mainIngredientsCalories = 0;
  for (const category of ['protein', 'organs', 'fruits', 'veggies', 'carbs', 'fats'] as const) {
    const availableIngredients = ingredients[category];
    
    // Skip ingredients with 0% allocation
    if (calorieTargets[category] === 0 || ingredientPercentages[category] === 0) {
      recipe.ingredients[category] = {
        name: "None",
        grams: 0,
        calories: 0
      };
      continue;
    }
    
    const selectedIngredient = selectRandomIngredient(availableIngredients);
    const gramsNeeded = calorieTargets[category] / selectedIngredient.caloriesPerGram;
    const actualCalories = Math.round(gramsNeeded * selectedIngredient.caloriesPerGram * 100) / 100;
    
    recipe.ingredients[category] = {
      name: selectedIngredient.name,
      grams: Math.round(gramsNeeded * 100) / 100,
      calories: actualCalories
    };
    mainIngredientsCalories += actualCalories;
  }

  // Calculate actual total calories by summing all ingredients
  recipe.totalCalories = Math.round((mainIngredientsCalories + totalSupplementCalories) * 100) / 100;

  return recipe;
}

// Calculate shopping list for numberOfDays days
export function calculateShoppingList(recipe: Recipe, numberOfDays: number): ShoppingList {
  const shoppingList: ShoppingList = {};
  
  // Calculate amounts for main ingredients
  for (const category of ['protein', 'organs', 'fruits', 'veggies', 'carbs', 'fats'] as const) {
    const ingredient = recipe.ingredients[category];
    const totalGrams = ingredient.grams * numberOfDays;
    const totalPounds = Math.round(totalGrams / 453.592 * 100) / 100;
    
    shoppingList[ingredient.name] = {
      grams: totalGrams,
      pounds: totalPounds
    };
  }
  
  // Calculate amounts for supplements
  for (const supplement of recipe.ingredients.supplements) {
    const totalGrams = supplement.grams * numberOfDays;
    shoppingList[supplement.name] = {
      grams: totalGrams
    };
  }
  
  return shoppingList;
}

// Calculate per-meal portions for each dog
export function calculateMealPortions(recipe: Recipe, dogs: Dog[]) {
  const totalMER = getTotalMER(dogs);
  const portions: { [dogName: string]: { dailyPortion: number; mealPortion: number; percentage: number } } = {};
  
  for (const dog of dogs) {
    const dogPercentage = (dog.MER || 0) / totalMER;
    
    // Calculate total daily grams for this dog (all ingredients combined)
    let totalDailyGrams = 0;
    
    // Add main ingredients
    for (const category of ['protein', 'organs', 'fruits', 'veggies', 'carbs', 'fats'] as const) {
      const ingredient = recipe.ingredients[category];
      const dailyPortion = ingredient.grams * dogPercentage;
      totalDailyGrams += dailyPortion;
    }
    
    // Add supplements
    for (const supplement of recipe.ingredients.supplements) {
      const dailyPortion = supplement.grams * dogPercentage;
      totalDailyGrams += dailyPortion;
    }
    
    const mealPortion = totalDailyGrams / 2; // divide by 2 for morning/evening
    
    portions[dog.name] = {
      dailyPortion: Math.round(totalDailyGrams * 100) / 100,
      mealPortion: Math.round(mealPortion * 100) / 100,
      percentage: Math.round(dogPercentage * 100)
    };
  }
  
  return portions;
} 