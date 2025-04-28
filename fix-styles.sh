#!/bin/bash
# This script copies all the required Tailwind CSS files from your local development

# 1. Capture current Tailwind CSS content 
echo "Generating Tailwind CSS content..."
npx tailwindcss -o tailwind-output.css

# 2. Create a special production CSS bundle
echo "Creating production CSS bundle..."
cat > production-styles.css << 'EOL'
/* Tailwind base styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom variables */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}

body {
  @apply bg-background text-foreground;
}

/* Component styles */
.container {
  @apply mx-auto px-4 sm:px-6 lg:px-8;
  max-width: 1200px;
}

/* Layout styles */
.card {
  @apply bg-card text-card-foreground rounded-lg border shadow-sm;
}

.status-indicator {
  @apply h-2.5 w-2.5 rounded-full;
}

.status-indicator.active {
  @apply bg-green-500;
}

.status-indicator.inactive {
  @apply bg-red-500;
}

/* Button styles */
.btn {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none ring-offset-background;
}

.btn-default {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

.btn-secondary {
  @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
}

.btn-destructive {
  @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
}

.btn-outline {
  @apply border border-input hover:bg-accent hover:text-accent-foreground;
}

.btn-ghost {
  @apply hover:bg-accent hover:text-accent-foreground;
}

.btn-link {
  @apply underline-offset-4 hover:underline text-primary;
}

/* Form styles */
.form-input {
  @apply flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm
    ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
    placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
}

/* Navigation styles */
.nav-link {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors 
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none ring-offset-background
    hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2;
}

.nav-link.active {
  @apply bg-secondary text-secondary-foreground;
}

/* Dashboard-specific styles */
.dashboard-header {
  @apply flex flex-col md:flex-row md:items-center md:justify-between mb-6;
}

.dashboard-title {
  @apply text-3xl font-bold tracking-tight;
}

.stats-card {
  @apply p-6 space-y-4;
}

.stats-card-title {
  @apply text-xl font-semibold;
}

.stats-card-value {
  @apply text-3xl font-bold;
}

/* Time entry styles */
.time-entry {
  @apply flex items-center justify-between p-4 border-b last:border-0;
}

.time-duration {
  @apply font-mono text-right;
}

/* Dashboard card grid */
.dashboard-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6;
}

/* Progress bar */
.progress-container {
  @apply h-2.5 w-full bg-secondary rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full bg-primary;
}

/* Custom Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Report styles */
.report-header {
  @apply flex flex-col md:flex-row md:items-center md:justify-between mb-6;
}

.report-title {
  @apply text-2xl font-bold;
}

.report-controls {
  @apply flex flex-col sm:flex-row gap-2 mt-4 md:mt-0;
}

.report-table {
  @apply w-full border-collapse;
}

.report-table th {
  @apply text-left py-3 px-4 bg-muted text-muted-foreground font-medium text-sm;
}

.report-table td {
  @apply py-3 px-4 border-b border-border;
}
EOL

# 3. Create a production bundle for the client
echo "Setting up client CSS bundle for production..."
mkdir -p client/dist/styles
cp production-styles.css client/dist/styles/main.css

# 4. Create a styled index.html
echo "Creating styled index.html..."
cat > client/dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WorkTrack - Time Tracking App</title>
    <link rel="stylesheet" href="/assets/index-DaUGtDKE.css" />
    <link rel="stylesheet" href="/styles/main.css" />
    <style>
      /* Ensure basic styling if CSS load fails */
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        margin: 0;
        padding: 0;
        line-height: 1.5;
        background-color: #f8f9fa;
        color: #212529;
      }
      
      .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        background-color: #3b82f6;
        color: #ffffff;
        font-weight: 500;
        padding: 0.5rem 1rem;
        cursor: pointer;
        border: none;
        transition: background-color 0.2s;
      }
      
      .btn-primary:hover {
        background-color: #2563eb;
      }
      
      .card {
        background-color: #ffffff;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 1rem;
      }
      
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background-color: #ffffff;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index-CgKx52Zi.js"></script>
    <script type="module" src="/assets/index.es-ClsAZ7Qr.js"></script>
  </body>
</html>
EOL

# 5. Copy the same file to the public directory
mkdir -p public/styles
cp production-styles.css public/styles/main.css
cp client/dist/index.html public/index.html

echo "CSS styling fixes applied!"