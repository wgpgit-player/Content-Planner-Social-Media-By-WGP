import { createClient } from '@supabase/supabase-js'

// Nilai ini ditanam ke dalam bundel JS SAAT BUILD, bukan dibaca saat aplikasi
// berjalan. Konsekuensinya penting untuk deployment:
//
//   - File .env lokal sengaja tidak ikut ke Git (lihat .gitignore), jadi
//     server build seperti Vercel tidak pernah melihat isinya.
//   - Variabel harus didaftarkan di pengaturan project hosting-nya sendiri.
//   - Menambahkan variabel TIDAK memperbaiki build yang sudah terlanjur jadi.
//     Harus ada build ulang setelah variabelnya ada.
//
// Dua penamaan diterima, dicoba berurutan:
//
//   1. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
//      Penamaan utama, dipakai di file .env lokal.
//
//   2. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
//      Penamaan yang dipasang otomatis oleh integrasi Supabase-Vercel. Nama
//      itu berasal dari konvensi Next.js, tapi isinya sama persis. Menerimanya
//      membuat integrasi langsung berfungsi tanpa perlu menduplikasi variabel
//      secara manual. Agar terbaca, awalan NEXT_PUBLIC_ juga didaftarkan di
//      envPrefix pada vite.config.js.
//
// Kunci publishable dan anon sama-sama aman berada di sisi klien: keduanya
// dibatasi Row Level Security. Yang TIDAK BOLEH pernah muncul di file ini atau
// di variabel mana pun yang terbaca Vite adalah service role key dan secret
// key, karena keduanya menembus seluruh RLS.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Tanpa konfigurasi, aplikasi berjalan dalam "mode preview": sesi disimpan di
// localStorage dan datanya contoh belaka. Itu berguna saat menggarap tampilan
// di komputer sendiri, tapi menyesatkan kalau sampai terjadi di versi yang
// sudah di-deploy — user mengira aplikasinya rusak, padahal konfigurasinya
// yang belum lengkap. Karena itu kondisi ini dibedakan dan ditampilkan terang-
// terangan (lihat SetupNeeded.jsx).
export const isMisconfiguredDeployment = import.meta.env.PROD && !isSupabaseConfigured

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
