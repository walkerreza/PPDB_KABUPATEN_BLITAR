import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@material-tailwind/react', 'flowbite']
        }
      }
    },
    assetsInlineLimit: 4096,
    assetsInclude: ['**/*.{png,jpg,gif,svg,webp}'],
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    open: true,
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      overlay: true
    }
  }
});
