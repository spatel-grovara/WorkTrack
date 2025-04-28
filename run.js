#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting the server in production mode...');
// Instead of using server-prod.js, use the same server/index.ts we use in development
// but set NODE_ENV to production
const serverProc = spawn('tsx', ['server/index.ts'], {
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