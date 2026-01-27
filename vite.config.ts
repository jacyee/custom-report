import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Set base path for GitHub Pages project site: https://jacyee.github.io/report
  base: '/report/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
