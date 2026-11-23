# EU-14 Allergen Menu Scraper & Compliance Extractor

Extract EU-14 allergens, ingredients, and prices from any restaurant menu - images and PDFs, in any cuisine. This Actor generates audit-ready JSON with timestamps. Bring Your Own Key (BYOK) for zero inference markups.

## What is the EU-14 Allergen Menu Scraper?
This AI-powered Actor digitizes restaurant menus in any language and any cuisine, and extracts the 14 EU allergens (or 9 US allergens) automatically. It is designed for food-tech developers, restaurant chains, and compliance auditors who need structured, legally defensible menu data.

## How to Extract Allergens from Restaurant Menus
1. Provide the URL to your menu image or PDF.
2. Paste your Gemini API key.
3. Select your jurisdiction (`EU` for 14 allergens, or `US-CA` for 9).
4. Run the Actor and download your JSON dataset.

## Any Cuisine, Any Menu
The Actor works on menus from every cuisine - Italian, Indian, Japanese, Mexican, and everything in between. By default it runs general multi-cuisine extraction, and a built-in cuisine keyword engine (general + Italian + Indian + Japanese + Mexican) boosts confidence beyond what the vision AI reads alone.

## EU-14 vs. US-9 Allergen Compliance
The Actor supports two frameworks. The **EU framework** covers the 14 allergens mandated by EU Regulation 1169/2011. The **US-CA framework** covers the 9 major allergens mandated by California SB 68 (effective July 2026), including sesame.

## How to Automate California SB 68 Menu Audits
If you operate restaurant chains in California with 20+ locations, you can use this Actor to automatically audit your digital menus for the 9 major allergens. The output includes a `jurisdiction` field and `extractionTimestamp` for legal provenance.

## Supported Inputs: Menu Images, PDFs, and URLs
The Actor accepts standard image formats (JPG, PNG, WEBP) and PDF menus. It uses `poppler-utils` for PDF rendering and advanced Vision AI for OCR extraction.

## Output Format: Structured JSON with Allergen Confidence Scores
Every dish is returned as a JSON object containing `dishName`, `price`, `ingredients`, `eu14Allergens` (with confidence scores), `dietaryType`, and `nutritionEstimate`. Records with a confidence score below 0.6 are flagged with `needsReview: true`.

## Multi-Cuisine Allergen Keyword Engine
The Actor ships with cuisine-specific allergen keyword overrides for general, Italian, Indian, Japanese, and Mexican menus. This layering flags ingredients the vision model might miss - like semolina (gluten), ghee (milk), and sesame (sesame) - with confidence scores. The Italian vertical is the deepest (131 ingredient rules + 15 compound-dish rules + 7 exceptions), but it is an optional override on top of the default general multi-cuisine engine.

## Pricing
This Actor uses a Bring-Your-Own-Key (BYOK) model. You pay Apify only for compute time, and you pay your AI provider directly for API usage. There are no inference markups.
