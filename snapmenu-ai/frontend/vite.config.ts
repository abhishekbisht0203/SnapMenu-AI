import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Two distinct single-page apps built from one codebase against one API:
//  - owner.html    → the restaurant Owner/Kitchen dashboard (token auth)
//  - customer.html → the anonymous QR ordering PWA (no auth)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        owner: resolve(__dirname, 'owner.html'),
        customer: resolve(__dirname, 'customer.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
