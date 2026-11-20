'use strict';

const fs = require('fs');
const path = require('path');

const CUISINE_MAPS_DIR = path.join(__dirname, 'cuisineMaps');

function loadMap(cuisine) {
  const filePath = path.join(CUISINE_MAPS_DIR, `${cuisine}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return { cuisine, allergenAliases: {}, rules: [], compoundDishes: [], exceptions: [] };
  }
}

const GENERAL = loadMap('general');

function getCuisineMap(cuisine) {
  if (!cuisine || cuisine === 'general') {
    return GENERAL;
  }
  const specific = loadMap(cuisine);
  return {
    cuisine: specific.cuisine || cuisine,
    allergenAliases: { ...GENERAL.allergenAliases, ...specific.allergenAliases },
    rules: [...GENERAL.rules, ...specific.rules],
    compoundDishes: [...GENERAL.compoundDishes, ...specific.compoundDishes],
    exceptions: [...GENERAL.exceptions, ...specific.exceptions]
  };
}

// Backward-compatible flat entries for existing tests
function expand(entries) {
  const out = [];
  for (const e of entries) {
    for (const kw of e.k) {
      out.push({ k: kw.trim().toLowerCase(), a: e.a, c: Math.max(0, Math.min(1, e.c)) });
    }
  }
  return out;
}

const SOURCES = {
  general: GENERAL.rules.map(r => ({ k: r.match[0], a: r.allergens[0], c: r.confidence })),
  italian: [],
  indian: [],
  japanese: [],
  mexican: []
};

const CUISINE_MAPS = {};
for (const cuisine of Object.keys(SOURCES)) {
  CUISINE_MAPS[cuisine] = expand(SOURCES[cuisine]);
}

function entriesForCuisine(cuisine) {
  return CUISINE_MAPS[cuisine] || CUISINE_MAPS.general;
}

module.exports = { getCuisineMap, loadMap, GENERAL, entriesForCuisine, CUISINE_MAPS };