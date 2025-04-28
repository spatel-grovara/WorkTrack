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

# Step 6: Process Tailwind CSS for production...
echo "Processing Tailwind CSS for production..."
mkdir -p client/dist
mkdir -p public
mkdir -p public/assets
mkdir -p client/dist/assets

# First create a simple copy of index.css (not compiled) as a fallback
echo "Creating raw fallback CSS..."
cp client/src/index.css public/raw-index.css

# Copy the CSS file directly from source to destination
echo "Creating direct CSS copy..."
echo '@tailwind base; @tailwind components; @tailwind utilities;' > public/tailwind-directives.css 

# Find all possible CSS files and copy them to multiple locations for maximum coverage
echo "Looking for compiled CSS files..."
find client/dist -name "*.css" -type f | while read css_file; do
  filename=$(basename "$css_file")
  echo "Found CSS: $filename - copying to ensure availability"
  cp "$css_file" public/assets/ || true
  cp "$css_file" public/ || true
  cp "$css_file" client/dist/ || true
done

# Output the available CSS files for debugging
echo "CSS files in client/dist:"
find client/dist -name "*.css" -type f
echo "CSS files in public:"
find public -name "*.css" -type f

echo "Static assets setup complete"

# Set execute permissions for run.js
chmod +x run.js

echo "Build completed successfully!"