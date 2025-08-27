import net from 'net';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TCP_HOST = process.env.TCP_HOST || 'rfmntsgps.up.railway.app';
const TCP_PORT = process.env.TCP_PORT || 5000;

// Sample Teltonika AVL packet (simplified for testing)
function createTestAVLPacket(imei = '123456789012345') {
  // This is a simplified test packet - real Teltonika packets are more complex
  const buffer = Buffer.alloc(100); // Increased buffer size
  let offset = 0;

  // Preamble (0x000000FF)
  buffer.writeUInt32BE(0x000000FF, offset);
  offset += 4;

  // Data field length (simplified)
  buffer.writeUInt32BE(30, offset);
  offset += 4;

  // IMEI length
  buffer.writeUInt8(imei.length, offset);
  offset += 1;

  // IMEI
  buffer.write(imei, offset);
  offset += imei.length;

  // Codec ID (8 = Codec 8)
  buffer.writeUInt8(8, offset);
  offset += 1;

  // Number of records (1)
  buffer.writeUInt8(1, offset);
  offset += 1;

  // Timestamp (current time)
  buffer.writeUInt32BE(Math.floor(Date.now() / 1000), offset);
  offset += 4;

  // Priority (0 = Low)
  buffer.writeUInt8(0, offset);
  offset += 1;

  // GPS Element
  // Longitude (example: -122.4194)
  buffer.writeInt32BE(-1224194000, offset);
  offset += 4;

  // Latitude (example: 37.7749)
  buffer.writeInt32BE(377749000, offset);
  offset += 4;

  // Altitude (100 meters)
  buffer.writeUInt16BE(100, offset);
  offset += 2;

  // Angle (45 degrees)
  buffer.writeUInt16BE(45, offset);
  offset += 2;

  // Satellites (8)
  buffer.writeUInt8(8, offset);
  offset += 1;

  // Speed (60 km/h)
  buffer.writeUInt16BE(60, offset);
  offset += 2;

  // Event IO ID
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Number of total IO
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Number of data1 (1-byte IO elements)
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Number of data2 (2-byte IO elements)
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Number of records (should match)
  buffer.writeUInt8(1, offset);
  offset += 1;

  // CRC (simplified - not calculated)
  buffer.writeUInt32BE(0x12345678, offset);
  offset += 4;

  return buffer.slice(0, offset);
}

// Test connection function
function testConnection(testName, packetData, expectedResponse = null) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running test: ${testName}`);
    
    const client = new net.Socket();
    let responseReceived = false;

    client.connect(TCP_PORT, TCP_HOST, () => {
      console.log(`✅ Connected to TCP server at ${TCP_HOST}:${TCP_PORT}`);
      
      // Send test packet
      console.log(`📤 Sending test packet (${packetData.length} bytes)...`);
      client.write(packetData);
    });

    client.on('data', (data) => {
      responseReceived = true;
      console.log(`📥 Received response: ${data.toString('hex')}`);
      
      if (expectedResponse) {
        if (data.equals(expectedResponse)) {
          console.log(`✅ Test passed: Response matches expected`);
        } else {
          console.log(`❌ Test failed: Response doesn't match expected`);
          console.log(`   Expected: ${expectedResponse.toString('hex')}`);
          console.log(`   Received: ${data.toString('hex')}`);
        }
      } else {
        console.log(`✅ Test completed: Received response`);
      }
      
      client.destroy();
    });

    client.on('close', () => {
      console.log(`🔌 Connection closed`);
      resolve(responseReceived);
    });

    client.on('error', (error) => {
      console.error(`❌ Connection error: ${error.message}`);
      reject(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!responseReceived) {
        console.log(`⏰ Test timeout`);
        client.destroy();
        resolve(false);
      }
    }, 5000);
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Teltonika TCP Server Tests');
  console.log(`📍 Target: ${TCP_HOST}:${TCP_PORT}`);
  
  try {
    // Test 1: Valid AVL packet
    const validPacket = createTestAVLPacket('123456789012345');
    await testConnection('Valid AVL Packet', validPacket, Buffer.from([0x01]));

    // Test 2: Different IMEI
    const packet2 = createTestAVLPacket('987654321098765');
    await testConnection('Different IMEI', packet2, Buffer.from([0x01]));

    // Test 3: Invalid packet (too short)
    const invalidPacket = Buffer.from([0x01, 0x02, 0x03]);
    await testConnection('Invalid Packet (Too Short)', invalidPacket, Buffer.from([0x00]));

    // Test 4: Empty packet
    const emptyPacket = Buffer.alloc(0);
    await testConnection('Empty Packet', emptyPacket, Buffer.from([0x00]));

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testConnection, createTestAVLPacket };
