'use strict';

/**
 * Per-100g nutrition values (average, USDA-ish) plus a typical main-course
 * portion in grams. Menu text almost never states quantities, so estimates are
 * rough and flagged implicitly by the consumer; unknown ingredients contribute
 * nothing (their macros stay null if nothing matches).
 */
const DB = {
  // [key]: { per100g: {calories, proteinG, fatG, carbsG }, portionG }
  'wheat flour': { p: { c: 364, pr: 10, f: 1, cb: 76 }, por: 100 },
  bread: { p: { c: 265, pr: 9, f: 3, cb: 49 }, por: 60 },
  pasta: { p: { c: 371, pr: 13, f: 1.5, cb: 75 }, por: 100 },
  rice: { p: { c: 130, pr: 2.7, f: 0.3, cb: 28 }, por: 200 },
  potato: { p: { c: 77, pr: 2, f: 0.1, cb: 17 }, por: 150 },
  'sweet potato': { p: { c: 86, pr: 1.6, f: 0.1, cb: 20 }, por: 150 },
  'olive oil': { p: { c: 884, pr: 0, f: 100, cb: 0 }, por: 10 },
  butter: { p: { c: 717, pr: 0.9, f: 81, cb: 0.1 }, por: 10 },
  cheese: { p: { c: 403, pr: 25, f: 33, cb: 1.3 }, por: 30 },
  mozzarella: { p: { c: 280, pr: 28, f: 17, cb: 3 }, por: 40 },
  parmesan: { p: { c: 431, pr: 38, f: 29, cb: 4 }, por: 10 },
  milk: { p: { c: 42, pr: 3.4, f: 1, cb: 5 }, por: 200 },
  cream: { p: { c: 340, pr: 2.5, f: 35, cb: 5 }, por: 30 },
  yogurt: { p: { c: 60, pr: 3.5, f: 3.5, cb: 5 }, por: 100 },
  egg: { p: { c: 155, pr: 13, f: 11, cb: 1.1 }, por: 50 },
  'chicken breast': { p: { c: 165, pr: 31, f: 3.6, cb: 0 }, por: 120 },
  chicken: { p: { c: 239, pr: 27, f: 14, cb: 0 }, por: 120 },
  beef: { p: { c: 250, pr: 26, f: 17, cb: 0 }, por: 120 },
  'ground beef': { p: { c: 254, pr: 26, f: 17, cb: 0 }, por: 120 },
  pork: { p: { c: 242, pr: 27, f: 14, cb: 0 }, por: 120 },
  salmon: { p: { c: 206, pr: 22, f: 13, cb: 0 }, por: 100 },
  'tuna fish': { p: { c: 130, pr: 29, f: 1, cb: 0 }, por: 100 },
  fish: { p: { c: 125, pr: 22, f: 4, cb: 0 }, por: 100 },
  shrimp: { p: { c: 99, pr: 21, f: 0.3, cb: 0.2 }, por: 80 },
  'prawn': { p: { c: 99, pr: 21, f: 0.3, cb: 0.2 }, por: 80 },
  crab: { p: { c: 97, pr: 20, f: 1.5, cb: 0 }, por: 80 },
  mussels: { p: { c: 86, pr: 12, f: 2, cb: 4 }, por: 80 },
  clams: { p: { c: 86, pr: 12, f: 2, cb: 4 }, por: 80 },
  squid: { p: { c: 92, pr: 16, f: 1.4, cb: 3 }, por: 80 },
  tofu: { p: { c: 76, pr: 8, f: 4.8, cb: 2 }, por: 100 },
  tempeh: { p: { c: 193, pr: 19, f: 11, cb: 9 }, por: 100 },
  'soy sauce': { p: { c: 53, pr: 5, f: 0.6, cb: 5 }, por: 15 },
  almond: { p: { c: 579, pr: 21, f: 50, cb: 22 }, por: 20 },
  peanut: { p: { c: 567, pr: 26, f: 49, cb: 16 }, por: 20 },
  walnut: { p: { c: 654, pr: 15, f: 65, cb: 14 }, por: 20 },
  cashew: { p: { c: 553, pr: 18, f: 44, cb: 30 }, por: 20 },
  chickpea: { p: { c: 164, pr: 9, f: 3, cb: 27 }, por: 100 },
  lentil: { p: { c: 116, pr: 9, f: 0.4, cb: 20 }, por: 100 },
  'kidney bean': { p: { c: 127, pr: 9, f: 0.5, cb: 23 }, por: 100 },
  tomato: { p: { c: 18, pr: 0.9, f: 0.2, cb: 3.9 }, por: 100 },
  onion: { p: { c: 40, pr: 1.1, f: 0.1, cb: 9 }, por: 80 },
  garlic: { p: { c: 149, pr: 6, f: 0.5, cb: 33 }, por: 10 },
  carrot: { p: { c: 41, pr: 0.9, f: 0.2, cb: 10 }, por: 80 },
  spinach: { p: { c: 23, pr: 3, f: 0.4, cb: 4 }, por: 60 },
  mushroom: { p: { c: 22, pr: 3, f: 0.3, cb: 3 }, por: 80 },
  basil: { p: { c: 23, pr: 3, f: 0.6, cb: 3 }, por: 5 },
  parsley: { p: { c: 36, pr: 3, f: 0.8, cb: 6 }, por: 5 },
  'dark chocolate': { p: { c: 546, pr: 5, f: 31, cb: 61 }, por: 20 },
  sugar: { p: { c: 387, pr: 0, f: 0, cb: 100 }, por: 10 },
  honey: { p: { c: 304, pr: 0.3, f: 0, cb: 82 }, por: 15 },
  'ice cream': { p: { c: 207, pr: 3.5, f: 11, cb: 24 }, por: 80 },
  'mayonnaise': { p: { c: 680, pr: 1, f: 75, cb: 1 }, por: 15 },
  pizza: { p: { c: 266, pr: 11, f: 10, cb: 33 }, por: 200 },
  burger: { p: { c: 295, pr: 17, f: 14, cb: 24 }, por: 200 }
};

const KEYS = Object.keys(DB).sort((a, b) => b.length - a.length);

function match(text) {
  for (const key of KEYS) {
    if (text.includes(key)) return DB[key];
  }
  return null;
}

function round(n) { return n == null ? null : Math.round(n * 10) / 10; }

function estimateNutrition(ingredients) {
  let calories = 0, proteinG = 0, fatG = 0, carbsG = 0;
  let hits = 0;
  for (const ing of ingredients || []) {
    const text = ((ing.englishName || '') + ' ' + (ing.displayName || '')).toLowerCase();
    const entry = match(text);
    if (!entry) continue;
    const factor = entry.por / 100;
    calories += entry.p.c * factor;
    proteinG += entry.p.pr * factor;
    fatG += entry.p.f * factor;
    carbsG += entry.p.cb * factor;
    hits++;
  }
  if (hits === 0) {
    return { calories: null, proteinG: null, fatG: null, carbsG: null };
  }
  return {
    calories: round(calories),
    proteinG: round(proteinG),
    fatG: round(fatG),
    carbsG: round(carbsG)
  };
}

module.exports = { estimateNutrition, DB };