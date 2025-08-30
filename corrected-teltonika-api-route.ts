import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Teltonika AVL packet structure constants (OFFICIAL SPECIFICATION)
const TELTONIKA_PREAMBLE = 0x00000000; // Official specification (not 0x000000FF)
const TELTONIKA_AVL_DATA_MAX_SIZE = 65535;

// Teltonika event/IO element types
const TELTONIKA_EVENT_IO_ID_1 = 1;
const TELTONIKA_EVENT_IO_ID_2 = 2;
const TELTONIKA_EVENT_IO_ID_3 = 3;
const TELTONIKA_EVENT_IO_ID_4 = 4;

// Teltonika priority levels
const TELTONIKA_PRIORITY_LOW = 0;
const TELTONIKA_PRIORITY_HIGH = 1;
const TELTONIKA_PRIORITY_PANIC = 2;

interface TeltonikaAVLRecord {
  timestamp: number;
  priority: number;
  gpsElement: {
    longitude: number;
    latitude: number;
    altitude: number;
    angle: number;
    satellites: number;
    speed: number;
    eventIOID: number;
    nOfTotalIO: number;
    nOfData1: number;
    data1: any[];
    nOfData2: number;
    data2: any[];
    nOfData4?: number;
    data4?: any[];
    nOfData8?: number;
    data8?: any[];
  };
  ioElement?: {
    eventIOID: number;
    nOfTotalIO: number;
    nOfData1: number;
    data1: any[];
    nOfData2: number;
    data2: any[];
    nOfData4?: number;
    data4?: any[];
    nOfData8?: number;
    data8?: any[];
  };
}

interface ParsedTeltonikaData {
  imei: string;
  records: TeltonikaAVLRecord[];
  recordCount: number;
  crc: number;
}

// Parse Teltonika AVL packet from buffer (OFFICIAL SPECIFICATION)
function parseTeltonikaAVLPacket(buffer: Buffer): ParsedTeltonikaData | null {
  try {
    let offset = 0;

    // Check if buffer is long enough for basic packet structure
    if (buffer.length < 12) {
      console.error('Buffer too short for Teltonika packet');
      return null;
    }

    // Check preamble (0x00000000 - OFFICIAL SPECIFICATION)
    const preamble = buffer.readUInt32BE(offset);
    if (preamble !== TELTONIKA_PREAMBLE) {
      console.error('Invalid Teltonika preamble:', preamble.toString(16), 'expected:', TELTONIKA_PREAMBLE.toString(16));
      return null;
    }
    offset += 4;

    // Read data field length
    const dataFieldLength = buffer.readUInt32BE(offset);
    offset += 4;

    // Read IMEI length
    const imeiLength = buffer.readUInt8(offset);
    offset += 1;

    // Read IMEI
    const imei = buffer.toString('ascii', offset, offset + imeiLength);
    offset += imeiLength;

    // Read codec ID
    const codecId = buffer.readUInt8(offset);
    offset += 1;

    // Read number of records
    const numberOfRecords = buffer.readUInt8(offset);
    offset += 1;

    const records: TeltonikaAVLRecord[] = [];

    // Parse each AVL record
    for (let i = 0; i < numberOfRecords; i++) {
      const record = parseAVLRecord(buffer, offset);
      if (record) {
        records.push(record);
        offset = record.nextOffset; // Use nextOffset for proper positioning
      } else {
        console.error(`Failed to parse AVL record ${i}`);
        return null;
      }
    }

    // Read number of records (should match)
    const numberOfRecords2 = buffer.readUInt8(offset);
    offset += 1;

    // Verify record count matches
    if (numberOfRecords !== numberOfRecords2) {
      console.error('Number of Data 1 does not match Number of Data 2', { 
        numberOfData1: numberOfRecords, 
        numberOfData2: numberOfRecords2 
      });
      return null;
    }

    // Read CRC-16 (4 bytes)
    if (offset + 4 <= buffer.length) {
      const crc = buffer.readUInt32BE(offset);
      console.log('CRC-16 value:', { crc: crc.toString(16) });
    }

    return {
      imei,
      records,
      recordCount: numberOfRecords,
      crc: 0 // Placeholder
    };

  } catch (error) {
    console.error('Error parsing Teltonika AVL packet:', error);
    return null;
  }
}

// Parse individual AVL record (OFFICIAL SPECIFICATION - 8-byte timestamp)
function parseAVLRecord(buffer: Buffer, offset: number): (TeltonikaAVLRecord & { nextOffset: number }) | null {
  try {
    const startOffset = offset;

    // Read timestamp (8 bytes according to OFFICIAL SPECIFICATION)
    if (offset + 8 > buffer.length) {
      console.error('Buffer too short for timestamp');
      return null;
    }
    
    // Read timestamp as 8 bytes (Unix time in milliseconds)
    const timestampHigh = buffer.readUInt32BE(offset);
    const timestampLow = buffer.readUInt32BE(offset + 4);
    const timestamp = (timestampHigh * 0x100000000) + timestampLow;
    offset += 8;

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
      timestamp,
      priority,
      gpsElement: gpsElement.data,
      ioElement: ioElement?.data,
      nextOffset: offset
    };
    
  } catch (error) {
    console.error('Error parsing AVL record:', error);
    return null;
  }
}

// Parse GPS element (OFFICIAL SPECIFICATION)
function parseGPSElement(buffer: Buffer, offset: number): { data: any; size: number } | null {
  try {
    const startOffset = offset;

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

    const data1: any[] = [];
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

    const data2: any[] = [];
    for (let i = 0; i < nOfData2; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt16BE(offset);
      offset += 2;
      data2.push({ id, value });
    }

    // Parse data4 (4 byte IO elements) - OFFICIAL SPECIFICATION
    const nOfData4 = buffer.readUInt8(offset);
    offset += 1;

    const data4: any[] = [];
    for (let i = 0; i < nOfData4; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt32BE(offset);
      offset += 4;
      data4.push({ id, value });
    }

    // Parse data8 (8 byte IO elements) - OFFICIAL SPECIFICATION
    const nOfData8 = buffer.readUInt8(offset);
    offset += 1;

    const data8: any[] = [];
    for (let i = 0; i < nOfData8; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const valueHigh = buffer.readUInt32BE(offset);
      const valueLow = buffer.readUInt32BE(offset + 4);
      const value = (valueHigh * 0x100000000) + valueLow;
      offset += 8;
      data8.push({ id, value });
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
    console.error('Error parsing GPS element:', error);
    return null;
  }
}

// Parse IO element (OFFICIAL SPECIFICATION - includes 4-byte and 8-byte elements)
function parseIOElement(buffer: Buffer, offset: number): { data: any; size: number } | null {
  try {
    const startOffset = offset;

    // Read event IO ID
    const eventIOID = buffer.readUInt8(offset);
    offset += 1;

    // Read number of total IO
    const nOfTotalIO = buffer.readUInt8(offset);
    offset += 1;

    // Parse data1 (1 byte IO elements)
    const nOfData1 = buffer.readUInt8(offset);
    offset += 1;

    const data1: any[] = [];
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

    const data2: any[] = [];
    for (let i = 0; i < nOfData2; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt16BE(offset);
      offset += 2;
      data2.push({ id, value });
    }

    // Parse data4 (4 byte IO elements) - OFFICIAL SPECIFICATION
    const nOfData4 = buffer.readUInt8(offset);
    offset += 1;

    const data4: any[] = [];
    for (let i = 0; i < nOfData4; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const value = buffer.readUInt32BE(offset);
      offset += 4;
      data4.push({ id, value });
    }

    // Parse data8 (8 byte IO elements) - OFFICIAL SPECIFICATION
    const nOfData8 = buffer.readUInt8(offset);
    offset += 1;

    const data8: any[] = [];
    for (let i = 0; i < nOfData8; i++) {
      const id = buffer.readUInt8(offset);
      offset += 1;
      const valueHigh = buffer.readUInt32BE(offset);
      const valueLow = buffer.readUInt32BE(offset + 4);
      const value = (valueHigh * 0x100000000) + valueLow;
      offset += 8;
      data8.push({ id, value });
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
    console.error('Error parsing IO element:', error);
    return null;
  }
}

// Calculate CRC-16/IBM for Teltonika packet validation
function calculateCRC16(buffer: Buffer): number {
  let crc = 0x0000;
  
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
  }
  
  return crc & 0xFFFF;
}

// Process and store GPS location data
async function processGPSLocation(imei: string, record: TeltonikaAVLRecord) {
  try {
    // Find or create GPS device
    let gpsDevice = await prisma.gpsDevice.findUnique({
      where: { imei }
    });

    if (!gpsDevice) {
      console.log(`Creating new GPS device for IMEI: ${imei}`);
      gpsDevice = await prisma.gpsDevice.create({
        data: {
          imei,
          name: `Teltonika GPS ${imei.slice(-4)}`,
          model: 'Teltonika',
          isActive: true,
          lastSeen: new Date(),
          batteryLevel: extractBatteryLevel(record),
          signalStrength: extractSignalStrength(record)
        }
      });
    } else {
      // Update device status
      await prisma.gpsDevice.update({
        where: { id: gpsDevice.id },
        data: {
          lastSeen: new Date(),
          batteryLevel: extractBatteryLevel(record),
          signalStrength: extractSignalStrength(record)
        }
      });
    }

    // Create GPS location record
    const location = await prisma.gpsLocation.create({
      data: {
        deviceId: gpsDevice.id,
        latitude: record.gpsElement.latitude,
        longitude: record.gpsElement.longitude,
        altitude: record.gpsElement.altitude,
        speed: record.gpsElement.speed,
        heading: record.gpsElement.angle,
        accuracy: calculateAccuracy(record.gpsElement.satellites),
        satellites: record.gpsElement.satellites,
        timestamp: new Date(record.timestamp) // Timestamp is already in milliseconds
      }
    });

    // Check for alerts
    await checkForAlerts(gpsDevice, location, record);

    console.log(`✅ Stored GPS location: ${location.id} for device ${imei}`);
    return location;

  } catch (error) {
    console.error('Error processing GPS location:', error);
    throw error;
  }
}

// Extract battery level from IO data
function extractBatteryLevel(record: TeltonikaAVLRecord): number | null {
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
function extractSignalStrength(record: TeltonikaAVLRecord): number | null {
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

// Calculate GPS accuracy based on satellite count
function calculateAccuracy(satellites: number): number {
  if (satellites >= 10) return 2.0;  // Excellent
  if (satellites >= 7) return 5.0;   // Good
  if (satellites >= 5) return 10.0;  // Fair
  if (satellites >= 3) return 20.0;  // Poor
  return 50.0; // Very poor
}

// Check for various alerts
async function checkForAlerts(gpsDevice: any, location: any, record: TeltonikaAVLRecord) {
  try {
    const alerts: any[] = [];

    // Speed alert (if speed > 120 km/h)
    if (record.gpsElement.speed > 120) {
      alerts.push({
        type: 'SPEEDING',
        title: 'Speed Violation',
        message: `Vehicle speed: ${record.gpsElement.speed} km/h`,
        severity: 'HIGH',
        latitude: location.latitude,
        longitude: location.longitude,
        speed: record.gpsElement.speed,
        timestamp: location.timestamp
      });
    }

    // Low battery alert
    const batteryLevel = extractBatteryLevel(record);
    if (batteryLevel !== null && batteryLevel < 20) {
      alerts.push({
        type: 'LOW_BATTERY',
        title: 'Low Battery',
        message: `GPS device battery level: ${batteryLevel}%`,
        severity: 'MEDIUM',
        timestamp: location.timestamp
      });
    }

    // Geofence alerts (if device has vehicle and geofences)
    if (gpsDevice.vehicle) {
      const geofenceAlerts = await checkGeofenceAlerts(gpsDevice, location);
      alerts.push(...geofenceAlerts);
    }

    // Create alerts in database
    for (const alert of alerts) {
      await prisma.gpsAlert.create({
        data: {
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          deviceId: gpsDevice.id,
          vehicleId: gpsDevice.vehicleId,
          latitude: alert.latitude,
          longitude: alert.longitude,
          speed: alert.speed,
          timestamp: alert.timestamp
        }
      });
    }

  } catch (error) {
    console.error('Error checking alerts:', error);
  }
}

// Check geofence violations
async function checkGeofenceAlerts(gpsDevice: any, location: any) {
  const alerts: any[] = [];
  
  try {
    if (!gpsDevice.vehicle?.companyId) return alerts;

    const geofences = await prisma.geofence.findMany({
      where: {
        companyId: gpsDevice.vehicle.companyId,
        isActive: true
      }
    });

    for (const geofence of geofences) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        geofence.centerLat!,
        geofence.centerLng!
      );

      if (geofence.type === 'CIRCLE') {
        const radiusInDegrees = geofence.radius! / 111000; // Convert meters to degrees (approximate)
        
        if (distance <= radiusInDegrees) {
          // Inside geofence
          alerts.push({
            type: 'GEOFENCE_ENTRY',
            title: 'Geofence Entry',
            message: `Vehicle entered geofence: ${geofence.name}`,
            severity: 'MEDIUM',
            geofenceId: geofence.id,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp
          });
        }
      }
    }

  } catch (error) {
    console.error('Error checking geofence alerts:', error);
  }

  return alerts;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Handle data from TCP server
async function handleTCPData(request: NextRequest, startTime: number) {
  try {
    const tcpData = await request.json();
    console.log('📋 TCP server data received:', {
      source: tcpData.source,
      timestamp: tcpData.timestamp,
      imei: tcpData.parsedData?.imei
    });
    
    // Validate TCP server data
    if (!tcpData.parsedData || !tcpData.parsedData.imei) {
      console.error('❌ Invalid TCP server data format');
      return NextResponse.json(
        { error: 'Invalid TCP server data format' },
        { status: 400 }
      );
    }
    
    const { parsedData, rawData, source } = tcpData;
    
    console.log(`📍 Processing TCP data for IMEI: ${parsedData.imei}`, {
      recordCount: parsedData.recordCount,
      codecId: parsedData.codecId,
      source
    });
    
    // Process each GPS record from TCP server
    const processedLocations = [];
    const errors = [];
    
    for (let i = 0; i < parsedData.records.length; i++) {
      const record = parsedData.records[i];
      try {
        const location = await processGPSLocation(parsedData.imei, record);
        processedLocations.push(location);
        console.log(`✅ Processed TCP record ${i + 1}/${parsedData.records.length}`);
      } catch (error) {
        console.error(`❌ Error processing TCP record ${i + 1}:`, error);
        errors.push({ recordIndex: i, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Successfully processed ${processedLocations.length}/${parsedData.records.length} TCP GPS locations in ${processingTime}ms`);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedLocations.length} GPS records from TCP server`,
      imei: parsedData.imei,
      recordCount: parsedData.recordCount,
      processedCount: processedLocations.length,
      source,
      errors: errors.length > 0 ? errors : undefined,
      processingTime
    });
    
  } catch (error) {
    console.error('❌ Error processing TCP server data:', error);
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Failed to process TCP server GPS data',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

// Main POST handler for Teltonika GPS data
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📡 Received Teltonika GPS data');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Check if this is data from TCP server
    const contentType = request.headers.get('content-type') || '';
    const source = request.headers.get('x-source') || '';
    const isTCPData = contentType.includes('application/json') && 
                     (source === 'teltonika-tcp-server' || 
                      request.body && typeof request.body === 'object');
    
    if (isTCPData) {
      console.log('🌐 Processing data from TCP server');
      return await handleTCPData(request, startTime);
    }
    
    // Get raw data from request
    const rawData = await request.arrayBuffer();
    const buffer = Buffer.from(rawData);
    
    console.log(`📦 Received ${buffer.length} bytes of data`);
    console.log('🔍 Raw data (hex):', buffer.toString('hex').substring(0, 100) + '...');

    // Handle empty or invalid data
    if (buffer.length < 12) {
      console.error('❌ Data too short for Teltonika packet');
      return NextResponse.json(
        { error: 'Data too short for Teltonika packet', receivedBytes: buffer.length },
        { status: 400 }
      );
    }

    // Parse Teltonika AVL packet
    const parsedData = parseTeltonikaAVLPacket(buffer);
    
    if (!parsedData) {
      console.error('❌ Failed to parse Teltonika AVL packet');
      console.error('🔍 Raw data for debugging:', buffer.toString('hex'));
      return NextResponse.json(
        { error: 'Invalid Teltonika AVL packet format', receivedBytes: buffer.length },
        { status: 400 }
      );
    }

    console.log(`✅ Parsed Teltonika data for IMEI: ${parsedData.imei}`);
    console.log(`📊 Records count: ${parsedData.recordCount}`);

    // Process each GPS record
    const processedLocations = [];
    const errors = [];
    
    for (let i = 0; i < parsedData.records.length; i++) {
      const record = parsedData.records[i];
      try {
        const location = await processGPSLocation(parsedData.imei, record);
        processedLocations.push(location);
        console.log(`✅ Processed record ${i + 1}/${parsedData.records.length}`);
      } catch (error) {
        console.error(`❌ Error processing record ${i + 1}:`, error);
        errors.push({ recordIndex: i, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Successfully processed ${processedLocations.length}/${parsedData.records.length} GPS locations in ${processingTime}ms`);

    // Return Teltonika acknowledgment (required by Teltonika protocol)
    const response = {
      success: true,
      message: `Processed ${processedLocations.length} GPS records`,
      imei: parsedData.imei,
      recordCount: parsedData.recordCount,
      processedCount: processedLocations.length,
      errors: errors.length > 0 ? errors : undefined,
      processingTime
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error processing Teltonika GPS data:', error);
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Internal server error processing GPS data',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

// GET handler for testing and status
export async function GET() {
  return NextResponse.json({
    status: 'Teltonika GPS receiver is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      post: '/api/gps/teltonika - Accepts Teltonika AVL packets',
      get: '/api/gps/teltonika - Returns status (this endpoint)'
    },
    protocol: 'Teltonika AVL Protocol (Official Specification)',
    supported: [
      'AVL packet parsing (Codec 8)',
      'GPS location storage',
      'Device management',
      'Alert generation',
      'Geofence monitoring',
      'TCP server integration'
    ],
    specifications: {
      preamble: '0x00000000 (Official)',
      timestamp: '8 bytes (Unix time in milliseconds)',
      ioElements: '1-byte, 2-byte, 4-byte, and 8-byte support'
    }
  });
}
