import { Actor } from 'apify';
import { PdfParse } from 'pdf-parse';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

await Actor.init();

const input = await Actor.getInput();
const {
    menuImageUrls,
    geminiApiKey,
    outputLanguage = 'en',
    sourceLanguageHint,
    cuisineVertical = 'general',
    maxPagesPerPdf = 10,
    jurisdiction = 'EU'
} = input;

if (!menuImageUrls || !geminiApiKey) {
    await Actor.fail('Missing required input: menuImageUrls or geminiApiKey');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const allergenMap = {
    'EU': ['gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphur dioxide', 'lupin', 'molluscs'],
    'US-CA': ['milk', 'eggs', 'fish', 'crustacean shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans', 'sesame']
};

const results = [];

for (const url of menuImageUrls) {
    console.log(`Processing: ${url}`);
    try {
        // Simple logic for illustration - in real scenario, we'd fetch image/PDF and pass to Gemini
        const prompt = `Extract dishes from this menu. Jurisdiction: ${jurisdiction}. Output Language: ${outputLanguage}. Cuisine: ${cuisineVertical}. Return JSON matching the output schema.`;
        
        // Mocking extraction for now
        results.push({
            dishName: "Sample Dish",
            originalName: "Sample Dish",
            category: "Main",
            price: "€15.00",
            ingredients: [
                {
                    englishName: "Bread",
                    displayName: "Bread",
                    eu14Allergens: [{ allergen: "gluten", confidence: 0.99 }]
                }
            ],
            dietaryType: "vegetarian",
            dietaryExplanation: "Contains no meat.",
            allergenSummary: "Contains gluten",
            nutritionEstimate: {
                calories: 300,
                proteinG: 10,
                fatG: 5,
                carbsG: 50
            },
            sourceImageUrl: url,
            confidence: 0.95,
            needsReview: false
        });
    } catch (error) {
        console.error(`Error processing ${url}: ${error.message}`);
    }
}

await Actor.pushData(results);
await Actor.exit();