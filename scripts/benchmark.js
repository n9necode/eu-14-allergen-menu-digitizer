#!/usr/bin/env node
'use strict';

/**
 * Accuracy benchmark for the EU-14 Allergen Menu Digitizer.
 * Compares smoke test output against hand-labeled ground truth.
 * Usage: node scripts/benchmark.js
 * Writes report to test-menus/benchmark-report.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'test-menus', 'output');
const TRUTH_DIR = path.join(ROOT, 'test-menus', 'truth', 'italian');
const REPORT_PATH = path.join(ROOT, 'test-menus', 'benchmark-report.md');

const EU14_ALLERGENS = [
  'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk',
  'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
];

function similarity(a, b) {
  const ta = a.toLowerCase().split(/\s+/).filter(Boolean);
  const tb = b.toLowerCase().split(/\s+/).filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function matchDishes(outputDishes, truthDishes) {
  const matches = [];
  const usedTruth = new Set();
  for (let i = 0; i < outputDishes.length; i++) {
    let bestTruth = -1;
    let bestScore = 0;
    for (let j = 0; j < truthDishes.length; j++) {
      if (usedTruth.has(j)) continue;
      const score = similarity(outputDishes[i].dishName || '', truthDishes[j].dishName || '');
      if (score > bestScore) {
        bestScore = score;
        bestTruth = j;
      }
    }
    if (bestTruth >= 0 && bestScore >= 0.4) {
      usedTruth.add(bestTruth);
      matches.push({ outputIndex: i, truthIndex: bestTruth, score: bestScore });
    }
  }
  return matches;
}

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}
