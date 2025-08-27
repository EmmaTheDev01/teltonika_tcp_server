import http from 'http';
import { getServerStatus } from './server.js';

// Create HTTP server for health checks
const healthServer = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const status = getServerStatus();
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tcpServer: status,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production'
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  } else {
    res.writeHead(405);
    res.end(JSON.stringify({
      error: 'Method not allowed',
      allowedMethods: ['GET', 'OPTIONS']
    }));
  }
});

// Start health check server on port 8080
const HEALTH_PORT = process.env.HEALTH_PORT || 8080;
healthServer.listen(HEALTH_PORT, () => {
  console.log(`🏥 Health check server running on port ${HEALTH_PORT}`);
}).on('error', (error) => {
  console.error(`❌ Health check server failed to start: ${error.message}`);
  // Don't exit the process, just log the error
});

// Graceful shutdown for health server
process.on('SIGINT', () => {
  console.log('🛑 Shutting down health check server...');
  healthServer.close(() => {
    console.log('✅ Health check server shutdown complete');
  });
});

export { healthServer };
