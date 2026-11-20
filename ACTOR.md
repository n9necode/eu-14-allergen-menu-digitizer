# Plain-language guide for this Actor

This is a plain-language (no-code) guide to understanding, running, and deploying the EU-14 Allergen Menu Digitizer.

## What it does

Used a restaurant menu image or PDF, and turned it into a list of dishes with:
- dish names (translated into the language you want),
- prices,
- a list of ingredients, split into simple pieces,
- allergen tags from the EU-14 list, with a confidence score for each,
- whether it is vegan, vegetarian, pescetarian, or other,
- an estimated nutrition figure,
- a confidence score for the whole extraction, and a flag telling you which records need a human to check.

It uses a Gemini language model, but the key is supplied by the person running it, so the person who owns the actor does not pay for the AI.

## How to run it on your own computer

1. Open a terminal in this folder.
2. Install the software the project needs.
3. Edit the input file with your menu URLs and your own Gemini key.
4. Start it.

## How to put it on Apify so other people can use it

1. Create a new Actor on Apify.
2. Point it at this folder.
3. Add the Gemini key as a secret setting.
4. Build and run it.

For PDF menus, the actor works best when PDF page rendering is installed on the server. The build file is already there. Install the rendering support if you want PDFs to work properly.

## What you should check before anything goes live

- The 15 unit tests pass with the command on line 7 of the README.
- The Gemini key works by trying one menu URL by hand.
- A PDF with more than ten pages does not break the actor.

## Where the important files are

- The main entry point is `main.js`.
- The input and output rules are in `input_schema.json` and `README.md`.
- The allergen maps are in `src/cuisineMaps*.js`.
- The tests are in `tests/`.
- The handoff report is `HANDOFF_REVIEW.md`.

## Ready for production?

When you have finished the checks above, the project is ready. The report and files can be submitted to the main branch, and the folder can be handed over to be deployed.
