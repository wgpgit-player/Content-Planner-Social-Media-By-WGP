import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

// Pusat state workspace (tenant) untuk aplikasi white-label ini.
//
// Kenapa dibuat context, bukan hook lokal seperti useTenant.js yang lama:
// dulu aplikasinya diasumsikan satu organisasi saja, jadi cukup cari satu
// tenant_id lalu di-cache di module scope. Sekarang satu user bisa jadi
// anggota beberapa workspace (mis. agensi yang mengelola beberapa klien),
// jadi butuh:
//   - daftar semua workspace milik user
//   - workspace mana yang sedang aktif (bisa diganti lewat TenantSwitcher)
//   - role user di workspace itu (admin/staff) buat gating tombol
//   - branding workspace (nama, logo, warna) buat tampilan white-label
//
// Warna aksen diterapkan langsung ke CSS variable --accent di <html>, jadi
// seluruh komponen ikut berubah tanpa perlu meneruskan prop warna ke mana-mana.

const TenantContext = createContext(null)
const ACTIVE_TENANT_KEY = 'content-planner-active-tenant'
const DEFAULT_ACCENT = '#6B5EE0'

// Dipakai hanya saat aplikasi berjalan tanpa Supabase (mode preview).
const MOCK_TENANT = {
  id: 'mock-tenant',
  name: 'Workspace Preview',
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
  const { user } = useAuth()
  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) {
      setTenants([])
      setTenantId(null)
      setLoading(false)
      return
    }

    // Mode preview (belum tersambung ke Supabase): sediakan satu workspace
    // tiruan. Tanpa ini daftar workspace selalu kosong, needsOnboarding jadi
    // true selamanya, dan user terkunci di wizard onboarding yang justru tidak
    // bisa menyimpan apa-apa karena servernya memang belum ada.
    if (!supabase) {
      setTenants([MOCK_TENANT])
      setTenantId(MOCK_TENANT.id)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Ambil keanggotaan + data tenant-nya sekaligus lewat relasi foreign key.
    const { data, error: err } = await supabase
      .from('tenant_members')
      .select('role, tenant_id, tenants(id, name, slug, logo_url, brand_color, hero_background_url, onboarding_completed, subscription_plan)')
      .eq('user_id', user.id)

    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    const list = (data ?? [])
      .filter((row) => row.tenants)
      .map((row) => ({ ...row.tenants, role: row.role }))
      .sort((a, b) => a.name.localeCompare(b.name))

    setTenants(list)

    // Pilih workspace aktif: yang terakhir dipakai kalau masih jadi anggota,
    // kalau tidak ambil yang pertama.
    const saved = localStorage.getItem(ACTIVE_TENANT_KEY)
    const next = list.find((t) => t.id === saved) ?? list[0] ?? null
    setTenantId(next?.id ?? null)
    if (next) localStorage.setItem(ACTIVE_TENANT_KEY, next.id)
    else localStorage.removeItem(ACTIVE_TENANT_KEY)

    setLoading(false)
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

  const value = {
    tenants,
    tenant,
    tenantId,
    role: tenant?.role ?? null,
    isAdmin: tenant?.role === 'admin',
    loading,
    error,
    switchTenant,
    patchActiveTenant,
    reloadTenants: load,
    // true kalau user sudah login tapi belum punya workspace sama sekali —
    // dipakai OnboardingGate buat melempar ke wizard.
    needsOnboarding: !loading && !!user && tenants.length === 0,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenantContext() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenantContext harus dipakai di dalam <TenantProvider>')
  return ctx
}
