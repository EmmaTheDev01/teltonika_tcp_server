import axios from 'axios';

// Configuration
const WEB_APP_API_URL = 'https://rfmnts.onrender.com/api/gps/teltonika';

// Test 1: Send raw Teltonika AVL packet (binary data)
async function testRawAVLPacket() {
  console.log('\n🌐 Test 1: Raw Teltonika AVL Packet (Binary)');
  
  try {
    // Create a valid Teltonika AVL packet (using your API's expected preamble)
    const rawPacket = Buffer.from([
      // Preamble: 0x000000FF (your API expects this)
      0x00, 0x00, 0x00, 0xFF,
      
      // Data Field Length: 0x0000001B (27 bytes)
      0x00, 0x00, 0x00, 0x1B,
      
      // IMEI length: 0x0F (15 characters)
      0x0F,
      
      // IMEI: "123456789012345"
      0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35,
      
      // Codec ID: 0x08
      0x08,
      
      // Number of Data 1: 0x01
      0x01,
      
      // AVL Data:
      // Timestamp: 0x0000016B40D8EA30 (4 bytes - your API expects 4-byte timestamp)
      0x00, 0x01, 0x6B, 0x40,
      
      // Priority: 0x01
      0x01,
      
      // GPS Element:
      // Longitude: 0x00000000 (will be converted to 0.0 by your API)
      0x00, 0x00, 0x00, 0x00,
      // Latitude: 0x00000000 (will be converted to 0.0 by your API)
      0x00, 0x00, 0x00, 0x00,
      // Altitude: 0x0000
      0x00, 0x00,
      // Angle: 0x0000
      0x00, 0x00,
      // Satellites: 0x00
      0x00,
      // Speed: 0x0000
      0x00, 0x00,
      
      // IO Element:
      // Event IO ID: 0x01
      0x01,
      // N of Total IO: 0x01
      0x01,
      // N1 of One Byte IO: 0x01
      0x01,
      // 1st IO ID: 0x01 (DIN1)
      0x01,
      // 1st IO Value: 0x01
      0x01,
      // N2 of Two Bytes IO: 0x00
      0x00,
      
      // Number of Data 2: 0x01
      0x01,
      
      // CRC: 0x00000000 (placeholder)
      0x00, 0x00, 0x00, 0x00
    ]);
    
    console.log('📤 Sending raw Teltonika AVL packet...');
    console.log(`📦 Packet size: ${rawPacket.length} bytes`);
    console.log(`📦 Packet hex: ${rawPacket.toString('hex')}`);
    
    const response = await axios.post(WEB_APP_API_URL, rawPacket, {
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
    
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Raw AVL packet test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 2: Send JSON data with TCP server source header
async function testJSONWithTCPSource() {
  console.log('\n🌐 Test 2: JSON with TCP Server Source Header');
  
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
    
    console.log('📤 Sending JSON with TCP server source header...');
    console.log('📊 Data structure:', JSON.stringify(tcpServerData, null, 2));
    
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
    console.error('❌ JSON with TCP source test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 3: Send JSON data with TCP server source in body
async function testJSONWithTCPSourceInBody() {
  console.log('\n🌐 Test 3: JSON with TCP Server Source in Body');
  
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
    
    console.log('📤 Sending JSON with TCP server source in body...');
    console.log('📊 Data structure:', JSON.stringify(tcpServerData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, tcpServerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ JSON with TCP source in body test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Main test function
async function runCorrectFormatTests() {
  console.log('🎯 Testing Correct Web API Data Formats');
  console.log('=' .repeat(60));
  
  const results = {
    rawAVLPacket: false,
    jsonWithTCPSource: false,
    jsonWithTCPSourceInBody: false
  };
  
  // Run all tests
  results.rawAVLPacket = await testRawAVLPacket();
  results.jsonWithTCPSource = await testJSONWithTCPSource();
  results.jsonWithTCPSourceInBody = await testJSONWithTCPSourceInBody();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Raw AVL Packet Test: ${results.rawAVLPacket ? 'PASS' : 'FAIL'}`);
  console.log(`✅ JSON with TCP Source Header: ${results.jsonWithTCPSource ? 'PASS' : 'FAIL'}`);
  console.log(`✅ JSON with TCP Source in Body: ${results.jsonWithTCPSourceInBody ? 'PASS' : 'FAIL'}`);
  
  console.log('\n🔧 Analysis:');
  if (results.rawAVLPacket) {
    console.log('✅ Web API accepts raw Teltonika AVL packets');
  }
  if (results.jsonWithTCPSource || results.jsonWithTCPSourceInBody) {
    console.log('✅ Web API accepts JSON from TCP server');
  }
  
  if (results.rawAVLPacket || results.jsonWithTCPSource || results.jsonWithTCPSourceInBody) {
    console.log('\n🎉 SUCCESS: Found working data format!');
    console.log('✅ Your web API is accessible and accepting data');
  } else {
    console.log('\n⚠️  ISSUES: No working data format found');
    console.log('❌ Check web API configuration and data format expectations');
  }
}

// Run the tests
runCorrectFormatTests().catch(console.error);

