import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    minify: 'terser',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
