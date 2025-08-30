import axios from 'axios';

// Configuration
const WEB_APP_API_URL = 'https://rfmnts.onrender.com/api/gps/teltonika';

// Test the exact format your web API expects
async function testWebAPIExactFormat() {
  console.log('🎯 Final Web API Test - Exact Format');
  console.log('=' .repeat(50));
  
  // Test 1: Send data exactly as your TCP server should send it
  console.log('\n🌐 Test 1: TCP Server Format (Exact)');
  try {
    const tcpServerData = {
      parsedData: {
        imei: '123456789012345',
        records: [{
          timestamp: Math.floor(Date.now() / 1000),
          priority: 1,
          gpsElement: {
            longitude: -74.0060,
            latitude: 40.7128,
            altitude: 10,
            angle: 90,
            satellites: 8,
            speed: 25,
            eventIOID: 1,
            nOfTotalIO: 2,
            nOfData1: 1,
            data1: [{ id: 1, value: 1 }],
            nOfData2: 1,
            data2: [{ id: 66, value: 85 }]
          }
        }],
        recordCount: 1,
        codecId: 8
      },
      rawData: 'test-raw-data-hex',
      source: 'teltonika-tcp-server',
      timestamp: new Date().toISOString(),
      serverInfo: {
        serverId: 'tcp-server-1',
        version: '1.0.0'
      }
    };
    
    console.log('📤 Sending TCP server data...');
    console.log('📊 Data:', JSON.stringify(tcpServerData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, tcpServerData, {
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'teltonika-tcp-server'
      }
    });
    
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 2: Send data with source in body only
async function testWebAPIWithSourceInBody() {
  console.log('\n🌐 Test 2: Source in Body Only');
  try {
    const tcpServerData = {
      parsedData: {
        imei: '123456789012345',
        records: [{
          timestamp: Math.floor(Date.now() / 1000),
          priority: 1,
          gpsElement: {
            longitude: -74.0060,
            latitude: 40.7128,
            altitude: 10,
            angle: 90,
            satellites: 8,
            speed: 25,
            eventIOID: 1,
            nOfTotalIO: 2,
            nOfData1: 1,
            data1: [{ id: 1, value: 1 }],
            nOfData2: 1,
            data2: [{ id: 66, value: 85 }]
          }
        }],
        recordCount: 1,
        codecId: 8
      },
      rawData: 'test-raw-data-hex',
      source: 'teltonika-tcp-server',
      timestamp: new Date().toISOString(),
      serverInfo: {
        serverId: 'tcp-server-1',
        version: '1.0.0'
      }
    };
    
    console.log('📤 Sending TCP server data with source in body...');
    console.log('📊 Data:', JSON.stringify(tcpServerData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, tcpServerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 3: Send data with object body (to trigger the object check)
async function testWebAPIWithObjectBody() {
  console.log('\n🌐 Test 3: Object Body Check');
  try {
    const tcpServerData = {
      parsedData: {
        imei: '123456789012345',
        records: [{
          timestamp: Math.floor(Date.now() / 1000),
          priority: 1,
          gpsElement: {
            longitude: -74.0060,
            latitude: 40.7128,
            altitude: 10,
            angle: 90,
            satellites: 8,
            speed: 25,
            eventIOID: 1,
            nOfTotalIO: 2,
            nOfData1: 1,
            data1: [{ id: 1, value: 1 }],
            nOfData2: 1,
            data2: [{ id: 66, value: 85 }]
          }
        }],
        recordCount: 1,
        codecId: 8
      },
      rawData: 'test-raw-data-hex',
      source: 'teltonika-tcp-server',
      timestamp: new Date().toISOString(),
      serverInfo: {
        serverId: 'tcp-server-1',
        version: '1.0.0'
      }
    };
    
    console.log('📤 Sending TCP server data with object body...');
    console.log('📊 Data:', JSON.stringify(tcpServerData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, tcpServerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 4: Check what the API actually expects by looking at the error
async function testWebAPIErrorAnalysis() {
  console.log('\n🌐 Test 4: Error Analysis');
  try {
    // Send minimal data to see what the API expects
    const minimalData = {
      imei: '123456789012345',
      latitude: 40.7128,
      longitude: -74.0060
    };
    
    console.log('📤 Sending minimal data to analyze error...');
    console.log('📊 Data:', JSON.stringify(minimalData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, minimalData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
      console.error('📊 Error status:', error.response.status);
      console.error('📊 Error headers:', error.response.headers);
    }
    return false;
  }
}

// Main test function
async function runFinalTests() {
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false
  };
  
  results.test1 = await testWebAPIExactFormat();
  results.test2 = await testWebAPIWithSourceInBody();
  results.test3 = await testWebAPIWithObjectBody();
  results.test4 = await testWebAPIErrorAnalysis();
  
  console.log('\n📊 Final Test Results');
  console.log('=' .repeat(50));
  console.log(`✅ Test 1 (Exact Format): ${results.test1 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Test 2 (Source in Body): ${results.test2 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Test 3 (Object Body): ${results.test3 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Test 4 (Error Analysis): ${results.test4 ? 'PASS' : 'FAIL'}`);
  
  if (results.test1 || results.test2 || results.test3) {
    console.log('\n🎉 SUCCESS: Found working format!');
  } else {
    console.log('\n⚠️  ISSUES: No working format found');
    console.log('🔧 Next steps:');
    console.log('1. Check web API logs for more details');
    console.log('2. Verify the API endpoint is correct');
    console.log('3. Check if the API is expecting different data structure');
  }
}

// Run the tests
runFinalTests().catch(console.error);

