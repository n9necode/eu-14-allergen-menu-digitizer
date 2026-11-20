'use strict';

const { getCuisineMap } = require('./cuisineMapsIndex');

/**
 * Generic words that usually denote a sauce/liquid/base component rather than
 * a single allergen-free ingredient. Dish-level allergen hints are only merged
 * into these kinds of ingredients (keeps suggestions precise, e.g. cocoa in
 * tiramisu does not get tagged with eggs).
 */
const SAUCE_LIKE = ['sauce', 'dressing', 'gravy', 'stock', 'broth', 'marinade',
  'batter', 'dough', 'crust', 'pastry', 'mayo', 'aioli', 'soup', 'bouillon',
  'fond', 'base', 'cream', 'sauce base', 'roux'];

/**
 * Dish-name-level allergen hints for classic dishes where the printed menu
 * rarely lists every allergen (e.g. "Tiramisu" implies eggs + milk).
 * Format: { pattern: substring (lowercase), tags: { allergen: confidence } }
 */
const DISH_HINTS = [
  { pattern: 'tiramisu', tags: { eggs: 0.85, milk: 0.85 } },
  { pattern: 'caesar', tags: { eggs: 0.7, milk: 0.6, fish: 0.55 } },
  { pattern: 'quiche', tags: { eggs: 0.9, milk: 0.7, gluten: 0.8 } },
  { pattern: 'carbonara', tags: { eggs: 0.9, milk: 0.7, gluten: 0.6 } },
  { pattern: 'béarnaise', tags: { eggs: 0.9, milk: 0.6 } },
  { pattern: 'bearnaise', tags: { eggs: 0.9, milk: 0.6 } },
  { pattern: 'hollandaise', tags: { eggs: 0.9, milk: 0.6 } },
  { pattern: 'bouillabaisse', tags: { fish: 0.9, molluscs: 0.6 } },
  { pattern: 'paella', tags: { crustaceans: 0.7, molluscs: 0.6, fish: 0.5 } },
  { pattern: 'gumbo', tags: { crustaceans: 0.6, gluten: 0.7 } },
  { pattern: 'tempura', tags: { gluten: 0.8, eggs: 0.5 } },
  { pattern: 'spring roll', tags: { gluten: 0.8 } },
  { pattern: 'samosa', tags: { gluten: 0.9 } },
  { pattern: 'hummus', tags: { sesame: 0.9 } },
  { pattern: 'baba ganoush', tags: { sesame: 0.8 } },
  { pattern: 'pesto', tags: { nuts: 0.9, milk: 0.7 } },
  { pattern: 'satay', tags: { peanuts: 0.9 } },
  { pattern: 'pad thai', tags: { peanuts: 0.8, eggs: 0.7, fish: 0.6 } },
  { pattern: 'tom yum', tags: { crustaceans: 0.8, fish: 0.4 } }
];

function normalize(text) {
  return ' ' + (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
}

function matches(text, kw) {
  return text.includes(' ' + kw + ' ');
}

function matchKeywords(text, matchList) {
  for (const kw of matchList) {
    if (matches(text, kw)) return true;
  }
  return false;
}

function isSauceLike(ing) {
  const t = normalize(ing.englishName) + normalize(ing.displayName);
  return SAUCE_LIKE.some(s => matches(t, s));
}

function applyRules(text, rules) {
  const tags = {};
  for (const rule of rules) {
    if (matchKeywords(text, rule.match)) {
      for (const allergen of rule.allergens) {
        if (tags[allergen] === undefined || rule.confidence > tags[allergen]) {
          tags[allergen] = rule.confidence;
        }
      }
    }
  }
  return tags;
}

/**
 * Apply exceptions to tags: can lower confidence but never raise it.
 * If an allergen is not yet tagged, the exception can add it at its cap.
 */
function applyExceptions(text, tags, exceptions) {
  for (const exc of exceptions) {
    if (matchKeywords(text, exc.match)) {
      for (const allergen of exc.allergens) {
        if (tags[allergen] !== undefined) {
          tags[allergen] = Math.min(tags[allergen], exc.confidence);
        } else {
          tags[allergen] = exc.confidence;
        }
      }
    }
  }
  return tags;
}

function tagIngredients(ingredients, dishName, cuisine) {
  const map = getCuisineMap(cuisine);
  const dishText = normalize(dishName);

  // Dish-level compound dishes (matched against dishName)
  const dishCompoundTags = applyRules(dishText, map.compoundDishes);

  for (const ing of ingredients) {
    const ingText = normalize(ing.englishName || '') + normalize(ing.displayName || '');

    // 1. general.json rules + italian.json rules applied to ingredient text
    let tags = applyRules(ingText, map.rules);

    // 2. compound dishes applied to ingredient text (only for sauce-like ingredients)
    if (Object.keys(dishCompoundTags).length && isSauceLike(ing)) {
      for (const [a, c] of Object.entries(dishCompoundTags)) {
        if (tags[a] === undefined || c > tags[a]) {
          tags[a] = c;
        }
      }
    }

    // 3. exceptions applied last (can lower confidence, never raise)
    tags = applyExceptions(ingText, tags, map.exceptions);

    ing.eu14Allergens = Object.entries(tags)
      .map(([allergen, confidence]) => ({ allergen, confidence: Math.round(confidence * 100) / 100 }))
      .sort((a, b) => b.confidence - a.confidence || a.allergen.localeCompare(b.allergen));
  }
  return ingredients;
}

function tag(dishName, cuisine) {
  const map = getCuisineMap(cuisine);
  const dishText = normalize(dishName);

  let tags = applyRules(dishText, map.compoundDishes);

  const ruleTags = applyRules(dishText, map.rules);
  for (const [a, c] of Object.entries(ruleTags)) {
    if (tags[a] === undefined || c > tags[a]) {
      tags[a] = c;
    }
  }

  tags = applyExceptions(dishText, tags, map.exceptions);

  return Object.entries(tags)
    .map(([allergen, confidence]) => `${allergen}:${Math.round(confidence * 100) / 100}`)
    .sort();
}

module.exports = { tag, tagIngredients, DISH_HINTS, SAUCE_LIKE, getCuisineMap };