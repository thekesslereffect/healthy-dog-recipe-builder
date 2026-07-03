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
  caloriesPer100g: number;
  gramsPerPoundPerDay?: number;
  gramsPerScoop?: number;
  calciumMgPerGram?: number;
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
//
// Calorie values are kcal per 100g. Meats, organs, fish, produce and oils use
// USDA FoodData Central RAW values (you buy and weigh these raw), so the whole
// database is on a consistent basis. Grains are the exception and use COOKED
// values (dogs eat them cooked), so they are labelled "(cooked)".
const ingredients = {
  protein: [
    { name: "Beef (ground, 85% lean)", caloriesPer100g: 215 },
    { name: "Beef (sirloin steak)", caloriesPer100g: 201 },
    { name: "Turkey (ground, 85% lean)", caloriesPer100g: 213 },
    { name: "Turkey (breast, skinless)", caloriesPer100g: 114 },
    { name: "Duck (meat without skin)", caloriesPer100g: 185 },
    { name: "Pork (lean cuts)", caloriesPer100g: 143 },
    { name: "Venison", caloriesPer100g: 158 },
    { name: "Buffalo/Bison", caloriesPer100g: 146 },
    { name: "Tuna (canned in water)", caloriesPer100g: 116 },
    { name: "Tilapia", caloriesPer100g: 96 },
    { name: "Trout", caloriesPer100g: 141 },
    { name: "Mackerel", caloriesPer100g: 205 }
  ],
  
  organs: [
    { name: "Pork Heart", caloriesPer100g: 118 },
    { name: "Pork Liver", caloriesPer100g: 134 },
    { name: "Pork Kidneys", caloriesPer100g: 100 },
    { name: "Beef Liver", caloriesPer100g: 135 },
    { name: "Beef Kidneys", caloriesPer100g: 99 },
  ],
  
  carbs: [
    { name: "White Rice (cooked)", caloriesPer100g: 130 },    
    { name: "Quinoa (cooked)", caloriesPer100g: 120 }
  ],

  fruits: [
    { name: "Apple", caloriesPer100g: 52 },
    { name: "Blueberry", caloriesPer100g: 57 },
    { name: "Strawberries", caloriesPer100g: 32 },
    { name: "Watermelon", caloriesPer100g: 30 },
  ],

  veggies: [
    { name: "Broccoli", caloriesPer100g: 34 },
    { name: "Brussels Sprouts", caloriesPer100g: 43 },
    { name: "Cabbage", caloriesPer100g: 25 },
    { name: "Carrots", caloriesPer100g: 41 },
    { name: "Cauliflower", caloriesPer100g: 25 },
    { name: "Celery", caloriesPer100g: 14 },
    { name: "Collard Greens", caloriesPer100g: 32 },
    { name: "Cucumber", caloriesPer100g: 16 },
    { name: "Green Beans", caloriesPer100g: 31 },
    { name: "Green Peas", caloriesPer100g: 81 },
    { name: "Kale", caloriesPer100g: 49 },
    { name: "Spinach", caloriesPer100g: 23 },
    { name: "Zucchini", caloriesPer100g: 17 },
    { name: "Summer Squash", caloriesPer100g: 16 },
    { name: "Winter Squash", caloriesPer100g: 39 },
    { name: "Bok Choy", caloriesPer100g: 13 },
  ],
  
  fats: [
    { name: "Olive Oil", caloriesPer100g: 884 },
    { name: "Coconut Oil", caloriesPer100g: 865 }
  ],

  supplements: [
    {
      name: "Rx Essentials",
      caloriesPer100g: 500,
      gramsPerPoundPerDay: 0.1,
      gramsPerScoop: 5,
    },
    {
      name: "Hemp Seed Oil",
      caloriesPer100g: 886,
      gramsPerPoundPerDay: 0.15,
    },
    {
      name: "Turmeric",
      caloriesPer100g: 354,
      gramsPerPoundPerDay: 0.015,
    },
    {
      name: "Ginger",
      caloriesPer100g: 335,
      gramsPerPoundPerDay: 0.015,
    },
    {
      name: "Eggshell Powder (Calcium)",
      caloriesPer100g: 0.00, // Eggshell powder has negligible calories
      gramsPerPoundPerDay: 0.0, // Will be calculated based on calcium needs
      gramsPerScoop: 1.9, // 1/3 teaspoon ~= 1.9g per scoop
      calciumMgPerGram: 380, // Eggshell is ~38% elemental calcium => ~380 mg Ca per gram (USDA / vet nutrition sources)
    }
  ]
};

// Calcium density of the diet, in mg of calcium per kcal of food.
// The NRC (2006) recommended allowance for adult dogs at maintenance is
// 1.0 mg Ca/kcal; AAFCO (2016) sets the adult maintenance minimum at
// 1.25 mg Ca/kcal. We use 1.25 mg/kcal so the recipe meets the AAFCO minimum.
const CALCIUM_MG_PER_KCAL = 1.25;

// Calculate daily calcium needs based on the dog's total daily calories.
//
// Calcium requirements are tied to energy intake (per 1,000 kcal), NOT to body
// weight directly, because dogs eat to meet their energy needs and calcium must
// be balanced against the phosphorus in that food. Basing it on calories keeps
// the calcium-to-calorie ratio correct for dogs of any size or activity level.
function calculateCalciumNeeds(totalDailyCalories: number): number {
  const calciumNeeds = totalDailyCalories * CALCIUM_MG_PER_KCAL; // mg per day
  return Math.round(calciumNeeds);
}

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

  // Calculate total dog weight for calcium needs
  const totalDogWeight = dogs.reduce((sum, dog) => sum + dog.weight, 0);
  
  // First calculate supplements (based on total dog weight, not calories)
  let totalSupplementCalories = 0;
  
  // Add regular supplements
  for (const supplement of ingredients.supplements) {
    if (supplement.name === "Eggshell Powder (Calcium)") {
      // Calcium is scaled to the total daily calories of the diet (mg per kcal),
      // which is the veterinary-correct basis, rather than raw body weight.
      const calciumNeeds = calculateCalciumNeeds(totalMER);
      const eggshellGrams = supplement.calciumMgPerGram
        ? calciumNeeds / supplement.calciumMgPerGram
        : 0;
      
      recipe.ingredients.supplements.push({
        name: supplement.name,
        grams: Math.round(eggshellGrams * 100) / 100,
        calories: Math.round(eggshellGrams * (supplement.caloriesPer100g || 0) / 100 * 100) / 100,
        gramsPerScoop: supplement.gramsPerScoop || null
      });
      totalSupplementCalories += Math.round(eggshellGrams * (supplement.caloriesPer100g || 0) / 100 * 100) / 100;
    } else {
      // Regular supplement calculation
      const gramsPerDay = totalDogWeight * supplement.gramsPerPoundPerDay!;
      const calories = gramsPerDay * (supplement.caloriesPer100g || 0) / 100;
      
      recipe.ingredients.supplements.push({
        name: supplement.name,
        grams: Math.round(gramsPerDay * 100) / 100,
        calories: Math.round(calories * 100) / 100,
        gramsPerScoop: supplement.gramsPerScoop || null
      });
      totalSupplementCalories += Math.round(calories * 100) / 100;
    }
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
      const gramsNeeded = (caloriesPerIngredient / (selectedIngredient.caloriesPer100g || 0)) * 100;
      const actualCalories = Math.round(gramsNeeded * (selectedIngredient.caloriesPer100g || 0) / 100 * 100) / 100;
      
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
      const totalPounds = Math.round(totalGrams / 453.592 * 1000) / 1000;
      
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
  const totalWeightLbs = dogs.reduce((sum, dog) => sum + (dog.weight || 0), 0);
  const portions: { [dogName: string]: { dailyPortion: number; mealPortion: number; percentage: number } } = {};
  
  for (const dog of dogs) {
    const dogEnergyShare = totalMER > 0 ? (dog.MER || 0) / totalMER : 0;
    const dogWeightShare = totalWeightLbs > 0 ? (dog.weight || 0) / totalWeightLbs : 0;
    
    // Calculate total daily grams for this dog (all ingredients combined)
    let totalDailyGrams = 0;
    
    // Add main ingredients
    for (const category of ['protein', 'organs', 'fruits', 'veggies', 'carbs', 'fats'] as const) {
      const ingredients = recipe.ingredients[category];
      for (const ingredient of ingredients) {
        const dailyPortion = ingredient.grams * dogEnergyShare;
        totalDailyGrams += dailyPortion;
      }
    }
    
    // Add supplements
    for (const supplement of recipe.ingredients.supplements) {
      const dailyPortion = supplement.grams * dogWeightShare; // dose supplements by body weight
      totalDailyGrams += dailyPortion;
    }
    
    const mealPortion = totalDailyGrams / 2; // divide by 2 for morning/evening
    
    portions[dog.name] = {
      dailyPortion: Math.round(totalDailyGrams * 100) / 100,
      mealPortion: Math.round(mealPortion * 100) / 100,
      percentage: Math.round(dogEnergyShare * 100)
    };
  }
  
  return portions;
} 