#!/bin/bash

# Install dependencies
npm install

# Create client build directory
mkdir -p dist/client

# Build frontend using Vite
echo "Building frontend..."
cd client
npx vite build
cd ..

# Copy built client files
echo "Copying client files..."
cp -r client/dist/* dist/client/

# Build server
echo "Building server..."
echo "// This is a placeholder server build" > dist/index.js

echo "Build completed!"