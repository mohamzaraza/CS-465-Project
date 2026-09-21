import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

// vite.config.js exports a function of { command }, so resolve it as the dev
// server would ("serve"); tests then see the same base and plugins as `npm run dev`.
export default defineConfig((env) =>
  mergeConfig(viteConfig({ ...env, command: 'serve' }), {
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.test.{js,jsx}'],
    },
  })
)
