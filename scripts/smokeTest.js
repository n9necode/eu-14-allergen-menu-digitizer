'use strict';

function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$|^'|'$/g, '');
    }
  }
}
loadEnv();


/**
 * Smoke test for the EU-14 Allergen Menu Digitizer.
 * Makes REAL Gemini calls using the API key from the environment.
 * Usage:
 *   GEMINI_API_KEY=<key> node scripts/smokeTest.js --menu test-menus/italian/01-trattoria.jpg
 *   GEMINI_API_KEY=<key> node scripts/smokeTest.js --all
 */

const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const provider = args.includes('--provider') ? args[args.indexOf('--provider') + 1] : 'gemini';
const { extractDishes } = provider === 'openrouter'
  ? require('../src/openRouterClient')
  : provider === 'groq'
    ? require('../src/groqClient')
    : provider === 'vlmrun'
      ? require('../src/vlmRunClient')
      : require('../src/geminiClient');
const { tagIngredients } = require('../src/allergenTagger');
const { classifyDietary } = require('../src/dietaryClassifier');
const { estimateNutrition } = require('../src/nutritionEstimator');
const { normalizeImage } = require('../src/imageNormalizer');
const { downloadFile } = require('../src/downloader');

const ROOT = path.resolve(__dirname, '..');
const MENU_DIR = path.join(ROOT, 'test-menus', 'italian');
const OUTPUT_DIR = path.join(ROOT, 'test-menus', 'output');

function enrichDish(dish, sourceImageUrl, cuisine) {
  tagIngredients(dish.ingredients, dish.originalName || dish.dishName, cuisine);
  const dietary = classifyDietary(dish);
  dish.dietaryType = dietary.dietaryType;
  dish.dietaryExplanation = dietary.dietaryExplanation;
  dish.nutritionEstimate = estimateNutrition(dish.ingredients);
  dish.sourceImageUrl = sourceImageUrl;
  dish.confidence = Number.isFinite(dish.confidence)
    ? Math.max(0, Math.min(1, dish.confidence))
    : 0.6;
  dish.confidence = Math.round(dish.confidence * 100) / 100;
  dish.needsReview = dish.confidence < 0.6;
  return dish;
}

async function processMenu(filePath, apiKey, cuisine = 'italian', provider = 'gemini') {
  const ext = path.extname(filePath).toLowerCase();
  const isPdf = ext === '.pdf';
  const baseName = path.basename(filePath, ext);

  let buffer;
  let mime;
  if (isPdf) {
    // For smoke test, read PDF directly from disk
    buffer = fs.readFileSync(filePath);
    mime = 'application/pdf';
  } else {
    buffer = fs.readFileSync(filePath);
    mime = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    }[ext] || 'application/octet-stream';
  }

  const normalized = await normalizeImage(buffer, mime);
  const part = {
    inlineData: {
      mimeType: normalized.mime,
      data: normalized.buffer.toString('base64')
    }
  };

  const raw = await extractDishes({
    ...(provider === 'openrouter' ? { openRouterApiKey: apiKey } : provider === 'groq' ? { groqApiKey: apiKey } : { geminiApiKey: apiKey }),
    images: [part],
    outputLanguage: 'en',
    sourceLanguageHint: undefined,
    cuisineVertical: cuisine
  });

  const dishes = (raw.dishes || []).map(d => enrichDish(d, filePath, cuisine));

  const outPath = path.join(OUTPUT_DIR, `${baseName}.output.json`);
  fs.writeFileSync(outPath, JSON.stringify(dishes, null, 2));

  const allergenCount = dishes.flatMap(d =>
    d.ingredients.flatMap(i => i.eu14Allergens.map(a => a.allergen))
  ).length;
  const lowConf = dishes.filter(d => d.needsReview).length;

  return { dishCount: dishes.length, allergenCount, lowConf, outPath };
}

async function main() {
  const args = process.argv.slice(2);
  const provider = args.includes('--provider') ? args[args.indexOf('--provider') + 1] : 'gemini';
  const apiKey = provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : provider === 'groq' ? process.env.GROQ_API_KEY : provider === 'vlmrun' ? process.env.VLMRUN_API_KEY : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error(`ERROR: ${provider === 'openrouter' ? 'OPENROUTER_API_KEY' : provider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY'} environment variable is required`);
    process.exit(1);
  }

  const menuIndex = args.indexOf('--menu');
  const allIndex = args.indexOf('--all');

  let files;
  if (menuIndex >= 0 && args[menuIndex + 1]) {
    files = [path.resolve(args[menuIndex + 1])];
  } else if (allIndex >= 0) {
    if (!fs.existsSync(MENU_DIR)) {
      console.error(`ERROR: Menu directory not found: ${MENU_DIR}`);
      process.exit(1);
    }
    files = fs.readdirSync(MENU_DIR)
      .filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext);
      })
      .map(f => path.join(MENU_DIR, f))
      .sort();
  } else {
    console.error('Usage: node scripts/smokeTest.js --menu <file> | --all');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let totalDishes = 0, totalAllergens = 0, totalLowConf = 0;

  for (const file of files) {
    try {
      const result = await processMenu(file, apiKey, 'italian', provider);
      totalDishes += result.dishCount;
      totalAllergens += result.allergenCount;
      totalLowConf += result.lowConf;
      console.log(
        `[smoke] ${path.basename(file)}: ${result.dishCount} dish(es), ` +
        `${result.allergenCount} allergen tag(s), ${result.lowConf} needs-review`
      );
    } catch (err) {
      console.error(`[smoke] ERROR processing ${file}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(
    `\n[TOTAL] ${files.length} menu(s), ${totalDishes} dish(es), ` +
    `${totalAllergens} allergen tag(s), ${totalLowConf} needs-review`
  );
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
