import { parseTeltonikaAVLPacket, parseAVLRecord, parseGPSElement, parseIOElement } from './server.js';

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

console.log('🔍 Testing AVL packet parsing...');
console.log(`📦 Packet size: ${testPacket.length} bytes`);
console.log(`📦 Packet hex: ${testPacket.toString('hex')}`);

// Test the complete parsing
const result = parseTeltonikaAVLPacket(testPacket);

if (result) {
  console.log('✅ Packet parsed successfully!');
  console.log('📊 Parsed data:', JSON.stringify(result, null, 2));
} else {
  console.log('❌ Packet parsing failed!');
}

// Test individual components
console.log('\n🔍 Testing individual components...');

// Test GPS element parsing
const gpsBuffer = Buffer.from([
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
  0x00, 0x00
]);

const gpsResult = parseGPSElement(gpsBuffer, 0);
console.log('📍 GPS Element parsing:', gpsResult ? '✅ Success' : '❌ Failed');
if (gpsResult) {
  console.log('📍 GPS data:', JSON.stringify(gpsResult.data, null, 2));
}

// Test IO element parsing
const ioBuffer = Buffer.from([
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
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

const ioResult = parseIOElement(ioBuffer, 0);
console.log('📍 IO Element parsing:', ioResult ? '✅ Success' : '❌ Failed');
if (ioResult) {
  console.log('📍 IO data:', JSON.stringify(ioResult.data, null, 2));
}
