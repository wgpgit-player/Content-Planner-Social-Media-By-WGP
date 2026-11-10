import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { unggahMediaPerpustakaan, urlMateri, jenisVideo, JENIS_DITERIMA } from '../lib/materi'
import { useTenantMembers, namaAnggota } from '../lib/useTenantMembers'

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
  const { members } = useTenantMembers()
  const [pillarId, setPillarId] = useState('')
  const [judul, setJudul] = useState(() => ideAwal || '')
  const [wording, setWording] = useState('')
  const [referensi, setReferensi] = useState('')
  const [brief, setBrief] = useState('')
  const [keyMessage, setKeyMessage] = useState('')
  const [objective, setObjective] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [tabPratinjau, setTabPratinjau] = useState('brief') // 'brief' | 'feed'
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

  // Gambar yang diunggah ke kanvas. Disimpan lebih dulu ke penyimpanan
  // (jalur perpustakaan, karena content_item-nya memang belum ada), lalu
  // jalurnya ikut tertulis ke konten saat disimpan.
  const [aset, setAset] = useState(null)       // { path, mime, size, posterPath }
  const [asetUrl, setAsetUrl] = useState(null) // URL bertanda tangan untuk ditampilkan
  const [posterUrl, setPosterUrl] = useState(null) // bingkai diam, hanya untuk video
  const [mengunggah, setMengunggah] = useState(false)
  const [seret, setSeret] = useState(false)
  const inputBerkas = useRef(null)

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

  // Unggah gambar ke kanvas. Memakai jalur perpustakaan (lihat
  // unggahMediaPerpustakaan di lib/materi.js) karena di layar ini kontennya
  // memang belum ada — berkasnya naik dulu, jalurnya menyusul ke konten
  // begitu tombol Buat konten ditekan.
  async function terimaBerkas(file) {
    if (!file) return
    setMengunggah(true)
    setPesan(null)

    const hasil = await unggahMediaPerpustakaan({ file, tenantId })
    if (hasil.error) {
      setMengunggah(false)
      setPesan({ tipe: 'error', teks: hasil.error })
      return
    }

    setAset({ path: hasil.path, mime: hasil.mime, size: hasil.size, posterPath: hasil.posterPath })
    setAsetUrl(await urlMateri(hasil.path))
    setPosterUrl(hasil.posterPath ? await urlMateri(hasil.posterPath) : null)
    setMengunggah(false)

    if (jenisVideo(hasil.mime) && !hasil.posterPath) {
      setPesan({
        tipe: 'info',
        teks: 'Video terunggah, tapi bingkai pratinjaunya gagal diambil — formatnya tidak bisa dibaca peramban ini. Videonya tetap tersimpan dan bisa diputar di halaman brief.',
      })
    }
  }

  function lepasAset() {
    // Berkasnya sengaja tidak dihapus dari penyimpanan: ia sudah jadi bagian
    // perpustakaan media workspace dan mungkin dipakai konten lain.
    setAset(null)
    setAsetUrl(null)
    setPosterUrl(null)
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
      brief: brief.trim() || null,
      key_message: keyMessage.trim() || null,
      objective: objective.trim() || null,
      target_audience: targetAudience.trim() || null,
      production_notes: wording.trim() || null,
      reference_url: referensi.trim() || assetUrl.trim() || null,
      caption: caption.trim() || null,
      assignee_id: assigneeId || null,
      pillar_id: pillarId || null,
      status: 'draft',
      scheduled_date: tanggal || null,
      scheduled_time: jam || null,
      asset_url: assetUrl.trim() || null,
      asset_path: aset?.path ?? null,
      asset_mime: aset?.mime ?? null,
      asset_size: aset?.size ?? null,
      asset_poster_path: aset?.posterPath ?? null,
      created_by: user?.id ?? null,
    }))

    const { data, error } = await supabase.from('content_items').insert(baris).select('id')
    setSibuk(false)

    if (error) {
      setPesan({ tipe: 'error', teks: error.message })
      return
    }

    // Inisialisasi checklist SOP standar untuk item baru
    if (data?.length) {
      try {
        const sopItems = []
        for (const it of data) {
          sopItems.push(
            { content_item_id: it.id, tenant_id: tenantId, label: 'Pelajari brief & riset referensi manajer', position: 1 },
            { content_item_id: it.id, tenant_id: tenantId, label: 'Buat desain visual / edit video & wording', position: 2 },
            { content_item_id: it.id, tenant_id: tenantId, label: 'Tulis draf caption, CTA, & hashtag', position: 3 },
            { content_item_id: it.id, tenant_id: tenantId, label: 'Quality check mandiri (cek typo & estetika)', position: 4 },
            { content_item_id: it.id, tenant_id: tenantId, label: 'Ajukan review ke Manajer Sosmed', position: 5 }
          )
        }
        await supabase.from('checklist_items').insert(sopItems)
      } catch (e) {
        // Abaikan jika tabel checklist tidak ada
      }
    }

    // Satu platform: langsung ke Lembar Kerja Tugas (/worksheet) agar tim/manajer bisa melihat hasil briefnya
    if (data?.length === 1) {
      navigate(`/worksheet?id=${data[0].id}`)
      return
    }

    setJudul(''); setWording(''); setReferensi(''); setBrief(''); setCaption(''); setAssetUrl(''); lepasAset()
    setPesan({ tipe: 'sukses', teks: `${data.length} brief konten dibuat dan dimandatkan ke tim.` })
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
    {
      id: '__draf__',
      title: judul || 'Konten baru',
      pillar_id: pillarId,
      scheduled_date: tanggal,
      draf: true,
      // Berkas yang baru diunggah langsung ikut terlihat di grid, supaya
      // penilaian "cocok tidak dengan yang lain" bisa dilakukan sekarang,
      // bukan setelah kontennya tersimpan. Untuk video yang dipakai bingkai
      // diamnya — memuat video di dalam sel grid tidak ada gunanya.
      gambar: jenisVideo(aset?.mime) ? posterUrl : asetUrl,
      video: jenisVideo(aset?.mime),
    },
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
        <div className="compose-workspace">
          {/* Strip tanggal satu minggu — tanpa bungkus kartu, supaya jadi
              bagian dari alur, bukan formulir terpisah. Ketuk panah untuk
              pindah minggu, ketuk tanggal untuk memilihnya. */}
          <div className="compose-dates">
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
          <div className="compose-format"><span className="compose-format-active">Postingan</span><span className="compose-format-note">Media, caption & jadwal</span></div>
          <div className="compose-controls">
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

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                aria-label="PIC Penanggung Jawab"
                className="select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                style={{ fontSize: 12, padding: '4px 8px', width: 'auto' }}
              >
                <option value="">Pilih PIC Tim...</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {namaAnggota(m)}
                  </option>
                ))}
              </select>

              <input
                aria-label="Jam tayang"
                className="input"
                type="time"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                style={{ width: 92, fontSize: 12, padding: '4px 6px' }}
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

          {/* 1. Judul Konten & Topik Jobdesk (Paling Utama) */}
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <label className="field-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Judul Konten / Topik Jobdesk <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="cmp-judul"
              className="input"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder={
                platformTerpilih.includes('article')
                  ? 'Contoh: ZISWAF CTARSA Salurkan Bantuan Air Bersih di Sukabumi'
                  : 'Contoh: Reels: 3 Tips Sedekah Subuh Berkah'
              }
              style={{ fontSize: 15, fontWeight: 700, padding: '10px 14px', borderColor: 'var(--accent)' }}
            />
          </div>

          {/* 2. Wording di Dalam Konten (Teks Visual & Script Video) */}
          <div style={{ background: '#faf8fe', border: '1.5px solid #e5daf5', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5935d5', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="document-text-outline" size={14} color="#5935d5" />
                Wording di Dalam Konten (Teks Visual / Slide / Storyboard)
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ fontSize: 10.5, padding: '2px 7px', background: '#fff', color: '#5935d5', border: '1px solid #d5c3f0', cursor: 'pointer' }}
                  onClick={() =>
                    setWording(
                      `[Slide 1 - Hook]: 3 Rahasia yang Jarang Diketahui Tentang...\n[Slide 2 - Masalah]: Sering merasa bingung saat ingin mulai...?\n[Slide 3 - Insight]: Padahal kuncinya ada pada konsistensi langkah kecil.\n[Slide 4 - Cara Praktis]: 1. Tentukan niat, 2. Eksekusi rutin, 3. Evaluasi.\n[Slide 5 - CTA]: Simpan postingan ini & klik link di bio untuk panduan lengkapnya!`
                    )
                  }
                >
                  + Format 5 Slide
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ fontSize: 10.5, padding: '2px 7px', background: '#fff', color: '#5935d5', border: '1px solid #d5c3f0', cursor: 'pointer' }}
                  onClick={() =>
                    setWording(
                      `[00:00 - 00:03 Hook]: "Jangan lewatkan waktu subuh tanpa 1 amalan ini..."\n[00:03 - 00:20 Pembahasan]: Tunjukkan cuplikan relawan membagikan santunan langsung ke pelosok.\n[00:20 - 00:30 CTA]: "Salurkan sedekah subuhmu lewat ZISWAF CTARSA. Klik link di bio!"`
                    )
                  }
                >
                  + Video Script
                </button>
              </div>
            </div>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Tulis teks wording yang WAJIB dicantumkan desainer pada visual atau script yang dibacakan di video..."
              value={wording}
              onChange={(e) => setWording(e.target.value)}
              style={{ fontSize: 12.5, lineHeight: 1.5, background: '#fff' }}
            />
          </div>

          {/* 3. Tautan Referensi & Mandat Manajer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label className="field-label" style={{ fontSize: 11.5, margin: '0 0 4px 0' }}>
                <Icon name="link-outline" size={12} style={{ marginRight: 3 }} />
                Tautan Referensi Konten (Link Acuan)
              </label>
              <input
                className="input"
                type="url"
                placeholder="https://instagram.com/reel/... atau Canva / Drive"
                value={referensi}
                onChange={(e) => setReferensi(e.target.value)}
                style={{ fontSize: 12 }}
              />
            </div>
            <div>
              <label className="field-label" style={{ fontSize: 11.5, margin: '0 0 4px 0' }}>
                <Icon name="clipboard-outline" size={12} style={{ marginRight: 3 }} />
                Mandat & Arahan Pokok Manajer
              </label>
              <input
                className="input"
                placeholder="Contoh: Fokus pada hook emosional & tone ceria"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          {/* 4. Pesan Utama (Key Message) & Target Sasaran */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label className="field-label" style={{ fontSize: 11.5, margin: '0 0 4px 0' }}>
                <Icon name="key-outline" size={12} style={{ marginRight: 3 }} />
                Pesan Utama (Key Message)
              </label>
              <input
                className="input"
                placeholder="Poin yang harus tertanam di audiens"
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
                style={{ fontSize: 12 }}
              />
            </div>
            <div>
              <label className="field-label" style={{ fontSize: 11.5, margin: '0 0 4px 0' }}>
                Tujuan Konten (Objective)
              </label>
              <input
                className="input"
                placeholder="Contoh: Edukasi, Donasi"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                style={{ fontSize: 12 }}
              />
            </div>
            <div>
              <label className="field-label" style={{ fontSize: 11.5, margin: '0 0 4px 0' }}>
                Target Audiens
              </label>
              <input
                className="input"
                placeholder="Contoh: Donatur muda"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          {/* Kanvas Media & Draf Caption */}
          <div className="compose-editor">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <label className="field-label" style={{ margin: 0, fontSize: 11.5 }}>
                  Unggah Media Jadi (Opsional — Dikerjakan Desainer)
                </label>
              </div>

              {/* Kanvas: unggah gambar sungguhan, bisa diseret-lepas */}
              <div
                className={`compose-kanvas${seret ? ' seret' : ''}`}
                onClick={() => !aset && inputBerkas.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setSeret(true) }}
                onDragLeave={() => setSeret(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setSeret(false)
                  terimaBerkas(e.dataTransfer.files?.[0])
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !aset) { e.preventDefault(); inputBerkas.current?.click() } }}
                title={aset ? 'Gambar konten' : 'Ketuk atau seret gambar ke sini'}
              >
                {asetUrl ? (
                  <div className="compose-kanvas-terisi">
                    {jenisVideo(aset?.mime) ? (
                      <video src={asetUrl} poster={posterUrl ?? undefined} controls playsInline />
                    ) : (
                      <img src={asetUrl} alt="Gambar konten" />
                    )}
                    <button
                      type="button"
                      className="compose-kanvas-ganti"
                      onClick={(e) => { e.stopPropagation(); lepasAset() }}
                      aria-label="Lepas berkas"
                    >
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                ) : mengunggah ? (
                  <div className="compose-kanvas-tautan">
                    <Icon name="reload-outline" size={24} className="spin" color="var(--accent)" />
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mengunggah...</p>
                  </div>
                ) : (
                  <div className="compose-kanvas-tautan">
                    <span className="compose-kanvas-plus">
                      <Icon name="add" size={22} />
                    </span>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Foto/video materi (opsional)
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={inputBerkas}
                type="file"
                accept={JENIS_DITERIMA}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  terimaBerkas(f)
                }}
              />

              <input
                aria-label="Tautan materi Canva atau Drive"
                id="cmp-aset"
                className="input"
                type="url"
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="Tautan Canva / Drive (opsional)"
                style={{ fontSize: 12, marginTop: 6 }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <label className="field-label" style={{ margin: 0, fontSize: 11.5 }}>
                  Draf Caption & Ajakan Bertindak
                </label>
              </div>
              <textarea
                aria-label="Caption konten"
                id="cmp-caption"
                className="textarea compose-caption-utama"
                rows={6}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={
                  platformTerpilih.includes('article')
                    ? 'Tulis naskah siaran pers / artikel berita (Headline, Dateline, Pembuka 5W+1H, Kutipan Narasumber, Boilerplate CTARSA)...'
                    : `Halo, tulis captionnya di sini${judul ? ` untuk "${judul}"` : ''}...`
                }
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
          <p className="compose-preview-label">
            Pratinjau {asetUrl ? 'Feed & Visual' : 'Mandat Brief Tim'} <span>Perubahan terlihat langsung</span>
          </p>
          <TeleponMockup lebar={390}>
            {platformPratinjau === 'article' ? (
              <div style={{ background: '#fff', minHeight: 480, padding: 18, display: 'flex', flexDirection: 'column' }}>
                {/* Header Portal Web Berita CTARSA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: '#0284c7', color: '#fff', display: 'grid', placeItems: 'center' }}>
                      <Icon name="newspaper-outline" size={15} />
                    </div>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 750, color: '#0284c7', display: 'block', lineHeight: 1 }}>ZISWAF CTARSA</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Portal Kabar Kebaikan</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 9.5, background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>
                    SIARAN PERS
                  </span>
                </div>

                {/* Foto / Dokumentasi Utama */}
                <div style={{ width: '100%', height: 145, borderRadius: 10, background: 'var(--surface-1, #f1f5f9)', overflow: 'hidden', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
                  {asetUrl ? (
                    <img src={asetUrl} alt="Foto rilis pers" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 10 }}>
                      <Icon name="image-outline" size={28} />
                      <p style={{ fontSize: 10.5, margin: '4px 0 0' }}>Belum ada foto dokumentasi rilis</p>
                    </div>
                  )}
                </div>

                {/* Tanggal & Dateline */}
                <span style={{ fontSize: 9.5, fontWeight: 700, color: '#0284c7', letterSpacing: 0.5, marginBottom: 4 }}>
                  {tanggal ? `${tanggal} · JAKARTA` : 'DRAFT RILIS PERS'}
                </span>

                {/* Judul Headline */}
                <h3 style={{ fontSize: 14, fontWeight: 750, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.35 }}>
                  {judul || 'Judul Siaran Pers / Berita Baru'}
                </h3>

                {/* Isi Naskah Berita */}
                <div style={{ flex: 1, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto', background: 'var(--surface-1, #f9fafb)', padding: '8px 10px', borderRadius: 8 }}>
                  {caption || wording || 'Naskah rilis pers atau artikel berita akan muncul di sini secara real-time saat kamu menulis di sisi kiri...'}
                </div>

                {/* Footer Web CTARSA */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>ctarsa.or.id/berita</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#0284c7' }}>Siap Publikasi ✓</span>
                </div>
              </div>
            ) : !asetUrl ? (
              /* Pratinjau Mandat Brief Tim (Saat gambar belum diunggah) */
              <div style={{ background: '#fff', minHeight: 480, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Header Brief */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="chip" style={{ background: getPlatform(platformPratinjau).bg, color: getPlatform(platformPratinjau).color, fontWeight: 700, margin: 0 }}>
                      <Icon name={getPlatform(platformPratinjau).icon} size={14} /> {getPlatform(platformPratinjau).label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {tanggal ? `${tanggal} ${jam ? `· ${jam} WIB` : ''}` : 'Target Tayang'}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#5935d5', background: '#f1eaff', padding: '3px 8px', borderRadius: 99 }}>
                    MANDAT BRIEF
                  </span>
                </div>

                {/* Topik / Judul Brief */}
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Topik / Judul Konten:
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-primary)', margin: '4px 0 0', lineHeight: 1.35 }}>
                    {judul || 'Belum ada judul konten...'}
                  </h3>
                </div>

                {/* PIC Penanggung Jawab */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-1, #f9fafb)', padding: '10px 12px', borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#5935d5', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12 }}>
                    {namaAnggota(members.find((m) => m.user_id === assigneeId)).charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ditugaskan ke: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {namaAnggota(members.find((m) => m.user_id === assigneeId))}
                    </strong>
                  </div>
                </div>

                {/* Wording di Dalam Konten */}
                <div style={{ flex: 1, background: '#faf8fe', border: '1.5px solid #e5daf5', padding: '12px 14px', borderRadius: 10, maxHeight: 180, overflowY: 'auto' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5935d5', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Wording Visual & Script:
                  </span>
                  <p style={{ fontSize: 12, margin: 0, color: '#28213f', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontFamily: 'inherit' }}>
                    {wording || 'Wording teks yang harus muncul di dalam visual akan tampil di sini secara langsung saat kamu mengetik di sisi kiri...'}
                  </p>
                </div>

                {/* Referensi & Mandat */}
                {referensi && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: 8, fontSize: 11.5 }}>
                    <strong style={{ color: '#065f46' }}>Referensi: </strong>
                    <span style={{ color: '#047857', wordBreak: 'break-all' }}>{referensi}</span>
                  </div>
                )}

                {brief && (
                  <div style={{ background: 'var(--surface-1, #f9fafb)', padding: '8px 12px', borderRadius: 8, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    <strong>Arahan Manajer: </strong>{brief}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  💡 Foto & video hasil kerja akan diunggah oleh penanggung jawab di Lembar Kerja.
                </div>
              </div>
            ) : (
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
                        {item.gambar && <img src={item.gambar} alt="" className="ig-sel-gambar" />}

                        <span className="ig-sel-atas">
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: warna, flexShrink: 0 }} />
                          {item.draf && (
                            <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--accent)' }}>BARU</span>
                          )}
                          {/* Penanda video, seperti di grid Instagram asli. */}
                          {item.video && (
                            <span style={{ marginLeft: 'auto', color: item.gambar ? '#fff' : 'var(--text-secondary)' }}>
                              <Icon name="videocam" size={11} />
                            </span>
                          )}
                        </span>
                        {/* Judul disembunyikan kalau sudah ada gambar — di grid
                            Instagram yang terlihat memang gambarnya saja. */}
                        {!item.gambar && <span className="ig-sel-judul">{item.title}</span>}
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
            )}
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
