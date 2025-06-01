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

export interface IngredientCounts {
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
    protein: RecipeIngredient[];
    organs: RecipeIngredient[];
    fruits: RecipeIngredient[];
    veggies: RecipeIngredient[];
    carbs: RecipeIngredient[];
    fats: RecipeIngredient[];
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
    { name: "Beef (ground, 85% lean)", caloriesPerGram: 2.50 },
    { name: "Beef (sirloin steak)", caloriesPerGram: 2.71 },
    { name: "Turkey (ground, 85% lean)", caloriesPerGram: 2.03 },
    { name: "Turkey (breast, skinless)", caloriesPerGram: 1.35 },
    { name: "Duck (meat without skin)", caloriesPerGram: 2.01 },
    { name: "Pork (lean cuts)", caloriesPerGram: 2.42 },
    { name: "Venison", caloriesPerGram: 1.58 },
    { name: "Buffalo/Bison", caloriesPerGram: 1.46 },
    { name: "Tuna (canned in water)", caloriesPerGram: 1.16 },
    { name: "Tilapia", caloriesPerGram: 1.29 },
    { name: "Trout", caloriesPerGram: 1.90 },
    { name: "Mackerel", caloriesPerGram: 2.05 }
  ],
  
  organs: [
    { name: "Pork Heart", caloriesPerGram: 1.35 },
    { name: "Pork Liver", caloriesPerGram: 1.34 },
    { name: "Pork Kidneys", caloriesPerGram: 2.33 },
    { name: "Beef Liver", caloriesPerGram: 1.35 },
    { name: "Beef Kidneys", caloriesPerGram: 0.99 },
  ],
  
  carbs: [
    { name: "White Rice", caloriesPerGram: 1.30 },    
    { name: "Quinoa", caloriesPerGram: 1.19 }
  ],

  fruits: [
    { name: "Apple", caloriesPerGram: 0.52 },
    { name: "Blueberry", caloriesPerGram: 0.56 },
    { name: "Strawberries", caloriesPerGram: 0.32 },
    { name: "Watermelon", caloriesPerGram: 0.30 },
  ],

  veggies: [
    { name: "Broccoli", caloriesPerGram: 0.34 },
    { name: "Brussels Sprouts", caloriesPerGram: 0.43 },
    { name: "Cabbage", caloriesPerGram: 0.25 },
    { name: "Carrots", caloriesPerGram: 0.41 },
    { name: "Cauliflower", caloriesPerGram: 0.25 },
    { name: "Celery", caloriesPerGram: 0.14 },
    { name: "Collard Greens", caloriesPerGram: 0.32 },
    { name: "Cucumber", caloriesPerGram: 0.16 },
    { name: "Green Beans", caloriesPerGram: 0.31 },
    { name: "Green Peas", caloriesPerGram: 0.81 },
    { name: "Kale", caloriesPerGram: 0.49 },
    { name: "Spinach", caloriesPerGram: 0.23 },
    { name: "Zucchini", caloriesPerGram: 0.17 },
    { name: "Summer Squash", caloriesPerGram: 0.16 },
    { name: "Winter Squash", caloriesPerGram: 0.39 },
    { name: "Bok Choy", caloriesPerGram: 0.13 },
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

// Helper function to select multiple random ingredients from an array without duplicates
function selectRandomIngredients(ingredientArray: Ingredient[], count: number): Ingredient[] {
  if (count <= 0) return [];
  if (count >= ingredientArray.length) return [...ingredientArray];
  
  const shuffled = [...ingredientArray].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Create a random balanced recipe 
export function createRecipe(totalMER: number, dogs: Dog[], ingredientPercentages: IngredientPercentages, ingredientCounts: IngredientCounts): Recipe {
  const recipe: Recipe = {
    ingredients: {
      protein: [],
      organs: [],
      fruits: [],
      veggies: [],
      carbs: [],
      fats: [],
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
    const ingredientCount = ingredientCounts[category];
    
    // Skip ingredients with 0% allocation or 0 count
    if (calorieTargets[category] === 0 || ingredientPercentages[category] === 0 || ingredientCount === 0) {
      recipe.ingredients[category] = [];
      continue;
    }
    
    const selectedIngredients = selectRandomIngredients(availableIngredients, ingredientCount);
    const caloriesPerIngredient = calorieTargets[category] / selectedIngredients.length;
    
    for (const selectedIngredient of selectedIngredients) {
      const gramsNeeded = caloriesPerIngredient / selectedIngredient.caloriesPerGram;
      const actualCalories = Math.round(gramsNeeded * selectedIngredient.caloriesPerGram * 100) / 100;
      
      recipe.ingredients[category].push({
        name: selectedIngredient.name,
        grams: Math.round(gramsNeeded * 100) / 100,
        calories: actualCalories
      });
      mainIngredientsCalories += actualCalories;
    }
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
    const ingredients = recipe.ingredients[category];
    for (const ingredient of ingredients) {
      const totalGrams = ingredient.grams * numberOfDays;
      const totalPounds = Math.round(totalGrams / 453.592 * 100) / 100;
      
      if (shoppingList[ingredient.name]) {
        shoppingList[ingredient.name].grams += totalGrams;
        if (shoppingList[ingredient.name].pounds) {
          shoppingList[ingredient.name].pounds! += totalPounds;
        }
      } else {
        shoppingList[ingredient.name] = {
          grams: totalGrams,
          pounds: totalPounds
        };
      }
    }
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
      const ingredients = recipe.ingredients[category];
      for (const ingredient of ingredients) {
        const dailyPortion = ingredient.grams * dogPercentage;
        totalDailyGrams += dailyPortion;
      }
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