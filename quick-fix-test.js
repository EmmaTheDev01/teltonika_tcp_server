import net from 'net';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';

// Calculate the correct data field length
// From Codec ID (1 byte) to Number of Data 2 (1 byte) = 31 bytes
const dataFieldLength = 31;

// Fixed Teltonika AVL packet with correct data field length
const fixedAVLPacket = Buffer.from([
  // Preamble: 0x00000000
  0x00, 0x00, 0x00, 0x00,
  
  // Data field length: 0x0000001F (31 bytes) - CORRECTED
  0x00, 0x00, 0x00, 0x1F,
  
  // IMEI length: 0x0F (15 characters)
  0x0F,
  
  // IMEI: "123456789012345"
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35,
  
  // Codec ID: 0x08 (Codec 8) - START OF DATA FIELD
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
  
  // Number of records (should match): 0x01 - END OF DATA FIELD
  0x01,
  
  // CRC: 0x00000000
  0x00, 0x00, 0x00, 0x00
]);

console.log('🔧 Quick Fix Test - Corrected Data Field Length');
console.log('==============================================');
console.log(`📦 Packet size: ${fixedAVLPacket.length} bytes`);
console.log(`📦 Packet (hex): ${fixedAVLPacket.toString('hex')}`);
console.log(`📊 Data field length: ${dataFieldLength} bytes`);

// Verify data field length calculation
let dataFieldStart = 0;
let dataFieldEnd = 0;

// Find start of data field (after IMEI)
dataFieldStart = 4 + 4 + 1 + 15; // preamble + length + imeiLength + imei
console.log(`📍 Data field starts at byte: ${dataFieldStart}`);

// Find end of data field (before CRC)
dataFieldEnd = fixedAVLPacket.length - 4; // total length - CRC
console.log(`📍 Data field ends at byte: ${dataFieldEnd}`);

const actualDataFieldLength = dataFieldEnd - dataFieldStart;
console.log(`📍 Actual data field length: ${actualDataFieldLength} bytes`);
console.log(`📍 Expected data field length: ${dataFieldLength} bytes`);
console.log(`📍 Match: ${actualDataFieldLength === dataFieldLength ? '✅' : '❌'}`);

// Test with TCP server
console.log('\n📡 Testing with TCP Server:');
console.log('===========================');

const client = new net.Socket();

client.connect(TCP_PORT, TCP_HOST, () => {
  console.log('✅ Connected to TCP server');
  console.log('📤 Sending fixed AVL packet...');
  client.write(fixedAVLPacket);
});

client.on('data', (data) => {
  console.log('📥 Received response:', data.toString('hex'));
  
  if (data.length === 1) {
    if (data[0] === 0x01) {
      console.log('✅ Server sent positive acknowledgment (0x01)');
      console.log('🎉 AVL packet parsing SUCCESS!');
    } else if (data[0] === 0x00) {
      console.log('❌ Server sent negative acknowledgment (0x00)');
      console.log('🔍 Still need to debug parsing issues');
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
