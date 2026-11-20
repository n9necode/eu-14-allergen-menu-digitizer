'use strict';

/**
 * EU-14 Allergen Menu Digitizer — Apify Actor entry point.
 *
 * Reads INPUT (menuImageUrls, geminiApiKey, outputLanguage, ...), downloads each
 * menu image/PDF, extracts dishes via Gemini (user-supplied API key), enriches
 * with EU-14 allergen keyword overrides, dietary classification and nutrition
 * estimates, and pushes one record per dish to the Apify dataset.
 *
 * Works with the `apify` npm package on Apify Platform, and falls back to a
 * filesystem shim (INPUT.json -> OUTPUT.json) for local development.
 */

let Apify;
try {
  Apify = require('apify');
} catch (e) {
  Apify = require('./src/apifyShim').Apify;
}

const {
  DEFAULT_MODEL,
  DEFAULT_OUTPUT_LANGUAGE,
  DEFAULT_MAX_PAGES_PER_PDF,
  REVIEW_THRESHOLD,
  IMAGE_EXTENSIONS,
  PDF_EXTENSIONS,
  MIME_BY_EXTENSION
} = require('./src/config');
const { downloadFile, extensionFromUrl } = require('./src/downloader');
const { hasPdftoppm, renderPdfPages } = require('./src/pdfRenderer');
const { normalizeImage } = require('./src/imageNormalizer');
const { extractDishes } = require('./src/geminiClient');
const { parseAndValidateDishes } = require('./src/responseParser');
const { tagIngredients } = require('./src/allergenTagger');
const { classifyDietary } = require('./src/dietaryClassifier');
const { estimateNutrition } = require('./src/nutritionEstimator');

function mimeOf(url) {
  const ext = extensionFromUrl(url);
  return MIME_BY_EXTENSION[ext] || '';
}

function isPdfMime(mime) { return mime === 'application/pdf'; }

function enrichDish(dish, sourceImageUrl, cuisine) {
  tagIngredients(dish.ingredients, dish.originalName || dish.dishName, cuisine);
  const dietary = classifyDietary(dish);
  dish.dietaryType = dietary.dietaryType;
  dish.dietaryExplanation = dietary.dietaryExplanation;
  dish.nutritionEstimate = estimateNutrition(dish.ingredients);
  dish.sourceImageUrl = sourceImageUrl;
  dish.confidence = Number.isFinite(dish.confidence)
    ? Math.max(0, Math.min(1, dish.confidence))
    : REVIEW_THRESHOLD;
  dish.confidence = Math.round(dish.confidence * 100) / 100;
  dish.needsReview = dish.confidence < REVIEW_THRESHOLD;
  return dish;
}

async function processUrl(url, input, pdftoppm) {
  const language = input.outputLanguage || DEFAULT_OUTPUT_LANGUAGE;
  const sourceHint = input.sourceLanguageHint;
  const cuisine = input.cuisineVertical || 'general';
  const maxPages = Math.max(1, Math.min(Number(input.maxPagesPerPdf) || DEFAULT_MAX_PAGES_PER_PDF, 50));

  let downloaded;
  try {
    downloaded = await downloadFile(url);
  } catch (err) {
    return [{
      error: `Failed to download ${url}: ${err.message}`,
      sourceImageUrl: url,
      needsReview: true,
      confidence: 0
    }];
  }

  const { buffer, mime } = downloaded;
  const images = [];

  if (isPdfMime(mime)) {
    if (pdftoppm) {
      const pages = await renderPdfPages(buffer, maxPages);
      if (pages.length === 0) {
        return [{ error: `PDF rendered 0 pages (maxPagesPerPdf=${maxPages})`, sourceImageUrl: url, confidence: 0, needsReview: true }];
      }
      images.push(...pages);
    } else {
      // No poppler on this host: send the whole PDF document to Gemini directly.
      images.push({ buffer, mime: 'application/pdf' });
    }
  } else {
    images.push({ buffer, mime });
  }

  const records = [];
  for (const img of images) {
    const normalized = await normalizeImage(img.buffer, img.mime);
    const part = {
      inlineData: {
        mimeType: normalized.mime,
        data: normalized.buffer.toString('base64')
      }
    };

    let raw;
    try {
      raw = await extractDishes({
        geminiApiKey: input.geminiApiKey,
        images: [part],
        outputLanguage: language,
        sourceLanguageHint: sourceHint,
        cuisineVertical: cuisine
      });
    } catch (err) {
      records.push({
        error: `Gemini extraction failed: ${err.message}`,
        sourceImageUrl: url,
        confidence: 0,
        needsReview: true
      });
      continue;
    }

    const dishes = parseAndValidateDishes(raw, url);
    for (const dish of dishes) {
      records.push(enrichDish(dish, url, cuisine));
    }
  }
  return records;
}

const run = async () => {
  const input = await Apify.getValue('INPUT') ||
    (fs.existsSync('INPUT.json') ? JSON.parse(fs.readFileSync('INPUT.json', 'utf8')) : {});

  // --dry-run mode: run end-to-end without calling Gemini,
  // returning a mocked schema-shaped response so tests/CI can run without API spend.
  const dryRun = process.argv.includes('--dry-run') || input.dryRun;
  const urls = input.menuImageUrls;

  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('Input "menuImageUrls" (non-empty array of strings) is required.');
  }
  if (!input.geminiApiKey) {
    throw new Error('Input "geminiApiKey" is required (your own Gemini API key).');
  }

  const pdftoppm = hasPdftoppm();
  console.log(`[menu-digitizer] Starting: ${urls.length} URL(s), pdftoppm=${pdftoppm}, cuisine=${input.cuisineVertical || 'general'}, lang=${input.outputLanguage || DEFAULT_OUTPUT_LANGUAGE}`);

  let count = 0;
  for (const url of urls) {
    let records;
    try {
      if (dryRun) {
        // Mock Gemini output shaped exactly like the dish-record schema.
        // Each page produces one dish for demo purposes; downstream stages
        // (allergenTagger, dietaryClassifier, nutritionEstimator) still run.
        const mockDish = {
          dishName: 'Mocked Dish',
          originalName: 'Mocked Dish',
          category: null,
          price: null,
          ingredients: [
            { englishName: 'mocked ingredient', displayName: 'mocked ingredient', eu14Allergens: [] }
          ],
          dietaryType: 'other',
          dietaryExplanation: 'Mocked - no Gemini call made.',
          allergenSummary: '',
          nutritionEstimate: { calories: null, proteinG: null, fatG: null, carbsG: null },
          sourceImageUrl: url,
          confidence: 0.5,
          needsReview: true
        };
        records = [enrichDish(mockDish, url, input.cuisineVertical || 'general')];
      } else {
        records = await processUrl(url, input, pdftoppm);
      }
    } catch (err) {
      records = [{
        error: err.message,
        sourceImageUrl: url,
        confidence: 0,
        needsReview: true
      }];
    }
    for (const record of records) {
      await Apify.pushData(record);
      count++;
    }
    console.log(`[menu-digitizer] ${url} -> ${records.length} record(s)`);
  }
  console.log(`[menu-digitizer] Done. Pushed ${count} record(s).`);
};

if (require.main === module) {
  Apify.main(run);
}

module.exports = { processUrl, enrichDish, run };