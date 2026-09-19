import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { PLATFORMS, getPlatform } from '../config/platforms'
import { getStatus } from '../config/statuses'
import { parseIsoDate, todayIso } from '../lib/dates'

// Grid pratinjau feed.
//
// Gunanya satu: melihat feed sebagai satu kesatuan sebelum kontennya tayang.
// Orang yang mengurus Instagram tidak menilai postingan satu per satu, mereka
// menilai bagaimana sembilan kotak terlihat berdampingan — dan itu tidak bisa
// dilihat dari papan Kanban atau daftar kalender.
//
// DUA HAL YANG PERLU DIJELASKAN
//
// 1. Kotak menampilkan materi yang sudah diunggah. Yang belum punya materi
//    jatuh kembali ke warna content pillar-nya — dan itu tetap berguna:
//    ketimpangan komposisi tema langsung terlihat sebagai blok warna yang
//    menumpuk di satu sisi.
//
// 2. Mengatur ulang urutan berarti MENUKAR JADWAL. Urutan feed diturunkan
//    dari tanggal dan jam tayang, bukan dari kolom urutan tersendiri. Satu
//    sumber kebenaran lebih baik daripada dua yang bisa bertentangan, dan
//    itulah sebabnya menggeser kartu di sini mengubah jadwalnya.
//
// Di ponsel, tarik-lepas HTML5 tidak bekerja sama sekali. Jadi cara
// menukarnya bukan menggeser, melainkan ketuk satu lalu ketuk pasangannya.
// Cara itu juga aktif di desktop, karena lebih mudah diandalkan daripada
// membidik sasaran geser.

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BATAS = 60

function tanggalPendek(iso) {
  if (!iso) return ''
  const d = parseIsoDate(iso)
  return `${d.getDate()} ${BULAN[d.getMonth()]}`
}

export default function GridPreview() {
  const navigate = useNavigate()
  const { tenantId } = useTenantContext()

  const [items, setItems] = useState([])
  const [pillars, setPillars] = useState([])
  const [platform, setPlatform] = useState('instagram')
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)
  const [dipilih, setDipilih] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [gambar, setGambar] = useState({})

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)
    setGalat(null)

    const [a, b] = await Promise.all([
      supabase.from('content_items')
        .select('id,title,platform,status,pillar_id,scheduled_date,scheduled_time,approval_state,asset_path')
        .eq('tenant_id', tenantId)
        .eq('platform', platform)
        .not('scheduled_date', 'is', null)
        // Terbaru di kiri atas, seperti feed Instagram sungguhan.
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false, nullsFirst: false })
        .limit(BATAS),
      supabase.from('content_pillars').select('id,name,color').eq('tenant_id', tenantId),
    ])

    if (a.error) setGalat(a.error.message)
    setItems(a.data ?? [])
    setPillars(b.data ?? [])
    setLoading(false)
  }, [tenantId, platform])

  useEffect(() => { muat() }, [muat])

  // URL bertanda tangan dibuat SEKALIGUS untuk semua gambar yang terlihat,
  // bukan satu per satu. Grid bisa berisi enam puluh kotak, dan enam puluh
  // permintaan terpisah membuat halaman ini terasa berat tanpa alasan.
  useEffect(() => {
    let batal = false
    const paths = items.map((i) => i.asset_path).filter(Boolean)
    if (paths.length === 0) { setGambar({}); return }

    supabase.storage.from('materi').createSignedUrls(paths, 3600).then(({ data }) => {
      if (batal || !data) return
      const peta = {}
      for (const d of data) {
        // signedUrl bisa kosong kalau berkasnya sudah tidak ada. Dilewati,
        // supaya kotaknya kembali menampilkan warna pillar alih-alih
        // gambar yang rusak.
        if (d.path && d.signedUrl) peta[d.path] = d.signedUrl
      }
      setGambar(peta)
    })

    return () => { batal = true }
  }, [items])

  // Ganti platform, pilihan sebelumnya tidak berlaku lagi.
  useEffect(() => { setDipilih(null) }, [platform])

  async function tukar(idA, idB) {
    if (!idA || !idB || idA === idB) { setDipilih(null); return }

    setSibuk(true)
    setGalat(null)

    const { error } = await supabase.rpc('tukar_jadwal', { p_a: idA, p_b: idB })

    setSibuk(false)
    setDipilih(null)

    if (error) {
      setGalat(`Gagal menukar jadwal: ${error.message}`)
      return
    }
    await muat()
  }

  function ketuk(item) {
    if (sibuk) return
    if (!dipilih) { setDipilih(item.id); return }
    if (dipilih === item.id) { setDipilih(null); return }
    tukar(dipilih, item.id)
  }

  const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]))
  const hariIni = todayIso()

  // Sebaran pillar, dihitung dari yang sedang terlihat. Ini yang membuat
  // grid berguna bukan cuma sebagai pratinjau: kalau satu tema menguasai
  // feed, angkanya kelihatan di sini.
  const sebaran = items.reduce((acc, it) => {
    const nama = pillarById[it.pillar_id]?.name ?? 'Tanpa pillar'
    acc[nama] = (acc[nama] ?? 0) + 1
    return acc
  }, {})
  const sebaranUrut = Object.entries(sebaran).sort((a, b) => b[1] - a[1])

  return (
    <AppShell
      title="Grid pratinjau"
      description="Lihat feed sebagai satu kesatuan sebelum kontennya tayang."
      maxWidth={780}
      actions={
        <select
          className="select"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
          aria-label="Pilih platform"
        >
          {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      }
    >
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      <div className="card" style={{ marginBottom: 14, background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', gap: 9 }}>
          <Icon name="information-circle-outline" size={17} color="var(--text-secondary)" />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Ketuk satu kotak, lalu ketuk kotak lain untuk <strong>menukar jadwal tayangnya</strong>.
            Kotak yang materinya sudah diunggah menampilkan gambarnya; yang
            belum memakai warna content pillar.
          </p>
        </div>
      </div>

      {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat...</p>}

      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}
          >
            <Icon name="grid-outline" size={22} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>
            Belum ada konten {getPlatform(platform).label} yang dijadwalkan
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Grid ini hanya menampilkan konten yang sudah punya tanggal tayang,
            karena urutan feed diturunkan dari jadwalnya.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <>
          {dipilih && (
            <p className="alert alert-info" style={{ marginBottom: 12 }}>
              Satu kotak dipilih. Ketuk kotak lain untuk menukar jadwalnya, atau
              ketuk lagi kotak yang sama untuk membatalkan.
            </p>
          )}

          <div className="ig-grid">
            {items.map((item) => {
              const p = pillarById[item.pillar_id]
              const warna = p?.color ?? 'var(--border-strong)'
              const s = getStatus(item.status)
              const terpilih = dipilih === item.id
              const sudahTayang = item.scheduled_date < hariIni

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ig-sel${terpilih ? ' terpilih' : ''}`}
                  onClick={() => ketuk(item)}
                  // Tarik-lepas tetap disediakan untuk yang memakai tetikus,
                  // tapi bukan satu-satunya cara — di ponsel ia tidak jalan.
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); setDipilih(item.id) }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const asal = e.dataTransfer.getData('text/plain')
                    if (asal) tukar(asal, item.id)
                  }}
                  style={{
                    background: `color-mix(in srgb, ${warna} 14%, #fff)`,
                    borderColor: terpilih ? 'var(--accent)' : 'transparent',
                    opacity: sudahTayang ? 0.72 : 1,
                  }}
                  title={`${item.title} — ${tanggalPendek(item.scheduled_date)}`}
                >
                  {gambar[item.asset_path] && (
                    <img
                      src={gambar[item.asset_path]}
                      alt=""
                      loading="lazy"
                      className="ig-sel-gambar"
                    />
                  )}

                  <span className="ig-sel-atas">
                    <span
                      style={{
                        width: 7, height: 7, borderRadius: '50%', background: warna,
                        flexShrink: 0, display: 'block',
                      }}
                    />
                    <span className="ig-sel-tanggal">{tanggalPendek(item.scheduled_date)}</span>
                  </span>

                  <span className="ig-sel-judul">{item.title}</span>

                  <span className="ig-sel-bawah">
                    <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                    {item.approval_state === 'approved' && (
                      <Icon name="checkmark-circle" size={13} color="var(--success)" />
                    )}
                    {item.approval_state === 'changes_requested' && (
                      <Icon name="alert-circle" size={13} color="var(--danger)" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>Sebaran pillar di feed</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Dihitung dari {items.length} konten yang sedang terlihat.
            </p>

            {sebaranUrut.map(([nama, jumlah]) => {
              const p = pillars.find((x) => x.name === nama)
              const persen = Math.round((jumlah / items.length) * 100)
              return (
                <div key={nama} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span
                      style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: p?.color ?? 'var(--border-strong)',
                      }}
                    />
                    <span style={{ fontSize: 12.5 }}>{nama}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {jumlah} · {persen}%
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${persen}%`, background: p?.color ?? 'var(--border-strong)' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            className="btn btn-block"
            style={{ marginTop: 14 }}
            onClick={() => navigate('/content-calendar')}
          >
            <Icon name="calendar-outline" size={15} /> Buka kalender untuk atur tanggal
          </button>
        </>
      )}
    </AppShell>
  )
}
