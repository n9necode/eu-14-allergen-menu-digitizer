'use strict';

const https = require('https');

const RESPONSE_SCHEMA_INSTRUCTION = `You are an expert EU-14 allergen extraction AI. Analyze the provided restaurant menu image.
Extract EVERY SINGLE DISH listed on the menu.
For each dish, return a JSON object with a 'dishes' array containing:
- dishName: string (translated to English)
- originalName: string
- category: string or null
- price: string or null
- ingredients: array of objects with 'englishName', 'displayName', and 'eu14Allergens' (array of {allergen, confidence})
- dietaryType: 'vegan', 'vegetarian', 'pescetarian', or 'other'
- allergenSummary: string
- confidence: number between 0 and 1

Scan the menu for any dates indicating when this menu is valid (e.g., 'Summer 2026', 'Valid from May 1'). Add a top-level field to your JSON output called 'menuEffectiveDate' containing this string, or null if no date is found.

Do not skip dishes. Do not invent dishes. If an allergen is likely but not certain, assign a confidence score below 0.8.`;

const GROQ_MODEL = "qwen/qwen3.8-27b";

function callGroq(apiKey, model, parts) {
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
      hostname: "api.groq.com",
      port: 443,
      path: "/openai/v1/chat/completions",
      method: "POST",
      timeout: 120000,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode >= 400) {
          console.error("[groq] HTTP", res.statusCode, ":", data);
          reject(new Error("Groq API error " + res.statusCode));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Invalid JSON from Groq"));
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
      const result = await callGroq(apiKey, model, parts);
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
  if (!opts.groqApiKey) throw new Error("groqApiKey is required");

  const images = opts.images || [];
  const model = opts.model || GROQ_MODEL;
  const parts = images.map((i) =>
    i.buffer
      ? { inlineData: { data: i.buffer.toString("base64"), mimeType: i.mimeType || "image/jpeg" } }
      : { text: i.text || "" }
  );

  try {
    const result = await genBackoff(opts.groqApiKey, model, parts);
    const choice = result.choices?.[0];
    if (!choice) throw new Error("No choices returned");
    const text = choice.message?.content || "";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
          parsed = JSON.parse(text.substring(start, end + 1));
        } else {
          throw new Error("Failed to parse JSON from Groq response");
        }
      }
    }

    const arr = parsed.dishes || [parsed];
    return {
      dishes: arr.map((d) => {
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
      })
    };
  } catch (err) {
    throw err;
  }
}

module.exports = { extractDishes, GROQ_MODEL };
