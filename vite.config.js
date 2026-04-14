import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/fitscan/',
  server: {
    host: true,
  },
  resolve: {
    alias: {
      // Stub out @mediapipe/pose — we use MoveNet with tfjs runtime only
      '@mediapipe/pose': path.resolve(__dirname, 'src/mediapipe-pose-stub.js'),
    },
  },
})
