#!/bin/bash

# Install dependencies
npm install

# Create a custom build step without relying on vite.config.ts
echo "Building client..."
npx vite build --config vite.config.js

echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed!"