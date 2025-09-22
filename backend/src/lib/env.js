import "dotenv/config";

// Validate required environment variables
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'DEEPL_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Validate DeepL API key format
  if (process.env.DEEPL_API_KEY && !process.env.DEEPL_API_KEY.match(/^[a-f0-9-]+(:fx)?$/i)) {
    console.error('❌ Invalid DeepL API key format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx (for free) or xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (for pro)');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}

// Run validation
validateEnv();

export const ENV = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Lingua Link',
  DEEPL_API_KEY: process.env.DEEPL_API_KEY,
  ALLOW_DEV_RATE_LIMITS: process.env.ALLOW_DEV_RATE_LIMITS === 'true',
};
