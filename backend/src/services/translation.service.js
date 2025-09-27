import { ENV } from "../lib/env.js";

/**
 * Translation Service for Lingua Link
 * Uses DeepL API for high-quality real-time translation
 */

// LinguaLink AI supported languages with their codes
// Powered by advanced AI translation technology
// Updated: January 2025 - Complete LinguaLink AI language support
export const SUPPORTED_LANGUAGES = {
  // Major world languages supported by Cloudflare AI
  'ar': 'Arabic',
  'bg': 'Bulgarian',
  'bn': 'Bengali',
  'ca': 'Catalan',
  'cs': 'Czech',
  'da': 'Danish',
  'de': 'German',
  'el': 'Greek',
  'en': 'English',
  'es': 'Spanish',
  'et': 'Estonian',
  'fa': 'Persian',
  'fi': 'Finnish',
  'fr': 'French',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hr': 'Croatian',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'is': 'Icelandic',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'mk': 'Macedonian',
  'ms': 'Malay',
  'mt': 'Maltese',
  'nb': 'Norwegian (Bokmål)',
  'nl': 'Dutch',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sq': 'Albanian',
  'sr': 'Serbian',
  'sv': 'Swedish',
  'sw': 'Swahili',
  'th': 'Thai',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'vi': 'Vietnamese',
  'zh': 'Chinese',
  'zh-cn': 'Chinese (Simplified)',
  'zh-tw': 'Chinese (Traditional)'
};

// 🚀 LinguaLink AI configuration - INFINITE SCALING SYSTEM
const LINGUALINK_AI_ACCOUNTS = (() => {
  const accounts = [];

  // Primary account
  if (ENV.CLOUDFLARE_ACCOUNT_ID && ENV.CLOUDFLARE_API_TOKEN) {
    accounts.push({
      accountId: ENV.CLOUDFLARE_ACCOUNT_ID,
      apiToken: ENV.CLOUDFLARE_API_TOKEN,
      name: 'Primary'
    });
  }

  // 🔄 Dynamically detect ALL numbered accounts (Account 1, 2, 3, 4, 5, 6, ... ∞)
  let accountIndex = 1;
  while (true) {
    const accountId = process.env[`CLOUDFLARE_ACCOUNT_ID_${accountIndex}`];
    const apiToken = process.env[`CLOUDFLARE_API_TOKEN_${accountIndex}`];

    if (accountId && apiToken) {
      accounts.push({
        accountId: accountId,
        apiToken: apiToken,
        name: `Account ${accountIndex}`
      });
      accountIndex++;
    } else {
      // Stop when we find the first missing account
      break;
    }
  }

  console.log(`🚀 LinguaLink AI: Detected ${accounts.length} active accounts for infinite scaling!`);
  accounts.forEach((account) => {
    console.log(`   ✅ ${account.name}: ${account.accountId.substring(0, 8)}...`);
  });

  return accounts;
})();

// 🔄 ROUND-ROBIN LOAD BALANCER - Distributes requests evenly across all accounts
let currentAccountIndex = 0;
const accountStats = new Map(); // Track usage per account

const getNextAccount = () => {
  if (LINGUALINK_AI_ACCOUNTS.length === 0) return null;

  const account = LINGUALINK_AI_ACCOUNTS[currentAccountIndex];
  const accountKey = `${account.name}_${account.accountId.substring(0, 8)}`;

  // Initialize stats if not exists
  if (!accountStats.has(accountKey)) {
    accountStats.set(accountKey, { requests: 0, lastUsed: Date.now() });
  }

  // Update stats
  const stats = accountStats.get(accountKey);
  stats.requests++;
  stats.lastUsed = Date.now();

  currentAccountIndex = (currentAccountIndex + 1) % LINGUALINK_AI_ACCOUNTS.length;

  console.log(`🔄 Load Balancer: Using ${account.name} (Request #${stats.requests}) - Next: ${currentAccountIndex}/${LINGUALINK_AI_ACCOUNTS.length}`);
  return { account, index: currentAccountIndex - 1 };
};

// 📊 Get load balancing statistics
const getLoadBalancingStats = () => {
  const stats = {};
  accountStats.forEach((data, accountKey) => {
    stats[accountKey] = {
      totalRequests: data.requests,
      lastUsed: new Date(data.lastUsed).toISOString(),
      rateLimitInfo: "300 req/min per account (Cloudflare Workers AI)"
    };
  });
  return {
    totalAccounts: LINGUALINK_AI_ACCOUNTS.length,
    accountStats: stats,
    currentRotation: currentAccountIndex,
    rateLimits: {
      perAccount: "300 requests/minute",
      totalCapacity: `${LINGUALINK_AI_ACCOUNTS.length * 300} requests/minute`,
      recommendedMaxRPS: `${LINGUALINK_AI_ACCOUNTS.length * 5} requests/second`
    }
  };
};

// Language code mapping for LinguaLink AI (standardized ISO codes)
const LINGUALINK_LANGUAGE_MAP = {
  'ar': 'Arabic',
  'bg': 'Bulgarian',
  'bn': 'Bengali',
  'ca': 'Catalan',
  'cs': 'Czech',
  'da': 'Danish',
  'de': 'German',
  'el': 'Greek',
  'en': 'English',
  'es': 'Spanish',
  'et': 'Estonian',
  'fa': 'Persian',
  'fi': 'Finnish',
  'fr': 'French',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'hr': 'Croatian',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'is': 'Icelandic',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'mk': 'Macedonian',
  'ms': 'Malay',
  'mt': 'Maltese',
  'nb': 'Norwegian',
  'nl': 'Dutch',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sq': 'Albanian',
  'sr': 'Serbian',
  'sv': 'Swedish',
  'sw': 'Swahili',
  'th': 'Thai',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'vi': 'Vietnamese',
  'zh': 'Chinese',
  'zh-cn': 'Chinese (Simplified)',
  'zh-tw': 'Chinese (Traditional)'
};

/**
 * Create professional translation prompt for LinguaLink AI
 * This ensures human-level, contextually accurate translations
 */
function createTranslationPrompt(text, targetLanguage, sourceLanguage = 'auto') {
  const targetLangName = LINGUALINK_LANGUAGE_MAP[targetLanguage] || targetLanguage;
  const sourceLangName = sourceLanguage === 'auto' ? 'the detected language' : (LINGUALINK_LANGUAGE_MAP[sourceLanguage] || sourceLanguage);

  return `You are a professional human translator with native-level fluency in multiple languages. Your task is to provide accurate, natural, and contextually appropriate translations.

TRANSLATION TASK:
- Source Language: ${sourceLangName}
- Target Language: ${targetLangName}
- Text to translate: "${text}"

TRANSLATION REQUIREMENTS:
1. Provide a natural, human-like translation that preserves the original meaning and tone
2. Maintain cultural context and idiomatic expressions where appropriate
3. Ensure grammatical accuracy and proper sentence structure
4. Preserve formatting, punctuation, and capitalization style
5. For informal text, maintain the casual tone; for formal text, maintain formality
6. If the text contains slang, translate to equivalent expressions in the target language
7. For technical terms, use standard terminology in the target language

RESPONSE FORMAT:
Provide ONLY the translated text. Do not include explanations, notes, or additional commentary.

Translation:`;
}

/**
 * Translate text using LinguaLink AI with ROUND-ROBIN load balancing and retry mechanism
 * Advanced AI-powered translation system with proper load distribution
 */
async function translateWithLinguaLinkAI(text, targetLanguage, sourceLanguage = 'auto', retryCount = 0, accountInfo = null) {
  const maxRetries = 3;
  const maxAccounts = LINGUALINK_AI_ACCOUNTS.length;

  // Input validation
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  if (!targetLanguage || typeof targetLanguage !== 'string') {
    throw new Error('Invalid input: targetLanguage must be a valid language code');
  }

  if (text.length > 8000) { // Cloudflare AI context limit
    throw new Error('Text too long: maximum 8,000 characters allowed');
  }

  if (LINGUALINK_AI_ACCOUNTS.length === 0) {
    throw new Error('No LinguaLink AI accounts configured');
  }

  // 🔄 Get account using ROUND-ROBIN load balancing
  let currentAccount, accountIndex;

  if (accountInfo) {
    // Use provided account info (for retries)
    currentAccount = accountInfo.account;
    accountIndex = accountInfo.index;
  } else {
    // Get next account from round-robin load balancer
    const nextAccountInfo = getNextAccount();
    if (!nextAccountInfo) {
      throw new Error('No LinguaLink AI accounts available');
    }
    currentAccount = nextAccountInfo.account;
    accountIndex = nextAccountInfo.index;
  }

  try {
    console.log(`🧠 [LinguaLink AI ${currentAccount.name} - Attempt ${retryCount + 1}/${maxRetries}] Translating: "${text.substring(0, 50)}..."`);

    // Create professional translation prompt
    const prompt = createTranslationPrompt(text, targetLanguage, sourceLanguage);

    // Use LinguaLink AI Translation Engine
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${currentAccount.accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentAccount.apiToken}`
    };

    console.log(`🧠 Using LinguaLink AI Translation Engine (${currentAccount.name})`);

    // Prepare request body for Llama 3.1 8B Instruct model
    const requestBody = {
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent, accurate translations
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinguaLink AI error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Handle different response formats
    let translatedText;
    if (data.result && data.result.response) {
      // AI Gateway response format
      translatedText = data.result.response.trim();
    } else if (data.result && data.result.choices && data.result.choices[0]) {
      // Direct API response format
      translatedText = data.result.choices[0].message.content.trim();
    } else if (data.choices && data.choices[0]) {
      // Alternative response format
      translatedText = data.choices[0].message.content.trim();
    } else {
      throw new Error('Invalid response format from LinguaLink AI');
    }

    // Clean up the translation (remove any extra formatting)
    translatedText = translatedText.replace(/^Translation:\s*/i, '').trim();

    if (!translatedText) {
      throw new Error('Empty translation returned from LinguaLink AI');
    }

    console.log(`✅ LinguaLink AI Success (${currentAccount.name} - attempt ${retryCount + 1}): "${translatedText.substring(0, 50)}..."`);

    return {
      success: true,
      translatedText,
      provider: 'lingualink-ai',
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      attempt: retryCount + 1,
      account: currentAccount.name,
      model: 'lingualink-ai-engine'
    };

  } catch (error) {
    console.error(`❌ LinguaLink AI attempt ${retryCount + 1} failed (${currentAccount.name}):`, error.message);

    // 🔄 Try next account if available (ROUND-ROBIN FAILOVER)
    if (retryCount === 0 && maxAccounts > 1) {
      console.log(`🔄 Trying next LinguaLink AI account (Round-Robin Failover)...`);
      const nextAccountInfo = getNextAccount();
      if (nextAccountInfo) {
        return translateWithLinguaLinkAI(text, targetLanguage, sourceLanguage, 0, nextAccountInfo);
      }
    }

    // Retry with same account if we haven't reached max retries
    if (retryCount < maxRetries - 1) {
      console.log(`🔄 Retrying LinguaLink AI (${retryCount + 2}/${maxRetries}) in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return translateWithLinguaLinkAI(text, targetLanguage, sourceLanguage, retryCount + 1, { account: currentAccount, index: accountIndex });
    }

    console.log(`💥 LinguaLink AI failed after ${maxRetries} attempts on ${currentAccount.name}`);
    return {
      success: false,
      error: error.message,
      provider: 'lingualink-ai',
      attempts: maxRetries,
      account: currentAccount.name
    };
  }
}

/**
 * Main translation function using LinguaLink AI
 * Enterprise-grade translation with human-level accuracy
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

  // Check if LinguaLink AI is configured
  if (LINGUALINK_AI_ACCOUNTS.length === 0) {
    return {
      success: false,
      error: 'LinguaLink AI not configured'
    };
  }

  console.log('� Using LinguaLink AI Translation Service...');
  const result = await translateWithLinguaLinkAI(text, targetLanguage, sourceLanguage);

  if (result.success) {
    return result;
  } else {
    // If LinguaLink AI fails, return a user-friendly error
    console.log('❌ LinguaLink AI translation failed');
    return {
      success: false,
      error: 'Translation failed, please try again later',
      translatedText: null,
      provider: 'lingualink-ai',
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage
    };
  }
}

/**
 * Detect language of text using LinguaLink AI
 * Advanced language detection with AI-powered accuracy
 */
export async function detectLanguage(text) {
  if (!text || !text.trim()) {
    return 'unknown';
  }

  // For very short text, use basic pattern detection
  if (text.trim().length < 10) {
    return detectLanguageBasic(text);
  }

  // Use LinguaLink AI for accurate language detection
  try {
    if (LINGUALINK_AI_ACCOUNTS.length > 0) {
      const account = LINGUALINK_AI_ACCOUNTS[0]; // Use primary account

      const prompt = `Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., "en", "es", "fr", "de", etc.). Do not provide any explanation or additional text.

Text: "${text.substring(0, 500)}"

Language code:`;

      // Use LinguaLink AI Language Detection Engine
      const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${account.accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${account.apiToken}`
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        let detectedLang;

        if (data.result && data.result.response) {
          detectedLang = data.result.response.trim().toLowerCase();
        } else if (data.result && data.result.choices && data.result.choices[0]) {
          detectedLang = data.result.choices[0].message.content.trim().toLowerCase();
        }

        // Validate detected language
        if (detectedLang && SUPPORTED_LANGUAGES[detectedLang]) {
          console.log(`🔍 AI Language Detection: ${detectedLang}`);
          return detectedLang;
        }
      }
    }
  } catch (error) {
    console.error('❌ AI language detection failed:', error.message);
  }

  // Fallback to basic detection
  return detectLanguageBasic(text);
}

/**
 * Basic language detection using character patterns
 * Fallback method when AI detection is not available
 */
function detectLanguageBasic(text) {
  if (!text || !text.trim()) {
    return 'en';
  }

  // Script-based detection (most reliable)
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

// Export getLoadBalancingStats function for external use
export { getLoadBalancingStats };
