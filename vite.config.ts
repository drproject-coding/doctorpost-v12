import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Import path module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost'
  },
  resolve: {
    alias: {
      // Define alias for @ to point to src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },
})