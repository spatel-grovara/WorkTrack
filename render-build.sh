#!/bin/bash
set -e

# Log each command for debugging
set -x

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
mkdir -p dist/server
mkdir -p dist/client

# Copy server files directly (no compilation/bundling)
echo "Preparing server files..."
cp -r server/* dist/server/
cp -r shared dist/

# Modify server files to use CommonJS
find dist/server -name "*.ts" -exec sed -i 's/from "@shared/from "..\/shared/g' {} \;

# Create simple server starter script
cat > dist/server/index.js << 'EOF'
require('tsx/dist/cli').main(['', '', 'dist/server/index.ts']);
EOF

# Prepare static client files
echo "Preparing client files..."
mkdir -p dist/client/assets
cp client/index.html dist/client/

echo "Build process completed successfully!"