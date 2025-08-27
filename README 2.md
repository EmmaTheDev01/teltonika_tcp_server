# Teltonika TCP Server

A standalone TCP server for handling Teltonika GPS AVL packets and forwarding them to your web application in real-time.

## 🚀 Features

- **Real-time GPS Data Processing**: Receives and parses Teltonika AVL packets
- **Protocol Compliance**: Implements Teltonika AVL protocol with proper acknowledgments
- **Connection Management**: Handles multiple device connections with timeout and error handling
- **Data Forwarding**: Sends parsed GPS data to your web app API
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Error Handling**: Robust error handling with graceful degradation
- **Health Monitoring**: Connection tracking and server status monitoring
- **Statistics Tracking**: Real-time packet processing statistics

## 📋 Prerequisites

- Node.js 18+ 
- Your web application with GPS API endpoint
- Teltonika GPS devices configured to send data to this server

## 🛠️ Installation

1. **Clone or navigate to the TCP server directory:**
   ```bash
   cd teltonika-tcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # TCP Server Configuration
   TCP_PORT=5000
   TCP_HOST=0.0.0.0
   
   # Web App API Configuration
   WEB_APP_API_URL=https://your-web-app.onrender.com/api/gps/teltonika
   API_TIMEOUT=10000
   
   # Server Identification
   SERVER_ID=tcp-server-1
   
   # Logging
   LOG_LEVEL=info
   ENABLE_DEBUG_LOGGING=false
   ```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Testing
```bash
npm test
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TCP_PORT` | `5000` | Port for TCP server to listen on |
| `TCP_HOST` | `0.0.0.0` | Host address to bind to |
| `WEB_APP_API_URL` | `http://localhost:3000/api/gps/teltonika` | Your web app API endpoint |
| `API_TIMEOUT` | `10000` | Timeout for API requests (ms) |
| `SERVER_ID` | `tcp-server-1` | Unique server identifier |
| `LOG_LEVEL` | `info` | Logging level (error, warn, info, debug) |
| `ENABLE_DEBUG_LOGGING` | `false` | Enable detailed debug logging |
| `MAX_CONNECTIONS` | `100` | Maximum concurrent device connections |
| `CONNECTION_TIMEOUT` | `30000` | Connection timeout (ms) |
| `HEALTH_PORT` | `8080` | Health check server port |

### Teltonika Device Configuration

Configure your Teltonika GPS devices to send data to:
```
Server IP: [Your Render service URL]
Port: 5000
Protocol: TCP
```

## 📡 Protocol Support

This server supports the Teltonika AVL protocol:

- **Codec 8**: Standard Teltonika codec
- **AVL Packet Structure**: Preamble, data length, IMEI, records, CRC
- **GPS Data**: Latitude, longitude, altitude, speed, heading, satellites
- **IO Elements**: Digital and analog inputs/outputs
- **Acknowledgments**: Proper ACK/NACK responses

## 🔄 Data Flow

1. **Teltonika Device** → Sends AVL packet via TCP
2. **TCP Server** → Receives and parses packet
3. **TCP Server** → Sends ACK to device
4. **TCP Server** → Forwards parsed data to web app API
5. **Web App** → Stores data in database and processes alerts

## 🧪 Testing

### Run Test Suite
```bash
npm test
```

### Manual Testing
```bash
# Start the server
npm start

# In another terminal, run tests
node test-connection.js
```

### Test Scenarios
- ✅ Valid AVL packets
- ✅ Multiple device connections
- ✅ Invalid packet handling
- ✅ Connection timeout
- ✅ Error recovery
- ✅ Data forwarding to web app

## 📊 Monitoring

### Health Check
```bash
curl https://your-tcp-server.onrender.com:8080/
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "tcpServer": {
    "status": "running",
    "uptime": 123.45,
    "connections": 0,
    "maxConnections": 100,
    "port": 5000,
    "statistics": {
      "totalPacketsReceived": 0,
      "totalPacketsProcessed": 0,
      "totalPacketsFailed": 0,
      "successRate": "0%"
    },
    "serverInfo": {
      "serverId": "tcp-server-1",
      "version": "1.0.0"
    }
  }
}
```

### Logs
Monitor server logs for:
- Device connections/disconnections
- Packet processing status
- API forwarding results
- Error conditions
- Statistics updates

## 🚀 Deployment

### Render Deployment

1. **Create a new Web Service on Render**
2. **Connect your repository**
3. **Configure build settings:**
   ```
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set environment variables:**
   ```
   TCP_PORT=5000
   TCP_HOST=0.0.0.0
   WEB_APP_API_URL=https://your-web-app.onrender.com/api/gps/teltonika
   SERVER_ID=tcp-server-1
   ```

5. **Configure port:**
   - Set the port to `5000` in Render settings
   - Ensure the port is exposed in your service configuration

### Other Platforms

The server can be deployed on any platform that supports Node.js:
- **Railway**
- **Heroku**
- **DigitalOcean**
- **AWS EC2**
- **Google Cloud**

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if the server is running
   - Verify port configuration
   - Check firewall settings

2. **Invalid Packet Errors**
   - Verify Teltonika device configuration
   - Check protocol version compatibility
   - Review packet structure

3. **API Forwarding Failures**
   - Verify WEB_APP_API_URL configuration
   - Check network connectivity
   - Review API endpoint configuration

### Debug Mode
Enable debug logging:
```env
ENABLE_DEBUG_LOGGING=true
LOG_LEVEL=debug
```

## 📝 API Integration

The TCP server forwards data to your web app API in this format:

```json
{
  "parsedData": {
    "imei": "123456789012345",
    "records": [...],
    "recordCount": 1,
    "crc": 12345678,
    "codecId": 8
  },
  "rawData": "000000ff...",
  "source": "teltonika-tcp-server",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "serverInfo": {
    "serverId": "tcp-server-1",
    "version": "1.0.0"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Test with the provided test suite
4. Create an issue with detailed information
