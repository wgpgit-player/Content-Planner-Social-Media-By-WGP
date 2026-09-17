import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../lib/useTenant'

const STATUS_LABEL = { open: 'Belum dipakai', used: 'Sudah dipakai', archived: 'Diarsipkan' }
const STATUS_COLOR = {
  open: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
  used: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
  archived: { bg: 'var(--surface-1)', text: 'var(--text-secondary)' },
}
const STATUS_ORDER = ['open', 'used', 'archived']

function mapRow(row, pillarNameById) {
  return {
    id: row.id,
    ideaText: row.idea_text,
    pillar: row.pillar_id ? pillarNameById[row.pillar_id] ?? null : null,
    pillarId: row.pillar_id,
    status: row.status,
  }
}

// Fitur inti: tambah ide baru (form sederhana), filter per status, dan lihat
// pillar tiap ide. Belum ada "convert ke content_items" — itu logis masuk
// begitu Kanban & Content Bank sama-sama connect ke Supabase (insert row
// content_items dari content_bank_items yang dipilih), jadi sengaja belum
// dibangun di versi ini juga.
// Batas jumlah ide yang dimuat sekali jalan (lihat catatan di KanbanBoard).
const BANK_LIMIT = 300

export default function ContentBank() {
  const { user } = useAuth()
  const { tenantId } = useTenant()
  const [items, setItems] = useState([])
  const [pillars, setPillars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [newIdea, setNewIdea] = useState('')
  const [newPillarId, setNewPillarId] = useState(null)

  useEffect(() => {
    async function load() {
      if (!supabase || !tenantId) return
      setLoading(true)
      const [{ data: pillarRows }, { data: bankRows, error: err }] = await Promise.all([
        supabase.from('content_pillars').select('id,name').eq('tenant_id', tenantId),
        supabase.from('content_bank_items').select('id,idea_text,pillar_id,status').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(BANK_LIMIT),
      ])
      if (err) setError(err)
      const pillarNameById = Object.fromEntries((pillarRows ?? []).map((p) => [p.id, p.name]))
      setPillars(pillarRows ?? [])
      if (pillarRows?.length) setNewPillarId(pillarRows[0].id)
      setItems((bankRows ?? []).map((row) => mapRow(row, pillarNameById)))
      setLoading(false)
    }
    load()
  }, [tenantId])

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter)

  async function addIdea(e) {
    e.preventDefault()
    if (!newIdea.trim() || !supabase) return
    const payload = {
      tenant_id: tenantId,
      idea_text: newIdea.trim(),
      pillar_id: newPillarId,
      status: 'open',
      created_by: user?.id ?? null,
    }
    const { data, error: insertErr } = await supabase.from('content_bank_items').insert(payload).select().single()
    if (insertErr) {
      console.error('insert content_bank_items error:', insertErr)
      return
    }
    const pillarNameById = Object.fromEntries(pillars.map((p) => [p.id, p.name]))
    setItems((prev) => [mapRow(data, pillarNameById), ...prev])
    setNewIdea('')
  }

  async function cycleStatus(id) {
    const current = items.find((i) => i.id === id)
    if (!current || !supabase) return
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current.status) + 1) % STATUS_ORDER.length]
    const prevItems = items
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: next } : i)))
    const { error: updateErr } = await supabase.from('content_bank_items').update({ status: next }).eq('id', id)
    if (updateErr) {
      console.error('update content_bank_items error:', updateErr)
      setItems(prevItems)
    }
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />

      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>Bank ide konten</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Simpan ide sebelum jadi konten beneran di Project tracker</p>
        </div>

        <form onSubmit={addIdea} style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 14, marginBottom: 14, display: 'flex', gap: 8 }}>
          <input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Tulis ide konten baru..."
            style={{ flex: 1, border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
          />
          <select
            value={newPillarId ?? ''}
            onChange={(e) => setNewPillarId(e.target.value)}
            style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}
          >
            {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="submit" className="hero-btn filled" style={{ color: 'var(--accent)', border: '0.5px solid var(--border)', background: 'var(--accent-bg)' }}>
            + Tambah
          </button>
        </form>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['all', 'open', 'used', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                fontSize: 12, padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                border: '0.5px solid var(--border)',
                background: filter === s ? 'var(--accent)' : '#fff',
                color: filter === s ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {s === 'all' ? 'Semua' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat ide...</p>}
        {error && <p style={{ fontSize: 12.5, color: '#A32D2D' }}>Gagal memuat data: {error.message}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, margin: '0 0 3px', color: 'var(--text-primary)' }}>{item.ideaText}</p>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{item.pillar}</span>
              </div>
              <button
                onClick={() => cycleStatus(item.id)}
                style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: STATUS_COLOR[item.status].bg, color: STATUS_COLOR[item.status].text,
                }}
                title="Klik buat ubah status"
              >
                {STATUS_LABEL[item.status]}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Belum ada ide di kategori ini.</p>
          )}
        </div>
      </div>
    </div>
  )
}
