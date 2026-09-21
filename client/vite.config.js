import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Only use the GitHub Pages sub-path for production builds.
// In dev, serving from "/" keeps the "/src/assets/..." and "/videos/..." paths working.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/CS-465-Project/' : '/',
  plugins: [react()],
}))