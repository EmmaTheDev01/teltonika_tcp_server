// Simple debug script to test AVL packet structure
// Based on official Teltonika documentation example

// Test packet from the official Teltonika documentation example
const testPacket = Buffer.from([
  // Preamble: 0x00000000
  0x00, 0x00, 0x00, 0x00,
  
  // Data Field Length: 0x00000036 (54 bytes)
  0x00, 0x00, 0x00, 0x36,
  
  // IMEI length: 0x0F (15 characters)
  0x0F,
  
  // IMEI: "123456789012345"
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35,
  
  // Codec ID: 0x08
  0x08,
  
  // Number of Data 1: 0x01
  0x01,
  
  // AVL Data:
  // Timestamp: 0x0000016B40D8EA30 (8 bytes)
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
  // N of Total IO: 0x05
  0x05,
  // N1 of One Byte IO: 0x02
  0x02,
  // 1st IO ID: 0x15 (GSM Signal)
  0x15,
  // 1st IO Value: 0x03
  0x03,
  // 2nd IO ID: 0x01 (DIN1)
  0x01,
  // 2nd IO Value: 0x01
  0x01,
  // N2 of Two Bytes IO: 0x01
  0x01,
  // 1st IO ID: 0x42 (External Voltage)
  0x42,
  // 1st IO Value: 0x5E0F
  0x5E, 0x0F,
  // N4 of Four Bytes IO: 0x01
  0x01,
  // 1st IO ID: 0xF1 (Active GSM Operator)
  0xF1,
  // 1st IO Value: 0x0000601A
  0x00, 0x00, 0x60, 0x1A,
  // N8 of Eight Bytes IO: 0x01
  0x01,
  // 1st IO ID: 0x4E (iButton)
  0x4E,
  // 1st IO Value: 0x0000000000000000
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  
  // Number of Data 2: 0x01
  0x01,
  
  // CRC-16: 0x0000C7CF
  0x00, 0x00, 0xC7, 0xCF
]);

console.log('🔍 Analyzing AVL packet structure...');
console.log(`📦 Packet size: ${testPacket.length} bytes`);
console.log(`📦 Packet hex: ${testPacket.toString('hex')}`);

// Manual parsing to verify structure
let offset = 0;

// Check preamble
const preamble = testPacket.readUInt32BE(offset);
console.log(`📍 Preamble: 0x${preamble.toString(16).padStart(8, '0')} (expected: 0x00000000)`);
offset += 4;

// Check data field length
const dataFieldLength = testPacket.readUInt32BE(offset);
console.log(`📍 Data field length: ${dataFieldLength} bytes`);
offset += 4;

// Check IMEI length
const imeiLength = testPacket.readUInt8(offset);
console.log(`📍 IMEI length: ${imeiLength} bytes`);
offset += 1;

// Check IMEI
const imei = testPacket.toString('ascii', offset, offset + imeiLength);
console.log(`📍 IMEI: ${imei}`);
offset += imeiLength;

// Check Codec ID
const codecId = testPacket.readUInt8(offset);
console.log(`📍 Codec ID: 0x${codecId.toString(16).padStart(2, '0')} (expected: 0x08)`);
offset += 1;

// Check Number of Data 1
const numberOfData1 = testPacket.readUInt8(offset);
console.log(`📍 Number of Data 1: ${numberOfData1}`);
offset += 1;

// Check timestamp (8 bytes)
const timestampHigh = testPacket.readUInt32BE(offset);
const timestampLow = testPacket.readUInt32BE(offset + 4);
const timestamp = (timestampHigh * 0x100000000) + timestampLow;
console.log(`📍 Timestamp: ${timestamp} (${new Date(timestamp).toISOString()})`);
offset += 8;

// Check priority
const priority = testPacket.readUInt8(offset);
console.log(`📍 Priority: ${priority}`);
offset += 1;

// Check GPS element (15 bytes)
console.log(`📍 GPS Element at offset ${offset}:`);
const longitude = testPacket.readInt32BE(offset);
const latitude = testPacket.readInt32BE(offset + 4);
const altitude = testPacket.readUInt16BE(offset + 8);
const angle = testPacket.readUInt16BE(offset + 10);
const satellites = testPacket.readUInt8(offset + 12);
const speed = testPacket.readUInt16BE(offset + 13);

console.log(`  - Longitude: ${longitude}`);
console.log(`  - Latitude: ${latitude}`);
console.log(`  - Altitude: ${altitude} meters`);
console.log(`  - Angle: ${angle} degrees`);
console.log(`  - Satellites: ${satellites}`);
console.log(`  - Speed: ${speed} km/h`);
offset += 15;

// Check IO element
console.log(`📍 IO Element at offset ${offset}:`);
const eventIoId = testPacket.readUInt8(offset);
console.log(`  - Event IO ID: ${eventIoId}`);
offset += 1;

const nOfTotalIo = testPacket.readUInt8(offset);
console.log(`  - N of Total IO: ${nOfTotalIo}`);
offset += 1;

const n1OfOneByteIo = testPacket.readUInt8(offset);
console.log(`  - N1 of One Byte IO: ${n1OfOneByteIo}`);
offset += 1;

// Parse 1-byte IO elements
for (let i = 0; i < n1OfOneByteIo; i++) {
  const ioId = testPacket.readUInt8(offset);
  const ioValue = testPacket.readUInt8(offset + 1);
  console.log(`  - 1-byte IO ${i + 1}: ID=${ioId}, Value=${ioValue}`);
  offset += 2;
}

const n2OfTwoBytesIo = testPacket.readUInt8(offset);
console.log(`  - N2 of Two Bytes IO: ${n2OfTwoBytesIo}`);
offset += 1;

// Parse 2-byte IO elements
for (let i = 0; i < n2OfTwoBytesIo; i++) {
  const ioId = testPacket.readUInt8(offset);
  const ioValue = testPacket.readUInt16BE(offset + 1);
  console.log(`  - 2-byte IO ${i + 1}: ID=${ioId}, Value=${ioValue}`);
  offset += 3;
}

const n4OfFourBytesIo = testPacket.readUInt8(offset);
console.log(`  - N4 of Four Bytes IO: ${n4OfFourBytesIo}`);
offset += 1;

// Parse 4-byte IO elements
for (let i = 0; i < n4OfFourBytesIo; i++) {
  const ioId = testPacket.readUInt8(offset);
  const ioValue = testPacket.readUInt32BE(offset + 1);
  console.log(`  - 4-byte IO ${i + 1}: ID=${ioId}, Value=${ioValue}`);
  offset += 5;
}

const n8OfEightBytesIo = testPacket.readUInt8(offset);
console.log(`  - N8 of Eight Bytes IO: ${n8OfEightBytesIo}`);
offset += 1;

// Parse 8-byte IO elements
for (let i = 0; i < n8OfEightBytesIo; i++) {
  const ioId = testPacket.readUInt8(offset);
  const ioValue = testPacket.subarray(offset + 1, offset + 9);
  console.log(`  - 8-byte IO ${i + 1}: ID=${ioId}, Value=${ioValue.toString('hex')}`);
  offset += 9;
}

// Check Number of Data 2
const numberOfData2 = testPacket.readUInt8(offset);
console.log(`📍 Number of Data 2: ${numberOfData2}`);
offset += 1;

// Check CRC-16
const crc = testPacket.readUInt32BE(offset);
console.log(`📍 CRC-16: 0x${crc.toString(16).padStart(8, '0')}`);
offset += 4;

console.log(`📍 Final offset: ${offset} (should equal packet length: ${testPacket.length})`);

if (offset === testPacket.length) {
  console.log('✅ Packet structure is valid!');
} else {
  console.log(`❌ Packet structure error: offset ${offset} != length ${testPacket.length}`);
}
