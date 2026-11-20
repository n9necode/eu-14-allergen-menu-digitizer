'use strict';

const { describe, it } = require('node:test');
const assertNode = require('node:assert');
const { classifyDietary } = require('../src/dietaryClassifier');

function dish(ings, extras = {}) {
  return { ingredients: ings.map(i => ({ englishName: i.name, eu14Allergens: i.allergens || [] })), ...extras };
}

describe('dietaryClassifier', () => {
  it('vegan when no animal allergens', () => {
    const d = dish([{ name: 'tofu', allergens: [] }, { name: 'bok choy', allergens: [] }]);
    assertNode.strictEqual(classifyDietary(d).dietaryType, 'vegan');
  });

  it('vegetarian when milk/eggs only', () => {
    const d = dish([{ name: 'ricotta', allergens: [{ allergen: 'milk', confidence: 0.95 }] }]);
    const r = classifyDietary(d);
    assertNode.strictEqual(r.dietaryType, 'vegetarian');
    assertNode.ok(r.dietaryExplanation.includes('dairy'));
  });

  it('pescetarian when fish only', () => {
    const d = dish([{ name: 'salmon', allergens: [{ allergen: 'fish', confidence: 0.95 }] }]);
    assertNode.strictEqual(classifyDietary(d).dietaryType, 'pescetarian');
  });

  it('other when meat', () => {
    const d = dish([{ name: 'beef', allergens: [] }], { originalName: 'Beef Stew' });
    assertNode.strictEqual(classifyDietary(d).dietaryType, 'other');
  });

  it('menu vegan signal wins', () => {
    const d = dish([{ name: 'tomato', allergens: [] }], { originalName: 'Vegan Tomato Soup' });
    assertNode.strictEqual(classifyDietary(d).dietaryType, 'vegan');
  });
});