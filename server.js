import net from 'net';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - All from environment variables
const TCP_PORT = parseInt(process.env.TCP_PORT) || 5001;
const TCP_HOST = process.env.TCP_HOST || '0.0.0.0';
const WEB_APP_API_URL = process.env.WEB_APP_API_URL || 'http://rfmnts.onrender.com/api/gps/teltonika';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const ENABLE_DEBUG_LOGGING = process.env.ENABLE_DEBUG_LOGGING === 'true';
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 100;
const CONNECTION_TIMEOUT = parseInt(process.env.CONNECTION_TIMEOUT) || 30000;

// Validate critical environment variables
if (!process.env.WEB_APP_API_URL) {
  console.warn('⚠️  WARNING: WEB_APP_API_URL not set');
}

if (TCP_PORT < 1 || TCP_PORT > 65535) {
  console.error('❌ ERROR: Invalid TCP_PORT value. Must be between 1 and 65535');
  process.exit(1);
}

// Teltonika protocol constants
const TELTONIKA_PREAMBLE = 0x00000000; // Official specification
const TELTONIKA_PREAMBLE_ALT = 0x000000FF; // Alternative format (your web API expects this)

// Connection tracking
const connections = new Map();
let connectionCount = 0;
let totalPacketsReceived = 0;
let totalPacketsProcessed = 0;
let totalPacketsFailed = 0;

// Extract battery level from IO data
function extractBatteryLevel(record) {
  try {
    // Look for battery level in data1 (1-byte IO elements)
    const batteryData = record.gpsElement.data1.find(item => 
      item.id === 67 || // Common battery level IO ID
      item.id === 68    // Alternative battery level IO ID
    );
    
    if (batteryData) {
      return batteryData.value;
    }

    // Look in data2 (2-byte IO elements) if not found in data1
    const batteryData2 = record.gpsElement.data2.find(item => 
      item.id === 67 || 
      item.id === 68
    );
    
    if (batteryData2) {
      return batteryData2.value;
    }

    return null;
  } catch (error) {
    console.error('Error extracting battery level:', error);
    return null;
  }
}

// Extract signal strength from IO data
function extractSignalStrength(record) {
  try {
    // Look for signal strength in data1 (1-byte IO elements)
    const signalData = record.gpsElement.data1.find(item => 
      item.id === 66 || // Common signal strength IO ID
      item.id === 69    // Alternative signal strength IO ID
    );
    
    if (signalData) {
      return signalData.value;
    }

    // Look in data2 (2-byte IO elements) if not found in data1
    const signalData2 = record.gpsElement.data2.find(item => 
      item.id === 66 || 
      item.id === 69
    );
    
    if (signalData2) {
      return signalData2.value;
    }

    return null;
  } catch (error) {
    console.error('Error extracting signal strength:', error);
    return null;
  }
}

// Logging utility
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (level === 'error') {
    console.error(logMessage, data || '');
  } else if (level === 'warn') {
    console.warn(logMessage, data || '');
  } else if (level === 'debug' && ENABLE_DEBUG_LOGGING) {
    console.log(logMessage, data || '');
  } else if (level === 'info' || level === 'log') {
    console.log(logMessage, data || '');
  }
}

// Parse Teltonika AVL packet from buffer
function parseTeltonikaAVLPacket(buffer) {
  try {
    let offset = 0;

    // Check if buffer is long enough for basic packet structure
    if (buffer.length < 12) { // Minimum: 4 (preamble) + 4 (data length) + 1 (codec) + 1 (num data) + 1 (num data 2) + 4 (crc)
      log('error', 'Buffer too short for Teltonika packet', { length: buffer.length });
      return null;
    }

    // Check preamble (support both official and alternative formats)
    const preamble = buffer.readUInt32BE(offset);
    if (preamble !== TELTONIKA_PREAMBLE && preamble !== TELTONIKA_PREAMBLE_ALT) {
      log('error', 'Invalid Teltonika preamble', { 
        received: preamble.toString(16), 
        expected: `${TELTONIKA_PREAMBLE.toString(16)} or ${TELTONIKA_PREAMBLE_ALT.toString(16)}`
      });
      return null;
    }
    
    log('debug', 'Preamble check passed', { 
      received: preamble.toString(16),
      isOfficial: preamble === TELTONIKA_PREAMBLE,
      isAlternative: preamble === TELTONIKA_PREAMBLE_ALT
    });
    offset += 4;

    // Read data field length
    const dataFieldLength = buffer.readUInt32BE(offset);
    log('debug', 'Data field length', { dataFieldLength });
    offset += 4;

    // Calculate expected total packet size
    const expectedPacketSize = 4 + 4 + dataFieldLength + 4; // preamble + data length + data field + crc
    if (buffer.length < expectedPacketSize) {
      log('error', 'Buffer too short for declared data field length', { 
        bufferLength: buffer.length, 
        expectedPacketSize, 
        dataFieldLength 
      });
      return null;
    }

    // Read IMEI length
    if (offset >= buffer.length) {
      log('error', 'Buffer too short for IMEI length', { offset, bufferLength: buffer.length });
      return null;
    }
    const imeiLength = buffer.readUInt8(offset);
    offset += 1;

    // Read IMEI
    if (offset + imeiLength > buffer.length) {
      log('error', 'Buffer too short for IMEI', { offset, imeiLength, bufferLength: buffer.length });
      return null;
    }
    const imei = buffer.toString('ascii', offset, offset + imeiLength);
    offset += imeiLength;

    // Read Codec ID
    if (offset >= buffer.length) {
      log('error', 'Buffer too short for Codec ID', { offset, bufferLength: buffer.length });
      return null;
    }
    const codecId = buffer.readUInt8(offset);
    offset += 1;

    // Read Number of Data 1
    if (offset >= buffer.length) {
      log('error', 'Buffer too short for Number of Data 1', { offset, bufferLength: buffer.length });
      return null;
    }
    const numberOfData1 = buffer.readUInt8(offset);
    offset += 1;

    // Parse AVL records
    const records = [];
    for (let i = 0; i < numberOfData1; i++) {
      const record = parseAVLRecord(buffer, offset);
      if (!record) {
        log('error', 'Failed to parse AVL record', { recordIndex: i });
        return null;
      }
      records.push(record);
      offset = record.nextOffset;
    }

    // Read Number of Data 2
    if (offset >= buffer.length) {
      log('error', 'Buffer too short for Number of Data 2', { offset, bufferLength: buffer.length });
      return null;
    }
    const numberOfData2 = buffer.readUInt8(offset);
    offset += 1;

    // Verify Number of Data 1 equals Number of Data 2
    if (numberOfData1 !== numberOfData2) {
      log('error', 'Number of Data 1 does not match Number of Data 2', { 
        numberOfData1, 
        numberOfData2 
      });
      return null;
    }

    // Read CRC-16 (4 bytes)
    if (offset + 4 > buffer.length) {
      log('error', 'Buffer too short for CRC', { offset, bufferLength: buffer.length });
      return null;
    }
    const crc = buffer.readUInt32BE(offset);
    offset += 4;

    // TODO: Verify CRC-16 calculation (optional for now)
    log('debug', 'CRC-16 value', { crc: crc.toString(16) });

    return {
      imei,
      codecId,
      recordCount: numberOfData1,
      records
    };

  } catch (error) {
    log('error', 'Error parsing Teltonika AVL packet', { error: error.message });
    return null;
  }
}

// Parse individual AVL record
function parseAVLRecord(buffer, offset) {
  try {
    const startOffset = offset;

    // Read timestamp (support both 4-byte and 8-byte formats)
    if (offset + 4 > buffer.length) {
      log('error', 'Buffer too short for timestamp', { offset, bufferLength: buffer.length });
      return null;
    }
    
    // Try to read as 8-byte timestamp first (official specification)
    let timestamp;
    if (offset + 8 <= buffer.length) {
      const timestampHigh = buffer.readUInt32BE(offset);
      const timestampLow = buffer.readUInt32BE(offset + 4);
      timestamp = (timestampHigh * 0x100000000) + timestampLow;
      offset += 8;
      log('debug', 'Using 8-byte timestamp', { timestamp });
    } else {
      // Fall back to 4-byte timestamp (your web API format)
      timestamp = buffer.readUInt32BE(offset);
      offset += 4;
      log('debug', 'Using 4-byte timestamp', { timestamp });
    }

    // Read priority
    const priority = buffer.readUInt8(offset);
    offset += 1;

    // Parse GPS element
    const gpsElement = parseGPSElement(buffer, offset);
    if (!gpsElement) return null;
    offset += gpsElement.size;

    // Parse IO element (optional)
    let ioElement = null;
    if (offset < buffer.length) {
      ioElement = parseIOElement(buffer, offset);
      if (ioElement) {
        offset += ioElement.size;
      }
    }

    return {
      data: {
        timestamp,
        priority,
        gpsElement: gpsElement.data,
        ioElement: ioElement?.data
      },
      size: offset - startOffset,
      nextOffset: offset
    };
    
  } catch (error) {
    log('error', 'Error parsing AVL record', error);
    return null;
  }
}

// Parse GPS element
function parseGPSElement(buffer, offset) {
  try {
    const startOffset = offset;
    
    // Validate buffer bounds
    if (offset + 20 > buffer.length) {
      log('error', 'Buffer too short for GPS element', { offset, bufferLength: buffer.length });
      return null;
    }

    // Read longitude
    const longitude = buffer.readInt32BE(offset) / 10000000;
    offset += 4;

    // Read latitude
    const latitude = buffer.readInt32BE(offset) / 10000000;
    offset += 4;

    // Read altitude
    const altitude = buffer.readUInt16BE(offset);
    offset += 2;

    // Read angle
    const angle = buffer.readUInt16BE(offset);
    offset += 2;

    // Read satellites
    const satellites = buffer.readUInt8(offset);
    offset += 1;

    // Read speed
    const speed = buffer.readUInt16BE(offset);
    offset += 2;

    // Read event IO ID
    const eventIOID = buffer.readUInt8(offset);
    offset += 1;

    // Read number of total IO
    const nOfTotalIO = buffer.readUInt8(offset);
    offset += 1;

    // Parse data1 (1 byte IO elements)
    const nOfData1 = buffer.readUInt8(offset);
    offset += 1;

    const data1 = [];
    for (let i = 0; i < nOfData1; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt8(offset);
      offset += 1;
      data1.push({ id, value });
    }

    // Parse data2 (2 byte IO elements)
    const nOfData2 = buffer.readUInt8(offset);
    offset += 1;

    const data2 = [];
    for (let i = 0; i < nOfData2; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt16BE(offset);
      offset += 2;
      data2.push({ id, value });
    }

    // Parse data4 (4 byte IO elements)
    const nOfData4 = buffer.readUInt8(offset);
    offset += 1;

    const data4 = [];
    for (let i = 0; i < nOfData4; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt32BE(offset);
      offset += 4;
      data4.push({ id, value });
    }

    // Parse data8 (8 byte IO elements)
    const nOfData8 = buffer.readUInt8(offset);
    offset += 1;

    const data8 = [];
    for (let i = 0; i < nOfData8; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.subarray(offset, offset + 8);
      offset += 8;
      data8.push({ id, value: value.toString('hex') });
    }

    return {
      data: {
        longitude,
        latitude,
        altitude,
        angle,
        satellites,
        speed,
        eventIOID,
        nOfTotalIO,
        nOfData1,
        data1,
        nOfData2,
        data2,
        nOfData4,
        data4,
        nOfData8,
        data8
      },
      size: offset - startOffset
    };

  } catch (error) {
    log('error', 'Error parsing GPS element', error);
    return null;
  }
}

// Parse IO element
function parseIOElement(buffer, offset) {
  try {
    const startOffset = offset;
    
    // Validate buffer bounds
    if (offset + 3 > buffer.length) {
      log('error', 'Buffer too short for IO element', { offset, bufferLength: buffer.length });
      return null;
    }

    // Read event IO ID
    const eventIOID = buffer.readUInt8(offset);
    offset += 1;

    // Read number of total IO
    const nOfTotalIO = buffer.readUInt8(offset);
    offset += 1;

    // Parse data1 (1 byte IO elements)
    const nOfData1 = buffer.readUInt8(offset);
    offset += 1;

    const data1 = [];
    for (let i = 0; i < nOfData1; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt8(offset);
      offset += 1;
      data1.push({ id, value });
    }

    // Parse data2 (2 byte IO elements)
    const nOfData2 = buffer.readUInt8(offset);
    offset += 1;

    const data2 = [];
    for (let i = 0; i < nOfData2; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt16BE(offset);
      offset += 2;
      data2.push({ id, value });
    }

    // Parse data4 (4 byte IO elements)
    const nOfData4 = buffer.readUInt8(offset);
    offset += 1;

    const data4 = [];
    for (let i = 0; i < nOfData4; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt32BE(offset);
      offset += 4;
      data4.push({ id, value });
    }

    // Parse data8 (8 byte IO elements)
    const nOfData8 = buffer.readUInt8(offset);
    offset += 1;

    const data8 = [];
    for (let i = 0; i < nOfData8; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.subarray(offset, offset + 8);
      offset += 8;
      data8.push({ id, value: value.toString('hex') });
    }

    return {
      data: {
        eventIOID,
        nOfTotalIO,
        nOfData1,
        data1,
        nOfData2,
        data2,
        nOfData4,
        data4,
        nOfData8,
        data8
      },
      size: offset - startOffset
    };

  } catch (error) {
    log('error', 'Error parsing IO element', error);
    return null;
  }
}

// Forward parsed data to web app
async function forwardToWebApp(parsedData, rawBuffer) {
  try {
    log('info', `Forwarding GPS data to web app for IMEI: ${parsedData.imei}`, {
      recordCount: parsedData.recordCount,
      codecId: parsedData.codecId
    });

    // Process each GPS record and send to simple GPS endpoint
    for (let i = 0; i < parsedData.records.length; i++) {
      const record = parsedData.records[i];
      
      // Send the original parsed Teltonika AVL data
      const avlData = {
        parsedData: {
          imei: parsedData.imei,
          records: [record],
          recordCount: 1,
          codecId: parsedData.codecId
        },
        rawData: rawBuffer.toString('hex'),
        source: 'teltonika-tcp-server',
        timestamp: new Date().toISOString(),
        serverInfo: {
          serverId: process.env.SERVER_ID || 'tcp-server-1',
          version: '1.0.0'
        }
      };

      // Send to Teltonika AVL endpoint
      const response = await axios.post(WEB_APP_API_URL, avlData, {
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'teltonika-tcp-server',
          'X-Server-ID': process.env.SERVER_ID || 'tcp-server-1'
        }
      });

      log('info', 'Successfully forwarded to web app', {
        status: response.status,
        imei: parsedData.imei
      });

      return response.data;
    }

  } catch (error) {
    log('error', 'Failed to forward data to web app', {
      error: error.message,
      imei: parsedData.imei,
      status: error.response?.status,
      url: WEB_APP_API_URL
    });
    throw error;
  }
}

// Create TCP server
const server = net.createServer((socket) => {
  const connectionId = ++connectionCount;
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  
  log('info', `New Teltonika device connected`, {
    connectionId,
    clientAddress,
    totalConnections: connections.size + 1
  });

  // Check connection limit
  if (connections.size >= MAX_CONNECTIONS) {
    log('warn', 'Maximum connections reached, rejecting new connection', {
      connectionId,
      clientAddress,
      maxConnections: MAX_CONNECTIONS
    });
    socket.destroy();
    return;
  }

  // Store connection info
  connections.set(connectionId, {
    socket,
    clientAddress,
    connectedAt: new Date(),
    packetsReceived: 0,
    lastPacketAt: null,
    imei: null
  });

  // Set connection timeout
  socket.setTimeout(CONNECTION_TIMEOUT);

  // Handle incoming data
  socket.on('data', async (data) => {
    try {
      totalPacketsReceived++;
      const connection = connections.get(connectionId);
      if (connection) {
        connection.packetsReceived++;
        connection.lastPacketAt = new Date();
      }

      log('debug', `Received GPS data from Teltonika device`, {
        connectionId,
        clientAddress,
        dataLength: data.length,
        totalPacketsReceived
      });

      // Parse Teltonika AVL packet
      const parsedData = parseTeltonikaAVLPacket(data);
      
      if (!parsedData) {
        log('error', 'Failed to parse Teltonika packet', {
          connectionId,
          clientAddress,
          dataLength: data.length
        });
        
        totalPacketsFailed++;
        // Send negative acknowledgment
        socket.write(Buffer.from([0x00]));
        return;
      }

      // Update connection with IMEI
      if (connection) {
        connection.imei = parsedData.imei;
      }

      log('info', `Successfully parsed GPS data`, {
        connectionId,
        clientAddress,
        imei: parsedData.imei,
        recordCount: parsedData.recordCount
      });

      // Forward to web app
      await forwardToWebApp(parsedData, data);
      totalPacketsProcessed++;

      // Send positive acknowledgment to Teltonika device
      socket.write(Buffer.from([0x01]));
      
      log('info', `Sent ACK to Teltonika device`, {
        connectionId,
        clientAddress,
        imei: parsedData.imei
      });

    } catch (error) {
      log('error', 'Error processing GPS data', {
        connectionId,
        clientAddress,
        error: error.message
      });
      
      totalPacketsFailed++;
      // Send negative acknowledgment on error
      socket.write(Buffer.from([0x00]));
    }
  });

  // Handle connection close
  socket.on('close', (hadError) => {
    connections.delete(connectionId);
    log('info', `Teltonika device disconnected`, {
      connectionId,
      clientAddress,
      hadError,
      totalConnections: connections.size
    });
  });

  // Handle connection errors
  socket.on('error', (error) => {
    connections.delete(connectionId);
    log('error', 'Socket error', {
      connectionId,
      clientAddress,
      error: error.message
    });
  });

  // Handle connection timeout
  socket.on('timeout', () => {
    log('warn', 'Connection timeout, closing socket', {
      connectionId,
      clientAddress
    });
    socket.destroy();
  });
});

// Handle server errors
server.on('error', (error) => {
  log('error', 'Server error', error);
});

// Start server
server.listen(TCP_PORT, TCP_HOST, () => {
  log('info', `Teltonika TCP Server started successfully`, {
    host: TCP_HOST,
    port: TCP_PORT,
    maxConnections: MAX_CONNECTIONS,
    webAppUrl: WEB_APP_API_URL,
    serverId: process.env.SERVER_ID || 'tcp-server-1'
  });
});

// Start health check server
import('./health.js').then(() => {
  log('info', 'Health check server started');
}).catch(error => {
  log('error', 'Failed to start health check server', error);
  // Continue running the main server even if health check fails
});

// Graceful shutdown
function gracefulShutdown(signal) {
  log('info', `Received ${signal}, shutting down TCP server...`);
  
  // Close all connections
  for (const [connectionId, connection] of connections) {
    log('info', `Closing connection ${connectionId}`);
    connection.socket.destroy();
  }
  
  server.close(() => {
    log('info', 'TCP server shutdown complete');
    log('info', 'Final statistics', {
      totalPacketsReceived,
      totalPacketsProcessed,
      totalPacketsFailed,
      successRate: totalPacketsReceived > 0 ? ((totalPacketsProcessed / totalPacketsReceived) * 100).toFixed(2) + '%' : '0%'
    });
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught Exception', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled Rejection', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

// Health check endpoint (if needed for monitoring)
export function getServerStatus() {
  return {
    status: 'running',
    uptime: process.uptime(),
    connections: connections.size,
    maxConnections: MAX_CONNECTIONS,
    port: TCP_PORT,
    host: TCP_HOST,
    statistics: {
      totalPacketsReceived,
      totalPacketsProcessed,
      totalPacketsFailed,
      successRate: totalPacketsReceived > 0 ? ((totalPacketsProcessed / totalPacketsReceived) * 100).toFixed(2) + '%' : '0%'
    },
    serverInfo: {
      serverId: process.env.SERVER_ID || 'tcp-server-1',
      version: '1.0.0'
    }
  };
}

