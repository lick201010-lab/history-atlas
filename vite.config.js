import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Force a single three instance and pre-bundle the examples util with it so
  // dev doesn't load a second copy of three (production already dedupes via the
  // `three` manualChunk). Avoids the "Multiple instances of Three.js" warning.
  resolve: {
    dedupe: ['three'],
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/utils/BufferGeometryUtils.js'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          maplibre: ['maplibre-gl'],
          three: ['three'],
        },
      },
    },
  },
});
