import net from 'net';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';

// Create a proper Teltonika AVL packet according to official specification
// Based on: https://wiki.teltonika-gps.com/view/Teltonika_AVL_Protocols

const correctAVLPacket = Buffer.from([
  // Preamble: 0x00000000 (4 bytes)
  0x00, 0x00, 0x00, 0x00,
  
  // Data Field Length: 0x0000001C (28 bytes) - from Codec ID to Number of Data 2
  0x00, 0x00, 0x00, 0x1C,
  
  // IMEI length: 0x0F (15 characters)
  0x0F,
  
  // IMEI: "123456789012345" (15 bytes)
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35,
  
  // Codec ID: 0x08 (Codec 8) - START OF DATA FIELD
  0x08,
  
  // Number of Data 1: 0x01 (1 record)
  0x01,
  
  // AVL Data:
  // Timestamp: 0x0000018C (8 bytes - Unix time in milliseconds)
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x8C,
  
  // Priority: 0x00 (Low)
  0x00,
  
  // GPS Element (15 bytes):
  // Longitude: 0x00000000 (4 bytes)
  0x00, 0x00, 0x00, 0x00,
  
  // Latitude: 0x00000000 (4 bytes)
  0x00, 0x00, 0x00, 0x00,
  
  // Altitude: 0x0000 (2 bytes)
  0x00, 0x00,
  
  // Angle: 0x0000 (2 bytes)
  0x00, 0x00,
  
  // Satellites: 0x00 (1 byte)
  0x00,
  
  // Speed: 0x0000 (2 bytes)
  0x00, 0x00,
  
  // IO Element:
  // Event IO ID: 0x00 (1 byte)
  0x00,
  
  // N of Total IO: 0x00 (1 byte)
  0x00,
  
  // N1 of One Byte IO: 0x00 (1 byte)
  0x00,
  
  // N2 of Two Byte IO: 0x00 (1 byte)
  0x00,
  
  // N4 of Four Byte IO: 0x00 (1 byte)
  0x00,
  
  // N8 of Eight Byte IO: 0x00 (1 byte)
  0x00,
  
  // Number of Data 2: 0x01 (1 byte) - must match Number of Data 1 - END OF DATA FIELD
  0x01,
  
  // CRC-16: 0x00000000 (4 bytes) - calculated from Codec ID to Number of Data 2
  0x00, 0x00, 0x00, 0x00
]);

console.log('🎯 Correct Teltonika AVL Packet Test');
console.log('====================================');
console.log(`📦 Packet size: ${correctAVLPacket.length} bytes`);
console.log(`📦 Packet (hex): ${correctAVLPacket.toString('hex')}`);

// Manual parsing to verify packet structure
console.log('\n🔍 Manual Packet Analysis:');
console.log('==========================');

let offset = 0;

// Check preamble
const preamble = correctAVLPacket.readUInt32BE(offset);
console.log(`📍 Preamble: 0x${preamble.toString(16).padStart(8, '0')} (expected: 0x00000000)`);
offset += 4;

// Check data field length
const dataFieldLength = correctAVLPacket.readUInt32BE(offset);
console.log(`📍 Data field length: ${dataFieldLength} bytes`);
offset += 4;

// Check IMEI length
const imeiLength = correctAVLPacket.readUInt8(offset);
console.log(`📍 IMEI length: ${imeiLength} characters`);
offset += 1;

// Check IMEI
const imei = correctAVLPacket.toString('ascii', offset, offset + imeiLength);
console.log(`📍 IMEI: ${imei}`);
offset += imeiLength;

// Check codec ID
const codecId = correctAVLPacket.readUInt8(offset);
console.log(`📍 Codec ID: 0x${codecId.toString(16)} (expected: 0x08)`);
offset += 1;

// Check number of records
const numberOfRecords = correctAVLPacket.readUInt8(offset);
console.log(`📍 Number of records: ${numberOfRecords}`);
offset += 1;

console.log(`📍 Remaining bytes: ${correctAVLPacket.length - offset}`);

// Verify data field length calculation
const dataFieldStart = 4 + 4 + 1 + 15; // preamble + length + imeiLength + imei
const dataFieldEnd = correctAVLPacket.length - 4; // total length - CRC
const actualDataFieldLength = dataFieldEnd - dataFieldStart;
console.log(`📍 Data field starts at byte: ${dataFieldStart}`);
console.log(`📍 Data field ends at byte: ${dataFieldEnd}`);
console.log(`📍 Actual data field length: ${actualDataFieldLength} bytes`);
console.log(`📍 Expected data field length: ${dataFieldLength} bytes`);
console.log(`📍 Match: ${actualDataFieldLength === dataFieldLength ? '✅' : '❌'}`);

// Test with TCP server
console.log('\n📡 Testing with TCP Server:');
console.log('===========================');

const client = new net.Socket();

client.connect(TCP_PORT, TCP_HOST, () => {
  console.log('✅ Connected to TCP server');
  console.log('📤 Sending correct Teltonika AVL packet...');
  client.write(correctAVLPacket);
});

client.on('data', (data) => {
  console.log('📥 Received response:', data.toString('hex'));
  
  if (data.length === 1) {
    if (data[0] === 0x01) {
      console.log('✅ Server sent positive acknowledgment (0x01)');
      console.log('🎉 AVL packet parsing SUCCESS!');
      console.log('🚀 Your TCP server is now working correctly!');
    } else if (data[0] === 0x00) {
      console.log('❌ Server sent negative acknowledgment (0x00)');
      console.log('🔍 Packet parsing failed - check server logs');
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
