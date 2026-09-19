import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import TeleponMockup from '../components/TeleponMockup'
import PratinjauInstagram from '../components/PratinjauInstagram'
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
  const { tenantId, tenant } = useTenantContext()

  // Dipakai saat datang dari klik "ide konten harian" di kalender
  // (BarisAgenda.jsx): ?ide=teks nya&tanggal=YYYY-MM-DD. Dibaca sekali saja
  // saat halaman terbuka, bukan disinkron terus-menerus — begitu orang mulai
  // mengetik sendiri, prefill ini tidak boleh menimpanya lagi.
  const [searchParams] = useSearchParams()
  const ideAwal = searchParams.get('ide')
  const tanggalAwal = searchParams.get('tanggal')
  // Datang dari pop-in "Buat konten" (CreatePostModal.jsx): ?platforms=instagram,tiktok
  const platformAwal = searchParams.get('platforms')

  const [awalMinggu, setAwalMinggu] = useState(() => startOfWeek(tanggalAwal ? new Date(`${tanggalAwal}T00:00:00`) : undefined))
  const [tanggal, setTanggal] = useState(() => tanggalAwal || todayIso())
  const [jam, setJam] = useState('')
  const [platformTerpilih, setPlatformTerpilih] = useState(() => {
    const dariUrl = platformAwal?.split(',').map((p) => p.trim()).filter(Boolean)
    return dariUrl?.length ? dariUrl : ['instagram']
  })
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
  const [filterPratinjau, setFilterPratinjau] = useState('semua') // semua | idea | terjadwal
  const [adaAkunTerhubung, setAdaAkunTerhubung] = useState(true) // optimistis sampai terbukti kosong, biar kartu ajakan tidak berkedip muncul sesaat
  // Baris social_accounts untuk platform yang sedang dipratinjau. Kalau
  // kolom angkanya sudah terisi (hasil sinkron dari platform), mockup
  // telepon otomatis menampilkan Pengikut/Mengikuti alih-alih angka kita.
  const [akunPlatform, setAkunPlatform] = useState(null)

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

  // Kartu ajakan "sambungkan akun sosial" di mockup telepon cuma tampil
  // kalau memang belum ada satu pun yang ditandai terhubung — begitu
  // ditandai di Pengaturan > Akun sosial, kartu ini hilang sendiri.
  useEffect(() => {
    if (!supabase || !tenantId) return
    let batal = false
    supabase
      .from('social_accounts')
      .select('platform', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'terhubung')
      .then(({ count }) => { if (!batal) setAdaAkunTerhubung((count ?? 0) > 0) })
    return () => { batal = true }
  }, [tenantId])

  // Angka profil platform yang sedang dipratinjau. Selama OAuth belum
  // dipasang, semua kolom angkanya masih null dan mockup tetap memakai
  // metrik kita sendiri — tidak ada angka pengikut yang dikarang.
  useEffect(() => {
    if (!supabase || !tenantId) return
    let batal = false
    supabase
      .from('social_accounts')
      .select('username,media_count,followers_count,follows_count,avatar_url,synced_at')
      .eq('tenant_id', tenantId)
      .eq('platform', platformPratinjau)
      .maybeSingle()
      .then(({ data }) => { if (!batal) setAkunPlatform(data ?? null) })
    return () => { batal = true }
  }, [tenantId, platformPratinjau])

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
  // supaya terlihat bagaimana ia duduk di antara yang lain. Draf yang belum
  // disimpan selalu ikut tampil apa pun filternya — ia belum punya status
  // di database untuk disaring.
  const feedTersaring = filterPratinjau === 'semua'
    ? feed
    : feed.filter((it) => (filterPratinjau === 'idea' ? it.status === 'idea' : it.status !== 'idea'))

  const feedDenganDraf = [
    { id: '__draf__', title: judul || 'Konten baru', pillar_id: pillarId, scheduled_date: tanggal, draf: true },
    ...feedTersaring,
  ]

  // Handle singkat ala Plann, diambil dari nama workspace. Cuma tampilan —
  // tidak tersimpan atau dipakai di tempat lain.
  const handle = '@' + (tenant?.name ?? 'workspace').replace(/\s+/g, '').toUpperCase().slice(0, 16)

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

          {/* Baris ikon platform bulat ala Plann di kiri, pil "Strategi"
              (content pillar) dan jam tayang di kanan — satu baris, semua
              keputusan cepat sebelum mulai menulis. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
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

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
              <input
                aria-label="Jam tayang"
                className="input"
                type="time"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                style={{ width: 96 }}
              />
              <div className="pil-select-bungkus">
                <select
                  id="cmp-pillar"
                  className="pil-select"
                  value={pillarId}
                  onChange={(e) => setPillarId(e.target.value)}
                  aria-label="Content pillar"
                >
                  <option value="">Strategi</option>
                  {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Kanvas dan kotak tulis bersebelahan, seperti di Plann. Kanvasnya
              dibatasi lebarnya lewat CSS — sebelumnya ia dibiarkan selebar
              kolom, dan karena tingginya mengikuti perbandingan sisi, hasilnya
              bidang kosong raksasa yang memenuhi layar. */}
          <div className="compose-editor">
            <div>
              {/* BUKAN unggah gambar sungguhan — cuma menyimpan tautan
                  (Canva/Drive/Dropbox) di kolom asset_url. Kalau tautannya
                  kebetulan gambar langsung (berakhiran .jpg/.png/dst),
                  gambarnya ditampilkan; kalau tidak, jadi kartu tautan. */}
              <div className="compose-kanvas" onClick={() => document.getElementById('cmp-aset')?.focus()}>
                {assetUrl.trim() ? (
                  /\.(jpe?g|png|webp|gif)(\?|$)/i.test(assetUrl) ? (
                    <div className="compose-kanvas-terisi">
                      <img src={assetUrl} alt="" />
                    </div>
                  ) : (
                    <div className="compose-kanvas-tautan">
                      <Icon name="link-outline" size={24} color="var(--accent)" />
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                        {assetUrl.length > 40 ? assetUrl.slice(0, 40) + '…' : assetUrl}
                      </p>
                    </div>
                  )
                ) : (
                  <span className="compose-kanvas-plus">
                    <Icon name="add" size={22} />
                  </span>
                )}
              </div>

              <input
                id="cmp-aset"
                className="input"
                type="url"
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="Tautan Canva / Drive"
                style={{ fontSize: 12 }}
              />
            </div>

            <div>
              <textarea
                id="cmp-caption"
                className="textarea compose-caption-utama"
                rows={6}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Halo, tulis captionnya di sini${judul ? ` untuk "${judul}"` : ''}...`}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
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

              <input
                id="cmp-judul"
                className="input"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Judul singkat (dilihat tim, tidak ikut tayang)"
                style={{ marginTop: 12 }}
              />
            </div>
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
        </div>

        {/* ---------- Kanan: pratinjau di mockup telepon ---------- */}
        <div className="compose-pratinjau">
          <TeleponMockup lebar={290}>
            <PratinjauInstagram
              handle={handle}
              nama={tenant?.name ?? 'Workspace'}
              bio={`Pratinjau ${getPlatform(platformPratinjau).label} · terbaru di kiri atas`}
              logoUrl={tenant?.logo_url}
              warnaAksen={tenant?.brand_color || 'var(--accent)'}
              jumlahKonten={feed.length}
              jumlahTerjadwal={feed.filter((f) => f.status !== 'idea').length}
              jumlahDraf={feed.filter((f) => f.status === 'idea').length}
              akunAsli={akunPlatform}
              filter={filterPratinjau}
              onFilter={setFilterPratinjau}
            >
              <div className="ig-grid">
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
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: warna, flexShrink: 0 }} />
                        {item.draf && (
                          <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--accent)' }}>BARU</span>
                        )}
                      </span>
                      <span className="ig-sel-judul">{item.title}</span>
                    </div>
                  )
                })}
              </div>

              {!adaAkunTerhubung && (
                <div className="ig-cta">
                  <p>Sambungkan akun sosial supaya jadwal ini benar-benar siap tayang.</p>
                  <div className="ig-cta-ikon">
                    {PLATFORMS.map((p) => (
                      <span key={p.key} style={{ background: p.bg, color: p.color }}>
                        <Icon name={p.icon} size={11} />
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => navigate('/settings?tab=sosial')}>
                    Sambungkan akun
                  </button>
                </div>
              )}
            </PratinjauInstagram>
          </TeleponMockup>

          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.6, maxWidth: 290 }}>
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
