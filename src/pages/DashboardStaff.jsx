import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Hero from '../components/Hero'
import Icon from '../components/Icon'
import { getPlatform } from '../config/platforms'
import { getStatus, ACTIVE_STATUSES } from '../config/statuses'
import { isoDate, parseIsoDate, addDays, todayIso } from '../lib/dates'

// Dashboard staff, yaitu tampilan pengeksekusi.
//
// Seorang staff tidak butuh tahu sebaran platform seluruh tim atau beban kerja
// orang lain. Yang dia butuhkan cuma satu: apa bagian saya, dan mana yang
// paling mendesak. Karena itu halaman ini tidak menampilkan statistik tim sama
// sekali, melainkan daftar pekerjaan miliknya sendiri yang dikelompokkan
// menurut kapan harus selesai.
//
// Admin melihat halaman yang berbeda, lihat DashboardAdmin.jsx.

function formatTanggal(iso) {
  if (!iso) return 'Tanpa tanggal'
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const d = parseIsoDate(iso)
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]}`
}

function BarisTugas({ item }) {
  const p = getPlatform(item.platform)
  const s = getStatus(item.status)
  const adaBrief = Boolean(item.brief && item.brief.trim() !== '')

  return (
    <Link to={`/content/${item.id}`} className="row-link">
      <div
        style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: p.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={p.icon} size={16} color={p.color} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <p style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title}
          </p>
          {!adaBrief && (
            <span title="Brief belum diisi" style={{ display: 'flex', flexShrink: 0 }}>
              <Icon name="alert-circle-outline" size={13} color="var(--warning)" />
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatTanggal(item.scheduled_date)}
          {item.scheduled_time ? ` · ${item.scheduled_time.slice(0, 5)}` : ''}
        </p>
      </div>

      <span className="chip" style={{ background: s.bg, color: s.color, borderColor: 'transparent', flexShrink: 0 }}>
        {s.label}
      </span>
    </Link>
  )
}

function Kelompok({ judul, keterangan, items, warna, ikon }) {
  if (items.length === 0) return null
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: keterangan ? 3 : 10 }}>
        <Icon name={ikon} size={15} color={warna} />
        <p style={{ fontSize: 13.5, fontWeight: 600, color: warna }}>{judul}</p>
        <span
          style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 600,
            background: 'var(--surface-1)', color: 'var(--text-secondary)',
            padding: '1px 8px', borderRadius: 99,
          }}
        >
          {items.length}
        </span>
      </div>
      {keterangan && (
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>{keterangan}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -10px' }}>
        {items.map((it) => <BarisTugas key={it.id} item={it} />)}
      </div>
    </div>
  )
}

export default function DashboardStaff() {
  const { user } = useAuth()
  const { tenantId, tenant } = useTenantContext()
  const [data, setData] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId || !user) return

    const hariIni = todayIso()
    const akhirMinggu = isoDate(addDays(new Date(), 7))

    const { data: rows } = await supabase
      .from('content_items')
      .select('id,title,platform,status,scheduled_date,scheduled_time,brief')
      .eq('tenant_id', tenantId)
      .eq('assignee_id', user.id)
      .order('scheduled_date', { ascending: true, nullsFirst: false })
      .limit(200)

    const semua = rows ?? []
    const aktif = semua.filter((i) => ACTIVE_STATUSES.includes(i.status))

    setData({
      totalAktif: aktif.length,
      selesai: semua.filter((i) => i.status === 'published').length,
      // Terlambat: tanggalnya sudah lewat tapi kontennya belum tayang.
      terlambat: aktif.filter((i) => i.scheduled_date && i.scheduled_date < hariIni),
      hariIni: aktif.filter((i) => i.scheduled_date === hariIni),
      mingguIni: aktif.filter((i) => i.scheduled_date && i.scheduled_date > hariIni && i.scheduled_date <= akhirMinggu),
      nanti: aktif.filter((i) => i.scheduled_date && i.scheduled_date > akhirMinggu),
      tanpaTanggal: aktif.filter((i) => !i.scheduled_date),
      tanpaBrief: aktif.filter((i) => !i.brief || i.brief.trim() === '').length,
    })
  }, [tenantId, user])

  useEffect(() => { muat() }, [muat])

  if (!data) {
    return (
      <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16, alignItems: 'start' }}>
        <Sidebar />
        <p style={{ padding: 8, fontSize: 13, color: 'var(--text-muted)' }}>Memuat tugas kamu...</p>
      </div>
    )
  }

  const namaSapaan = user?.email ? user.email.split('@')[0] : null
  const tidakAdaTugas = data.totalAktif === 0

  return (
    <div
      style={{
        background: 'var(--bg-page)', minHeight: '100vh', padding: 16,
        display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16, alignItems: 'start',
      }}
    >
      <Sidebar />

      <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Hero
          userName={namaSapaan}
          backgroundUrl={tenant?.hero_background_url ?? null}
          jadwalHariIni={data.hariIni.length}
          perluDibrief={data.tanpaBrief}
        />

        {tidakAdaTugas ? (
          <div className="card" style={{ textAlign: 'center', padding: '34px 20px' }}>
            <div
              style={{
                width: 46, height: 46, borderRadius: 13, background: 'var(--success-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}
            >
              <Icon name="checkmark-done-outline" size={22} color="var(--success)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Tidak ada tugas untuk kamu</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 390, margin: '0 auto 18px' }}>
              Belum ada konten yang ditugaskan ke kamu. Kamu tetap bisa melihat papan tim
              dan mengambil sendiri konten yang belum ada pemiliknya.
            </p>
            <Link to="/kanban" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Lihat papan tim
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div className="metric">
                <p className="metric-label">
                  <Icon name="albums-outline" size={14} color="var(--text-muted)" /> Tugas berjalan
                </p>
                <p className="metric-value">{data.totalAktif}</p>
              </div>
              <div className="metric">
                <p className="metric-label">
                  <Icon name="alarm-outline" size={14} color={data.terlambat.length ? 'var(--danger)' : 'var(--text-muted)'} /> Terlambat
                </p>
                <p className="metric-value" style={{ color: data.terlambat.length ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {data.terlambat.length}
                </p>
              </div>
              <div className="metric">
                <p className="metric-label">
                  <Icon name="today-outline" size={14} color="var(--text-muted)" /> Hari ini
                </p>
                <p className="metric-value">{data.hariIni.length}</p>
              </div>
              <div className="metric">
                <p className="metric-label">
                  <Icon name="checkmark-circle-outline" size={14} color="var(--success)" /> Sudah tayang
                </p>
                <p className="metric-value" style={{ color: 'var(--success)' }}>{data.selesai}</p>
              </div>
            </div>

            <Kelompok
              judul="Terlambat"
              keterangan="Tanggal tayangnya sudah lewat tapi kontennya belum tayang."
              items={data.terlambat}
              warna="var(--danger)"
              ikon="alarm-outline"
            />
            <Kelompok judul="Hari ini" items={data.hariIni} warna="var(--accent)" ikon="today-outline" />
            <Kelompok judul="Tujuh hari ke depan" items={data.mingguIni} warna="var(--text-primary)" ikon="calendar-outline" />
            <Kelompok
              judul="Belum ada tanggal"
              keterangan="Ditugaskan ke kamu tapi belum dijadwalkan."
              items={data.tanpaTanggal}
              warna="var(--text-secondary)"
              ikon="help-circle-outline"
            />
            <Kelompok judul="Nanti" items={data.nanti} warna="var(--text-secondary)" ikon="time-outline" />

            <Link to="/kanban" className="btn btn-block" style={{ textDecoration: 'none' }}>
              Buka papan tim
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
