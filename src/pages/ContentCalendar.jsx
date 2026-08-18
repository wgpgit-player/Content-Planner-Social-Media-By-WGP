import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabaseClient'
import { getPlatform } from '../config/platforms'

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// Filter dibangun dari daftar platform yang benar-benar dipakai di data,
// bukan hardcode 2 platform — begitu ada konten dengan platform baru
// (Facebook, YouTube, dst dari config/platforms.js), filter-nya otomatis
// muncul tanpa perlu ubah kode halaman ini.
function useAvailableFilters(items) {
  const usedKeys = [...new Set(items.map((i) => i.platform))]
  return ['Semua', ...usedKeys.map((key) => getPlatform(key).label)]
}

// List view per tanggal dulu (bukan grid kalender penuh) — lebih cepat
// dibangun dan tetap kepakai buat lihat jadwal, sesuai arahan "rapikan
// fitur dulu, desain interface nyusul". Grid kalender visual bisa jadi
// polish berikutnya kalau memang dibutuhkan.
//
// Sekarang baca langsung dari tabel content_items (RLS filter tenant
// otomatis) — sama dengan sumber data yang dipakai KanbanBoard.jsx, jadi
// keduanya konsisten begitu ada perubahan status/tanggal.
export default function ContentCalendar() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Semua')

  useEffect(() => {
    async function load() {
      if (!supabase) return
      setLoading(true)
      const [{ data: pillarRows }, { data: itemRows, error: err }] = await Promise.all([
        supabase.from('content_pillars').select('id,name'),
        supabase.from('content_items').select('id,title,platform,pillar_id,status,scheduled_date').not('scheduled_date', 'is', null),
      ])
      if (err) setError(err)
      const pillarNameById = Object.fromEntries((pillarRows ?? []).map((p) => [p.id, p.name]))
      setItems((itemRows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        platform: row.platform,
        pillar: row.pillar_id ? pillarNameById[row.pillar_id] ?? null : null,
        status: row.status,
        scheduledDate: row.scheduled_date,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const filters = useAvailableFilters(items)

  const scheduled = items
    .filter((i) => filter === 'Semua' || getPlatform(i.platform).label === filter)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  const grouped = scheduled.reduce((acc, item) => {
    (acc[item.scheduledDate] ||= []).push(item)
    return acc
  }, {})

  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00')
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />

      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>Content calendar</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Konten yang sudah punya tanggal jadwal, diurut dari terdekat</p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 12, padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                border: '0.5px solid var(--border)',
                background: filter === f ? 'var(--accent)' : '#fff',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat jadwal...</p>}
        {error && <p style={{ fontSize: 12.5, color: '#A32D2D' }}>Gagal memuat data: {error.message}</p>}

        {!loading && Object.keys(grouped).length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Belum ada konten terjadwal untuk filter ini.</p>
        )}

        {Object.entries(grouped).map(([date, dayItems]) => (
          <div key={date} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{formatDate(date)}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayItems.map((item) => {
                const platform = getPlatform(item.platform)
                return (
                  <div key={item.id} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: platform.bg,
                    }}>
                      <i className={`ti ${platform.icon}`} style={{ fontSize: 13, color: platform.color }} aria-hidden="true" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-primary)' }}>{item.title}</p>
                      <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0 }}>{item.pillar} · {item.status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
