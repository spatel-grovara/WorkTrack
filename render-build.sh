#!/bin/bash
# This script handles the build process for Render deployment

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install --include=dev

# Step 2: Build the client application
echo "Building client application..."
# Create a minimal package.json for the client
cat > client/package.json <<EOL
{
  "name": "worktrack-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build"
  }
}
EOL

# Install client dependencies and build
cd client
npm install @vitejs/plugin-react vite
npm run build
cd ..

# Step 3: Create client/dist directory if it doesn't exist
echo "Checking for client/dist directory..."
mkdir -p client/dist

# Step 4: Copy index.html to dist if build didn't create it
if [ ! -f client/dist/index.html ]; then
  echo "Copying index.html to dist..."
  cp client/index.html client/dist/
fi

# Set execute permissions for run.js
chmod +x run.js

echo "Build completed successfully!"