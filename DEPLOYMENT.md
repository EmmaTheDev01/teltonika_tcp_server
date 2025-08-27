# Teltonika TCP Server Deployment Guide

This guide will help you deploy the standalone Teltonika TCP server to Render and configure it to work with your web application.

## 🚀 Render Deployment

### Step 1: Prepare Your Repository

1. **Ensure the TCP server is in your repository:**
   ```
   teltonika-tcp-server/
   ├── server.js
   ├── health.js
   ├── package.json
   ├── render.yaml
   ├── README.md
   ├── env.example
   └── test-connection.js
   ```

2. **Commit and push your changes:**
   ```bash
   git add teltonika-tcp-server/
   git commit -m "Add standalone Teltonika TCP server"
   git push origin main
   ```

### Step 2: Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" and select "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   **Basic Settings:**
   - **Name:** `teltonika-tcp-server`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `teltonika-tcp-server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

   **Environment Variables:**
   ```
   TCP_PORT=5000
   TCP_HOST=0.0.0.0
   WEB_APP_API_URL=https://your-web-app.onrender.com/api/gps/teltonika
   API_TIMEOUT=10000
   SERVER_ID=tcp-server-1
   LOG_LEVEL=info
   ENABLE_DEBUG_LOGGING=false
   MAX_CONNECTIONS=100
   CONNECTION_TIMEOUT=30000
   HEALTH_PORT=8080
   ```

5. **Click "Create Web Service"**

### Step 3: Configure Ports

1. **In your Render service settings:**
   - Go to "Settings" → "Port"
   - Set the port to `5000` (TCP server port)
   - The health check will run on port `8080` internally

2. **Update your service configuration:**
   - Go to "Settings" → "Health Check Path"
   - Set to: `http://localhost:8080/`

## 🔧 Teltonika Device Configuration

### Configure Your GPS Devices

1. **Access your Teltonika device configuration:**
   - Use Teltonika Configurator or web interface
   - Navigate to "Server" settings

2. **Set the server parameters:**
   ```
   Server IP: [Your Render service URL]
   Port: 5000
   Protocol: TCP
   ```

3. **Example configuration:**
   ```
   Server: teltonika-tcp-server.onrender.com
   Port: 5000
   Protocol: TCP
   Data Sending Interval: 30 seconds (or your preference)
   ```

## 🧪 Testing the Deployment

### Test the Health Check

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

### Test with Teltonika Device

1. **Configure your device with the new server URL**
2. **Monitor the logs in Render dashboard**
3. **Check your web app for incoming GPS data**

## 🔍 Monitoring and Debugging

### View Logs

1. **In Render Dashboard:**
   - Go to your service
   - Click "Logs" tab
   - Monitor for connection and data processing logs

2. **Key log messages to look for:**
   ```
   ✅ Teltonika TCP Server started successfully
   ✅ Health check server started
   📡 New Teltonika device connected
   ✅ Successfully parsed GPS data
   ✅ Successfully forwarded to web app
   ```

### Monitor Statistics

The server tracks real-time statistics:
- **Total packets received**
- **Total packets processed**
- **Total packets failed**
- **Success rate percentage**
- **Active connections**

## 🔄 Update Your Web App

Make sure your web app is configured to receive data from the TCP server:

1. **Deploy your web app to Render**
2. **Update the TCP server's WEB_APP_API_URL to point to your web app**
3. **Test the complete flow**

## 📊 Performance Monitoring

### Monitor These Metrics:

- **Connection count:** Number of active device connections
- **Packet processing rate:** GPS packets processed per minute
- **API response times:** Time to forward data to web app
- **Error rates:** Failed packet processing or API calls
- **Success rate:** Percentage of successful packet processing

### Scaling Considerations:

- **Starter Plan:** Up to 100 concurrent connections
- **Standard Plan:** Higher limits for production use
- **Custom Domain:** For better reliability

## 🔐 Security Considerations

1. **Firewall Rules:** Only allow necessary ports
2. **Rate Limiting:** Consider implementing rate limiting
3. **Authentication:** Add device authentication if needed
4. **SSL/TLS:** Use secure connections for production

## 🆘 Troubleshooting

### Service Won't Start

1. **Check build logs for errors**
2. **Verify package.json dependencies**
3. **Check environment variables**

### No Device Connections

1. **Verify device configuration**
2. **Check network connectivity**
3. **Test with telnet:**
   ```bash
   telnet your-server.onrender.com 5000
   ```

### Data Not Reaching Web App

1. **Check WEB_APP_API_URL configuration**
2. **Verify web app API endpoint**
3. **Review API logs for errors**

### High Packet Failure Rate

1. **Check web app API availability**
2. **Review API timeout settings**
3. **Monitor web app performance**

## 📞 Support

If you encounter issues:

1. **Check the logs in Render dashboard**
2. **Review the troubleshooting section**
3. **Test with the provided test scripts**
4. **Create an issue with detailed information**

---

## 🎉 Next Steps

1. **Deploy the TCP server to Render**
2. **Configure your Teltonika GPS devices**
3. **Test the complete GPS tracking flow**
4. **Monitor performance and optimize**
5. **Set up alerts and notifications**

Your standalone TCP server is now ready for real-time Teltonika device integration! 🚛📡
