import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../lib/useTenant'
import { PLATFORMS, getPlatform } from '../config/platforms'
import { isoDate, todayIso } from '../lib/dates'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'

// Performance tracker.
//
// Halaman ini sebelumnya selalu kosong. Ia menunggu data di analytics_profile
// dan analytics_content, padahal belum ada satu pun integrasi API sosial media
// yang mengisinya, jadi tidak akan pernah terisi dengan sendirinya.
//
// Sekarang isinya dibagi dua, dan keduanya jujur soal asal datanya:
//
//   1. Statistik produksi, dihitung langsung dari konten yang tim buat sendiri.
//      Ini data nyata dan tersedia sejak hari pertama: berapa yang tayang,
//      seberapa konsisten, dan sebarannya ke mana saja.
//
//   2. Metrik akun (follower dan engagement), dicatat manual. Angka ini hanya
//      bisa didapat dari platformnya, jadi selama belum ada integrasi, mencatat
//      sendiri lebih berguna daripada membiarkan halaman kosong. Setiap catatan
//      menyimpan tanggalnya, sehingga perkembangannya tetap terlihat.

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function kunciBulan(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function labelBulan(kunci) {
  const [th, bl] = kunci.split('-')
  return `${NAMA_BULAN[Number(bl) - 1].slice(0, 3)} ${th.slice(2)}`
}

// Enam bulan terakhir termasuk bulan berjalan, dari yang paling lama.
function enamBulanTerakhir() {
  const sekarang = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - (5 - i), 1)
    return kunciBulan(d)
  })
}

function Metric({ label, value, sub }) {
  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {sub && <p className="metric-sub">{sub}</p>}
    </div>
  )
}

function GrafikBatang({ data }) {
  const maks = Math.max(1, ...data.map((d) => d.jumlah))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120, padding: '0 2px' }}>
      {data.map((d) => (
        <div key={d.kunci} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: d.jumlah ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {d.jumlah}
          </span>
          <div
            style={{
              width: '100%',
              height: `${(d.jumlah / maks) * 80}px`,
              minHeight: 3,
              background: d.jumlah ? 'var(--accent)' : 'var(--border)',
              borderRadius: 6,
            }}
          />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{labelBulan(d.kunci)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PerformanceTracker() {
  const { tenantId } = useTenant()
  const [items, setItems] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesan, setPesan] = useState(null)

  const [form, setForm] = useState({ platform: PLATFORMS[0].key, followers: '', engagement: '', tanggal: todayIso() })
  const [menyimpan, setMenyimpan] = useState(false)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return
    setLoading(true)

    const [{ data: contentRows, error: contentErr }, { data: profileRows }] = await Promise.all([
      supabase.from('content_items').select('id,status,platform,scheduled_date').eq('tenant_id', tenantId).limit(1000),
      supabase.from('analytics_profile').select('platform,snapshot_date,followers,engagement_rate')
        .eq('tenant_id', tenantId).order('snapshot_date', { ascending: false }).limit(200),
    ])

    if (contentErr) setPesan({ type: 'error', text: `Gagal memuat data: ${contentErr.message}` })
    setItems(contentRows ?? [])
    setSnapshots(profileRows ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  async function simpanSnapshot(e) {
    e.preventDefault()
    setPesan(null)

    const followers = form.followers === '' ? null : Number(form.followers)
    const engagement = form.engagement === '' ? null : Number(form.engagement)

    if (followers === null && engagement === null) {
      setPesan({ type: 'error', text: 'Isi minimal salah satu angka.' })
      return
    }
    if (followers !== null && (Number.isNaN(followers) || followers < 0)) {
      setPesan({ type: 'error', text: 'Jumlah follower tidak valid.' })
      return
    }
    if (engagement !== null && (Number.isNaN(engagement) || engagement < 0 || engagement > 100)) {
      setPesan({ type: 'error', text: 'Engagement rate harus antara 0 dan 100.' })
      return
    }

    setMenyimpan(true)
    const { error } = await supabase.from('analytics_profile').insert({
      tenant_id: tenantId,
      platform: form.platform,
      snapshot_date: form.tanggal,
      followers,
      engagement_rate: engagement,
    })
    setMenyimpan(false)

    if (error) {
      setPesan({ type: 'error', text: `Gagal menyimpan: ${error.message}` })
      return
    }
    setForm((f) => ({ ...f, followers: '', engagement: '' }))
    setPesan({ type: 'success', text: 'Catatan tersimpan.' })
    muat()
  }

  // --- Statistik produksi, dihitung dari konten sendiri ---
  const tayang = items.filter((i) => i.status === 'published')
  const bulanIni = kunciBulan(new Date())
  const tayangBulanIni = tayang.filter((i) => i.scheduled_date && kunciBulan(new Date(i.scheduled_date)) === bulanIni)

  const perBulan = enamBulanTerakhir().map((kunci) => ({
    kunci,
    jumlah: tayang.filter((i) => i.scheduled_date && kunciBulan(new Date(i.scheduled_date)) === kunci).length,
  }))

  const rataPerBulan = perBulan.reduce((a, b) => a + b.jumlah, 0) / perBulan.length

  // Konsistensi: berapa hari dalam 30 hari terakhir yang ada kontennya tayang.
  const tigaPuluhHariLalu = isoDate(new Date(Date.now() - 29 * 86400000))
  const hariTerisi = new Set(
    tayang.filter((i) => i.scheduled_date && i.scheduled_date >= tigaPuluhHariLalu).map((i) => i.scheduled_date)
  ).size

  // Snapshot terbaru per platform, beserta pembandingnya untuk melihat arah.
  const terbaruPerPlatform = {}
  const sebelumnyaPerPlatform = {}
  for (const s of snapshots) {
    if (!terbaruPerPlatform[s.platform]) terbaruPerPlatform[s.platform] = s
    else if (!sebelumnyaPerPlatform[s.platform]) sebelumnyaPerPlatform[s.platform] = s
  }

  return (
    <AppShell
      title="Performance tracker"
      description="Seberapa produktif tim, dan bagaimana perkembangan akunnya."
      maxWidth={860}
    >
      {pesan && (
        <p className={`alert alert-${pesan.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
          {pesan.text}
        </p>
      )}

      {loading ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat data...</p>
      ) : (
        <>
          <p className="section-label" style={{ marginBottom: 9 }}>PRODUKSI KONTEN</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 12, marginBottom: 14 }}>
            <Metric label="Tayang bulan ini" value={tayangBulanIni.length} sub={`total ${tayang.length} sepanjang waktu`} />
            <Metric label="Rata-rata per bulan" value={rataPerBulan.toFixed(1)} sub="enam bulan terakhir" />
            <Metric label="Hari ada konten" value={`${hariTerisi}/30`} sub="dalam 30 hari terakhir" />
            <Metric label="Total konten" value={items.length} sub="semua status" />
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Konten tayang per bulan</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Dihitung dari tanggal tayang konten berstatus Tayang.
            </p>
            <GrafikBatang data={perBulan} />
          </div>

          <p className="section-label" style={{ marginBottom: 9 }}>METRIK AKUN</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Belum ada koneksi ke API sosial media, jadi angka ini dicatat manual.
            Catat berkala supaya perkembangannya kelihatan.
          </p>

          <form onSubmit={simpanSnapshot} className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label className="field-label">Platform</label>
                <select
                  className="select"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  style={{ width: 'auto' }}
                >
                  {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ width: 130 }}>
                <label className="field-label">Follower</label>
                <input
                  className="input" type="number" min="0" value={form.followers}
                  onChange={(e) => setForm({ ...form, followers: e.target.value })}
                  placeholder="12500"
                />
              </div>
              <div style={{ width: 130 }}>
                <label className="field-label">Engagement (%)</label>
                <input
                  className="input" type="number" min="0" max="100" step="0.1" value={form.engagement}
                  onChange={(e) => setForm({ ...form, engagement: e.target.value })}
                  placeholder="3.4"
                />
              </div>
              <div style={{ width: 150 }}>
                <label className="field-label">Tanggal</label>
                <input
                  className="input" type="date" value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={menyimpan}>
                {menyimpan ? 'Menyimpan...' : 'Catat'}
              </button>
            </div>
          </form>

          {Object.keys(terbaruPerPlatform).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '26px 20px' }}>
              <Icon name="bar-chart-outline" size={22} color="var(--text-muted)" />
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 8 }}>
                Belum ada catatan metrik akun. Isi formulir di atas untuk yang pertama.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
              {Object.entries(terbaruPerPlatform).map(([key, s]) => {
                const p = getPlatform(key)
                const prev = sebelumnyaPerPlatform[key]
                const selisih = prev && s.followers != null && prev.followers != null ? s.followers - prev.followers : null
                return (
                  <div key={key} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: 8, background: p.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Icon name={p.icon} size={14} color={p.color} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 20 }}>
                      <div>
                        <p style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>
                          {s.followers != null ? s.followers.toLocaleString('id-ID') : 'belum dicatat'}
                        </p>
                        <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          Follower
                          {selisih != null && selisih !== 0 && (
                            <span style={{ color: selisih > 0 ? 'var(--success)' : 'var(--danger)', marginLeft: 4 }}>
                              {selisih > 0 ? '+' : ''}{selisih.toLocaleString('id-ID')}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>
                          {s.engagement_rate != null ? `${s.engagement_rate}%` : 'belum dicatat'}
                        </p>
                        <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Engagement</p>
                      </div>
                    </div>

                    <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 10 }}>
                      Dicatat {s.snapshot_date}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}
