import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { isoDate, dayOfYear } from './dates'

// Agenda: hari penting dan kegiatan workspace, digabung per tanggal.
//
// Dua sumber yang berbeda sifatnya:
//
//   hari_penting     katalog bersama, sama untuk semua workspace. Inilah
//                    yang membuat kalender tidak pernah kosong sejak hari
//                    pertama. Isinya kecil, sekitar tiga puluh baris, jadi
//                    diambil seluruhnya sekali lalu dicocokkan di sini —
//                    jauh lebih sederhana daripada menyusun kueri SQL yang
//                    memproyeksikan tanggal berulang ke rentang tertentu.
//
//   calendar_events  milik workspace: jadwal syuting, tanggal peluncuran,
//                    tenggat laporan. Diambil sesuai rentang yang terlihat.
//
// Keduanya tampil di baris yang sama di atas kalender, karena bagi yang
// melihat, keduanya sama-sama menjawab "ada apa hari itu".

export const JENIS_EVENT = [
  { key: 'shoot', label: 'Produksi / syuting', icon: 'videocam-outline', warna: '#9A5B0E' },
  { key: 'launch', label: 'Peluncuran', icon: 'rocket-outline', warna: '#A33333' },
  { key: 'campaign', label: 'Kampanye / email', icon: 'mail-outline', warna: '#2563A8' },
  { key: 'blog', label: 'Artikel / blog', icon: 'document-text-outline', warna: '#3E7C8C' },
  { key: 'collab', label: 'Kolaborasi', icon: 'people-outline', warna: '#B4467F' },
  { key: 'report', label: 'Tenggat laporan', icon: 'bar-chart-outline', warna: '#6B5EE0' },
  { key: 'other', label: 'Lainnya', icon: 'ellipse-outline', warna: '#6B7280' },
]

export function getJenisEvent(key) {
  return JENIS_EVENT.find((j) => j.key === key) ?? JENIS_EVENT[JENIS_EVENT.length - 1]
}

export function useAgenda(tanggalTerlihat) {
  const { tenantId } = useTenantContext()

  const [hariPenting, setHariPenting] = useState([])
  const [events, setEvents] = useState([])
  const [ideHarian, setIdeHarian] = useState([])
  const [loading, setLoading] = useState(true)

  // Rentang dihitung dari tanggal yang terlihat. Dipisah jadi dua nilai
  // primitif supaya useCallback di bawah tidak dijalankan ulang setiap
  // render hanya karena array-nya objek baru.
  const mulai = tanggalTerlihat.length ? isoDate(tanggalTerlihat[0]) : null
  const selesai = tanggalTerlihat.length ? isoDate(tanggalTerlihat[tanggalTerlihat.length - 1]) : null

  const muat = useCallback(async () => {
    if (!supabase || !tenantId || !mulai) { setLoading(false); return }
    setLoading(true)

    const [a, b, c] = await Promise.all([
      supabase.from('hari_penting').select('id,nama,kategori,bulan,tanggal,tanggal_pasti,perkiraan,warna,catatan'),
      supabase.from('calendar_events')
        .select('id,title,event_type,event_date,end_date,note')
        .eq('tenant_id', tenantId)
        .lte('event_date', selesai)
        // Kegiatan yang membentang beberapa hari tetap ikut walau tanggal
        // mulainya sebelum rentang yang terlihat.
        .or(`end_date.gte.${mulai},and(end_date.is.null,event_date.gte.${mulai})`),
      // Katalog kecil (30 baris), sama untuk semua workspace. Diambil ulang
      // tiap kali rentang tanggal berubah sama seperti hari_penting — cukup
      // murah untuk tabel sekecil ini, dan lebih sederhana daripada menyimpan
      // cache-nya sendiri di sini.
      supabase.from('ide_konten_harian').select('id,teks,urutan').order('urutan'),
    ])

    setHariPenting(a.data ?? [])
    setEvents(b.data ?? [])
    setIdeHarian(c.data ?? [])
    setLoading(false)
  }, [tenantId, mulai, selesai])

  useEffect(() => { muat() }, [muat])

  const agendaPerTanggal = useMemo(() => {
    const peta = {}
    const tambah = (iso, isi) => {
      if (!peta[iso]) peta[iso] = []
      peta[iso].push(isi)
    }

    for (const d of tanggalTerlihat) {
      const iso = isoDate(d)
      const bulan = d.getMonth() + 1
      const tgl = d.getDate()

      for (const h of hariPenting) {
        const cocokBerulang = h.bulan === bulan && h.tanggal === tgl
        const cocokPasti = h.tanggal_pasti === iso
        if (cocokBerulang || cocokPasti) {
          tambah(iso, {
            id: `h-${h.id}-${iso}`,
            jenis: 'hari',
            judul: h.nama,
            warna: h.warna ?? '#6B7280',
            perkiraan: h.perkiraan,
            catatan: h.catatan,
            kategori: h.kategori,
          })
        }
      }

      for (const e of events) {
        const dalamRentang =
          e.end_date ? iso >= e.event_date && iso <= e.end_date : iso === e.event_date
        if (dalamRentang) {
          const j = getJenisEvent(e.event_type)
          tambah(iso, {
            id: `e-${e.id}-${iso}`,
            eventId: e.id,
            jenis: 'event',
            judul: e.title,
            warna: j.warna,
            icon: j.icon,
            catatan: e.note,
            tipeLabel: j.label,
          })
        }
      }

      // Kalau hari itu belum punya apa-apa (bukan hari penting, bukan
      // kegiatan), isi dengan satu ide konten harian — dipilih deterministik
      // dari hari-ke-berapa-dalam-setahun, supaya tanggal yang sama selalu
      // menunjukkan ide yang sama, dan idenya berbeda dari hari ke hari.
      // Ini yang membuat kalender "tidak pernah kosong" ala Plann, tapi
      // ditandai jelas sebagai SARAN (redup, ikon bohlam) — bukan kegiatan
      // sungguhan, supaya tidak tertukar dengan agenda asli.
      if (!peta[iso] && ideHarian.length > 0) {
        const idx = dayOfYear(d) % ideHarian.length
        const ide = ideHarian[idx]
        tambah(iso, {
          id: `i-${ide.id}-${iso}`,
          jenis: 'ide',
          judul: ide.teks,
          warna: '#8A8A93',
          saran: true,
        })
      }
    }

    return peta
  }, [tanggalTerlihat, hariPenting, events, ideHarian])

  return { agendaPerTanggal, events, loading, reload: muat }
}
