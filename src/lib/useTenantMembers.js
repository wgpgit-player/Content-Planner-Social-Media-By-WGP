import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useTenantContext } from '../context/TenantContext'

// Daftar anggota ruang kerja aktif, dipakai di mana pun orang perlu dipilih
// atau ditampilkan: kolom penanggung jawab di brief, avatar di kartu Kanban,
// dan ringkasan beban kerja di dashboard admin.
//
// Email anggota ada di auth.users yang tidak bisa dibaca langsung dari client,
// jadi datanya diambil lewat RPC list_tenant_members() yang memverifikasi
// bahwa pemanggilnya memang anggota ruang kerja tersebut.
export function useTenantMembers() {
  const { tenantId } = useTenantContext()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)

    const { data, error: err } = await supabase.rpc('list_tenant_members', { p_tenant_id: tenantId })
    if (err) setError(err)
    else setMembers(data ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  return { members, loading, error, reload: load }
}

// Nama yang enak dibaca. full_name jarang diisi karena tidak ada halaman
// profil, jadi bagian sebelum @ pada email dipakai sebagai gantinya.
export function namaAnggota(anggota) {
  if (!anggota) return 'Belum ditugaskan'
  if (anggota.full_name && anggota.full_name.trim() !== '') return anggota.full_name
  return (anggota.email ?? '').split('@')[0] || 'Tanpa nama'
}

export function inisial(anggota) {
  return namaAnggota(anggota).trim().charAt(0).toUpperCase() || '?'
}

// Warna avatar diturunkan dari id supaya satu orang selalu mendapat warna yang
// sama di seluruh aplikasi, tanpa perlu menyimpan pilihan warna di database.
const WARNA = ['#6B5EE0', '#2563A8', '#1F7A55', '#9A5B0E', '#B4467F', '#3E7C8C', '#7A4FB5']

export function warnaAnggota(userId) {
  if (!userId) return 'var(--border-strong)'
  let jumlah = 0
  for (let i = 0; i < userId.length; i++) jumlah += userId.charCodeAt(i)
  return WARNA[jumlah % WARNA.length]
}
