import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (
            id.includes('lucide-react-motion') ||
            id.includes(`${'node_modules'}/motion/`) ||
            id.includes(`${'node_modules'}\\motion\\`) ||
            id.includes('framer-motion') ||
            id.includes('motion-dom')
          ) {
            return 'nav-motion'
          }
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('@capacitor')) return 'capacitor'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
        },
      },
    },
  },
})
