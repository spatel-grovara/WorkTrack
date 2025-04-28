#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Run the server using tsx
console.log('Starting the server...');
const serverProc = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '5000'
  }
});

serverProc.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});