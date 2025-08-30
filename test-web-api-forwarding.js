import net from 'net';
import axios from 'axios';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';
<<<<<<< HEAD
const WEB_APP_API_URL = 'https://rfmnts.onrender.com/api/gps/teltonika';
=======
const WEB_APP_API_URL = 'http://localhost:3000/api/gps/teltonika';
>>>>>>> d88f2a0 (Initia commit)

// Test 1: Test web API directly with simple GPS data
async function testWebAPIDirectly() {
  console.log('\n🌐 Test 1: Direct Web API Test');
  
  try {
    const simpleGpsData = {
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
      signalStrength: 75,
      source: 'teltonika-tcp-server'
    };
    
    console.log('📤 Sending simple GPS data to web API...');
    console.log('📊 Data:', JSON.stringify(simpleGpsData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, simpleGpsData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'teltonika-tcp-server'
      }
    });
    
    console.log(`✅ Web API response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Web API direct test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 2: Test web API with TCP server format data
async function testWebAPIWithTCPFormat() {
  console.log('\n🌐 Test 2: Web API with TCP Server Format');
  
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
    
    console.log('📤 Sending TCP server format data to web API...');
    console.log('📊 Data structure:', JSON.stringify(tcpServerData, null, 2));
    
    const response = await axios.post(WEB_APP_API_URL, tcpServerData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'teltonika-tcp-server'
      }
    });
    
    console.log(`✅ Web API response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Web API TCP format test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 3: Test web API with raw Teltonika packet (using your API's expected preamble)
async function testWebAPIWithRawPacket() {
  console.log('\n🌐 Test 3: Web API with Raw Teltonika Packet');
  
  try {
    // Create packet with your API's expected preamble (0x000000FF)
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
    
    console.log('📤 Sending raw Teltonika packet to web API...');
    console.log(`📦 Packet size: ${rawPacket.length} bytes`);
    console.log(`📦 Packet hex: ${rawPacket.toString('hex')}`);
    
    const response = await axios.post(WEB_APP_API_URL, rawPacket, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
    
    console.log(`✅ Web API response: ${response.status} ${response.statusText}`);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Web API raw packet test failed:', error.message);
    if (error.response) {
      console.error('📊 Error response:', error.response.data);
    }
    return false;
  }
}

// Test 4: Test TCP server with corrected packet format
async function testTCPServerWithCorrectedPacket() {
  console.log('\n🔌 Test 4: TCP Server with Corrected Packet');
  
  // Create packet that matches your web API's expectations
  const correctedPacket = Buffer.from([
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
    // Longitude: 0x00000000
    0x00, 0x00, 0x00, 0x00,
    // Latitude: 0x00000000
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
  
  return new Promise((resolve) => {
    const client = new net.Socket();
    
    client.connect(TCP_PORT, TCP_HOST, () => {
      console.log('✅ Connected to TCP server');
      console.log('📤 Sending corrected packet...');
      client.write(correctedPacket);
    });
    
    client.on('data', (data) => {
      console.log(`📥 Received response: ${data.toString('hex')}`);
      
      let ack = 0x00;
      if (data.length === 4) {
        const recordCount = data.readUInt32BE(0);
        console.log(`✅ Server acknowledged ${recordCount} records`);
        ack = 0x01; // Success
      } else if (data.length === 1) {
        ack = data.readUInt8(0);
        if (ack === 0x01) {
          console.log('✅ Server sent positive acknowledgment (0x01)');
        } else {
          console.log(`❌ Server sent negative acknowledgment (0x${ack.toString(16)})`);
        }
      }
      
      client.destroy();
      resolve(ack === 0x01);
    });
    
    client.on('close', () => {
      console.log('🔌 TCP connection closed');
    });
    
    client.on('error', (err) => {
      console.error('❌ TCP connection error:', err.message);
      resolve(false);
    });
  });
}

// Main test function
async function runAllTests() {
  console.log('🎯 Comprehensive Web API Data Forwarding Test');
  console.log('=' .repeat(60));
  
  const results = {
    webAPIDirect: false,
    webAPITCPFormat: false,
    webAPIRawPacket: false,
    tcpServerCorrected: false
  };
  
  // Run all tests
  results.webAPIDirect = await testWebAPIDirectly();
  results.webAPITCPFormat = await testWebAPIWithTCPFormat();
  results.webAPIRawPacket = await testWebAPIWithRawPacket();
  results.tcpServerCorrected = await testTCPServerWithCorrectedPacket();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Direct Web API Test: ${results.webAPIDirect ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Web API TCP Format Test: ${results.webAPITCPFormat ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Web API Raw Packet Test: ${results.webAPIRawPacket ? 'PASS' : 'FAIL'}`);
  console.log(`✅ TCP Server Corrected Packet Test: ${results.tcpServerCorrected ? 'PASS' : 'FAIL'}`);
  
  console.log('\n🔧 Issues Found:');
  if (!results.webAPIDirect) {
    console.log('❌ Web API connectivity issues - check network/firewall');
  }
  if (!results.webAPITCPFormat) {
    console.log('❌ Web API data format issues - check API expectations');
  }
  if (!results.webAPIRawPacket) {
    console.log('❌ Web API raw packet parsing issues - check packet format');
  }
  if (!results.tcpServerCorrected) {
    console.log('❌ TCP server parsing issues - check server configuration');
  }
  
  if (results.webAPIDirect && results.webAPITCPFormat && results.tcpServerCorrected) {
    console.log('\n🎉 SUCCESS: Data forwarding should be working!');
    console.log('✅ Web API is accessible');
    console.log('✅ Data format is compatible');
    console.log('✅ TCP server can parse packets');
  } else {
    console.log('\n⚠️  ISSUES DETECTED: Data forwarding needs fixes');
  }
}

// Run the tests
runAllTests().catch(console.error);
