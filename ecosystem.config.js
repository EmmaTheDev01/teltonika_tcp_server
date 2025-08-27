module.exports = {
  apps: [{
    name: 'teltonika-tcp-server',
    script: 'server.js',
    instances: 1, // TCP servers should typically run as single instance
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      TCP_PORT: 5000,
      TCP_HOST: '0.0.0.0',
      WEB_APP_API_URL: 'http://localhost:3000/api/gps/teltonika',
      API_TIMEOUT: 10000,
      SERVER_ID: 'tcp-server-pm2',
      LOG_LEVEL: 'info',
      ENABLE_DEBUG_LOGGING: 'false',
      MAX_CONNECTIONS: 100,
      CONNECTION_TIMEOUT: 30000,
      HEALTH_PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      TCP_PORT: 5000,
      TCP_HOST: '0.0.0.0',
      WEB_APP_API_URL: process.env.WEB_APP_API_URL || 'https://your-web-app.com/api/gps/teltonika',
      API_TIMEOUT: 10000,
      SERVER_ID: 'tcp-server-pm2-prod',
      LOG_LEVEL: 'info',
      ENABLE_DEBUG_LOGGING: 'false',
      MAX_CONNECTIONS: 100,
      CONNECTION_TIMEOUT: 30000,
      HEALTH_PORT: 8080
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    
    // Health check
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
};
