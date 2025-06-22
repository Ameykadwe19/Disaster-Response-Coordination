const axios = require('axios');
const crypto = require('crypto');
const CacheManager = require('../utils/cache');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ Using `flash` model for both text & image to avoid quota issues
const GEMINI_TEXT_MODEL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GEMINI_IMAGE_MODEL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// ✅ Extract location from disaster report text (with cache + fallback)
const extractLocation = async (description) => {
  const cacheKey = `gemini_location_${Buffer.from(description).toString('base64').slice(0, 30)}`;
  const cached = await CacheManager.get(cacheKey);
  if (cached) return cached.location;

  try {
    const prompt = `Extract the location name from this disaster report: "${description}". Only return the location name.`;

    const response = await axios.post(
      GEMINI_TEXT_MODEL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const locationText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (locationText) {
      await CacheManager.set(cacheKey, { location: locationText }, 24);
      return locationText;
    }

    return "Unknown Location"; // fallback if empty
  } catch (err) {
    console.error('Gemini location extraction error:', err.response?.data || err.message);
    return "Unknown Location"; // fallback on error
  }
};

// ✅ Verify if image is disaster-related using Gemini Vision
const verifyImageWithGemini = async (base64Image) => {
  // No caching for image verification - always get fresh results
  console.log('🔄 Starting fresh image verification (no cache)');

  try {
    // Validate MIME type
    let mimeType = "image/png";
    if (base64Image.startsWith("data:image/jpeg")) {
      mimeType = "image/jpeg";
    } else if (base64Image.startsWith("data:image/png")) {
      mimeType = "image/png";
    } else {
      return { error: "Unsupported image type. Only PNG and JPEG allowed." };
    }

    // Clean the base64 string
    const cleanedBase64 = base64Image
      .replace(/^data:image\/(png|jpeg);base64,/, '')
      .replace(/\s/g, '')
      .trim();

    if (cleanedBase64.length > 5_000_000) {
      return { error: "Image is too large for Gemini API (limit is ~4MB)." };
    }

    const geminiPrompt = `Does this image show disaster damage like flooding, fire, destroyed buildings, or emergency situations? Answer only YES or NO.`;

    const response = await axios.post(
      GEMINI_IMAGE_MODEL,
      {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanedBase64
                }
              },
              { text: geminiPrompt }
            ]
          }
        ]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { "Content-Type": "application/json" }
      }
    );

    const resultText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const normalizedText = resultText?.toLowerCase() || "";
    
    // Simple YES/NO detection
    let isDisaster = false;
    if (normalizedText.trim() === 'yes' || normalizedText.startsWith('yes')) {
      isDisaster = true;
    } else {
      isDisaster = false;
    }

    const output = {
      result: resultText,
      isDisaster
    };

    console.log('🔍 Image verification DEBUG:', { 
      originalText: resultText,
      normalizedText: normalizedText,
      containsYes: normalizedText.includes('yes'),
      containsNo: normalizedText.includes('no'),
      startsWithYes: normalizedText.startsWith('yes'),
      finalResult: isDisaster,
      fullResponse: response.data
    });
    
    // No caching - return fresh result every time
    console.log('✅ Fresh verification completed');
    return output;


  } catch (err) {
    console.error("Gemini image verification error:", err.response?.data || err.message);
    return { error: "Image verification failed." };
  }
};

module.exports = {
  extractLocation,
  verifyImageWithGemini
};
