'use strict';

const { describe, it, assert } = require('node:test');
const assertNode = require('node:assert');
const { tagIngredients } = require('../src/allergenTagger');

describe('allergenTagger', () => {
  it('tags milk in mozzarella and gluten in pasta', () => {
    const ing = [
      { englishName: 'mozzarella', displayName: 'mozzarella' },
      { englishName: 'pasta', displayName: 'pasta' },
      { englishName: 'basil', displayName: 'basilico' }
    ];
    const out = tagIngredients(ing, 'Spaghetti', 'italian');
    assertNode.deepStrictEqual(out[0].eu14Allergens, [{ allergen: 'milk', confidence: 0.95 }]);
    assertNode.deepStrictEqual(out[1].eu14Allergens, [{ allergen: 'gluten', confidence: 0.95 }]);
    assertNode.deepStrictEqual(out[2].eu14Allergens, []);
  });

  it('applies cuisine-specific keywords (paneer -> milk, shoyu -> gluten+soy)', () => {
    const indian = tagIngredients([{ englishName: 'paneer', displayName: 'पनीर' }], 'Paneer Tikka', 'indian');
    assertNode.deepStrictEqual(indian[0].eu14Allergens, [{ allergen: 'milk', confidence: 0.95 }]);

    const japanese = tagIngredients([{ englishName: 'shoyu', displayName: 'しょうゆ' }], 'Teriyaki', 'japanese');
    const allergens = japanese[0].eu14Allergens.map(a => a.allergen).sort();
    assertNode.deepStrictEqual(allergens, ['gluten', 'soy']);
  });

  it('merges dish-level hints into sauce-like ingredients', () => {
    const caesar = tagIngredients(
      [{ englishName: 'dressing', displayName: 'dressing' }],
      'Caesar Salad', 'general'
    );
    assertNode.ok(caesar[0].eu14Allergens.some(a => a.allergen === 'eggs' && a.confidence > 0.5));

    // Atomic ingredient should NOT inherit dish hints
    const tiramisu = tagIngredients(
      [{ englishName: 'cocoa powder', displayName: 'cacao in polvere' }],
      'Tiramisu', 'italian'
    );
    assertNode.ok(!tiramisu[0].eu14Allergens.some(a => a.allergen === 'eggs'));
  });

  it('dedupes and caps confidence at 1.0', () => {
    const out = tagIngredients([{ englishName: 'wheat flour', displayName: 'farina di grano' }], 'Pasta', 'italian');
    assertNode.ok(out[0].eu14Allergens.every(a => a.confidence <= 1));
    assertNode.ok(out[0].eu14Allergens.every(a => ['gluten'].includes(a.allergen)));
  });
});