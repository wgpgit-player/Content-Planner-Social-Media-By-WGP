import { createClient } from '@supabase/supabase-js'

// Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env (lihat .env.example)
// setelah project Supabase kamu siap. Sebelum itu, komponen yang manggil
// fungsi di file ini akan gagal connect — dashboard tetap bisa dilihat
// pakai MOCK_DATA di Dashboard.jsx tanpa perlu Supabase hidup.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
