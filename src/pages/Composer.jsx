import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { PLATFORMS, getPlatform } from '../config/platforms'
import { isoDate, addDays, startOfWeek, buildWeekDates, todayIso } from '../lib/dates'

// Composer: menyusun konten sambil melihat feed-nya.
//
// KENAPA LAYARNYA DIBELAH DUA
//
// Orang yang mengurus Instagram tidak menilai satu postingan sendirian, ia
// menilai bagaimana postingan itu duduk di antara delapan lainnya. Menyusun
// di satu halaman lalu pindah ke halaman lain untuk melihat hasilnya
// memutus penilaian itu. Di sini keduanya berdampingan: kiri menyusun,
// kanan feed-nya ikut berubah saat diketik.
//
// PENGHITUNG BUKAN HIASAN
//
// Caption Instagram dipotong di 2.200 karakter dan hashtag di luar 30 yang
// pertama diabaikan diam-diam. Keduanya kegagalan yang baru ketahuan
// setelah tayang, jadi angkanya ditampilkan sejak awal.
//
// SATU KONTEN PER PLATFORM
//
// Memilih beberapa platform sekaligus membuat beberapa konten terpisah,
// bukan satu konten bertanda banyak platform. Alasannya praktis: caption,
// jam tayang, dan penanggung jawab untuk TikTok hampir selalu berbeda dari
// Instagram, dan satu baris bersama akan memaksa keduanya sama.

const BATAS_CAPTION = 2200
const BATAS_HASHTAG = 30
const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function hitungHashtag(teks) {
  return (teks.match(/#[^\s#]+/g) ?? []).length
}

function Penghitung({ nilai, batas, label }) {
  const lewat = nilai > batas
  const hampir = !lewat && nilai > batas * 0.9
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: lewat ? 600 : 500,
        color: lewat ? 'var(--danger)' : hampir ? 'var(--warning)' : 'var(--text-muted)',
      }}
      title={label}
    >
      {nilai}/{batas}
    </span>
  )
}

export default function Composer() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenantId } = useTenantContext()

  // Dipakai saat datang dari klik "ide konten harian" di kalender
  // (BarisAgenda.jsx): ?ide=teks nya&tanggal=YYYY-MM-DD. Dibaca sekali saja
  // saat halaman terbuka, bukan disinkron terus-menerus — begitu orang mulai
  // mengetik sendiri, prefill ini tidak boleh menimpanya lagi.
  const [searchParams] = useSearchParams()
  const ideAwal = searchParams.get('ide')
  const tanggalAwal = searchParams.get('tanggal')

  const [awalMinggu, setAwalMinggu] = useState(() => startOfWeek(tanggalAwal ? new Date(`${tanggalAwal}T00:00:00`) : undefined))
  const [tanggal, setTanggal] = useState(() => tanggalAwal || todayIso())
  const [jam, setJam] = useState('')
  const [platformTerpilih, setPlatformTerpilih] = useState(['instagram'])
  const [pillarId, setPillarId] = useState('')
  const [judul, setJudul] = useState(() => ideAwal || '')
  const [caption, setCaption] = useState('')
  const [assetUrl, setAssetUrl] = useState('')

  const [pillars, setPillars] = useState([])
  const [setHashtag, setSetHashtag] = useState([])
  const [feed, setFeed] = useState([])
  const [pilihHashtag, setPilihHashtag] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState(null)

  // Platform yang feed-nya ditampilkan di pratinjau. Kalau beberapa platform
  // dipilih sekaligus, yang pertama yang diperlihatkan — menampilkan feed
  // gabungan dari beberapa platform tidak berarti apa-apa.
  const platformPratinjau = platformTerpilih[0] ?? 'instagram'

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return

    const [a, b, c] = await Promise.all([
      supabase.from('content_pillars').select('id,name,color').eq('tenant_id', tenantId).order('name'),
      supabase.from('hashtag_sets').select('id,name,tags').eq('tenant_id', tenantId).order('name'),
      supabase.from('content_items')
        .select('id,title,platform,pillar_id,scheduled_date,scheduled_time,status')
        .eq('tenant_id', tenantId)
        .eq('platform', platformPratinjau)
        .not('scheduled_date', 'is', null)
        .order('scheduled_date', { ascending: false })
        .limit(11),
    ])

    setPillars(a.data ?? [])
    setSetHashtag(b.data ?? [])
    setFeed(c.data ?? [])
  }, [tenantId, platformPratinjau])

  useEffect(() => { muat() }, [muat])

  const jumlahHashtag = hitungHashtag(caption)
  const pillarById = useMemo(
    () => Object.fromEntries(pillars.map((p) => [p.id, p])),
    [pillars]
  )

  function togglePlatform(key) {
    setPlatformTerpilih((prev) =>
      prev.includes(key)
        // Minimal satu platform harus terpilih. Konten tanpa platform tidak
        // bisa dijadwalkan ke mana pun.
        ? (prev.length === 1 ? prev : prev.filter((p) => p !== key))
        : [...prev, key]
    )
  }

  function sisipkanHashtag(set) {
    setCaption((c) => (c.trim() ? `${c.trimEnd()}\n\n${set.tags}` : set.tags))
    setPilihHashtag(false)
  }

  async function simpan() {
    if (!judul.trim()) {
      setPesan({ tipe: 'error', teks: 'Judul belum diisi. Ini yang dilihat tim di papan dan kalender.' })
      return
    }

    setSibuk(true)
    setPesan(null)

    const baris = platformTerpilih.map((platform) => ({
      tenant_id: tenantId,
      platform,
      title: judul.trim(),
      caption: caption.trim() || null,
      pillar_id: pillarId || null,
      status: 'idea',
      scheduled_date: tanggal || null,
      scheduled_time: jam || null,
      asset_url: assetUrl.trim() || null,
      created_by: user?.id ?? null,
    }))

    const { data, error } = await supabase.from('content_items').insert(baris).select('id')
    setSibuk(false)

    if (error) {
      setPesan({ tipe: 'error', teks: error.message })
      return
    }

    // Satu platform: langsung ke briefnya, selagi idenya masih hangat.
    // Beberapa platform: tetap di sini, karena melompat ke salah satu dari
    // tiga konten yang baru dibuat akan membingungkan.
    if (data?.length === 1) {
      navigate(`/content/${data[0].id}`)
      return
    }

    setJudul(''); setCaption(''); setAssetUrl('')
    setPesan({ tipe: 'sukses', teks: `${data.length} konten dibuat, satu untuk tiap platform.` })
    await muat()
  }

  const tanggalMinggu = buildWeekDates(awalMinggu)

  // Konten yang sedang disusun ikut tampil di pratinjau, di posisi teratas,
  // supaya terlihat bagaimana ia duduk di antara yang lain.
  const feedDenganDraf = [
    { id: '__draf__', title: judul || 'Konten baru', pillar_id: pillarId, scheduled_date: tanggal, draf: true },
    ...feed,
  ]

  return (
    <AppShell
      bare
      title="Susun konten"
      description={`${BULAN[awalMinggu.getMonth()]} ${awalMinggu.getFullYear()}`}
      actions={
        <button type="button" className="btn btn-primary btn-sm" onClick={simpan} disabled={sibuk}>
          <Icon name="checkmark-outline" size={15} />
          {sibuk ? 'Menyimpan...' : platformTerpilih.length > 1 ? `Buat ${platformTerpilih.length} konten` : 'Buat konten'}
        </button>
      }
    >
      {pesan && (
        <p className={`alert alert-${pesan.tipe === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
          {pesan.teks}
        </p>
      )}

      <div className="compose-dua">
        {/* ---------- Kiri: menyusun ---------- */}
        <div>
          {/* Strip tanggal satu minggu — tanpa bungkus kartu, supaya jadi
              bagian dari alur, bukan formulir terpisah. Ketuk panah untuk
              pindah minggu, ketuk tanggal untuk memilihnya. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setAwalMinggu((d) => addDays(d, -7))}
              aria-label="Minggu sebelumnya"
              style={{ flexShrink: 0 }}
            >
              <Icon name="chevron-back-outline" size={15} />
            </button>
            <div className="strip-hari" style={{ flex: 1 }}>
              {tanggalMinggu.map((d) => {
                const iso = isoDate(d)
                const aktif = iso === tanggal
                const iniHariIni = iso === todayIso()
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`strip-hari-sel${aktif ? ' aktif' : ''}`}
                    onClick={() => setTanggal(iso)}
                  >
                    <span className="strip-hari-nama">{HARI_PENDEK[d.getDay()]}</span>
                    <span className="strip-hari-angka">{d.getDate()}</span>
                    {iniHariIni && <span className="strip-hari-titik" aria-label="hari ini" />}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setAwalMinggu((d) => addDays(d, 7))}
              aria-label="Minggu berikutnya"
              style={{ flexShrink: 0 }}
            >
              <Icon name="chevron-forward" size={15} />
            </button>
          </div>

          {/* Baris ikon platform bulat ala Plann: satu ketukan = satu
              jejaring, warna aslinya jadi penanda aktif/nonaktif. Jam dan
              tanggal ada di sebelahnya supaya "kapan" dan "ke mana" dilihat
              sekali pandang, sebelum mulai menulis caption. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="platform-ikon-baris">
              {PLATFORMS.map((p) => {
                const aktif = platformTerpilih.includes(p.key)
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePlatform(p.key)}
                    className={`platform-ikon-btn${aktif ? ' aktif' : ''}`}
                    style={{ '--platform-warna': p.color, '--platform-latar': p.bg }}
                    aria-pressed={aktif}
                    title={p.label}
                  >
                    <Icon name={p.icon} size={18} />
                    {aktif && (
                      <span className="platform-ikon-centang">
                        <Icon name="checkmark" size={9} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <input
                aria-label="Tanggal tayang"
                className="input"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                style={{ width: 138 }}
              />
              <input
                aria-label="Jam tayang"
                className="input"
                type="time"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                style={{ width: 100 }}
              />
            </div>
          </div>

          {/* Caption jadi elemen utama layar, bukan salah satu kartu di
              antara yang lain — sejalan dengan bagaimana Plann menaruh
              kotak tulis besar tepat di bawah baris ikon platform. */}
          <textarea
            id="cmp-caption"
            className="textarea compose-caption-utama"
            rows={9}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={`Halo, tulis captionnya di sini${judul ? ` untuk "${judul}"` : ''}...`}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon name="pricetag-outline" size={12} color="var(--text-muted)" />
              <Penghitung nilai={jumlahHashtag} batas={BATAS_HASHTAG} label="Jumlah hashtag" />
            </span>
            <Penghitung nilai={caption.length} batas={BATAS_CAPTION} label="Jumlah karakter" />

            {setHashtag.length > 0 && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPilihHashtag(true)}>
                <Icon name="pricetags-outline" size={13} /> Sisipkan hashtag
              </button>
            )}
          </div>

          {jumlahHashtag > BATAS_HASHTAG && (
            <p className="alert alert-error" style={{ marginBottom: 12 }}>
              Instagram hanya membaca 30 hashtag pertama. Sisanya diabaikan tanpa peringatan apa pun.
            </p>
          )}
          {caption.length > BATAS_CAPTION && (
            <p className="alert alert-error" style={{ marginBottom: 12 }}>
              Caption Instagram terpotong di 2.200 karakter.
            </p>
          )}

          {/* Detail yang tidak setiap kali diisi disatukan di satu kartu
              ringkas paling bawah, bukan tiga kartu terpisah — jelas ada di
              sana kalau dibutuhkan, tidak merebut perhatian kalau tidak. */}
          <div className="card">
            <label className="field-label" htmlFor="cmp-judul">Judul</label>
            <input
              id="cmp-judul"
              className="input"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul singkat yang menjelaskan isinya"
              style={{ marginBottom: 12 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="cmp-pillar">Content pillar</label>
                <select id="cmp-pillar" className="select" value={pillarId}
                  onChange={(e) => setPillarId(e.target.value)}>
                  <option value="">Belum dipilih</option>
                  {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="cmp-aset">Tautan aset</label>
                <input
                  id="cmp-aset"
                  className="input"
                  type="url"
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  placeholder="Canva / Drive / Dropbox"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Kanan: pratinjau ---------- */}
        <div className="compose-pratinjau">
          <div className="telepon">
            <div className="telepon-kepala">
              <span className="telepon-takik" aria-hidden="true" />
            </div>

            <div className="telepon-isi">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 10px' }}>
                <div
                  style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: getPlatform(platformPratinjau).bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon name={getPlatform(platformPratinjau).icon} size={17}
                    color={getPlatform(platformPratinjau).color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600 }}>
                    Pratinjau {getPlatform(platformPratinjau).label}
                  </p>
                  <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Terbaru di kiri atas
                  </p>
                </div>
              </div>

              <div className="ig-grid" style={{ padding: '0 2px 2px' }}>
                {feedDenganDraf.slice(0, 12).map((item) => {
                  const p = pillarById[item.pillar_id]
                  const warna = p?.color ?? 'var(--border-strong)'
                  return (
                    <div
                      key={item.id}
                      className="ig-sel"
                      style={{
                        background: `color-mix(in srgb, ${warna} 16%, #fff)`,
                        borderColor: item.draf ? 'var(--accent)' : 'transparent',
                        borderStyle: item.draf ? 'dashed' : 'solid',
                        cursor: 'default',
                      }}
                    >
                      <span className="ig-sel-atas">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: warna, flexShrink: 0 }} />
                        {item.draf && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>BARU</span>
                        )}
                      </span>
                      <span className="ig-sel-judul">{item.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
            Kotak bergaris putus-putus adalah konten yang sedang kamu susun.
            Warnanya mengikuti content pillar.
          </p>
        </div>
      </div>

      {pilihHashtag && (
        <Sheet
          open
          onClose={() => setPilihHashtag(false)}
          title="Sisipkan set hashtag"
          description="Ditempel di akhir caption."
          lebar={420}
        >
          <div className="sheet-daftar">
            {setHashtag.map((s) => (
              <button key={s.id} type="button" className="sheet-baris" onClick={() => sisipkanHashtag(s)}>
                <span className="sheet-baris-ikon">
                  <Icon name="pricetags-outline" size={17} />
                </span>
                <span className="sheet-baris-label">
                  {s.name}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                    {hitungHashtag(s.tags)} hashtag
                  </span>
                </span>
                <Icon name="add-outline" size={16} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </AppShell>
  )
}
