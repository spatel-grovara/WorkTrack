#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run our simple production server directly
console.log('Starting the production server...');
const serverProc = spawn('node', ['server-prod.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  }
});

serverProc.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});