# EU-14 Allergen Menu Digitizer

Apify Actor that accepts restaurant menu images/PDFs and returns structured JSON with dish names, prices, atomic ingredients, EU-14 (or US-9) allergen tags with confidence scores, dietary classification, and nutrition estimates.

## How it works

1. Downloads each menu URL (image or PDF).
2. Renders PDF pages to images with poppler-utils (`pdftoppm`).
3. Sends pages to Gemini (bring-your-own API key) with a structured-response schema.
4. Normalizes the response, applies cuisine-specific allergen keyword rules, classifies the dietary type, and estimates nutrition.
5. Pushes one record per dish to the dataset.

## Input

- `menuImageUrls` (required): array of URLs to menu images or PDFs.
- `geminiApiKey` (required, secret): the user's own Gemini API key (BYOK - you pay only for your own inference).
- `outputLanguage` (default "en"): language for translated dish names and ingredient display names.
- `sourceLanguageHint` (optional): helps when the menu is in a non-Latin script.
- `cuisineVertical` (default "general"): "italian" | "indian" | "japanese" | "mexican" | "general" - loads cuisine-specific allergen keyword overrides.
- `maxPagesPerPdf` (default 10): cap on PDF pages rendered.
- `jurisdiction` (default "EU"): "EU" (14 allergens, Regulation (EU) No 1169/2011) or "US-CA" (9 allergens).

## Output (one record per dish)

`dishName`, `originalName`, `category`, `price`, `ingredients` (each with `englishName`, `displayName`, and `eu14Allergens[{allergen, confidence}]`), `dietaryType` (vegan | vegetarian | pescetarian | other), `dietaryExplanation`, `allergenSummary`, `nutritionEstimate` ({calories, proteinG, fatG, carbsG}), `sourceImageUrl`, `confidence` (0-1), `needsReview` (true if confidence < 0.6).

## Local development

```bash
npm install
node --test tests/
# run locally with an INPUT.json file (see src/apifyShim.js)
```

## Project structure

```
actor.js                        # Apify entry point (orchestrates the pipeline)
src/                            # pipeline modules (downloader, pdfRenderer, geminiClient,
                                #   responseParser, allergenTagger, dietaryClassifier,
                                #   nutritionEstimator, config)
tests/                          # node:test suite
input_schema.json               # Apify input schema
output_schema.json              # Apify output schema
Dockerfile                      # Apify image build (Alpine + poppler-utils)
```
