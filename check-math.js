// Check the eggshell powder math
console.log("Checking eggshell powder calcium calculations:");
console.log("=".repeat(60));

// Given information:
const calciumPerScoop = 650; // mg calcium per 1/3 teaspoon
const gramsPerScoop = 1.9; // grams per 1/3 teaspoon (your updated value)
const currentCalciumMgPerGram = 360; // what's currently in the code

console.log(`Given: 1/3 teaspoon provides ${calciumPerScoop}mg calcium`);
console.log(`Given: 1/3 teaspoon weighs ${gramsPerScoop}g`);
console.log(`Current calciumMgPerGram in code: ${currentCalciumMgPerGram}`);

// Calculate what calciumMgPerGram should actually be
const correctCalciumMgPerGram = calciumPerScoop / gramsPerScoop;
console.log(`\nCalculated calciumMgPerGram should be: ${correctCalciumMgPerGram.toFixed(1)} mg/g`);

// Check what the current code would calculate
const calciumFromCurrentCode = gramsPerScoop * currentCalciumMgPerGram;
console.log(`With current code (${currentCalciumMgPerGram} mg/g), 1/3 tsp would provide: ${calciumFromCurrentCode}mg calcium`);

// Show the difference
const difference = calciumFromCurrentCode - calciumPerScoop;
console.log(`Difference from expected: ${difference > 0 ? '+' : ''}${difference}mg`);

console.log("\n" + "=".repeat(60));
console.log("RECOMMENDATION:");
if (Math.abs(difference) > 10) {
    console.log(`Update calciumMgPerGram to ${correctCalciumMgPerGram.toFixed(0)} for accurate calculations`);
} else {
    console.log("Current calculations are close enough (within 10mg)");
}

// Test with example dogs
console.log("\n" + "=".repeat(60));
console.log("Example calculation with Jackson (35 lbs) + Joey (17 lbs):");

function calculateCalciumNeeds(totalDogWeight) {
    const totalWeightKg = totalDogWeight / 2.2046;
    const calciumNeeds = totalWeightKg * 50; // mg per day
    return Math.round(calciumNeeds);
}

const totalWeight = 35 + 17;
const calciumNeeds = calculateCalciumNeeds(totalWeight);
const eggshellGramsNeeded = calciumNeeds / correctCalciumMgPerGram;
const scoopsNeeded = eggshellGramsNeeded / gramsPerScoop;

console.log(`Total calcium needed: ${calciumNeeds}mg`);
console.log(`Eggshell powder needed: ${eggshellGramsNeeded.toFixed(2)}g`);
console.log(`Scoops needed: ${scoopsNeeded.toFixed(2)} scoops (1/3 tsp each)`);
console.log(`Actual calcium provided: ${Math.round(eggshellGramsNeeded * correctCalciumMgPerGram)}mg`); 