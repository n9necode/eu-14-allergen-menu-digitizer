'use strict';

const { EU14_ALLERGENS, REVIEW_THRESHOLD, CONFIDENCE_HEURISTIC_DEFAULT } = require('./config');
const DIETARY_TYPES = ['vegan', 'vegetarian', 'pescetarian', 'other'];

const EU14_SET = new Set(EU14_ALLERGENS);

function cleanString(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function clamp01(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : null;
}

function heuristicConfidence(dish) {
  let c = 0.8;
  if (!dish.dishName) c -= 0.2;
  if (!dish.ingredients || dish.ingredients.length === 0) c -= 0.3;
  if (!dish.price) c -= 0.1;
  if (!dish.allergenSummary) c -= 0.1;
  return Math.max(0, Math.min(1, c));
}

function cleanAllergens(raw) {
  const seen = {};
  for (const a of (raw || [])) {
    if (!a || !EU14_SET.has(a.allergen)) continue;
    const conf = clamp01(a.confidence);
    if (conf == null) continue;
    const prev = seen[a.allergen];
    if (prev === undefined || conf > prev) seen[a.allergen] = conf;
  }
  return EU14_ALLERGENS.filter(a => seen[a] != null)
    .map(a => ({ allergen: a, confidence: Math.round(seen[a] * 100) / 100 }));
}

function cleanIngredient(raw) {
  return {
    englishName: cleanString(raw && raw.englishName) || null,
    displayName: cleanString(raw && raw.displayName) || null,
    eu14Allergens: cleanAllergens(raw && raw.eu14Allergens)
  };
}

function cleanNumber(v) {
  return typeof v === 'number' && isFinite(v) ? Math.round(v * 10) / 10 : null;
}

function cleanNutrition(raw) {
  if (!raw || typeof raw !== 'object') return { calories: null, proteinG: null, fatG: null, carbsG: null };
  return {
    calories: cleanNumber(raw.calories),
    proteinG: cleanNumber(raw.proteinG),
    fatG: cleanNumber(raw.fatG),
    carbsG: cleanNumber(raw.carbsG)
  };
}

function parseAndValidateDishes(raw, sourceImageUrl) {
  const root = (raw && raw.dishes) || (Array.isArray(raw) ? raw : []);
  if (!Array.isArray(root)) return [];

  return root.map(rawDish => {
    if (!rawDish || typeof rawDish !== 'object') return null;
    const dish = {
      dishName: cleanString(rawDish.dishName),
      originalName: cleanString(rawDish.originalName) || cleanString(rawDish.dishName) || null,
      category: cleanString(rawDish.category),
      price: cleanString(rawDish.price),
      ingredients: Array.isArray(rawDish.ingredients) ? rawDish.ingredients.map(cleanIngredient) : [],
      dietaryType: DIETARY_TYPES.includes(rawDish.dietaryType) ? rawDish.dietaryType : 'other',
      dietaryExplanation: cleanString(rawDish.dietaryExplanation) || '',
      allergenSummary: cleanString(rawDish.allergenSummary) || '',
      nutritionEstimate: cleanNutrition(rawDish.nutritionEstimate),
      sourceImageUrl,
      extractionTimestamp: new Date().toISOString(),
      menuEffectiveDate: rawDish.menuEffectiveDate || null,
      actorRunId: process.env.APIFY_ACTOR_RUN_ID || 'local-dev',
      confidence: null,
      needsReview: false
    };

    const modelConf = clamp01(rawDish.confidence);
    const heuristic = heuristicConfidence(dish);
    dish.confidence = modelConf != null ? modelConf : heuristic;
    if (modelConf == null && dish.confidence === CONFIDENCE_HEURISTIC_DEFAULT) {
      dish.confidence = heuristic;
    }
    dish.confidence = Math.round(dish.confidence * 100) / 100;
    dish.needsReview = dish.confidence < REVIEW_THRESHOLD;

    return dish;
  }).filter(Boolean);
}

module.exports = { parseAndValidateDishes, heuristicConfidence, cleanAllergens, cleanNutrition };
