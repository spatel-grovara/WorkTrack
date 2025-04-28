#!/bin/bash

# Install dependencies including those needed for the build
npm install
npm install @vitejs/plugin-react vite tailwindcss postcss autoprefixer esbuild --no-save

# Run the build
npm run build

# Clean up node_modules to make deployment smaller
# npm prune --production