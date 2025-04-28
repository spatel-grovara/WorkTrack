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

# Step 6: Use proper Tailwind processing for production
echo "Setting up proper Tailwind CSS for production..."
mkdir -p client/dist
mkdir -p public
mkdir -p public/assets
mkdir -p client/dist/assets

# Create index.css directly in public for use by production
echo "Creating optimized Tailwind CSS..."
cat > public/tailwind.css <<EOL
/* Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom application styles */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  line-height: 1.5;
  margin: 0;
  padding: 0;
}

.card {
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-indicator {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-active {
  background-color: #22c55e;
}

.status-inactive {
  background-color: #ef4444;
}
EOL

# If client build generated CSS, let's leverage those files too
echo "Preserving Vite-generated CSS files..."
find client/dist -name "*.css" -type f | while read css_file; do
  dest_dir=$(dirname "$css_file" | sed 's|client/dist|public|')
  mkdir -p "$dest_dir"
  echo "Copying $css_file to $dest_dir"
  cp "$css_file" "$dest_dir/"
done

# Make a copy of the original tailwind.config.ts for use with CLI
echo "Setting up Tailwind config for production build..."
cp tailwind.config.ts tailwind.prod.ts

# Install tailwindcss CLI for building production CSS
echo "Installing tailwindcss for production build..."
npm install -g tailwindcss

# Run tailwindcss directly using the existing config
echo "Building tailwind CSS for production using existing config..."
NODE_ENV=production npx tailwindcss -c tailwind.config.ts -i client/src/index.css -o public/styles.css

# Verify the output
if [ -f public/styles.css ]; then
  echo "✅ Successfully built Tailwind CSS using project config"
  # Add styles.css reference to index.html
  if [ -f public/index.html ]; then
    echo "Adding styles.css link to index.html"
    sed -i 's|</head>|<link rel="stylesheet" href="/styles.css"></head>|' public/index.html
  fi
else
  echo "❌ Failed to build Tailwind CSS with project config"
  # Fall back to using a simplified approach
  echo "Trying alternative approach..."
  npx tailwindcss -i client/src/index.css -o public/styles.css --minify
fi

# Output the available CSS files for debugging
echo "CSS files in public directory:"
find public -name "*.css" -type f

echo "Static assets setup complete"

# Set execute permissions for run.js
chmod +x run.js

echo "Build completed successfully!"