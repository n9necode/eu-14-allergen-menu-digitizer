'use strict';

const { describe, it } = require('node:test');
const assertNode = require('node:assert');
const { estimateNutrition } = require('../src/nutritionEstimator');

describe('nutritionEstimator', () => {
  it('sums known ingredients and returns nulls for unknown-only dishes', () => {
    const r = estimateNutrition([
      { englishName: 'rice', displayName: 'riso' },
      { englishName: 'olive oil', displayName: 'olio' }
    ]);
    assertNode.ok(r.calories > 100);
    assertNode.ok(r.proteinG > 0);
    assertNode.ok(r.carbsG > 0);
    assertNode.ok(r.fatG > 0);
  });

  it('unknown ingredients yield all-null estimate', () => {
    const r = estimateNutrition([
      { englishName: 'unobtainium spice', displayName: 'spezza' }
    ]);
    assertNode.deepStrictEqual(r, { calories: null, proteinG: null, fatG: null, carbsG: null });
  });

  it('empty input is all-null', () => {
    assertNode.deepStrictEqual(estimateNutrition([]), { calories: null, proteinG: null, fatG: null, carbsG: null });
  });
});