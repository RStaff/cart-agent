import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: { port: 5174, strictPort: true, open: true },
  preview: { port: 5174, strictPort: true }
})
