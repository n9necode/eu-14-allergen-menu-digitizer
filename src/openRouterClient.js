'use strict';

const https = require('https');

const RESPONSE_SCHEMA_INSTRUCTION = `You are an EU-14 allergen extraction expert for restaurant menus. Extract ALL dishes. Return valid JSON with a "dishes" array. Each dish must have: dishName (string), originalName (string), category (string|null), price (string|null), ingredients (array of {englishName: string, displayName: string, eu14Allergens: array of {allergen: string, confidence: number}}), dietaryType (string: "vegan"|"vegetarian"|"pescetarian"|"other"), dietaryExplanation (string), allergenSummary (string), nutritionEstimate ({calories: number|null, proteinG: number|null, fatG: number|null, carbsG: number|null}), sourceImageUrl (string), confidence (number 0-1), needsReview (boolean).`;

const OPENROUTER_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "openrouter/free"
];

function callOpenRouter(apiKey, model, parts) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: RESPONSE_SCHEMA_INSTRUCTION
        },
        {
          role: "user",
          content: parts.map(p =>
            p.inlineData
              ? { type: "image_url", image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` } }
              : { type: "text", text: p.text || "" }
          )
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });

    const options = {
      hostname: "openrouter.ai",
      port: 443,
      path: "/api/v1/chat/completions",
      method: "POST",
      timeout: 120000,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(body)
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode >= 400) {
          console.error("[openrouter] HTTP", res.statusCode, ":", data);
          reject(new Error("OpenRouter API error " + res.statusCode));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Invalid JSON from OpenRouter"));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Request timeout"));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function genBackoff(apiKey, model, parts) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await callOpenRouter(apiKey, model, parts);
      return result;
    } catch (err) {
      const msg = err.message || "";
      const isRateLimit = /429/i.test(msg);
      const isTransient = /5\d{2}/i.test(msg) || /transient/i.test(msg);
      if ((isRateLimit || isTransient) && attempt < 4) {
        const delay = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

async function extractDishes(opts) {
  opts = opts || {};
  if (!opts.openRouterApiKey) throw new Error("openRouterApiKey is required");

  const images = opts.images || [];
  const model = opts.model || OPENROUTER_MODELS[0];
  const parts = images.map((i) =>
    i.buffer
      ? { inlineData: { data: i.buffer.toString("base64"), mimeType: i.mimeType || "image/jpeg" } }
      : { text: i.text || "" }
  );

  let lastErr;
  for (const m of [model, ...OPENROUTER_MODELS.filter((x) => x !== model)]) {
    try {
      const result = await genBackoff(opts.openRouterApiKey, m, parts);
      const choice = result.choices?.[0];
      if (!choice) throw new Error("No choices returned");
      const text = choice.message?.content || "";
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Extract JSON from markdown code blocks
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          // Try to find JSON object boundaries in raw text
          const start = text.indexOf("{");
          const end = text.lastIndexOf("}");
          if (start >= 0 && end > start) {
            parsed = JSON.parse(text.substring(start, end + 1));
          } else {
            throw new Error("Failed to parse JSON from OpenRouter response");
          }
        }
      }

      const arr = parsed.dishes || [parsed];
      return arr.map((d) => {
        const conf = typeof d.confidence === "number" ? d.confidence : 0.8;
        return {
          dishName: d.dishName || "",
          originalName: d.originalName || d.dishName || "",
          category: d.category || null,
          price: d.price || null,
          ingredients: (d.ingredients || []).map((g) => ({
            englishName: g.englishName || "",
            displayName: g.displayName || g.englishName || "",
            eu14Allergens: Array.isArray(g.eu14Allergens)
              ? g.eu14Allergens.map((a) => ({ allergen: a.allergen, confidence: a.confidence || 0.8 }))
              : []
          })),
          dietaryType: d.dietaryType || "other",
          dietaryExplanation: d.dietaryExplanation || "",
          allergenSummary: d.allergenSummary || "",
          nutritionEstimate: d.nutritionEstimate || { calories: null, proteinG: null, fatG: null, carbsG: null },
          sourceImageUrl: d.sourceImageUrl || "",
          confidence: conf,
          needsReview: conf < 0.6
        };
      });
    } catch (err) {
      lastErr = err;
      console.warn(`[openrouter] ${m} failed:`, err.message);
    }
  }
  throw lastErr || new Error("All OpenRouter models failed");
}

module.exports = { extractDishes, OPENROUTER_MODELS };
