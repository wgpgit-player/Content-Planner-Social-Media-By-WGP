import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../lib/useTenant'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Hero from '../components/Hero'
import WeekCalendar from '../components/WeekCalendar'
import Icon from '../components/Icon'
import { getPlatform } from '../config/platforms'
import { STATUSES, getStatus, ACTIVE_STATUSES } from '../config/statuses'
import { isoDate, parseIsoDate, startOfWeek, addDays, todayIso } from '../lib/dates'

// Dashboard.
//
// Versi sebelumnya menghabiskan setengah layar untuk "Konten unggulan" yang
// hampir selalu kosong, sementara angka-angka yang justru ingin dilihat orang
// saat membuka aplikasi tidak ada sama sekali. Ada pula kejanggalan yang
// membingungkan: kalender mingguan menampilkan konten, tapi panel "Jadwal
// terdekat" di sebelahnya bilang tidak ada apa-apa. Penyebabnya panel itu
// hanya menghitung status 'scheduled', sedangkan konten yang punya tanggal
// bisa saja masih berstatus ide atau draft.
//
// Susunan sekarang mengikuti urutan pertanyaan yang biasanya ada di kepala:
//   1. Sapaan dan satu hal yang perlu diperhatikan hari ini
//   2. Angka ringkas: tayang bulan ini, terjadwal, sedang dikerjakan, brief kosong
//   3. Jadwal minggu ini dan daftar jadwal terdekat, berdampingan
//   4. Sebaran per platform dan per pillar, supaya ketimpangan cepat terlihat

const BATAS_TERDEKAT = 6

function bulanIni() {
  const d = new Date()
  const awal = new Date(d.getFullYear(), d.getMonth(), 1)
  const akhir = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { awal: isoDate(awal), akhir: isoDate(akhir) }
}

function formatTanggalPendek(iso) {
  if (!iso) return ''
  const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const d = parseIsoDate(iso)
  const hariIni = todayIso()
  const besok = isoDate(addDays(new Date(), 1))
  if (iso === hariIni) return 'Hari ini'
  if (iso === besok) return 'Besok'
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]}`
}

function Metric({ icon, label, value, sub, warna }) {
  return (
    <div className="metric">
      <p className="metric-label">
        <Icon name={icon} size={14} color={warna ?? 'var(--text-muted)'} />
        {label}
      </p>
      <p className="metric-value" style={{ color: warna ?? 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="metric-sub">{sub}</p>}
    </div>
  )
}

function Sebaran({ judul, data, kosong }) {
  const total = data.reduce((a, d) => a + d.jumlah, 0)
  return (
    <div className="card">
      <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{judul}</p>
      {total === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{kosong}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {data.map((d) => (
            <div key={d.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                {d.icon && <Icon name={d.icon} size={13} color={d.warna} />}
                <span style={{ fontSize: 12 }}>{d.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary)' }}>{d.jumlah}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.jumlah / total) * 100}%`, background: d.warna }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BarisJadwal({ item }) {
  const p = getPlatform(item.platform)
  const s = getStatus(item.status)
  return (
    <Link to={`/content/${item.id}`} className="row-link">
      <div
        style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: p.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={p.icon} size={15} color={p.color} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatTanggalPendek(item.scheduled_date)}
          {item.scheduled_time ? ` · ${item.scheduled_time.slice(0, 5)}` : ''}
        </p>
      </div>
      <span
        className="chip"
        style={{ background: s.bg, color: s.color, borderColor: 'transparent', flexShrink: 0 }}
      >
        {s.label}
      </span>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { tenantId } = useTenant()
  const [data, setData] = useState(null)
  const [backgroundUrl, setBackgroundUrl] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return

    const awalMinggu = startOfWeek()
    const awalMingguIso = isoDate(awalMinggu)
    const akhirMingguIso = isoDate(addDays(awalMinggu, 6))
    const hariIni = todayIso()
    const { awal, akhir } = bulanIni()

    const [
      { data: semua },
      { data: mingguIni },
      { data: terdekat },
      { data: pillarRows },
      { data: tenantRow },
    ] = await Promise.all([
      // Ringkasan dibuat dari kolom seperlunya saja, supaya tetap ringan
      // meski workspace-nya sudah ramai.
      supabase.from('content_items').select('id,status,platform,pillar_id,scheduled_date,brief').eq('tenant_id', tenantId).limit(1000),
      supabase.from('content_items').select('id,title,platform,scheduled_date,pillar_id,status')
        .eq('tenant_id', tenantId).gte('scheduled_date', awalMingguIso).lte('scheduled_date', akhirMingguIso),
      // Jadwal terdekat TIDAK lagi disaring berdasarkan status. Konten yang
      // punya tanggal memang akan tayang, apa pun status pengerjaannya, dan
      // menyembunyikannya justru membuat dashboard mengingkari kalendernya.
      supabase.from('content_items').select('id,title,platform,status,scheduled_date,scheduled_time')
        .eq('tenant_id', tenantId).gte('scheduled_date', hariIni)
        .order('scheduled_date', { ascending: true }).limit(BATAS_TERDEKAT),
      supabase.from('content_pillars').select('id,name,color').eq('tenant_id', tenantId),
      supabase.from('tenants').select('hero_background_url').eq('id', tenantId).maybeSingle(),
    ])

    const items = semua ?? []
    const pillars = pillarRows ?? []
    const namaPillar = Object.fromEntries(pillars.map((p) => [p.id, p]))

    const itemsByDate = {}
    for (const it of mingguIni ?? []) {
      if (!it.scheduled_date) continue
      ;(itemsByDate[it.scheduled_date] ||= []).push(it)
    }

    const sebaranPlatform = {}
    for (const it of items) sebaranPlatform[it.platform] = (sebaranPlatform[it.platform] ?? 0) + 1

    const sebaranPillar = {}
    for (const it of items) {
      const key = it.pillar_id ?? 'tanpa'
      sebaranPillar[key] = (sebaranPillar[key] ?? 0) + 1
    }

    setData({
      total: items.length,
      tayangBulanIni: items.filter((i) => i.status === 'published' && i.scheduled_date >= awal && i.scheduled_date <= akhir).length,
      terjadwal: items.filter((i) => i.scheduled_date && i.scheduled_date >= hariIni).length,
      dikerjakan: items.filter((i) => ACTIVE_STATUSES.includes(i.status)).length,
      tanpaBrief: items.filter((i) => !i.brief || i.brief.trim() === '').length,
      jadwalHariIni: items.filter((i) => i.scheduled_date === hariIni).length,
      perStatus: STATUSES.map((s) => ({ ...s, jumlah: items.filter((i) => i.status === s.key).length })),
      awalMinggu: awalMingguIso,
      itemsByDate,
      terdekat: terdekat ?? [],
      sebaranPlatform: Object.entries(sebaranPlatform)
        .map(([key, jumlah]) => {
          const p = getPlatform(key)
          return { label: p.label, jumlah, icon: p.icon, warna: p.color }
        })
        .sort((a, b) => b.jumlah - a.jumlah),
      sebaranPillar: Object.entries(sebaranPillar)
        .map(([key, jumlah]) => ({
          label: key === 'tanpa' ? 'Tanpa pillar' : namaPillar[key]?.name ?? 'Pillar terhapus',
          jumlah,
          warna: key === 'tanpa' ? 'var(--border-strong)' : namaPillar[key]?.color ?? 'var(--accent)',
        }))
        .sort((a, b) => b.jumlah - a.jumlah),
    })

    setBackgroundUrl(tenantRow?.hero_background_url ?? null)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  if (!data) {
    return (
      <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16, alignItems: 'start' }}>
        <Sidebar />
        <p style={{ padding: 8, fontSize: 13, color: 'var(--text-muted)' }}>Memuat dashboard...</p>
      </div>
    )
  }

  const namaSapaan = user?.email ? user.email.split('@')[0] : null
  const kosongTotal = data.total === 0

  return (
    <div
      style={{
        background: 'var(--bg-page)', minHeight: '100vh', padding: 16,
        display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16, alignItems: 'start',
      }}
    >
      <Sidebar />

      <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Hero
          userName={namaSapaan}
          tenantId={tenantId}
          backgroundUrl={backgroundUrl}
          onBackgroundChange={setBackgroundUrl}
          jadwalHariIni={data.jadwalHariIni}
          perluDibrief={data.tanpaBrief}
        />

        {kosongTotal ? (
          <div className="card" style={{ textAlign: 'center', padding: '34px 20px' }}>
            <div
              style={{
                width: 46, height: 46, borderRadius: 13, background: 'var(--accent-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}
            >
              <Icon name="sparkles-outline" size={22} color="var(--accent)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Belum ada konten di ruang kerja ini</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 18px' }}>
              Mulai dari satu konten. Setelah itu dashboard ini akan menampilkan jadwal,
              sebaran platform, dan sisa pekerjaan tim kamu.
            </p>
            <Link to="/kanban" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Icon name="add-outline" size={15} /> Buat konten pertama
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <Metric
                icon="checkmark-circle-outline"
                label="Tayang bulan ini"
                value={data.tayangBulanIni}
                sub={`dari total ${data.total} konten`}
                warna="var(--success)"
              />
              <Metric
                icon="calendar-outline"
                label="Akan tayang"
                value={data.terjadwal}
                sub={data.jadwalHariIni > 0 ? `${data.jadwalHariIni} di antaranya hari ini` : 'tidak ada jadwal hari ini'}
              />
              <Metric
                icon="albums-outline"
                label="Sedang dikerjakan"
                value={data.dikerjakan}
                sub="ide, draft, review, terjadwal"
              />
              <Metric
                icon="document-text-outline"
                label="Belum ada brief"
                value={data.tanpaBrief}
                sub={data.tanpaBrief > 0 ? 'perlu dilengkapi' : 'semua sudah punya brief'}
                warna={data.tanpaBrief > 0 ? 'var(--warning)' : 'var(--success)'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
              <WeekCalendar startIso={data.awalMinggu} itemsByDate={data.itemsByDate} />

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600 }}>Jadwal terdekat</p>
                  <Link
                    to="/content-calendar"
                    style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    Lihat kalender
                  </Link>
                </div>

                {data.terdekat.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>
                    Belum ada konten yang punya tanggal tayang.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '0 -10px' }}>
                    {data.terdekat.map((it) => <BarisJadwal key={it.id} item={it} />)}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <Sebaran
                judul="Sebaran per platform"
                data={data.sebaranPlatform}
                kosong="Belum ada konten."
              />
              <Sebaran
                judul="Sebaran per content pillar"
                data={data.sebaranPillar}
                kosong="Belum ada konten."
              />
              <div className="card">
                <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Tahapan pengerjaan</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {data.perStatus.map((s) => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12 }}>{s.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600 }}>{s.jumlah}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/kanban"
                  className="btn btn-sm btn-block"
                  style={{ textDecoration: 'none', marginTop: 14 }}
                >
                  Buka Project tracker
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
