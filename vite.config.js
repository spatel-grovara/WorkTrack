// vite.config.js
export default {
    plugins: [],
    server: {
      port: 3000,
      proxy: {
        '/api': 'http://localhost:5000'
      }
    },
    build: {
      outDir: 'dist/client',
    }
  }