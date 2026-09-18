import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import KanbanCard from '../components/KanbanCard'
import NewContentModal from '../components/NewContentModal'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../lib/useTenant'
import { STATUSES } from '../config/statuses'
import { useTenantMembers } from '../lib/useTenantMembers'

// Papan Kanban.
//
// BUG YANG DIPERBAIKI: kartu tidak bisa dipindah sama sekali.
//
// Saat kartu dilepas, id yang dibaca dari dataTransfer diubah dengan Number().
// Itu peninggalan masa data contoh, ketika id konten masih berupa angka. Di
// database id konten adalah UUID seperti "8382edc7-55aa-4d9d...", dan Number()
// atas teks seperti itu menghasilkan NaN. Akibatnya kartu tidak pernah ketemu
// di daftar, tampilannya tidak berubah, dan perintah update ke server memakai
// id NaN yang pasti gagal. Kegagalannya hanya masuk ke console, jadi dari sisi
// pengguna papan ini terlihat rusak tanpa penjelasan. Id kini diperlakukan
// sebagai teks apa adanya, dan galat ditampilkan di layar.
//
// Tiap kolom juga diberi warna sendiri, diambil dari config/statuses.js supaya
// label dan warnanya sama persis dengan yang dipakai dashboard dan kalender.

const BATAS_KARTU = 300

function mapRow(row, namaPillar) {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    pillar: row.pillar_id ? namaPillar[row.pillar_id] ?? null : null,
    pillarId: row.pillar_id,
    status: row.status,
    scheduledDate: row.scheduled_date,
    brief: row.brief,
    assigneeId: row.assignee_id,
  }
}

export default function KanbanBoard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenantId } = useTenant()
  const { members } = useTenantMembers()

  const [items, setItems] = useState([])
  const [pillars, setPillars] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesan, setPesan] = useState(null)
  const [kolomAktif, setKolomAktif] = useState(null)
  const [kartuDigeser, setKartuDigeser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  // 'semua' atau 'saya'. Papan bisa jadi ramai begitu tim bertambah, dan yang
  // paling sering ditanyakan orang adalah bagiannya sendiri.
  const [saringan, setSaringan] = useState('semua')

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return
    setLoading(true)

    const [{ data: pillarRows }, { data: itemRows, error: err }] = await Promise.all([
      supabase.from('content_pillars').select('id,name').eq('tenant_id', tenantId).order('name'),
      supabase.from('content_items').select('id,title,platform,pillar_id,status,scheduled_date,brief,assignee_id')
        .eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(BATAS_KARTU),
    ])

    if (err) setPesan({ type: 'error', text: `Gagal memuat konten: ${err.message}` })

    const namaPillar = Object.fromEntries((pillarRows ?? []).map((p) => [p.id, p.name]))
    setPillars(pillarRows ?? [])
    setItems((itemRows ?? []).map((row) => mapRow(row, namaPillar)))
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  function mulaiGeser(e, id) {
    // Disimpan sebagai teks. Id konten adalah UUID, bukan angka.
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setKartuDigeser(id)
  }

  function selesaiGeser() {
    setKartuDigeser(null)
    setKolomAktif(null)
  }

  async function lepaskan(e, statusBaru) {
    e.preventDefault()
    setKolomAktif(null)
    setKartuDigeser(null)

    const id = e.dataTransfer.getData('text/plain')
    if (!id) return

    const kartu = items.find((i) => i.id === id)
    if (!kartu || kartu.status === statusBaru) return

    const sebelum = items
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: statusBaru } : i)))
    setPesan(null)

    if (!supabase) return

    const { error } = await supabase
      .from('content_items')
      .update({ status: statusBaru })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      // Kembalikan tampilan ke keadaan semula supaya papan tidak menampilkan
      // sesuatu yang sebenarnya tidak tersimpan.
      setItems(sebelum)
      setPesan({ type: 'error', text: `Gagal memindahkan kartu: ${error.message}` })
      return
    }

    if (user) {
      await supabase.from('activity_log').insert({
        tenant_id: tenantId,
        content_item_id: id,
        user_id: user.id,
        action: 'status_changed',
        detail: { status: statusBaru },
      })
    }
  }

  async function tambahKonten({ title, platform, pillar, scheduledDate, scheduledTime }) {
    if (!supabase) { setShowModal(false); return }

    const barisPillar = pillars.find((p) => p.name === pillar)
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        tenant_id: tenantId,
        title,
        platform,
        pillar_id: barisPillar?.id ?? null,
        status: 'idea',
        created_by: user?.id ?? null,
        scheduled_date: scheduledDate ?? null,
        scheduled_time: scheduledTime ?? null,
      })
      .select()
      .single()

    if (error) {
      setShowModal(false)
      setPesan({ type: 'error', text: `Gagal membuat konten: ${error.message}` })
      return
    }

    const namaPillar = Object.fromEntries(pillars.map((p) => [p.id, p.name]))
    setItems((prev) => [mapRow(data, namaPillar), ...prev])
    setShowModal(false)
    // Judul saja tidak cukup untuk dikerjakan, jadi langsung ke halaman brief
    // selagi idenya masih hangat.
    navigate(`/content/${data.id}`)
  }

  const anggotaById = Object.fromEntries(members.map((m) => [m.user_id, m]))
  const terlihat = saringan === 'saya' ? items.filter((i) => i.assigneeId === user?.id) : items

  return (
    <AppShell
      title="Project tracker"
      description="Geser kartu untuk mengubah status, klik untuk membuka briefnya."
      maxWidth={1180}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-1)', padding: 3, borderRadius: 9 }}>
            {[['semua', 'Semua'], ['saya', 'Punya saya']].map(([nilai, label]) => (
              <button
                key={nilai}
                type="button"
                onClick={() => setSaringan(nilai)}
                style={{
                  fontSize: 11.5, fontWeight: 500, padding: '5px 11px', borderRadius: 7,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: saringan === nilai ? 'var(--surface-2)' : 'transparent',
                  color: saringan === nilai ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: saringan === nilai ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
            <Icon name="add-outline" size={15} /> Konten baru
          </button>
        </div>
      }
    >
      {pesan && (
        <p className="alert alert-error" style={{ marginBottom: 14 }}>{pesan.text}</p>
      )}

      {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat konten...</p>}

      <div className="kanban-cols">
        {STATUSES.map((kolom) => {
          const isiKolom = terlihat.filter((i) => i.status === kolom.key)
          const aktif = kolomAktif === kolom.key

          return (
            <div
              key={kolom.key}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setKolomAktif(kolom.key) }}
              onDragLeave={(e) => {
                // Hanya lepas sorotan kalau kursor benar-benar meninggalkan
                // kolom, bukan sekadar berpindah ke kartu di dalamnya.
                if (!e.currentTarget.contains(e.relatedTarget)) setKolomAktif(null)
              }}
              onDrop={(e) => lepaskan(e, kolom.key)}
              style={{
                background: aktif ? kolom.bg : 'var(--surface-1)',
                border: `1px ${aktif ? 'dashed' : 'solid'} ${aktif ? kolom.color : 'var(--border)'}`,
                borderTop: `3px solid ${kolom.color}`,
                borderRadius: 12,
                padding: 10,
                minHeight: 340,
                transition: 'background 0.12s ease, border-color 0.12s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 2px 11px' }}>
                <span
                  style={{ width: 7, height: 7, borderRadius: '50%', background: kolom.color, flexShrink: 0 }}
                />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: kolom.color }}>{kolom.label}</span>
                <span
                  style={{
                    marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
                    background: kolom.bg, color: kolom.color,
                    padding: '1px 7px', borderRadius: 99,
                  }}
                >
                  {isiKolom.length}
                </span>
              </div>

              {isiKolom.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  anggota={anggotaById[item.assigneeId] ?? null}
                  warnaStatus={kolom.color}
                  sedangDigeser={kartuDigeser === item.id}
                  onDragStart={mulaiGeser}
                  onDragEnd={selesaiGeser}
                />
              ))}

              {isiKolom.length === 0 && !loading && (
                <p
                  style={{
                    fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
                    padding: '18px 6px', lineHeight: 1.5,
                  }}
                >
                  {aktif ? 'Lepaskan di sini' : 'Belum ada'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <NewContentModal onClose={() => setShowModal(false)} onSubmit={tambahKonten} pillars={pillars} />
      )}
    </AppShell>
  )
}
