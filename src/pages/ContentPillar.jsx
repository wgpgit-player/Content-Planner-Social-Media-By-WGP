import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import NewPillarModal from '../components/NewPillarModal'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../lib/useTenant'

export default function ContentPillar() {
  const { tenantId } = useTenant()
  const [pillars, setPillars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase || !tenantId) return
      setLoading(true)
      const now = new Date()
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const { data: pillarRows, error: err } = await supabase.from('content_pillars').select('id,name,description,color').eq('tenant_id', tenantId)
      if (err) {
        setError(err)
        setLoading(false)
        return
      }
      // Hitung jumlah konten bulan ini per pillar dari content_items.
      const { data: itemRows } = await supabase
        .from('content_items')
        .select('pillar_id')
        .gte('created_at', startOfMonth)
      const countByPillar = {}
      for (const row of itemRows ?? []) {
        if (!row.pillar_id) continue
        countByPillar[row.pillar_id] = (countByPillar[row.pillar_id] ?? 0) + 1
      }
      setPillars((pillarRows ?? []).map((p) => ({ ...p, contentCount: countByPillar[p.id] ?? 0 })))
      setLoading(false)
    }
    load()
  }, [tenantId])

  async function handleAddPillar({ name, description, color }) {
    if (!supabase) {
      setShowModal(false)
      return
    }
    const { data, error: insertErr } = await supabase
      .from('content_pillars')
      .insert({ tenant_id: tenantId, name, description, color })
      .select()
      .single()
    if (insertErr) {
      console.error('insert content_pillars error:', insertErr)
      setShowModal(false)
      return
    }
    setPillars((prev) => [...prev, { ...data, contentCount: 0 }])
    setShowModal(false)
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />
      <div style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>Content pillar</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Kategori tema konten dan jumlah konten per pillar bulan ini</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="hero-btn filled"
            style={{ color: 'var(--accent)', border: '0.5px solid var(--border)', background: 'var(--accent-bg)' }}
          >
            + Pillar baru
          </button>
        </div>

        {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat pillar...</p>}
        {error && <p style={{ fontSize: 12.5, color: '#A32D2D' }}>Gagal memuat data: {error.message}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
          {pillars.map((p) => (
            <div key={p.id} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>{p.name}</p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{p.contentCount} konten</span>
              </div>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.description || 'Belum ada deskripsi.'}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <NewPillarModal onClose={() => setShowModal(false)} onSubmit={handleAddPillar} />
      )}
    </div>
  )
}
