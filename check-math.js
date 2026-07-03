// Check the eggshell powder + calcium math against veterinary guidelines
console.log("Checking eggshell powder + calcium calculations:");
console.log("=".repeat(60));

// Eggshell powder is ~38% elemental calcium by weight.
// Vet nutrition / USDA sources put finely ground eggshell at ~380 mg Ca per gram.
const calciumMgPerGram = 380;
const gramsPerScoop = 1.9; // 1/3 teaspoon ~= 1.9g per scoop
const calciumPerScoop = calciumMgPerGram * gramsPerScoop; // ~722 mg per scoop

console.log(`Eggshell calcium density: ${calciumMgPerGram} mg/g (~38% calcium)`);
console.log(`1/3 tsp scoop (${gramsPerScoop}g) provides ~${Math.round(calciumPerScoop)}mg calcium`);

// Calcium requirement is tied to CALORIES, not body weight.
// NRC (2006) recommended allowance: 1.0 mg Ca/kcal.
// AAFCO (2016) adult maintenance minimum: 1.25 mg Ca/kcal (what the app uses).
const CALCIUM_MG_PER_KCAL = 1.25;

function calculateDailyCalories(dog) {
  const weightKg = dog.weight / 2.2046;
  const RER = 70 * Math.pow(weightKg, 0.75);
  return RER * dog.activityMultiplier;
}

console.log("\n" + "=".repeat(60));
console.log("Example: Jackson (30 lbs, 1.3x) + Joey (12 lbs, 1.0x)");

const dogs = [
  { name: "Jackson", weight: 30, activityMultiplier: 1.3 },
  { name: "Joey", weight: 12, activityMultiplier: 1.0 },
];

const totalCalories = dogs.reduce((sum, d) => sum + calculateDailyCalories(d), 0);
const calciumNeeds = Math.round(totalCalories * CALCIUM_MG_PER_KCAL);
const eggshellGramsNeeded = calciumNeeds / calciumMgPerGram;
const scoopsNeeded = eggshellGramsNeeded / gramsPerScoop;

console.log(`Total daily calories (MER): ${totalCalories.toFixed(0)} kcal`);
console.log(`Calcium needed (@ ${CALCIUM_MG_PER_KCAL} mg/kcal): ${calciumNeeds}mg`);
console.log(`Eggshell powder needed: ${eggshellGramsNeeded.toFixed(2)}g`);
console.log(`Scoops needed: ${scoopsNeeded.toFixed(2)} scoops (1/3 tsp each)`);
console.log(`Actual calcium provided: ${Math.round(eggshellGramsNeeded * calciumMgPerGram)}mg`);
