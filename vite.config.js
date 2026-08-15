import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor':   ['@mui/material', '@emotion/react', '@emotion/styled'],
          'dexie':        ['dexie'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
