'use strict';

const MEAT_KEYWORDS = ['beef','pork','lamb','veal','venison','chicken','turkey','duck','goose',
  'meat','bacon','ham','salami','pepperoni','chorizo','sausage','prosciutto','pancetta','guanciale',
  'steak','mince','ground beef','mutton','kidney','liver','offal','poultry','hen','meatball'];

const VEGAN_SIGNAL = ['vegan','plant-based','plant based','100% plant','no animal','dairy-free','egg-free'];
const VEGETARIAN_SIGNAL = ['vegetarian','veggie','lacto-ovo','lacto','ovo','suitable for vegetarians'];

function textOf(dish) {
  const ingText = ((dish.ingredients || []).map(i => (i.englishName || '') + ' ' + (i.displayName || '')).join(' '));
  return [ingText, dish.originalName || '', dish.dishName || '', dish.dietaryExplanation || ''].join(' ').toLowerCase();
}

function allergenTags(dish) {
  return new Set((dish.ingredients || []).flatMap(i => (i.eu14Allergens || []).map(a => a.allergen)));
}

function classifyDietary(dish) {
  const text = textOf(dish);
  const tags = allergenTags(dish);

  const hasMeat = MEAT_KEYWORDS.some(k => text.includes(k));
  const hasFish = tags.has('fish');
  const hasShellfish = tags.has('crustaceans') || tags.has('molluscs');
  const hasEggs = tags.has('eggs');
  const hasMilk = tags.has('milk');
  const hasHoney = text.includes('honey');

  let type = 'other';
  let explanation = 'Contains meat or poultry, so it is not suitable for vegetarians.';

  if (hasMeat) {
    type = 'other';
  } else if (hasFish || hasShellfish) {
    type = 'pescetarian';
    explanation = 'Contains fish or seafood but no land meat; suitable for pescetarians.';
  } else if (hasEggs || hasMilk || hasHoney) {
    type = 'vegetarian';
    explanation = 'Free of meat and fish; contains dairy and/or egg-derived ingredients.';
  } else {
    type = 'vegan';
    explanation = 'No animal-derived ingredients detected.';
  }

  if (VEGAN_SIGNAL.some(s => text.includes(s)) && !hasMeat && !hasFish && !hasShellfish && !hasEggs && !hasMilk && !hasHoney) {
    type = 'vegan';
    explanation = 'Marked vegan on the menu and no animal-derived ingredients detected.';
  } else if (VEGETARIAN_SIGNAL.some(s => text.includes(s)) && !hasMeat && !hasFish && !hasShellfish) {
    type = 'vegetarian';
    explanation = 'Marked vegetarian on the menu and no meat or fish detected.';
  }

  return { dietaryType: type, dietaryExplanation: explanation };
}

module.exports = { classifyDietary, MEAT_KEYWORDS };