'use strict';

/**
 * EU-14 allergens per Regulation (EU) No 1169/2011, Annex II.
 * Canonical keys used throughout the Actor and in output records.
 */
const EU14_ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs'
];

const EU14_LABELS = {
  gluten: 'Cereals containing gluten',
  crustaceans: 'Crustaceans',
  eggs: 'Eggs',
  fish: 'Fish',
  peanuts: 'Peanuts',
  soy: 'Soybeans',
  milk: 'Milk',
  nuts: 'Tree nuts',
  celery: 'Celery',
  mustard: 'Mustard',
  sesame: 'Sesame seeds',
  sulphites: 'Sulphur dioxide / sulphites',
  lupin: 'Lupin',
  molluscs: 'Molluscs'
};

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_OUTPUT_LANGUAGE = 'en';
const DEFAULT_MAX_PAGES_PER_PDF = 10;
const REVIEW_THRESHOLD = 0.6;
const CONFIDENCE_HEURISTIC_DEFAULT = 0.75;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']);
const PDF_EXTENSIONS = new Set(['.pdf']);

const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf'
};

const DIETARY_TYPES = ['vegan', 'vegetarian', 'pescetarian', 'other'];

module.exports = {
  EU14_ALLERGENS,
  EU14_LABELS,
  DEFAULT_MODEL,
  DEFAULT_OUTPUT_LANGUAGE,
  DEFAULT_MAX_PAGES_PER_PDF,
  REVIEW_THRESHOLD,
  CONFIDENCE_HEURISTIC_DEFAULT,
  IMAGE_EXTENSIONS,
  PDF_EXTENSIONS,
  MIME_BY_EXTENSION,
  DIETARY_TYPES
};