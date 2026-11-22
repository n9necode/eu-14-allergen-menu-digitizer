'use strict';

const { describe, it } = require('node:test');
const assertNode = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

describe('EU-14 Allergen Menu Digitizer', () => {
    describe('input schema validation', () => {
        it('requires menuImageUrls and geminiApiKey', () => {
            const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'input_schema.json'), 'utf8'));
            assertNode.strictEqual(schema.schemaVersion, 1);
            assertNode.ok(schema.required.includes('menuImageUrls'));
            assertNode.ok(schema.required.includes('geminiApiKey'));
            assertNode.strictEqual(schema.properties.menuImageUrls.type, 'array');
            assertNode.strictEqual(schema.properties.menuImageUrls.items.type, 'string');
        });
    });

    describe('output schema validation', () => {
        it('exposes structured dish record fields', () => {
            const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'output_schema.json'), 'utf8'));
            assertNode.strictEqual(schema.schemaVersion, 1);
            const fields = ['dishName', 'originalName', 'category', 'price', 'ingredients', 'dietaryType',
                'dietaryExplanation', 'allergenSummary', 'nutritionEstimate', 'sourceImageUrl', 'confidence', 'needsReview'];
            for (const field of fields) {
                assertNode.ok(schema.properties[field], `missing output property: ${field}`);
            }
        });
    });
});
