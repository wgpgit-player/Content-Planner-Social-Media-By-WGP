import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import KanbanCard from '../components/KanbanCard'
import NewContentModal from '../components/NewContentModal'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../lib/useTenant'

const COLUMNS = [
  { key: 'idea', label: 'Ide', dotColor: '#B4B2A9' },
  { key: 'draft', label: 'Draft', dotColor: '#8b8a94' },
  { key: 'review', label: 'Review', dotColor: '#EF9F27' },
  { key: 'scheduled', label: 'Terjadwal', dotColor: '#7C6FF0' },
  { key: 'published', label: 'Tayang', dotColor: '#5DCAA5' },
]

// Baca content_items + nama pillar-nya (join manual lewat content_pillars,
// karena kolom content_items.pillar_id adalah FK, sedangkan UI di sini
// (KanbanCard, dst) masih pakai `item.pillar` sebagai teks nama pillar).
function mapRow(row, pillarNameById) {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    pillar: row.pillar_id ? pillarNameById[row.pillar_id] ?? null : null,
    pillarId: row.pillar_id,
    status: row.status,
    scheduledDate: row.scheduled_date,
  }
}

export default function KanbanBoard() {
  const { user } = useAuth()
  const { tenantId } = useTenant()
  const [items, setItems] = useState([])
  const [pillars, setPillars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [showModal, setShowModal] = useState(false)

  async function loadItems() {
    if (!supabase) return
    setLoading(true)
    const [{ data: pillarRows }, { data: itemRows, error: err }] = await Promise.all([
      supabase.from('content_pillars').select('id,name'),
      supabase.from('content_items').select('id,title,platform,pillar_id,status,scheduled_date').order('created_at', { ascending: false }),
    ])
    if (err) setError(err)
    const pillarNameById = Object.fromEntries((pillarRows ?? []).map((p) => [p.id, p.name]))
    setPillars(pillarRows ?? [])
    setItems((itemRows ?? []).map((row) => mapRow(row, pillarNameById)))
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  }, [])

  function handleDragStart(e, id) {
    e.dataTransfer.setData('text/plain', String(id))
  }

  async function handleDrop(e, columnKey) {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData('text/plain'))
    const prevItems = items
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: columnKey } : item)))
    setDragOverCol(null)

    if (!supabase) return
    const { error: updateErr } = await supabase.from('content_items').update({ status: columnKey }).eq('id', id)
    if (updateErr) {
      console.error('update status error:', updateErr)
      setItems(prevItems)
      return
    }
    if (user) {
      await supabase.from('activity_log').insert({
        tenant_id: tenantId,
        content_item_id: id,
        user_id: user.id,
        action: 'status_changed',
        detail: { status: columnKey },
      })
    }
  }

  async function handleAddContent({ title, platform, pillar, scheduledDate, scheduledTime }) {
    if (!supabase) {
      setShowModal(false)
      return
    }
    const pillarRow = pillars.find((p) => p.name === pillar)
    const payload = {
      tenant_id: tenantId,
      title,
      platform,
      pillar_id: pillarRow?.id ?? null,
      status: 'idea',
      created_by: user?.id ?? null,
      scheduled_date: scheduledDate ?? null,
      scheduled_time: scheduledTime ?? null,
    }
    const { data, error: insertErr } = await supabase.from('content_items').insert(payload).select().single()
    if (insertErr) {
      console.error('insert content_items error:', insertErr)
      setShowModal(false)
      return
    }
    const pillarNameById = Object.fromEntries(pillars.map((p) => [p.id, p.name]))
    setItems((prev) => [mapRow(data, pillarNameById), ...prev])
    setShowModal(false)
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>Project tracker</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Drag kartu antar kolom buat ubah status</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="hero-btn filled"
            style={{ color: 'var(--accent)', border: '0.5px solid var(--border)', background: 'var(--accent-bg)' }}
          >
            + Konten baru
          </button>
        </div>

        {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat konten...</p>}
        {error && <p style={{ fontSize: 12.5, color: '#A32D2D' }}>Gagal memuat data: {error.message}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
          {COLUMNS.map((col) => {
            const colItems = items.filter((i) => i.status === col.key)
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.key)}
                style={{
                  background: dragOverCol === col.key ? 'var(--accent-bg)' : 'var(--surface-2)',
                  borderRadius: 12, padding: 10, minHeight: 320, transition: 'background 0.1s',
                }}
              >
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.dotColor, display: 'inline-block' }} />
                  {col.label} · {colItems.length}
                </p>
                {colItems.map((item) => (
                  <KanbanCard key={item.id} item={item} onDragStart={handleDragStart} />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <NewContentModal onClose={() => setShowModal(false)} onSubmit={handleAddContent} />
      )}
    </div>
  )
}
