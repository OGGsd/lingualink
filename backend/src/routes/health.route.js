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

    // Test DeepL API connection
    try {
      if (ENV.DEEPL_API_KEY) {
        const isApiFree = ENV.DEEPL_API_KEY.endsWith(':fx');
        const apiEndpoint = isApiFree 
          ? 'https://api-free.deepl.com/v2/translate'
          : 'https://api.deepl.com/v2/translate';

        const deeplResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `DeepL-Auth-Key ${ENV.DEEPL_API_KEY}`
          },
          body: JSON.stringify({
            text: ["test"],
            target_lang: "ES"
          })
        });

        healthData.deepl = {
          status: deeplResponse.ok ? "connected" : "error",
          responseTime: Date.now() - startTime,
          endpoint: isApiFree ? "free" : "pro"
        };

        if (!deeplResponse.ok) {
          healthData.status = "degraded";
        }
      } else {
        healthData.deepl = {
          status: "not_configured",
          error: "DEEPL_API_KEY not found"
        };
        healthData.status = "degraded";
      }
    } catch (deeplError) {
      healthData.deepl = {
        status: "error",
        error: deeplError.message
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

export default router;
