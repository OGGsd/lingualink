import express from "express";
import { ENV } from "../lib/env.js";

const router = express.Router();

/**
 * Health Check Endpoint
 * Returns detailed health information about this backend instance
 */
router.get("/", async (req, res) => {
  try {
    // Security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const startTime = Date.now();
    
    // Basic health check data
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: ENV.NODE_ENV,
      version: "1.0.0",
      instance: {
        port: ENV.PORT,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        cpu: process.cpuUsage()
      }
    };

    // Test database connection
    try {
      const { pool } = await import("../lib/db.js");
      const dbResult = await pool.query('SELECT NOW() as current_time');
      healthData.database = {
        status: "connected",
        responseTime: Date.now() - startTime,
        currentTime: dbResult.rows[0].current_time
      };
    } catch (dbError) {
      healthData.database = {
        status: "error",
        error: dbError.message
      };
      healthData.status = "degraded";
    }

    // Test LinguaLink AI connection
    try {
      if (ENV.CLOUDFLARE_ACCOUNT_ID && ENV.CLOUDFLARE_API_TOKEN) {
        const testStartTime = Date.now();
        const linguaLinkResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${ENV.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ENV.CLOUDFLARE_API_TOKEN}`
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: "Hello" }],
              max_tokens: 5,
              temperature: 0.1
            })
          }
        );

        const linguaLinkResponseTime = Date.now() - testStartTime;

        // 🔄 Count ALL configured accounts (INFINITE SCALING)
        let accountCount = 0;

        // Primary account
        if (ENV.CLOUDFLARE_ACCOUNT_ID && ENV.CLOUDFLARE_API_TOKEN) accountCount++;

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

        healthData.linguaLinkAI = {
          status: linguaLinkResponse.ok ? "connected" : "error",
          responseTime: linguaLinkResponseTime,
          accounts: accountCount,
          model: "lingualink-ai-engine",
          provider: "lingualink-ai"
        };

        if (!linguaLinkResponse.ok) {
          const errorText = await linguaLinkResponse.text();
          healthData.linguaLinkAI.error = errorText;
          healthData.status = "degraded";
        }
      } else {
        healthData.linguaLinkAI = {
          status: "not_configured",
          error: "LinguaLink AI not configured"
        };
        healthData.status = "degraded";
      }
    } catch (linguaLinkError) {
      healthData.linguaLinkAI = {
        status: "error",
        error: linguaLinkError.message
      };
      healthData.status = "degraded";
    }

    // Calculate total response time
    healthData.responseTime = Date.now() - startTime;

    // Set appropriate status code
    const statusCode = healthData.status === "healthy" ? 200 : 
                      healthData.status === "degraded" ? 200 : 503;

    res.status(statusCode).json(healthData);

  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - (req.startTime || Date.now())
    });
  }
});

/**
 * Simple ping endpoint for keep-alive
 */
router.get("/ping", (req, res) => {
  res.status(200).json({
    status: "pong",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Load Balancing Statistics Endpoint
 * Returns detailed load balancing and rate limiting information
 */
router.get("/load-balancing", async (req, res) => {
  try {
    // Security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Import the stats function from translation service
    const { getLoadBalancingStats } = await import('../services/translation.service.js');
    const stats = getLoadBalancingStats();

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      loadBalancing: stats,
      rateLimitWarning: "Cloudflare Workers AI: 300 requests/minute per account. Monitor usage to avoid rate limits!"
    });
  } catch (error) {
    console.error('❌ Load balancing stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get load balancing stats',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test Translation Endpoint (No Auth Required)
 * For testing load balancing functionality
 */
router.post("/test-translation", async (req, res) => {
  try {
    const { text = "Hello world", targetLanguage = "es", sourceLanguage = "en" } = req.body;

    // Import the translation function
    const { translateText } = await import('../services/translation.service.js');

    console.log(`🧪 Testing translation: "${text}" → ${targetLanguage}`);
    const result = await translateText(text, targetLanguage, sourceLanguage);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      translation: result,
      testNote: "This is a test endpoint for load balancing verification"
    });
  } catch (error) {
    console.error('❌ Test translation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Translation test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * AI Email Generator Endpoint
 * Uses Cloudflare AI to generate professional HTML emails
 */
router.post("/generate-email", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'Email prompt is required'
      });
    }

    // Import the translation function (we'll use it for AI generation)
    const { translateText } = await import('../services/translation.service.js');

    // Create a professional email generation prompt
    const emailPrompt = `Create a professional, modern, responsive HTML email template for: "${prompt}".

Requirements:
- Use modern HTML5 and inline CSS for maximum email client compatibility
- Include proper email structure with DOCTYPE, html, head, and body tags
- Make it mobile-responsive using media queries
- Use professional colors and typography
- Include placeholder content that matches the request
- Add proper spacing and padding for readability
- Include a header, main content area, and footer
- Use web-safe fonts
- Ensure it works in Gmail, Outlook, Apple Mail, and other major email clients

Return ONLY the complete HTML code, no explanations or markdown formatting.`;

    console.log(`📧 Generating email with AI: "${prompt}"`);
    const result = await translateText(emailPrompt, 'en', 'en');

    if (result.success) {
      res.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        emailHtml: result.translatedText,
        prompt: prompt,
        generatedBy: 'LinguaLink AI (Cloudflare Workers AI)'
      });
    } else {
      throw new Error('AI generation failed');
    }

  } catch (error) {
    console.error('❌ Email generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate email',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Admin Analytics Endpoint
 * Returns real-time system analytics
 */
router.get("/admin/analytics", async (req, res) => {
  try {
    // Import database connection
    const { pool } = await import('../lib/db.js');

    // Get real analytics data
    const userCountResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const messageCountResult = await pool.query('SELECT COUNT(*) as total FROM messages');
    const translationCountResult = await pool.query('SELECT COUNT(*) as total FROM translation_history');

    // Get active users (users who sent messages in last 24 hours)
    const activeUsersResult = await pool.query(`
      SELECT COUNT(DISTINCT sender_id) as active
      FROM messages
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    // Get load balancing stats
    const { getLoadBalancingStats } = await import('../services/translation.service.js');
    const loadBalancingStats = getLoadBalancingStats();

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      analytics: {
        totalUsers: parseInt(userCountResult.rows[0].total),
        activeUsers: parseInt(activeUsersResult.rows[0].active),
        totalMessages: parseInt(messageCountResult.rows[0].total),
        totalTranslations: parseInt(translationCountResult.rows[0].total),
        systemUptime: process.uptime(),
        loadBalancing: loadBalancingStats
      }
    });
  } catch (error) {
    console.error('❌ Admin analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get analytics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Find User Endpoint
 * Find user by email for admin management
 */
router.get("/admin/find-user/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Import database connection
    const { pool } = await import('../lib/db.js');

    // Find user by email
    const userResult = await pool.query('SELECT id, email, full_name, is_admin, created_at FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        email: email
      });
    }

    const user = userResult.rows[0];

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin || false,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('❌ Find user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to find user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Make User Admin Endpoint
 * Grant admin privileges to a user
 */
router.post("/admin/make-admin/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Import database connection
    const { pool } = await import('../lib/db.js');

    // First, check if is_admin column exists, if not create it
    try {
      await pool.query('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
      console.log('✅ Added is_admin column to users table');
    } catch (alterError) {
      // Column probably already exists, that's fine
      console.log('📝 is_admin column already exists or error:', alterError.message);
    }

    // Find and update user
    const updateResult = await pool.query(
      'UPDATE users SET is_admin = TRUE WHERE email = $1 RETURNING id, email, full_name, is_admin',
      [email]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        email: email
      });
    }

    const user = updateResult.rows[0];

    console.log(`🔑 Admin privileges granted to: ${user.email} (ID: ${user.id})`);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      message: 'Admin privileges granted successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('❌ Make admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to grant admin privileges',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Remove Admin Privileges Endpoint
 * Remove admin privileges from a user
 */
router.post("/admin/remove-admin/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Import database connection
    const { pool } = await import('../lib/db.js');

    // Find and update user
    const updateResult = await pool.query(
      'UPDATE users SET is_admin = FALSE WHERE email = $1 RETURNING id, email, full_name, is_admin',
      [email]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        email: email
      });
    }

    const user = updateResult.rows[0];

    console.log(`🔓 Admin privileges removed from: ${user.email} (ID: ${user.id})`);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      message: 'Admin privileges removed successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('❌ Remove admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove admin privileges',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * List All Users Endpoint (Admin only)
 * Get all users for admin management
 */
router.get("/admin/users", async (req, res) => {
  try {
    // Import database connection
    const { pool } = await import('../lib/db.js');

    // Get all users with detailed information
    const usersResult = await pool.query(`
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.is_admin,
        u.email_verified,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT th.id) as translation_count,
        MAX(m.created_at) as last_message_at
      FROM users u
      LEFT JOIN messages m ON u.id = m.sender_id
      LEFT JOIN translation_history th ON u.id = th.user_id
      GROUP BY u.id, u.email, u.full_name, u.is_admin, u.email_verified, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      users: usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isAdmin: user.is_admin || false,
        emailVerified: user.email_verified || false,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        messageCount: parseInt(user.message_count) || 0,
        translationCount: parseInt(user.translation_count) || 0,
        lastMessageAt: user.last_message_at,
        isActive: user.last_message_at && new Date(user.last_message_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      }))
    });
  } catch (error) {
    console.error('❌ List users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get users',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Enhanced Analytics Endpoint
 * Returns comprehensive real-time system analytics
 */
router.get("/admin/enhanced-analytics", async (req, res) => {
  try {
    // Import database connection
    const { pool } = await import('../lib/db.js');

    // Parallel queries for better performance
    const [
      userStats,
      messageStats,
      translationStats,
      dailyStats,
      topLanguages
    ] = await Promise.all([
      // User statistics
      pool.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_today,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
          COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users,
          COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users
        FROM users
      `),

      // Message statistics
      pool.query(`
        SELECT
          COUNT(*) as total_messages,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_today,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as messages_week,
          COUNT(DISTINCT sender_id) as active_users_all_time,
          COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN sender_id END) as active_users_today
        FROM messages
      `),

      // Translation statistics
      pool.query(`
        SELECT
          COUNT(*) as total_translations,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as translations_today,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as translations_week,
          COUNT(DISTINCT user_id) as users_using_translation
        FROM translation_history
      `),

      // Daily activity for the last 7 days
      pool.query(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as message_count,
          COUNT(DISTINCT sender_id) as active_users
        FROM messages
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `),

      // Top translation languages
      pool.query(`
        SELECT
          source_language,
          target_language,
          COUNT(*) as translation_count
        FROM translation_history
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY source_language, target_language
        ORDER BY translation_count DESC
        LIMIT 10
      `)
    ]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      analytics: {
        users: userStats.rows[0],
        messages: messageStats.rows[0],
        translations: translationStats.rows[0],
        dailyActivity: dailyStats.rows,
        topLanguages: topLanguages.rows,
        systemUptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('❌ Enhanced analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get enhanced analytics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Send Email Endpoint (Admin only)
 * Send emails using Resend with modern templates
 */
router.post("/admin/send-email", async (req, res) => {
  try {
    const { to, subject, content, preheader, type } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: to, subject, content'
      });
    }

    // Import email service
    const emailService = await import('../services/email.service.js');

    let result;

    if (type === 'welcome') {
      result = await emailService.default.sendWelcomeEmail(to, content.userName || 'User');
    } else if (type === 'admin-notification') {
      result = await emailService.default.sendAdminNotification(to, subject, content.message, content.data || {});
    } else {
      result = await emailService.default.sendEmail({
        to,
        subject,
        content,
        preheader: preheader || ''
      });
    }

    if (result.success) {
      res.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send email',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Send email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send email',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Email Templates Endpoint (Admin only)
 * Get available email templates
 */
router.get("/admin/email-templates", async (req, res) => {
  try {
    const templates = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        description: 'Welcome new users to LinguaLink',
        fields: ['userName'],
        preview: 'Welcome to LinguaLink! Get started with AI-powered translations.'
      },
      {
        id: 'admin-notification',
        name: 'Admin Notification',
        description: 'Send notifications to administrators',
        fields: ['message', 'data'],
        preview: 'Admin notification with system updates and alerts.'
      },
      {
        id: 'custom',
        name: 'Custom Email',
        description: 'Send custom HTML emails with modern design',
        fields: ['content', 'preheader'],
        preview: 'Fully customizable email with responsive design.'
      }
    ];

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      templates
    });
  } catch (error) {
    console.error('❌ Email templates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get email templates',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
