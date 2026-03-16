import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3456,
    allowedHosts: 'all',
  },
  preview: {
    host: '0.0.0.0',
    port: 3457,
    allowedHosts: 'all',
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
  },
})
