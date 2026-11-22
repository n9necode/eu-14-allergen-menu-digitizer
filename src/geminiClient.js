'use strict';

const https = require('https');
const { DEFAULT_MODEL } = require('./config');

const EU14_LIST = 'gluten, crustaceans, eggs, fish, peanuts, soy, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs';
const US9_LIST = 'milk, eggs, fish, crustacean shellfish, tree nuts, peanuts, wheat, soy, sesame';

const RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        dishes: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    dishName: { type: 'string' },
                    originalName: { type: 'string' },
                    category: { type: 'string' },
                    price: { type: 'string' },
                    ingredients: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                englishName: { type: 'string' },
                                displayName: { type: 'string' },
                                eu14Allergens: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            allergen: { type: 'string' },
                                            confidence: { type: 'number' },
                                        },
                                        required: ['allergen', 'confidence'],
                                    },
                                },
                            },
                            required: ['englishName', 'displayName', 'eu14Allergens'],
                        },
                    },
                    dietaryType: { type: 'string' },
                    dietaryExplanation: { type: 'string' },
                    allergenSummary: { type: 'string' },
                    nutritionEstimate: {
                        type: 'object',
                        properties: {
                            calories: { type: 'number' },
                            proteinG: { type: 'number' },
                            fatG: { type: 'number' },
                            carbsG: { type: 'number' },
                        },
                    },
                    sourceImageUrl: { type: 'string' },
                    confidence: { type: 'number' },
                    needsReview: { type: 'boolean' },
                    menuEffectiveDate: { type: 'string' },
                },
                required: ['dishName', 'originalName', 'ingredients', 'dietaryType', 'dietaryExplanation', 'allergenSummary', 'nutritionEstimate', 'sourceImageUrl', 'confidence', 'needsReview'],
            },
        },
    },
    required: ['dishes'],
};

// Try these models in order; the first one that answers wins.
const MODEL_CANDIDATES = [DEFAULT_MODEL, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

function buildSystemInstruction(opts) {
    const framework = (opts.jurisdiction || 'EU') === 'US-CA'
        ? 'US-9 (US/California)'
        : 'EU-14 (Regulation (EU) No 1169/2011)';
    const allergens = (opts.jurisdiction || 'EU') === 'US-CA' ? US9_LIST : EU14_LIST;
    const lang = opts.outputLanguage || 'en';
    const hint = opts.sourceLanguageHint
        ? ` The menu may be written in ${opts.sourceLanguageHint}; translate dish names and ingredient display names to ${lang}.`
        : ` Translate dish names and ingredient display names to ${lang}.`;
    return 'You are an expert allergen extraction AI for restaurant menus.'
        + ` Apply the ${framework} allergen framework: ${allergens}.`
        + ' Extract EVERY SINGLE DISH listed on the menu. Do not skip dishes. Do not invent dishes.'
        + " For each dish return JSON with a 'dishes' array containing:"
        + ' - dishName (translated), originalName (as printed), category (string or null), price (string or null with currency symbol),'
        + ' - ingredients: array of {englishName, displayName, eu14Allergens: [{allergen, confidence 0-1}]},'
        + " - dietaryType: 'vegan'|'vegetarian'|'pescetarian'|'other',"
        + ' - dietaryExplanation, allergenSummary, nutritionEstimate: {calories, proteinG, fatG, carbsG} (numbers or null),'
        + ' - confidence (0-1 overall extraction confidence), needsReview (true if confidence < 0.6).'
        + ' If an allergen is likely but not certain, assign a confidence below 0.8.'
        + " Scan the menu for a validity date (e.g. 'Summer 2026') and add a top-level 'menuEffectiveDate' string, or null."
        + hint;
}

function callApi(key, contents, model, systemInstruction) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            contents: [{ parts: contents }],
            generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
            systemInstruction: { parts: [{ text: systemInstruction }] },
        });
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        };
        const req = https.request(options, (res) => {
            let buf = '';
            res.on('data', (c) => { buf += c; });
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    console.error(`[gemini] HTTP ${res.statusCode} for model ${model}: ${buf.slice(0, 300)}`);
                    reject(new Error(`Gemini API error ${res.statusCode} (${model})`));
                    return;
                }
                try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error(`Invalid JSON from Gemini (${model})`)); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function callWithBackoff(key, contents, model, systemInstruction, attempt = 0) {
    try {
        return await callApi(key, contents, model, systemInstruction);
    } catch (err) {
        const msg = err && err.message ? err.message : '';
        const retriable = /429|5\d\d|transient|ECONNRESET|ETIMEDOUT|timeout/i.test(msg);
        if (retriable && attempt < 4) {
            await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt + Math.random() * 1000));
            return callWithBackoff(key, contents, model, systemInstruction, attempt + 1);
        }
        throw err;
    }
}

function textOf(resp) {
    const c = resp && resp.candidates && resp.candidates[0];
    const parts = c && c.content && c.content.parts;
    return (parts && parts[0] && parts[0].text) || '';
}

async function generateOnce(key, contents, model, systemInstruction) {
    const resp = await callWithBackoff(key, contents, model, systemInstruction);
    const text = textOf(resp);
    if (!text) throw new Error(`Empty response from Gemini (${model})`);
    try { return JSON.parse(text); } catch (e) { throw new Error(`JSON parse failed (${model})`); }
}

async function extractDishes(opts) {
    opts = opts || {};
    if (!opts.geminiApiKey) throw new Error('geminiApiKey is required');
    const images = opts.images || [];
    if (images.length === 0) throw new Error('No images/pages to process');

    const contents = images.map((i) => {
        if (i.inlineData) return { inlineData: { data: i.inlineData.data, mimeType: i.inlineData.mimeType } };
        if (i.buffer) return { inlineData: { data: i.buffer.toString('base64'), mimeType: i.mimeType || 'image/jpeg' } };
        if (i.url) return { fileData: { fileUri: i.url } };
        throw new Error('Unsupported image entry');
    });

    const systemInstruction = buildSystemInstruction(opts);

    let lastErr = null;
    for (const model of MODEL_CANDIDATES) {
        try {
            const parsed = await generateOnce(opts.geminiApiKey, contents, model, systemInstruction);
            console.log(`[gemini] Used model: ${model}`);
            const dishArr = Array.isArray(parsed) ? parsed : (parsed.dishes || []);
            return {
                dishes: dishArr.map((d) => ({
                    dishName: d.dishName || '',
                    originalName: d.originalName || d.dishName || '',
                    category: d.category || null,
                    price: d.price || null,
                    ingredients: (d.ingredients || []).map((g) => ({
                        englishName: g.englishName || '',
                        displayName: g.displayName || g.englishName || '',
                        eu14Allergens: Array.isArray(g.eu14Allergens)
                            ? g.eu14Allergens.map((a) => ({ allergen: a.allergen, confidence: typeof a.confidence === 'number' ? a.confidence : 0.8 }))
                            : [],
                    })),
                    dietaryType: d.dietaryType || 'other',
                    dietaryExplanation: d.dietaryExplanation || '',
                    allergenSummary: d.allergenSummary || '',
                    nutritionEstimate: d.nutritionEstimate || { calories: null, proteinG: null, fatG: null, carbsG: null },
                    sourceImageUrl: d.sourceImageUrl || '',
                    confidence: typeof d.confidence === 'number' ? d.confidence : 0.8,
                    needsReview: typeof d.confidence === 'number' ? d.confidence < 0.6 : true,
                    menuEffectiveDate: d.menuEffectiveDate || null,
                })),
                menuEffectiveDate: parsed.menuEffectiveDate || null,
            };
        } catch (err) {
            lastErr = err;
            console.warn(`[gemini] Model ${model} failed: ${err.message}`);
        }
    }
    throw lastErr || new Error('All Gemini models failed');
}

module.exports = { extractDishes, buildSystemInstruction, MODEL_CANDIDATES };
