'use strict';

/**
 * EU-14 Allergen Menu Digitizer - Apify Actor entry point.
 *
 * Pipeline: download -> (PDF render | image normalize) -> Gemini extraction
 * -> response normalization -> cuisine keyword tagging -> dietary classification
 * -> nutrition estimation -> dataset.
 */

const { Actor } = require('apify');

const { downloadFile } = require('./src/downloader');
const { renderPdfPages } = require('./src/pdfRenderer');
const { normalizeImage } = require('./src/imageNormalizer');
const { extractDishes } = require('./src/geminiClient');
const { parseAndValidateDishes } = require('./src/responseParser');
const { classifyDietary } = require('./src/dietaryClassifier');
const { estimateNutrition } = require('./src/nutritionEstimator');
const { tagIngredients } = require('./src/allergenTagger');
const {
    DEFAULT_OUTPUT_LANGUAGE,
    DEFAULT_MAX_PAGES_PER_PDF,
} = require('./src/config');

(async () => {
    await Actor.init();
    try {
        const input = (await Actor.getInput()) || {};
        const menuImageUrls = Array.isArray(input.menuImageUrls) ? input.menuImageUrls : [];
        const geminiApiKey = input.geminiApiKey || process.env.GEMINI_API_KEY;
        const outputLanguage = input.outputLanguage || DEFAULT_OUTPUT_LANGUAGE;
        const sourceLanguageHint = input.sourceLanguageHint || '';
        const cuisineVertical = input.cuisineVertical || 'general';
        const maxPagesPerPdf = Number.isFinite(input.maxPagesPerPdf)
            ? input.maxPagesPerPdf
            : DEFAULT_MAX_PAGES_PER_PDF;
        const jurisdiction = input.jurisdiction || 'EU';

        if (menuImageUrls.length === 0 || !geminiApiKey) {
            await Actor.fail('Missing required input: menuImageUrls (non-empty array) and geminiApiKey.');
            return;
        }

        const allRecords = [];

        for (const url of menuImageUrls) {
            console.log(`Processing: ${url}`);
            try {
                // 1. Download the menu (image or PDF).
                const { buffer, mime, ext } = await downloadFile(url);

                // 2. Prepare pages for Gemini.
                let images = [];
                if (ext === '.pdf' || mime === 'application/pdf') {
                    images = await renderPdfPages(buffer, maxPagesPerPdf);
                    if (images.length === 0) {
                        // pdftoppm unavailable: send the raw PDF to Gemini directly.
                        images = [{ buffer, mime: 'application/pdf' }];
                    }
                } else {
                    images = [await normalizeImage(buffer, mime)];
                }

                // 3. Ask Gemini to extract dishes.
                const raw = await extractDishes({
                    geminiApiKey,
                    images,
                    outputLanguage,
                    sourceLanguageHint,
                    jurisdiction,
                });

                // 4. Normalize and enrich each dish record.
                const dishes = parseAndValidateDishes(raw, url);
                for (const dish of dishes) {
                    dish.ingredients = tagIngredients(
                        dish.ingredients,
                        dish.dishName || dish.originalName || '',
                        cuisineVertical
                    );
                    const diet = classifyDietary(dish);
                    dish.dietaryType = diet.dietaryType;
                    dish.dietaryExplanation = dish.dietaryExplanation || diet.dietaryExplanation;
                    dish.nutritionEstimate = estimateNutrition(dish.ingredients);
                    if (!dish.allergenSummary) {
                        const tags = dish.ingredients.flatMap((i) => (i.eu14Allergens || []).map((a) => a.allergen));
                        dish.allergenSummary = [...new Set(tags)].join(', ');
                    }
                    allRecords.push(dish);
                }
            } catch (err) {
                console.error(`Error processing ${url}: ${err && err.message ? err.message : err}`);
            }
        }

        await Actor.pushData(allRecords);
        console.log(`Done. Extracted ${allRecords.length} dish record(s) from ${menuImageUrls.length} source(s).`);
    } catch (err) {
        console.error('Fatal error:', err);
        await Actor.fail(err && err.message ? err.message : String(err));
    } finally {
        await Actor.exit();
    }
})();
