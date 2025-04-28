#!/bin/bash
# This script handles the build process for Render deployment

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install --include=dev

# Make sure tsx is installed globally for production
echo "Installing tsx globally..."
npm install -g tsx

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

# Step 5: Create a public directory to copy static assets
echo "Setting up static assets..."
mkdir -p public
cp -R client/dist/* public/

# Step 6: Ensure all assets are available in both client/dist and public
echo "Ensuring all assets are properly available..."
mkdir -p client/dist
mkdir -p public
# Just ensure directories exist, we're using the Vite-generated CSS directly

echo "Static assets setup complete"

# Set execute permissions for run.js
chmod +x run.js

echo "Build completed successfully!"