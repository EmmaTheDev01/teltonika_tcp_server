import axios from 'axios';
import net from 'net';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';
const WEB_APP_API_URL = 'http://localhost:3000/api/gps/teltonika';

// Test 1: Test TCP server with corrected packet format
async function testTCPServerWithCorrectedPacket() {
  console.log('\n🔌 Test 1: TCP Server with Corrected Packet (Official Specification)');
  
  // Create packet that matches the official Teltonika specification
  const correctedPacket = Buffer.from([
    // Preamble: 0x00000000 (OFFICIAL SPECIFICATION)
    0x00, 0x00, 0x00, 0x00,
    
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
    // Timestamp: 0x0000016B40D8EA30 (8 bytes - OFFICIAL SPECIFICATION)
    0x00, 0x00, 0x01, 0x6B, 0x40, 0xD8, 0xEA, 0x30,
    
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
    // N4 of Four Bytes IO: 0x00
    0x00,
    // N8 of Eight Bytes IO: 0x00
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
      console.log('📤 Sending corrected packet with official specification...');
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

// Test 2: Test web API with TCP server format data
async function testWebAPIWithTCPFormat() {
  console.log('\n🌐 Test 2: Web API with TCP Server Format Data');
  
  try {
    const tcpServerData = {
      parsedData: {
        imei: '123456789012345',
        records: [{
          timestamp: Date.now(), // Current timestamp in milliseconds
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
            data2: [{ id: 66, value: 85 }],
            nOfData4: 0,
            data4: [],
            nOfData8: 0,
            data8: []
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

// Test 3: Test web API with raw Teltonika packet (official specification)
async function testWebAPIWithRawPacket() {
  console.log('\n🌐 Test 3: Web API with Raw Teltonika Packet (Official Specification)');
  
  try {
    // Create packet with official specification
    const rawPacket = Buffer.from([
      // Preamble: 0x00000000 (OFFICIAL SPECIFICATION)
      0x00, 0x00, 0x00, 0x00,
      
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
      // Timestamp: 0x0000016B40D8EA30 (8 bytes - OFFICIAL SPECIFICATION)
      0x00, 0x00, 0x01, 0x6B, 0x40, 0xD8, 0xEA, 0x30,
      
      // Priority: 0x01
      0x01,
      
      // GPS Element:
      // Longitude: 0x00000000 (will be converted to 0.0)
      0x00, 0x00, 0x00, 0x00,
      // Latitude: 0x00000000 (will be converted to 0.0)
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
      // N4 of Four Bytes IO: 0x00
      0x00,
      // N8 of Eight Bytes IO: 0x00
      0x00,
      
      // Number of Data 2: 0x01
      0x01,
      
      // CRC: 0x00000000 (placeholder)
      0x00, 0x00, 0x00, 0x00
    ]);
    
    console.log('📤 Sending raw Teltonika packet with official specification...');
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

// Main test function
async function runFinalDataForwardingTest() {
  console.log('🎯 Final Data Forwarding Test - Official Teltonika Specification');
  console.log('=' .repeat(80));
  
  const results = {
    tcpServerCorrected: false,
    webAPITCPFormat: false,
    webAPIRawPacket: false
  };
  
  // Run all tests
  results.tcpServerCorrected = await testTCPServerWithCorrectedPacket();
  results.webAPITCPFormat = await testWebAPIWithTCPFormat();
  results.webAPIRawPacket = await testWebAPIWithRawPacket();
  
  // Summary
  console.log('\n📊 Final Test Results Summary');
  console.log('=' .repeat(80));
  console.log(`✅ TCP Server Corrected Packet Test: ${results.tcpServerCorrected ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Web API TCP Format Test: ${results.webAPITCPFormat ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Web API Raw Packet Test: ${results.webAPIRawPacket ? 'PASS' : 'FAIL'}`);
  
  console.log('\n🔧 Analysis:');
  if (!results.tcpServerCorrected) {
    console.log('❌ TCP server parsing issues - check server configuration');
  }
  if (!results.webAPITCPFormat) {
    console.log('❌ Web API data format issues - check API expectations');
  }
  if (!results.webAPIRawPacket) {
    console.log('❌ Web API raw packet parsing issues - check packet format');
  }
  
  if (results.tcpServerCorrected && results.webAPITCPFormat) {
    console.log('\n🎉 SUCCESS: Data forwarding is working!');
    console.log('✅ TCP server can parse packets correctly');
    console.log('✅ Web API accepts data from TCP server');
    console.log('✅ Your data flow is operational');
  } else if (results.webAPITCPFormat) {
    console.log('\n⚠️  PARTIAL SUCCESS: Web API works, but TCP server needs attention');
    console.log('✅ Web API can receive and process data');
    console.log('❌ TCP server parsing needs to be fixed');
  } else {
    console.log('\n❌ ISSUES DETECTED: Data forwarding needs fixes');
    console.log('🔧 Key issues to address:');
    if (!results.tcpServerCorrected) {
      console.log('  - TCP server packet parsing');
    }
    if (!results.webAPITCPFormat) {
      console.log('  - Web API data format compatibility');
    }
  }
  
  console.log('\n📋 Next Steps:');
  if (results.tcpServerCorrected && results.webAPITCPFormat) {
    console.log('1. ✅ Your system is ready for production');
    console.log('2. ✅ Test with real Teltonika devices');
    console.log('3. ✅ Monitor data flow and performance');
  } else {
    console.log('1. 🔧 Fix identified issues above');
    console.log('2. 🔧 Update your web API route with the corrected specification');
    console.log('3. 🔧 Test again with this script');
  }
}

// Run the tests
runFinalDataForwardingTest().catch(console.error);
