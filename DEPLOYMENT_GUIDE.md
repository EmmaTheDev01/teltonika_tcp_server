# 🚀 Teltonika TCP Server Deployment Guide

This guide covers multiple deployment options for your Teltonika TCP server, from simple cloud platforms to enterprise-grade solutions.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Your web application API endpoint ready
- Teltonika devices configured for TCP communication

## 🎯 Deployment Options

### 1. **Railway.app (Recommended for TCP Services)**

Railway.app supports raw TCP connections, making it ideal for your Teltonika server.

**Steps:**
1. Sign up at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Create a new service from your repository
4. Set environment variables in Railway dashboard:
   ```
   TCP_PORT=5000
   TCP_HOST=0.0.0.0
   WEB_APP_API_URL=https://your-web-app.com/api/gps/teltonika
   API_TIMEOUT=10000
   SERVER_ID=railway-tcp-server
   LOG_LEVEL=info
   ENABLE_DEBUG_LOGGING=false
   MAX_CONNECTIONS=100
   CONNECTION_TIMEOUT=30000
   HEALTH_PORT=8080
   NODE_ENV=production
   ```
5. Deploy automatically on git push

**Pros:** ✅ TCP support, ✅ Easy setup, ✅ Auto-deployment, ✅ Free tier
**Cons:** ❌ Limited resources on free tier

---

### 2. **Render.com (Current Setup)**

Your project already has `render.yaml` configured, but Render.com web services don't support raw TCP connections.

**Limitation:** Only the health check endpoint (port 8080) will work, not the TCP server (port 5000).

**Alternative:** Use Render.com for the health monitoring only, and deploy the TCP server elsewhere.

---

### 3. **Docker Deployment**

Perfect for containerized environments and cloud providers.

**Local Testing:**
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t teltonika-tcp-server .
docker run -p 5000:5000 -p 8080:8080 \
  -e WEB_APP_API_URL=https://your-web-app.com/api/gps/teltonika \
  teltonika-tcp-server
```

**Cloud Deployment:**
- **Google Cloud Run:** Supports TCP connections
- **AWS ECS/Fargate:** Container orchestration
- **Azure Container Instances:** Serverless containers
- **DigitalOcean App Platform:** Simple container deployment

---

### 4. **PM2 Production Deployment**

For VPS or dedicated server deployment.

**Setup:**
```bash
# Install PM2 globally
npm install -g pm2

# Create logs directory
mkdir logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Monitoring:**
```bash
# View logs
pm2 logs teltonika-tcp-server

# Monitor processes
pm2 monit

# Restart application
pm2 restart teltonika-tcp-server
```

---

### 5. **Kubernetes Deployment**

For enterprise-grade, scalable deployments.

**Prerequisites:**
- Kubernetes cluster (GKE, EKS, AKS, or local)
- kubectl configured
- Docker image pushed to registry

**Deploy:**
```bash
# Update image in k8s/deployment.yaml
# Push your Docker image to registry
docker build -t your-registry/teltonika-tcp-server:latest .
docker push your-registry/teltonika-tcp-server:latest

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml

# Check deployment
kubectl get pods
kubectl get services
```

---

### 6. **VPS/Dedicated Server**

For full control over the deployment.

**Setup:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd teltonika-tcp-server

# Install dependencies
npm ci --only=production

# Setup environment
cp env.example .env
# Edit .env with your configuration

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

**Firewall Configuration:**
```bash
# Allow TCP port 5000 and HTTP port 8080
sudo ufw allow 5000/tcp
sudo ufw allow 8080/tcp
sudo ufw enable
```

---

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TCP_PORT` | TCP server port | 5000 | Yes |
| `TCP_HOST` | TCP server host | 0.0.0.0 | Yes |
| `WEB_APP_API_URL` | Your web app API endpoint | - | Yes |
| `API_TIMEOUT` | API request timeout (ms) | 10000 | No |
| `SERVER_ID` | Unique server identifier | tcp-server-1 | No |
| `LOG_LEVEL` | Logging level | info | No |
| `MAX_CONNECTIONS` | Max concurrent connections | 100 | No |
| `CONNECTION_TIMEOUT` | Connection timeout (ms) | 30000 | No |
| `HEALTH_PORT` | Health check port | 8080 | No |

### Security Considerations

1. **Environment Variables:** Never commit `.env` files to Git
2. **Firewall Rules:** Only expose necessary ports (5000, 8080)
3. **SSL/TLS:** Use HTTPS for web app API communication
4. **Authentication:** Implement API authentication if needed
5. **Rate Limiting:** Consider implementing rate limiting for API calls

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```
GET http://your-server:8080/
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-27T11:30:57.963Z",
  "tcpServer": {
    "status": "running",
    "uptime": 11.767716997,
    "connections": 0,
    "maxConnections": 100,
    "port": 5001,
    "host": "0.0.0.0",
    "statistics": {
      "totalPacketsReceived": 0,
      "totalPacketsProcessed": 0,
      "totalPacketsFailed": 0,
      "successRate": "0%"
    }
  }
}
```

### Monitoring Tools

1. **PM2 Monitoring:** Built-in process monitoring
2. **Prometheus/Grafana:** Custom metrics collection
3. **Uptime Robot:** External health monitoring
4. **Application Insights:** Azure monitoring
5. **CloudWatch:** AWS monitoring

---

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Check what's using the port
   lsof -i :5000
   
   # Kill the process or change port
   sudo kill -9 <PID>
   ```

2. **Connection Refused:**
   - Check firewall settings
   - Verify port is exposed in deployment
   - Ensure server is running

3. **API Forwarding Fails:**
   - Check `WEB_APP_API_URL` configuration
   - Verify network connectivity
   - Check API endpoint availability

4. **High Memory Usage:**
   - Monitor with `pm2 monit`
   - Check for memory leaks
   - Adjust `MAX_CONNECTIONS` if needed

### Log Analysis

```bash
# View application logs
pm2 logs teltonika-tcp-server

# View Docker logs
docker logs <container-id>

# View Kubernetes logs
kubectl logs -f deployment/teltonika-tcp-server
```

---

## 🎯 Recommended Deployment Strategy

### For Development/Testing:
- **Docker Compose** - Easy local development
- **Railway.app** - Quick cloud deployment

### For Production:
- **Railway.app** - If you need TCP support and simple setup
- **VPS + PM2** - For full control and cost-effectiveness
- **Kubernetes** - For enterprise-scale deployments

### For High Availability:
- **Kubernetes** with multiple replicas
- **Load balancer** for TCP traffic
- **Monitoring** and alerting setup

---

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review server logs
3. Verify environment configuration
4. Test with the provided test suite: `npm test`

---

**Happy Deploying! 🚀**
