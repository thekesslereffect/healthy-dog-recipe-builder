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
 * Uses FDC_API_KEY when set; otherwise DEMO_KEY (rate-limited).
 * On API failure for an item, writes the allowlist fallback values.
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
const allowlistTsPath = join(root, 'app/data/allowlist.ts');

function loadAllowlist() {
  if (existsSync(allowlistPath)) {
    return JSON.parse(readFileSync(allowlistPath, 'utf8'));
  }
  const src = readFileSync(allowlistTsPath, 'utf8');
  const entries = [];
  const blockRe =
    /\{\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*fdcId:\s*(\d+),\s*basis:\s*'([^']+)',\s*fallback:\s*\{\s*caloriesPer100g:\s*([\d.]+),\s*proteinGPer100g:\s*([\d.]+),\s*fatGPer100g:\s*([\d.]+),\s*calciumMgPer100g:\s*([\d.]+),\s*phosphorusMgPer100g:\s*([\d.]+),\s*\},?\s*\}/g;
  let m;
  while ((m = blockRe.exec(src))) {
    entries.push({
      name: m[1],
      category: m[2],
      fdcId: Number(m[3]),
      basis: m[4],
      fallback: {
        caloriesPer100g: Number(m[5]),
        proteinGPer100g: Number(m[6]),
        fatGPer100g: Number(m[7]),
        calciumMgPer100g: Number(m[8]),
        phosphorusMgPer100g: Number(m[9]),
      },
    });
  }
  if (entries.length === 0) {
    throw new Error('Could not parse allowlist.ts — check entry formatting.');
  }
  return entries;
}

const NUTRIENT_IDS = {
  energyKcal: 1008,
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

function extendedFromFallback(fb) {
  if (!fb) return {};
  const out = {};
  if (fb.zincMgPer100g != null) out.zincMgPer100g = fb.zincMgPer100g;
  if (fb.copperMgPer100g != null) out.copperMgPer100g = fb.copperMgPer100g;
  if (fb.iodineMcgPer100g != null) out.iodineMcgPer100g = fb.iodineMcgPer100g;
  if (fb.vitaminDIUPer100g != null) out.vitaminDIUPer100g = fb.vitaminDIUPer100g;
  if (fb.vitaminEMgPer100g != null) out.vitaminEMgPer100g = fb.vitaminEMgPer100g;
  if (fb.cholineMgPer100g != null) out.cholineMgPer100g = fb.cholineMgPer100g;
  if (fb.epaMgPer100g != null) out.epaMgPer100g = fb.epaMgPer100g;
  if (fb.dhaMgPer100g != null) out.dhaMgPer100g = fb.dhaMgPer100g;
  return out;
}

function extendedFromApi(entry, food) {
  const fb = entry.fallback || {};
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
  else if (fb.zincMgPer100g != null) out.zincMgPer100g = fb.zincMgPer100g;

  if (copper != null) out.copperMgPer100g = round1(copper);
  else if (fb.copperMgPer100g != null) out.copperMgPer100g = fb.copperMgPer100g;

  if (iodine != null) out.iodineMcgPer100g = round1(iodine);
  else if (fb.iodineMcgPer100g != null) out.iodineMcgPer100g = fb.iodineMcgPer100g;

  if (vitDmcg != null) out.vitaminDIUPer100g = Math.round(vitDmcg * 40);
  else if (fb.vitaminDIUPer100g != null) out.vitaminDIUPer100g = fb.vitaminDIUPer100g;

  if (vitE != null) out.vitaminEMgPer100g = round1(vitE);
  else if (fb.vitaminEMgPer100g != null) out.vitaminEMgPer100g = fb.vitaminEMgPer100g;

  if (choline != null) out.cholineMgPer100g = round1(choline);
  else if (fb.cholineMgPer100g != null) out.cholineMgPer100g = fb.cholineMgPer100g;

  if (epaG != null) out.epaMgPer100g = Math.round(epaG * 1000);
  else if (fb.epaMgPer100g != null) out.epaMgPer100g = fb.epaMgPer100g;

  if (dhaG != null) out.dhaMgPer100g = Math.round(dhaG * 1000);
  else if (fb.dhaMgPer100g != null) out.dhaMgPer100g = fb.dhaMgPer100g;

  return out;
}

function fromFallback(entry) {
  return {
    name: entry.name,
    category: entry.category,
    fdcId: entry.fdcId,
    basis: entry.basis,
    caloriesPer100g: entry.fallback.caloriesPer100g,
    proteinGPer100g: entry.fallback.proteinGPer100g,
    fatGPer100g: entry.fallback.fatGPer100g,
    calciumMgPer100g: entry.fallback.calciumMgPer100g,
    phosphorusMgPer100g: entry.fallback.phosphorusMgPer100g,
    ...extendedFromFallback(entry.fallback),
    source: `Allowlist fallback (FDC ${entry.fdcId}, ${entry.basis})`,
  };
}

function descriptionPlausible(entry, food) {
  const d = (food.description || '').toLowerCase();
  if (entry.basis === 'raw' && /\bcooked\b/.test(d)) return false;
  if (entry.basis === 'cooked' && /\braw\b/.test(d) && !/\bcooked\b/.test(d)) return false;
  return true;
}

function fromApi(entry, food) {
  if (!descriptionPlausible(entry, food)) {
    throw new Error(`description mismatch: ${food.description}`);
  }

  const calories = nutrientAmount(food, NUTRIENT_IDS.energyKcal);
  const protein = nutrientAmount(food, NUTRIENT_IDS.protein);
  const fat = nutrientAmount(food, NUTRIENT_IDS.fat);
  const calcium = nutrientAmount(food, NUTRIENT_IDS.calcium);
  const phosphorus = nutrientAmount(food, NUTRIENT_IDS.phosphorus);

  const caloriesPer100g =
    calories != null ? Math.round(calories) : entry.fallback.caloriesPer100g;

  const expected = entry.fallback.caloriesPer100g;
  if (expected > 0 && Math.abs(caloriesPer100g - expected) / expected > 0.35) {
    throw new Error(
      `calorie mismatch: got ${caloriesPer100g}, expected ~${expected} (${food.description})`,
    );
  }

  return {
    name: entry.name,
    category: entry.category,
    fdcId: entry.fdcId,
    basis: entry.basis,
    caloriesPer100g,
    proteinGPer100g: protein != null ? round1(protein) : entry.fallback.proteinGPer100g,
    fatGPer100g: fat != null ? round1(fat) : entry.fallback.fatGPer100g,
    calciumMgPer100g: calcium != null ? Math.round(calcium) : entry.fallback.calciumMgPer100g,
    phosphorusMgPer100g:
      phosphorus != null ? Math.round(phosphorus) : entry.fallback.phosphorusMgPer100g,
    ...extendedFromApi(entry, food),
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
  console.log(`Syncing ${allowlist.length} allowlisted foods (key=${apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'custom'})…`);

  const foods = [];
  let apiOk = 0;
  let fallbacks = 0;

  for (const entry of allowlist) {
    try {
      const food = await fetchFood(entry.fdcId);
      foods.push(fromApi(entry, food));
      apiOk += 1;
      process.stdout.write(`  ✓ ${entry.name} ← ${food.description}\n`);
    } catch (err) {
      foods.push(fromFallback(entry));
      fallbacks += 1;
      process.stdout.write(`  ⚠ ${entry.name} (fallback: ${err.message})\n`);
    }
    await sleep(apiKey === 'DEMO_KEY' ? 600 : 200);
  }

  const outPath = join(root, 'app/data/foods.generated.ts');
  writeFileSync(outPath, emitTs(foods), 'utf8');
  console.log(`\nWrote ${outPath}`);
  console.log(`API: ${apiOk} · fallbacks: ${fallbacks}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
