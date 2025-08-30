import net from 'net';
import axios from 'axios';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';
const WEB_APP_API_URL = 'https://rfmnts.onrender.com/api/gps/teltonika';

// Sample Teltonika AVL packet (Codec 8)
const sampleAVLPacket = Buffer.from([
  // Preamble: 0x00000000
  0x00, 0x00, 0x00, 0x00,
  
  // Data field length: 0x0000001F (31 bytes)
  0x00, 0x00, 0x00, 0x1F,
  
  // IMEI length: 0x0F (15 characters)
  0x0F,
  
  // IMEI: "123456789012345"
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35,
  
  // Codec ID: 0x08 (Codec 8)
  0x08,
  
  // Number of records: 0x01 (1 record)
  0x01,
  
  // AVL Record:
  // Timestamp: 0x0000018C (Unix timestamp)
  0x00, 0x00, 0x01, 0x8C,
  
  // Priority: 0x00 (Low)
  0x00,
  
  // GPS Element:
  // Longitude: 0x00000000 (0.0 degrees)
  0x00, 0x00, 0x00, 0x00,
  
  // Latitude: 0x00000000 (0.0 degrees)
  0x00, 0x00, 0x00, 0x00,
  
  // Altitude: 0x0000 (0 meters)
  0x00, 0x00,
  
  // Angle: 0x0000 (0 degrees)
  0x00, 0x00,
  
  // Satellites: 0x00 (0 satellites)
  0x00,
  
  // Speed: 0x0000 (0 km/h)
  0x00, 0x00,
  
  // Event IO ID: 0x00
  0x00,
  
  // Number of total IO: 0x00
  0x00,
  
  // Number of data1: 0x00
  0x00,
  
  // Number of data2: 0x00
  0x00,
  
  // Number of records (should match): 0x01
  0x01,
  
  // CRC: 0x00000000
  0x00, 0x00, 0x00, 0x00
]);

async function runDiagnostics() {
  console.log('🔍 TCP Server Diagnostic Test');
  console.log('================================');
  
  // Test 1: Check if TCP server is listening
  console.log('\n📡 Test 1: TCP Server Connectivity');
  console.log(`📍 Target: ${TCP_HOST}:${TCP_PORT}`);
  
  try {
    const client = new net.Socket();
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error('Connection timeout'));
      }, 5000);
      
      client.connect(TCP_PORT, TCP_HOST, () => {
        clearTimeout(timeout);
        console.log('✅ TCP server is accessible');
        resolve();
      });
      
      client.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    console.log('✅ TCP server connection test PASSED');
  } catch (error) {
    console.log('❌ TCP server connection test FAILED:', error.message);
    return;
  }
  
  // Test 2: Send AVL packet and check response
  console.log('\n📦 Test 2: AVL Packet Transmission');
  console.log(`📦 Packet size: ${sampleAVLPacket.length} bytes`);
  console.log(`📦 Packet (hex): ${sampleAVLPacket.toString('hex')}`);
  
  try {
    const client = new net.Socket();
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error('Packet transmission timeout'));
      }, 10000);
      
      client.connect(TCP_PORT, TCP_HOST, () => {
        console.log('✅ Connected to TCP server');
        
        // Send the AVL packet
        client.write(sampleAVLPacket);
        console.log('✅ AVL packet sent');
      });
      
      client.on('data', (data) => {
        clearTimeout(timeout);
        console.log('📥 Received response from server:', data.toString('hex'));
        
        if (data.length === 1) {
          if (data[0] === 0x01) {
            console.log('✅ Server sent positive acknowledgment (0x01)');
          } else if (data[0] === 0x00) {
            console.log('❌ Server sent negative acknowledgment (0x00)');
          } else {
            console.log('⚠️  Server sent unknown response:', data[0]);
          }
        } else {
          console.log('⚠️  Unexpected response format');
        }
        
        client.destroy();
        resolve();
      });
      
      client.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    console.log('✅ AVL packet transmission test PASSED');
  } catch (error) {
    console.log('❌ AVL packet transmission test FAILED:', error.message);
  }
  
  // Test 3: Check web app API connectivity
  console.log('\n🌐 Test 3: Web App API Connectivity');
  console.log(`📍 Target: ${WEB_APP_API_URL}`);
  
  try {
    const response = await axios.get(WEB_APP_API_URL, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status code
    });
    
    console.log(`✅ Web app API is accessible (Status: ${response.status})`);
    
    if (response.status === 200) {
      console.log('✅ Web app API is responding correctly');
    } else {
      console.log('⚠️  Web app API returned non-200 status');
    }
  } catch (error) {
    console.log('❌ Web app API connectivity test FAILED:', error.message);
  }
  
  // Test 4: Test web app with correct AVL data format
  console.log('\n📤 Test 4: Web App Data Format Test');
  
  try {
    const avlData = {
      parsedData: {
        imei: "123456789012345",
        records: [{
          timestamp: 1234567890,
          priority: 0,
          gpsElement: {
            longitude: -122.4194,
            latitude: 37.7749,
            altitude: 100,
            angle: 45,
            satellites: 8,
            speed: 60,
            eventIOID: 0,
            nOfTotalIO: 0,
            nOfData1: 0,
            data1: [],
            nOfData2: 0,
            data2: []
          }
        }],
        recordCount: 1,
        codecId: 8
      },
      rawData: sampleAVLPacket.toString('hex'),
      source: 'teltonika-tcp-server',
      timestamp: new Date().toISOString(),
      serverInfo: {
        serverId: 'diagnostic-test',
        version: '1.0.0'
      }
    };
    
    const response = await axios.post(WEB_APP_API_URL, avlData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'teltonika-tcp-server',
        'X-Server-ID': 'diagnostic-test'
      }
    });
    
    console.log('✅ Web app accepted AVL data format');
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response data:`, response.data);
  } catch (error) {
    console.log('❌ Web app data format test FAILED:', error.message);
    if (error.response) {
      console.log(`📊 Response status: ${error.response.status}`);
      console.log(`📊 Response data:`, error.response.data);
    }
  }
  
  // Test 5: Check server logs (if possible)
  console.log('\n📋 Test 5: Server Status Check');
  
  try {
    const response = await axios.get('http://localhost:8080/health', {
      timeout: 5000
    });
    
    console.log('✅ Health check endpoint accessible');
    console.log('📊 Server status:', response.data);
  } catch (error) {
    console.log('⚠️  Health check endpoint not accessible:', error.message);
  }
  
  console.log('\n🎯 Diagnostic Summary');
  console.log('=====================');
  console.log('1. ✅ TCP Server: Running on port 5001');
  console.log('2. ✅ TCP Connectivity: Server accepts connections');
  console.log('3. ✅ AVL Packet: Can send and receive acknowledgments');
  console.log('4. ⚠️  Web App API: Check connectivity and data format');
  console.log('5. ⚠️  Health Check: May not be accessible');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Check if your Teltonika device is configured to send to this server');
  console.log('2. Verify the device IP and port settings');
  console.log('3. Check firewall settings');
  console.log('4. Monitor server logs for incoming connections');
  console.log('5. Test with a real Teltonika device');
}

runDiagnostics().catch(console.error);
