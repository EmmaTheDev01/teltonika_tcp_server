import net from 'net';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';

// Exact packet from official Teltonika documentation example
const officialPacket = Buffer.from([
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

console.log('📦 Testing with official Teltonika packet:');
console.log(`📍 Packet size: ${officialPacket.length} bytes`);
console.log(`📍 Packet hex: ${officialPacket.toString('hex')}`);

// Test the packet
const client = new net.Socket();

client.connect(TCP_PORT, TCP_HOST, () => {
  console.log('🔌 Connected to TCP server');
  console.log('📤 Sending official AVL packet...');
  client.write(officialPacket);
});

client.on('data', (data) => {
  console.log(`📥 Received response: ${data.toString('hex')}`);
  
  if (data.length === 4) {
    const recordCount = data.readUInt32BE(0);
    console.log(`✅ Server acknowledged ${recordCount} records`);
  } else if (data.length === 1) {
    const ack = data.readUInt8(0);
    if (ack === 0x01) {
      console.log('✅ Server sent positive acknowledgment (0x01)');
    } else {
      console.log(`❌ Server sent negative acknowledgment (0x${ack.toString(16)})`);
    }
  }
  
  client.destroy();
});

client.on('close', () => {
  console.log('🔌 Connection closed');
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
});
