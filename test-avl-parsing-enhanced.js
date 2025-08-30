#!/usr/bin/env node

import net from 'net';
import axios from 'axios';

// Configuration
const TCP_PORT = 5001;
const TCP_HOST = 'localhost';
const WEB_APP_API_URL = 'http://localhost:3000/api/gps/teltonika';

console.log('🧪 Enhanced Teltonika AVL Parsing Test');
console.log('=====================================');
console.log(`📍 TCP Server: ${TCP_HOST}:${TCP_PORT}`);
console.log(`🌐 Web API: ${WEB_APP_API_URL}`);
console.log('');

// Test 1: Test web API directly
async function testWebAPIDirectly() {
  console.log('🔍 Test 1: Testing web API directly...');
  
  try {
    const response = await axios.get(WEB_APP_API_URL);
    console.log('✅ Web API is accessible');
    console.log('📋 Status:', response.status);
    console.log('📄 Response:', response.data);
  } catch (error) {
    console.log('❌ Web API test failed:', error.message);
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📄 Response:', error.response.data);
    }
  }
  console.log('');
}

// Test 2: Test TCP server connection
async function testTCPServerConnection() {
  console.log('🔍 Test 2: Testing TCP server connection...');
  
  return new Promise((resolve) => {
    const client = new net.Socket();
    
    client.connect(TCP_PORT, TCP_HOST, () => {
      console.log('✅ Connected to TCP server');
      client.destroy();
      resolve(true);
    });
    
    client.on('error', (error) => {
      console.log('❌ TCP server connection failed:', error.message);
      resolve(false);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('⏰ TCP connection timeout');
      client.destroy();
      resolve(false);
    }, 5000);
  });
}

// Test 3: Send test AVL packet to TCP server
async function testAVLPacketSending() {
  console.log('🔍 Test 3: Sending test AVL packet to TCP server...');
  
  return new Promise((resolve) => {
    const client = new net.Socket();
    
    // Create a minimal valid AVL packet (Codec 8)
    const imei = '123456789012345';
    const imeiLength = imei.length;
    
    // AVL packet structure:
    // 4 bytes: Preamble (0x00000000)
    // 4 bytes: Data field length
    // 1 byte: IMEI length
    // X bytes: IMEI
    // 1 byte: Codec ID (0x08)
    // 1 byte: Number of records
    // X bytes: AVL records
    // 1 byte: Number of records (should match)
    // 4 bytes: CRC
    
    // Create a simple AVL record
    const timestamp = BigInt(Date.now()); // Current time in milliseconds
    const priority = 1;
    const longitude = Math.floor(25.7617 * 10000000); // Convert to Teltonika format
    const latitude = Math.floor(-80.1918 * 10000000); // Convert to Teltonika format
    const altitude = 10;
    const angle = 90;
    const satellites = 8;
    const speed = 60; // km/h
    const eventIOID = 0;
    const nOfTotalIO = 0;
    const nOfData1 = 0;
    const nOfData2 = 0;
    const nOfData4 = 0;
    const nOfData8 = 0;
    
    // Calculate AVL record size
    const avlRecordSize = 8 + 1 + 4 + 4 + 2 + 2 + 1 + 2 + 1 + 1 + 1 + 1 + 1 + 1; // timestamp + priority + gps + io
    const dataFieldLength = 1 + imeiLength + 1 + 1 + avlRecordSize + 1; // imei length + imei + codec + num records + avl + num records
    const totalPacketSize = 4 + 4 + dataFieldLength + 4; // preamble + data length + data field + crc
    
    const packet = Buffer.alloc(totalPacketSize);
    let offset = 0;
    
    // Preamble
    packet.writeUInt32BE(0x00000000, offset);
    offset += 4;
    
    // Data field length
    packet.writeUInt32BE(dataFieldLength, offset);
    offset += 4;
    
    // IMEI length
    packet.writeUInt8(imeiLength, offset);
    offset += 1;
    
    // IMEI
    packet.write(imei, offset);
    offset += imeiLength;
    
    // Codec ID
    packet.writeUInt8(0x08, offset);
    offset += 1;
    
    // Number of records
    packet.writeUInt8(1, offset);
    offset += 1;
    
    // AVL record
    // Timestamp (8 bytes)
    packet.writeBigUInt64BE(timestamp, offset);
    offset += 8;
    
    // Priority
    packet.writeUInt8(priority, offset);
    offset += 1;
    
    // GPS element
    packet.writeInt32BE(longitude, offset);
    offset += 4;
    packet.writeInt32BE(latitude, offset);
    offset += 4;
    packet.writeUInt16BE(altitude, offset);
    offset += 2;
    packet.writeUInt16BE(angle, offset);
    offset += 2;
    packet.writeUInt8(satellites, offset);
    offset += 1;
    packet.writeUInt16BE(speed, offset);
    offset += 2;
    packet.writeUInt8(eventIOID, offset);
    offset += 1;
    packet.writeUInt8(nOfTotalIO, offset);
    offset += 1;
    packet.writeUInt8(nOfData1, offset);
    offset += 1;
    packet.writeUInt8(nOfData2, offset);
    offset += 1;
    packet.writeUInt8(nOfData4, offset);
    offset += 1;
    packet.writeUInt8(nOfData8, offset);
    offset += 1;
    
    // Number of records (should match)
    packet.writeUInt8(1, offset);
    offset += 1;
    
    // CRC (placeholder - should be calculated properly)
    packet.writeUInt32BE(0x12345678, offset);
    offset += 4;
    
    console.log(`📦 Created AVL packet: ${packet.length} bytes`);
    console.log(`🔍 Packet hex: ${packet.toString('hex').substring(0, 100)}...`);
    
    client.connect(TCP_PORT, TCP_HOST, () => {
      console.log('✅ Connected to TCP server, sending AVL packet...');
      client.write(packet);
      
      // Wait for response
      setTimeout(() => {
        console.log('⏰ Waiting for server response...');
        client.destroy();
        resolve(true);
      }, 2000);
    });
    
    client.on('data', (data) => {
      console.log('📥 Received response from TCP server:', data);
      if (data[0] === 0x01) {
        console.log('✅ Server acknowledged the packet');
      } else {
        console.log('❌ Server rejected the packet');
      }
    });
    
    client.on('error', (error) => {
      console.log('❌ TCP error:', error.message);
      resolve(false);
    });
    
    client.on('close', () => {
      console.log('🔌 TCP connection closed');
      resolve(true);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout');
      client.destroy();
      resolve(false);
    }, 10000);
  });
}

// Test 4: Check if data was stored in database
async function checkDatabaseForData() {
  console.log('🔍 Test 4: Checking database for stored data...');
  
  try {
    // Try to get GPS devices
    const devicesResponse = await axios.get('http://localhost:3000/api/gps/devices');
    console.log('📱 GPS Devices:', devicesResponse.data);
    
    // Try to get GPS locations
    const locationsResponse = await axios.get('http://localhost:3000/api/gps/locations');
    console.log('📍 GPS Locations:', locationsResponse.data);
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📄 Response:', error.response.data);
    }
  }
  console.log('');
}

// Main test function
async function runTests() {
  console.log('🚀 Starting enhanced Teltonika AVL parsing tests...\n');
  
  // Test 1: Web API
  await testWebAPIDirectly();
  
  // Test 2: TCP Server
  const tcpConnected = await testTCPServerConnection();
  
  if (tcpConnected) {
    // Test 3: Send AVL packet
    await testAVLPacketSending();
    
    // Wait a bit for processing
    console.log('⏳ Waiting 3 seconds for data processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Check database
    await checkDatabaseForData();
  } else {
    console.log('❌ Skipping AVL packet test - TCP server not available');
  }
  
  console.log('🏁 Test suite completed');
}

// Run the tests
runTests().catch(console.error);
