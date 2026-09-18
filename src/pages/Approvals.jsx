import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useTenantMembers, namaAnggota } from '../lib/useTenantMembers'
import { getPlatform } from '../config/platforms'
import { getApproval } from '../config/approval'
import { parseIsoDate, todayIso } from '../lib/dates'

// Daftar konten yang menunggu keputusan.
//
// Ini halaman yang akan dibuka admin berkali-kali sehari, jadi urutannya
// mengikuti yang paling mendesak: yang tanggal tayangnya paling dekat
// muncul lebih dulu, karena itulah yang akan lewat kalau tidak diputuskan
// hari ini. Bukan yang paling lama diajukan — konten yang diajukan
// sebulan lalu untuk tayang bulan depan tidak sedang mendesak.
//
// Index parsial idx_content_items_menunggu di database melayani kueri ini.

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function tanggalPendek(iso) {
  if (!iso) return 'Tanpa tanggal'
  const d = parseIsoDate(iso)
  return `${d.getDate()} ${BULAN[d.getMonth()]}`
}

function Kartu({ item, anggota }) {
  const p = getPlatform(item.platform)
  const hariIni = todayIso()
  const terlambat = item.scheduled_date && item.scheduled_date < hariIni
  const hariIniTayang = item.scheduled_date === hariIni

  return (
    <Link to={`/content/${item.id}`} className="row-link">
      <div
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: p.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={p.icon} size={17} color={p.color} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Avatar anggota={anggota} size={14} />
          {anggota ? namaAnggota(anggota) : 'Belum ditugaskan'}
          {' · '}
          {tanggalPendek(item.scheduled_date)}
        </p>
      </div>

      {terlambat && (
        <span className="chip" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'transparent', flexShrink: 0 }}>
          Lewat tanggal
        </span>
      )}
      {hariIniTayang && (
        <span className="chip" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'transparent', flexShrink: 0 }}>
          Tayang hari ini
        </span>
      )}
      <Icon name="chevron-forward" size={15} color="var(--text-muted)" />
    </Link>
  )
}

export default function Approvals() {
  const { tenantId, isAdmin } = useTenantContext()
  const { members } = useTenantMembers()

  const [menunggu, setMenunggu] = useState([])
  const [revisi, setRevisi] = useState([])
  const [disetujui, setDisetujui] = useState(0)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return
    setLoading(true)
    setGalat(null)

    const kolom = 'id,title,platform,status,approval_state,scheduled_date,assignee_id,submitted_at'

    const [a, b, c] = await Promise.all([
      supabase.from('content_items').select(kolom)
        .eq('tenant_id', tenantId).eq('approval_state', 'pending')
        // nullsFirst: false supaya konten tanpa tanggal tidak menumpuk di
        // atas dan menutupi yang benar-benar mendesak.
        .order('scheduled_date', { ascending: true, nullsFirst: false }).limit(100),
      supabase.from('content_items').select(kolom)
        .eq('tenant_id', tenantId).eq('approval_state', 'changes_requested')
        .order('scheduled_date', { ascending: true, nullsFirst: false }).limit(100),
      supabase.from('content_items').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).eq('approval_state', 'approved'),
    ])

    const err = a.error ?? b.error ?? c.error
    if (err) setGalat(err.message)

    setMenunggu(a.data ?? [])
    setRevisi(b.data ?? [])
    setDisetujui(c.count ?? 0)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  const anggotaById = Object.fromEntries(members.map((m) => [m.user_id, m]))
  const a = getApproval('pending')

  return (
    <AppShell
      title="Persetujuan"
      description={isAdmin
        ? 'Konten yang menunggu keputusan kamu, diurutkan dari yang paling dekat tanggal tayangnya.'
        : 'Konten yang sedang menunggu keputusan admin, dan yang diminta revisi.'}
      maxWidth={780}
      actions={
        <button type="button" className="btn btn-sm" onClick={muat} disabled={loading}>
          <Icon name="refresh-outline" size={14} /> Muat ulang
        </button>
      }
    >
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div className="metric">
          <p className="metric-label">
            <Icon name="time-outline" size={14} color={a.color} /> Menunggu
          </p>
          <p className="metric-value" style={{ color: menunggu.length ? a.color : 'var(--text-primary)' }}>
            {menunggu.length}
          </p>
        </div>
        <div className="metric">
          <p className="metric-label">
            <Icon name="arrow-undo-outline" size={14} color="var(--danger)" /> Diminta revisi
          </p>
          <p className="metric-value" style={{ color: revisi.length ? 'var(--danger)' : 'var(--text-primary)' }}>
            {revisi.length}
          </p>
        </div>
        <div className="metric">
          <p className="metric-label">
            <Icon name="checkmark-circle-outline" size={14} color="var(--success)" /> Disetujui
          </p>
          <p className="metric-value" style={{ color: 'var(--success)' }}>{disetujui}</p>
        </div>
      </div>

      {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat...</p>}

      {!loading && menunggu.length === 0 && revisi.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '34px 20px' }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: 'var(--success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}
          >
            <Icon name="checkmark-done-outline" size={22} color="var(--success)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Tidak ada yang menunggu</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            Konten diajukan dari halaman briefnya. Buka sebuah konten, lalu tekan
            “Ajukan untuk ditinjau” kalau isinya sudah siap dilihat.
          </p>
        </div>
      )}

      {menunggu.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Icon name="time-outline" size={15} color={a.color} />
            <p style={{ fontSize: 13.5, fontWeight: 600, color: a.color }}>Menunggu keputusan</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -10px' }}>
            {menunggu.map((it) => (
              <Kartu key={it.id} item={it} anggota={anggotaById[it.assignee_id] ?? null} />
            ))}
          </div>
        </div>
      )}

      {revisi.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <Icon name="arrow-undo-outline" size={15} color="var(--danger)" />
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--danger)' }}>Diminta revisi</p>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Sudah ada catatan perbaikannya di halaman masing-masing.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -10px' }}>
            {revisi.map((it) => (
              <Kartu key={it.id} item={it} anggota={anggotaById[it.assignee_id] ?? null} />
            ))}
          </div>
        </div>
      )}
    </AppShell>
  )
}
