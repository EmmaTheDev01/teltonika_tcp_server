import net from 'net';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';

// Corrected Teltonika AVL packet with proper timestamp format
const correctedAVLPacket = Buffer.from([
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
  // Timestamp: 0x0000018C (4 bytes, Unix timestamp)
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

console.log('🔍 Corrected AVL Packet Test');
console.log('============================');
console.log(`📦 Packet size: ${correctedAVLPacket.length} bytes`);
console.log(`📦 Packet (hex): ${correctedAVLPacket.toString('hex')}`);

// Manual parsing to debug
console.log('\n🔍 Manual Packet Analysis:');
console.log('==========================');

let offset = 0;

// Check preamble
const preamble = correctedAVLPacket.readUInt32BE(offset);
console.log(`📍 Preamble: 0x${preamble.toString(16).padStart(8, '0')} (expected: 0x00000000)`);
offset += 4;

// Check data field length
const dataFieldLength = correctedAVLPacket.readUInt32BE(offset);
console.log(`📍 Data field length: ${dataFieldLength} bytes`);
offset += 4;

// Check IMEI length
const imeiLength = correctedAVLPacket.readUInt8(offset);
console.log(`📍 IMEI length: ${imeiLength} characters`);
offset += 1;

// Check IMEI
const imei = correctedAVLPacket.toString('ascii', offset, offset + imeiLength);
console.log(`📍 IMEI: ${imei}`);
offset += imeiLength;

// Check codec ID
const codecId = correctedAVLPacket.readUInt8(offset);
console.log(`📍 Codec ID: 0x${codecId.toString(16)} (expected: 0x08)`);
offset += 1;

// Check number of records
const numberOfRecords = correctedAVLPacket.readUInt8(offset);
console.log(`📍 Number of records: ${numberOfRecords}`);
offset += 1;

console.log(`📍 Remaining bytes: ${correctedAVLPacket.length - offset}`);

// Test with TCP server
console.log('\n📡 Testing with TCP Server:');
console.log('===========================');

const client = new net.Socket();

client.connect(TCP_PORT, TCP_HOST, () => {
  console.log('✅ Connected to TCP server');
  console.log('📤 Sending corrected AVL packet...');
  client.write(correctedAVLPacket);
});

client.on('data', (data) => {
  console.log('📥 Received response:', data.toString('hex'));
  
  if (data.length === 1) {
    if (data[0] === 0x01) {
      console.log('✅ Server sent positive acknowledgment (0x01)');
    } else if (data[0] === 0x00) {
      console.log('❌ Server sent negative acknowledgment (0x00)');
    } else {
      console.log('⚠️  Server sent unknown response:', data[0]);
    }
  }
  
  client.destroy();
});

client.on('error', (error) => {
  console.log('❌ Connection error:', error.message);
});

client.on('close', () => {
  console.log('🔌 Connection closed');
});
