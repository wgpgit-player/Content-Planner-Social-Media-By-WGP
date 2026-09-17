import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Auth dasar Fase 1.3. Dua mode:
// 1. supabase belum connect (VITE_SUPABASE_URL kosong, lihat supabaseClient.js)
//    → pakai mock auth: sesi disimpan di localStorage, tidak ada validasi
//    password sungguhan. Cukup buat nge-tes alur login/logout/protected route.
// 2. supabase sudah connect → pakai supabase.auth beneran (signInWithPassword,
//    onAuthStateChange, signOut). Kode di bawah sudah nyiapin cabang ini,
//    tinggal isi .env begitu project Supabase siap — tidak perlu ubah
//    komponen manapun yang makai useAuth().

const AuthContext = createContext(null)
const MOCK_SESSION_KEY = 'content-planner-mock-session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null)
        setLoading(false)
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      return () => sub.subscription.unsubscribe()
    }

    // Mode mock: baca sesi dari localStorage
    const saved = localStorage.getItem(MOCK_SESSION_KEY)
    setUser(saved ? JSON.parse(saved) : null)
    setLoading(false)
  }, [])

  async function signIn(email, password) {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setUser(data.user)
      return
    }

    // Mock: validasi minimal (format email + password minimal 6 karakter),
    // TIDAK ada pengecekan password sungguhan — jangan dipakai buat data asli.
    if (!email.includes('@')) throw new Error('Format email tidak valid.')
    if (password.length < 6) throw new Error('Password minimal 6 karakter.')
    const mockUser = { id: 'mock-user', email, name: email.split('@')[0] }
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser))
    setUser(mockUser)
  }

  // Pendaftaran mandiri — inti dari produk white-label: siapa saja bisa bikin
  // akun sendiri tanpa perlu dibuatkan manual lewat dashboard Supabase.
  //
  // Kalau konfirmasi email diaktifkan di Supabase Auth, signUp() mengembalikan
  // user tapi TANPA session. Nilai balik needsEmailConfirmation dipakai halaman
  // Signup untuk menampilkan pesan "cek email dulu" alih-alih langsung
  // melempar user ke wizard onboarding yang pasti gagal karena belum login.
  async function signUp(email, password) {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (data.session) setUser(data.user)
      return { needsEmailConfirmation: !data.session }
    }

    if (!email.includes('@')) throw new Error('Format email tidak valid.')
    if (password.length < 6) throw new Error('Password minimal 6 karakter.')
    const mockUser = { id: 'mock-user', email, name: email.split('@')[0] }
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser))
    setUser(mockUser)
    return { needsEmailConfirmation: false }
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut()
      setUser(null)
      return
    }
    localStorage.removeItem(MOCK_SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isMock: !supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
