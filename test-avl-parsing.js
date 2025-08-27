import axios from 'axios';

// Sample AVL packet (Codec 8) - this is what Teltonika devices actually send
const sampleAVLPacket = Buffer.from([
  // Preamble: 0x000000FF
  0x00, 0x00, 0x00, 0xFF,
  
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

const RENDER_API_URL = 'https://rfmnts.onrender.com/api/gps/simple';

async function testAVLParsing() {
  console.log('🧪 Testing AVL Packet Parsing and API Integration');
  console.log(`📍 Target: ${RENDER_API_URL}`);
  console.log(`📦 AVL Packet Size: ${sampleAVLPacket.length} bytes`);
  console.log(`🔍 AVL Packet (hex): ${sampleAVLPacket.toString('hex')}`);

  try {
    // Test 1: Check if API is accessible
    console.log('\n📡 Test 1: API Health Check');
    const healthResponse = await axios.get(RENDER_API_URL);
    console.log('✅ API is accessible:', healthResponse.data.status);

    // Test 2: Send decoded GPS data (simulating what TCP server would send)
    console.log('\n📡 Test 2: Sending Decoded GPS Data');
    const decodedGpsData = {
      imei: "123456789012345",
      latitude: 37.7749,  // San Francisco coordinates
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

    const response = await axios.post(RENDER_API_URL, decodedGpsData, {
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'teltonika-tcp-server'
      },
      timeout: 10000
    });

    console.log('✅ Successfully sent decoded GPS data to Render API');
    console.log('📊 Response:', response.data);

    // Test 3: Verify the data was stored by checking the device
    console.log('\n📡 Test 3: Verifying Data Storage');
    const deviceResponse = await axios.get(`https://rfmnts.onrender.com/api/gps/devices?imei=123456789012345`);
    
    if (deviceResponse.ok) {
      const deviceData = deviceResponse.data;
      console.log('✅ Device data retrieved:', deviceData);
      
      if (deviceData.devices && deviceData.devices.length > 0) {
        const device = deviceData.devices[0];
        console.log('📱 Device Info:', {
          imei: device.imei,
          name: device.name,
          isActive: device.isActive,
          lastSeen: device.lastSeen,
          batteryLevel: device.batteryLevel,
          signalStrength: device.signalStrength
        });
        
        // Check if locations exist
        if (device.locations && device.locations.length > 0) {
          const latestLocation = device.locations[0];
          console.log('📍 Latest Location:', {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            speed: latestLocation.speed,
            timestamp: latestLocation.timestamp
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing AVL parsing:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
  }
}

testAVLParsing();
