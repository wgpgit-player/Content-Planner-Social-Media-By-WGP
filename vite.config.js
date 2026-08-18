import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Konfigurasi standar Vite — build multi-file normal (JS/CSS terpisah,
// code-split per halaman). Cocok untuk deploy ke Vercel/static hosting.
// (Sempat pakai vite-plugin-singlefile untuk eksperimen preview offline,
// sudah tidak dipakai lagi per keputusan 18 Agustus 2026.)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
