import axios from 'axios';

// Configuration
const WEB_APP_API_URL = 'https://rfmnts.onrender.com/api/gps/teltonika';

// Test different data formats that your web API might expect
async function testWebAPIFormats() {
  console.log('🎯 Testing Web API Data Formats');
  console.log('=' .repeat(50));
  
  // Test 1: Simple GPS data with query parameters
  console.log('\n🌐 Test 1: Simple GPS with Query Parameters');
  try {
    const params = {
      imei: '123456789012345',
      latitude: '40.7128',
      longitude: '-74.0060',
      altitude: '10',
      speed: '25',
      heading: '90',
      satellites: '8',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending GET request with query parameters...');
    console.log('📊 Params:', params);
    
    const response = await axios.get(WEB_APP_API_URL, { params });
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
  }
  
  // Test 2: POST with form data
  console.log('\n🌐 Test 2: POST with Form Data');
  try {
    const formData = new URLSearchParams();
    formData.append('imei', '123456789012345');
    formData.append('latitude', '40.7128');
    formData.append('longitude', '-74.0060');
    formData.append('altitude', '10');
    formData.append('speed', '25');
    formData.append('heading', '90');
    formData.append('satellites', '8');
    formData.append('timestamp', new Date().toISOString());
    
    console.log('📤 Sending POST with form data...');
    console.log('📊 Form data:', formData.toString());
    
    const response = await axios.post(WEB_APP_API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
  }
  
  // Test 3: POST with flat JSON structure
  console.log('\n🌐 Test 3: POST with Flat JSON Structure');
  try {
    const flatData = {
      imei: '123456789012345',
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 10,
      speed: 25,
      heading: 90,
      satellites: 8,
      timestamp: new Date().toISOString(),
      accuracy: 5.0,
      batteryLevel: 85,
      signalStrength: 75
    };
    
    console.log('📤 Sending POST with flat JSON...');
    console.log('📊 Data:', JSON.stringify(flatData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, flatData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
  }
  
  // Test 4: POST with nested GPS structure
  console.log('\n🌐 Test 4: POST with Nested GPS Structure');
  try {
    const nestedData = {
      imei: '123456789012345',
      gps: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 10,
        speed: 25,
        heading: 90,
        satellites: 8
      },
      timestamp: new Date().toISOString(),
      accuracy: 5.0,
      batteryLevel: 85,
      signalStrength: 75
    };
    
    console.log('📤 Sending POST with nested GPS structure...');
    console.log('📊 Data:', JSON.stringify(nestedData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, nestedData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
  }
  
  // Test 5: Check API status
  console.log('\n🌐 Test 5: Check API Status');
  try {
    console.log('📤 Sending GET request to check API status...');
    
    const response = await axios.get(WEB_APP_API_URL);
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
  }
}

// Run the tests
testWebAPIFormats().catch(console.error);
<<<<<<< HEAD

=======
>>>>>>> d88f2a0 (Initia commit)
