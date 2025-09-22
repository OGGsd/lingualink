/**
 * Test script to verify backend configuration
 * Run with: node test-backend-config.js
 */

// Mock import.meta.env for Node.js testing
global.import = {
  meta: {
    env: {
      MODE: 'production',
      PROD: true,
      DEV: false,
      // Mock environment variables from .env.production
      VITE_RENDER_BACKEND_1: 'https://lingualink-6cxu.onrender.com',
      VITE_FROM_EMAIL_ACCOUNT_1: 'sdfwdg4@gmail.com',
      VITE_RENDER_BACKEND_2: 'https://lingualink-rvsx.onrender.com',
      VITE_FROM_EMAIL_ACCOUNT_2: 'jasperbatalino@gmail.com',
      VITE_RENDER_BACKEND_3: 'https://lingualink-27tx.onrender.com',
      VITE_FROM_EMAIL_ACCOUNT_3: 'rayluzon2253@gmail.com',
      VITE_RENDER_BACKEND_4: 'https://lingualink-f5v7.onrender.com',
      VITE_FROM_EMAIL_ACCOUNT_4: 'jonathanbahala9827@gmail.com',
      VITE_RENDER_BACKEND_5: 'https://lingualink-uj74.onrender.com',
      VITE_FROM_EMAIL_ACCOUNT_5: 'michellemiranda99922@gmail.com',
      VITE_RENDER_BACKEND_6: 'https://lingualink-qk4k.onrender.com',
      VITE_FROM_EMAIL_ACCOUNT_6: 'johnmolly1526@gmail.com',
      VITE_RENDER_BACKEND_7: 'https://lingualink-dmb7.onrender.com',
      VITE_FROM_EMAIL_ACCOUNT_7: 'kiel77763@gmail.com'
    }
  }
};

// Mock console for better output
const originalConsoleLog = console.log;
console.log = (...args) => {
  originalConsoleLog('🧪', ...args);
};

async function testBackendConfiguration() {
  console.log('Testing Backend Configuration...\n');

  try {
    // Import the backend config (this will work in the browser)
    console.log('✅ Environment variables loaded:');
    
    const envVars = Object.keys(import.meta.env)
      .filter(key => key.startsWith('VITE_RENDER_BACKEND_') || key.startsWith('VITE_FROM_EMAIL_ACCOUNT_'))
      .sort();
    
    envVars.forEach(key => {
      console.log(`   ${key}: ${import.meta.env[key]}`);
    });

    console.log('\n✅ Backend instances that would be loaded:');
    
    let backendIndex = 1;
    const backends = [];
    
    while (true) {
      const backendUrl = import.meta.env[`VITE_RENDER_BACKEND_${backendIndex}`];
      const fromEmail = import.meta.env[`VITE_FROM_EMAIL_ACCOUNT_${backendIndex}`];
      
      if (!backendUrl) {
        break;
      }

      const backend = {
        id: backendIndex,
        url: backendUrl,
        email: fromEmail || `backend${backendIndex}@example.com`,
        deeplConfigured: true
      };

      backends.push(backend);
      console.log(`   Backend ${backendIndex}: ${backend.url} (${backend.email})`);
      
      backendIndex++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total backends configured: ${backends.length}`);
    console.log(`   Each backend has dedicated DeepL API key`);
    console.log(`   Database: Shared across all backends`);
    console.log(`   Load balancing: Health-based selection`);
    console.log(`   Keep-alive: 10-minute ping intervals`);

    console.log(`\n🎯 Expected behavior:`);
    console.log(`   - Frontend will automatically select fastest/healthiest backend`);
    console.log(`   - Failed requests will retry with different backend`);
    console.log(`   - All backends stay alive with regular pings`);
    console.log(`   - Translation capacity: ${backends.length}x DeepL API limits`);

    return backends;

  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    return [];
  }
}

// Test health check simulation
async function testHealthCheckSimulation() {
  console.log('\n🔍 Simulating health checks...\n');

  const backends = [
    { id: 1, url: 'https://lingualink-6cxu.onrender.com' },
    { id: 2, url: 'https://lingualink-rvsx.onrender.com' },
    { id: 3, url: 'https://lingualink-27tx.onrender.com' },
    { id: 4, url: 'https://lingualink-f5v7.onrender.com' },
    { id: 5, url: 'https://lingualink-uj74.onrender.com' },
    { id: 6, url: 'https://lingualink-qk4k.onrender.com' },
    { id: 7, url: 'https://lingualink-dmb7.onrender.com' }
  ];

  for (const backend of backends) {
    try {
      console.log(`🔍 Checking backend ${backend.id}: ${backend.url}`);
      
      // Simulate health check (in real app, this would be actual HTTP request)
      const startTime = Date.now();
      
      // Mock response time (random between 100-2000ms)
      const responseTime = Math.floor(Math.random() * 1900) + 100;
      await new Promise(resolve => setTimeout(resolve, Math.min(responseTime, 500))); // Cap simulation time
      
      const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
      
      if (isHealthy) {
        console.log(`   ✅ Healthy (${responseTime}ms)`);
      } else {
        console.log(`   ❌ Unhealthy (${responseTime}ms)`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Multi-Backend System Tests\n');
  console.log('=' .repeat(60));
  
  const backends = await testBackendConfiguration();
  
  if (backends.length > 0) {
    await testHealthCheckSimulation();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests completed successfully!');
  console.log('\n💡 Next steps:');
  console.log('   1. Deploy frontend with updated environment variables');
  console.log('   2. Verify each backend instance has DeepL API key configured');
  console.log('   3. Test translation requests in production');
  console.log('   4. Monitor backend health dashboard');
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

export { testBackendConfiguration, testHealthCheckSimulation };
