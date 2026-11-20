# Test Menus for Italian Moat Benchmark

## Directory Structure

```
test-menus/
  README.md              # this file
  italian/               # 10 real Italian menu images
    01-<name>.jpg        # place real menu images here
    ...
  truth/                 # hand-labeled ground truth
    italian/
      01-<name>.truth.json
      ...
  output/                # smoke test output (generated, gitignored)
    01-<name>.output.json
    ...
```

## Menu Selection Criteria (10 menus)

| # | Type | Description | Failure Mode Tested |
|---|------|-------------|---------------------|
| 1 | Clean digital | High-res, clear text | Baseline accuracy |
| 2 | Clean digital | High-res, clear text | Baseline accuracy |
| 3 | Clean digital | High-res, clear text | Baseline accuracy |
| 4 | Photographed | Angle, glare, low light | Image quality degradation |
| 5 | Photographed | Angle, glare, low light | Image quality degradation |
| 6 | No ingredient lists | Dish names only | Forces allergen inference |
| 7 | No ingredient lists | Dish names only | Forces allergen inference |
| 8 | Non-Latin/dialect | Neapolitan or heavy dialect | Language/dialect handling |
| 9 | PDF | Multi-page menu | PDF rendering path |
| 10 | Two-column | Prices in columns, two-column layout | Layout parsing |

## Source URLs

Record the source URL for each menu file here. Do not use AI-generated menus —
they lack the messiness that breaks extraction. Public restaurant websites
and menu archives are fine for development.

## Ground Truth

Hand-label each menu in `test-menus/truth/italian/<name>.truth.json` using
the format specified in the project brief. Label conservatively — if unsure
about an allergen, leave it out and add to the `uncertain` array.

## Usage

```bash
# Smoke test with real Gemini key
GEMINI_API_KEY=<key> node scripts/smokeTest.js --all

# Benchmark against truth
node scripts/benchmark.js
```
