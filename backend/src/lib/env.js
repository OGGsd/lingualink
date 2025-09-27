import "dotenv/config";

// Validate required environment variables
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Check if we have LinguaLink AI configuration
  const hasLinguaLinkAI = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN;

  if (!hasLinguaLinkAI) {
    console.error('❌ LinguaLink AI translation service not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
    process.exit(1);
  }

  console.log('✅ LinguaLink AI translation service configured');

  // 🔄 Count ALL configured LinguaLink AI accounts (INFINITE SCALING)
  let accountCount = 0;

  // Primary account
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) accountCount++;

  // Dynamically count all numbered accounts
  let accountIndex = 1;
  while (true) {
    const accountId = process.env[`CLOUDFLARE_ACCOUNT_ID_${accountIndex}`];
    const apiToken = process.env[`CLOUDFLARE_API_TOKEN_${accountIndex}`];

    if (accountId && apiToken) {
      accountCount++;
      accountIndex++;
    } else {
      break;
    }
  }

  console.log(`✅ ${accountCount} LinguaLink AI account(s) configured for infinite scaling! 🚀`);

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
  ALLOW_DEV_RATE_LIMITS: process.env.ALLOW_DEV_RATE_LIMITS === 'true',

  // LinguaLink AI Configuration (Advanced Translation Engine)
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,

  // Multiple LinguaLink AI accounts for load balancing
  CLOUDFLARE_ACCOUNT_ID_1: process.env.CLOUDFLARE_ACCOUNT_ID_1,
  CLOUDFLARE_API_TOKEN_1: process.env.CLOUDFLARE_API_TOKEN_1,

  CLOUDFLARE_ACCOUNT_ID_2: process.env.CLOUDFLARE_ACCOUNT_ID_2,
  CLOUDFLARE_API_TOKEN_2: process.env.CLOUDFLARE_API_TOKEN_2,

  // Worker AI Configuration
  WORKER_AI_API_KEY: process.env.WORKER_AI_API_KEY,
  AI_GATEWAY_API: process.env.AI_GATEWAY_API,

  // Admin Configuration
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  WORKERS_API_URL: process.env.WORKERS_API_URL,

  // Production Backend URLs
  RENDER_BACKEND_1: process.env.RENDER_BACKEND_1,
  RENDER_BACKEND_2: process.env.RENDER_BACKEND_2,
  RENDER_BACKEND_3: process.env.RENDER_BACKEND_3,
  RENDER_BACKEND_4: process.env.RENDER_BACKEND_4,
  RENDER_BACKEND_5: process.env.RENDER_BACKEND_5,
  RENDER_BACKEND_6: process.env.RENDER_BACKEND_6,
  RENDER_BACKEND_7: process.env.RENDER_BACKEND_7,

  // Admin Credentials
  ADMIN_KEY_PRODUCTION: process.env.ADMIN_KEY_PRODUCTION,
  ADMIN_MASTER_PASSWORD: process.env.ADMIN_MASTER_PASSWORD,
  ADMIN_SECURITY_CODE: process.env.ADMIN_SECURITY_CODE,
  ADMIN_SESSION_TIMEOUT: process.env.ADMIN_SESSION_TIMEOUT,
  ADMIN_MAX_LOGIN_ATTEMPTS: process.env.ADMIN_MAX_LOGIN_ATTEMPTS,
  ADMIN_LOCKOUT_DURATION: process.env.ADMIN_LOCKOUT_DURATION,

  // Anti-Cold Start Configuration
  ANTI_COLD_START_ENABLED: process.env.ANTI_COLD_START_ENABLED === 'true',
  KEEPALIVE_INTERVAL: process.env.KEEPALIVE_INTERVAL,
  HEALTH_CHECK_INTERVAL: process.env.HEALTH_CHECK_INTERVAL,
  CRON_WAKEUP_ENABLED: process.env.CRON_WAKEUP_ENABLED === 'true',

  // Production Domain Configuration
  PRODUCTION_DOMAIN: process.env.PRODUCTION_DOMAIN,
  API_DOMAIN: process.env.API_DOMAIN,
  BACKEND_DOMAIN: process.env.BACKEND_DOMAIN,

  // Branding Configuration
  APP_NAME: process.env.APP_NAME,
  APP_DESCRIPTION: process.env.APP_DESCRIPTION,
  BRAND_PRIMARY_COLOR: process.env.BRAND_PRIMARY_COLOR,
  BRAND_SECONDARY_COLOR: process.env.BRAND_SECONDARY_COLOR,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  COMPANY_NAME: process.env.COMPANY_NAME,
};
