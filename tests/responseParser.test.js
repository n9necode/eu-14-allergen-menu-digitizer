'use strict';

const { describe, it } = require('node:test');
const assertNode = require('node:assert');
const { parseAndValidateDishes, heuristicConfidence } = require('../src/responseParser');

describe('responseParser', () => {
  it('normalizes a full dish record', () => {
    const raw = {
      dishes: [{
        dishName: 'Pizza Margherita',
        originalName: 'Pizza Margherita',
        category: 'Pizze',
        price: '10,00 €',
        ingredients: [
          { englishName: 'mozzarella', displayName: 'mozzarella', eu14Allergens: [{ allergen: 'milk', confidence: 0.95 }] },
          { englishName: 'tomato', displayName: 'pomodoro', eu14Allergens: [] }
        ],
        dietaryType: 'vegetarian',
        dietaryExplanation: 'No meat or fish.',
        allergenSummary: 'Contains milk, gluten',
        nutritionEstimate: { calories: 280, proteinG: 12, fatG: 10, carbsG: 34 },
        confidence: 0.91,
        needsReview: false
      }]
    };
    const [d] = parseAndValidateDishes(raw, 'http://example.com/m.pdf');
    assertNode.strictEqual(d.dishName, 'Pizza Margherita');
    assertNode.strictEqual(d.sourceImageUrl, 'http://example.com/m.pdf');
    assertNode.strictEqual(d.confidence, 0.91);
    assertNode.strictEqual(d.needsReview, false);
    assertNode.deepStrictEqual(d.nutritionEstimate, { calories: 280, proteinG: 12, fatG: 10, carbsG: 34 });
  });

  it('flags low confidence and filters non-EU14 allergens', () => {
    const raw = {
      dishes: [{
        ingredients: [{ englishName: 'sesame', displayName: 'sésame', eu14Allergens: [{ allergen: 'sesame', confidence: 0.9 }, { allergen: 'garlic', confidence: 0.9 }] }]
      }]
    };
    const [d] = parseAndValidateDishes(raw, 'http://example.com');
    assertNode.deepStrictEqual(d.ingredients[0].eu14Allergens, [{ allergen: 'sesame', confidence: 0.9 }]);
    assertNode.strictEqual(d.dishName, null);
    assertNode.strictEqual(d.confidence, 0.4);
    assertNode.strictEqual(d.needsReview, true);
  });

  it('heuristic confidence drops without ingredients', () => {
    assertNode.ok(heuristicConfidence({ dishName: 'A', ingredients: [], price: '5 €', allergenSummary: 'x' }) < 0.6);
    assertNode.ok(heuristicConfidence({ dishName: 'A', ingredients: [{ englishName: 'x' }], price: '5 €', allergenSummary: 'x' }) >= 0.6);
  });

  it('verifies extractionTimestamp and actorRunId fields', () => {
    const raw = {
      dishes: [
        {
          dishName: 'Test Dish',
          originalName: 'Test Dish',
          menuEffectiveDate: 'Summer 2026',
          extractionTimestamp: '2026-01-15T10:30:00.000Z',
          actorRunId: 'test-run-123',
        },
      ],
    };
    const [d] = parseAndValidateDishes(raw, 'http://example.com/m.pdf');
    assertNode.ok(d.extractionTimestamp, 'extractionTimestamp should be present');
    assertNode.strictEqual(typeof d.extractionTimestamp, 'string', 'extractionTimestamp should be a string');
    assertNode.strictEqual(d.extractionTimestamp.length > 0, true, 'extractionTimestamp should not be empty');
    // actorRunId defaults to 'local-dev' when APIFY_ACTOR_RUN_ID is not set,
    // and takes the platform run id when it is set.
    assertNode.ok(d.actorRunId && typeof d.actorRunId === 'string' && d.actorRunId.length > 0, 'actorRunId should be a non-empty string');
  });
});
