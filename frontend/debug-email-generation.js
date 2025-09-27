// Debug script to test email generation
const WORKER_URL = 'https://lingualink-api.stefanjohnmiranda3.workers.dev';

async function testEmailGeneration() {
    console.log('🚀 Testing email generation...');
    
    try {
        const prompt = 'Create a welcome email for new users';
        console.log('📝 Prompt:', prompt);
        console.log('🔗 URL:', `${WORKER_URL}/api/health/generate-email`);
        
        const response = await fetch(`${WORKER_URL}/api/health/generate-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        console.log('📡 Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('✅ Success! Response data:', data);
        
        if (data.status === 'success') {
            console.log('📧 Generated email HTML (first 200 chars):', data.emailHtml.substring(0, 200));
        }
        
    } catch (error) {
        console.error('❌ Fetch error:', error);
    }
}

// Run the test
testEmailGeneration();
