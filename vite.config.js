import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },

  // Secara bawaan Vite hanya meneruskan variabel berawalan VITE_ ke kode
  // aplikasi. Integrasi Supabase-Vercel memasang variabelnya dengan penamaan
  // khas Next.js (NEXT_PUBLIC_SUPABASE_URL dan seterusnya), sehingga tanpa
  // baris ini variabel dari integrasi tidak pernah terbaca dan aplikasi
  // mengira dirinya belum dikonfigurasi.
  //
  // PENTING soal keamanan: apa pun yang cocok dengan awalan di bawah akan ikut
  // tertanam di bundel JavaScript yang bisa dibaca siapa saja. Awalan
  // NEXT_PUBLIC_ aman karena memang dirancang untuk konsumsi publik.
  //
  // Awalan "SUPABASE_" polos SENGAJA TIDAK dicantumkan. Integrasi itu juga
  // memasang SUPABASE_SERVICE_ROLE_KEY dan SUPABASE_SECRET_KEY yang bisa
  // menembus seluruh Row Level Security. Menambahkannya ke daftar ini akan
  // membocorkan kunci tersebut ke setiap pengunjung situs.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
