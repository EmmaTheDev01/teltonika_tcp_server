import net from 'net';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';

// Create a proper Teltonika AVL packet according to official specification
// Based on: https://wiki.teltonika-gps.com/view/Teltonika_AVL_Protocols

// Calculate CRC-16/IBM for the data field (Codec ID to Number of Data 2)
function calculateCRC16(buffer) {
  let crc = 0x0000;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i] << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return crc & 0xFFFF;
}

// Create the data field (from Codec ID to Number of Data 2)
const dataField = Buffer.from([
  // Codec ID: 0x08 (Codec 8)
  0x08,
  
  // Number of Data 1: 0x01 (1 record)
  0x01,
  
  // AVL Data:
  // Timestamp: 0x0000016B40D8EA30 (8 bytes, Unix time in milliseconds)
  0x00, 0x00, 0x01, 0x6B, 0x40, 0xD8, 0xEA, 0x30,
  
  // Priority: 0x01 (High)
  0x01,
  
  // GPS Element:
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
  // Event IO ID: 0x01 (1 byte)
  0x01,
  // N of Total IO: 0x03 (1 byte)
  0x03,
  // N1 of One Byte IO: 0x02 (1 byte)
  0x02,
  // 1st IO ID: 0x15 (AVL ID: 21, Name: GSM Signal)
  0x15,
  // 1st IO Value: 0x03 (1 byte)
  0x03,
  // 2nd IO ID: 0x01 (AVL ID: 1, Name: DIN1)
  0x01,
  // 2nd IO Value: 0x01 (1 byte)
  0x01,
  // N2 of Two Bytes IO: 0x01 (1 byte)
  0x01,
  // 1st IO ID: 0x42 (AVL ID: 66, Name: External Voltage)
  0x42,
  // 1st IO Value: 0x5E0F (2 bytes)
  0x5E, 0x0F,
  // N4 of Four Bytes IO: 0x00 (1 byte)
  0x00,
  // N8 of Eight Bytes IO: 0x00 (1 byte)
  0x00,
  
  // Number of Data 2: 0x01 (1 record)
  0x01
]);

// Calculate CRC-16 for the data field
const crc16 = calculateCRC16(dataField);

// Create the complete packet
const correctAVLPacket = Buffer.concat([
  // Preamble: 0x00000000 (4 bytes)
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  
  // Data Field Length: length of dataField (4 bytes)
  Buffer.from([
    (dataField.length >> 24) & 0xFF,
    (dataField.length >> 16) & 0xFF,
    (dataField.length >> 8) & 0xFF,
    dataField.length & 0xFF
  ]),
  
  // IMEI length: 0x0F (15 characters)
  Buffer.from([0x0F]),
  
  // IMEI: "123456789012345" (15 bytes)
  Buffer.from('123456789012345', 'ascii'),
  
  // Data Field
  dataField,
  
  // CRC-16: calculated value (4 bytes, big endian)
  Buffer.from([
    (crc16 >> 24) & 0xFF,
    (crc16 >> 16) & 0xFF,
    (crc16 >> 8) & 0xFF,
    crc16 & 0xFF
  ])
]);

console.log('📦 Created Teltonika AVL packet:');
console.log(`📍 Packet size: ${correctAVLPacket.length} bytes`);
console.log(`📍 Data field length: ${dataField.length} bytes`);
console.log(`📍 CRC-16: 0x${crc16.toString(16).padStart(4, '0')}`);
console.log(`📍 Packet hex: ${correctAVLPacket.toString('hex')}`);

// Test the packet
const client = new net.Socket();

client.connect(TCP_PORT, TCP_HOST, () => {
  console.log('🔌 Connected to TCP server');
  console.log('📤 Sending AVL packet...');
  client.write(correctAVLPacket);
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
