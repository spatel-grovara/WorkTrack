#!/bin/bash
set -e

# Install dependencies
echo "Installing dependencies..."
npm install

# Create server script
echo "Creating server script..."
cat > server-start.js << 'EOF'
// Import the necessary modules
import './node_modules/tsx/dist/cli.js';
EOF

echo "Build process completed successfully!"