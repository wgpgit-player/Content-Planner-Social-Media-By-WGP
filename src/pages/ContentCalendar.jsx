import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabaseClient'
import { getPlatform } from '../config/platforms'

// Grid kalender mingguan ala referensi "calendar.me" milik user, tapi warna
// ditenangkan (bukan neon/dark) — pakai warna pastel per-platform yang sudah
// ada di config/platforms.js, konsisten sama gaya fitplan yang dipakai di
// Dashboard. Sumbu jam dari 07.00-21.00, event diposisikan berdasar kolom
// scheduled_time (jam opsional, item tanpa jam masuk ke tray "Tanpa jam").

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i) // 07..21
const HOUR_HEIGHT = 52
const DEFAULT_DURATION_MIN = 50

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function mondayOf(d) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - 1) // mulai dari Minggu
  return monday
}

function buildWeekDates(mondayStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayStart)
    d.setDate(mondayStart.getDate() + i)
    return d
  })
}

function timeToMinutes(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function useAvailableFilters(items) {
  const usedKeys = [...new Set(items.map((i) => i.platform))]
  return ['Semua', ...usedKeys.map((key) => getPlatform(key).label)]
}

function EventBlock({ item, style, onClick }) {
  const p = getPlatform(item.platform)
  return (
    <div
      onClick={() => onClick(item)}
      style={{
        position: 'absolute', left: 3, right: 3, borderRadius: 8, padding: '5px 7px',
        background: p.bg, color: p.color, cursor: 'pointer', overflow: 'hidden',
        border: `0.5px solid ${p.color}33`, ...style,
      }}
    >
      <p style={{ fontSize: 10.5, fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.title}
      </p>
      {style.height > 34 && (
        <p style={{ fontSize: 9.5, margin: '1px 0 0', opacity: 0.85 }}>{item.scheduledTime?.slice(0, 5) ?? ''}</p>
      )}
    </div>
  )
}

function DetailPopup({ item, onClose, onSave }) {
  const [time, setTime] = useState(item.scheduledTime?.slice(0, 5) ?? '')
  const [saving, setSaving] = useState(false)
  const p = getPlatform(item.platform)

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, time || null)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.35)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 18, width: 300 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontWeight: 500, fontSize: 14, margin: 0, paddingRight: 10 }}>{item.title}</p>
          <i className="ti ti-x" onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15 }} aria-hidden="true" />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: p.bg, color: p.color }}>{p.label}</span>
          {item.pillar && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent)' }}>{item.pillar}</span>}
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
          <i className="ti ti-calendar" style={{ fontSize: 13, verticalAlign: -2 }} aria-hidden="true" /> {item.scheduledDate}
        </p>

        <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', margin: '10px 0 4px' }}>Jam tayang</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Tutup
          </button>
          <button onClick={handleSave} disabled={saving} style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
            {saving ? 'Menyimpan...' : 'Simpan jam'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContentCalendar() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('Semua')
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [selected, setSelected] = useState(null)

  async function load() {
    if (!supabase) return
    setLoading(true)
    const [{ data: pillarRows }, { data: itemRows, error: err }] = await Promise.all([
      supabase.from('content_pillars').select('id,name'),
      supabase.from('content_items').select('id,title,platform,pillar_id,status,scheduled_date,scheduled_time').not('scheduled_date', 'is', null),
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
      scheduledTime: row.scheduled_time,
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSaveTime(id, time) {
    if (!supabase) return
    await supabase.from('content_items').update({ scheduled_time: time }).eq('id', id)
    await load()
  }

  const filters = useAvailableFilters(items)
  const filtered = items.filter((i) => filter === 'Semua' || getPlatform(i.platform).label === filter)

  const weekDates = useMemo(() => buildWeekDates(weekStart), [weekStart])
  const weekIsoSet = useMemo(() => new Set(weekDates.map(isoDate)), [weekDates])

  const itemsByDate = useMemo(() => {
    const map = {}
    for (const it of filtered) {
      if (!weekIsoSet.has(it.scheduledDate)) continue
      ;(map[it.scheduledDate] ||= []).push(it)
    }
    return map
  }, [filtered, weekIsoSet])

  const today = isoDate(new Date())

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>Content calendar</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {weekDates[0].getDate()} {MONTHS[weekDates[0].getMonth()]} - {weekDates[6].getDate()} {MONTHS[weekDates[6].getMonth()]}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
              style={{ width: 30, height: 30, borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer' }}
            >
              <i className="ti ti-chevron-left" aria-hidden="true" />
            </button>
            <button
              onClick={() => setWeekStart(mondayOf(new Date()))}
              style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              Hari ini
            </button>
            <button
              onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
              style={{ width: 30, height: 30, borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer' }}
            >
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
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

        {!loading && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)' }}>
              <div />
              {weekDates.map((d) => {
                const iso = isoDate(d)
                const isToday = iso === today
                return (
                  <div key={iso} style={{ textAlign: 'center', padding: '10px 0', borderLeft: '0.5px solid var(--border)' }}>
                    <p style={{ fontSize: 10, margin: 0, color: 'var(--text-muted)' }}>{DAY_LABELS[d.getDay()]}</p>
                    <p style={{
                      fontSize: 13, fontWeight: 500, margin: '2px auto 0', width: 26, height: 26, lineHeight: '26px',
                      borderRadius: '50%', background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--text-primary)',
                    }}>
                      {d.getDate()}
                    </p>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', maxHeight: 560, overflowY: 'auto' }}>
              <div>
                {HOURS.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT, fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', paddingRight: 6, borderTop: '0.5px solid var(--border)', boxSizing: 'border-box' }}>
                    <span style={{ position: 'relative', top: -6 }}>{h}:00</span>
                  </div>
                ))}
              </div>

              {weekDates.map((d) => {
                const iso = isoDate(d)
                const dayItems = itemsByDate[iso] ?? []
                const timed = dayItems.filter((it) => it.scheduledTime)
                const untimed = dayItems.filter((it) => !it.scheduledTime)
                return (
                  <div key={iso} style={{ position: 'relative', borderLeft: '0.5px solid var(--border)' }}>
                    {HOURS.map((h) => (
                      <div key={h} style={{ height: HOUR_HEIGHT, borderTop: '0.5px solid var(--border)', boxSizing: 'border-box' }} />
                    ))}

                    {untimed.length > 0 && (
                      <div style={{ position: 'absolute', top: 2, left: 3, right: 3, display: 'flex', flexDirection: 'column', gap: 3, zIndex: 1 }}>
                        {untimed.map((it) => (
                          <div key={it.id} onClick={() => setSelected(it)} style={{
                            fontSize: 9.5, padding: '3px 6px', borderRadius: 6, cursor: 'pointer',
                            background: getPlatform(it.platform).bg, color: getPlatform(it.platform).color,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {it.title}
                          </div>
                        ))}
                      </div>
                    )}

                    {timed.map((it) => {
                      const startMin = timeToMinutes(it.scheduledTime) - HOURS[0] * 60
                      const top = (startMin / 60) * HOUR_HEIGHT
                      const height = Math.max((DEFAULT_DURATION_MIN / 60) * HOUR_HEIGHT, 26)
                      return (
                        <EventBlock
                          key={it.id}
                          item={it}
                          onClick={setSelected}
                          style={{ top: top + (untimed.length > 0 ? 24 : 0), height }}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {selected && (
          <DetailPopup item={selected} onClose={() => setSelected(null)} onSave={handleSaveTime} />
        )}
      </div>
    </div>
  )
}
