#!/bin/bash
# This script handles the build process for Render deployment

# Step 1: Install dependencies for server and client
echo "Installing dependencies..."
npm install --include=dev

# Make sure tsx is installed globally for production
echo "Installing tsx globally..."
npm install -g tsx

# Step 2: Don't build the client - we'll use Vite in production mode
echo "Preparing client..."
# Make sure the client has all necessary dependencies
cd client
npm install
cd ..

# Step 3: Set execute permissions for run.js
chmod +x run.js

echo "Build preparation completed successfully!"