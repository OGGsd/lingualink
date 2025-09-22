/**
 * Test the health endpoints of all backend instances
 */

const backends = [
  { id: 1, url: 'https://lingualink-6cxu.onrender.com', email: 'sdfwdg4@gmail.com' },
  { id: 2, url: 'https://lingualink-rvsx.onrender.com', email: 'jasperbatalino@gmail.com' },
  { id: 3, url: 'https://lingualink-27tx.onrender.com', email: 'rayluzon2253@gmail.com' },
  { id: 4, url: 'https://lingualink-f5v7.onrender.com', email: 'jonathanbahala9827@gmail.com' },
  { id: 5, url: 'https://lingualink-uj74.onrender.com', email: 'michellemiranda99922@gmail.com' },
  { id: 6, url: 'https://lingualink-qk4k.onrender.com', email: 'johnmolly1526@gmail.com' },
  { id: 7, url: 'https://lingualink-dmb7.onrender.com', email: 'kiel77763@gmail.com' }
];

async function testHealthEndpoint(backend) {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Testing backend ${backend.id}: ${backend.url}`);
    
    const response = await fetch(`${backend.url}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const healthData = await response.json();
      console.log(`   ✅ Healthy (${responseTime}ms)`);
      console.log(`   📊 Status: ${healthData.status}`);
      console.log(`   🗄️  Database: ${healthData.database?.status || 'unknown'}`);
      console.log(`   🌍 DeepL: ${healthData.deepl?.status || 'unknown'}`);
      console.log(`   ⏱️  Uptime: ${Math.round(healthData.uptime / 60)}m`);
      
      return {
        id: backend.id,
        healthy: true,
        responseTime,
        data: healthData
      };
    } else {
      console.log(`   ❌ Unhealthy (${response.status}) (${responseTime}ms)`);
      return {
        id: backend.id,
        healthy: false,
        responseTime,
        error: `HTTP ${response.status}`
      };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`   💥 Error (${responseTime}ms): ${error.message}`);
    return {
      id: backend.id,
      healthy: false,
      responseTime,
      error: error.message
    };
  }
}

async function testAllBackends() {
  console.log('🚀 Testing Health Endpoints for All Backend Instances\n');
  console.log('=' .repeat(70));
  
  const results = [];
  
  for (const backend of backends) {
    const result = await testHealthEndpoint(backend);
    results.push(result);
    console.log(''); // Empty line for readability
    
    // Small delay between requests to be nice to servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('=' .repeat(70));
  console.log('📊 SUMMARY:');
  
  const healthyBackends = results.filter(r => r.healthy);
  const unhealthyBackends = results.filter(r => !r.healthy);
  
  console.log(`✅ Healthy backends: ${healthyBackends.length}/${backends.length}`);
  console.log(`❌ Unhealthy backends: ${unhealthyBackends.length}/${backends.length}`);
  
  if (healthyBackends.length > 0) {
    const avgResponseTime = healthyBackends.reduce((sum, b) => sum + b.responseTime, 0) / healthyBackends.length;
    console.log(`⚡ Average response time: ${Math.round(avgResponseTime)}ms`);
    
    const fastestBackend = healthyBackends.reduce((fastest, current) => 
      current.responseTime < fastest.responseTime ? current : fastest
    );
    console.log(`🏆 Fastest backend: Backend ${fastestBackend.id} (${fastestBackend.responseTime}ms)`);
  }
  
  if (unhealthyBackends.length > 0) {
    console.log('\n⚠️  Unhealthy backends:');
    unhealthyBackends.forEach(backend => {
      console.log(`   Backend ${backend.id}: ${backend.error}`);
    });
  }
  
  console.log('\n💡 Multi-Backend System Status:');
  if (healthyBackends.length >= 3) {
    console.log('   🟢 EXCELLENT: Multiple healthy backends available');
  } else if (healthyBackends.length >= 1) {
    console.log('   🟡 GOOD: At least one backend is healthy');
  } else {
    console.log('   🔴 CRITICAL: No healthy backends available');
  }
  
  console.log('\n🎯 Load Balancing Ready:', healthyBackends.length > 1 ? 'YES' : 'NO');
  console.log('🔄 Failover Ready:', healthyBackends.length > 0 ? 'YES' : 'NO');
  console.log('💪 Translation Capacity:', `${healthyBackends.length}x DeepL API limits`);
  
  return results;
}

// Run the test
testAllBackends().catch(console.error);
