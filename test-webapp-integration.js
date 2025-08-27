import axios from 'axios';

const WEB_APP_API_URL = 'https://rfmnts.onrender.com/api/gps/teltonika';

// Test GPS data in the format your server sends
const testGpsData = {
  imei: '123456789012345',
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
  source: 'teltonika-tcp-server',
  serverInfo: {
    serverId: 'railway-tcp-server',
    version: '1.0.0'
  }
};

async function testWebAppIntegration() {
  console.log('🧪 Testing Web App Integration');
  console.log(`📍 Target: ${WEB_APP_API_URL}`);
  console.log(`📤 Sending test GPS data...`);
  
  try {
    const response = await axios.post(WEB_APP_API_URL, testGpsData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'teltonika-tcp-server',
        'X-Server-ID': 'railway-tcp-server'
      }
    });

    console.log('✅ Success! Web app responded:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
    return true;
  } catch (error) {
    console.log('❌ Error connecting to web app:');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Run the test
testWebAppIntegration().then(success => {
  if (success) {
    console.log('\n🎉 Web app integration test PASSED!');
    console.log('Your Teltonika TCP server can successfully send data to your web app.');
  } else {
    console.log('\n⚠️  Web app integration test FAILED!');
    console.log('Check your web app endpoint and network connectivity.');
  }
  process.exit(success ? 0 : 1);
});
