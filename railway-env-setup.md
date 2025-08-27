# Railway Environment Setup Guide

## 🚨 Current Issues:
1. `WEB_APP_API_URL` not set - using default localhost
2. TCP host binding error with `[::]`

## 🔧 Fix Steps:

### 1. Set Environment Variables in Railway Dashboard:

Go to your Railway project dashboard and set these environment variables:

```
TCP_PORT=5000
TCP_HOST=0.0.0.0
WEB_APP_API_URL=https://rfmnts.onrender.com/api/gps/teltonika
API_TIMEOUT=10000
SERVER_ID=railway-tcp-server
LOG_LEVEL=info
ENABLE_DEBUG_LOGGING=false
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30000
HEALTH_PORT=8080
NODE_ENV=production
```

### 2. Important Notes:
- **TCP_HOST=0.0.0.0** (not [::]) - This fixes the DNS error
- **WEB_APP_API_URL** - Must be set to your web app URL
- **TCP_PORT=5000** - Railway's default TCP port

### 3. After setting variables:
- Railway will automatically redeploy
- Check logs for successful startup
- Test the health endpoint: https://rfmntsgps.up.railway.app/

### 4. Test TCP Connection:
Once deployed, test with:
```bash
# Test health endpoint
curl https://rfmntsgps.up.railway.app/

# Test TCP connection (if Railway supports it)
telnet rfmntsgps.up.railway.app 5000
```
