import fetch from "node-fetch";

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_API_URL =
  "https://translation.googleapis.com/language/translate/v2";

/**
 * Translates text using Google Cloud Translation API
 * @param {Object} params - Translation parameters
 * @param {string} params.text - The text to translate
 * @param {string} params.sourceLanguage - The source language code (e.g., 'en', 'uk', 'ro')
 * @param {string} params.targetLanguage - The target language code (e.g., 'en', 'uk', 'ro')
 * @returns {Promise<string>} - The translated text
 * @throws {Error} - Throws an error if translation fails
 */
export const translateText = async ({
  text,
  sourceLanguage,
  targetLanguage,
}) => {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY is not configured");
  }

  if (!text || text.trim() === "") {
    return "";
  }

  // If source and target are the same, return original text
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  const url = new URL(GOOGLE_TRANSLATE_API_URL);
  url.searchParams.append("key", GOOGLE_TRANSLATE_API_KEY);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: "text",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.error?.message || "Translation request failed";
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (
    !result.data ||
    !result.data.translations ||
    result.data.translations.length === 0
  ) {
    throw new Error("No translation returned from Google API");
  }

  return result.data.translations[0].translatedText;
};

/**
 * Translates multiple texts in a batch using Google Cloud Translation API
 * @param {Object} params - Translation parameters
 * @param {string[]} params.texts - Array of texts to translate
 * @param {string} params.sourceLanguage - The source language code
 * @param {string} params.targetLanguage - The target language code
 * @returns {Promise<string[]>} - Array of translated texts
 */
export const translateTextBatch = async ({
  texts,
  sourceLanguage,
  targetLanguage,
}) => {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY is not configured");
  }

  if (!texts || texts.length === 0) {
    return [];
  }

  // If source and target are the same, return original texts
  if (sourceLanguage === targetLanguage) {
    return texts;
  }

  const url = new URL(GOOGLE_TRANSLATE_API_URL);
  url.searchParams.append("key", GOOGLE_TRANSLATE_API_KEY);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: texts,
      source: sourceLanguage,
      target: targetLanguage,
      format: "text",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.error?.message || "Translation request failed";
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (!result.data || !result.data.translations) {
    throw new Error("No translations returned from Google API");
  }

  return result.data.translations.map((t) => t.translatedText);
};
