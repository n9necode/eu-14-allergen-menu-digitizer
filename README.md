# EU-14 Allergen Menu Digitizer

Apify Actor that accepts restaurant menu images/PDFs and returns structured JSON with dish names, prices, EU-14 allergen tags, dietary classification, and nutrition estimates.

## Input Schema
- `menuImageUrls`: array of strings (URLs to menu images or PDFs). Required.
- `geminiApiKey`: string, secret. Required. The user's own Gemini API key.
- `outputLanguage`: string, default "en". Language for translated dish names and ingredient display names.
- `sourceLanguageHint`: optional string. Helps when the menu is in a non-Latin script.
- `cuisineVertical`: optional enum ("italian", "indian", "japanese", "mexican", "general"). Loads a cuisine-specific allergen keyword override map.
- `maxPagesPerPdf`: integer, default 10. Cap on PDF pages rendered.

## Output Schema (one record per dish)
```json
{
  "dishName": "string (translated)",
  "originalName": "string (as printed)",
  "category": "string | null",
  "price": "string | null (with currency symbol)",
  "ingredients": [
    {
      "englishName": "string",
      "displayName": "string (in outputLanguage)",
      "eu14Allergens": [
        { "allergen": "gluten", "confidence": 0.95 }
      ]
    }
  ],
  "dietaryType": "vegan | vegetarian | pescetarian | other",
  "dietaryExplanation": "string",
  "allergenSummary": "string (human-readable, e.g. 'Contains gluten, milk')",
  "nutritionEstimate": {
    "calories": "number | null",
    "proteinG": "number | null",
    "fatG": "number | null",
    "carbsG": "number | null"
  },
  "sourceImageUrl": "string",
  "confidence": "number (0-1) overall extraction confidence",
  "needsReview": "boolean (true if confidence < 0.6)"
}
```

## Project Structure

```
├── apify.json          # Apify Actor configuration
├── input_schema.json   # Input schema definition
├── output_schema.json  # Output schema definition
├── main.js             # Main actor entry point
├── .gitignore          # Git ignore file (prevents committing .env, node_modules)
└── README.md           # This file
```
