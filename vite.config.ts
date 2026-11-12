import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env': {},
  },
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      maxParallelFileOps: 2,
      external: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/messaging', 'firebase/functions', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', '@aws-sdk/signature-v4', '@aws-crypto/sha256-js', '@aws-sdk/credential-provider-node'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
  },
});
