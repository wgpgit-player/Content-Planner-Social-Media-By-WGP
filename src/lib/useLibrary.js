import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useTenantContext } from '../context/TenantContext'

// Data perpustakaan konten: CTA, hook, dan formula caption.
//
// Ketiganya tinggal di satu tabel library_items yang dibedakan kolom kind.
// Hook ini yang menutup perbedaannya, jadi halaman pemakainya tidak perlu
// tahu bahwa mereka berbagi tabel.
//
// Sebelum ini, ketiga modul memakai data contoh di src/data/mockLibraries.js
// dan apa pun yang ditambahkan pengguna hilang begitu halaman dimuat ulang.
// Itu satu-satunya modul yang masih dalam kondisi begitu.

export function useLibrary(kind) {
  const { tenantId, isAdmin } = useTenantContext()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)
    setGalat(null)

    const { data, error } = await supabase
      .from('library_items')
      .select('id,kind,title,body,category,created_at')
      .eq('tenant_id', tenantId)
      .eq('kind', kind)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) setGalat(error.message)
    setItems(data ?? [])
    setLoading(false)
  }, [tenantId, kind])

  useEffect(() => { muat() }, [muat])

  async function tambah({ title, body, category }) {
    if (!supabase || !tenantId) return { error: 'Belum tersambung ke server.' }

    const { data, error } = await supabase
      .from('library_items')
      .insert({
        tenant_id: tenantId,
        kind,
        title: title?.trim() || null,
        body: body.trim(),
        category: category?.trim() || null,
      })
      .select('id,kind,title,body,category,created_at')
      .single()

    if (error) { setGalat(error.message); return { error: error.message } }

    setItems((prev) => [data, ...prev])
    return {}
  }

  async function hapus(id) {
    if (!supabase) return
    // Dihapus dari tampilan lebih dulu supaya terasa cepat, lalu
    // dikembalikan kalau servernya menolak — daftar yang tidak sama dengan
    // isi database lebih buruk daripada jeda sebentar.
    const sebelum = items
    setItems((prev) => prev.filter((i) => i.id !== id))

    const { error } = await supabase
      .from('library_items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      setItems(sebelum)
      setGalat(error.message)
    }
  }

  async function isiContoh() {
    if (!supabase || !tenantId) return
    const { error } = await supabase.rpc('isi_perpustakaan_contoh', { p_tenant_id: tenantId })
    if (error) { setGalat(error.message); return }
    await muat()
  }

  const kategori = ['Semua', ...new Set(items.map((i) => i.category).filter(Boolean))]

  return { items, kategori, loading, galat, isAdmin, tambah, hapus, isiContoh, reload: muat }
}
