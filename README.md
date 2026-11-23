# EU-14 Allergen Menu Scraper & Compliance Extractor

Extract EU-14 allergens, ingredients, and prices from menu images and PDFs. This Actor generates audit-ready JSON with timestamps. Bring Your Own Key (BYOK) for zero inference markups.

## What is the EU-14 Allergen Menu Scraper?
This AI-powered Actor digitizes restaurant menus and extracts the 14 EU allergens (or 9 US allergens) automatically. It is designed for food-tech developers, restaurant chains, and compliance auditors who need structured, legally defensible menu data.

## How to Extract Allergens from Restaurant Menus
1. Provide the URL to your menu image or PDF.
2. Paste your Gemini API key.
3. Select your jurisdiction (`EU` for 14 allergens, or `US-CA` for 9).
4. Run the Actor and download your JSON dataset.

## EU-14 vs. US-9 Allergen Compliance
The Actor supports two frameworks. The **EU framework** covers the 14 allergens mandated by EU Regulation 1169/2011. The **US-CA framework** covers the 9 major allergens mandated by California SB 68 (effective July 2026), including sesame.

## How to Automate California SB 68 Menu Audits
If you operate restaurant chains in California with 20+ locations, you can use this Actor to automatically audit your digital menus for the 9 major allergens. The output includes a `jurisdiction` field and `extractionTimestamp` for legal provenance.

## Supported Inputs: Menu Images, PDFs, and URLs
The Actor accepts standard image formats (JPG, PNG, WEBP) and PDF menus. It uses `poppler-utils` for PDF rendering and advanced Vision AI for OCR extraction.

## Output Format: Structured JSON with Allergen Confidence Scores
Every dish is returned as a JSON object containing `dishName`, `price`, `ingredients`, `eu14Allergens` (with confidence scores), `dietaryType`, and `nutritionEstimate`. Records with a confidence score below 0.6 are flagged with `needsReview: true`.

## The "Italian Moat"
This Actor includes a proprietary 131-rule keyword engine specifically trained for Italian cuisine (131 ingredient rules, plus 15 compound-dish rules and 7 exceptions). It automatically flags ingredients like *semolina* (gluten), *ghee* (milk), and *guanciale* (pork) with high accuracy.

## Pricing
This Actor uses a Bring-Your-Own-Key (BYOK) model. You pay Apify only for compute time, and you pay your AI provider directly for API usage. There are no inference markups.
