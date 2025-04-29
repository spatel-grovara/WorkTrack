#!/bin/bash

# Install root dependencies first
echo "Installing root dependencies..."
npm install

# Build client
echo "Building client..."
cd client
npm run build
cd ..

# Compile TypeScript files
echo "Compiling TypeScript..."
npx tsc

echo "Build process completed!"