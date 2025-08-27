#!/usr/bin/env node

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('🚀 Starting Teltonika TCP Server locally...');
console.log('📋 Configuration:');
console.log(`   TCP Port: ${process.env.TCP_PORT || 5000}`);
console.log(`   TCP Host: ${process.env.TCP_HOST || '0.0.0.0'}`);
console.log(`   Next.js API: ${process.env.NEXT_API_URL || 'http://localhost:3000/api/gps/teltonika'}`);
console.log(`   Health Port: ${process.env.HEALTH_PORT || 8080}`);
console.log('');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

// Handle server process
server.on('close', (code) => {
  console.log(`\n🔌 Server process exited with code ${code}`);
  process.exit(code);
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});
