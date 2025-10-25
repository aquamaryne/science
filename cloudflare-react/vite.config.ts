import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Розділяємо великі бібліотеки на окремі чанки
          'react-vendor': ['react', 'react-dom', 'react-redux'],
          'redux-vendor': ['@reduxjs/toolkit'],
          'ui-vendor': ['lucide-react'],
          'pdf-vendor': ['@react-pdf/renderer'],
          'excel-vendor': ['xlsx'],
          'chart-vendor': ['recharts'],
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Збільшуємо ліміт до 1MB
  }
})
