import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

// Pusat state ruang kerja (tenant).
//
// Satu user bisa jadi anggota beberapa ruang kerja, jadi di sini disimpan:
// daftarnya, mana yang sedang aktif, peran user di situ, dan brandingnya.
// Warna aksen diterapkan langsung ke CSS variable --accent, sehingga seluruh
// tampilan ikut berubah tanpa perlu meneruskan prop warna ke mana-mana.
//
// CATATAN PENTING SOAL `siapReady` DAN `needsOnboarding`
//
// Versi sebelumnya memakai satu penanda `loading` biasa, dan itu menimbulkan
// bug yang merugikan: setiap login membuat ruang kerja baru.
//
// Penyebabnya begini. Saat halaman dimuat, sesi login belum selesai dipulihkan
// sehingga `user` masih null. Pemuatan data langsung berhenti di situ dan
// menyetel loading menjadi false dengan daftar ruang kerja kosong. Begitu sesi
// selesai dan `user` terisi, React merender ulang dalam keadaan:
//
//     user ada  +  loading false  +  daftar ruang kerja masih kosong
//
// Kombinasi itu terbaca sebagai "user ini belum punya ruang kerja", padahal
// datanya memang belum sempat diambil. Penjaga halaman langsung melempar ke
// wizard onboarding saat render, sebelum efek pemuatan untuk user yang baru
// sempat berjalan. Wizard tidak memeriksa apa-apa, jadi ia membuat ruang kerja
// duplikat. Tiga kali login berarti tiga ruang kerja bernama sama.
//
// Karena itu yang dipakai sekarang bukan "sedang memuat atau tidak", melainkan
// "data untuk user INI sudah benar-benar berhasil diambil atau belum", lewat
// `dimuatUntuk`. Selama belum, halaman menunggu dan tidak menyimpulkan apa pun.

const TenantContext = createContext(null)
const ACTIVE_TENANT_KEY = 'content-planner-active-tenant'
const DEFAULT_ACCENT = '#6B5EE0'

// Dipakai hanya saat aplikasi berjalan tanpa Supabase (mode preview).
const MOCK_TENANT = {
  id: 'mock-tenant',
  name: 'Ruang Kerja Preview',
  slug: 'preview',
  logo_url: null,
  brand_color: DEFAULT_ACCENT,
  hero_background_url: null,
  onboarding_completed: true,
  subscription_plan: 'free',
  role: 'admin',
}

function applyAccent(color) {
  const root = document.documentElement
  root.style.setProperty('--accent', color || DEFAULT_ACCENT)
  // Teks di atas warna aksen: hitung luminansi kasar supaya warna brand yang
  // terang (kuning, lime) tidak menghasilkan tulisan putih yang tak terbaca.
  root.style.setProperty('--accent-text', isLight(color) ? '#17171F' : '#FFFFFF')
}

function isLight(hex) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72
}

export function TenantProvider({ children }) {
  const { user, loading: authLoading } = useAuth()

  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState(null)
  const [error, setError] = useState(null)
  // Id user yang datanya sudah berhasil diambil. null berarti belum ada.
  const [dimuatUntuk, setDimuatUntuk] = useState(null)

  const load = useCallback(async () => {
    if (!user) {
      setTenants([])
      setTenantId(null)
      setDimuatUntuk(null)
      setError(null)
      return
    }

    // Mode preview (belum tersambung ke Supabase): sediakan satu ruang kerja
    // tiruan, supaya tampilan tetap bisa dilihat tanpa server.
    if (!supabase) {
      setTenants([MOCK_TENANT])
      setTenantId(MOCK_TENANT.id)
      setDimuatUntuk(user.id)
      return
    }

    setError(null)

    const { data, error: err } = await supabase
      .from('tenant_members')
      .select('role, tenant_id, tenants(id, name, slug, logo_url, brand_color, hero_background_url, onboarding_completed, subscription_plan)')
      .eq('user_id', user.id)

    if (err) {
      // Gagal mengambil data BUKAN berarti user tidak punya ruang kerja.
      // `dimuatUntuk` sengaja tidak diisi, sehingga needsOnboarding tetap
      // false dan tidak ada yang terlempar ke wizard hanya karena jaringan
      // sedang bermasalah.
      setError(err)
      return
    }

    const list = (data ?? [])
      .filter((row) => row.tenants)
      .map((row) => ({ ...row.tenants, role: row.role }))
      .sort((a, b) => a.name.localeCompare(b.name))

    setTenants(list)

    // Ruang kerja aktif: yang terakhir dipakai kalau masih jadi anggota,
    // kalau tidak ambil yang pertama.
    const saved = localStorage.getItem(ACTIVE_TENANT_KEY)
    const next = list.find((t) => t.id === saved) ?? list[0] ?? null
    setTenantId(next?.id ?? null)
    if (next) localStorage.setItem(ACTIVE_TENANT_KEY, next.id)
    else localStorage.removeItem(ACTIVE_TENANT_KEY)

    setDimuatUntuk(user.id)
  }, [user])

  useEffect(() => { load() }, [load])

  const tenant = tenants.find((t) => t.id === tenantId) ?? null

  useEffect(() => { applyAccent(tenant?.brand_color) }, [tenant?.brand_color])

  function switchTenant(id) {
    if (!tenants.some((t) => t.id === id)) return
    localStorage.setItem(ACTIVE_TENANT_KEY, id)
    setTenantId(id)
  }

  // Dipanggil halaman Pengaturan setelah menyimpan branding, supaya sidebar
  // dan warna aksen langsung ikut berubah tanpa reload.
  function patchActiveTenant(patch) {
    setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, ...patch } : t)))
  }

  // Data untuk user yang sedang login sudah benar-benar ada di tangan.
  const siap = Boolean(user) && dimuatUntuk === user.id

  const value = {
    tenants,
    tenant,
    tenantId,
    role: tenant?.role ?? null,
    isAdmin: tenant?.role === 'admin',
    // Menunggu selama sesi belum jelas, atau data user ini belum selesai
    // diambil dan belum ada galat yang perlu ditampilkan.
    loading: authLoading || (Boolean(user) && !siap && !error),
    error,
    siap,
    switchTenant,
    patchActiveTenant,
    reloadTenants: load,
    // Hanya boleh true kalau datanya sudah benar-benar diambil dan hasilnya
    // memang kosong. Bukan karena masih dimuat, dan bukan karena gagal.
    needsOnboarding: siap && tenants.length === 0,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenantContext() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenantContext harus dipakai di dalam <TenantProvider>')
  return ctx
}
