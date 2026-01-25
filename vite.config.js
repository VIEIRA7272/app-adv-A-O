import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Otimização para mobile - dividir o bundle em chunks menores
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - carregados separadamente
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-pdf': ['pdf-lib', 'react-pdf'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['qrcode', 'react-draggable', 'tailwind-merge']
        }
      }
    },
    // Minificação agressiva
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true
      }
    },
    // Dividir CSS por componente
    cssCodeSplit: true,
    // Desabilitar sourcemaps em produção (menor tamanho)
    sourcemap: false,
    // Chunk size warning - ajustado para mobile
    chunkSizeWarningLimit: 300
  },
  // Otimizações de desenvolvimento
  server: {
    // Faster HMR
    hmr: { overlay: true }
  }
})
