import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'

// Checklist pengerjaan tugas per kartu konten.
//
// Terhubung langsung ke tabel public.checklist_items di Supabase.
// Membantu karyawan/creator menyelesaikan alur eksekusi konten secara
// bertahap dan teratur sesuai arahan manajer sosmed.

const TEMPLATE_STANDAR = [
  'Riset referensi & tentukan hook konten',
  'Tulis draf naskah/caption & tentukan CTA',
  'Buat desain visual / edit video & kumpulkan link aset',
  'Quality check mandiri (cek typo, resolusi, & kesesuaian brand)',
  'Serahkan draf & ajukan review ke Manajer Sosmed',
]

export default function ChecklistTugas({ contentItemId }) {
  const { tenantId } = useTenantContext()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [baru, setBaru] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [galat, setGalat] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase || !contentItemId || !tenantId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('checklist_items')
      .select('id,label,is_done,position,created_at')
      .eq('content_item_id', contentItemId)
      .eq('tenant_id', tenantId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      setGalat(error.message)
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }, [contentItemId, tenantId])

  useEffect(() => {
    muat()
  }, [muat])

  async function toggle(id, statusSekarang) {
    const baru = !statusSekarang
    // Optimistic UI update
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_done: baru } : it)))

    const { error } = await supabase
      .from('checklist_items')
      .update({ is_done: baru })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      setGalat(error.message)
      // Rollback jika gagal
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_done: statusSekarang } : it)))
    }
  }

  async function tambah(e) {
    if (e) e.preventDefault()
    const teks = baru.trim()
    if (!teks || submitting) return

    setSubmitting(true)
    const posisiBaru = items.length ? Math.max(...items.map((i) => Number(i.position) || 0)) + 1 : 1

    const { data, error } = await supabase
      .from('checklist_items')
      .insert({
        tenant_id: tenantId,
        content_item_id: contentItemId,
        label: teks,
        is_done: false,
        position: posisiBaru,
      })
      .select('id,label,is_done,position,created_at')
      .single()

    setSubmitting(false)
    if (error) {
      setGalat(error.message)
    } else if (data) {
      setItems((prev) => [...prev, data])
      setBaru('')
    }
  }

  async function hapus(id) {
    const backup = [...items]
    setItems((prev) => prev.filter((it) => it.id !== id))

    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      setGalat(error.message)
      setItems(backup)
    }
  }

  async function pasangTemplateStandar() {
    if (submitting) return
    setSubmitting(true)

    const payload = TEMPLATE_STANDAR.map((label, idx) => ({
      tenant_id: tenantId,
      content_item_id: contentItemId,
      label,
      is_done: false,
      position: idx + 1,
    }))

    const { data, error } = await supabase
      .from('checklist_items')
      .insert(payload)
      .select('id,label,is_done,position,created_at')

    setSubmitting(false)
    if (error) {
      setGalat(error.message)
    } else if (data) {
      setItems((prev) => [...prev, ...data])
    }
  }

  const selesai = items.filter((i) => i.is_done).length
  const total = items.length
  const persen = total > 0 ? Math.round((selesai / total) * 100) : 0

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="checkbox-outline" size={17} color="var(--accent)" />
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Checklist Eksekusi Tugas</h3>
        </div>

        {total > 0 && (
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              background: selesai === total ? 'var(--success-bg, #e6f4ea)' : 'var(--surface-1)',
              color: selesai === total ? 'var(--success, #137333)' : 'var(--text-secondary)',
            }}
          >
            {selesai}/{total} Selesai ({persen}%)
          </span>
        )}
      </div>

      {total > 0 && (
        <div
          style={{
            height: 5,
            borderRadius: 3,
            background: 'var(--border, #e5e7eb)',
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${persen}%`,
              background: selesai === total ? 'var(--success, #10b981)' : 'var(--accent, #6366f1)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
      )}

      {galat && (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>
          {galat}
        </p>
      )}

      {loading ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat checklist...</p>
      ) : total === 0 ? (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
            Belum ada langkah kerja untuk tugas ini.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={pasangTemplateStandar}
            disabled={submitting}
          >
            <Icon name="sparkles-outline" size={14} />
            Pasang 5 Checklist Standar SOP
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 8px',
                borderRadius: 7,
                background: it.is_done ? 'var(--surface-1, #f9fafb)' : 'transparent',
                border: '1px solid var(--border-subtle, #f0f0f0)',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(it.id, it.is_done)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: it.is_done ? 'var(--success, #10b981)' : 'var(--text-muted)',
                }}
                title={it.is_done ? 'Tandai belum selesai' : 'Tandai selesai'}
              >
                <Icon
                  name={it.is_done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={19}
                />
              </button>

              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  textDecoration: it.is_done ? 'line-through' : 'none',
                  color: it.is_done ? 'var(--text-muted)' : 'var(--text-primary)',
                }}
              >
                {it.label}
              </span>

              <button
                type="button"
                onClick={() => hapus(it.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.6,
                }}
                title="Hapus langkah ini"
              >
                <Icon name="close-outline" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input tambah langkah baru */}
      <form onSubmit={tambah} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          type="text"
          className="field-input"
          placeholder="Tambah langkah kerja baru..."
          value={baru}
          onChange={(e) => setBaru(e.target.value)}
          style={{ fontSize: 12.5, padding: '7px 10px', height: 34 }}
        />
        <button
          type="submit"
          className="btn btn-secondary btn-sm"
          disabled={!baru.trim() || submitting}
          style={{ flexShrink: 0, height: 34 }}
        >
          <Icon name="add-outline" size={15} />
          Tambah
        </button>
      </form>
    </div>
  )
}
