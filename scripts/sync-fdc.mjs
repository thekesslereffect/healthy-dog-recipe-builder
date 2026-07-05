/**
 * Sync dog-safe allowlist nutrients from USDA FoodData Central.
 *
 * Dev only — not called by the app at runtime. Writes `app/data/foods.generated.ts`,
 * which the app imports directly.
 *
 * Usage:
 *   npm run sync:fdc
 *   FDC_API_KEY=your_key npm run sync:fdc
 *
 * Loads FDC_API_KEY from `.env` / `.env.local` when present; otherwise DEMO_KEY.
 * Requires a successful USDA response for every allowlisted food (no local fallbacks).
 *
 * Get a free key: https://fdc.nal.usda.gov/api-key-signup.html
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile() {
  for (const name of ['.env.local', '.env']) {
    const envPath = join(root, name);
    if (!existsSync(envPath)) continue;
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = value;
    }
    break;
  }
}

loadEnvFile();

const allowlistPath = join(root, 'app/data/allowlist.json');

function loadAllowlist() {
  return JSON.parse(readFileSync(allowlistPath, 'utf8'));
}

const NUTRIENT_IDS = {
  energyKcal: 1008,
  energyAtwaterGeneral: 2047,
  energyAtwaterSpecific: 2048,
  protein: 1003,
  fat: 1004,
  calcium: 1087,
  phosphorus: 1091,
  zinc: 1095,
  copper: 1098,
  iodine: 1100,
  vitaminD: 1114,
  vitaminE: 1109,
  choline: 1180,
  dha: 1272,
  epa: 1278,
};

const apiKey = process.env.FDC_API_KEY || 'DEMO_KEY';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nutrientAmount(food, nutrientId) {
  const hit = (food.foodNutrients || []).find(
    (n) => n.nutrient?.id === nutrientId || n.nutrientId === nutrientId,
  );
  return hit?.amount ?? hit?.value ?? null;
}

function energyKcal(food) {
  for (const id of [
    NUTRIENT_IDS.energyKcal,
    NUTRIENT_IDS.energyAtwaterGeneral,
    NUTRIENT_IDS.energyAtwaterSpecific,
  ]) {
    const amount = nutrientAmount(food, id);
    if (amount != null) return amount;
  }
  return null;
}

async function fetchFood(fdcId, attempt = 1) {
  const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;
  const res = await fetch(url);
  if (res.status === 429 && attempt < 4) {
    await sleep(1000 * attempt);
    return fetchFood(fdcId, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for FDC ${fdcId}`);
  }
  return res.json();
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function extendedFromApi(food) {
  const zinc = nutrientAmount(food, NUTRIENT_IDS.zinc);
  const copper = nutrientAmount(food, NUTRIENT_IDS.copper);
  const iodine = nutrientAmount(food, NUTRIENT_IDS.iodine);
  const vitDmcg = nutrientAmount(food, NUTRIENT_IDS.vitaminD);
  const vitE = nutrientAmount(food, NUTRIENT_IDS.vitaminE);
  const choline = nutrientAmount(food, NUTRIENT_IDS.choline);
  const dhaG = nutrientAmount(food, NUTRIENT_IDS.dha);
  const epaG = nutrientAmount(food, NUTRIENT_IDS.epa);
  const out = {};
  if (zinc != null) out.zincMgPer100g = round1(zinc);
  if (copper != null) out.copperMgPer100g = round1(copper);
  if (iodine != null) out.iodineMcgPer100g = round1(iodine);
  if (vitDmcg != null) out.vitaminDIUPer100g = Math.round(vitDmcg * 40);
  if (vitE != null) out.vitaminEMgPer100g = round1(vitE);
  if (choline != null) out.cholineMgPer100g = round1(choline);
  if (epaG != null) out.epaMgPer100g = Math.round(epaG * 1000);
  if (dhaG != null) out.dhaMgPer100g = Math.round(dhaG * 1000);
  return out;
}

function descriptionPlausible(entry, food) {
  const d = (food.description || '').toLowerCase();
  if (entry.basis === 'raw' && /\bcooked\b/.test(d)) return false;
  if (entry.basis === 'cooked' && /\braw\b/.test(d) && !/\bcooked\b/.test(d)) return false;
  return true;
}

function requireMacro(name, value) {
  if (value == null) {
    throw new Error(`missing ${name} in FDC response`);
  }
  return value;
}

function fromApi(entry, food) {
  if (!descriptionPlausible(entry, food)) {
    throw new Error(`description mismatch: ${food.description}`);
  }
  const calories = requireMacro('energy', energyKcal(food));
  const protein = requireMacro('protein', nutrientAmount(food, NUTRIENT_IDS.protein));
  const fat = requireMacro('fat', nutrientAmount(food, NUTRIENT_IDS.fat));
  const calcium = nutrientAmount(food, NUTRIENT_IDS.calcium) ?? 0;
  const phosphorus = nutrientAmount(food, NUTRIENT_IDS.phosphorus) ?? 0;
  return {
    name: entry.name,
    category: entry.category,
    fdcId: entry.fdcId,
    basis: entry.basis,
    caloriesPer100g: Math.round(calories),
    proteinGPer100g: round1(protein),
    fatGPer100g: round1(fat),
    calciumMgPer100g: Math.round(calcium),
    phosphorusMgPer100g: Math.round(phosphorus),
    ...extendedFromApi(food),
    source: `USDA FDC ${food.dataType || 'food'} ${entry.fdcId} (${entry.basis})`,
    fdcDescription: food.description,
  };
}

function emitField(key, value) {
  if (value == null) return [];
  return [`    ${key}: ${typeof value === 'string' ? JSON.stringify(value) : value},`];
}

function emitTs(foods) {
  const lines = [];
  lines.push('// AUTO-GENERATED by scripts/sync-fdc.mjs — do not edit by hand.');
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push("import type { FoodIngredient } from './ingredientTypes';");
  lines.push('');
  lines.push('export const FOODS: FoodIngredient[] = [');
  for (const food of foods.sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push('  {');
    lines.push(`    name: ${JSON.stringify(food.name)},`);
    lines.push(`    category: ${JSON.stringify(food.category)},`);
    lines.push(`    fdcId: ${food.fdcId},`);
    lines.push(`    basis: ${JSON.stringify(food.basis)},`);
    lines.push(`    caloriesPer100g: ${food.caloriesPer100g},`);
    lines.push(`    proteinGPer100g: ${food.proteinGPer100g},`);
    lines.push(`    fatGPer100g: ${food.fatGPer100g},`);
    lines.push(`    calciumMgPer100g: ${food.calciumMgPer100g},`);
    lines.push(`    phosphorusMgPer100g: ${food.phosphorusMgPer100g},`);
    for (const key of [
      'zincMgPer100g',
      'copperMgPer100g',
      'iodineMcgPer100g',
      'vitaminDIUPer100g',
      'vitaminEMgPer100g',
      'cholineMgPer100g',
      'epaMgPer100g',
      'dhaMgPer100g',
    ]) {
      lines.push(...emitField(key, food[key]));
    }
    lines.push(`    source: ${JSON.stringify(food.source)},`);
    if (food.fdcDescription) {
      lines.push(`    fdcDescription: ${JSON.stringify(food.fdcDescription)},`);
    }
    lines.push('  },');
  }
  lines.push('];');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const allowlist = loadAllowlist();
  console.log(
    `Syncing ${allowlist.length} allowlisted foods (key=${apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'custom'})…`,
  );
  const foods = [];
  const failures = [];
  for (const entry of allowlist) {
    try {
      const food = await fetchFood(entry.fdcId);
      foods.push(fromApi(entry, food));
      process.stdout.write(`  ✓ ${entry.name} ← ${food.description}\n`);
    } catch (err) {
      failures.push({ name: entry.name, message: err.message });
      process.stdout.write(`  ✗ ${entry.name} (${err.message})\n`);
    }
    await sleep(apiKey === 'DEMO_KEY' ? 600 : 200);
  }
  if (failures.length > 0) {
    console.error(
      `\nSync failed for ${failures.length} food(s). foods.generated.ts was not updated.`,
    );
    process.exit(1);
  }
  const outPath = join(root, 'app/data/foods.generated.ts');
  writeFileSync(outPath, emitTs(foods), 'utf8');
  console.log(`\nWrote ${outPath}`);
  console.log(`Synced ${foods.length} foods from USDA FDC.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
