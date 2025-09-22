/**
 * DEEPL TRANSLATION API TEST SCRIPT
 * Tests DeepL API for high-quality translation
 * API Docs: https://developers.deepl.com/docs/api-reference/translate
 */

import "dotenv/config";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

console.log('🔑 API Key loaded:');
console.log('- DeepL:', DEEPL_API_KEY ? '✅ Present' : '❌ Missing');

// DeepL language code mapping
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
  'no': 'NB',
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
 * DEEPL TRANSLATION
 * Uses DeepL API for professional translation
 * API Docs: https://developers.deepl.com/docs/api-reference/translate
 */
async function translateWithDeepL(text, targetLanguage, sourceLanguage = 'auto', retryCount = 0) {
  const maxRetries = 3;

  try {
    console.log(`🌍 [Attempt ${retryCount + 1}/${maxRetries}] DeepL Translation...`);
    console.log(`📝 Text: "${text}"`);
    console.log(`🎯 Target: ${targetLanguage}, Source: ${sourceLanguage}`);

    // Convert language codes to DeepL format
    const targetLang = DEEPL_LANGUAGE_MAP[targetLanguage] || targetLanguage.toUpperCase();
    const sourceLang = sourceLanguage === 'auto' ? null : (DEEPL_LANGUAGE_MAP[sourceLanguage] || sourceLanguage.toUpperCase());

    // Prepare request body
    const requestBody = {
      text: [text],
      target_lang: targetLang,
      model_type: 'prefer_quality_optimized'
    };

    // Add source language if specified
    if (sourceLang) {
      requestBody.source_lang = sourceLang;
    }

    // Use API Free endpoint if the key ends with ':fx', otherwise use Pro endpoint
    const isApiFree = DEEPL_API_KEY.endsWith(':fx');
    const apiEndpoint = isApiFree
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    console.log(`🔗 Using endpoint: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📡 DeepL Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 DeepL Response:', JSON.stringify(data, null, 2));

    if (data.translations && data.translations.length > 0) {
      const translation = data.translations[0];
      const translatedText = translation.text;
      const detectedSourceLang = translation.detected_source_language?.toLowerCase() || sourceLanguage;

      console.log(`✅ DeepL Success: "${translatedText}"`);
      console.log(`🔍 Detected source language: ${detectedSourceLang}`);
      console.log(`🤖 Model used: ${translation.model_type_used || data.model_type_used || 'unknown'}`);

      return {
        success: true,
        translatedText,
        provider: 'deepl',
        sourceLanguage: detectedSourceLang,
        targetLanguage,
        attempt: retryCount + 1,
        modelType: translation.model_type_used || data.model_type_used
      };
    } else {
      throw new Error('No translation returned from DeepL API');
    }

  } catch (error) {
    console.error(`❌ DeepL Attempt ${retryCount + 1} Failed:`, error.message);

    if (retryCount < maxRetries - 1) {
      console.log(`🔄 Retrying DeepL (${retryCount + 2}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return translateWithDeepL(text, targetLanguage, sourceLanguage, retryCount + 1);
    }

    return {
      success: false,
      error: error.message,
      provider: 'deepl',
      attempts: maxRetries
    };
  }
}

/**
 * MAIN TEST FUNCTION
 */
async function runTranslationTests() {
  console.log('\n🚀 Starting DeepL Translation Tests...\n');

  const testCases = [
    { text: 'Hello, world!', target: 'es', source: 'en' },
    { text: 'How are you today?', target: 'fr', source: 'en' },
    { text: 'This is a test message.', target: 'de', source: 'en' },
    { text: 'Good morning!', target: 'ja', source: 'en' },
    { text: 'Thank you very much.', target: 'ko', source: 'en' },
    { text: 'Auto-detect test', target: 'es', source: 'auto' }
  ];

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test ${i + 1}/${testCases.length}:`);
    console.log(`   Text: "${testCase.text}"`);
    console.log(`   ${testCase.source} → ${testCase.target}`);
    console.log('   ' + '─'.repeat(50));

    try {
      const result = await translateWithDeepL(testCase.text, testCase.target, testCase.source);

      if (result.success) {
        console.log(`   ✅ SUCCESS: "${result.translatedText}"`);
        console.log(`   📊 Provider: ${result.provider}, Attempt: ${result.attempt}`);
        successCount++;
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
        failureCount++;
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      failureCount++;
    }

    // Wait between tests to avoid rate limiting
    if (i < testCases.length - 1) {
      console.log('   ⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📈 Success Rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
}

// Check if DeepL API key is available
if (!DEEPL_API_KEY) {
  console.error('❌ DEEPL_API_KEY not found in environment variables');
  console.log('Please add DEEPL_API_KEY to your .env file');
  process.exit(1);
}

// Run the tests
runTranslationTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});

