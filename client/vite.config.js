
// Import plugins conditionally to prevent errors during build
import { defineConfig } from 'vite';
import path from 'path';

// Export the client-side vite config
export default defineConfig(async () => {
  // Dynamically import the React plugin
  let react;
  try {
    react = (await import('@vitejs/plugin-react')).default;
  } catch (e) {
    console.warn('Could not import @vitejs/plugin-react, continuing without it');
    react = () => ({
      name: 'dummy-react-plugin',
      transform() { return null; }
    });
  }

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, '../shared'),
        '@assets': path.resolve(__dirname, '../attached_assets'),
      },
    },
  };
});
