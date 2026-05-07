import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pre-declare all heavy deps so esbuild never needs to crawl src/ at startup.
    // This prevents the esbuild OOM crash on dev server cold start.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand',
      'lucide-react',
      '@googlemaps/js-api-loader',
      'axios',
    ],
    // Limit the dep scan to only the HTML entry point — not the whole src tree.
    entries: ['index.html'],
    force: false,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-state': ['zustand'],
          'vendor-maps': ['@googlemaps/js-api-loader'],
          'vendor-icons': ['lucide-react'],
          'vendor-http': ['axios'],
        },
      },
    },
  },
});
