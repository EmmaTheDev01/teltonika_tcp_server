import axios from 'axios';

const RENDER_API_URL = 'https://rfmnts.onrender.com/api/gps/simple';

async function testRenderAPI() {
  console.log('🧪 Testing Render API endpoint...');
  console.log(`📍 Target: ${RENDER_API_URL}`);

  try {
    // Test 1: Check if API is accessible
    console.log('\n📡 Test 1: API Health Check');
    const healthResponse = await axios.get(RENDER_API_URL);
    console.log('✅ API is accessible:', healthResponse.data.status);

    // Test 2: Send test GPS data
    console.log('\n📡 Test 2: Sending Test GPS Data');
    const testData = {
      imei: "123456789012345",
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 100,
      speed: 60,
      heading: 45,
      satellites: 8,
      timestamp: new Date().toISOString(),
      accuracy: 5.0,
      batteryLevel: 85,
      signalStrength: 90,
      source: "teltonika-tcp-server",
      serverInfo: {
        serverId: "test-server",
        version: "1.0.0"
      }
    };

    const response = await axios.post(RENDER_API_URL, testData, {
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'teltonika-tcp-server'
      },
      timeout: 10000
    });

    console.log('✅ Successfully sent data to Render API');
    console.log('📊 Response:', response.data);

  } catch (error) {
    console.error('❌ Error testing Render API:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
  }
}

testRenderAPI();
