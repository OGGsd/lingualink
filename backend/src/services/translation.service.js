import { ENV } from "../lib/env.js";

/**
 * Translation Service for Lingua Link
 * Uses DeepL API for high-quality real-time translation
 */

// DeepL supported languages with their codes
// Based on: https://developers.deepl.com/docs/resources/supported-languages
export const SUPPORTED_LANGUAGES = {
  // Source and target languages
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'ar': 'Arabic',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'id': 'Indonesian',
  'uk': 'Ukrainian',
  'el': 'Greek',
  'nb': 'Norwegian (Bokmål)',
  'he': 'Hebrew'
};

// DeepL language code mapping (some codes differ from standard ISO codes)
const DEEPL_LANGUAGE_MAP = {
  'en': 'EN',
  'es': 'ES',
  'fr': 'FR',
  'de': 'DE',
  'it': 'IT',
  'pt': 'PT',
  'ru': 'RU',
  'ja': 'JA',
  'ko': 'KO',
  'zh': 'ZH',
  'ar': 'AR',
  'tr': 'TR',
  'pl': 'PL',
  'nl': 'NL',
  'sv': 'SV',
  'da': 'DA',
  'no': 'NB', // Norwegian Bokmål
  'nb': 'NB',
  'fi': 'FI',
  'cs': 'CS',
  'hu': 'HU',
  'ro': 'RO',
  'bg': 'BG',
  'hr': 'HR',
  'sk': 'SK',
  'sl': 'SL',
  'et': 'ET',
  'lv': 'LV',
  'lt': 'LT',
  'id': 'ID',
  'uk': 'UK',
  'el': 'EL',
  'he': 'HE'
};

/**
 * Translate text using DeepL API with 3-retry mechanism
 * DeepL API Documentation: https://developers.deepl.com/docs/api-reference/translate
 */
async function translateWithDeepL(text, targetLanguage, sourceLanguage = 'auto', retryCount = 0) {
  const maxRetries = 3;

  // Input validation
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  if (!targetLanguage || typeof targetLanguage !== 'string') {
    throw new Error('Invalid input: targetLanguage must be a valid language code');
  }

  if (text.length > 50000) { // DeepL API limit
    throw new Error('Text too long: maximum 50,000 characters allowed');
  }

  try {
    console.log(`🌍 [DeepL Attempt ${retryCount + 1}/${maxRetries}] Translating: "${text.substring(0, 50)}..."`);

    // Convert language codes to DeepL format
    const targetLang = DEEPL_LANGUAGE_MAP[targetLanguage] || targetLanguage.toUpperCase();
    const sourceLang = sourceLanguage === 'auto' ? null : (DEEPL_LANGUAGE_MAP[sourceLanguage] || sourceLanguage.toUpperCase());

    // Prepare request body
    const requestBody = {
      text: [text],
      target_lang: targetLang,
      model_type: 'prefer_quality_optimized' // Use next-gen models when available
    };

    // Add source language if specified (not auto-detect)
    if (sourceLang) {
      requestBody.source_lang = sourceLang;
    }

    // Validate API key exists
    if (!ENV.DEEPL_API_KEY) {
      throw new Error('DeepL API key not configured');
    }

    // Use API Free endpoint if the key ends with ':fx', otherwise use Pro endpoint
    const isApiFree = ENV.DEEPL_API_KEY.endsWith(':fx');
    const apiEndpoint = isApiFree
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DeepL-Auth-Key ${ENV.DEEPL_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.translations || data.translations.length === 0) {
      throw new Error('No translation returned from DeepL API');
    }

    const translation = data.translations[0];
    const translatedText = translation.text;
    const detectedSourceLang = translation.detected_source_language?.toLowerCase() || sourceLanguage;

    console.log(`✅ DeepL Success (attempt ${retryCount + 1}): "${translatedText.substring(0, 50)}..."`);

    return {
      success: true,
      translatedText,
      provider: 'deepl',
      sourceLanguage: detectedSourceLang,
      targetLanguage: targetLanguage,
      attempt: retryCount + 1,
      modelType: translation.model_type_used || data.model_type_used || 'unknown'
    };
  } catch (error) {
    console.error(`❌ DeepL attempt ${retryCount + 1} failed:`, error.message);

    // Retry if we haven't reached max retries
    if (retryCount < maxRetries - 1) {
      console.log(`🔄 Retrying DeepL (${retryCount + 2}/${maxRetries}) in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return translateWithDeepL(text, targetLanguage, sourceLanguage, retryCount + 1);
    }

    console.log(`💥 DeepL failed after ${maxRetries} attempts`);
    return {
      success: false,
      error: error.message,
      provider: 'deepl',
      attempts: maxRetries
    };
  }
}

/**
 * Main translation function using DeepL API
 */
export async function translateText(text, targetLanguage, sourceLanguage = 'auto') {
  if (!text || !text.trim()) {
    return {
      success: false,
      error: 'No text provided for translation'
    };
  }

  if (!SUPPORTED_LANGUAGES[targetLanguage]) {
    return {
      success: false,
      error: `Unsupported target language: ${targetLanguage}`
    };
  }

  // Check if DeepL API key is configured
  if (!ENV.DEEPL_API_KEY) {
    return {
      success: false,
      error: 'DeepL API key not configured'
    };
  }

  console.log('🌍 Using DeepL Translation API...');
  const result = await translateWithDeepL(text, targetLanguage, sourceLanguage);

  if (result.success) {
    return result;
  } else {
    // If DeepL fails, return a user-friendly error
    console.log('❌ DeepL translation failed');
    return {
      success: false,
      error: 'Translation failed, please try again later',
      translatedText: null,
      provider: 'deepl',
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage
    };
  }
}

/**
 * Detect language of text (basic implementation)
 */
export function detectLanguage(text) {
  // Simple language detection based on character patterns
  // This is a basic implementation - in production you might want to use a proper language detection library
  
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
  if (/[\u0590-\u05ff]/.test(text)) return 'he'; // Hebrew
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Russian
  if (/[\u0370-\u03ff]/.test(text)) return 'el'; // Greek
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th'; // Thai
  if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Hindi
  
  // Default to English for Latin script
  return 'en';
}
