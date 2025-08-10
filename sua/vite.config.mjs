import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {defineConfig} from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'src/public',
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['@shopify/shop-minis-react'],
  },
  server: {
    fs: {
      // Allow serving files from the project root
      allow: ['..']
    }
  }
})
